'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface AnomalyEvent {
  id: string;
  device: string;
  timestamp: string;
  gas_type: string;
  z_score: number;
  severity: 'warning' | 'critical';
}

export default function AnomalySummaryPanel() {
  const router = useRouter();
  const [events, setEvents] = useState<AnomalyEvent[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const res = await fetch('/dga-api/anomaly/events?min_zscore=3.5&limit=3&page=1');
        const data = await res.json();
        setEvents(data.events || []);
        setTotalCount(data.total || 0);
      } catch(e) {
        console.error('Failed to load anomaly summary:', e);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  if (loading) return <div className="bg-slate-800 rounded-lg p-4 border border-slate-700 mb-4">Loading anomalies...</div>;

  return (
    <div className="bg-slate-800 rounded-lg border border-slate-700 mb-4 overflow-hidden">
      {/* Compact header */}
      <div className="flex items-center justify-between px-4 py-2 bg-slate-750 border-b border-slate-700">
        <h3 className="text-sm font-semibold text-slate-200">⚠️ Recent Anomalies (Last 24h)</h3>
        <span className="text-xs text-slate-400">{totalCount} events</span>
      </div>

      {events.length === 0 ? (
        <div className="px-4 py-3 text-center text-slate-400 text-sm">No anomalies in last 24h ✓</div>
      ) : (
        <div className="divide-y divide-slate-700">
          {events.map((evt) => (
            <div key={evt.id} className="flex items-center justify-between px-4 py-2 hover:bg-slate-750">
              <div className="flex items-center gap-3">
                <span className="text-xs font-mono text-slate-300 w-16">{evt.device}</span>
                <span className="text-xs text-slate-400">{evt.gas_type}</span>
                <span className="text-xs text-slate-500">{new Date(evt.timestamp).toLocaleTimeString()}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className={`text-sm font-bold font-mono ${evt.severity === 'critical' ? 'text-red-400' : 'text-yellow-400'}`}>
                  {evt.z_score.toFixed(1)}σ
                </span>
                <span className={`text-xs px-2 py-0.5 rounded ${
                  evt.severity === 'critical' 
                    ? 'bg-red-900/30 text-red-300' 
                    : 'bg-yellow-900/30 text-yellow-300'
                }`}>
                  {evt.severity.toUpperCase()}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Action button */}
      <div className="px-4 py-2 bg-slate-750 border-t border-slate-700 flex justify-between items-center">
        <button 
          onClick={() => router.push('/dga/anomaly-history')}
          className="text-xs text-blue-400 hover:text-blue-300 hover:underline"
        >
          View Full History →
        </button>
        <button
          onClick={() => {
            const params = new URLSearchParams(window.location.search);
            const devices = params.get('devices') || '';
            window.open(`/dga-api/anomaly/export/csv?devices=${devices}&min_zscore=3.5`, '_blank');
          }}
          className="text-xs text-slate-400 hover:text-slate-300 hover:underline"
        >
          📥 Export CSV
        </button>
      </div>
    </div>
  );
}
