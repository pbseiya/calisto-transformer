import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const devices = request.nextUrl.searchParams.get("devices");
    if (!devices) {
      return NextResponse.json({ success: false, message: "Missing devices parameter" }, { status: 400 });
    }
    const deviceList = devices.split(",").map((d) => d.trim());
    const deviceParams = deviceList.map((_, i) => "$" + (i + 1)).join(",");

    const sql = `
      SELECT DISTINCT ON (device_name)
        device_name,
        to_char(timestamp AT TIME ZONE 'Asia/Bangkok', 'YYYY-MM-DD"T"HH24:MI:SS+07:00') as timestamp,
        hydrogen as h2,
        carbonmonoxide as co,
        water_content as wc
      FROM dga_readings
      WHERE device_name IN (${deviceParams})
      ORDER BY device_name, timestamp DESC
    `;

    const result = await pool.query(sql, deviceList);

    return NextResponse.json({
      success: true,
      data: result.rows,
      count: result.rows.length,
    });
  } catch (error) {
    console.error("ReadingsLatest API error:", error);
    return NextResponse.json({ success: false, message: String(error) }, { status: 500 });
  }
}
