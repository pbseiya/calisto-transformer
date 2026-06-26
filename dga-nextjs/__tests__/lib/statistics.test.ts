import { describe, it, expect } from 'vitest';
import { buildStatisticsQuery, buildStatisticsResponse, StatisticsRow } from '../../lib/statistics';

describe('buildStatisticsQuery', () => {
  it('generates SQL with correct parameters', () => {
    const { sql, queryParams } = buildStatisticsQuery({
      devices: ['DA115'],
      start: '2026-06-18T06:53:00Z',
      end: '2026-06-25T06:53:00Z',
    });

    expect(sql).toContain('FROM dga_readings_15min');
    expect(sql).toContain('WHERE device_name IN ($3)');
    expect(sql).toContain('AND window_start >= $1');
    expect(sql).toContain('AND window_start <= $2');
    expect(sql).toContain('GROUP BY device_name');
    expect(queryParams).toEqual([
      '2026-06-18T06:53:00Z',
      '2026-06-25T06:53:00Z',
      'DA115',
    ]);
  });

  it('generates SQL with multiple devices', () => {
    const { sql, queryParams } = buildStatisticsQuery({
      devices: ['DA115', 'DA08'],
      start: '2026-06-18T06:53:00Z',
      end: '2026-06-25T06:53:00Z',
    });

    expect(sql).toContain('WHERE device_name IN ($3,$4)');
    expect(queryParams).toEqual([
      '2026-06-18T06:53:00Z',
      '2026-06-25T06:53:00Z',
      'DA115',
      'DA08',
    ]);
  });

  it('includes all aggregate functions', () => {
    const { sql } = buildStatisticsQuery({
      devices: ['DA115'],
      start: '2026-06-18T06:53:00Z',
      end: '2026-06-25T06:53:00Z',
    });

    expect(sql).toContain('AVG(h2_mean) as avg_h2');
    expect(sql).toContain('MIN(h2_min) as min_h2');
    expect(sql).toContain('MAX(h2_max) as max_h2');
    expect(sql).toContain('SUM(h2_alarm_count) as total_h2_alarms');
    expect(sql).toContain('AVG(co_mean) as avg_co');
    expect(sql).toContain('AVG(wc_mean) as avg_wc');
    expect(sql).toContain('MIN(window_start) as first_reading');
    expect(sql).toContain('MAX(window_end) as last_reading');
  });

  it('orders results by device_name', () => {
    const { sql } = buildStatisticsQuery({
      devices: ['DA115'],
      start: '2026-06-18T06:53:00Z',
      end: '2026-06-25T06:53:00Z',
    });

    expect(sql).toContain('ORDER BY device_name');
  });
});

describe('buildStatisticsResponse', () => {
  it('wraps rows with success and count', () => {
    const rows: StatisticsRow[] = [
      {
        device_name: 'DA115',
        reading_count: 100,
        avg_h2: 1221,
        min_h2: 1200,
        max_h2: 1250,
        avg_h2_stdev: 5,
        total_h2_alarms: 50,
        avg_co: 9,
        min_co: 0,
        max_co: 20,
        avg_co_stdev: 2,
        total_co_alarms: 0,
        avg_wc: 9,
        min_wc: 0,
        max_wc: 20,
        avg_wc_stdev: 2,
        total_wc_alarms: 0,
        first_reading: '2026-06-18T14:00:00+07:00',
        last_reading: '2026-06-25T13:45:00+07:00',
      },
    ];

    const result = buildStatisticsResponse(rows);
    expect(result.success).toBe(true);
    expect(result.data).toEqual(rows);
    expect(result.count).toBe(1);
  });

  it('handles empty rows', () => {
    const result = buildStatisticsResponse([]);
    expect(result.success).toBe(true);
    expect(result.data).toEqual([]);
    expect(result.count).toBe(0);
  });

  it('preserves null values in statistics', () => {
    const rows: StatisticsRow[] = [
      {
        device_name: 'DA115',
        reading_count: 0,
        avg_h2: null,
        min_h2: null,
        max_h2: null,
        avg_h2_stdev: null,
        total_h2_alarms: 0,
        avg_co: null,
        min_co: null,
        max_co: null,
        avg_co_stdev: null,
        total_co_alarms: 0,
        avg_wc: null,
        min_wc: null,
        max_wc: null,
        avg_wc_stdev: null,
        total_wc_alarms: 0,
        first_reading: '',
        last_reading: '',
      },
    ];

    const result = buildStatisticsResponse(rows);
    expect(result.data[0].avg_h2).toBeNull();
    expect(result.data[0].total_h2_alarms).toBe(0);
  });
});
