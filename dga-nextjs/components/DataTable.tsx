'use client';

import { useState, useMemo } from 'react';

interface DataTableProps {
  readings: any[];
  selectedDevices: string[];
  thresholds: {
    h2: { warning: number; danger: number };
    co: { warning: number; danger: number };
    wc: { warning: number; danger: number };
  };
}

interface DeviceReading {
  device_name: string;
  h2: number;
  co: number;
  wc: number;
  timestamp: string;
}

export default function DataTable({
  readings,
  selectedDevices,
  thresholds,
}: DataTableProps) {
  const [sortColumn, setSortColumn] = useState<keyof DeviceReading>('device_name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  const deviceReadings = useMemo(() => {
    const latest: Record<string, DeviceReading> = {};

    readings.forEach((reading) => {
      const device = reading.device_name;
      if (selectedDevices.includes(device)) {
        const h2 = reading.h2 ?? reading.h2_mean;
        const co = reading.co ?? reading.co_mean;
        const wc = reading.wc ?? reading.wc_mean;

        if (!latest[device] || new Date(reading.timestamp) > new Date(latest[device].timestamp)) {
          latest[device] = {
            device_name: device,
            h2,
            co,
            wc,
            timestamp: reading.timestamp,
          };
        }
      }
    });

    return Object.values(latest);
  }, [readings, selectedDevices]);

  const sortedReadings = useMemo(() => {
    return [...deviceReadings].sort((a, b) => {
      const aVal = a[sortColumn];
      const bVal = b[sortColumn];

      if (typeof aVal === 'string' && typeof bVal === 'string') {
        return sortDirection === 'asc'
          ? aVal.localeCompare(bVal)
          : bVal.localeCompare(aVal);
      }

      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return sortDirection === 'asc' ? aVal - bVal : bVal - aVal;
      }

      return 0;
    });
  }, [deviceReadings, sortColumn, sortDirection]);

  const getStatus = (value: number | null | undefined, type: 'h2' | 'co' | 'wc'): 'normal' | 'warning' | 'danger' => {
    if (value == null) return 'normal';
    if (value >= thresholds[type].danger) return 'danger';
    if (value >= thresholds[type].warning) return 'warning';
    return 'normal';
  };

  const getStatusColor = (status: 'normal' | 'warning' | 'danger'): string => {
    switch (status) {
      case 'normal':
        return 'bg-green-500';
      case 'warning':
        return 'bg-yellow-500';
      case 'danger':
        return 'bg-red-500';
    }
  };

  const handleSort = (column: keyof DeviceReading) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  const formatTimestamp = (timestamp: string): string => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="bg-slate-800 rounded-lg shadow-lg border border-slate-700 overflow-hidden">
      <div className="p-4 border-b border-slate-700">
        <h3 className="text-lg font-semibold">Real-Time Data</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-slate-700">
              <th
                className="px-4 py-3 text-left text-base font-bold text-slate-100 cursor-pointer hover:bg-slate-600 transition-colors"
                onClick={() => handleSort('device_name')}
              >
                Device {sortColumn === 'device_name' && (sortDirection === 'asc' ? '↑' : '↓')}
              </th>
              <th
                className="px-4 py-3 text-right text-base font-bold text-slate-100 cursor-pointer hover:bg-slate-600 transition-colors"
                onClick={() => handleSort('h2')}
              >
                H2 (ppm) {sortColumn === 'h2' && (sortDirection === 'asc' ? '↑' : '↓')}
              </th>
              <th
                className="px-4 py-3 text-right text-base font-bold text-slate-100 cursor-pointer hover:bg-slate-600 transition-colors"
                onClick={() => handleSort('co')}
              >
                CO (ppm) {sortColumn === 'co' && (sortDirection === 'asc' ? '↑' : '↓')}
              </th>
              <th
                className="px-4 py-3 text-right text-base font-bold text-slate-100 cursor-pointer hover:bg-slate-600 transition-colors"
                onClick={() => handleSort('wc')}
              >
                WC (ppm) {sortColumn === 'wc' && (sortDirection === 'asc' ? '↑' : '↓')}
              </th>
              <th className="px-4 py-3 text-center text-base font-bold text-slate-100">
                Status
              </th>
              <th
                className="px-4 py-3 text-right text-base font-bold text-slate-100 cursor-pointer hover:bg-slate-600 transition-colors"
                onClick={() => handleSort('timestamp')}
              >
                Updated {sortColumn === 'timestamp' && (sortDirection === 'asc' ? '↑' : '↓')}
              </th>
            </tr>
          </thead>
          <tbody>
            {sortedReadings.map((reading) => {
              const h2Status = getStatus(reading.h2, 'h2');
              const coStatus = getStatus(reading.co, 'co');
              const wcStatus = getStatus(reading.wc, 'wc');

              const overallStatus =
                h2Status === 'danger' || coStatus === 'danger' || wcStatus === 'danger'
                  ? 'danger'
                  : h2Status === 'warning' || coStatus === 'warning' || wcStatus === 'warning'
                    ? 'warning'
                    : 'normal';

              const formatValue = (value: number | null | undefined): string => {
                if (value == null) return '—';
                return value.toFixed(2);
              };

              return (
                <tr
                  key={reading.device_name}
                  className="border-b border-slate-700 hover:bg-slate-700/50 transition-colors"
                >
                  <td className="px-4 py-3 text-base font-medium text-slate-100">
                    {reading.device_name}
                  </td>
                  <td className="px-4 py-3 text-base text-right tabular-nums">
                    <span
                      className={`${
                        h2Status === 'danger' ? 'text-red-400' : h2Status === 'warning' ? 'text-yellow-400' : ''
                      }`}
                    >
                      {formatValue(reading.h2)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-base text-right tabular-nums">
                    <span
                      className={`${
                        coStatus === 'danger' ? 'text-red-400' : coStatus === 'warning' ? 'text-yellow-400' : ''
                      }`}
                    >
                      {formatValue(reading.co)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-base text-right tabular-nums">
                    <span
                      className={`${
                        wcStatus === 'danger' ? 'text-red-400' : wcStatus === 'warning' ? 'text-yellow-400' : ''
                      }`}
                    >
                      {formatValue(reading.wc)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <div className={`w-3 h-3 rounded-full ${getStatusColor(overallStatus)}`} />
                      <span className="text-base font-medium capitalize">{overallStatus}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-base text-right text-slate-400">
                    {formatTimestamp(reading.timestamp)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}