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

  if (loading) return <div style={{ background: '#1e293b', borderRadius: '8px', padding: '16px', border: '1px solid #334155' }}>Loading...</div>;

  const getSeverityBadge = (sev: string) => {
    const styles = sev === 'critical' 
      ? { bg: 'rgba(239,68,68,0.2)', color: '#fca5a5', border: 'rgba(239,68,68,0.5)' }
      : { bg: 'rgba(245,158,11,0.2)', color: '#fde68a', border: 'rgba(245,158,11,0.5)' };
    
    return (
      <span style={{ 
        padding: '2px 8px', borderRadius: '12px', fontSize: '10px', fontWeight: 700,
        background: styles.bg, color: styles.color, border: `1px solid ${styles.border}`,
        textTransform: 'capitalize'
      }}>
        {sev}
      </span>
    );
  };

  return (
    <div style={{ background: '#1e293b', borderRadius: '10px', padding: '20px', border: '1px solid #334155', boxShadow: '0 2px 8px rgba(0,0,0,0.2)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: '#f8fafc' }}>Recent Anomalies</h3>
        <span style={{ fontSize: '13px', color: '#94a3b8' }}>Last 24h</span>
      </div>

      <div style={{ marginBottom: '16px', padding: '10px 14px', background: 'rgba(59,130,246,0.1)', borderRadius: '8px', border: '1px dashed rgba(59,130,246,0.3)', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#93c5fd" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
        <span style={{ color: '#93c5fd', fontSize: '13px', fontWeight: 600 }}>{totalCount} anomaly events detected</span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '16px' }}>
        {events.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '16px', color: '#64748b', fontSize: '13px' }}>No anomalies in last 24h ✓</div>
        ) : (
          events.map((evt) => (
            <div key={evt.id} style={{ 
              padding: '10px 12px', background: '#0f172a', borderRadius: '8px', 
              border: '1px solid rgba(51,65,85,0.5)', display: 'flex', justifyContent: 'space-between', alignItems: 'center'
            }}>
              <div>
                <div style={{ fontSize: '12px', fontWeight: 700, color: '#93c5fd', marginBottom: '2px' }}>{evt.device} · {evt.gas_type}</div>
                <div style={{ fontSize: '11px', color: '#64748b' }}>{new Date(evt.timestamp).toLocaleTimeString()}</div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontVariantNumeric: 'tabular-nums', fontSize: '14px', fontWeight: 700, color: '#ef4444' }}>{evt.z_score.toFixed(1)}σ</span>
                {getSeverityBadge(evt.severity)}
              </div>
            </div>
          ))
        )}
      </div>

      <button 
        onClick={() => router.push('/dga/anomaly-history')}
        style={{
          width: '100%', padding: '10px', background: '#3b82f6', border: 'none', 
          borderRadius: '8px', color: 'white', fontWeight: 700, fontSize: '13px',
          cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
          transition: 'background 0.2s'
        }}
        onMouseEnter={e => e.currentTarget.style.background = '#2563eb'}
        onMouseLeave={e => e.currentTarget.style.background = '#3b82f6'}
      >
        View Full History →
      </button>
    </div>
  );
}
