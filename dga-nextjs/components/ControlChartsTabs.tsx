'use client';

import { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Area, AreaChart } from 'recharts';

interface Props {
  selectedDevices?: string[];
  device?: string;
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
        const res = await fetch(`/dga-api/anomaly/control-charts/history?device=${encodeURIComponent(currentDevice)}&gas_type=h2&hours=168`);
        if (!res.ok) throw new Error(`Failed to fetch: ${res.status}`);
        const data = await res.json();
        if (cancelled) return;

        const timestamps = data['24h_shewhart']?.timestamps || [];
        const zScores = data['24h_shewhart']?.z_scores || [];
        const cusumPlus = data['7d_cusum']?.cusum_plus || [];
        const refZscores = data['30d_reference']?.z_scores || [];

        const chart = timestamps.map((ts: string, i: number) => ({
          time: new Date(ts).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
          shewhart: zScores[i] || 0,
          cusum: cusumPlus[i] || 0,
          reference: refZscores[i] || 0,
        }));
        setChartData(chart);
      } catch (e: any) {
        if (!cancelled) { setError(e.message); console.error('ControlChartsTabs error:', e); }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    loadData();
    return () => { cancelled = true; };
  }, [currentDevice]);

  if (error) return (<div className="bg-slate-800 rounded-lg p-6 border border-red-500/30"><div className="text-red-400 font-semibold mb-2">️ Error loading control charts</div><div className="text-slate-400 text-sm">{error}</div><div className="text-slate-500 text-xs mt-3">Device: {currentDevice}</div></div>);
  if (loading) return (<div className="bg-slate-800 rounded-lg p-6 text-center text-slate-400">Loading control charts for {currentDevice}...</div>);

  const tabs = [{ id: 'all' as const, label: 'All Tiers' },{ id: '24h' as const, label: '24h Shewhart' },{ id: '7d' as const, label: '7d CUSUM' },{ id: '30d' as const, label: '30d Reference' }];

  const maxCusum = Math.max(...chartData.map(d => d.cusum), 0);
  const isOutOfControl = maxCusum >= 5;
  const yMax = Math.max(6, maxCusum * 1.3);

  return (
    <div className="bg-slate-800 rounded-lg p-6 mb-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-semibold text-slate-200">🎯 3-Tier Control Chart Analysis</h3>
        <div className="text-sm text-slate-400">Device: <span className="text-blue-400 font-mono">{currentDevice}</span></div>
      </div>
      <div className="flex gap-2 mb-4">
        {tabs.map(tab => (<button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`px-4 py-2 rounded text-sm font-medium transition-colors ${activeTab === tab.id ? 'bg-blue-600 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}`}>{tab.label}</button>))}
      </div>

      {/* 24h Shewhart */}
      {(activeTab === 'all' || activeTab === '24h') && (
        <div className="mb-6">
          <div className="text-sm text-slate-400 mb-2">24h Shewhart History (±4σ)</div>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="time" stroke="#94a3b8" style={{ fontSize: '10px' }} interval={Math.max(1, Math.floor(chartData.length / 8))} />
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

      {/* 7d CUSUM - WITH CONTROL LIMITS */}
      {(activeTab === 'all' || activeTab === '7d') && (
        <div className="mb-6">
          <div className="flex justify-between items-center mb-2">
            <div className="text-sm text-slate-400">7d CUSUM Accumulation (one-sided, k=0.5σ)</div>
            <div className={`text-xs font-mono px-2 py-1 rounded ${isOutOfControl ? 'bg-red-500/20 text-red-400 border border-red-500/50' : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/50'}`}>
              {isOutOfControl ? '️ OUT OF CONTROL' : '✓ IN CONTROL'}
            </div>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={chartData} margin={{ top: 10, right: 80, left: 10, bottom: 0 }}>
              <defs>
                <linearGradient id="cusumWarningGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#f59e0b" stopOpacity={0.4}/>
                  <stop offset="100%" stopColor="#f59e0b" stopOpacity={0.05}/>
                </linearGradient>
                <linearGradient id="cusumDangerGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#ef4444" stopOpacity={0.5}/>
                  <stop offset="100%" stopColor="#ef4444" stopOpacity={0.05}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="time" stroke="#94a3b8" style={{ fontSize: '10px' }} interval={Math.max(1, Math.floor(chartData.length / 8))} />
              <YAxis stroke="#94a3b8" style={{ fontSize: '11px' }} tickFormatter={(v) => `${v.toFixed(0)}σ·h`} domain={[0, yMax]} width={60} />
              <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }} formatter={(value: number) => `${value.toFixed(2)} σ·h`} labelFormatter={(label) => `Time: ${label}`} />

              {/* CONTROL ZONES: Background areas */}
              <Area type="monotone" dataKey="time" stackId="bg" stroke="none" fill="url(#cusumDangerGradient)" fillOpacity={0} yAxisId="right" style={{ display: 'none' }} />
              <ReferenceLine y={5} stroke="#ef4444" strokeWidth={2} strokeDasharray="5 4" label={{ value: 'UCL 5σ·h', position: 'right', fill: '#ef4444', fontSize: 11, fontWeight: 'bold' }} />
              <ReferenceLine y={3} stroke="#f59e0b" strokeWidth={1.5} strokeDasharray="4 3" label={{ value: 'Warning 3σ·h', position: 'right', fill: '#f59e0b', fontSize: 10 }} />
              <ReferenceLine y={0} stroke="#64748b" strokeWidth={1} strokeDasharray="2 3" label={{ value: 'Floor 0', position: 'right', fill: '#64748b', fontSize: 9 }} />

              {/* CUSUM line with conditional color */}
              <Area type="monotone" dataKey="cusum" stroke="none" fill={isOutOfControl ? "url(#cusumDangerGradient)" : "url(#cusumWarningGradient)"} fillOpacity={1} />
              <Line type="monotone" dataKey="cusum" stroke={isOutOfControl ? "#ef4444" : "#10b981"} strokeWidth={2.5} dot={false} />
            </AreaChart>
          </ResponsiveContainer>
          <div className="flex gap-4 mt-2 text-xs text-slate-500 justify-end pr-4">
            <span className="flex items-center gap-1"><span className="w-3 h-0.5 bg-emerald-500"></span> Normal (&lt;3σ·h)</span>
            <span className="flex items-center gap-1"><span className="w-3 h-0.5 bg-amber-500"></span> Warning (3-5σ·h)</span>
            <span className="flex items-center gap-1"><span className="w-3 h-0.5 bg-red-500"></span> Out of Control (≥5σ·h)</span>
          </div>
        </div>
      )}

      {/* 30d Reference */}
      {(activeTab === 'all' || activeTab === '30d') && (
        <div className="mb-6">
          <div className="text-sm text-slate-400 mb-2">30d Reference Deviation (±3.5σ)</div>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="time" stroke="#94a3b8" style={{ fontSize: '10px' }} interval={Math.max(1, Math.floor(chartData.length / 8))} />
              <YAxis stroke="#94a3b8" style={{ fontSize: '11px' }} tickFormatter={(v) => `${v}σ`} domain={[-6, 6]} />
              <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }} />
              <ReferenceLine y={3.5} stroke="#ef4444" strokeDasharray="5 5" label={{ value: 'UCL 3.5σ', position: 'right', fill: '#ef4444' }} />
              <ReferenceLine y={-3.5} stroke="#ef4444" strokeDasharray="5 5" label={{ value: 'LCL -3.5σ', position: 'right', fill: '#ef4444' }} />
              <ReferenceLine y={0} stroke="#10b981" strokeDasharray="3 3" />
              <Line type="monotone" dataKey="reference" stroke="#10b981" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
