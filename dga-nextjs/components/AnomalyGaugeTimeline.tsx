import { useEffect, useState, useRef, useCallback } from 'react';

interface DeviceZScore {
  device: string;
  current: { h2_zscore: number; co_zscore: number; wc_zscore: number };
  history: { timestamps: string[]; h2_zscores: number[]; co_zscores: number[]; wc_zscores: number[] };
  threshold: number;
}

const STYLES = `
  .anomaly-dashboard { padding: 24px; background: #0f172a; color: #e2e8f0; font-family: 'Inter', -apple-system, sans-serif; }
  .dashboard-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; padding: 20px 24px; background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%); border-radius: 12px; border: 1px solid #334155; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.3); }
  .header-left { display: flex; align-items: center; gap: 20px; }
  .header-title { margin: 0; font-size: 22px; font-weight: 700; color: #f8fafc; letter-spacing: -0.5px; }
  .device-selector { display: flex; gap: 8px; flex-wrap: wrap; max-height: 120px; overflow-y: auto; }
  .device-btn { background: #334155; border: 1px solid #475569; color: #cbd5e1; padding: 6px 14px; border-radius: 6px; font-size: 13px; font-weight: 600; cursor: pointer; transition: all 0.2s; }
  .device-btn:hover { background: #475569; color: #f8fafc; }
  .device-btn.active { background: #3b82f6; border-color: #3b82f6; color: #fff; }
  .header-stats { display: flex; gap: 20px; }
  .stat-item { font-size: 14px; color: #94a3b8; }
  .stat-item strong { font-weight: 700; }
  .stat-item strong.normal { color: #10b981; }
  .stat-item strong.warning { color: #f59e0b; }
  .stat-item strong.danger { color: #ef4444; }
  .gauge-section { margin-bottom: 28px; }
  .gauge-row { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; }
  .gauge-card { background: #1e293b; border-radius: 12px; padding: 20px; border: 1px solid #334155; box-shadow: 0 2px 4px rgba(0,0,0,0.2); transition: transform 0.2s; }
  .gauge-card:hover { transform: translateY(-2px); box-shadow: 0 4px 8px rgba(0,0,0,0.3); }
  .gauge-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
  .gauge-device { font-size: 12px; font-weight: 700; color: #3b82f6; text-transform: uppercase; letter-spacing: 0.5px; }
  .gauge-title { font-size: 16px; font-weight: 700; color: #f8fafc; }
  .gauge { width: 160px; height: 90px; margin: 0 auto; position: relative; }
  .gauge-value { position: absolute; bottom: 0; left: 50%; transform: translateX(-50%); font-size: 28px; font-weight: 800; font-variant-numeric: tabular-nums; }
  .gauge-footer { display: flex; justify-content: space-between; align-items: center; margin-top: 12px; padding-top: 12px; border-top: 1px solid #334155; }
  .gauge-label { font-size: 12px; color: #64748b; font-weight: 600; }
  .gauge-threshold { font-size: 11px; color: #64748b; }
  .status-normal { color: #10b981; }
  .status-warning { color: #f59e0b; }
  .status-danger { color: #ef4444; }
  .timeline-section { background: #1e293b; border-radius: 12px; padding: 24px; border: 1px solid #334155; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.3); }
  .timeline-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; flex-wrap: wrap; gap: 10px; }
  .timeline-title { display: flex; flex-direction: column; gap: 4px; }
  .timeline-label { font-size: 18px; font-weight: 700; color: #f8fafc; }
  .timeline-subtitle { font-size: 13px; color: #64748b; }
  .timeline-controls { display: flex; gap: 8px; align-items: center; }
  .zoom-btn { background: #334155; border: 1px solid #475569; color: #cbd5e1; padding: 4px 12px; border-radius: 4px; font-size: 12px; cursor: pointer; }
  .zoom-btn:hover { background: #475569; }
  .timeline-legend { display: flex; align-items: center; gap: 16px; font-size: 12px; }
  .legend-item { display: flex; align-items: center; gap: 6px; color: #cbd5e1; }
  .legend-color { width: 20px; height: 3px; border-radius: 2px; }
  .legend-color.h2 { background: #ef4444; }
  .legend-color.co { background: #f59e0b; }
  .legend-color.wc { background: #10b981; }
  .legend-divider { width: 1px; height: 16px; background: #475569; }
  .legend-line { width: 20px; height: 2px; }
  .legend-line.ucl { background: #ef4444; border-top: 2px dashed #ef4444; }
  .legend-line.lcl { background: #ef4444; border-top: 2px dashed #ef4444; }
  .chart-container { position: relative; display: flex; gap: 12px; }
  .y-axis { position: relative; width: 48px; flex-shrink: 0; }
  .y-tick { position: absolute; right: 0; width: 100%; transform: translateY(-50%); }
  .y-tick-label { font-size: 11px; color: #64748b; font-weight: 600; font-variant-numeric: tabular-nums; }
  .y-tick-label.zero { color: #10b981; font-weight: 700; }
  .timeline-chart { flex: 1; height: 280px; position: relative; background: #0f172a; border-radius: 8px; border: 1px solid #334155; cursor: grab; overflow: hidden; }
  .timeline-chart:active { cursor: grabbing; }
  .control-line { position: absolute; left: 0; right: 0; pointer-events: none; }
  .control-line.ucl { border-top: 2px dashed #ef4444; }
  .control-line.center { border-top: 2px solid #10b981; opacity: 0.6; }
  .control-line.lcl { border-top: 2px dashed #ef4444; }
  .control-label { position: absolute; right: 8px; top: -18px; font-size: 10px; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.5px; }
  .tooltip { position: absolute; background: rgba(15, 23, 42, 0.97); border: 1px solid #334155; border-radius: 8px; padding: 12px 16px; font-size: 13px; z-index: 100; pointer-events: none; min-width: 180px; box-shadow: 0 8px 16px rgba(0,0,0,0.4); }
  .tooltip-header { font-weight: 700; margin-bottom: 8px; color: #f8fafc; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; }
  .tooltip-row { margin: 4px 0; font-weight: 600; font-variant-numeric: tabular-nums; }
  .tooltip-row.h2 { color: #ef4444; }
  .tooltip-row.co { color: #f59e0b; }
  .tooltip-row.wc { color: #10b981; }
  .x-axis { display: flex; justify-content: space-between; margin-top: 12px; padding: 0 12px; }
  .x-tick { font-size: 11px; color: #64748b; font-weight: 600; font-variant-numeric: tabular-nums; }
  .pan-hint { display: flex; align-items: center; justify-content: center; gap: 8px; margin-top: 16px; font-size: 12px; color: #64748b; }
  .loading-container, .error-container { display: flex; align-items: center; justify-content: center; gap: 12px; padding: 40px; color: #94a3b8; }
  .spinner { width: 24px; height: 24px; border: 3px solid #334155; border-top-color: #3b82f6; border-radius: 50%; animation: spin 0.8s linear infinite; }
  @keyframes spin { to { transform: rotate(360deg); } }
  .no-data-message { text-align: center; padding: 40px; color: #64748b; font-size: 14px; }
`;

function Gauge({ device, title, value, threshold }: { device: string; title: string; value: number; threshold: number }) {
  const getColor = () => value >= threshold ? '#ef4444' : value >= threshold * 0.7 ? '#f59e0b' : '#10b981';
  const getColorText = () => value >= threshold ? 'status-danger' : value >= threshold * 0.7 ? 'status-warning' : 'status-normal';
  const arcLength = Math.max(12, Math.min(100, (value / threshold) * 50));
  
  return (
    <div className="gauge-card">
      <div className="gauge-header">
        <span className="gauge-device">{device}</span>
        <span className="gauge-title">{title}</span>
      </div>
      <div className="gauge">
        <svg width="160" height="90" viewBox="0 0 160 90">
          <path d="M 10 80 A 70 70 0 0 1 150 80" fill="none" stroke="#1e293b" strokeWidth="12" strokeLinecap="round"/>
          <path d="M 10 80 A 70 70 0 0 1 150 80" fill="none" stroke={getColor()} strokeWidth="12"
            strokeDasharray={`${arcLength} 220`} strokeLinecap="round"
            style={{ filter: `drop-shadow(0 0 6px ${getColor()}50)`, transition: 'stroke-dasharray 0.5s ease' }} />
        </svg>
        <div className={`gauge-value ${getColorText()}`}>{value.toFixed(2)}</div>
      </div>
      <div className="gauge-footer">
        <span className="gauge-label">Z-Score</span>
        <span className="gauge-threshold">Limit: ±{threshold.toFixed(1)}σ</span>
      </div>
    </div>
  );
}

export default function AnomalyGaugeTimeline({ selectedDevices }: { selectedDevices?: string[] }) {
  const [devicesData, setDevicesData] = useState<DeviceZScore[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeDevice, setActiveDevice] = useState<string>('');
  const [tooltip, setTooltip] = useState<{x: number; y: number; timestamp: string; device: string; h2: number; co: number; wc: number} | null>(null);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [panOffset, setPanOffset] = useState(0);
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState(0);

  useEffect(() => {
    async function load() {
      try {
        const p = new URLSearchParams(window.location.search);
        const devices = (selectedDevices && selectedDevices.length > 0) ? selectedDevices : [p.get('device') || 'DA115'];
        
        const results = await Promise.allSettled(
          devices.map(async (dev) => {
            const r = await fetch(`/dga-api/anomaly/history?device=${dev}&hours=24`);
            if (!r.ok) {
              const err = await r.json().catch(() => ({ detail: 'Unknown error' }));
              throw new Error(err.detail || `HTTP ${r.status}`);
            }
            return await r.json();
          })
        );
        
        const successful = results
          .filter((r): r is PromiseFulfilledResult<DeviceZScore> => r.status === 'fulfilled')
          .map(r => r.value);
        
        const failed = results
          .filter((r): r is PromiseRejectedResult => r.status === 'rejected')
          .map(r => r.reason.message);
        
        setDevicesData(successful);
        
        if (successful.length > 0) {
          setActiveDevice(successful[0].device);
        }
        
        if (failed.length > 0 && successful.length === 0) {
          setError(`Failed to load anomaly data: ${failed.join(', ')}`);
        }
      } catch(e) {
        setError(e instanceof Error ? e.message : String(e));
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [selectedDevices]);

  const activeData = devicesData.find(d => d.device === activeDevice);
  const zScoreToY = (z: number) => 230 - ((z + 6) / 12) * 230;
  const yAxisTicks = [-6, -4, -2, 0, 2, 4, 6];

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (isPanning) {
      const delta = e.clientX - panStart;
      setPanOffset(prev => prev + delta * 0.5);
      setPanStart(e.clientX);
      return;
    }
    
    const rect = e.currentTarget.getBoundingClientRect();
    const svgR = e.currentTarget.querySelector('svg')?.getBoundingClientRect();
    if (!svgR || !activeData) return;
    const ratio = Math.max(0, Math.min(1, (e.clientX - svgR.left) / svgR.width));
    const idx = Math.round(ratio * (activeData.history.timestamps.length - 1));
    setTooltip({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
      timestamp: activeData.history.timestamps[idx],
      device: activeDevice,
      h2: activeData.history.h2_zscores[idx],
      co: activeData.history.co_zscores[idx],
      wc: activeData.history.wc_zscores[idx],
    });
  }, [isPanning, panStart, activeData, activeDevice]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    setIsPanning(true);
    setPanStart(e.clientX);
  }, []);

  const handleMouseUp = useCallback(() => {
    setIsPanning(false);
  }, []);

  const handleMouseLeave = useCallback(() => {
    setIsPanning(false);
    setTooltip(null);
  }, []);

  const handleZoomIn = () => setZoomLevel(prev => Math.min(prev * 1.5, 4));
  const handleZoomOut = () => setZoomLevel(prev => Math.max(prev / 1.5, 1));
  const handleZoomReset = () => { setZoomLevel(1); setPanOffset(0); };

  if (loading) return <div className="loading-container"><div className="spinner"/><span>Loading anomaly data...</span></div>;
  if (error) return <div className="error-container">Error: {error}</div>;
  if (devicesData.length === 0) return <div className="no-data-message">No anomaly data available for selected devices</div>;

  const visibleData = activeData ? {
    timestamps: activeData.history.timestamps.slice(
      Math.max(0, Math.floor(panOffset / 10)),
      Math.min(activeData.history.timestamps.length, Math.floor(panOffset / 10) + Math.ceil(activeData.history.timestamps.length / zoomLevel))
    ),
    h2: activeData.history.h2_zscores.slice(
      Math.max(0, Math.floor(panOffset / 10)),
      Math.min(activeData.history.h2_zscores.length, Math.floor(panOffset / 10) + Math.ceil(activeData.history.h2_zscores.length / zoomLevel))
    ),
    co: activeData.history.co_zscores.slice(
      Math.max(0, Math.floor(panOffset / 10)),
      Math.min(activeData.history.co_zscores.length, Math.floor(panOffset / 10) + Math.ceil(activeData.history.co_zscores.length / zoomLevel))
    ),
    wc: activeData.history.wc_zscores.slice(
      Math.max(0, Math.floor(panOffset / 10)),
      Math.min(activeData.history.wc_zscores.length, Math.floor(panOffset / 10) + Math.ceil(activeData.history.wc_zscores.length / zoomLevel))
    ),
  } : null;

  return (
    <div className="anomaly-dashboard">
      <style>{STYLES}</style>
      
      <div className="dashboard-header">
        <div className="header-left">
          <h2 className="header-title">Z-Score Anomaly Monitor</h2>
          <div className="device-selector">
            {devicesData.map(d => (
              <button key={d.device} className={`device-btn ${d.device === activeDevice ? 'active' : ''}`} onClick={() => setActiveDevice(d.device)}>
                {d.device}
              </button>
            ))}
          </div>
        </div>
        <div className="header-stats">
          {activeData && (
            <>
              <span className="stat-item">H₂: <strong className={activeData.current.h2_zscore >= activeData.threshold ? 'danger' : activeData.current.h2_zscore >= activeData.threshold*0.7 ? 'warning' : 'normal'}>{activeData.current.h2_zscore.toFixed(2)}σ</strong></span>
              <span className="stat-item">CO: <strong className={activeData.current.co_zscore >= activeData.threshold ? 'danger' : activeData.current.co_zscore >= activeData.threshold*0.7 ? 'warning' : 'normal'}>{activeData.current.co_zscore.toFixed(2)}σ</strong></span>
              <span className="stat-item">WC: <strong className={activeData.current.wc_zscore >= activeData.threshold ? 'danger' : activeData.current.wc_zscore >= activeData.threshold*0.7 ? 'warning' : 'normal'}>{activeData.current.wc_zscore.toFixed(2)}σ</strong></span>
            </>
          )}
        </div>
      </div>

      <div className="gauge-section">
        {activeData && (
          <div className="gauge-row">
            <Gauge device={activeDevice} title="H₂" value={activeData.current.h2_zscore} threshold={activeData.threshold} />
            <Gauge device={activeDevice} title="CO" value={activeData.current.co_zscore} threshold={activeData.threshold} />
            <Gauge device={activeDevice} title="WC" value={activeData.current.wc_zscore} threshold={activeData.threshold} />
          </div>
        )}
      </div>

      {activeData && visibleData && (
        <div className="timeline-section">
          <div className="timeline-header">
            <div className="timeline-title">
              <span className="timeline-label">Z-Score Timeline</span>
              <span className="timeline-subtitle">24h History · {activeDevice}</span>
            </div>
            <div className="timeline-controls">
              <button className="zoom-btn" onClick={handleZoomOut}>−</button>
              <span style={{ fontSize: '12px', color: '#94a3b8' }}>{zoomLevel.toFixed(1)}x</span>
              <button className="zoom-btn" onClick={handleZoomIn}>+</button>
              <button className="zoom-btn" onClick={handleZoomReset}>Reset</button>
            </div>
            <div className="timeline-legend">
              <div className="legend-item"><div className="legend-color h2"/><span>H₂</span></div>
              <div className="legend-item"><div className="legend-color co"/><span>CO</span></div>
              <div className="legend-item"><div className="legend-color wc"/><span>WC</span></div>
              <div className="legend-divider"/>
              <div className="legend-item"><div className="legend-line ucl"/><span>UCL +3σ</span></div>
              <div className="legend-item"><div className="legend-line lcl"/><span>LCL -3σ</span></div>
            </div>
          </div>

          <div className="chart-container">
            <div className="y-axis">
              {yAxisTicks.map(tick => (
                <div key={tick} className="y-tick" style={{ top: `${zScoreToY(tick) / 230 * 100}%` }}>
                  <span className={`y-tick-label ${tick === 0 ? 'zero' : ''}`}>
                    {tick === 0 ? '0' : `${tick > 0 ? '+' : ''}${tick}σ`}
                  </span>
                </div>
              ))}
            </div>

            <div 
              className="timeline-chart"
              onMouseMove={handleMouseMove}
              onMouseDown={handleMouseDown}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseLeave}
            >
              <div className="control-line ucl" style={{ top: `${zScoreToY(3) / 230 * 100}%` }}><span className="control-label">UCL +3σ</span></div>
              <div className="control-line center" style={{ top: `${zScoreToY(0) / 230 * 100}%` }}><span className="control-label">Center 0σ</span></div>
              <div className="control-line lcl" style={{ top: `${zScoreToY(-3) / 230 * 100}%` }}><span className="control-label">LCL -3σ</span></div>

              {tooltip && (
                <div className="tooltip" style={{ left: tooltip.x, top: tooltip.y - 80 }}>
                  <div className="tooltip-header">{tooltip.device} · {new Date(tooltip.timestamp).toLocaleTimeString()}</div>
                  <div className="tooltip-row h2">H₂: {tooltip.h2.toFixed(2)}σ</div>
                  <div className="tooltip-row co">CO: {tooltip.co.toFixed(2)}σ</div>
                  <div className="tooltip-row wc">WC: {tooltip.wc.toFixed(2)}σ</div>
                </div>
              )}

              <svg width="100%" height="100%" viewBox="0 0 1000 230" preserveAspectRatio="none">
                {yAxisTicks.filter(t => t !== 0).map(tick => (
                  <line key={tick} x1="0" y1={zScoreToY(tick)} x2="1000" y2={zScoreToY(tick)} stroke="#1e293b" strokeWidth="1" strokeDasharray="4 4"/>
                ))}
                <path d={visibleData.h2.map((z,i,a)=>`${i===0?'M':'L'} ${(i/(a.length-1||1))*1000} ${zScoreToY(z)}`).join(' ')} stroke="#ef4444" strokeWidth="2.5" fill="none" strokeLinejoin="round"/>
                <path d={visibleData.co.map((z,i,a)=>`${i===0?'M':'L'} ${(i/(a.length-1||1))*1000} ${zScoreToY(z)}`).join(' ')} stroke="#f59e0b" strokeWidth="2.5" fill="none" strokeLinejoin="round"/>
                <path d={visibleData.wc.map((z,i,a)=>`${i===0?'M':'L'} ${(i/(a.length-1||1))*1000} ${zScoreToY(z)}`).join(' ')} stroke="#10b981" strokeWidth="2.5" fill="none" strokeLinejoin="round"/>
              </svg>
            </div>
          </div>

          <div className="x-axis">
            {visibleData.timestamps.filter((_,i) => i % Math.max(1, Math.ceil(visibleData.timestamps.length / 8)) === 0).map((ts,i) => (
              <span key={i} className="x-tick">{new Date(ts).toLocaleTimeString('en-US', { hour:'2-digit', minute:'2-digit', hour12:false })}</span>
            ))}
          </div>

          <div className="pan-hint">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><path d="M8 0l-4 4h3v4H3V5L0 8l3 3V8h4v4H4l4 4 4-4h-3V8h4v3l3-3-3-3v3h-4V4h3z"/></svg>
            <span>Drag to pan · Scroll to zoom · Hover for details</span>
          </div>
        </div>
      )}
    </div>
  );
}
