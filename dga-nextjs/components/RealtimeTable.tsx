"use client";

import { useEffect, useState } from "react";

interface RealtimeReading {
  device_name: string;
  h2: number;
  co: number;
  wc: number;
  timestamp: string;
}

interface RealtimeTableProps {
  selectedDevices: string[];
}

export default function RealtimeTable({ selectedDevices }: RealtimeTableProps) {
  const [readings, setReadings] = useState<RealtimeReading[]>([]);
  const [lastUpdated, setLastUpdated] = useState<string>("");

  useEffect(() => {
    const fetchLatest = async () => {
      if (selectedDevices.length === 0) return;

      try {
        const res = await fetch(
          `/dga/api/readings/now?devices=${selectedDevices.join(",")}`
        );
        const data = await res.json();

        if (data.success && data.data) {
          setReadings(data.data);
          setLastUpdated(new Date().toLocaleTimeString());
        }
      } catch (err) {
        console.error("Failed to fetch realtime data:", err);
      }
    };

    fetchLatest();
    const interval = setInterval(fetchLatest, 15000); // 15 วินาที

    return () => clearInterval(interval);
  }, [selectedDevices]);

  const getStatus = (value: number, type: "h2" | "co" | "wc") => {
    const thresholds = {
      h2: { warning: 250, danger: 500 },
      co: { warning: 1000, danger: 1500 },
      wc: { warning: 30, danger: 40 },
    };

    if (value >= thresholds[type].danger) return { label: "Danger", color: "text-red-500" };
    if (value >= thresholds[type].warning) return { label: "Warning", color: "text-yellow-500" };
    return { label: "Normal", color: "text-green-500" };
  };

  return (
    <div className="bg-slate-800 rounded-lg shadow-lg p-6 border border-slate-700">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white">Real-Time Data</h3>
        {lastUpdated && (
          <span className="text-sm text-slate-400">Updated: {lastUpdated}</span>
        )}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-slate-400 border-b border-slate-700">
              <th className="text-left py-2 pr-4">Device</th>
              <th className="text-right py-2 px-2">H2 (ppm)</th>
              <th className="text-right py-2 px-2">CO (ppm)</th>
              <th className="text-right py-2 px-2">WC (ppm)</th>
              <th className="text-right py-2 pl-4">Status</th>
            </tr>
          </thead>
          <tbody>
            {readings.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-center py-4 text-slate-500">
                  No data
                </td>
              </tr>
            ) : (
              readings.map((r) => {
                const h2Status = getStatus(r.h2, "h2");
                const coStatus = getStatus(r.co, "co");
                const wcStatus = getStatus(r.wc, "wc");

                const worstStatus = [h2Status, coStatus, wcStatus].find(
                  (s) => s.label === "Danger"
                ) || [h2Status, coStatus, wcStatus].find(
                  (s) => s.label === "Warning"
                ) || h2Status;

                return (
                  <tr
                    key={r.device_name}
                    className="border-b border-slate-700/50 hover:bg-slate-700/30"
                  >
                    <td className="py-2 pr-4 font-medium text-white">
                      {r.device_name}
                    </td>
                    <td className="py-2 px-2 text-right font-mono text-slate-300">
                      {r.h2}
                    </td>
                    <td className="py-2 px-2 text-right font-mono text-slate-300">
                      {r.co}
                    </td>
                    <td className="py-2 px-2 text-right font-mono text-slate-300">
                      {r.wc}
                    </td>
                    <td className={`py-2 pl-4 text-right font-medium ${worstStatus.color}`}>
                      {worstStatus.label}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
