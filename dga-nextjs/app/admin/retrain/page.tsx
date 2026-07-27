'use client';

import { useState } from 'react';

const API_BASE = '/dga-api';

interface RetrainResult {
  status: string;
  devices_trained: number;
  window_days: number;
  backup_path: string | null;
  model_version: string;
}

export default function AdminRetrainPage() {
  const [windowDays, setWindowDays] = useState(90);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<RetrainResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleRetrain = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch(`${API_BASE}/retrain`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ window_days: windowDays }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Retrain failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700 px-6 py-4">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl font-bold">🔄 Baseline Retrain</h1>
          <p className="text-gray-400 text-sm mt-1">
            คำนวณ baseline ใหม่จากข้อมูลล่าสุด — ทำทุกสัปดาห์อัตโนมัติ (วันอาทิตย์ 02:00)
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto mt-8 px-6 space-y-6">
        {/* Retrain Form */}
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <h2 className="text-xl font-bold mb-4">⚙️ Retrain Settings</h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Training Window (days)
              </label>
              <div className="flex items-center gap-4">
                <input
                  type="range"
                  min="30"
                  max="365"
                  step="30"
                  value={windowDays}
                  onChange={e => setWindowDays(parseInt(e.target.value))}
                  className="flex-1 h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                />
                <span className="text-2xl font-bold text-blue-400 w-20 text-right">
                  {windowDays}d
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                ช่วงเวลาข้อมูลที่ใช้คำนวณ baseline ใหม่ (30-365 วัน)
              </p>
            </div>

            <button
              onClick={handleRetrain}
              disabled={loading}
              className={`w-full py-3 rounded-lg font-bold text-lg transition-colors ${
                loading
                  ? 'bg-gray-600 cursor-not-allowed'
                  : 'bg-green-600 hover:bg-green-700'
              }`}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  กำลัง Retrain...
                </span>
              ) : (
                '🔄 เริ่ม Retrain'
              )}
            </button>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-900/30 border border-red-700 rounded-lg p-4">
            <h3 className="font-bold text-red-400 mb-2">❌ เกิดข้อผิดพลาด</h3>
            <p className="text-red-300 text-sm">{error}</p>
          </div>
        )}

        {/* Result */}
        {result && (
          <div className={`rounded-lg p-6 border ${
            result.status === 'success'
              ? 'bg-green-900/20 border-green-700'
              : 'bg-red-900/20 border-red-700'
          }`}>
            <h3 className={`text-xl font-bold mb-4 ${
              result.status === 'success' ? 'text-green-400' : 'text-red-400'
            }`}>
              {result.status === 'success' ? '✅ Retrain สำเร็จ' : '❌ Retrain ล้มเหลว'}
            </h3>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-900 rounded-lg p-4">
                <div className="text-gray-400 text-sm">Devices Trained</div>
                <div className="text-3xl font-bold text-white">{result.devices_trained}</div>
              </div>
              <div className="bg-gray-900 rounded-lg p-4">
                <div className="text-gray-400 text-sm">Window Days</div>
                <div className="text-3xl font-bold text-white">{result.window_days}d</div>
              </div>
              <div className="bg-gray-900 rounded-lg p-4 col-span-2">
                <div className="text-gray-400 text-sm">Backup Path</div>
                <div className="text-sm font-mono text-gray-300 mt-1 break-all">
                  {result.backup_path || 'N/A'}
                </div>
              </div>
              <div className="bg-gray-900 rounded-lg p-4 col-span-2">
                <div className="text-gray-400 text-sm">Model Version</div>
                <div className="text-lg font-mono text-blue-400">{result.model_version}</div>
              </div>
            </div>
          </div>
        )}

        {/* Info */}
        <div className="bg-blue-900/20 border border-blue-800 rounded-lg p-4">
          <h3 className="font-bold text-blue-300 mb-2">💡 ข้อมูลเพิ่มเติม</h3>
          <ul className="text-sm text-gray-300 space-y-1 list-disc list-inside">
            <li>Retrain จะคำนวณ mean/std/percentiles ใหม่จากข้อมูลล่าสุด</li>
            <li>Baseline เก่าจะถูก backup ก่อนเสมอ (สามารถ restore ได้)</li>
            <li>Auto-retrain ทำงานอัตโนมัติทุกวันอาทิตย์ 02:00 น.</li>
            <li>Logs: <code className="bg-gray-700 px-1 rounded">~/logs/dga_weekly.log</code></li>
          </ul>
        </div>
      </div>
    </div>
  );
}
