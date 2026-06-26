import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { buildStatisticsQuery, buildStatisticsResponse } from '@/lib/statistics';

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
    const { sql, queryParams } = buildStatisticsQuery({ devices: deviceList, start, end });
    const result = await pool.query(sql, queryParams);
    return NextResponse.json(buildStatisticsResponse(result.rows));
  } catch (error) {
    console.error('Statistics API error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch statistics' },
      { status: 500 }
    );
  }
}