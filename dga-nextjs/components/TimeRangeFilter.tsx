'use client';

interface TimeRangeFilterProps {
  timeRange: string;
  customStart: string;
  customEnd: string;
  onTimeRangeChange: (range: string) => void;
  onCustomStartChange: (start: string) => void;
  onCustomEndChange: (end: string) => void;
}

export default function TimeRangeFilter({
  timeRange,
  customStart,
  customEnd,
  onTimeRangeChange,
  onCustomStartChange,
  onCustomEndChange,
}: TimeRangeFilterProps) {
  const presets = [
    { value: '15min', label: '15m' },
    { value: '1hr', label: '1h' },
    { value: '6hr', label: '6h' },
    { value: '24hr', label: '24h' },
    { value: '7d', label: '7d' },
    { value: '30d', label: '30d' },
  ];

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-slate-300">Time Range:</span>
      <div className="flex gap-1 bg-slate-700 rounded-lg p-1">
        {presets.map((preset) => (
          <button
            key={preset.value}
            onClick={() => onTimeRangeChange(preset.value)}
            className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${
              timeRange === preset.value
                ? 'bg-blue-600 text-white'
                : 'text-slate-300 hover:bg-slate-600'
            }`}
          >
            {preset.label}
          </button>
        ))}
      </div>

      <button
        onClick={() => onTimeRangeChange(timeRange === 'custom' ? '24hr' : 'custom')}
        className={`px-3 py-2 rounded text-sm transition-colors ${
          timeRange === 'custom' ? 'bg-blue-600 hover:bg-blue-700' : 'bg-slate-700 hover:bg-slate-600'
        }`}
      >
        Custom
      </button>

      {timeRange === 'custom' && (
        <div className="flex items-center gap-2 ml-2">
          <input
            type="datetime-local"
            value={customStart}
            onChange={(e) => onCustomStartChange(e.target.value)}
            className="bg-slate-700 border border-slate-600 rounded px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <span className="text-slate-400">to</span>
          <input
            type="datetime-local"
            value={customEnd}
            onChange={(e) => onCustomEndChange(e.target.value)}
            className="bg-slate-700 border border-slate-600 rounded px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      )}
    </div>
  );
}