"use client";
import React, { useState, useEffect } from 'react';
import { supabase, setSupabaseToken } from '@/lib/supabase';
import { TemplateModern } from '@/components/TemplateModern';
import { TemplateModernSplit } from '@/components/TemplateModernSplit';
import { TemplateClassic } from '@/components/TemplateClassic';
import { TemplateMinimal } from '@/components/TemplateMinimal';
import { AlertCircle, Loader2, Users, Mail } from 'lucide-react';
import { AtsMetadata } from '@/components/AtsMetadata';
import { FollowButton } from '@/components/FollowButton';
import { Feed } from '@/components/Feed';
import { FollowListModal } from '@/components/FollowListModal';
import { useUser } from '@clerk/nextjs';
import Link from 'next/link';

export function ProfileClient({ username }: { username: string }) {
  const { user } = useUser();
  const [isMobile, setIsMobile] = useState(false);
  const [mobileScale, setMobileScale] = useState(0.45);
  const [resumeData, setResumeData] = useState<any>(null);
  const [profileData, setProfileData] = useState<any>(null);
  const [followers, setFollowers] = useState(0);
  const [following, setFollowing] = useState(0);
  const [template, setTemplate] = useState<string>('modern-split');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'resume' | 'posts'>('resume');
  const [followModalOpen, setFollowModalOpen] = useState(false);
  const [followModalType, setFollowModalType] = useState<'followers' | 'following'>('followers');

  const measureRef = React.useRef<HTMLDivElement>(null);
  const [pageCount, setPageCount] = useState(1);

  // Measure scrollWidth of the hidden CSS multi-column layout to determine physical page count
  useEffect(() => {
    const measure = () => {
      if (measureRef.current) {
        const width = measureRef.current.scrollWidth;
        setPageCount(Math.max(1, Math.ceil(width / 890)));
      }
    };
    
    // ResizeObserver watches for font/image loading or content scale adjustments
    const observer = new ResizeObserver(() => {
      setTimeout(measure, 50);
    });
    
    if (measureRef.current) {
      observer.observe(measureRef.current);
    }
    
    measure();
    return () => observer.disconnect();
  }, [resumeData, template, resumeData?.metadata?.scale]);

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

  const fetchProfile = React.useCallback(async () => {
    if (!username) return;
    try {
      setLoading(true);
      setError(null);


      // 1. Get profile by username
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id, full_name, avatar_url, username')
        .eq('username', username)
        .single();

      if (profileError || !profile) {
        console.error('Profile fetch error:', profileError?.message, profileError?.code);
        setError('User profile not found.');
        setLoading(false);
        return;
      }
      setProfileData(profile);

      // 2. Fetch follower counts (non-blocking — don't let failures kill the page)
      supabase
        .from('followers')
        .select('*', { count: 'exact', head: true })
        .eq('following_id', profile.id)
        .then(({ count }) => setFollowers(count || 0));

      supabase
        .from('followers')
        .select('*', { count: 'exact', head: true })
        .eq('follower_id', profile.id)
        .then(({ count }) => setFollowing(count || 0));

      // 3. Get resume — failure here does NOT hide the profile
      const { data: resume, error: resumeError } = await supabase
        .from('resumes')
        .select('*')
        .eq('user_id', profile.id)
        .eq('is_public', true)
        .order('updated_at', { ascending: false })
        .limit(1)
        .single();

      if (resume && !resumeError) {
        setResumeData(resume.data);
        setTemplate(resume.template || 'modern-split');
      } else {
        // Clear any previously loaded resume if it's now private/missing
        setResumeData(null);
        if (resumeError && resumeError.code !== 'PGRST116') {
          console.error('Resume fetch error:', resumeError.message, resumeError.code);
        }
      }
    } catch (err) {
      console.error('Error fetching public profile:', err);
      setError('An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  }, [username]);

  // Initial fetch + re-fetch on window focus (catches changes made in builder tab)
  useEffect(() => {
    fetchProfile();

    const handleFocus = () => fetchProfile();
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [fetchProfile]);


  if (loading) {
    return (
      <div style={{ minHeight: '100dvh', background: 'var(--bg-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-primary)' }}>
        <div style={{ textAlign: 'center' }}>
          <Loader2 className="animate-spin" size={48} style={{ margin: '0 auto 1rem', color: 'var(--primary)' }} />
          <p style={{ fontSize: '1.2rem', fontWeight: 500 }}>Loading CareerReport...</p>
        </div>
      </div>
    );
  }

  // Only show the full error screen if the PROFILE itself wasn't found.
  // Missing resume data is handled gracefully inside the tab.
  if (error) {
    return (
      <div style={{ minHeight: '100dvh', background: 'var(--bg-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-primary)', padding: '2rem' }}>
        <div style={{ maxWidth: '400px', textAlign: 'center', background: 'var(--surface-color)', padding: '3rem', borderRadius: '16px', boxShadow: '0 10px 40px rgba(0,0,0,0.2)', border: '1px solid var(--glass-border)' }}>
          <AlertCircle size={64} style={{ color: 'var(--error)', marginBottom: '1.5rem' }} />
          <h1 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>Profile Unavailable</h1>
          <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '2rem' }}>{error}</p>
          <a href="/" style={{ background: 'var(--primary)', color: 'var(--bg-color)', padding: '0.75rem 2rem', borderRadius: '8px', textDecoration: 'none', fontWeight: 600, display: 'inline-block' }}>Go Home</a>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100dvh', background: 'var(--bg-color)', display: 'flex', flexDirection: 'column' }}>
      <main className={isMobile ? "hide-scrollbar" : ""} style={{ flex: 1, padding: isMobile ? '1rem 0' : '3rem 2rem', display: 'flex', flexDirection: 'column', alignItems: 'center', overflowX: 'hidden' }}>
        
        {/* Social Header */}
        <div style={{ 
          width: isMobile ? '90%' : '850px',
          background: 'var(--surface-color)',
          borderRadius: '16px',
          padding: '1.5rem',
          marginBottom: '2rem',
          border: '1px solid var(--glass-border)',
          display: 'flex',
          flexDirection: isMobile ? 'column' : 'row',
          alignItems: isMobile ? 'center' : 'flex-start',
          gap: '1.5rem',
          boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
        }}>
          {profileData?.avatar_url ? (
            <img src={profileData.avatar_url} alt={profileData.full_name || 'Profile'} style={{ width: '80px', height: '80px', borderRadius: '50%', objectFit: 'cover', border: '3px solid var(--glass-border)' }} />
          ) : (
            <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--bg-color)', fontSize: '2rem', fontWeight: 'bold' }}>
              {profileData?.full_name?.charAt(0) || profileData?.username?.charAt(0) || '?'}
            </div>
          )}
          
          <div style={{ flex: 1, textAlign: isMobile ? 'center' : 'left' }}>
            <h1 style={{ fontSize: '1.5rem', margin: '0 0 0.25rem 0', color: 'var(--text-primary)' }}>{profileData?.full_name || `@${profileData?.username}`}</h1>
            <p style={{ margin: '0 0 1rem 0', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>@{profileData?.username}</p>
            
            <div style={{ display: 'flex', gap: '1.5rem', justifyContent: isMobile ? 'center' : 'flex-start', color: 'var(--text-primary)' }}>
              <div 
                onClick={() => { setFollowModalType('followers'); setFollowModalOpen(true); }}
                style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', cursor: 'pointer' }}
                className="hover-opacity"
              >
                <Users size={16} color="var(--text-secondary)" />
                <span style={{ fontWeight: 600 }}>{followers}</span> <span style={{ color: 'var(--text-secondary)' }}>Followers</span>
              </div>
              <div 
                onClick={() => { setFollowModalType('following'); setFollowModalOpen(true); }}
                style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', cursor: 'pointer' }}
                className="hover-opacity"
              >
                <span style={{ fontWeight: 600 }}>{following}</span> <span style={{ color: 'var(--text-secondary)' }}>Following</span>
              </div>
            </div>
          </div>
          
          <div style={{ display: 'flex', gap: '0.75rem', width: isMobile ? '100%' : 'auto', marginTop: isMobile ? '1rem' : 0 }}>
            {profileData?.id && (
              <FollowButton 
                targetUserId={profileData.id} 
                onFollowChange={(isFollowingStatus) => {
                  setFollowers(prev => isFollowingStatus ? prev + 1 : Math.max(0, prev - 1));
                }} 
              />
            )}
            {profileData?.id && profileData.id !== user?.id && (
              <Link href={`/messages?to=${profileData.username}`} className="btn btn-secondary" style={{ padding: '0.5rem 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem', fontWeight: 600, flex: isMobile ? 1 : 'none', justifyContent: 'center', textDecoration: 'none' }}>
                <Mail size={16} /> Message
              </Link>
            )}
          </div>
        </div>

        <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', width: isMobile ? '90%' : '850px', justifyContent: 'center' }}>
          <button 
            onClick={() => setActiveTab('resume')} 
            className="btn"
            style={{ 
              background: activeTab === 'resume' ? 'var(--primary)' : 'transparent', 
              color: activeTab === 'resume' ? 'var(--bg-color)' : 'var(--text-primary)',
              flex: isMobile ? 1 : 'none',
              padding: '0.75rem 2rem'
            }}>
            Resume
          </button>
          <button 
            onClick={() => setActiveTab('posts')} 
            className="btn"
            style={{ 
              background: activeTab === 'posts' ? 'var(--primary)' : 'transparent', 
              color: activeTab === 'posts' ? 'var(--bg-color)' : 'var(--text-primary)',
              flex: isMobile ? 1 : 'none',
              padding: '0.75rem 2rem'
            }}>
            Posts
          </button>
        </div>

        {activeTab === 'resume' ? (
          resumeData ? (
            <div style={{ width: isMobile ? '100%' : '850px', display: 'flex', justifyContent: 'center', alignItems: 'flex-start' }}>
              <div style={{ width: isMobile ? `${850 * mobileScale}px` : '850px', height: isMobile ? `${1100 * mobileScale}px` : 'auto', overflow: 'visible', display: 'flex', justifyContent: 'center' }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                {/* Visual Vertical Pages generated by slicing the CSS Columns */}
                {Array.from({ length: pageCount }).map((_, i) => (
                  <div key={`page-${i}`} className="resume-ui-page">
                    <div style={{ position: 'absolute', top: 0, left: `-${i * 890}px`, width: '850px' }}>
                      <div className="resume-ui-layout">
                        <div style={{ zoom: resumeData.metadata?.scale || 1 }}>
                          <AtsMetadata data={resumeData} />
                          {template === 'modern' && <TemplateModern data={resumeData} />}
                          {template === 'modern-split' && <TemplateModernSplit data={resumeData} />}
                          {template === 'classic' && <TemplateClassic data={resumeData} />}
                          {template === 'minimal' && <TemplateMinimal data={resumeData} />}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}

                {/* Hidden container for layout measurement */}
                <div style={{ opacity: 0, position: 'absolute', top: 0, left: 0, pointerEvents: 'none', zIndex: -1 }}>
                  <div ref={measureRef} className="resume-ui-layout" style={{ width: '850px' }}>
                    <div style={{ zoom: resumeData.metadata?.scale || 1 }}>
                      <AtsMetadata data={resumeData} />
                      {template === 'modern' && <TemplateModern data={resumeData} />}
                      {template === 'modern-split' && <TemplateModernSplit data={resumeData} />}
                      {template === 'classic' && <TemplateClassic data={resumeData} />}
                      {template === 'minimal' && <TemplateMinimal data={resumeData} />}
                    </div>
                  </div>
                </div>
              </div>
              </div>
            </div>
          ) : (
            <div style={{ width: isMobile ? '90%' : '850px', textAlign: 'center', padding: '3rem 1rem', background: 'var(--surface-color)', borderRadius: '16px', border: '1px solid var(--glass-border)', color: 'var(--text-secondary)' }}>
              <p style={{ fontSize: '1.1rem', marginBottom: '1rem' }}>🗂️ No resume published yet.</p>
              <p style={{ fontSize: '0.9rem' }}>This user hasn't shared their resume publicly.</p>
            </div>
          )
        ) : (
          <div style={{ width: '100%', maxWidth: '850px', display: 'flex', justifyContent: 'center' }}>
            <div style={{ width: '100%', maxWidth: '600px' }}>
              <Feed targetUserId={profileData?.id} />
            </div>
          </div>
        )}
      </main>
      
      {!isMobile && (
        <footer style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.875rem', background: 'var(--surface-color)', borderTop: '1px solid var(--glass-border)' }}>
          <p>&copy; 2026 CareerReport. Built for the new generation.</p>
        </footer>
      )}

      {profileData?.id && (
        <FollowListModal 
          isOpen={followModalOpen}
          onClose={() => setFollowModalOpen(false)}
          userId={profileData.id}
          type={followModalType}
        />
      )}
    </div>
  );
}
