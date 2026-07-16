'use client';

import { useState } from 'react';

interface ExportButtonProps {
  filters: {
    devices: string;
    start: string;
    end: string;
    min_zscore: number;
    severity: string;
  };
}

export default function ExportButton({ filters }: ExportButtonProps) {
  const [exporting, setExporting] = useState<'csv' | 'pdf' | null>(null);

  const handleExport = async (type: 'csv' | 'pdf') => {
    setExporting(type);
    
    try {
      const params = new URLSearchParams();
      if (filters.devices) params.set('devices', filters.devices);
      if (filters.start) params.set('start', filters.start);
      if (filters.end) params.set('end', filters.end);
      params.set('min_zscore', String(filters.min_zscore));
      if (filters.severity !== 'all') params.set('severity', filters.severity);
      
      const endpoint = type === 'csv' ? '/dga-api/anomaly/export/csv' : '/dga-api/anomaly/report/pdf';
      const response = await fetch(`${endpoint}?${params.toString()}`);
      
      if (!response.ok) throw new Error('Export failed');
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = type === 'csv' 
        ? `anomaly_events_${new Date().toISOString().split('T')[0]}.csv`
        : `anomaly_report_${new Date().toISOString().split('T')[0]}.html`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch(e) {
      console.error(`Failed to export ${type}:`, e);
      alert(`Export ${type.toUpperCase()} failed. Please try again.`);
    } finally {
      setExporting(null);
    }
  };

  return (
    <div style={{ display: 'flex', gap: '8px' }}>
      <button 
        onClick={() => handleExport('csv')}
        disabled={exporting !== null}
        style={{
          background: '#10b981', border: 'none', color: 'white', padding: '8px 16px',
          borderRadius: '6px', cursor: exporting ? 'not-allowed' : 'pointer', fontSize: '13px', fontWeight: 600,
          opacity: exporting === 'csv' ? 0.7 : 1, display: 'flex', alignItems: 'center', gap: '6px'
        }}
        title="Download anomaly events as CSV"
      >
        {exporting === 'csv' ? (
          <> Exporting...</>
        ) : (
          <>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="7 10 12 15 17 10"/>
              <line x1="12" y1="15" x2="12" y2="3"/>
            </svg>
            Export CSV
          </>
        )}
      </button>
      
      <button 
        onClick={() => handleExport('pdf')}
        disabled={exporting !== null}
        style={{
          background: '#3b82f6', border: 'none', color: 'white', padding: '8px 16px',
          borderRadius: '6px', cursor: exporting ? 'not-allowed' : 'pointer', fontSize: '13px', fontWeight: 600,
          opacity: exporting === 'pdf' ? 0.7 : 1, display: 'flex', alignItems: 'center', gap: '6px'
        }}
        title="Generate PDF report"
      >
        {exporting === 'pdf' ? (
          <>⏳ Generating...</>
        ) : (
          <>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
              <line x1="16" y1="13" x2="8" y2="13"/>
              <line x1="16" y1="17" x2="8" y2="17"/>
              <polyline points="10 9 9 9 8 9"/>
            </svg>
            PDF Report
          </>
        )}
      </button>
    </div>
  );
}
