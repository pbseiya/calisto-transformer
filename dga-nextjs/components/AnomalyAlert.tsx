'use client';

import { useEffect, useState } from 'react';
import { getAnomaliesOnly, AnomalyResponse } from '@/lib/dga-api';

export default function AnomalyAlert() {
  const [anomalies, setAnomalies] = useState<AnomalyResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastCheck, setLastCheck] = useState<string>('');

  useEffect(() => {
    async function checkAnomalies() {
      try {
        const results = await getAnomaliesOnly();
        setAnomalies(results);
        setLastCheck(new Date().toLocaleTimeString());
      } catch (error) {
        console.error('Failed to check anomalies:', error);
      } finally {
        setLoading(false);
      }
    }

    checkAnomalies();
    const interval = setInterval(checkAnomalies, 60000); // Check every minute
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

  if (anomalies.length === 0) {
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

  const getSeverityColor = (severity: string | null) => {
    switch (severity?.toLowerCase()) {
      case 'high': return 'bg-red-500/20 text-red-400 border-red-500/50';
      case 'medium': return 'bg-orange-500/20 text-orange-400 border-orange-500/50';
      case 'low': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50';
      default: return 'bg-slate-500/20 text-slate-400 border-slate-500/50';
    }
  };

  return (
    <div className="bg-red-900/20 border-l-4 border-red-500 rounded-lg p-4 m-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-red-400 font-bold text-lg flex items-center gap-2">
          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          Anomalies Detected ({anomalies.length})
        </h3>
        <span className="text-sm text-slate-400">Last check: {lastCheck}</span>
      </div>
      
      <div className="space-y-3">
        {anomalies.map((a, i) => (
          <div key={i} className={`rounded-lg p-3 border ${getSeverityColor(a.severity)}`}>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="font-bold text-lg">{a.device}</span>
                {a.severity && (
                  <span className="text-xs px-2 py-1 rounded bg-black/30 uppercase tracking-wide">
                    {a.severity}
                  </span>
                )}
              </div>
              <span className="text-xs opacity-75">
                {new Date(a.timestamp).toLocaleString()}
              </span>
            </div>
            
            <div className="grid grid-cols-3 gap-3 mb-2 text-sm">
              <div>
                <div className="opacity-75 text-xs mb-1">H2 Z-Score</div>
                <div className="font-mono font-bold">{a.details.h2_zscore.toFixed(2)}σ</div>
              </div>
              <div>
                <div className="opacity-75 text-xs mb-1">CO Z-Score</div>
                <div className="font-mono font-bold">{a.details.co_zscore.toFixed(2)}σ</div>
              </div>
              <div>
                <div className="opacity-75 text-xs mb-1">WC Z-Score</div>
                <div className="font-mono font-bold">{a.details.wc_zscore.toFixed(2)}σ</div>
              </div>
            </div>
            
            {a.recommendations.length > 0 && (
              <div className="mt-2 pt-2 border-t border-current/20">
                <div className="text-xs opacity-75 mb-1">Recommendations:</div>
                <ul className="text-sm space-y-1">
                  {a.recommendations.map((rec, j) => (
                    <li key={j} className="flex items-start gap-2">
                      <span className="text-xs mt-1">•</span>
                      <span>{rec}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
