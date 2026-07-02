'use client';

import { useEffect, useState } from 'react';

interface ThresholdWarning {
  device: string;
  h2: number;
  co: number;
}

interface StatisticalAnomaly {
  device: string;
  severity: string;
  details: {
    h2_zscore?: number;
    co_zscore?: number;
    wc_zscore?: number;
  };
  recommendations?: string[];
}

export default function AnomalyAlert() {
  const [anomalies, setAnomalies] = useState<StatisticalAnomaly[]>([]);
  const [thresholdWarnings, setThresholdWarnings] = useState<ThresholdWarning[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastCheck, setLastCheck] = useState<string>('');

  useEffect(() => {
    async function checkAll() {
      try {
        // Call server-side proxy that has access to localhost:8000
        const res = await fetch('/dga/api/anomaly-check');
        const data = await res.json();

        if (data.success) {
          setThresholdWarnings(data.thresholdWarnings || []);
          setAnomalies(data.anomalies || []);
        } else {
          console.error('Anomaly check failed:', data.error);
        }
        setLastCheck(new Date().toLocaleTimeString());
      } catch (error) {
        console.error('Failed to check anomalies:', error);
      } finally {
        setLoading(false);
      }
    }

    checkAll();
    const interval = setInterval(checkAll, 60000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="bg-slate-800 border border-slate-700 rounded-lg p-4 m-4">
        <div className="flex items-center gap-2 text-slate-400">
          <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <span>Checking anomalies...</span>
        </div>
      </div>
    );
  }

  if (anomalies.length === 0 && thresholdWarnings.length === 0) {
    return (
      <div className="bg-green-900/20 border border-green-700/50 rounded-lg p-4 m-4">
        <div className="flex items-center gap-2 text-green-400">
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
          <span className="font-semibold">All devices normal</span>
          <span className="text-sm text-slate-400 ml-2">Last check: {lastCheck}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="m-4 space-y-3">
      {thresholdWarnings.length > 0 && (
        <div className="bg-orange-900/20 border border-orange-500/50 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <svg className="w-6 h-6 text-orange-400 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <div className="flex-1">
              <div className="font-semibold text-orange-400 mb-2">
                ⚠️ WARNING: {thresholdWarnings.length} devices above IEC threshold
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 text-sm">
                {thresholdWarnings.map((w, i) => (
                  <div key={i} className="bg-orange-900/30 rounded px-3 py-2">
                    <span className="font-bold text-orange-300">{w.device}</span>
                    <div className="text-orange-200 mt-1">
                      {w.h2 > 500 && <span className="mr-3">H2: {w.h2} ppm</span>}
                      {w.co > 1500 && <span>CO: {w.co} ppm</span>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {anomalies.map((a, i) => (
        <div key={i} className={`rounded-lg p-4 border ${
          a.severity === 'high' ? 'bg-red-900/20 border-red-500/50' :
          a.severity === 'medium' ? 'bg-orange-900/20 border-orange-500/50' :
          'bg-yellow-900/20 border-yellow-500/50'
        }`}>
          <div className="flex items-start gap-3">
            <svg className="w-6 h-6 text-red-400 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <span className={`font-bold ${
                  a.severity === 'high' ? 'text-red-400' :
                  a.severity === 'medium' ? 'text-orange-400' :
                  'text-yellow-400'
                }`}>
                  🚨 ANOMALY: {a.device}
                </span>
                {a.severity && (
                  <span className="text-xs px-2 py-1 rounded bg-black/30 uppercase">
                    {a.severity}
                  </span>
                )}
              </div>
              <div className="text-sm space-y-1 text-slate-300">
                <div className="flex gap-4">
                  {a.details.h2_zscore && Math.abs(a.details.h2_zscore) > 0 && (
                    <span>H2 Z-Score: <b className="text-slate-100">{a.details.h2_zscore.toFixed(2)}</b></span>
                  )}
                  {a.details.co_zscore && Math.abs(a.details.co_zscore) > 0 && (
                    <span>CO Z-Score: <b className="text-slate-100">{a.details.co_zscore.toFixed(2)}</b></span>
                  )}
                  {a.details.wc_zscore && Math.abs(a.details.wc_zscore) > 0 && (
                    <span>WC Z-Score: <b className="text-slate-100">{a.details.wc_zscore.toFixed(2)}</b></span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
