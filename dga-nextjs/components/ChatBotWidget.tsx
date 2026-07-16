'use client';

import { useState, useRef, useEffect } from 'react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export default function ChatBotWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: 'สวัสดีครับ! ผมคือ DGA Assistant 🤖\n\nคุณสามารถถามผมเกี่ยวกับ:\n• ข้อมูล Z-Score ของอุปกรณ์\n• Anomaly history และการวิเคราะห์\n• ปัญหาทางเทคนิคของระบบ\n• คำแนะนำการตั้งค่า baseline และ threshold', timestamp: new Date() }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMessage: Message = { role: 'user', content: input.trim(), timestamp: new Date() };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      // Call backend API that proxies to Azure OpenAI
      const response = await fetch('/dga-api/chat/message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMessage.content })
      });

      if (!response.ok) throw new Error('Failed to get response');

      const data = await response.json();
      const assistantMessage: Message = { role: 'assistant', content: data.reply, timestamp: new Date() };
      setMessages(prev => [...prev, assistantMessage]);
    } catch (e) {
      setMessages(prev => [...prev, { role: 'assistant', content: 'ขออภัยครับ เกิดข้อผิดพลาดในการเชื่อมต่อ กรุณาลองอีกครั้ง', timestamp: new Date() }]);
    } finally {
      setLoading(false);
    }
  };

  const quickQuestions = [
    "ค่า Z-Score ปกติควรอยู่ช่วงไหน?",
    "อุปกรณ์ DA115 มี anomaly เมื่อไหร่บ้าง?",
    "วิธีตั้งค่า noise filter ให้ดูอย่างไร?",
    "อธิบายความแตกต่าง H₂, CO, WC ใน DGA"
  ];

  return (
    <>
      {/* Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          position: 'fixed', bottom: '24px', right: '24px',
          width: '56px', height: '56px', borderRadius: '50%',
          background: '#3b82f6', border: 'none', cursor: 'pointer',
          boxShadow: '0 4px 14px rgba(59,130,246,0.4)', zIndex: 1000,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'transform 0.2s'
        }}
        onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.1)'}
        onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
        title="DGA Assistant"
      >
        <svg width="28" height="28" viewBox="0 0 24 24" fill="white">
          <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/>
        </svg>
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div style={{
          position: 'fixed', bottom: '90px', right: '24px',
          width: '380px', maxHeight: '520px',
          background: '#1e293b', borderRadius: '12px',
          border: '1px solid #334155', boxShadow: '0 10px 40px rgba(0,0,0,0.5)',
          zIndex: 1000, display: 'flex', flexDirection: 'column',
          overflow: 'hidden'
        }}>
          {/* Header */}
          <div style={{ padding: '14px 18px', borderBottom: '1px solid #334155', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontWeight: 700, fontSize: '14px' }}>DGA Assistant</div>
              <div style={{ fontSize: '11px', color: '#64748b' }}>Powered by GPT-4o</div>
            </div>
            <button onClick={() => setIsOpen(false)} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: '18px' }}>×</button>
          </div>

          {/* Messages */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '16px', minHeight: '300px', maxHeight: '380px' }}>
            {messages.map((msg, i) => (
              <div key={i} style={{ marginBottom: '12px', display: 'flex', flexDirection: msg.role === 'user' ? 'row-reverse' : 'row', gap: '8px' }}>
                <div style={{
                  maxWidth: '80%', padding: '10px 14px', borderRadius: '12px',
                  background: msg.role === 'user' ? '#3b82f6' : '#0f172a',
                  color: '#e2e8f0', fontSize: '13px', lineHeight: '1.5',
                  whiteSpace: 'pre-wrap', wordBreak: 'break-word'
                }}>
                  {msg.content}
                </div>
              </div>
            ))}
            {loading && (
              <div style={{ display: 'flex', gap: '4px', padding: '10px 14px' }}>
                <span style={{ width: '8px', height: '8px', background: '#64748b', borderRadius: '50%', animation: 'bounce 1.4s infinite ease-in-out' }} />
                <span style={{ width: '8px', height: '8px', background: '#64748b', borderRadius: '50%', animation: 'bounce 1.4s infinite ease-in-out 0.2s' }} />
                <span style={{ width: '8px', height: '8px', background: '#64748b', borderRadius: '50%', animation: 'bounce 1.4s infinite ease-in-out 0.4s' }} />
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Questions */}
          {messages.length <= 1 && (
            <div style={{ padding: '0 16px 10px', display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {quickQuestions.map(q => (
                <button key={q} onClick={() => { setInput(q); }} style={{ background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.3)', color: '#93c5fd', padding: '4px 10px', borderRadius: '16px', fontSize: '11px', cursor: 'pointer' }}>
                  {q}
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          <div style={{ padding: '12px', borderTop: '1px solid #334155', display: 'flex', gap: '8px' }}>
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSend()}
              placeholder="พิมพ์คำถาม..."
              disabled={loading}
              style={{
                flex: 1, padding: '8px 12px', background: '#0f172a', border: '1px solid #334155',
                borderRadius: '8px', color: '#e2e8f0', fontSize: '13px', outline: 'none'
              }}
            />
            <button onClick={handleSend} disabled={loading || !input.trim()} style={{
              background: '#3b82f6', border: 'none', color: 'white', padding: '8px 14px',
              borderRadius: '8px', cursor: loading || !input.trim() ? 'not-allowed' : 'pointer',
              opacity: loading || !input.trim() ? 0.5 : 1, fontWeight: 600
            }}>
              ส่ง
            </button>
          </div>
        </div>
      )}

      <style>{`@keyframes bounce { 0%, 80%, 100% { transform: scale(0); } 40% { transform: scale(1); } }`}</style>
    </>
  );
}
