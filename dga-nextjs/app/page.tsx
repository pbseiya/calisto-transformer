'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import RealtimeTable from '@/components/RealtimeTable';
import DeviceFilter from '@/components/DeviceFilter';
import TimeRangeFilter from '@/components/TimeRangeFilter';
import StatsPanel from '@/components/StatsPanel';

const Chart = dynamic(() => import('@/components/Chart'), {
  ssr: false,
  loading: () => (
    <div className="bg-slate-800 rounded-lg shadow-lg p-6 border border-slate-700">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Loading Chart...</h3>
      </div>
      <div style={{ height: '300px' }} className="flex items-center justify-center">
        <div className="text-slate-400">Loading...</div>
      </div>
    </div>
  ),
});

const AnomalyAlert = dynamic(() => import('@/components/AnomalyAlert'), {
  ssr: false,
  loading: () => (
    <div className="bg-slate-800 rounded-lg p-4 m-4">
      <div className="flex items-center gap-2 text-slate-400">
        <div className="w-5 h-5 animate-spin rounded-full border-2 border-slate-400 border-t-transparent" />
        <span className="text-sm">Checking anomalies...</span>
      </div>
    </div>
  ),
});

const AnomalyDashboard = dynamic(() => import('@/components/AnomalyDashboard'), {
  ssr: false,
  loading: () => (
    <div className="p-6">
      <div className="flex items-center gap-3 text-slate-400">
        <div className="w-6 h-6 animate-spin rounded-full border-2 border-slate-400 border-t-transparent" />
        <span>Loading devices...</span>
      </div>
    </div>
  ),
});

interface Device {
  name: string;
  ip: string;
  type: string;
}

interface Reading {
  device_name: string;
  timestamp: string;
  h2?: number;
  co?: number;
  wc?: number;
  h2_mean?: number;
  co_mean?: number;
  wc_mean?: number;
  [key: string]: any;
}

interface Statistics {
  device_name: string;
  avg_h2: number;
  min_h2: number;
  max_h2: number;
  avg_h2_stdev: number;
  total_h2_alarms: number;
  avg_co: number;
  min_co: number;
  max_co: number;
  avg_co_stdev: number;
  total_co_alarms: number;
  avg_wc: number;
  min_wc: number;
  max_wc: number;
  avg_wc_stdev: number;
  total_wc_alarms: number;
  first_reading: string;
  last_reading: string;
}

const THRESHOLDS = {
  h2: { warning: 250, danger: 500 },
  co: { warning: 1000, danger: 1500 },
  wc: { warning: 30, danger: 40 },
};

export default function Dashboard() {
  const [devices, setDevices] = useState<Device[]>([]);
  const [selectedDevices, setSelectedDevices] = useState<string[]>([]);
  const [readings, setReadings] = useState<Reading[]>([]);
  const [latestReadings, setLatestReadings] = useState<Reading[]>([]);
  const [statistics, setStatistics] = useState<Statistics[]>([]);
  const [timeRange, setTimeRange] = useState('24hr');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const [dataSource, setDataSource] = useState<'raw' | 'summary'>('summary');
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [showPoints, setShowPoints] = useState(false);
  const [smartMode, setSmartMode] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected'>('connected');

  useEffect(() => {
    fetchDevices();
  }, []);

  useEffect(() => {
    if (selectedDevices.length > 0) {
      fetchData();
      fetchLatestReadings();
    }
  }, [selectedDevices, timeRange, dataSource, customStart, customEnd, smartMode]);

  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      if (selectedDevices.length > 0) {
        fetchData();
      }
    }, 15000);

    return () => clearInterval(interval);
  }, [autoRefresh, selectedDevices, timeRange, dataSource, customStart, customEnd]);

  const fetchDevices = async () => {
    try {
      const response = await fetch('/dga/api/devices');
      const data = await response.json();
      if (data.success) {
        setDevices(data.devices);
        setSelectedDevices(data.devices.map((d: Device) => d.name));
      }
    } catch (err) {
      setError('Failed to fetch devices');
      setConnectionStatus('disconnected');
    }
  };

  const fetchLatestReadings = async () => {
    try {
      const response = await fetch(
        '/dga/api/readings-latest?devices=' + selectedDevices.join(',')
      );
      const data = await response.json();
      if (data.success) {
        setLatestReadings(data.data);
      }
    } catch (err) {
      console.error('Failed to fetch latest readings:', err);
    }
  };

  const fetchData = async (attempt = 1): Promise<void> => {
    setLoading(true);
    setError('');

    try {
      const { start, end } = getTimeRange();

      const readingsResponse = await fetch(
        `/dga/api/readings?devices=${selectedDevices.join(',')}&start=${start}&end=${end}&source=${dataSource}`
      );
      const readingsData = await readingsResponse.json();

      const statsResponse = await fetch(
        `/dga/api/statistics?devices=${selectedDevices.join(',')}&start=${start}&end=${end}`
      );
      const statsData = await statsResponse.json();

      if (readingsData.success && statsData.success) {
        if (smartMode && (readingsData.count === 0 || readingsData.data.length === 0) && attempt === 1 && timeRange !== '7d' && timeRange !== '30d') {
          setTimeRange('7d');
          return fetchData(2);
        }

        setReadings(readingsData.data);
        setStatistics(statsData.data);
        setLastUpdated(new Date());
        setConnectionStatus('connected');
      } else {
        setError('Failed to fetch data');
        setConnectionStatus('disconnected');
      }
    } catch (err) {
      setError('Failed to fetch data');
      setConnectionStatus('disconnected');
    } finally {
      setLoading(false);
    }
  };

  const toLocalISOString = (date: Date): string => {
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
  };

  const getTimeRange = (): { start: string; end: string } => {
    const end = new Date();
    let start = new Date();

    switch (timeRange) {
      case '15min':
        start.setMinutes(end.getMinutes() - 15);
        break;
      case '1hr':
        start.setHours(end.getHours() - 1);
        break;
      case '6hr':
        start.setHours(end.getHours() - 6);
        break;
      case '24hr':
        start.setHours(end.getHours() - 24);
        break;
      case '7d':
        start.setDate(end.getDate() - 7);
        break;
      case '30d':
        start.setDate(end.getDate() - 30);
        break;
      case 'custom':
        if (customStart && customEnd) {
          return { start: customStart, end: customEnd };
        }
        break;
    }

    return {
      start: toLocalISOString(start),
      end: toLocalISOString(end),
    };
  };

  const formatLastUpdated = (date: Date | null) => {
    if (!date) return 'Never';
    return new Date(date).toLocaleTimeString();
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      <header className="bg-slate-800 border-b border-slate-700 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">DGA Monitoring Dashboard</h1>
              <div className="flex items-center gap-4 mt-2 text-base text-slate-300">
                <span>Last updated: {formatLastUpdated(lastUpdated)}</span>
                <span className={`flex items-center gap-2 ${
                  connectionStatus === 'connected' ? 'text-green-400' : 'text-red-400'
                }`}>
                  <span className={`w-2 h-2 rounded-full ${
                    connectionStatus === 'connected' ? 'bg-green-400' : 'bg-red-400'
                  }`} />
                  {connectionStatus === 'connected' ? 'Connected' : 'Disconnected'}
                </span>
              </div>
            </div>
            <button
              onClick={async () => {
                await fetch('/dga/api/auth/logout', { method: 'POST' });
                window.location.href = '/dga/login';
              }}
              className="bg-slate-700 hover:bg-slate-600 px-4 py-2 rounded-lg text-sm transition-colors"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <div className="bg-slate-800 border-b border-slate-700 sticky top-[73px] z-40">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-wrap gap-6 items-center">
            <DeviceFilter
              devices={devices}
              selectedDevices={selectedDevices}
              onSelectionChange={setSelectedDevices}
            />

            <TimeRangeFilter
              timeRange={timeRange}
              customStart={customStart}
              customEnd={customEnd}
              onTimeRangeChange={setTimeRange}
              onCustomStartChange={setCustomStart}
              onCustomEndChange={setCustomEnd}
            />

            <div className="flex items-center gap-2">
              <label className="text-base font-medium text-slate-200">Data Source:</label>
              <select
                value={dataSource}
                onChange={(e) => setDataSource(e.target.value as 'raw' | 'summary')}
                className="bg-slate-700 border border-slate-600 rounded px-3 py-2 text-base focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="summary">Summary (15min)</option>
                <option value="raw">Raw (15s)</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <label className="text-base font-medium text-slate-200">Points:</label>
              <button
                onClick={() => setShowPoints(!showPoints)}
                className={`px-3 py-2 rounded text-base transition-colors ${
                  showPoints ? 'bg-blue-600 hover:bg-blue-700' : 'bg-slate-700 hover:bg-slate-600'
                }`}
              >
                {showPoints ? 'ON' : 'OFF'}
              </button>
            </div>

            <div className="flex items-center gap-2">
              <label className="text-base font-medium text-slate-200">Smart:</label>
              <button
                onClick={() => setSmartMode(!smartMode)}
                className={`px-3 py-2 rounded text-base transition-colors ${
                  smartMode ? 'bg-purple-600 hover:bg-purple-700' : 'bg-slate-700 hover:bg-slate-600'
                }`}
              >
                {smartMode ? 'ON' : 'OFF'}
              </button>
            </div>

            <div className="flex items-center gap-2">
              <label className="text-base font-medium text-slate-200">Auto-refresh:</label>
              <button
                onClick={() => setAutoRefresh(!autoRefresh)}
                className={`px-3 py-2 rounded text-base transition-colors ${
                  autoRefresh ? 'bg-green-600 hover:bg-green-700' : 'bg-slate-700 hover:bg-slate-600'
                }`}
              >
                {autoRefresh ? 'ON' : 'OFF'}
              </button>
            </div>

            <button
              onClick={() => fetchData()}
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded text-base transition-colors disabled:opacity-50"
            >
              {loading ? 'Loading...' : 'Refresh'}
            </button>
          </div>
        </div>
      </div>

      <main className="container mx-auto px-4 py-6">
        {error && (
          <div className="bg-red-900/50 border border-red-500 text-red-200 px-4 py-3 rounded-lg mb-4">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 mb-6">
          <div className="lg:col-span-3 space-y-6 min-h-[60vh]">
            <Chart
              title="Hydrogen (H2)"
              data={readings}
              dataKey={dataSource === 'raw' ? 'h2' : 'h2_mean'}
              color="#e74c3c"
              thresholds={THRESHOLDS.h2}
              selectedDevices={selectedDevices}
              showPoints={showPoints}
              timeRange={timeRange}
            />

            <Chart
              title="Carbon Monoxide (CO)"
              data={readings}
              dataKey={dataSource === 'raw' ? 'co' : 'co_mean'}
              color="#3498db"
              thresholds={THRESHOLDS.co}
              selectedDevices={selectedDevices}
              showPoints={showPoints}
              timeRange={timeRange}
            />

            <Chart
              title="Water Content (WC)"
              data={readings}
              dataKey={dataSource === 'raw' ? 'wc' : 'wc_mean'}
              color="#2ecc71"
              thresholds={THRESHOLDS.wc}
              selectedDevices={selectedDevices}
              showPoints={showPoints}
              timeRange={timeRange}
            />
          </div>
          <div className="lg:col-span-2">
            <RealtimeTable
              selectedDevices={selectedDevices}
            />
          </div>
        </div>

        <StatsPanel
          statistics={statistics}
          thresholds={THRESHOLDS}
        />

        <AnomalyDashboard />
      </main>
    </div>
  );
}
