import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { toBangkokLocal } from '@/lib/timezone';

const tsColumn = (summary: boolean) =>
  summary
    ? "to_char(window_start AT TIME ZONE 'Asia/Bangkok', 'YYYY-MM-DD\"T\"HH24:MI:SS+07:00') as timestamp"
    : "to_char(timestamp AT TIME ZONE 'Asia/Bangkok', 'YYYY-MM-DD\"T\"HH24:MI:SS+07:00') as timestamp";

function pad(n: number) {
  return n.toString().padStart(2, '0');
}

function fmt(bangkokTime: Date) {
  return `${bangkokTime.getUTCFullYear()}-${pad(bangkokTime.getUTCMonth() + 1)}-${pad(bangkokTime.getUTCDate())}T${pad(bangkokTime.getUTCHours())}:${pad(bangkokTime.getUTCMinutes())}:${pad(bangkokTime.getUTCSeconds())}+07:00`;
}

function toBangkok(utc: Date) {
  return new Date(utc.getTime() + 7 * 60 * 60 * 1000);
}

interface DataRow {
  device_name: string;
  timestamp: string;
  [key: string]: any;
}

export async function GET(request: NextRequest) {
  try {
    const devices = request.nextUrl.searchParams.get('devices');
    const start = request.nextUrl.searchParams.get('start');
    const end = request.nextUrl.searchParams.get('end');
    const source = request.nextUrl.searchParams.get('source') || 'summary';

    if (!devices || !start || !end) {
      return NextResponse.json({ success: false, message: 'Missing parameters' }, { status: 400 });
    }

    const deviceList = devices.split(',').map(d => d.trim());
    const deviceParams = deviceList.map((_, i) => `$${i + 3}`).join(',');
    const isSummary = source === 'summary';
    const intervalMs = isSummary ? 15 * 60 * 1000 : 15 * 1000;

    const startDate = new Date(start);
    const endDate = new Date(end);
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return NextResponse.json({ success: false, message: 'Invalid dates' }, { status: 400 });
    }
    /* Convert ISO timestamps to Bangkok local time strings */
    /* DB stores timestamp without time zone in Bangkok local time */
    /* pg driver interprets ISO strings with Z as UTC, causing mismatch */
    const startLocal = toBangkokLocal(start);
    const endLocal = toBangkokLocal(end);
    const queryParams: any[] = [startLocal, endLocal, ...deviceList];
    const col = tsColumn(isSummary);

    const sql = isSummary
      ? `SELECT device_name, ${col},
          h2_mean, h2_median, h2_min, h2_max, h2_stdev,
          co_mean, co_median, co_min, co_max, co_stdev,
          wc_mean, wc_median, wc_min, wc_max, wc_stdev,
          h2_alarm_count, co_alarm_count, wc_alarm_count, sample_count
         FROM dga_readings_15min
         WHERE device_name IN (${deviceParams})
           AND window_start >= $1 AND window_start <= $2
         ORDER BY device_name, window_start ASC`
      : `SELECT device_name, ${col},
          hydrogen as h2, carbonmonoxide as co, water_content as wc,
          h2_alarm_lv1, h2_alarm_lv2, co_alarm_lv1, co_alarm_lv2,
          wc_alarm_lv1, wc_alarm_lv2
         FROM dga_readings
         WHERE device_name IN (${deviceParams})
           AND timestamp >= $1 AND timestamp <= $2
         ORDER BY device_name, timestamp ASC`;

    const result = await pool.query(sql, queryParams);
    const rawRows: DataRow[] = result.rows;

    if (!isSummary) {
      return NextResponse.json({ success: true, data: rawRows, count: rawRows.length, source });
    }

    const valueKeys = rawRows.length > 0
      ? Object.keys(rawRows[0]).filter(k => k !== 'device_name' && k !== 'timestamp')
      : [];

    const startBangkok = toBangkok(startDate);
    /* Round DOWN to nearest 15-minute boundary to align with DB 15-min windows */
    startBangkok.setUTCMinutes(Math.floor(startBangkok.getUTCMinutes() / 15) * 15, 0, 0);
    const endBangkok = toBangkok(endDate);
    const slotCount = Math.round((endBangkok.getTime() - startBangkok.getTime()) / intervalMs);

    const filledRows: DataRow[] = [];
    const deviceStats: any = {};

    for (const dev of deviceList) {
      const devRows = rawRows.filter(r => r.device_name === dev);
      const byTs = new Map<string, DataRow>();
      for (const r of devRows) {
        byTs.set(r.timestamp, r);
      }

      let original = 0;
      let missing = 0;

      for (let i = 0; i <= slotCount; i++) {
        const slotBangkok = new Date(startBangkok.getTime() + i * intervalMs);
        const slotTs = fmt(slotBangkok);

        const existing = byTs.get(slotTs);
        if (existing) {
          filledRows.push(existing);
          original++;
        } else {
          const empty: DataRow = { device_name: dev, timestamp: slotTs };
          for (const k of valueKeys) {
            if (k.endsWith('_mean') || k.endsWith('_median') ||
                k.endsWith('_min') || k.endsWith('_max') || k.endsWith('_stdev')) {
              empty[k] = null;
            } else if (/count/.test(k)) {
              empty[k] = 0;
            } else {
              empty[k] = null;
            }
          }
          filledRows.push(empty);
          missing++;
        }
      }

      deviceStats[dev] = { original, missing, total: original + missing };
    }

    return NextResponse.json({
      success: true,
      data: filledRows,
      count: filledRows.length,
      source,
      metadata: {
        raw_records: rawRows.length,
        filled_slots: filledRows.length,
        slot_count: slotCount + 1,
        interval_ms: intervalMs,
        devices: deviceStats
      }
    });
  } catch (error) {
    console.error('Readings API error:', error);
    return NextResponse.json({ success: false, message: String(error) }, { status: 500 });
  }
}
