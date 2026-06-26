import { describe, it, expect } from 'vitest';
import { buildReadingsNowQuery, buildReadingsNowResponse, ReadingsNowRow } from '../../lib/readingsNow';

describe('buildReadingsNowQuery', () => {
  it('generates SQL with single device', () => {
    const { sql, params } = buildReadingsNowQuery(['DA115']);
    expect(sql).toContain('DISTINCT ON (device_name)');
    expect(sql).toContain('WHERE device_name IN ($1)');
    expect(sql).toContain('ORDER BY device_name, timestamp DESC');
    expect(params).toEqual(['DA115']);
  });

  it('generates SQL with multiple devices', () => {
    const { sql, params } = buildReadingsNowQuery(['DA115', 'DA08', '11BAT01']);
    expect(sql).toContain('WHERE device_name IN ($1,$2,$3)');
    expect(params).toEqual(['DA115', 'DA08', '11BAT01']);
  });

  it('includes Bangkok timezone conversion', () => {
    const { sql } = buildReadingsNowQuery(['DA115']);
    expect(sql).toContain("AT TIME ZONE 'Asia/Bangkok'");
    expect(sql).toContain('YYYY-MM-DD"T"HH24:MI:SS+07:00');
  });

  it('selects correct columns', () => {
    const { sql } = buildReadingsNowQuery(['DA115']);
    expect(sql).toContain('hydrogen as h2');
    expect(sql).toContain('carbonmonoxide as co');
    expect(sql).toContain('water_content as wc');
  });

  it('handles empty device list', () => {
    const { sql, params } = buildReadingsNowQuery([]);
    expect(sql).toContain('WHERE device_name IN ()');
    expect(params).toEqual([]);
  });
});

describe('buildReadingsNowResponse', () => {
  it('wraps rows with success and count', () => {
    const rows: ReadingsNowRow[] = [
      { device_name: 'DA115', timestamp: '2026-06-25T14:00:00+07:00', h2: 1221, co: 9, wc: 9 },
      { device_name: 'DA08', timestamp: '2026-06-25T14:00:00+07:00', h2: 1000, co: 1620, wc: 13 },
    ];

    const result = buildReadingsNowResponse(rows);
    expect(result.success).toBe(true);
    expect(result.data).toEqual(rows);
    expect(result.count).toBe(2);
  });

  it('handles empty rows', () => {
    const result = buildReadingsNowResponse([]);
    expect(result.success).toBe(true);
    expect(result.data).toEqual([]);
    expect(result.count).toBe(0);
  });

  it('preserves null values in data', () => {
    const rows: ReadingsNowRow[] = [
      { device_name: 'DA115', timestamp: '2026-06-25T14:00:00+07:00', h2: null, co: null, wc: null },
    ];

    const result = buildReadingsNowResponse(rows);
    expect(result.data[0].h2).toBeNull();
    expect(result.data[0].co).toBeNull();
    expect(result.data[0].wc).toBeNull();
  });
});
