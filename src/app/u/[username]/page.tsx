"use client";
import React from 'react';
import Link from 'next/link';
import { defaultResume } from '@/lib/default-resume';
import { TemplateModernSplit } from '@/components/TemplateModernSplit';
import { FileText, Send, UserPlus, Share2 } from 'lucide-react';

import { useState, useEffect } from 'react';

export default function PublicProfilePage({ params }: { params: { username: string } }) {
  const [isMobile, setIsMobile] = useState(false);
  const [mobileScale, setMobileScale] = useState(0.45);

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      setIsMobile(width <= 768);
      const padding = 32;
      const targetWidth = 850;
      const calculatedScale = Math.min(1, (width - padding) / targetWidth);
      setMobileScale(calculatedScale);
      
      if (width <= 768) {
        document.body.classList.add('hide-scrollbar');
      } else {
        document.body.classList.remove('hide-scrollbar');
      }
    };
    
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      document.body.classList.remove('hide-scrollbar');
    };
  }, []);

  // Mock data fetching based on username. Using defaultResume for demo.
  const data = defaultResume;

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-color)', display: 'flex', flexDirection: 'column' }}>
      <main className={isMobile ? "hide-scrollbar" : ""} style={{ flex: 1, padding: isMobile ? '1rem 0' : '3rem 2rem', display: 'flex', justifyContent: 'center', overflowX: 'hidden' }}>
        <div style={{ 
          width: isMobile ? '100%' : '850px', 
          display: 'flex', 
          justifyContent: 'center',
          alignItems: 'flex-start'
        }}>
          <div style={{ 
            width: isMobile ? `${850 * mobileScale}px` : '850px', 
            height: isMobile ? `${1100 * mobileScale}px` : 'auto',
            overflow: 'visible',
            display: 'flex',
            justifyContent: 'center'
          }}>
            <div style={{ 
              width: '850px',
              transform: isMobile ? `scale(${mobileScale})` : 'none',
              transformOrigin: 'top center',
              boxShadow: '0 10px 40px rgba(0,0,0,0.2)',
              marginLeft: '0'
            }}>
              <div className="resume-preview" style={{ position: 'relative' }}>
                <TemplateModernSplit data={data} />
              </div>
            </div>
          </div>
        </div>
      </main>
      
      {!isMobile && (
        <footer style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.875rem', background: 'var(--surface-color)', borderTop: '1px solid var(--glass-border)' }}>
          <p>&copy; 2026 CareerReport. Built for the new generation.</p>
        </footer>
      )}
    </div>
  );
}
