import { toBangkokLocal } from './timezone';

export interface DataRow {
  device_name: string;
  timestamp: string;
  [key: string]: any;
}

export interface GapFillResult {
  filledRows: DataRow[];
  deviceStats: Record<string, { original: number; missing: number; total: number }>;
}

/**
 * Fills missing time slots with null values
 * @param rawRows - Raw data rows from database
 * @param deviceList - List of device names
 * @param startDate - Start time (UTC)
 * @param endDate - End time (UTC)
 * @param intervalMs - Interval in ms (default: 15 min)
 */
export function fillGaps(
  rawRows: DataRow[],
  deviceList: string[],
  startDate: Date,
  endDate: Date,
  intervalMs: number = 15 * 60 * 1000
): GapFillResult {
  const pad2 = (n: number) => n.toString().padStart(2, '0');
  const fmt = (d: Date): string => 
    `${d.getUTCFullYear()}-${pad2(d.getUTCMonth() + 1)}-${pad2(d.getUTCDate())}T${pad2(d.getUTCHours())}:${pad2(d.getUTCMinutes())}:${pad2(d.getUTCSeconds())}+07:00`;


  const startBangkok = new Date(startDate.getTime() + 7 * 60 * 60 * 1000);
  const startMinutes = Math.floor(startBangkok.getUTCMinutes() / (intervalMs / 60000)) * (intervalMs / 60000);
  startBangkok.setUTCMinutes(startMinutes, 0, 0);

  const endBangkok = new Date(endDate.getTime() + 7 * 60 * 60 * 1000);
  const slotCount = Math.round((endBangkok.getTime() - startBangkok.getTime()) / intervalMs);

  const filledRows: DataRow[] = [];
  const deviceStats: Record<string, { original: number; missing: number; total: number }> = {};

  const valueKeys = rawRows.length > 0
    ? Object.keys(rawRows[0]).filter(k => k !== 'device_name' && k !== 'timestamp')
    : [];

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

  return { filledRows, deviceStats };
}
