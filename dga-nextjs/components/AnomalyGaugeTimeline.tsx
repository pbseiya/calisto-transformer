import { useEffect, useState } from 'react';

interface AnomalyHistory {
  device: string;
  current: {
    h2_zscore: number;
    co_zscore: number;
    wc_zscore: number;
  };
  history: {
    timestamps: string[];
    h2_zscores: number[];
    co_zscores: number[];
    wc_zscores: number[];
  };
  threshold: number;
}

interface GaugeProps {
  title: string;
  value: number;
  threshold: number;
  color: string;
}

function Gauge({ title, value, threshold, color }: GaugeProps) {
  const percentage = Math.min(100, (value / (threshold * 2)) * 100);
  const rotation = (percentage / 100) * 180;
  
  const getStatusColor = () => {
    if (value >= threshold) return '#e94560'; // Red - Danger
    if (value >= threshold * 0.7) return '#ffd93d'; // Yellow - Warning
    return '#4ecca3'; // Green - Normal
  };

  const getStatusText = () => {
    if (value >= threshold) return 'status-danger';
    if (value >= threshold * 0.7) return 'status-warning';
    return 'status-normal';
  };

  return (
    <div className="gauge-card">
      <h3>{title}</h3>
      <div className="gauge">
        <svg width="180" height="100">
          {/* Background arc */}
          <path 
            d="M 10 90 A 80 80 0 0 1 170 90" 
            fill="none" 
            stroke="#2a3f5f" 
            strokeWidth="15"
          />
          {/* Value arc */}
          <path 
            d="M 10 90 A 80 80 0 0 1 170 90" 
            fill="none" 
            stroke={getStatusColor()} 
            strokeWidth="15"
            strokeDasharray={`${rotation * 1.4} 500`}
            strokeLinecap="round"
          />
        </svg>
        <div className={`gauge-value ${getStatusText()}`}>
          {value.toFixed(1)}
        </div>
      </div>
      <div className="gauge-label">
        Z-Score (Threshold: {threshold.toFixed(1)})
      </div>
    </div>
  );
}

export default function AnomalyGaugeTimeline() {
  const [data, setData] = useState<AnomalyHistory | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        // Get selected device from URL params or default to DA115
        const params = new URLSearchParams(window.location.search);
        const device = params.get('device') || 'DA115';
        
        const response = await fetch(`/dga-api/anomaly/history?device=${device}&hours=24`);
        if (!response.ok) throw new Error('Failed to load data');
        
        const result = await response.json();
        setData(result);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center gap-3 text-slate-400">
          <svg className="animate-spin h-6 w-6" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <span>Loading anomaly data...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="text-red-400">Error: {error}</div>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="anomaly-dashboard">
      {/* Gauge Section */}
      <div className="gauge-section">
        <Gauge 
          title="Hydrogen (H2)" 
          value={data.current.h2_zscore} 
          threshold={data.threshold}
          color="h2"
        />
        <Gauge 
          title="Carbon Monoxide (CO)" 
          value={data.current.co_zscore} 
          threshold={data.threshold}
          color="co"
        />
        <Gauge 
          title="Water Content (WC)" 
          value={data.current.wc_zscore} 
          threshold={data.threshold}
          color="wc"
        />
      </div>

      {/* Timeline Section */}
      <div className="timeline-section">
        <div className="timeline-header">
          <div className="timeline-title">
            Z-Score Timeline (24 Hours)
          </div>
          <div className="timeline-legend">
            <div className="legend-item">
              <div className="legend-color" style={{ background: '#e94560' }}></div>
              <span>H2</span>
            </div>
            <div className="legend-item">
              <div className="legend-color" style={{ background: '#ffd93d' }}></div>
              <span>CO</span>
            </div>
            <div className="legend-item">
              <div className="legend-color" style={{ background: '#4ecca3' }}></div>
              <span>WC</span>
            </div>
            <div className="legend-item">
              <div className="legend-color" style={{ 
                background: 'transparent',
                borderTop: '2px dashed #e94560',
                height: 0
              }}></div>
              <span>Threshold (z=3)</span>
            </div>
          </div>
        </div>

        <div className="timeline-chart">
          {/* Threshold lines */}
          <div className="threshold-line threshold-3"></div>
          <div className="threshold-line threshold-0"></div>

          {/* SVG Chart */}
          <svg width="100%" height="100%" viewBox="0 0 1000 230" preserveAspectRatio="none">
            {/* H2 Line */}
            <path 
              d={data.history.h2_zscores.map((z, i) => {
                const x = (i / (data.history.h2_zscores.length - 1)) * 1000;
                const y = 230 - (z / 6) * 230; // Scale: max z=6
                return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
              }).join(' ')}
              stroke="#e94560" 
              strokeWidth="3" 
              fill="none"
            />
            
            {/* CO Line */}
            <path 
              d={data.history.co_zscores.map((z, i) => {
                const x = (i / (data.history.co_zscores.length - 1)) * 1000;
                const y = 230 - (z / 6) * 230;
                return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
              }).join(' ')}
              stroke="#ffd93d" 
              strokeWidth="3" 
              fill="none"
            />
            
            {/* WC Line */}
            <path 
              d={data.history.wc_zscores.map((z, i) => {
                const x = (i / (data.history.wc_zscores.length - 1)) * 1000;
                const y = 230 - (z / 6) * 230;
                return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
              }).join(' ')}
              stroke="#4ecca3" 
              strokeWidth="3" 
              fill="none"
            />
          </svg>
        </div>

        {/* Time labels */}
        <div className="timeline-labels">
          {data.history.timestamps.filter((_, i) => i % 2 === 0).map((ts, i) => (
            <span key={i}>
              {new Date(ts).toLocaleTimeString('en-US', { 
                hour: '2-digit', 
                minute: '2-digit',
                hour12: false 
              })}
            </span>
          ))}
        </div>
      </div>

      <style jsx>{`
        .anomaly-dashboard {
          padding: 20px;
          background: #0f1419;
          color: white;
          font-family: 'Segoe UI', Arial, sans-serif;
        }

        .gauge-section {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 20px;
          margin-bottom: 30px;
        }

        .gauge-card {
          background: #1a2332;
          border-radius: 12px;
          padding: 20px;
          text-align: center;
          border: 2px solid #2a3f5f;
        }

        .gauge-card h3 {
          margin: 0 0 15px 0;
          font-size: 18px;
          color: #fff;
        }

        .gauge {
          width: 180px;
          height: 100px;
          margin: 0 auto;
          position: relative;
        }

        .gauge-value {
          position: absolute;
          bottom: 0;
          left: 50%;
          transform: translateX(-50%);
          font-size: 32px;
          font-weight: bold;
        }

        .gauge-label {
          margin-top: 10px;
          font-size: 14px;
          color: #aaa;
        }

        .status-normal { color: #4ecca3; }
        .status-warning { color: #ffd93d; }
        .status-danger { color: #e94560; }

        .timeline-section {
          background: #1a2332;
          border-radius: 12px;
          padding: 20px;
          border: 2px solid #2a3f5f;
        }

        .timeline-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 15px;
        }

        .timeline-title {
          font-size: 20px;
          font-weight: bold;
        }

        .timeline-legend {
          display: flex;
          gap: 15px;
          font-size: 12px;
        }

        .legend-item {
          display: flex;
          align-items: center;
          gap: 5px;
        }

        .legend-color {
          width: 20px;
          height: 3px;
        }

        .timeline-chart {
          height: 250px;
          position: relative;
          background: #0f1419;
          border-radius: 8px;
          padding: 10px;
        }

        .threshold-line {
          position: absolute;
          left: 10px;
          right: 10px;
          border-top: 2px dashed;
        }

        .threshold-3 {
          bottom: 50%;
          border-color: #e94560;
        }

        .threshold-0 {
          bottom: 0%;
          border-color: #4ecca3;
        }

        .timeline-labels {
          display: flex;
          justify-content: space-between;
          margin-top: 10px;
          font-size: 11px;
          color: #666;
        }
      `}</style>
    </div>
  );
}
