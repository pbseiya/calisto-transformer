import { describe, it, expect } from 'vitest';
import { toBangkokLocal, roundDownTo15Min } from '../../lib/timezone';

describe('toBangkokLocal', () => {
  it('converts UTC midnight to 7AM Bangkok time', () => {
    const result = toBangkokLocal('2024-01-15T00:00:00Z');
    expect(result).toBe('2024-01-15 07:00:00');
  });

  it('converts noon UTC to 7PM Bangkok time', () => {
    const result = toBangkokLocal('2024-06-20T12:00:00Z');
    expect(result).toBe('2024-06-20 19:00:00');
  });

  it('handles end of day UTC (next day in Bangkok)', () => {
    const result = toBangkokLocal('2024-03-10T23:00:00Z');
    expect(result).toBe('2024-03-11 06:00:00');
  });

  it('converts timestamps with milliseconds', () => {
    const result = toBangkokLocal('2024-01-01T10:30:45.123Z');
    expect(result).toBe('2024-01-01 17:30:45');
  });

  it('handles leap year dates', () => {
    const result = toBangkokLocal('2024-02-29T20:00:00Z');
    expect(result).toBe('2024-03-01 03:00:00');
  });
});

describe('roundDownTo15Min', () => {
  it('rounds down to previous 15-minute mark', () => {
    const date = new Date('2024-01-15T10:37:00Z');
    const result = roundDownTo15Min(date);
    expect(result.getUTCMinutes()).toBe(30);
    expect(result.getUTCSeconds()).toBe(0);
  });

  it('stays at exact 15-minute mark', () => {
    const date = new Date('2024-01-15T10:30:00Z');
    const result = roundDownTo15Min(date);
    expect(result.getUTCMinutes()).toBe(30);
  });

  it('rounds down :00 to :00', () => {
    const date = new Date('2024-01-15T10:07:00Z');
    const result = roundDownTo15Min(date);
    expect(result.getUTCMinutes()).toBe(0);
  });

  it('rounds down :59 to :45', () => {
    const date = new Date('2024-01-15T10:59:59Z');
    const result = roundDownTo15Min(date);
    expect(result.getUTCMinutes()).toBe(45);
  });

  it('clears seconds and milliseconds', () => {
    const date = new Date('2024-01-15T10:22:45.789Z');
    const result = roundDownTo15Min(date);
    expect(result.getUTCSeconds()).toBe(0);
    expect(result.getMilliseconds()).toBe(0);
  });
});
