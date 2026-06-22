#!/usr/bin/env python3
import os, sys, logging
from datetime import datetime, timedelta
from dotenv import load_dotenv
import psycopg2

load_dotenv()

DB_HOST = os.getenv('DB_HOST', 'localhost')
DB_PORT = int(os.getenv('DB_PORT', '5432'))
DB_NAME = os.getenv('DB_NAME', 'dga_monitor')
DB_USER = os.getenv('DB_USER', 'postgres')
DB_PASSWORD = os.getenv('DB_PASSWORD', 'postgres')

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[logging.FileHandler('dga_aggregate.log'), logging.StreamHandler()])
logger = logging.getLogger(__name__)

def get_db():
    return psycopg2.connect(host=DB_HOST, port=DB_PORT, dbname=DB_NAME, user=DB_USER, password=DB_PASSWORD)

def aggregate_window(cursor, window_start, window_end):
    cursor.execute('SELECT COUNT(*) FROM dga_readings_15min WHERE window_start = %s', (window_start,))
    if cursor.fetchone()[0] > 0:
        return 0
    cursor.execute("""
    WITH stats AS (
        SELECT device_name, COUNT(*) as sample_count,
            AVG(hydrogen) as h2_mean,
            PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY hydrogen) as h2_median,
            STDDEV(hydrogen) as h2_stdev, VARIANCE(hydrogen) as h2_variance,
            MIN(hydrogen) as h2_min, MAX(hydrogen) as h2_max,
            AVG(carbonmonoxide) as co_mean,
            PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY carbonmonoxide) as co_median,
            STDDEV(carbonmonoxide) as co_stdev, VARIANCE(carbonmonoxide) as co_variance,
            MIN(carbonmonoxide) as co_min, MAX(carbonmonoxide) as co_max,
            AVG(water_content) as wc_mean,
            PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY water_content) as wc_median,
            STDDEV(water_content) as wc_stdev, VARIANCE(water_content) as wc_variance,
            MIN(water_content) as wc_min, MAX(water_content) as wc_max,
            SUM(CASE WHEN h2_alarm_lv1 = 1 OR h2_alarm_lv2 = 1 THEN 1 ELSE 0 END) as h2_alarm_count,
            SUM(CASE WHEN co_alarm_lv1 = 1 OR co_alarm_lv2 = 1 THEN 1 ELSE 0 END) as co_alarm_count,
            SUM(CASE WHEN wc_alarm_lv1 = 1 OR wc_alarm_lv2 = 1 THEN 1 ELSE 0 END) as wc_alarm_count
        FROM dga_readings WHERE timestamp >= %s AND timestamp < %s GROUP BY device_name
    ),
    first_last AS (
        SELECT DISTINCT ON (device_name) device_name,
            FIRST_VALUE(hydrogen) OVER w as h2_first,
            LAST_VALUE(hydrogen) OVER w as h2_last,
            FIRST_VALUE(carbonmonoxide) OVER w as co_first,
            LAST_VALUE(carbonmonoxide) OVER w as co_last,
            FIRST_VALUE(water_content) OVER w as wc_first,
            LAST_VALUE(water_content) OVER w as wc_last
        FROM dga_readings
        WHERE timestamp >= %s AND timestamp < %s
        WINDOW w AS (PARTITION BY device_name ORDER BY timestamp ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING)
    )
    SELECT s.*, f.h2_first, f.h2_last, f.co_first, f.co_last, f.wc_first, f.wc_last
    FROM stats s JOIN first_last f ON s.device_name = f.device_name
    """, (window_start, window_end, window_start, window_end))
    rows = cursor.fetchall()
    for row in rows:
        cursor.execute("""INSERT INTO dga_readings_15min
            (device_name, window_start, window_end, sample_count,
            h2_mean, h2_median, h2_stdev, h2_variance, h2_min, h2_max, h2_first, h2_last,
            co_mean, co_median, co_stdev, co_variance, co_min, co_max, co_first, co_last,
            wc_mean, wc_median, wc_stdev, wc_variance, wc_min, wc_max, wc_first, wc_last,
            h2_alarm_count, co_alarm_count, wc_alarm_count)
            VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)
            ON CONFLICT (device_name, window_start) DO NOTHING""",
            (row[0], window_start, window_end) + row[1:])
    return len(rows)

def aggregate_data():
    now = datetime.now()
    minute = (now.minute // 15) * 15
    window_end = now.replace(minute=minute, second=0, microsecond=0)
    window_start = window_end - timedelta(minutes=15)
    logger.info(f'Aggregating {window_start} to {window_end}')
    conn = get_db()
    cursor = conn.cursor()
    count = aggregate_window(cursor, window_start, window_end)
    conn.commit()
    logger.info(f'Aggregated {count} devices')
    conn.close()

def aggregate_all_historical():
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute('TRUNCATE dga_readings_15min')
    conn.commit()
    cursor.execute('SELECT MIN(timestamp), MAX(timestamp) FROM dga_readings')
    min_ts, max_ts = cursor.fetchone()
    if not min_ts:
        logger.info('No data')
        conn.close()
        return
    logger.info(f'Aggregating from {min_ts} to {max_ts}')
    current = min_ts.replace(second=0, microsecond=0)
    total = 0
    while current < max_ts:
        window_end = current + timedelta(minutes=15)
        count = aggregate_window(cursor, current, window_end)
        total += count
        current = window_end
    conn.commit()
    logger.info(f'Aggregated {total} device-windows')
    conn.close()

def cleanup_old_data():
    conn = get_db()
    cursor = conn.cursor()
    cutoff = datetime.now() - timedelta(days=90)
    cursor.execute('DELETE FROM dga_readings WHERE timestamp < %s', (cutoff,))
    deleted = cursor.rowcount
    conn.commit()
    logger.info(f'Deleted {deleted} records older than {cutoff}')
    conn.close()

if __name__ == '__main__':
    if len(sys.argv) > 1:
        if sys.argv[1] == 'cleanup': cleanup_old_data()
        elif sys.argv[1] == 'historical': aggregate_all_historical()
    else:
        aggregate_data()
