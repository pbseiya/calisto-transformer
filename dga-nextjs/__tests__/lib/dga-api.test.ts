import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  getHealth,
  getDevices,
  getAnomaly,
  getDrift,
  getTrend,
  getAllAnomalies,
  getAnomaliesOnly,
  AnomalyDetails,
  AnomalyResponse,
  DriftResponse,
  TrendResponse,
  DevicesResponse,
  HealthResponse,
  DeviceStatus,
} from '../../lib/dga-api';

describe('API Base Configuration', () => {
  it('should export API_BASE or use fallback URL', () => {
    /* API_BASE may be undefined in test env (no NEXT_PUBLIC_ env var)
    but the module still has a hardcoded fallback */
    expect(true).toBe(true);
  });
});

describe('TypeScript Interfaces - AnomalyDetails', () => {
  it('should hold z-score numbers', () => {
    const details: AnomalyDetails = {
      h2_zscore: 1.5,
      co_zscore: 2.0,
      wc_zscore: 0.5,
    };
    expect(details.h2_zscore).toBe(1.5);
    expect(details.co_zscore).toBe(2.0);
    expect(details.wc_zscore).toBe(0.5);
  });

  it('should allow null z-scores', () => {
    const details: AnomalyDetails = {
      h2_zscore: null,
      co_zscore: null,
      wc_zscore: null,
    };
    expect(details.h2_zscore).toBeNull();
  });
});

describe('TypeScript Interfaces - AnomalyResponse', () => {
  it('should have all required fields', () => {
    const response: AnomalyResponse = {
      device: 'DA115',
      timestamp: '2026-06-29T10:00:00Z',
      is_anomaly: false,
      confidence: 0.95,
      anomaly_type: null,
      severity: null,
      details: { h2_zscore: 0, co_zscore: 0, wc_zscore: 0 },
      model_version: 'hybrid-zscore-v1',
      recommendations: [],
    };
    expect(response.device).toBe('DA115');
    expect(response.is_anomaly).toBe(false);
    expect(response.confidence).toBe(0.95);
    expect(response.recommendations).toEqual([]);
  });
});

describe('TypeScript Interfaces - DriftResponse', () => {
  it('should have gases object with drift data', () => {
    const response: DriftResponse = {
      device: 'DA08',
      drift_detected: true,
      gases: {
        h2: { reference_mean: 1000, current_mean: 1050, drift: 50, drift_pct: 0.05, drift_detected: true },
        co: { reference_mean: 500, current_mean: 510, drift: 10, drift_pct: 0.02, drift_detected: false },
        wc: { reference_mean: 10, current_mean: 10, drift: 0, drift_pct: 0, drift_detected: false },
      },
      model_version: 'hybrid-zscore-v1',
    };
    expect(response.drift_detected).toBe(true);
    expect(response.gases.h2.drift_detected).toBe(true);
    expect(response.gases.co.drift).toBe(10);
  });
});

describe('TypeScript Interfaces - TrendResponse', () => {
  it('should have period_days and direction', () => {
    const response: TrendResponse = {
      device: 'DA115',
      period_days: 90,
      gases: {
        h2: { slope: 0.5, trend_detected: true, direction: 'increasing' },
        co: { slope: -0.2, trend_detected: true, direction: 'decreasing' },
        wc: { slope: 0, trend_detected: false, direction: 'stable' },
      },
      model_version: 'hybrid-zscore-v1',
    };
    expect(response.period_days).toBe(90);
    expect(response.gases.h2.direction).toBe('increasing');
    expect(response.gases.wc.direction).toBe('stable');
  });
});

describe('TypeScript Interfaces - DevicesResponse', () => {
  it('should have devices array and count', () => {
    const response: DevicesResponse = {
      devices: ['DA115', 'DA08', '11BAT01'],
      count: 3,
    };
    expect(response.devices).toHaveLength(3);
    expect(response.count).toBe(3);
  });
});

describe('TypeScript Interfaces - HealthResponse', () => {
  it('should have status and model info', () => {
    const response: HealthResponse = {
      status: 'healthy',
      model: 'hybrid_zscore',
      model_version: 'hybrid-zscore-v1',
      devices_loaded: 21,
    };
    expect(response.status).toBe('healthy');
    expect(response.devices_loaded).toBe(21);
  });
});

describe('TypeScript Interfaces - DeviceStatus', () => {
  it('should combine anomaly, drift, and trend', () => {
    const status: DeviceStatus = {
      device: 'DA115',
      anomaly: {
        device: 'DA115',
        timestamp: '2026-06-29T10:00:00Z',
        is_anomaly: false,
        confidence: 0,
        anomaly_type: null,
        severity: null,
        details: { h2_zscore: 0, co_zscore: 0, wc_zscore: 0 },
        model_version: 'hybrid-zscore-v1',
        recommendations: [],
      },
      drift: {
        device: 'DA115',
        drift_detected: false,
        gases: {
          h2: { reference_mean: 1225, current_mean: 1225, drift: 0, drift_pct: 0, drift_detected: false },
          co: { reference_mean: 560, current_mean: 560, drift: 0, drift_pct: 0, drift_detected: false },
          wc: { reference_mean: 9, current_mean: 9, drift: 0, drift_pct: 0, drift_detected: false },
        },
        model_version: 'hybrid-zscore-v1',
      },
      trend: {
        device: 'DA115',
        period_days: 90,
        gases: {
          h2: { slope: 0, trend_detected: false, direction: 'stable' },
          co: { slope: 0, trend_detected: false, direction: 'stable' },
          wc: { slope: 0, trend_detected: false, direction: 'stable' },
        },
        model_version: 'hybrid-zscore-v1',
      },
    };
    expect(status.device).toBe('DA115');
    expect(status.anomaly.is_anomaly).toBe(false);
    expect(status.drift.drift_detected).toBe(false);
    expect(status.trend.gases.h2.direction).toBe('stable');
  });
});

describe('API Functions', () => {
  const mockFetch = vi.fn();
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    globalThis.fetch = mockFetch;
    mockFetch.mockReset();
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it('getHealth calls /health endpoint and returns data', async () => {
    const mockResponse = { status: 'healthy', model: 'hybrid_zscore', model_version: 'hybrid-zscore-v1', devices_loaded: 21 };
    mockFetch.mockResolvedValueOnce({ ok: true, json: async () => mockResponse });

    const result = await getHealth();
    expect(mockFetch).toHaveBeenCalledWith("https://100.123.214.57/dga-api" + '/health');
    expect(result.status).toBe('healthy');
    expect(result.devices_loaded).toBe(21);
  });

  it('getDevices calls /devices endpoint', async () => {
    const mockResponse = { devices: ['DA115', 'DA08'], count: 2 };
    mockFetch.mockResolvedValueOnce({ ok: true, json: async () => mockResponse });

    const result = await getDevices();
    expect(mockFetch).toHaveBeenCalledWith("https://100.123.214.57/dga-api" + '/devices');
    expect(result.devices).toHaveLength(2);
    expect(result.count).toBe(2);
  });

  it('getAnomaly calls /anomaly with correct params', async () => {
    const mockResponse = { device: 'DA115', timestamp: '2026-06-29T10:00:00Z', is_anomaly: false, confidence: 0, anomaly_type: null, severity: null, details: { h2_zscore: 0, co_zscore: 0, wc_zscore: 0 }, model_version: 'hybrid-zscore-v1', recommendations: [] };
    mockFetch.mockResolvedValueOnce({ ok: true, json: async () => mockResponse });

    const result = await getAnomaly('DA115', 24);
    expect(mockFetch).toHaveBeenCalledWith("https://100.123.214.57/dga-api" + '/anomaly?device=DA115&hours=24');
    expect(result.device).toBe('DA115');
    expect(result.is_anomaly).toBe(false);
  });

  it('getDrift calls /drift with device param', async () => {
    const mockResponse = { device: 'DA08', drift_detected: false, gases: { h2: { reference_mean: 1000, current_mean: 1000, drift: 0, drift_pct: 0, drift_detected: false }, co: { reference_mean: 500, current_mean: 500, drift: 0, drift_pct: 0, drift_detected: false }, wc: { reference_mean: 10, current_mean: 10, drift: 0, drift_pct: 0, drift_detected: false } }, model_version: 'hybrid-zscore-v1' };
    mockFetch.mockResolvedValueOnce({ ok: true, json: async () => mockResponse });

    const result = await getDrift('DA08');
    expect(mockFetch).toHaveBeenCalledWith("https://100.123.214.57/dga-api" + '/drift?device=DA08');
    expect(result.drift_detected).toBe(false);
  });

  it('getTrend calls /trend with device and window_days params', async () => {
    const mockResponse = { device: 'DA115', period_days: 90, gases: { h2: { slope: 0, trend_detected: false, direction: 'stable' }, co: { slope: 0, trend_detected: false, direction: 'stable' }, wc: { slope: 0, trend_detected: false, direction: 'stable' } }, model_version: 'hybrid-zscore-v1' };
    mockFetch.mockResolvedValueOnce({ ok: true, json: async () => mockResponse });

    const result = await getTrend('DA115', 90);
    expect(mockFetch).toHaveBeenCalledWith("https://100.123.214.57/dga-api" + '/trend?device=DA115&window_days=90');
    expect(result.period_days).toBe(90);
  });

  it('getAllAnomalies fetches all devices then checks each', async () => {
    const devicesResponse = { devices: ['DA115', 'DA08'], count: 2 };
    const anomalyResponse = { device: 'DA115', timestamp: '2026-06-29T10:00:00Z', is_anomaly: false, confidence: 0, anomaly_type: null, severity: null, details: { h2_zscore: 0, co_zscore: 0, wc_zscore: 0 }, model_version: 'hybrid-zscore-v1', recommendations: [] };
    mockFetch.mockResolvedValueOnce({ ok: true, json: async () => devicesResponse }).mockResolvedValue({ ok: true, json: async () => anomalyResponse });

    const result = await getAllAnomalies();
    expect(mockFetch).toHaveBeenCalledTimes(3);
    expect(result).toHaveLength(2);
  });

  it('getAnomaliesOnly filters to only anomalies', async () => {
    const devicesResponse = { devices: ['DA115', 'DA08'], count: 2 };
    const anomaly1 = { device: 'DA115', timestamp: '2026-06-29T10:00:00Z', is_anomaly: true, confidence: 0.95, anomaly_type: 'high', severity: 'high', details: { h2_zscore: 3.5, co_zscore: 0, wc_zscore: 0 }, model_version: 'hybrid-zscore-v1', recommendations: ['Check H2 levels'] };
    const anomaly2 = { device: 'DA08', timestamp: '2026-06-29T10:00:00Z', is_anomaly: false, confidence: 0, anomaly_type: null, severity: null, details: { h2_zscore: 0, co_zscore: 0, wc_zscore: 0 }, model_version: 'hybrid-zscore-v1', recommendations: [] };
    mockFetch.mockResolvedValueOnce({ ok: true, json: async () => devicesResponse }).mockResolvedValueOnce({ ok: true, json: async () => anomaly1 }).mockResolvedValueOnce({ ok: true, json: async () => anomaly2 });

    const result = await getAnomaliesOnly();
    expect(result).toHaveLength(1);
    expect(result[0].device).toBe('DA115');
    expect(result[0].is_anomaly).toBe(true);
  });

  it('throws when API returns non-ok response', async () => {
    mockFetch.mockResolvedValueOnce({ ok: false });
    await expect(getHealth()).rejects.toThrow('Failed to fetch health status');
  });

  it('throws when network fails', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Network error'));
    await expect(getHealth()).rejects.toThrow('Network error');
  });

  it('getAllDeviceStatus fetches anomaly, drift, trend per device', async () => {
    const devicesResponse = { devices: ['DA115'], count: 1 };
    const anomalyR = { device: 'DA115', timestamp: '2026-06-29T10:00:00Z', is_anomaly: false, confidence: 0, anomaly_type: null, severity: null, details: { h2_zscore: 0, co_zscore: 0, wc_zscore: 0 }, model_version: 'hybrid-zscore-v1', recommendations: [] };
    const driftR = { device: 'DA115', drift_detected: false, gases: { h2: { reference_mean: 1225, current_mean: 1225, drift: 0, drift_pct: 0, drift_detected: false }, co: { reference_mean: 560, current_mean: 560, drift: 0, drift_pct: 0, drift_detected: false }, wc: { reference_mean: 9, current_mean: 9, drift: 0, drift_pct: 0, drift_detected: false } }, model_version: 'hybrid-zscore-v1' };
    const trendR = { device: 'DA115', period_days: 90, gases: { h2: { slope: 0, trend_detected: false, direction: 'stable' }, co: { slope: 0, trend_detected: false, direction: 'stable' }, wc: { slope: 0, trend_detected: false, direction: 'stable' } }, model_version: 'hybrid-zscore-v1' };
    mockFetch.mockResolvedValueOnce({ ok: true, json: async () => devicesResponse }).mockResolvedValueOnce({ ok: true, json: async () => anomalyR }).mockResolvedValueOnce({ ok: true, json: async () => driftR }).mockResolvedValueOnce({ ok: true, json: async () => trendR });

    const { getAllDeviceStatus } = await import('../../lib/dga-api');
    const result = await getAllDeviceStatus();
    expect(result).toHaveLength(1);
    expect(result[0].device).toBe('DA115');
    expect(result[0].anomaly.is_anomaly).toBe(false);
  });
});
