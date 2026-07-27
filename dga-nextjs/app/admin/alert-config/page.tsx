'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  getAlertConfig,
  updateAlertConfig,
  testAlertChannels,
  type AlertConfig,
  type AlertTestResult,
} from '@/lib/dga-api';

type Tab = 'overview' | 'telegram' | 'email' | 'teams' | 'thresholds';

const CHANNEL_LABELS: Record<string, string> = {
  telegram: 'Telegram',
  email: 'Email',
  teams: 'Microsoft Teams',
};

export default function AdminAlertConfigPage() {
  const [config, setConfig] = useState<AlertConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);
  const [testResult, setTestResult] = useState<AlertTestResult | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>('overview');

  const showToast = useCallback((type: 'success' | 'error', msg: string) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 3000);
  }, []);

  const loadConfig = useCallback(async () => {
    try {
      const data = await getAlertConfig();
      setConfig(data);
    } catch (err) {
      showToast('error', `โหลด config ไม่สำเร็จ: ${err}`);
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => { loadConfig(); }, [loadConfig]);

  const handleSave = async () => {
    if (!config) return;
    setSaving(true);
    try {
      await updateAlertConfig(config);
      showToast('success', 'บันทึก config สำเร็จ');
      await loadConfig();
    } catch (err) {
      showToast('error', `บันทึกไม่สำเร็จ: ${err}`);
    } finally {
      setSaving(false);
    }
  };

  const handleTest = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const result = await testAlertChannels();
      setTestResult(result);
      const successCount = Object.values(result.results).filter(Boolean).length;
      const total = Object.keys(result.results).length;
      showToast(successCount === total ? 'success' : 'error',
        `ทดสอบ: ${successCount}/${total} channels สำเร็จ`);
    } catch (err) {
      showToast('error', `ทดสอบไม่สำเร็จ: ${err}`);
    } finally {
      setTesting(false);
    }
  };

  const toggleChannel = (channel: string) => {
    if (!config) return;
    const enabled = config.enabled_channels.includes(channel);
    setConfig({
      ...config,
      enabled_channels: enabled
        ? config.enabled_channels.filter(c => c !== channel)
        : [...config.enabled_channels, channel],
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white text-xl animate-pulse">กำลังโหลด...</div>
      </div>
    );
  }

  if (!config) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-red-400 text-xl">ไม่สามารถโหลด config ได้</div>
      </div>
    );
  }

  const tabs: { key: Tab; label: string; icon: string }[] = [
    { key: 'overview', label: 'ภาพรวม', icon: '📊' },
    { key: 'telegram', label: 'Telegram', icon: '📱' },
    { key: 'email', label: 'Email', icon: '📧' },
    { key: 'teams', label: 'Teams', icon: '💬' },
    { key: 'thresholds', label: 'Thresholds', icon: '📏' },
  ];

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-6 py-3 rounded-lg shadow-xl text-white font-medium transition-all ${
          toast.type === 'success' ? 'bg-green-600' : 'bg-red-600'
        }`}>
          {toast.type === 'success' ? '✅' : '❌'} {toast.msg}
        </div>
      )}

      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">⚙️ Alert Configuration</h1>
            <p className="text-gray-400 text-sm mt-1">จัดการช่องทางแจ้งเตือนและ thresholds</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleTest}
              disabled={testing}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 rounded-lg font-medium transition-colors"
            >
              {testing ? '⏳ กำลังทดสอบ...' : '🧪 ทดสอบ Channels'}
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-green-800 rounded-lg font-medium transition-colors"
            >
              {saving ? '⏳ กำลังบันทึก...' : '💾 บันทึก'}
            </button>
          </div>
        </div>
      </div>

      {/* Test Result Banner */}
      {testResult && (
        <div className="max-w-6xl mx-auto mt-4 px-6">
          <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
            <h3 className="font-bold mb-2">📋 ผลทดสอบ: {testResult.summary}</h3>
            <div className="flex gap-4">
              {Object.entries(testResult.results).map(([channel, success]) => (
                <div key={channel} className={`px-3 py-1 rounded-full text-sm font-medium ${
                  success ? 'bg-green-900 text-green-300' : 'bg-red-900 text-red-300'
                }`}>
                  {success ? '✅' : '❌'} {CHANNEL_LABELS[channel] || channel}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="max-w-6xl mx-auto mt-6 px-6">
        <div className="flex gap-2 border-b border-gray-700">
          {tabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-4 py-3 font-medium transition-colors border-b-2 ${
                activeTab === tab.key
                  ? 'border-blue-500 text-blue-400'
                  : 'border-transparent text-gray-400 hover:text-white'
              }`}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto mt-6 px-6 pb-12">
        {activeTab === 'overview' && <OverviewTab config={config} onToggleChannel={toggleChannel} />}
        {activeTab === 'telegram' && <TelegramTab config={config} setConfig={setConfig} />}
        {activeTab === 'email' && <EmailTab config={config} setConfig={setConfig} />}
        {activeTab === 'teams' && <TeamsTab config={config} setConfig={setConfig} />}
        {activeTab === 'thresholds' && <ThresholdsTab config={config} setConfig={setConfig} />}
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════
   OVERVIEW TAB
   ════════════════════════════════════════════════════════════ */

function OverviewTab({ config, onToggleChannel }: { config: AlertConfig; onToggleChannel: (ch: string) => void }) {
  const channels = [
    {
      key: 'telegram',
      label: 'Telegram',
      icon: '📱',
      description: 'ส่งแจ้งเตือนไปที่ DGA group → Deployment Alert topic',
      color: 'blue',
      details: [
        `Chat ID: ${config.telegram.chat_id}`,
        `Thread ID: ${config.telegram.thread_id}`,
      ],
    },
    {
      key: 'email',
      label: 'Email (SMTP)',
      icon: '📧',
      description: 'ส่งอีเมลหาทีมงานหลายคน — รองรับ Gmail, Outlook, etc.',
      color: 'red',
      details: [
        `SMTP: ${config.email.smtp_server}:${config.email.smtp_port}`,
        `Recipients: ${config.email.recipients.length} คน`,
      ],
    },
    {
      key: 'teams',
      label: 'Microsoft Teams',
      icon: '💬',
      description: 'ส่งแจ้งเตือนผ่าน Incoming Webhook ไปยัง Teams channel',
      color: 'purple',
      details: [
        `Webhook: ${config.teams.webhook_url ? '✅ Configured' : '❌ Not set'}`,
      ],
    },
  ];

  return (
    <div className="space-y-4">
      <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
        <h2 className="text-xl font-bold mb-4">🔔 ช่องทางแจ้งเตือน</h2>
        <p className="text-gray-400 mb-6">เลือกเปิด/ปิดช่องทางที่ต้องการรับแจ้งเตือน — สามารถเปิดหลายช่องทางพร้อมกันได้</p>

        <div className="grid gap-4">
          {channels.map(ch => {
            const isEnabled = config.enabled_channels.includes(ch.key);
            return (
              <div
                key={ch.key}
                className={`flex items-start gap-4 p-4 rounded-lg border transition-all ${
                  isEnabled ? 'border-green-600 bg-green-900/20' : 'border-gray-700 bg-gray-800/50'
                }`}
              >
                <div className="text-3xl">{ch.icon}</div>
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <h3 className="font-bold text-lg">{ch.label}</h3>
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                      isEnabled ? 'bg-green-800 text-green-300' : 'bg-gray-700 text-gray-400'
                    }`}>
                      {isEnabled ? 'เปิด' : 'ปิด'}
                    </span>
                  </div>
                  <p className="text-gray-400 text-sm mt-1">{ch.description}</p>
                  <div className="text-gray-500 text-xs mt-2">
                    {ch.details.map((d, i) => <div key={i}>{d}</div>)}
                  </div>
                </div>
                <button
                  onClick={() => onToggleChannel(ch.key)}
                  className={`relative w-14 h-7 rounded-full transition-colors ${
                    isEnabled ? 'bg-green-600' : 'bg-gray-600'
                  }`}
                >
                  <div className={`absolute top-0.5 w-6 h-6 rounded-full bg-white shadow transition-transform ${
                    isEnabled ? 'translate-x-7' : 'translate-x-0.5'
                  }`} />
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Thresholds Summary */}
      <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
        <h2 className="text-xl font-bold mb-4">📏 Alert Thresholds</h2>
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-gray-900 rounded-lg p-4 text-center">
            <div className="text-red-400 text-2xl font-bold">{config.thresholds.alert_24h_threshold}σ</div>
            <div className="text-gray-400 text-sm mt-1">24h Shewhart</div>
            <div className="text-gray-500 text-xs">Sudden spike</div>
          </div>
          <div className="bg-gray-900 rounded-lg p-4 text-center">
            <div className="text-orange-400 text-2xl font-bold">{config.thresholds.alert_7d_threshold}</div>
            <div className="text-gray-400 text-sm mt-1">7d CUSUM+</div>
            <div className="text-gray-500 text-xs">Developing trend</div>
          </div>
          <div className="bg-gray-900 rounded-lg p-4 text-center">
            <div className="text-yellow-400 text-2xl font-bold">{config.thresholds.alert_30d_threshold}σ</div>
            <div className="text-gray-400 text-sm mt-1">30d Reference</div>
            <div className="text-gray-500 text-xs">Baseline drift</div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════
   TELEGRAM TAB
   ════════════════════════════════════════════════════════════ */

function TelegramTab({ config, setConfig }: { config: AlertConfig; setConfig: (c: AlertConfig) => void }) {
  const update = (field: string, value: string | number) => {
    setConfig({ ...config, telegram: { ...config.telegram, [field]: value } });
  };

  return (
    <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
      <h2 className="text-xl font-bold mb-6">📱 Telegram Configuration</h2>

      <div className="space-y-4">
        <Field label="Bot Token" description="Token จาก @BotFather">
          <input
            type="text"
            value={config.telegram.bot_token}
            onChange={e => update('bot_token', e.target.value)}
            className="input-field"
            placeholder="123456:ABC-DEF..."
          />
        </Field>

        <Field label="Chat ID" description="ID ของ group/channel (supergroup ใช้ -100xxxxxxxxxx)">
          <input
            type="text"
            value={config.telegram.chat_id}
            onChange={e => update('chat_id', e.target.value)}
            className="input-field"
            placeholder="-1004499459935"
          />
        </Field>

        <Field label="Thread ID (Topic)" description="ID ของ topic ใน group (0 = ไม่ใช้ topic)">
          <input
            type="number"
            value={config.telegram.thread_id}
            onChange={e => update('thread_id', parseInt(e.target.value) || 0)}
            className="input-field"
            placeholder="6"
          />
        </Field>
      </div>

      <div className="mt-6 p-4 bg-blue-900/20 border border-blue-800 rounded-lg">
        <h3 className="font-bold text-blue-300 mb-2">💡 วิธีหา Chat ID</h3>
        <ol className="text-sm text-gray-300 space-y-1 list-decimal list-inside">
          <li>เพิ่ม bot เข้า group</li>
          <li>ส่งข้อความในกลุ่ม</li>
          <li>เปิด <code className="bg-gray-700 px-1 rounded">https://api.telegram.org/bot&lt;TOKEN&gt;/getUpdates</code></li>
          <li>หา <code className="bg-gray-700 px-1 rounded">&quot;chat&quot;: {`{"id": -100xxxxxxxxxx}`}</code></li>
        </ol>
      </div>

      <style jsx>{`
        .input-field {
          width: 100%;
          padding: 0.5rem 0.75rem;
          background: #1f2937;
          border: 1px solid #374151;
          border-radius: 0.5rem;
          color: white;
          font-family: monospace;
        }
        .input-field:focus {
          outline: none;
          border-color: #3b82f6;
          box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.3);
        }
      `}</style>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════
   EMAIL TAB
   ════════════════════════════════════════════════════════════ */

function EmailTab({ config, setConfig }: { config: AlertConfig; setConfig: (c: AlertConfig) => void }) {
  const [newRecipient, setNewRecipient] = useState('');

  const update = (field: string, value: string | number) => {
    setConfig({ ...config, email: { ...config.email, [field]: value } });
  };

  const addRecipient = () => {
    if (!newRecipient.trim()) return;
    if (!config.email.recipients.includes(newRecipient.trim())) {
      setConfig({
        ...config,
        email: { ...config.email, recipients: [...config.email.recipients, newRecipient.trim()] },
      });
    }
    setNewRecipient('');
  };

  const removeRecipient = (email: string) => {
    setConfig({
      ...config,
      email: { ...config.email, recipients: config.email.recipients.filter(r => r !== email) },
    });
  };

  return (
    <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
      <h2 className="text-xl font-bold mb-6">📧 Email Configuration (SMTP)</h2>

      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <Field label="SMTP Server">
            <input
              type="text"
              value={config.email.smtp_server}
              onChange={e => update('smtp_server', e.target.value)}
              className="input-field"
              placeholder="smtp.gmail.com"
            />
          </Field>
          <Field label="SMTP Port">
            <input
              type="number"
              value={config.email.smtp_port}
              onChange={e => update('smtp_port', parseInt(e.target.value) || 587)}
              className="input-field"
              placeholder="587"
            />
          </Field>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Username">
            <input
              type="text"
              value={config.email.username}
              onChange={e => update('username', e.target.value)}
              className="input-field"
              placeholder="your-email@gmail.com"
            />
          </Field>
          <Field label="Password / App Password">
            <input
              type="password"
              value={config.email.password}
              onChange={e => update('password', e.target.value)}
              className="input-field"
              placeholder="••••••••"
            />
          </Field>
        </div>

        <Field label="From Email">
          <input
            type="email"
            value={config.email.from_email}
            onChange={e => update('from_email', e.target.value)}
            className="input-field"
            placeholder="dga-alerts@gmail.com"
          />
        </Field>

        {/* Recipients */}
        <Field label={`Recipients (${config.email.recipients.length} คน)`}>
          <div className="flex gap-2 mb-2">
            <input
              type="email"
              value={newRecipient}
              onChange={e => setNewRecipient(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addRecipient()}
              className="input-field flex-1"
              placeholder="engineer@irpc.co.th"
            />
            <button
              onClick={addRecipient}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg font-medium transition-colors whitespace-nowrap"
            >
              + เพิ่ม
            </button>
          </div>
          <div className="flex flex-wrap gap-2 mt-2">
            {config.email.recipients.map(email => (
              <span key={email} className="inline-flex items-center gap-1 px-3 py-1 bg-gray-700 rounded-full text-sm">
                {email}
                <button
                  onClick={() => removeRecipient(email)}
                  className="text-red-400 hover:text-red-300 ml-1"
                >
                  ✕
                </button>
              </span>
            ))}
            {config.email.recipients.length === 0 && (
              <span className="text-gray-500 text-sm">ยังไม่มี recipients</span>
            )}
          </div>
        </Field>
      </div>

      <div className="mt-6 p-4 bg-yellow-900/20 border border-yellow-800 rounded-lg">
        <h3 className="font-bold text-yellow-300 mb-2">⚠️ Gmail App Password</h3>
        <p className="text-sm text-gray-300">
          ถ้าใช้ Gmail ต้องสร้าง App Password ที่{' '}
          <a href="https://myaccount.google.com/apppasswords" target="_blank" rel="noopener"
             className="text-blue-400 hover:underline">
            myaccount.google.com/apppasswords
          </a>
          {' '}(ต้องเปิด 2FA ก่อน)
        </p>
      </div>

      <style jsx>{`
        .input-field {
          width: 100%;
          padding: 0.5rem 0.75rem;
          background: #1f2937;
          border: 1px solid #374151;
          border-radius: 0.5rem;
          color: white;
          font-family: monospace;
        }
        .input-field:focus {
          outline: none;
          border-color: #3b82f6;
          box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.3);
        }
      `}</style>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════
   TEAMS TAB
   ════════════════════════════════════════════════════════════ */

function TeamsTab({ config, setConfig }: { config: AlertConfig; setConfig: (c: AlertConfig) => void }) {
  const update = (field: string, value: string) => {
    setConfig({ ...config, teams: { ...config.teams, [field]: value } });
  };

  return (
    <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
      <h2 className="text-xl font-bold mb-6">💬 Microsoft Teams Configuration</h2>

      <div className="space-y-4">
        <Field label="Incoming Webhook URL" description="URL จาก Teams Connector">
          <input
            type="url"
            value={config.teams.webhook_url}
            onChange={e => update('webhook_url', e.target.value)}
            className="input-field"
            placeholder="https://outlook.office.com/webhook/..."
          />
        </Field>
      </div>

      <div className="mt-6 p-4 bg-purple-900/20 border border-purple-800 rounded-lg">
        <h3 className="font-bold text-purple-300 mb-2">💡 วิธีสร้าง Webhook</h3>
        <ol className="text-sm text-gray-300 space-y-1 list-decimal list-inside">
          <li>เปิด Teams channel ที่ต้องการรับ alert</li>
          <li>คลิก ⋯ (More options) → Connectors</li>
          <li>เลือก &quot;Incoming Webhook&quot; → Configure</li>
          <li>ตั้งชื่อ (เช่น &quot;DGA Alerts&quot;) → Create</li>
          <li>Copy webhook URL มาวางด้านบน</li>
        </ol>
      </div>

      <style jsx>{`
        .input-field {
          width: 100%;
          padding: 0.5rem 0.75rem;
          background: #1f2937;
          border: 1px solid #374151;
          border-radius: 0.5rem;
          color: white;
          font-family: monospace;
        }
        .input-field:focus {
          outline: none;
          border-color: #3b82f6;
          box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.3);
        }
      `}</style>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════
   THRESHOLDS TAB
   ════════════════════════════════════════════════════════════ */

function ThresholdsTab({ config, setConfig }: { config: AlertConfig; setConfig: (c: AlertConfig) => void }) {
  const update = (field: string, value: number) => {
    setConfig({ ...config, thresholds: { ...config.thresholds, [field]: value } });
  };

  return (
    <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
      <h2 className="text-xl font-bold mb-6">📏 Alert Thresholds</h2>
      <p className="text-gray-400 mb-6">ตั้งค่าเงื่อนไขที่จะส่งแจ้งเตือน — ปรับค่าตามความเหมาะสมของอุปกรณ์</p>

      <div className="space-y-6">
        <div className="bg-gray-900 rounded-lg p-4 border border-red-900/50">
          <div className="flex items-center gap-3 mb-3">
            <span className="text-2xl">🔴</span>
            <div>
              <h3 className="font-bold">24h Shewhart — Sudden Spike</h3>
              <p className="text-gray-400 text-sm">แจ้งเตือนเมื่อ z-score เกินค่านี้ภายใน 24 ชม.</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <input
              type="range"
              min="2"
              max="6"
              step="0.5"
              value={config.thresholds.alert_24h_threshold}
              onChange={e => update('alert_24h_threshold', parseFloat(e.target.value))}
              className="flex-1"
            />
            <span className="text-red-400 font-bold text-xl w-16 text-right">
              {config.thresholds.alert_24h_threshold}σ
            </span>
          </div>
        </div>

        <div className="bg-gray-900 rounded-lg p-4 border border-orange-900/50">
          <div className="flex items-center gap-3 mb-3">
            <span className="text-2xl">🟠</span>
            <div>
              <h3 className="font-bold">7d CUSUM+ — Developing Trend</h3>
              <p className="text-gray-400 text-sm">แจ้งเตือนเมื่อ CUSUM+ สะสมเกินค่านี้ภายใน 7 วัน</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <input
              type="range"
              min="2"
              max="10"
              step="0.5"
              value={config.thresholds.alert_7d_threshold}
              onChange={e => update('alert_7d_threshold', parseFloat(e.target.value))}
              className="flex-1"
            />
            <span className="text-orange-400 font-bold text-xl w-16 text-right">
              {config.thresholds.alert_7d_threshold}
            </span>
          </div>
        </div>

        <div className="bg-gray-900 rounded-lg p-4 border border-yellow-900/50">
          <div className="flex items-center gap-3 mb-3">
            <span className="text-2xl">🟡</span>
            <div>
              <h3 className="font-bold">30d Reference — Baseline Drift</h3>
              <p className="text-gray-400 text-sm">แจ้งเตือนเมื่อ z-score เบี่ยงเบนจาก baseline ภายใน 30 วัน</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <input
              type="range"
              min="1"
              max="5"
              step="0.5"
              value={config.thresholds.alert_30d_threshold}
              onChange={e => update('alert_30d_threshold', parseFloat(e.target.value))}
              className="flex-1"
            />
            <span className="text-yellow-400 font-bold text-xl w-16 text-right">
              {config.thresholds.alert_30d_threshold}σ
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════
   SHARED COMPONENTS
   ════════════════════════════════════════════════════════════ */

function Field({ label, description, children }: { label: string; description?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-300 mb-1">{label}</label>
      {description && <p className="text-xs text-gray-500 mb-2">{description}</p>}
      {children}
    </div>
  );
}
