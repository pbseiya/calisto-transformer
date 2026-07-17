'use client';

import { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Area, AreaChart } from 'recharts';

interface Props {
  selectedDevices?: string[];
  device?: string; // backward compatibility
}

export default function ControlChartsTabs({ selectedDevices, device }: Props) {
  const [activeTab, setActiveTab] = useState<'all' | '24h' | '7d' | '30d'>('all');
  const [chartData, setChartData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const currentDevice = device || (selectedDevices && selectedDevices.length > 0 ? selectedDevices[0] : 'DA115');

  useEffect(() => {
    let cancelled = false;

    async function loadData() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(
          `/dga-api/anomaly/control-charts/history?device=${encodeURIComponent(currentDevice)}&gas_type=h2&hours=168`
        );
        if (!res.ok) {
          throw new Error(`Failed to fetch: ${res.status}`);
        }
        const data = await res.json();
        if (cancelled) return;

        // Transform to chart format
        const timestamps = data['24h_shewhart']?.timestamps || [];
        const zScores = data['24h_shewhart']?.z_scores || [];
        const cusumPlus = data['7d_cusum']?.cusum_plus || [];
        const refZscores = data['30d_reference']?.z_scores || [];

        const chartData = timestamps.map((ts: string, i: number) => ({
          time: new Date(ts).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
          shewhart: zScores[i] || 0,
          cusum: cusumPlus[i] || 0,
          reference: refZscores[i] || 0,
        }));

        setChartData(chartData);
      } catch (e: any) {
        if (!cancelled) {
          setError(e.message);
          console.error('ControlChartsTabs error:', e);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadData();
    return () => { cancelled = true; };
  }, [currentDevice]);

  if (error) {
    return (
      <div className="bg-slate-800 rounded-lg p-6 border border-red-500/30">
        <div className="text-red-400 font-semibold mb-2">⚠️ Error loading control charts</div>
        <div className="text-slate-400 text-sm">{error}</div>
        <div className="text-slate-500 text-xs mt-3">Device: {currentDevice}</div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="bg-slate-800 rounded-lg p-6 text-center text-slate-400">
        Loading control charts for {currentDevice}...
      </div>
    );
  }

  const tabs = [
    { id: 'all' as const, label: 'All Tiers' },
    { id: '24h' as const, label: '24h Shewhart' },
    { id: '7d' as const, label: '7d CUSUM' },
    { id: '30d' as const, label: '30d Reference' },
  ];

  return (
    <div className="bg-slate-800 rounded-lg p-6 mb-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-semibold text-slate-200">🎯 3-Tier Control Chart Analysis</h3>
        <div className="text-sm text-slate-400">Device: <span className="text-blue-400 font-mono">{currentDevice}</span></div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-4">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 rounded text-sm font-medium transition-colors ${
              activeTab === tab.id
                ? 'bg-blue-600 text-white'
                : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Charts */}
      {(activeTab === 'all' || activeTab === '24h') && (
        <div className="mb-6">
          <div className="text-sm text-slate-400 mb-2">24h Shewhart History (±4σ)</div>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="time" stroke="#94a3b8" style={{ fontSize: '10px' }} interval={23} />
              <YAxis stroke="#94a3b8" style={{ fontSize: '11px' }} tickFormatter={(v) => `${v}σ`} domain={[-6, 6]} />
              <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }} />
              <ReferenceLine y={4} stroke="#ef4444" strokeDasharray="5 5" label={{ value: 'UCL 4σ', position: 'right', fill: '#ef4444' }} />
              <ReferenceLine y={-4} stroke="#ef4444" strokeDasharray="5 5" label={{ value: 'LCL -4σ', position: 'right', fill: '#ef4444' }} />
              <ReferenceLine y={0} stroke="#10b981" strokeDasharray="3 3" />
              <Line type="monotone" dataKey="shewhart" stroke="#3b82f6" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {(activeTab === 'all' || activeTab === '7d') && (
        <div className="mb-6">
          <div className="text-sm text-slate-400 mb-2">7d CUSUM Accumulation (threshold 5σ)</div>
          <ResponsiveContainer width="100%" height={250}>
            <AreaChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="time" stroke="#94a3b8" style={{ fontSize: '10px' }} interval={23} />
              <YAxis stroke="#94a3b8" style={{ fontSize: '11px' }} tickFormatter={(v) => `${v}σ`} domain={[0, 8]} />
              <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }} />
              <ReferenceLine y={5} stroke="#f59e0b" strokeDasharray="5 5" label={{ value: 'Threshold 5σ', position: 'right', fill: '#f59e0b' }} />
              <ReferenceLine y={0} stroke="#64748b" strokeDasharray="3 3" />
              <Area type="monotone" dataKey="cusum" stroke="#f59e0b" fill="#f59e0b33" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      {(activeTab === 'all' || activeTab === '30d') && (
        <div className="mb-6">
          <div className="text-sm text-slate-400 mb-2">30d Reference Deviation (±3.5σ)</div>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="time" stroke="#94a3b8" style={{ fontSize: '10px' }} interval={23} />
              <YAxis stroke="#94a3b8" style={{ fontSize: '11px' }} tickFormatter={(v) => `${v}σ`} domain={[-6, 6]} />
              <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }} />
              <ReferenceLine y={3.5} stroke="#10b981" strokeDasharray="5 5" label={{ value: 'UCL 3.5σ', position: 'right', fill: '#10b981' }} />
              <ReferenceLine y={-3.5} stroke="#10b981" strokeDasharray="5 5" label={{ value: 'LCL -3.5σ', position: 'right', fill: '#10b981' }} />
              <ReferenceLine y={0} stroke="#64748b" strokeDasharray="3 3" />
              <Line type="monotone" dataKey="reference" stroke="#10b981" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
