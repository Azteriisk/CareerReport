'use client';

import React, { useState, useRef } from 'react';
import Link from 'next/link';

interface ParseResult {
  success: boolean;
  pageCount: number;
  totalTextLength: number;
  atsBlockFound: boolean;
  atsBlock: string | null;
  jsonPayloadFound: boolean;
  jsonPayloadValid: boolean;
  jsonError: string | null;
  parsedResume: any;
  error?: string;
}

export default function PdfParserPage() {
  const [result, setResult] = useState<ParseResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    if (file.type !== 'application/pdf') {
      alert('Please upload a PDF file.');
      return;
    }
    setFileName(file.name);
    setLoading(true);
    setResult(null);

    const formData = new FormData();
    formData.append('pdf', file);

    try {
      const res = await fetch('/api/tools/parse-pdf', { method: 'POST', body: formData });
      const data = await res.json();
      setResult(data);
    } catch (e: any) {
      setResult({ success: false, error: e.message } as any);
    } finally {
      setLoading(false);
    }
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const StatusBadge = ({ ok, label }: { ok: boolean; label: string }) => (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: '6px',
      padding: '4px 12px', borderRadius: '20px', fontSize: '0.85rem', fontWeight: 600,
      background: ok ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)',
      color: ok ? '#10b981' : '#ef4444',
      border: `1px solid ${ok ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)'}`,
    }}>
      {ok ? '✓' : '✗'} {label}
    </span>
  );

  return (
    <div style={{ minHeight: '100vh', background: '#0f172a', color: '#e2e8f0', fontFamily: 'Inter, sans-serif', padding: '40px 20px' }}>
      <div style={{ maxWidth: '860px', margin: '0 auto' }}>

        {/* Header */}
        <div style={{ marginBottom: '32px' }}>
          <Link href="/builder" style={{ color: '#64748b', fontSize: '0.85rem', textDecoration: 'none' }}>
            ← Back to Builder
          </Link>
          <h1 style={{ fontSize: '2rem', fontWeight: 800, margin: '12px 0 6px', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            ATS Metadata Validator
          </h1>
          <p style={{ color: '#64748b', margin: 0 }}>
            Upload a CareerReport PDF to verify its hidden ATS metadata layer is correctly embedded and parseable.
          </p>
        </div>

        {/* Drop Zone */}
        <div
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
          style={{
            border: `2px dashed ${dragging ? '#6366f1' : '#334155'}`,
            borderRadius: '16px',
            padding: '48px',
            textAlign: 'center',
            cursor: 'pointer',
            background: dragging ? 'rgba(99,102,241,0.08)' : 'rgba(255,255,255,0.03)',
            transition: 'all 0.2s',
            marginBottom: '32px',
          }}
        >
          <input ref={inputRef} type="file" accept="application/pdf" style={{ display: 'none' }} onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} />
          <div style={{ fontSize: '3rem', marginBottom: '12px' }}>📄</div>
          <div style={{ fontWeight: 600, fontSize: '1.1rem' }}>
            {fileName ? fileName : 'Drop your exported PDF here'}
          </div>
          <div style={{ color: '#64748b', fontSize: '0.85rem', marginTop: '6px' }}>
            {fileName ? 'Click or drop a new file to retest' : 'or click to browse'}
          </div>
        </div>

        {/* Loading */}
        {loading && (
          <div style={{ textAlign: 'center', padding: '40px', color: '#6366f1' }}>
            <div style={{ fontSize: '1.1rem', fontWeight: 600 }}>Analyzing PDF text layer…</div>
          </div>
        )}

        {/* Results */}
        {result && !loading && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

            {/* Summary Row */}
            <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid #1e293b', borderRadius: '12px', padding: '20px' }}>
              <h2 style={{ margin: '0 0 16px', fontSize: '1rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1px' }}>Test Results</h2>
              {result.error ? (
                <div style={{ color: '#ef4444', fontWeight: 600 }}>❌ Error: {result.error}</div>
              ) : (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                  <StatusBadge ok={result.atsBlockFound} label="ATS Text Block Found" />
                  <StatusBadge ok={result.jsonPayloadFound} label="JSON Payload Found" />
                  <StatusBadge ok={result.jsonPayloadValid} label="JSON Parses Correctly" />
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '4px 12px', borderRadius: '20px', fontSize: '0.85rem', fontWeight: 600, background: 'rgba(99,102,241,0.15)', color: '#818cf8', border: '1px solid rgba(99,102,241,0.3)' }}>
                    📄 {result.pageCount} page(s) · {result.totalTextLength.toLocaleString()} chars extracted
                  </span>
                </div>
              )}
            </div>

            {/* ATS Text Block */}
            {result.atsBlock && (
              <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid #1e293b', borderRadius: '12px', padding: '20px' }}>
                <h2 style={{ margin: '0 0 12px', fontSize: '1rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1px' }}>Extracted ATS Text Block</h2>
                <pre style={{ background: '#0a0f1a', border: '1px solid #1e293b', borderRadius: '8px', padding: '16px', fontSize: '0.75rem', color: '#a3e635', overflowX: 'auto', whiteSpace: 'pre-wrap', margin: 0 }}>
                  {result.atsBlock}
                </pre>
              </div>
            )}

            {/* JSON Payload */}
            {result.parsedResume && (
              <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid #1e293b', borderRadius: '12px', padding: '20px' }}>
                <h2 style={{ margin: '0 0 12px', fontSize: '1rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1px' }}>Parsed JSON Resume Object</h2>
                <pre style={{ background: '#0a0f1a', border: '1px solid #1e293b', borderRadius: '8px', padding: '16px', fontSize: '0.75rem', color: '#38bdf8', overflowX: 'auto', whiteSpace: 'pre-wrap', margin: 0, maxHeight: '500px' }}>
                  {JSON.stringify(result.parsedResume, null, 2)}
                </pre>
              </div>
            )}

            {/* JSON Error */}
            {result.jsonError && (
              <div style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '12px', padding: '20px', color: '#ef4444' }}>
                <strong>JSON Parse Error:</strong> {result.jsonError}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
