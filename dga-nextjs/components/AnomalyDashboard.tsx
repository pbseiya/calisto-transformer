import { useEffect, useState } from 'react';
import { getAllDeviceStatus, DeviceStatus } from '@/lib/dga-api';

export default function AnomalyDashboard() {
  const [devices, setDevices] = useState<DeviceStatus[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const data = await getAllDeviceStatus();
        setDevices(data);
      } catch (error) {
        console.error('Failed to load data:', error);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center gap-3 text-slate-400 mb-6">
          <svg className="animate-spin h-6 w-6" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <span>Loading devices...</span>
        </div>
      </div>
    );
  }

  const getZscoreColor = (zscore: number) => {
    const abs = Math.abs(zscore);
    if (abs < 2) return 'text-green-400';
    if (abs < 3) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getTrendIcon = (direction: string) => {
    switch (direction) {
      case 'increasing': return '↑';
      case 'decreasing': return '↓';
      default: return '→';
    }
  };

  const getTrendColor = (direction: string, detected: boolean) => {
    if (!detected) return 'text-slate-500';
    switch (direction) {
      case 'increasing': return 'text-red-400';
      case 'decreasing': return 'text-green-400';
      default: return 'text-slate-400';
    }
  };

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-2xl font-bold text-slate-100">Device Anomaly Dashboard</h2>
        <div className="flex gap-4 text-sm">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-green-400"></span>
            <span className="text-slate-400">Normal (&lt;2σ)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-yellow-400"></span>
            <span className="text-slate-400">Warning (2-3σ)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-red-400"></span>
            <span className="text-slate-400">Critical (&gt;3σ)</span>
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {devices.map((d) => {
          const h2Z = d.anomaly.details.h2_zscore;
          const coZ = d.anomaly.details.co_zscore;
          const wcZ = d.anomaly.details.wc_zscore;
          const maxZ = Math.max(Math.abs(h2Z), Math.abs(coZ), Math.abs(wcZ));
          
          return (
            <div 
              key={d.device} 
              className={`border rounded-lg p-4 transition-all ${
                d.anomaly.is_anomaly 
                  ? 'border-red-500/50 bg-red-900/10' 
                  : 'border-slate-700/50 bg-slate-800/50'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold text-lg text-slate-100">{d.device}</h3>
                <span className={`inline-block px-2 py-1 rounded text-xs ${
                  d.anomaly.is_anomaly 
                    ? 'bg-red-500/20 text-red-400' 
                    : 'bg-green-500/20 text-green-400'
                }`}>
                  {d.anomaly.is_anomaly ? '⚠️ Anomaly' : '✓ Normal'}
                </span>
              </div>
              
              <div className="space-y-2 mb-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-400">H2</span>
                  <span className={`font-mono font-semibold ${getZscoreColor(h2Z)}`}>
                    {h2Z.toFixed(2)}σ
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-400">CO</span>
                  <span className={`font-mono font-semibold ${getZscoreColor(coZ)}`}>
                    {coZ.toFixed(2)}σ
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-400">WC</span>
                  <span className={`font-mono font-semibold ${getZscoreColor(wcZ)}`}>
                    {wcZ.toFixed(2)}σ
                  </span>
                </div>
              </div>
              
              {(d.drift.drift_detected || Object.values(d.trend.gases).some(g => g.trend_detected)) && (
                <div className="pt-3 border-t border-slate-700/50 space-y-1">
                  {d.drift.drift_detected && (
                    <div className="text-xs text-orange-400 flex items-center gap-1">
                      <span>⚠️</span>
                      <span>Drift detected</span>
                    </div>
                  )}
                  
                  {Object.entries(d.trend.gases).map(([gas, data]) => 
                    data.trend_detected && (
                      <div key={gas} className={`text-xs flex items-center gap-1 ${getTrendColor(data.direction, data.trend_detected)}`}>
                        <span>{getTrendIcon(data.direction)}</span>
                        <span className="uppercase">{gas}</span>
                        <span className="opacity-75">({data.slope.toFixed(3)}/day)</span>
                      </div>
                    )
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
