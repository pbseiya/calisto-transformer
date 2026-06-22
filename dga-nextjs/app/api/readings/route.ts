const buildTimestampColumn = (isSummary: boolean) =>
  `to_char((${isSummary ? 'window_start' : 'timestamp'}) AT TIME ZONE 'Asia/Bangkok', 'YYYY-MM-DD"T"HH24:MI:SS+07:00') as timestamp`;

import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const devices = searchParams.get('devices');
    const start = searchParams.get('start');
    const end = searchParams.get('end');
    const source = searchParams.get('source') || 'raw';

    if (!devices || !start || !end) {
      return NextResponse.json(
        { success: false, message: 'Missing required parameters' },
        { status: 400 }
      );
    }

    const deviceList = devices.split(',').map(d => d.trim());
    const deviceParams = deviceList.map((_, i) => `$${i + 3}`).join(',');
    const isSummary = source !== 'raw';
    const tsCol = buildTimestampColumn(isSummary);

    let query = '';
    const queryParams: any[] = [start, end, ...deviceList];

    if (!isSummary) {
      query = `
        SELECT
          device_name,
          ${tsCol},
          hydrogen as h2,
          carbonmonoxide as co,
          water_content as wc,
          h2_alarm_lv1,
          h2_alarm_lv2,
          co_alarm_lv1,
          co_alarm_lv2,
          wc_alarm_lv1,
          wc_alarm_lv2
        FROM dga_readings
        WHERE device_name IN (${deviceParams})
          AND timestamp >= $1
          AND timestamp <= $2
        ORDER BY timestamp ASC
      `;
    } else {
      query = `
        SELECT
          device_name,
          ${tsCol},
          h2_mean,
          h2_median,
          h2_min,
          h2_max,
          h2_stdev,
          co_mean,
          co_median,
          co_min,
          co_max,
          co_stdev,
          wc_mean,
          wc_median,
          wc_min,
          wc_max,
          wc_stdev,
          h2_alarm_count,
          co_alarm_count,
          wc_alarm_count,
          sample_count
        FROM dga_readings_15min
        WHERE device_name IN (${deviceParams})
          AND window_start >= $1
          AND window_start <= $2
        ORDER BY window_start ASC
      `;
    }

    const result = await pool.query(query, queryParams);

    return NextResponse.json({
      success: true,
      data: result.rows,
      count: result.rows.length,
      source
    });
  } catch (error) {
    console.error('Readings API error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch readings' },
      { status: 500 }
    );
  }
}
