'use client';

import { useState, useEffect } from 'react';

interface DailySummary {
  event_count: number;
  critical_count: number;
  warning_count: number;
  max_zscore: number;
}

interface CalendarData {
  [day: string]: DailySummary;
}

export default function CalendarHeatmap({ device = 'DA115' }: { device?: string }) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [data, setData] = useState<CalendarData>({});
  const [loading, setLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth() + 1;
        const res = await fetch(`/dga-api/anomaly/daily-summary?device=${device}&year=${year}&month=${month}`);
        const result = await res.json();
        setData(result.summary || {});
      } catch(e) {
        console.error('Failed to load calendar data:', e);
      } finally {
        setLoading(false);
      }
    }
    
    loadData();
  }, [currentDate, device]);

  const goToPrevMonth = () => {
    setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const getColorForCount = (count: number, severity: string) => {
    if (count === 0) return '#1e293b';
    if (severity === 'critical') {
      if (count >= 3) return '#991b1b';
      if (count >= 2) return '#dc2626';
      return '#ef4444';
    } else {
      if (count >= 3) return '#ca8a04';
      if (count >= 2) return '#eab308';
      return '#fde68a';
    }
  };

  const daysInMonth = getDaysInMonth(currentDate);
  const firstDay = getFirstDayOfMonth(currentDate);
  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  // Generate calendar grid
  const cells: Array<{ day: number | null; dateStr: string }> = [];
  
  // Empty cells before first day
  for (let i = 0; i < firstDay; i++) {
    cells.push({ day: null, dateStr: '' });
  }
  
  // Day cells
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    cells.push({ day: d, dateStr });
  }

  return (
    <div style={{ background: '#1e293b', borderRadius: '10px', padding: '20px', border: '1px solid #334155' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <button onClick={goToPrevMonth} style={{ background: '#334155', border: '1px solid #475569', color: '#cbd5e1', width: '32px', height: '32px', borderRadius: '6px', cursor: 'pointer', fontSize: '16px' }}>←</button>
        <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: '#f8fafc' }}>{monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}</h3>
        <button onClick={goToNextMonth} style={{ background: '#334155', border: '1px solid #475569', color: '#cbd5e1', width: '32px', height: '32px', borderRadius: '6px', cursor: 'pointer', fontSize: '16px' }}>→</button>
      </div>

      {/* Legend */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '16px', fontSize: '11px', color: '#94a3b8' }}>
        <span>No events</span>
        <span style={{ display: 'inline-block', width: '12px', height: '12px', background: '#fde68a', verticalAlign: 'middle', marginRight: '2px' }} /> Warning
        <span style={{ display: 'inline-block', width: '12px', height: '12px', background: '#ef4444', verticalAlign: 'middle', marginRight: '2px' }} /> Critical
      </div>

      {/* Calendar Grid */}
      {loading ? (
        <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>Loading...</div>
      ) : (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px', marginBottom: '8px' }}>
            {dayNames.map(d => (
              <div key={d} style={{ textAlign: 'center', fontSize: '11px', fontWeight: 600, color: '#64748b', padding: '4px 0' }}>{d}</div>
            ))}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px' }}>
            {cells.map((cell, i) => {
              if (cell.day === null) {
                return <div key={`empty-${i}`} />;
              }

              const dayData = data[cell.dateStr];
              const count = dayData?.event_count || 0;
              const isCritical = dayData?.critical_count > 0;
              const bgColor = count > 0 ? getColorForCount(count, isCritical ? 'critical' : 'warning') : '#1e293b';

              return (
                <div
                  key={cell.dateStr}
                  onClick={() => setSelectedDay(cell.dateStr)}
                  style={{
                    aspectRatio: '1',
                    background: bgColor,
                    borderRadius: '6px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    border: selectedDay === cell.dateStr ? '2px solid #3b82f6' : '1px solid rgba(51,65,85,0.3)',
                    transition: 'transform 0.1s, border-color 0.1s',
                    position: 'relative'
                  }}
                  onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.05)'}
                  onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                  title={count > 0 ? `${count} events (${isCritical ? 'critical' : 'warning'})` : 'No events'}
                >
                  <span style={{ fontSize: '11px', fontWeight: 500, color: count > 0 ? '#fff' : '#94a3b8' }}>{cell.day}</span>
                  {count > 0 && (
                    <span style={{ fontSize: '9px', color: isCritical ? '#fca5a5' : '#fde68a', marginTop: '2px' }}>{count}</span>
                  )}
                </div>
              );
            })}
          </div>

          {/* Selected Day Detail */}
          {selectedDay && data[selectedDay] && (
            <div style={{ marginTop: '16px', padding: '12px', background: '#0f172a', borderRadius: '8px', border: '1px solid #334155' }}>
              <div style={{ fontSize: '12px', fontWeight: 700, color: '#93c5fd', marginBottom: '8px' }}>
                {new Date(selectedDay).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px', fontSize: '12px' }}>
                <div><span style={{ color: '#64748b' }}>Total Events:</span> <strong style={{ color: '#e2e8f0' }}>{data[selectedDay].event_count}</strong></div>
                <div><span style={{ color: '#64748b' }}>Critical:</span> <strong style={{ color: '#ef4444' }}>{data[selectedDay].critical_count}</strong></div>
                <div><span style={{ color: '#64748b' }}>Warning:</span> <strong style={{ color: '#f59e0b' }}>{data[selectedDay].warning_count}</strong></div>
                <div><span style={{ color: '#64748b' }}>Max Z-Score:</span> <strong style={{ color: '#ef4444' }}>{data[selectedDay].max_zscore.toFixed(2)}σ</strong></div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
