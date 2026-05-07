"use client";
import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { TemplateModern } from '@/components/TemplateModern';
import { TemplateModernSplit } from '@/components/TemplateModernSplit';
import { TemplateClassic } from '@/components/TemplateClassic';
import { TemplateMinimal } from '@/components/TemplateMinimal';
import { AlertCircle, Loader2 } from 'lucide-react';
import { AtsMetadata } from '@/components/AtsMetadata';

import { use } from 'react';

export default function PublicProfilePage({ params }: { params: Promise<{ username: string }> }) {
  const resolvedParams = use(params);
  const username = resolvedParams.username;
  const [isMobile, setIsMobile] = useState(false);
  const [mobileScale, setMobileScale] = useState(0.45);
  const [resumeData, setResumeData] = useState<any>(null);
  const [template, setTemplate] = useState<string>('modern-split');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  useEffect(() => {
    async function fetchResume() {
      try {
        setLoading(true);
        // 1. Get profile by username
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('id')
          .eq('username', username)
          .single();

        if (profileError || !profile) {
          setError('User profile not found.');
          setLoading(false);
          return;
        }

        // 2. Get resume for that profile ID
        const { data: resume, error: resumeError } = await supabase
          .from('resumes')
          .select('*')
          .eq('user_id', profile.id)
          .single();

        if (resumeError || !resume) {
          setError('No public resume found for this user.');
        } else {
          setResumeData(resume.data);
          setTemplate(resume.template || 'modern-split');
        }
      } catch (err) {
        console.error('Error fetching public profile:', err);
        setError('An unexpected error occurred.');
      } finally {
        setLoading(false);
      }
    }

    if (username) {
      fetchResume();
    }
  }, [username]);

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--bg-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-primary)' }}>
        <div style={{ textAlign: 'center' }}>
          <Loader2 className="animate-spin" size={48} style={{ margin: '0 auto 1rem', color: 'var(--primary)' }} />
          <p style={{ fontSize: '1.2rem', fontWeight: 500 }}>Loading CareerReport...</p>
        </div>
      </div>
    );
  }

  if (error || !resumeData) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--bg-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-primary)', padding: '2rem' }}>
        <div style={{ maxWidth: '400px', textAlign: 'center', background: 'var(--surface-color)', padding: '3rem', borderRadius: '16px', boxShadow: '0 10px 40px rgba(0,0,0,0.2)', border: '1px solid var(--glass-border)' }}>
          <AlertCircle size={64} style={{ color: 'var(--error)', marginBottom: '1.5rem' }} />
          <h1 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>Profile Unavailable</h1>
          <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '2rem' }}>{error || "This user hasn't published a resume yet."}</p>
          <a href="/" style={{ background: 'var(--primary)', color: 'white', padding: '0.75rem 2rem', borderRadius: '8px', textDecoration: 'none', fontWeight: 600, display: 'inline-block' }}>Go Home</a>
        </div>
      </div>
    );
  }

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
                <AtsMetadata data={resumeData} />
                {template === 'modern' && <TemplateModern data={resumeData} />}
                {template === 'modern-split' && <TemplateModernSplit data={resumeData} />}
                {template === 'classic' && <TemplateClassic data={resumeData} />}
                {template === 'minimal' && <TemplateMinimal data={resumeData} />}
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
