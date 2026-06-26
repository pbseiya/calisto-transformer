import { describe, it, expect } from 'vitest';
import { fillGaps, DataRow } from '../../lib/gapFill';

describe('fillGaps', () => {
  const startDate = new Date('2026-01-15T07:00:00Z'); // 14:00 Bangkok
  const endDate = new Date('2026-01-15T07:45:00Z');   // 14:45 Bangkok
  const deviceList = ['DA115'];

  it('returns 4 slots (07:00/15/30/45) for 45min range', () => {
    const rawRows: DataRow[] = [];
    const result = fillGaps(rawRows, deviceList, startDate, endDate);
    expect(result.filledRows).toHaveLength(4);
  });

  it('fills missing slots with null values for numeric columns', () => {
    const rawRows: DataRow[] = [
      { device_name: 'DA115', timestamp: '2026-01-15T14:00:00+07:00', h2_mean: 100, sample_count: 60 },
    ];

    const result = fillGaps(rawRows, deviceList, startDate, endDate);

    expect(result.filledRows).toHaveLength(4);
    expect(result.filledRows[0].h2_mean).toBe(100); // original data
    expect(result.filledRows[1].h2_mean).toBeNull(); // gap
    expect(result.filledRows[2].h2_mean).toBeNull(); // gap
    expect(result.filledRows[1].sample_count).toBe(0); // count = 0
  });

  it('keeps rows that match existing timestamps', () => {
    const rawRows: DataRow[] = [
      { device_name: 'DA115', timestamp: '2026-01-15T14:00:00+07:00', h2_mean: 100, h2_stdev: 5 },
      { device_name: 'DA115', timestamp: '2026-01-15T14:15:00+07:00', h2_mean: 105, h2_stdev: 3 },
    ];

    const result = fillGaps(rawRows, deviceList, startDate, endDate);

    expect(result.filledRows[0].h2_mean).toBe(100);
    expect(result.filledRows[1].h2_mean).toBe(105);
    expect(result.filledRows[2].h2_mean).toBeNull();
  });

  it('tracks original vs missing in deviceStats', () => {
    const rawRows: DataRow[] = [
      { device_name: 'DA115', timestamp: '2026-01-15T14:00:00+07:00', h2_mean: 100 },
    ];

    const result = fillGaps(rawRows, deviceList, startDate, endDate);

    expect(result.deviceStats.DA115.original).toBe(1);
    expect(result.deviceStats.DA115.missing).toBe(3);
    expect(result.deviceStats.DA115.total).toBe(4);
  });

  it('handles multiple devices independently', () => {
    const rawRows: DataRow[] = [
      { device_name: 'DA115', timestamp: '2026-01-15T14:00:00+07:00', h2_mean: 100 },
      { device_name: 'DA08', timestamp: '2026-01-15T14:15:00+07:00', h2_mean: 200 },
    ];

    const result = fillGaps(rawRows, ['DA115', 'DA08'], startDate, endDate);

    expect(result.filledRows).toHaveLength(8); // 4 slots × 2 devices
    expect(result.deviceStats.DA115.original).toBe(1);
    expect(result.deviceStats.DA08.original).toBe(1);
  });

  it('returns empty array when devices list is empty', () => {
    const rawRows: DataRow[] = [
      { device_name: 'DA115', timestamp: '2026-01-15T14:00:00+07:00', h2_mean: 100 },
    ];

    const result = fillGaps(rawRows, [], startDate, endDate);
    expect(result.filledRows).toHaveLength(0);
  });

  it('handles custom intervals (5-min)', () => {
    const rawRows: DataRow[] = [
      { device_name: 'DA115', timestamp: '2026-01-15T14:00:00+07:00', h2_mean: 100 },
    ];

    const result = fillGaps(rawRows, deviceList, startDate, endDate, 5 * 60 * 1000);
    
    
    expect(result.filledRows).toHaveLength(10);
    expect(result.deviceStats.DA115.original).toBe(1);
    expect(result.deviceStats.DA115.missing).toBe(9);
  });

  it('sets alarm_count fields to 0 (not null)', () => {
    const rawRows: DataRow[] = [
      { 
        device_name: 'DA115', 
        timestamp: '2026-01-15T14:00:00+07:00', 
        h2_mean: 100,
        h2_alarm_count: 5,
        co_alarm_count: 2,
        wc_alarm_count: 1,
      },
    ];

    const result = fillGaps(rawRows, deviceList, startDate, endDate);

    expect(result.filledRows[1].h2_alarm_count).toBe(0);
    expect(result.filledRows[1].co_alarm_count).toBe(0);
    expect(result.filledRows[1].wc_alarm_count).toBe(0);
  });

  it('rounds start time DOWN to 15-min boundary', () => {
    
    const customStart = new Date('2026-01-15T07:07:00Z');
    const customEnd = new Date('2026-01-15T07:20:00Z');

    const result = fillGaps([], deviceList, customStart, customEnd);
    
    
    expect(result.filledRows[0].timestamp).toContain('14:00:00');
  });
});
