'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import ExportButton from '@/components/ExportButton';
import CalendarHeatmap from '@/components/CalendarHeatmap';

interface AnomalyEvent {
  id: string;
  device: string;
  timestamp: string;
  gas_type: string;
  z_score: number;
  duration_minutes: number;
  reading_count: number;
  severity: 'warning' | 'critical';
  is_confirmed: boolean;
}

export default function AnomalyHistoryPage() {
  const router = useRouter();
  
  // State
  const [events, setEvents] = useState<AnomalyEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    devices: '',
    start: '',
    end: '',
    min_zscore: 3.5,
    min_duration: 30,
    min_readings: 3,
    severity: 'all',
    page: 1,
    limit: 50
  });
  const [pagination, setPagination] = useState({ total: 0, page: 1, total_pages: 1 });
  
  // Load events on mount and when filters change
  useEffect(() => {
    async function loadEvents() {
      setLoading(true);
      
      const params = new URLSearchParams();
      if (filters.devices) params.set('devices', filters.devices);
      if (filters.start) params.set('start', filters.start);
      if (filters.end) params.set('end', filters.end);
      params.set('min_zscore', String(filters.min_zscore));
      params.set('min_duration', String(filters.min_duration));
      params.set('min_readings', String(filters.min_readings));
      if (filters.severity !== 'all') params.set('severity', filters.severity);
      params.set('page', String(filters.page));
      params.set('limit', String(filters.limit));
      
      try {
        const res = await fetch(`/dga-api/anomaly/events?${params.toString()}`);
        const data = await res.json();
        
        setEvents(data.events || []);
        setPagination({
          total: data.total || 0,
          page: data.page || 1,
          total_pages: data.total_pages || 1
        });
      } catch(e) {
        console.error('Failed to fetch events:', e);
      } finally {
        setLoading(false);
      }
    }
    
    loadEvents();
  }, [filters]);
  
  const handleFilterChange = (key: string, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value, page: key === 'devices' || key === 'severity' ? 1 : prev.page }));
  };
  
  const getSeverityColor = (sev: string) => {
    return sev === 'critical' 
      ? { bg: 'rgba(239,68,68,0.15)', color: '#fca5a5', border: 'rgba(239,68,68,0.4)' }
      : { bg: 'rgba(245,158,11,0.15)', color: '#fde68a', border: 'rgba(245,158,11,0.4)' };
  };
  
  return (
    <div style={{ padding: '24px', background: '#0f172a', minHeight: '100vh', color: '#e2e8f0', fontFamily: "'Inter', system-ui, sans-serif" }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', paddingBottom: '16px', borderBottom: '1px solid #334155' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '24px', fontWeight: 700 }}>Anomaly History</h1>
          <p style={{ margin: '4px 0 0', color: '#94a3b8', fontSize: '14px' }}>Review past anomaly events with noise filtering</p>
        </div>
        <button onClick={() => router.push('/dga')} style={{ background: '#334155', border: '1px solid #475569', color: '#cbd5e1', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', fontSize: '13px' }}>
          ← Back to Dashboard
        </button>
      </div>
      
      {/* Filter Bar */}
      <div style={{ background: '#1e293b', borderRadius: '8px', padding: '16px', marginBottom: '20px', border: '1px solid #334155' }}>
        <div style={{ marginBottom: '8px', fontSize: '13px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Noise Filter</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '12px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '12px', marginBottom: '4px', color: '#94a3b8' }}>Devices (comma-separated)</label>
            <input 
              type="text" 
              value={filters.devices}
              onChange={e => handleFilterChange('devices', e.target.value)}
              placeholder="DA115,DA08,..."
              style={{ width: '100%', padding: '6px 10px', background: '#0f172a', border: '1px solid #334155', borderRadius: '4px', color: '#e2e8f0', fontSize: '13px', boxSizing: 'border-box' }}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '12px', marginBottom: '4px', color: '#94a3b8' }}>Start Date</label>
            <input 
              type="date" 
              value={filters.start}
              onChange={e => handleFilterChange('start', e.target.value)}
              style={{ width: '100%', padding: '6px 10px', background: '#0f172a', border: '1px solid #334155', borderRadius: '4px', color: '#e2e8f0', fontSize: '13px', boxSizing: 'border-box' }}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '12px', marginBottom: '4px', color: '#94a3b8' }}>End Date</label>
            <input 
              type="date" 
              value={filters.end}
              onChange={e => handleFilterChange('end', e.target.value)}
              style={{ width: '100%', padding: '6px 10px', background: '#0f172a', border: '1px solid #334155', borderRadius: '4px', color: '#e2e8f0', fontSize: '13px', boxSizing: 'border-box' }}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '12px', marginBottom: '4px', color: '#94a3b8' }}>Min Z-Score</label>
            <input 
              type="number" 
              step="0.5"
              value={filters.min_zscore}
              onChange={e => handleFilterChange('min_zscore', parseFloat(e.target.value))}
              style={{ width: '100%', padding: '6px 10px', background: '#0f172a', border: '1px solid #334155', borderRadius: '4px', color: '#e2e8f0', fontSize: '13px', boxSizing: 'border-box' }}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '12px', marginBottom: '4px', color: '#94a3b8' }}>Min Duration (min)</label>
            <input 
              type="number" 
              value={filters.min_duration}
              onChange={e => handleFilterChange('min_duration', parseInt(e.target.value))}
              style={{ width: '100%', padding: '6px 10px', background: '#0f172a', border: '1px solid #334155', borderRadius: '4px', color: '#e2e8f0', fontSize: '13px', boxSizing: 'border-box' }}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '12px', marginBottom: '4px', color: '#94a3b8' }}>Severity</label>
            <select 
              value={filters.severity}
              onChange={e => handleFilterChange('severity', e.target.value)}
              style={{ width: '100%', padding: '6px 10px', background: '#0f172a', border: '1px solid #334155', borderRadius: '4px', color: '#e2e8f0', fontSize: '13px', boxSizing: 'border-box' }}
            >
              <option value="all">All</option>
              <option value="warning">Warning</option>
              <option value="critical">Critical</option>
            </select>
          </div>
        </div>
      </div>
      
      <CalendarHeatmap device={filters.devices.split(',')[0] || 'DA115'} />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
        <span style={{ fontSize: '13px', color: '#94a3b8' }}>
          Showing {events.length} of {pagination.total} events (page {pagination.page}/{pagination.total_pages})
        </span>
        <ExportButton filters={filters} />
      </div>
      
      {/* Events Table */}
      <div style={{ background: '#1e293b', borderRadius: '8px', overflow: 'hidden', border: '1px solid #334155' }}>
        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>Loading...</div>
        ) : events.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>No events found matching filters</div>
        ) : (
          <>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #334155', background: '#0f172a' }}>
                  <th style={{ padding: '10px 16px', textAlign: 'left', fontWeight: 600, color: '#94a3b8', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Time</th>
                  <th style={{ padding: '10px 16px', textAlign: 'left', fontWeight: 600, color: '#94a3b8', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Device</th>
                  <th style={{ padding: '10px 16px', textAlign: 'left', fontWeight: 600, color: '#94a3b8', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Gas</th>
                  <th style={{ padding: '10px 16px', textAlign: 'right', fontWeight: 600, color: '#94a3b8', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Z-Score</th>
                  <th style={{ padding: '10px 16px', textAlign: 'right', fontWeight: 600, color: '#94a3b8', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Duration</th>
                  <th style={{ padding: '10px 16px', textAlign: 'center', fontWeight: 600, color: '#94a3b8', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {events.map(evt => {
                  const colors = getSeverityColor(evt.severity);
                  return (
                    <tr key={evt.id} style={{ borderBottom: '1px solid rgba(51,65,85,0.4)' }}>
                      <td style={{ padding: '10px 16px', whiteSpace: 'nowrap' }}>{new Date(evt.timestamp).toLocaleString()}</td>
                      <td style={{ padding: '10px 16px', fontWeight: 600, color: '#93c5fd' }}>{evt.device}</td>
                      <td style={{ padding: '10px 16px' }}>{evt.gas_type}</td>
                      <td style={{ padding: '10px 16px', textAlign: 'right', fontVariantNumeric: 'tabular-nums', fontWeight: 700 }}>{evt.z_score.toFixed(2)}σ</td>
                      <td style={{ padding: '10px 16px', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{evt.duration_minutes}m ({evt.reading_count} readings)</td>
                      <td style={{ padding: '10px 16px', textAlign: 'center' }}>
                        <span style={{ 
                          display: 'inline-block', padding: '3px 10px', borderRadius: '20px', 
                          background: colors.bg, color: colors.color, border: `1px solid ${colors.border}`,
                          fontSize: '11px', fontWeight: 600, textTransform: 'capitalize'
                        }}>
                          {evt.severity}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            
            {/* Pagination */}
            {pagination.total_pages > 1 && (
              <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', padding: '12px', borderTop: '1px solid #334155' }}>
                <button 
                  disabled={filters.page <= 1}
                  onClick={() => handleFilterChange('page', filters.page - 1)}
                  style={{ background: '#334155', border: '1px solid #475569', color: '#cbd5e1', padding: '6px 14px', borderRadius: '4px', cursor: filters.page <= 1 ? 'not-allowed' : 'pointer', opacity: filters.page <= 1 ? 0.5 : 1, fontSize: '13px' }}
                >
                  Previous
                </button>
                <span style={{ padding: '6px 14px', color: '#94a3b8', fontSize: '13px' }}>Page {pagination.page} / {pagination.total_pages}</span>
                <button 
                  disabled={filters.page >= pagination.total_pages}
                  onClick={() => handleFilterChange('page', filters.page + 1)}
                  style={{ background: '#334155', border: '1px solid #475569', color: '#cbd5e1', padding: '6px 14px', borderRadius: '4px', cursor: filters.page >= pagination.total_pages ? 'not-allowed' : 'pointer', opacity: filters.page >= pagination.total_pages ? 0.5 : 1, fontSize: '13px' }}
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
