import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import { buildReadingsNowQuery, buildReadingsNowResponse } from '@/lib/readingsNow';

export async function GET(request: NextRequest) {
  try {
    const devices = request.nextUrl.searchParams.get("devices");
    if (!devices) {
      return NextResponse.json({ success: false, message: "Missing devices parameter" }, { status: 400 });
    }
    const deviceList = devices.split(",").map((d) => d.trim());
    const { sql, params } = buildReadingsNowQuery(deviceList);
    const result = await pool.query(sql, params);
    return NextResponse.json(buildReadingsNowResponse(result.rows));
  } catch (error) {
    console.error("ReadingsNow API error:", error);
    return NextResponse.json({ success: false, message: String(error) }, { status: 500 });
  }
}
