/**
 * DGA Anomaly Detection API Client
 * 
 * API Base: https://100.123.214.57/dga-api
 * Documentation: https://100.123.214.57/dga-api/docs
 */

const API_BASE = process.env.NEXT_PUBLIC_DGA_API_URL || 'https://100.123.214.57/dga-api';

/* ========== TypeScript Interfaces ========== */

export interface AnomalyDetails {
  h2_zscore: number;
  co_zscore: number;
  wc_zscore: number;
}

export interface AnomalyResponse {
  device: string;
  timestamp: string;
  is_anomaly: boolean;
  confidence: number;
  anomaly_type: string | null;
  severity: string | null;
  details: AnomalyDetails;
  model_version: string;
  recommendations: string[];
}

export interface GasDrift {
  reference_mean: number;
  current_mean: number;
  drift: number;
  drift_pct: number;
  drift_detected: boolean;
}

export interface DriftResponse {
  device: string;
  drift_detected: boolean;
  gases: {
    h2: GasDrift;
    co: GasDrift;
    wc: GasDrift;
  };
  model_version: string;
}

export interface GasTrend {
  slope: number;
  trend_detected: boolean;
  direction: 'stable' | 'increasing' | 'decreasing';
}

export interface TrendResponse {
  device: string;
  period_days: number;
  gases: {
    h2: GasTrend;
    co: GasTrend;
    wc: GasTrend;
  };
  model_version: string;
}

export interface DevicesResponse {
  devices: string[];
  count: number;
}

export interface HealthResponse {
  status: string;
  model: string;
  model_version: string;
  devices_loaded: number;
}

/* ========== API Functions ========== */

export async function getHealth(): Promise<HealthResponse> {
  const res = await fetch(`${API_BASE}/health`);
  if (!res.ok) throw new Error('Failed to fetch health status');
  return res.json();
}

export async function getDevices(): Promise<DevicesResponse> {
  const res = await fetch(`${API_BASE}/devices`);
  if (!res.ok) throw new Error('Failed to fetch devices');
  return res.json();
}

export async function getAnomaly(device: string, hours: number = 24): Promise<AnomalyResponse> {
  const res = await fetch(`${API_BASE}/anomaly?device=${device}&hours=${hours}`);
  if (!res.ok) throw new Error(`Failed to fetch anomaly for ${device}`);
  return res.json();
}

export async function getDrift(device: string): Promise<DriftResponse> {
  const res = await fetch(`${API_BASE}/drift?device=${device}`);
  if (!res.ok) throw new Error(`Failed to fetch drift for ${device}`);
  return res.json();
}

export async function getTrend(device: string, windowDays: number = 90): Promise<TrendResponse> {
  const res = await fetch(`${API_BASE}/trend?device=${device}&window_days=${windowDays}`);
  if (!res.ok) throw new Error(`Failed to fetch trend for ${device}`);
  return res.json();
}

export async function getAllAnomalies(): Promise<AnomalyResponse[]> {
  const { devices } = await getDevices();
  const results = await Promise.all(
    devices.map(device => getAnomaly(device))
  );
  return results;
}

export async function getAnomaliesOnly(): Promise<AnomalyResponse[]> {
  const all = await getAllAnomalies();
  return all.filter(r => r.is_anomaly);
}

export async function getAllDeviceStatus(): Promise<DeviceStatus[]> {
  const { devices } = await getDevices();
  const results = await Promise.all(
    devices.map(async (device) => {
      const [anomaly, drift, trend] = await Promise.all([
        getAnomaly(device),
        getDrift(device),
        getTrend(device)
      ]);
      return { device, anomaly, drift, trend };
    })
  );
  return results;
}

export interface DeviceStatus {
  device: string;
  anomaly: AnomalyResponse;
  drift: DriftResponse;
  trend: TrendResponse;
}
