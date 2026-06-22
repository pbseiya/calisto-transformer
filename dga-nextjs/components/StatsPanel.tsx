'use client';

interface Statistics {
  device_name: string;
  avg_h2: number;
  min_h2: number;
  max_h2: number;
  avg_h2_stdev: number;
  total_h2_alarms: number;
  avg_co: number;
  min_co: number;
  max_co: number;
  avg_co_stdev: number;
  total_co_alarms: number;
  avg_wc: number;
  min_wc: number;
  max_wc: number;
  avg_wc_stdev: number;
  total_wc_alarms: number;
  first_reading: string;
  last_reading: string;
}

interface StatsPanelProps {
  statistics: Statistics[];
  thresholds: {
    h2: { warning: number; danger: number };
    co: { warning: number; danger: number };
    wc: { warning: number; danger: number };
  };
}

export default function StatsPanel({ statistics, thresholds }: StatsPanelProps) {
  const getStatusColor = (value: number, type: 'h2' | 'co' | 'wc'): string => {
    if (value >= thresholds[type].danger) return 'text-red-400';
    if (value >= thresholds[type].warning) return 'text-yellow-400';
    return 'text-green-400';
  };

  const getTrendIndicator = (min: number, max: number): string => {
    const range = max - min;
    if (range < 10) return '→';
    if (max > min * 1.5) return '↑';
    return '↓';
  };

  const getTrendColor = (min: number, max: number): string => {
    if (max > min * 1.5) return 'text-red-400';
    if (max < min) return 'text-green-400';
    return 'text-yellow-400';
  };

  return (
    <div>
      <h2 className="text-xl font-bold mb-4">Statistics Summary</h2>
      <div className="flex items-center gap-6 mb-4 text-sm text-slate-300 bg-slate-800 p-3 rounded-lg border border-slate-700">
        <span className="flex items-center gap-2">
          <span className="text-green-400 font-bold">↓</span>
          <span>Decreasing</span>
        </span>
        <span className="flex items-center gap-2">
          <span className="text-yellow-400 font-bold">→</span>
          <span>Stable</span>
        </span>
        <span className="flex items-center gap-2">
          <span className="text-red-400 font-bold">↑</span>
          <span>Increasing (&gt;50%)</span>
        </span>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {statistics.map((stat) => (
          <div
            key={stat.device_name}
            className="bg-slate-800 rounded-lg shadow-lg border border-slate-700 overflow-hidden"
          >
            <div className="bg-slate-700 px-6 py-4 border-b border-slate-600">
              <h3 className="text-lg font-bold text-slate-100">{stat.device_name}</h3>
              <p className="text-sm text-slate-300 mt-1">
                {new Date(stat.first_reading).toLocaleDateString()} -{' '}
                {new Date(stat.last_reading).toLocaleDateString()}
              </p>
            </div>

            <div className="p-6 space-y-4">
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <p className="text-sm text-slate-300 mb-1">H2 Avg</p>
                  <p className={`text-xl font-bold ${getStatusColor(stat.avg_h2, 'h2')}`}>
                    {stat.avg_h2.toFixed(1)}
                  </p>
                  <p className="text-sm text-slate-400">ppm</p>
                </div>
                <div>
                  <p className="text-sm text-slate-300 mb-1">H2 Range</p>
                  <p className="text-base text-slate-100">
                    {stat.min_h2.toFixed(1)} - {stat.max_h2.toFixed(1)}
                  </p>
                  <p className="text-sm text-slate-400">ppm</p>
                </div>
                <div>
                  <p className="text-sm text-slate-300 mb-1">H2 Alarms</p>
                  <p className={`text-xl font-bold ${stat.total_h2_alarms > 0 ? 'text-red-400' : 'text-green-400'}`}>
                    {stat.total_h2_alarms}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <p className="text-sm text-slate-300 mb-1">CO Avg</p>
                  <p className={`text-xl font-bold ${getStatusColor(stat.avg_co, 'co')}`}>
                    {stat.avg_co.toFixed(1)}
                  </p>
                  <p className="text-sm text-slate-400">ppm</p>
                </div>
                <div>
                  <p className="text-sm text-slate-300 mb-1">CO Range</p>
                  <p className="text-base text-slate-100">
                    {stat.min_co.toFixed(1)} - {stat.max_co.toFixed(1)}
                  </p>
                  <p className="text-sm text-slate-400">ppm</p>
                </div>
                <div>
                  <p className="text-sm text-slate-300 mb-1">CO Alarms</p>
                  <p className={`text-xl font-bold ${stat.total_co_alarms > 0 ? 'text-red-400' : 'text-green-400'}`}>
                    {stat.total_co_alarms}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <p className="text-sm text-slate-300 mb-1">WC Avg</p>
                  <p className={`text-xl font-bold ${getStatusColor(stat.avg_wc, 'wc')}`}>
                    {stat.avg_wc.toFixed(1)}
                  </p>
                  <p className="text-sm text-slate-400">ppm</p>
                </div>
                <div>
                  <p className="text-sm text-slate-300 mb-1">WC Range</p>
                  <p className="text-base text-slate-100">
                    {stat.min_wc.toFixed(1)} - {stat.max_wc.toFixed(1)}
                  </p>
                  <p className="text-sm text-slate-400">ppm</p>
                </div>
                <div>
                  <p className="text-sm text-slate-300 mb-1">WC Alarms</p>
                  <p className={`text-xl font-bold ${stat.total_wc_alarms > 0 ? 'text-red-400' : 'text-green-400'}`}>
                    {stat.total_wc_alarms}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3 pt-3 border-t border-slate-700">
                <div>
                  <p className="text-sm text-slate-300 mb-1">H2 Trend</p>
                  <p className={`text-xl font-bold ${getTrendColor(stat.min_h2, stat.max_h2)}`}>
                    {getTrendIndicator(stat.min_h2, stat.max_h2)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-slate-300 mb-1">CO Trend</p>
                  <p className={`text-xl font-bold ${getTrendColor(stat.min_co, stat.max_co)}`}>
                    {getTrendIndicator(stat.min_co, stat.max_co)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-slate-300 mb-1">WC Trend</p>
                  <p className={`text-xl font-bold ${getTrendColor(stat.min_wc, stat.max_wc)}`}>
                    {getTrendIndicator(stat.min_wc, stat.max_wc)}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3 pt-3 border-t border-slate-700">
                <div>
                  <p className="text-sm text-slate-300 mb-1">H2 StdDev</p>
                  <p className="text-base text-slate-100">{stat.avg_h2_stdev.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-300 mb-1">CO StdDev</p>
                  <p className="text-base text-slate-100">{stat.avg_co_stdev.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-300 mb-1">WC StdDev</p>
                  <p className="text-base text-slate-100">{stat.avg_wc_stdev.toFixed(2)}</p>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}