#!/usr/bin/env python3
"""
DGA Data Summary - Quick view of collected data
"""
import os
import psycopg2
from dotenv import load_dotenv
from datetime import datetime, timedelta

load_dotenv()

DB_HOST = os.getenv("DB_HOST", "localhost")
DB_PORT = int(os.getenv("DB_PORT", "5432"))
DB_NAME = os.getenv("DB_NAME", "dga_monitor")
DB_USER = os.getenv("DB_USER", "postgres")
DB_PASSWORD = os.getenv("DB_PASSWORD", "your_db_password")


def connect():
    return psycopg2.connect(
        host=DB_HOST, port=DB_PORT,
        dbname=DB_NAME, user=DB_USER, password=DB_PASSWORD
    )


def latest_readings():
    """Show latest readings for all devices"""
    conn = connect()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM latest_readings ORDER BY device_name")
    
    print("\n" + "=" * 80)
    print("LATEST DGA READINGS")
    print("=" * 80)
    print(f"{'Device':<10} {'Timestamp':<20} {'H2 (ppm)':<10} {'CO (ppm)':<10} {'WC (ppm)':<10} {'Alarms'}")
    print("-" * 80)
    
    for row in cursor.fetchall():
        device = row[0]
        ts = row[1].strftime('%Y-%m-%d %H:%M:%S')
        h2 = row[2] if row[2] is not None else 0
        co = row[3] if row[3] is not None else 0
        wc = row[4] if row[4] is not None else 0
        
        alarms = []
        if row[5] == 1: alarms.append("H2-Lv1")
        if row[6] == 1: alarms.append("H2-Lv2")
        if row[7] == 1: alarms.append("CO-Lv1")
        if row[8] == 1: alarms.append("CO-Lv2")
        if row[9] == 1: alarms.append("WC-Lv1")
        if row[10] == 1: alarms.append("WC-Lv2")
        
        alarm_str = ", ".join(alarms) if alarms else "None"
        
        # Color code H2
        h2_status = "🔴" if h2 > 500 else "⚠️" if h2 > 100 else "✅"
        
        print(f"{device:<10} {ts:<20} {h2_status} {h2:<8} {co:<10} {wc:<10} {alarm_str}")
    
    print("=" * 80)
    cursor.close()
    conn.close()


def daily_summary(days=1):
    """Show daily summary"""
    conn = connect()
    cursor = conn.cursor()
    
    cursor.execute("""
        SELECT 
            device_name,
            DATE(timestamp) as date,
            COUNT(*) as samples,
            AVG(hydrogen) as avg_h2,
            MIN(hydrogen) as min_h2,
            MAX(hydrogen) as max_h2,
            AVG(carbonmonoxide) as avg_co,
            AVG(water_content) as avg_wc
        FROM dga_readings
        WHERE timestamp >= NOW() - INTERVAL '%s days'
        GROUP BY device_name, DATE(timestamp)
        ORDER BY date DESC, device_name
    """ % days)
    
    print("\n" + "=" * 90)
    print(f"DAILY SUMMARY (Last {days} day(s))")
    print("=" * 90)
    print(f"{'Device':<10} {'Date':<12} {'Samples':<10} {'Avg H2':<10} {'Min-Max H2':<15} {'Avg CO':<10} {'Avg WC':<10}")
    print("-" * 90)
    
    for row in cursor.fetchall():
        device = row[0]
        date = row[1].strftime('%Y-%m-%d')
        samples = row[2]
        avg_h2 = row[3] if row[3] else 0
        min_h2 = row[4] if row[4] else 0
        max_h2 = row[5] if row[5] else 0
        avg_co = row[6] if row[6] else 0
        avg_wc = row[7] if row[7] else 0
        
        print(f"{device:<10} {date:<12} {samples:<10} {avg_h2:<10.1f} {min_h2:.0f}-{max_h2:.0f}{'':<8} {avg_co:<10.1f} {avg_wc:<10.1f}")
    
    print("=" * 90)
    cursor.close()
    conn.close()


def alarm_history(hours=24):
    """Show alarm events"""
    conn = connect()
    cursor = conn.cursor()
    
    cursor.execute("""
        SELECT device_name, timestamp, hydrogen, carbonmonoxide, water_content,
               h2_alarm_lv1, h2_alarm_lv2, co_alarm_lv1, co_alarm_lv2, wc_alarm_lv1, wc_alarm_lv2
        FROM dga_readings
        WHERE timestamp >= NOW() - INTERVAL '%s hours'
          AND (h2_alarm_lv1 = 1 OR h2_alarm_lv2 = 1 
               OR co_alarm_lv1 = 1 OR co_alarm_lv2 = 1
               OR wc_alarm_lv1 = 1 OR wc_alarm_lv2 = 1)
        ORDER BY timestamp DESC
        LIMIT 50
    """ % hours)
    
    rows = cursor.fetchall()
    
    print("\n" + "=" * 80)
    print(f"ALARM HISTORY (Last {hours} hours)")
    print("=" * 80)
    
    if not rows:
        print("No alarms in this period")
    else:
        print(f"{'Timestamp':<20} {'Device':<10} {'H2':<8} {'CO':<8} {'WC':<8} {'Active Alarms'}")
        print("-" * 80)
        
        for row in rows:
            ts = row[1].strftime('%Y-%m-%d %H:%M:%S')
            device = row[0]
            h2 = row[2] if row[2] else 0
            co = row[3] if row[3] else 0
            wc = row[4] if row[4] else 0
            
            alarms = []
            if row[5] == 1: alarms.append("H2-Lv1")
            if row[6] == 1: alarms.append("H2-Lv2")
            if row[7] == 1: alarms.append("CO-Lv1")
            if row[8] == 1: alarms.append("CO-Lv2")
            if row[9] == 1: alarms.append("WC-Lv1")
            if row[10] == 1: alarms.append("WC-Lv2")
            
            print(f"{ts:<20} {device:<10} {h2:<8} {co:<8} {wc:<8} {', '.join(alarms)}")
    
    print("=" * 80)
    cursor.close()
    conn.close()


if __name__ == "__main__":
    import sys
    
    if len(sys.argv) > 1:
        cmd = sys.argv[1]
        if cmd == "latest":
            latest_readings()
        elif cmd == "daily":
            days = int(sys.argv[2]) if len(sys.argv) > 2 else 1
            daily_summary(days)
        elif cmd == "alarms":
            hours = int(sys.argv[2]) if len(sys.argv) > 2 else 24
            alarm_history(hours)
        else:
            print("Usage: python3 dga_summary.py [latest|daily|alarms] [days/hours]")
    else:
        latest_readings()
        daily_summary(1)
        alarm_history(24)
