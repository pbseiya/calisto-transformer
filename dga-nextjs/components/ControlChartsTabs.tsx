
'use client';

import { useState, useEffect } from 'react';

interface ControlChartSnapshot {
  device: string;
  gas_type: string;
  timestamp: string;
  current_zscore: number;
  reference_baseline_ppm: { mean: number; std: number };
  '24h_shewhart': {
    z_score: number;
    ucl: number;
    lcl: number;
    alert: boolean;
    enabled: boolean;
  };
  '7d_cusum': {
    z_score: number;
    cusum_plus: number;
    cusum_minus: number;
    cusum_threshold: number;
    alert: boolean;
    enabled: boolean;
  };
  '30d_reference': {
    z_score: number;
    baseline_drift: number;
    ucl: number;
    lcl: number;
    alert: boolean;
    enabled: boolean;
  };
  overall_alert: boolean;
  recommendation: string;
}

type TabType = '24h' | '7d' | '30d' | 'all';

export default function ControlChartsTabs({ device = 'DA115' }: { device?: string }) {
  const [activeTab, setActiveTab] = useState<TabType>('all');
  const [snapshot, setSnapshot] = useState<ControlChartSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(
          `/dga-api/anomaly/control-charts?device=${device}&gas_type=h2&window_24h=true&window_7d=true&window_30d=true`
        );
        if (!res.ok) {
          if (res.status === 404) throw new Error('Device not found in baselines');
          throw new Error(`API error: ${res.status}`);
        }
        const data = await res.json();
        setSnapshot(data);
      } catch (e: any) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    }
    if (device) loadData();
  }, [device]);

  if (loading) {
    return <div className="bg-slate-800 rounded-lg p-6 text-center">Loading control charts...</div>;
  }

  if (error || !snapshot) {
    return (
      <div className="bg-slate-800 rounded-lg p-6 border border-red-500/30">
        <div className="text-red-400 font-semibold">Error loading control charts</div>
        <div className="text-slate-400 text-sm mt-2">{error || 'No data available'}</div>
      </div>
    );
  }

  const tabs: { id: TabType; label: string; icon: string }[] = [
    { id: 'all', label: 'All Tiers', icon: '📊' },
    { id: '24h', label: '24h Shewhart', icon: '⚡' },
    { id: '7d', label: '7d CUSUM', icon: '📈' },
    { id: '30d', label: '30d Reference', icon: '📅' },
  ];

  const getAlertColor = (alert: boolean) =>
    alert ? 'bg-red-500/20 border-red-500/50 text-red-300' : 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300';

  return (
    <div className="bg-slate-800 rounded-lg border border-slate-700 overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-slate-700 bg-slate-750">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
            <span>🎯</span> 3-Tier Control Chart Analysis
          </h3>
          <div className={`px-3 py-1 rounded-full text-xs font-mono ${getAlertColor(snapshot.overall_alert)}`}>
            {snapshot.overall_alert ? ' ALERT' : '✓ NORMAL'}
          </div>
        </div>
        <div className="text-xs text-slate-500 mt-1">{snapshot.device} · {snapshot.gas_type}</div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-700 bg-slate-750/50">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 px-4 py-2 text-xs font-medium transition-colors ${
              activeTab === tab.id
                ? 'text-blue-400 border-b-2 border-blue-400 bg-slate-700/50'
                : 'text-slate-500 hover:text-slate-300 hover:bg-slate-700/30'
            }`}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="p-4">
        {activeTab === 'all' && (
          <div className="grid grid-cols-3 gap-4">
            {[
              {
                tier: '24h',
                icon: '',
                title: 'Shewhart',
                subtitle: 'Instant Spike',
                z: snapshot['24h_shewhart'].z_score,
                alert: snapshot['24h_shewhart'].alert,
                ucl: snapshot['24h_shewhart'].ucl,
                threshold_type: '±',
              },
              {
                tier: '7d',
                icon: '📈',
                title: 'CUSUM',
                subtitle: 'Developing Trend',
                z: snapshot['7d_cusum'].cusum_plus,
                alert: snapshot['7d_cusum'].alert,
                ucl: snapshot['7d_cusum'].cusum_threshold,
                threshold_type: '>',
              },
              {
                tier: '30d',
                icon: '📅',
                title: 'Reference',
                subtitle: 'Baseline Drift',
                z: snapshot['30d_reference'].baseline_drift,
                alert: snapshot['30d_reference'].alert,
                ucl: snapshot['30d_reference'].ucl,
                threshold_type: '>',
              },
            ].map(chart => (
              <div
                key={chart.tier}
                className={`p-4 rounded-lg border ${
                  chart.alert ? 'bg-red-500/10 border-red-500/30' : 'bg-slate-750 border-slate-700'
                }`}
              >
                <div className="text-2xl mb-2">{chart.icon}</div>
                <div className="text-xs text-slate-400 mb-1">{chart.tier}</div>
                <div className="text-sm font-semibold text-slate-200 mb-3">{chart.title}</div>
                <div className="text-3xl font-mono font-bold text-slate-100 mb-2">{chart.z.toFixed(2)}σ</div>
                <div className={`text-xs ${chart.alert ? 'text-red-400' : 'text-slate-500'}`}>
                  {chart.threshold_type} = {chart.threshold_type === '±' ? '±' : ''}{chart.ucl.toFixed(1)}σ
                </div>
                <div className={`mt-2 text-xs font-medium ${chart.alert ? 'text-red-400' : 'text-emerald-400'}`}>
                  {chart.alert ? '⚠️ ALERT' : '✓ Normal'}
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === '24h' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs text-slate-400">24h Shewhart — Instant Spike Detection</div>
                <div className="text-sm text-slate-200 mt-1">Detects sudden deviations within 24h window</div>
              </div>
              <div className={`px-3 py-1 rounded-full text-xs font-mono ${getAlertColor(snapshot['24h_shewhart'].alert)}`}>
                {snapshot['24h_shewhart'].alert ? ' SPIKE DETECTED' : '✓ Normal'}
              </div>
            </div>
            <div className="bg-slate-750 rounded p-4 font-mono text-lg text-center border border-slate-700">
              <div className="text-slate-400 text-xs mb-2">Current Deviation</div>
              <div className="text-5xl font-bold text-slate-100">
                {snapshot['24h_shewhart'].z_score.toFixed(2)}
                <span className="text-2xl text-slate-400 ml-1">σ</span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="bg-slate-750 rounded p-3 border border-slate-700">
                <div className="text-xs text-slate-400">UCL</div>
                <div className="font-mono text-red-400">+{snapshot['24h_shewhart'].ucl.toFixed(1)}σ</div>
              </div>
              <div className="bg-slate-750 rounded p-3 border border-slate-700">
                <div className="text-xs text-slate-400">LCL</div>
                <div className="font-mono text-blue-400">{snapshot['24h_shewhart'].lcl.toFixed(1)}σ</div>
              </div>
            </div>
          </div>
        )}

        {activeTab === '7d' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs text-slate-400">7d CUSUM — Developing Trend Detection</div>
                <div className="text-sm text-slate-200 mt-1">Accumulates small deviations over 7 days</div>
              </div>
              <div className={`px-3 py-1 rounded-full text-xs font-mono ${getAlertColor(snapshot['7d_cusum'].alert)}`}>
                {snapshot['7d_cusum'].alert ? '🚨 TREND DETECTED' : '✓ Normal'}
              </div>
            </div>
            <div className="bg-slate-750 rounded p-4 font-mono text-lg text-center border border-slate-700">
              <div className="text-slate-400 text-xs mb-2">Cumulative Sum (plus)</div>
              <div className="text-5xl font-bold text-slate-100">
                {snapshot['7d_cusum'].cusum_plus.toFixed(2)}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="bg-slate-750 rounded p-3 border border-slate-700">
                <div className="text-xs text-slate-400">CUSUM+</div>
                <div className="font-mono text-red-400">{snapshot['7d_cusum'].cusum_plus.toFixed(2)}</div>
              </div>
              <div className="bg-slate-750 rounded p-3 border border-slate-700">
                <div className="text-xs text-slate-400">Threshold</div>
                <div className="font-mono text-slate-300">&gt;{snapshot['7d_cusum'].cusum_threshold.toFixed(1)}</div>
              </div>
            </div>
          </div>
        )}

        {activeTab === '30d' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs text-slate-400">30d Reference — Baseline Drift Detection</div>
                <div className="text-sm text-slate-200 mt-1">Tracks long-term deviation from reference</div>
              </div>
              <div className={`px-3 py-1 rounded-full text-xs font-mono ${getAlertColor(snapshot['30d_reference'].alert)}`}>
                {snapshot['30d_reference'].alert ? ' DRIFT DETECTED' : '✓ Normal'}
              </div>
            </div>
            <div className="bg-slate-750 rounded p-4 font-mono text-lg text-center border border-slate-700">
              <div className="text-slate-400 text-xs mb-2">Baseline Drift</div>
              <div className="text-5xl font-bold text-slate-100">
                {snapshot['30d_reference'].baseline_drift.toFixed(2)}
                <span className="text-2xl text-slate-400 ml-1">σ</span>
              </div>
            </div>
            <div className="bg-slate-750 rounded p-3 border border-slate-700">
              <div className="text-xs text-slate-400 mb-2">Reference Baseline (ppm)</div>
              <div className="flex justify-between text-sm font-mono">
                <div>
                  <div className="text-slate-400 text-xs">Mean</div>
                  <div className="text-slate-200">{snapshot.reference_baseline_ppm.mean.toFixed(2)}</div>
                </div>
                <div>
                  <div className="text-slate-400 text-xs">Std</div>
                  <div className="text-slate-200">{snapshot.reference_baseline_ppm.std.toFixed(2)}</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Bottom: Recommendation */}
      <div className={`px-4 py-3 border-t ${snapshot.overall_alert ? 'bg-red-500/10 border-red-500/30' : 'bg-slate-750 border-slate-700'}`}>
        <div className="text-xs text-slate-400 mb-1">💡 Recommendation</div>
        <div className={`text-sm font-medium ${snapshot.overall_alert ? 'text-red-300' : 'text-emerald-300'}`}>
          {snapshot.recommendation}
        </div>
      </div>
    </div>
  );
}
