export interface StatisticsRow {
  device_name: string;
  reading_count: number;
  avg_h2: number | null;
  min_h2: number | null;
  max_h2: number | null;
  avg_h2_stdev: number | null;
  total_h2_alarms: number;
  avg_co: number | null;
  min_co: number | null;
  max_co: number | null;
  avg_co_stdev: number | null;
  total_co_alarms: number;
  avg_wc: number | null;
  min_wc: number | null;
  max_wc: number | null;
  avg_wc_stdev: number | null;
  total_wc_alarms: number;
  first_reading: string;
  last_reading: string;
}

export interface StatisticsResult {
  success: boolean;
  data: StatisticsRow[];
  count: number;
}

export interface StatisticsQueryParams {
  devices: string[];
  start: string;
  end: string;
}

export function buildStatisticsQuery(params: StatisticsQueryParams): { sql: string; queryParams: any[] } {
  const { devices, start, end } = params;
  const deviceParams = devices.map((_, i) => `$${i + 3}`).join(',');

  const sql = `
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

  return {
    sql,
    queryParams: [start, end, ...devices],
  };
}

export function buildStatisticsResponse(rows: StatisticsRow[]): StatisticsResult {
  return {
    success: true,
    data: rows,
    count: rows.length,
  };
}
