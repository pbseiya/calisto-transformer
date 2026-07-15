import { useEffect, useState } from 'react';

interface AnomalyHistory {
  device: string;
  current: { h2_zscore: number; co_zscore: number; wc_zscore: number };
  history: { timestamps: string[]; h2_zscores: number[]; co_zscores: number[]; wc_zscores: number[] };
  threshold: number;
}

interface TooltipState { x: number; y: number; timestamp: string; h2: number; co: number; wc: number }
interface GaugeProps { title: string; value: number; threshold: number }

function Gauge({ title, value, threshold }: GaugeProps) {
  const getColor = () => value >= threshold ? '#e94560' : value >= threshold * 0.7 ? '#ffd93d' : '#4ecca3';
  const getColorText = () => value >= threshold ? 'status-danger' : value >= threshold * 0.7 ? 'status-warning' : 'status-normal';
  return (
    <div className="gauge-card">
      <h3>{title}</h3>
      <div className="gauge">
        <svg width="180" height="100">
          <path d="M 10 90 A 80 80 0 0 1 170 90" fill="none" stroke="#2a3f5f" strokeWidth="15" />
          <path d="M 10 90 A 80 80 0 0 1 170 90" fill="none" stroke={getColor()} strokeWidth="15"
            strokeDasharray={`${Math.max(8, Math.min(100, value / threshold * 50))} 250`} strokeLinecap="round"
            style={{ filter: `drop-shadow(0 0 6px ${getColor()}50)` }} />
        </svg>
        <div className={`gauge-value ${getColorText()}`}>{value.toFixed(1)}</div>
      </div>
      <div className="gauge-label">Z-Score (Threshold: {threshold.toFixed(1)})</div>
    </div>
  );
}

export default function AnomalyGaugeTimeline() {
  const [data, setData] = useState<AnomalyHistory | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [zoomStart, setZoomStart] = useState(0);
  const [tooltip, setTooltip] = useState<TooltipState | null>(null);

  useEffect(() => { async function load() { try { const p = new URLSearchParams(window.location.search); const r = await fetch(`/dga-api/anomaly/history?device=${p.get('device') || 'DA115'}&hours=24`); if (!r.ok) throw new Error('Failed'); setData(await r.json()); } catch(e) { setError(e instanceof Error ? e.message : String(e)); } finally { setLoading(false); } } load(); }, []);

  const slice = () => { if (!data) return { t:[], h:[], c:[], w:[] }; return { t: data.history.timestamps.slice(zoomStart), h: data.history.h2_zscores.slice(zoomStart), c: data.history.co_zscores.slice(zoomStart), w: data.history.wc_zscores.slice(zoomStart) }; };
  const handleMouse = (e: React.MouseEvent<HTMLDivElement>) => { const rect = e.currentTarget.getBoundingClientRect(); const svgR = e.currentTarget.querySelector('.chart-svg')?.getBoundingClientRect(); if(!svgR||!data) return; const ratio = Math.max(0, Math.min(1, (e.clientX - svgR.left)/svgR.width)); const i = Math.round(ratio*(data.history.timestamps.length-1)); setTooltip({ x:e.clientX-rect.left, y:e.clientY-rect.top, timestamp:data.history.timestamps[i], h2:data.history.h2_zscores[i], co:data.history.co_zscores[i], wc:data.history.wc_zscores[i] }); };

  if (loading) return <div className="p-6"><div className="flex items-center gap-3 text-slate-400"><svg className="animate-spin h-6 w-6" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/></svg><span>Loading anomaly dashboard...</span></div></div>;
  if (error) return <div className="p-6"><div className="text-red-400">Error: {error}</div></div>;
  if (!data) return null;

  const s = slice();

  return (
    <div className="anomaly-dashboard">
      <div className="gauge-section">
        <Gauge title="Hydrogen (H2)" value={data.current.h2_zscore} threshold={data.threshold} />
        <Gauge title="Carbon Monoxide (CO)" value={data.current.co_zscore} threshold={data.threshold} />
        <Gauge title="Water Content (WC)" value={data.current.wc_zscore} threshold={data.threshold} />
      </div>
      <div className="timeline-section">
        <div className="timeline-header">
          <div className="timeline-title">Z-Score Timeline (24 Hours)</div>
          <div className="timeline-controls">
            <button onClick={() => setZoomStart(Math.max(0, zoomStart - 6))}>← Prev</button>
            <span style={{ opacity: 0.7 }}>Showing: {s.t.length}h</span>
            <button onClick={() => setZoomStart(0)}>Reset</button>
          </div>
          <div className="timeline-legend">
            <div className="legend-item"><div className="legend-color" style={{ background:'#e94560' }}></div><span>H2</span></div>
            <div className="legend-item"><div className="legend-color" style={{ background:'#ffd93d' }}></div><span>CO</span></div>
            <div className="legend-item"><div className="legend-color" style={{ background:'#4ecca3' }}></div><span>WC</span></div>
          </div>
        </div>
        <div className="timeline-chart" onMouseMove={handleMouse} onMouseLeave={() => setTooltip(null)}>
          {tooltip && (<div className="tooltip" style={{ left: tooltip.x, top: tooltip.y - 70 }}><div className="tooltip-time">{new Date(tooltip.timestamp).toLocaleString()}</div><div className="tooltip-row">• H2: {tooltip.h2.toFixed(2)}</div><div className="tooltip-row">• CO: {tooltip.co.toFixed(2)}</div><div className="tooltip-row">• WC: {tooltip.wc.toFixed(2)}</div></div>)}
          <div className="threshold-line threshold-3"></div>
          <div className="threshold-line threshold-0"></div>
          <svg className="chart-svg" width="100%" height="100%" viewBox="0 0 1000 230" preserveAspectRatio="none">
            <path d={s.h.map((z,i,a)=>`${i===0?'M':'L'} ${(i/(a.length-1||1))*1000} ${230-(z/6)*230}`).join(' ')} stroke="#e94560" strokeWidth="3" fill="none"/>
            <path d={s.c.map((z,i,a)=>`${i===0?'M':'L'} ${(i/(a.length-1||1))*1000} ${230-(z/6)*230}`).join(' ')} stroke="#ffd93d" strokeWidth="3" fill="none"/>
            <path d={s.w.map((z,i,a)=>`${i===0?'M':'L'} ${(i/(a.length-1||1))*1000} ${230-(z/6)*230}`).join(' ')} stroke="#4ecca3" strokeWidth="3" fill="none"/>
          </svg>
        </div>
        <div className="timeline-labels">{s.t.filter((_,i)=>i%2===0).map((ts,i)=><span key={i}>{new Date(ts).toLocaleTimeString('en-US', { hour:'2-digit', minute:'2-digit', hour12:false })}</span>)}</div>
      </div>
      <style jsx>{`
        .anomaly-dashboard{padding:20px;background:#0f1419;color:white;font-family:'Segoe UI',sans-serif}
        .gauge-section{display:grid;grid-template-columns:repeat(3,1fr);gap:20px;margin-bottom:30px}
        .gauge-card{background:#1a2332;border-radius:12px;padding:20px;text-align:center;border:2px solid #2a3f5f}
        .gauge-card h3{margin:0 0 15px;font-size:20px;font-weight:700;color:#fff;letter-spacing:.5px;text-shadow:0 1px 3px rgba(0,0,0,.5)}
        .gauge{width:180px;height:100px;margin:0 auto;position:relative}
        .gauge-value{position:absolute;bottom:0;left:50%;transform:translateX(-50%);font-size:32px;font-weight:bold}
        .gauge-label{margin-top:10px;font-size:14px;color:#aaa}
        .status-normal{color:#4ecca3}.status-warning{color:#ffd93d}.status-danger{color:#e94560}
        .timeline-section{background:#1a2332;border-radius:12px;padding:20px;border:2px solid #2a3f5f;position:relative}
        .timeline-header{display:flex;justify-content:space-between;align-items:center;margin-bottom:15px;flex-wrap:wrap;gap:10px}
        .timeline-title{font-size:20px;font-weight:bold}
        .timeline-controls{display:flex;align-items:center;gap:12px}
        .timeline-controls button{background:#2a3f5f;border:none;color:#fff;padding:6px 14px;border-radius:6px;cursor:pointer}
        .timeline-controls button:hover{background:#3b557a}
        .timeline-legend{display:flex;gap:15px;font-size:12px}
        .legend-item{display:flex;align-items:center;gap:5px}
        .legend-color{width:20px;height:3px}
        .timeline-chart{height:250px;position:relative;background:#0f1419;border-radius:8px;padding:10px;cursor:crosshair}
        .tooltip{position:absolute;background:rgba(15,20,25,.95);border:1px solid #2a3f5f;border-radius:8px;padding:10px 14px;font-size:13px;z-index:50;pointer-events:none;min-width:160px;box-shadow:0 4px 12px rgba(0,0,0,.5)}
        .tooltip-time{font-weight:bold;margin-bottom:4px;color:#ddd}
        .tooltip-row{color:#eee}
        .threshold-line{position:absolute;left:10px;right:10px;border-top:2px dashed}
        .threshold-3{bottom:50%;border-color:#e94560}
        .threshold-0{bottom:0;border-color:#4ecca3}
        .timeline-labels{display:flex;justify-content:space-between;margin-top:10px;font-size:11px;color:#666}
      `}</style>
    </div>
  );
}
