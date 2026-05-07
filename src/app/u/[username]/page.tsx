"use client";
import React from 'react';
import Link from 'next/link';
import { defaultResume } from '@/lib/default-resume';
import { TemplateModernSplit } from '@/components/TemplateModernSplit';
import { FileText, Send, UserPlus, Share2 } from 'lucide-react';

export default function PublicProfilePage({ params }: { params: { username: string } }) {
  // Mock data fetching based on username. Using defaultResume for demo.
  const data = defaultResume;

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', display: 'flex', flexDirection: 'column' }}>
      <main style={{ flex: 1, padding: '3rem 2rem', display: 'flex', justifyContent: 'center' }}>
        <div style={{ maxWidth: '1000px', width: '100%', boxShadow: '0 10px 40px rgba(0,0,0,0.08)', borderRadius: '12px', overflow: 'hidden' }}>
          <TemplateModernSplit data={data} />
        </div>
      </main>
      
      <footer style={{ padding: '2rem', textAlign: 'center', color: '#64748b', fontSize: '0.875rem', background: 'white', borderTop: '1px solid #e2e8f0' }}>
        <p>&copy; 2026 CareerReport. Built for the new generation.</p>
      </footer>
    </div>
  );
}
