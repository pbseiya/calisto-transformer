export interface ReadingsNowRow {
  device_name: string;
  timestamp: string;
  h2: number | null;
  co: number | null;
  wc: number | null;
}

export interface ReadingsNowResult {
  success: boolean;
  data: ReadingsNowRow[];
  count: number;
}

export function buildReadingsNowQuery(devices: string[]): { sql: string; params: string[] } {
  const deviceParams = devices.map((_, i) => '$' + (i + 1)).join(',');
  const tsCol = "to_char(timestamp AT TIME ZONE 'Asia/Bangkok', 'YYYY-MM-DD\"T\"HH24:MI:SS+07:00') as timestamp";

  const sql = `
    SELECT DISTINCT ON (device_name)
      device_name,
      ${tsCol},
      hydrogen as h2,
      carbonmonoxide as co,
      water_content as wc
    FROM dga_readings
    WHERE device_name IN (${deviceParams})
    ORDER BY device_name, timestamp DESC
  `;

  return { sql, params: devices };
}

export function buildReadingsNowResponse(rows: ReadingsNowRow[]): ReadingsNowResult {
  return {
    success: true,
    data: rows,
    count: rows.length,
  };
}
