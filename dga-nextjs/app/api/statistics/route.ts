import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const devices = searchParams.get('devices');
    const start = searchParams.get('start');
    const end = searchParams.get('end');

    if (!devices || !start || !end) {
      return NextResponse.json(
        { success: false, message: 'Missing required parameters' },
        { status: 400 }
      );
    }

    const deviceList = devices.split(',').map(d => d.trim());
    const deviceParams = deviceList.map((_, i) => `$${i + 3}`).join(',');

    const query = `
      SELECT
        device_name,
        COUNT(*) as reading_count,
        AVG(h2_mean) as avg_h2,
        MIN(h2_min) as min_h2,
        MAX(h2_max) as max_h2,
        AVG(h2_stdev) as avg_h2_stdev,
        SUM(h2_alarm_count) as total_h2_alarms,
        AVG(co_mean) as avg_co,
        MIN(co_min) as min_co,
        MAX(co_max) as max_co,
        AVG(co_stdev) as avg_co_stdev,
        SUM(co_alarm_count) as total_co_alarms,
        AVG(wc_mean) as avg_wc,
        MIN(wc_min) as min_wc,
        MAX(wc_max) as max_wc,
        AVG(wc_stdev) as avg_wc_stdev,
        SUM(wc_alarm_count) as total_wc_alarms,
        MIN(window_start) as first_reading,
        MAX(window_end) as last_reading
      FROM dga_readings_15min
      WHERE device_name IN (${deviceParams})
        AND window_start >= $1
        AND window_start <= $2
      GROUP BY device_name
      ORDER BY device_name
    `;

    const result = await pool.query(query, [start, end, ...deviceList]);

    return NextResponse.json({
      success: true,
      data: result.rows,
      count: result.rows.length
    });
  } catch (error) {
    console.error('Statistics API error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch statistics' },
      { status: 500 }
    );
  }
}