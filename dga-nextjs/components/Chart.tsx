'use client';

import { useEffect, useRef } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  TimeScale,
} from 'chart.js';
import zoomPlugin from 'chartjs-plugin-zoom';
import 'chartjs-adapter-date-fns';
import { Line } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  TimeScale,
  zoomPlugin
);

interface ChartProps {
  title: string;
  data: any[];
  dataKey: string;
  color: string;
  thresholds: { warning: number; danger: number };
  selectedDevices: string[];
  showPoints?: boolean;
}

export default function Chart({
  title,
  data,
  dataKey,
  color,
  thresholds,
  selectedDevices,
  showPoints = false,
}: ChartProps) {
  const chartRef = useRef<any>(null);

  const shouldShowPoints = showPoints && data.length <= 500;
  const pointRadius = shouldShowPoints ? 4 : 0;
  const pointHoverRadius = shouldShowPoints ? 6 : 0;

  const datasets = selectedDevices.map((device) => {
    const deviceData = data.filter((d) => d.device_name === device);
    return {
      label: device,
      data: deviceData.map((d) => ({
        x: new Date(d.timestamp),
        y: d[dataKey],
      })),
      borderColor: color,
      backgroundColor: color + '20',
      borderWidth: 3,
      pointRadius: pointRadius,
      pointHoverRadius: pointHoverRadius,
      tension: 0.1,
      fill: true,
    };
  });

  const warningData = data.map((d) => ({
    x: new Date(d.timestamp),
    y: thresholds.warning,
  }));

  const dangerData = data.map((d) => ({
    x: new Date(d.timestamp),
    y: thresholds.danger,
  }));

  const chartData = {
    datasets: [
      ...datasets,
      {
        label: `Warning Level (${thresholds.warning} ppm)`,
        data: warningData,
        borderColor: '#fb923c',
        borderWidth: 2,
        borderDash: [8, 4],
        pointRadius: 0,
        fill: false,
      },
      {
        label: `Danger Level (${thresholds.danger} ppm)`,
        data: dangerData,
        borderColor: '#ef4444',
        borderWidth: 3,
        borderDash: [8, 4],
        pointRadius: 0,
        fill: false,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index' as const,
      intersect: false,
    },
    plugins: {
      legend: {
        display: true,
        position: 'top' as const,
        labels: {
          color: '#f1f5f9',
          usePointStyle: true,
          padding: 20,
          font: {
            size: 14,
          },
        },
      },
      title: {
        display: true,
        text: title,
        color: '#f1f5f9',
        font: {
          size: 18,
          weight: 'bold' as const,
        },
        padding: {
          bottom: 20,
        },
      },
      tooltip: {
        backgroundColor: 'rgba(15, 23, 42, 0.9)',
        titleColor: '#f1f5f9',
        bodyColor: '#e2e8f0',
        borderColor: '#334155',
        borderWidth: 1,
        padding: 12,
        callbacks: {
          title: (items: any) => {
            return new Date(items[0].parsed.x).toLocaleString();
          },
          label: (item: any) => {
            return `${item.dataset.label}: ${item.parsed.y.toFixed(2)} ppm`;
          },
        },
      },
      zoom: {
        pan: {
          enabled: true,
          mode: 'x' as const,
        },
        zoom: {
          wheel: {
            enabled: true,
          },
          pinch: {
            enabled: true,
          },
          mode: 'x' as const,
        },
      },
    },
    scales: {
      x: {
        type: 'time' as const,
        time: {
          displayFormats: {
            second: 'HH:mm:ss',
            minute: 'HH:mm',
            hour: 'HH:mm',
            day: 'MMM d',
            week: 'MMM d',
            month: 'MMM yyyy',
          },
        },
        ticks: {
          color: '#cbd5e1',
          maxTicksLimit: 10,
          font: {
            size: 14,
          },
        },
        grid: {
          color: 'rgba(255, 255, 255, 0.15)',
        },
      },
      y: {
        beginAtZero: true,
        ticks: {
          color: '#cbd5e1',
          callback: (value: any) => `${value} ppm`,
          font: {
            size: 14,
          },
        },
        grid: {
          color: 'rgba(255, 255, 255, 0.15)',
        },
      },
    },
  };

  const handleResetZoom = () => {
    if (chartRef.current) {
      chartRef.current.resetZoom();
    }
  };

  return (
    <div className="bg-slate-800 rounded-lg shadow-lg p-6 border border-slate-700">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">{title}</h3>
        <button
          onClick={handleResetZoom}
          className="bg-slate-700 hover:bg-slate-600 px-3 py-1 rounded text-sm transition-colors"
        >
          Reset Zoom
        </button>
      </div>
      <div style={{ height: '400px' }}>
        <Line ref={chartRef} data={chartData} options={options} />
      </div>
    </div>
  );
}