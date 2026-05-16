"use client";

import React, { useState, useRef, useEffect } from 'react';
import { defaultResume } from '@/lib/default-resume';
import { ResumeData } from '@/lib/resume-schema';
import { TemplateModern } from '@/components/TemplateModern';
import { TemplateClassic } from '@/components/TemplateClassic';
import { TemplateMinimal } from '@/components/TemplateMinimal';
import { useReactToPrint } from 'react-to-print';
import { Download, Sparkles, LayoutTemplate, Lock, RefreshCw, Plus, Minus, Trash2, Upload, Save, CheckCircle, AlertCircle, Info, Share2, Settings, User, X, Loader2, Wand2 } from 'lucide-react';
import { useUser, useAuth, SignInButton, SignUpButton, UserButton } from '@clerk/nextjs';
import { supabase } from "@/lib/supabase";
import { useAutoAnimate } from '@formkit/auto-animate/react';
import Link from 'next/link';
import { ImageCropper } from '@/components/ImageCropper';
import { AtsMetadata } from '@/components/AtsMetadata';
import { TemplateModernSplit } from '@/components/TemplateModernSplit';
import { UpgradeModal } from '@/components/UpgradeModal';

const months = [
  { v: '01', l: 'Jan.' }, { v: '02', l: 'Feb.' }, { v: '03', l: 'Mar.' },
  { v: '04', l: 'Apr.' }, { v: '05', l: 'May' }, { v: '06', l: 'Jun.' },
  { v: '07', l: 'Jul.' }, { v: '08', l: 'Aug.' }, { v: '09', l: 'Sep.' },
  { v: '10', l: 'Oct.' }, { v: '11', l: 'Nov.' }, { v: '12', l: 'Dec.' }
];

const currentYear = new Date().getFullYear();
const years = Array.from({ length: 60 }, (_, i) => (currentYear - i + 10).toString());

const MonthYearPicker = ({ value, onChange, disabled }: { value: string, onChange: (v: string) => void, disabled?: boolean }) => {
  if (disabled) {
    return <input type="text" disabled className="input-field" style={{ padding: '0.5rem', minWidth: 0, opacity: 0.5 }} value="Present" />;
  }

  const parts = value ? value.split('-') : ['', ''];
  const year = parts[0] || '';
  const month = parts[1] || '';

  return (
    <div style={{ display: 'flex', gap: '4px' }}>
      <select
        className={`input-field ${!month ? 'empty-date' : ''}`}
        style={{ padding: '0.5rem', minWidth: 0, flex: 1, cursor: 'pointer' }}
        value={month}
        onChange={e => onChange(`${year || currentYear}-${e.target.value}`)}
      >
        <option value="" disabled hidden>Mo.</option>
        {months.map(m => <option key={m.v} value={m.v} style={{ color: 'var(--text-primary)', background: 'var(--surface-color)' }}>{m.l}</option>)}
      </select>
      <select
        className={`input-field ${!year ? 'empty-date' : ''}`}
        style={{ padding: '0.5rem', minWidth: 0, flex: 1, cursor: 'pointer' }}
        value={year}
        onChange={e => onChange(`${e.target.value}-${month || '01'}`)}
      >
        <option value="" disabled hidden>Yr.</option>
        {years.map(y => <option key={y} value={y} style={{ color: 'var(--text-primary)', background: 'var(--surface-color)' }}>{y}</option>)}
      </select>
    </div>
  );
};

export default function BuilderPage() {
  const { isSignedIn, isLoaded, user } = useUser();
  const { getToken } = useAuth();
  const [activeTab, setActiveTab] = useState<'edit' | 'preview'>('edit');
  const [isMobile, setIsMobile] = useState(false);
  const [mobileScale, setMobileScale] = useState(0.45);

  // Handle window resize for mobile detection and preview scaling
  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      setIsMobile(width <= 768);
      
      // Calculate perfect scale to fit 850px resume into viewport width (minus padding)
      const padding = 32; // 1rem on each side
      const targetWidth = 850;
      const calculatedScale = Math.min(1, (width - padding) / targetWidth);
      setMobileScale(calculatedScale);
    };
    
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  const [data, setData] = useState<ResumeData>(defaultResume);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [template, setTemplate] = useState<'modern' | 'classic' | 'minimal' | 'modern-split'>('modern-split');
  const [isAILoading, setIsAILoading] = useState(false);
  const [showSectionMenu, setShowSectionMenu] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [isPublic, setIsPublic] = useState(true);
  const [profileUsername, setProfileUsername] = useState<string | null>(null);
  const [sharingCopied, setSharingCopied] = useState(false);

  // Track which optional sections are actively in the editor
  const [hasProjectsSection, setHasProjectsSection] = useState(false);
  const [hasReferencesSection, setHasReferencesSection] = useState(false);
  const [hasCertificationsSection, setHasCertificationsSection] = useState(false);
  const [showOverrides, setShowOverrides] = useState(false);
  const [includeHeadshot, setIncludeHeadshot] = useState(true);
  const [cropImageSrc, setCropImageSrc] = useState<string | null>(null);
  const [upgradeModalOpen, setUpgradeModalOpen] = useState(false);
  const [upgradeFeature, setUpgradeFeature] = useState('');
  const [undoData, setUndoData] = useState<ResumeData | null>(null);
  const [showUndo, setShowUndo] = useState(false);
  const [careerContext, setCareerContext] = useState('');

  const saveUndoState = () => {
    setUndoData(data);
    setShowUndo(true);
    setTimeout(() => setShowUndo(false), 8000);
  };
  const [sidebarRef] = useAutoAnimate<HTMLDivElement>();
  const [workRef] = useAutoAnimate<HTMLDivElement>();
  const [skillsRef] = useAutoAnimate<HTMLDivElement>();
  const [educationRef] = useAutoAnimate<HTMLDivElement>();
  const [projectsRef] = useAutoAnimate<HTMLDivElement>();
  const [referencesRef] = useAutoAnimate<HTMLDivElement>();
  const [certificationsRef] = useAutoAnimate<HTMLDivElement>();
  const [menuWrapperRef] = useAutoAnimate<HTMLDivElement>();

  // Load data from Supabase (if signed in) or localStorage (if guest)
  useEffect(() => {
    async function loadInitialData() {
      if (!isLoaded) return;

      if (isSignedIn && user) {
        setSaveStatus('saving');
        const token = await getToken({ template: 'supabase' });
        
        
        const { data: remoteData, error } = await supabase
          .from('resumes')
          .select('*')
          .eq('user_id', user.id)
          .order('updated_at', { ascending: false })
          .limit(1)
          .single();

        if (remoteData) {
          setData(remoteData.data);
          if (remoteData.template) setTemplate(remoteData.template);
          if (typeof remoteData.is_public === 'boolean') setIsPublic(remoteData.is_public);
          setSaveStatus('saved');
          setLastSaved(new Date(remoteData.updated_at));
          setIsInitialLoading(false);
        }

        // Also fetch the Supabase username and career context
        const { data: profileRow } = await supabase
          .from('profiles')
          .select('username, career_context')
          .eq('id', user.id)
          .single();
        if (profileRow?.username) setProfileUsername(profileRow.username);
        if (profileRow?.career_context) setCareerContext(profileRow.career_context);

        if (remoteData) return;
      }

      // Fallback to localStorage if guest or no cloud data found
      const savedData = localStorage.getItem('career-report-resume-draft');
      if (savedData) {
        try {
          const parsed = JSON.parse(savedData);
          setData(parsed.data || defaultResume);
          if (parsed.template) setTemplate(parsed.template);
          if (parsed.updatedAt) setLastSaved(new Date(parsed.updatedAt));
        } catch (e) {
          console.error("Failed to parse saved resume data", e);
        }
      }
      setIsInitialLoading(false);
    }

    loadInitialData();
  }, [isLoaded, isSignedIn, user?.id, getToken]);

  // Autosave to localStorage
  useEffect(() => {
    // Only lock body scroll on desktop to allow natural scrolling on mobile
    if (!isMobile) {
      document.body.style.overflow = 'hidden';
      document.body.classList.remove('hide-scrollbar');
    } else {
      document.body.style.overflow = 'auto';
      document.body.classList.add('hide-scrollbar');
    }
    return () => {
      document.body.style.overflow = 'auto';
      document.body.classList.remove('hide-scrollbar');
    };
  }, [isMobile]);

  useEffect(() => {
    if (!data) return;

    const timer = setTimeout(async () => {
      setSaveStatus('saving');
      try {
        const timestamp = new Date().toISOString();
        
        // 1. Always save to localStorage for quick recovery/guest mode
        localStorage.setItem('career-report-resume-draft', JSON.stringify({
          data,
          template,
          updatedAt: timestamp
        }));

        // 2. Save to Supabase if signed in
        if (isSignedIn && user) {
          const token = await getToken({ template: 'supabase' });
          

          const { error } = await supabase
            .from('resumes')
            .upsert({
              user_id: user.id,
              data,
              template,
              is_public: isPublic,
              updated_at: timestamp
            }, { onConflict: 'user_id' }); // Currently syncing one primary resume per user

          if (error) {
            console.error('Supabase sync error:', error.message || error);
          }
        }

        setSaveStatus('saved');
        setLastSaved(new Date());
        // Reset status to idle after a few seconds
        setTimeout(() => setSaveStatus('idle'), 3000);
      } catch (e) {
        console.error("Failed to autosave resume data", e);
        setSaveStatus('error');
      }
    }, 2000);

    return () => clearTimeout(timer);
  }, [data, template, isPublic, isSignedIn, user?.id, getToken]);

  const handleManualSave = () => {
    setSaveStatus('saving');
    try {
      localStorage.setItem('career-report-resume-draft', JSON.stringify({
        data,
        template,
        updatedAt: new Date().toISOString()
      }));
      setSaveStatus('saved');
      setLastSaved(new Date());
      setTimeout(() => setSaveStatus('idle'), 3000);

      if (!isSignedIn) {
        alert("Draft saved locally! Sign up to persist your resume to the cloud and get a public share link.");
      }
    } catch (e) {
      setSaveStatus('error');
    }
  };

  const contentRef = useRef<HTMLDivElement>(null);
  const measureRef = useRef<HTMLDivElement>(null);
  const [pageCount, setPageCount] = useState(1);

  // Measure scrollWidth of the hidden CSS multi-column layout to determine physical page count
  useEffect(() => {
    const measure = () => {
      if (measureRef.current) {
        // scrollWidth is total width including gap.
        // Each column + gap is 850 + 40 = 890px.
        const width = measureRef.current.scrollWidth;
        setPageCount(Math.max(1, Math.ceil(width / 890)));
      }
    };
    
    // ResizeObserver watches for font/image loading or content scale adjustments
    const observer = new ResizeObserver(() => {
      // Small debounce to let browser settle
      setTimeout(measure, 50);
    });
    
    if (measureRef.current) {
      observer.observe(measureRef.current);
    }
    
    measure();
    return () => observer.disconnect();
  }, [data, template, data.metadata?.scale]);

  const handlePrint = useReactToPrint({
    contentRef
  });

  const [aiLoading, setAiLoading] = useState<Record<string, boolean>>({});

  const isPremium = process.env.NODE_ENV === 'development'; // Mock premium in dev

  const handleJobAI = async (jobId: string, type: 'summary' | 'bullets') => {
    if (!isPremium) {
      setUpgradeFeature(type === 'summary' ? 'AI Job Summaries' : 'AI Bullet Points');
      setUpgradeModalOpen(true);
      return;
    }

    const job = data.work.find(j => j.id === jobId);
    if (!job) return;

    if (!job.name && !job.position && !job.summary && job.highlights.length === 0) {
      alert("Please provide at least a Job Title or Company to generate AI context.");
      return;
    }

    setAiLoading(prev => ({ ...prev, [`${jobId}-${type}`]: true }));
    try {
      const response = await fetch('/api/ai/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ context: { job, globalSkills: data.skills.map(s => s.name) }, type, careerContext })
      });
      if (!response.ok) throw new Error('Failed to generate');
      const text = await response.text();
      
      saveUndoState();
      setData(prev => ({
        ...prev,
        work: prev.work.map(j => {
          if (j.id === jobId) {
            if (type === 'summary') return { ...j, summary: text.replace(/"/g, '').trim() };
            if (type === 'bullets') return { ...j, highlights: text.split('\n').map(b => b.trim()).filter(b => b.length > 0) };
          }
          return j;
        })
      }));
    } catch (e) {
      console.error(e);
      alert("AI Generation failed. Please try again.");
    } finally {
      setAiLoading(prev => ({ ...prev, [`${jobId}-${type}`]: false }));
    }
  };

  const handleGenerateSkills = async (skillGroupId: string) => {
    if (!isPremium) {
      setUpgradeFeature('AI Skill Generation');
      setUpgradeModalOpen(true);
      return;
    }

    const skillGroup = data.skills.find(s => s.id === skillGroupId);
    if (!skillGroup) return;

    if (!skillGroup.name) {
      alert("Please provide a Category Name for the skill group first (e.g., 'Languages', 'Frameworks').");
      return;
    }

    setAiLoading(prev => ({ ...prev, [`skill-${skillGroupId}`]: true }));
    try {
      const response = await fetch('/api/ai/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          context: { 
            categoryName: skillGroup.name,
            currentKeywords: skillGroup.keywords,
            fullResume: data
          }, 
          type: 'skills', 
          careerContext 
        })
      });
      if (!response.ok) throw new Error('Failed to generate');
      const text = await response.text();
      
      saveUndoState();
      setData(prev => ({
        ...prev,
        skills: prev.skills.map(s => {
          if (s.id === skillGroupId) {
            const generatedSkills = text.split(',').map(k => k.trim()).filter(k => k.length > 0);
            return { ...s, keywords: generatedSkills };
          }
          return s;
        })
      }));
    } catch (e) {
      console.error(e);
      alert('Failed to generate skills. Please try again.');
    } finally {
      setAiLoading(prev => ({ ...prev, [`skill-${skillGroupId}`]: false }));
    }
  };

  const handleRewrite = async () => {
    if (!isPremium) {
      setUpgradeFeature('AI Professional Summary');
      setUpgradeModalOpen(true);
      return;
    }

    if (!data.work.length && !data.skills.length && !data.education.length && !data.basics.summary) {
      alert("Please add some experience, skills, or education before generating a Professional Summary.");
      return;
    }

    setIsAILoading(true);
    try {
      const response = await fetch('/api/ai/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ context: data, type: 'rewrite', careerContext })
      });
      if (!response.ok) throw new Error('Failed to rewrite');
      const text = await response.text();
      
      saveUndoState();
      setData(prev => ({
        ...prev,
        basics: { ...prev.basics, summary: text.replace(/"/g, '').trim() }
      }));
    } catch (e) {
      console.error(e);
      alert("AI Rewrite failed.");
    } finally {
      setIsAILoading(false);
    }
  };

  const handlePdfImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      e.target.value = ''; // reset input
      
      if (!isPremium) {
        setUpgradeFeature('AI PDF Resume Import');
        setUpgradeModalOpen(true);
        return;
      }

      setIsAILoading(true);
      try {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('careerContext', careerContext);
        
        const response = await fetch('/api/ai/parse-pdf', {
          method: 'POST',
          body: formData
        });
        
        if (!response.ok) throw new Error('Failed to parse PDF');
        
        const parsedData = await response.json();
        if (parsedData) {
          saveUndoState();
          setData(prev => ({
            ...prev,
            ...parsedData,
            metadata: prev.metadata
          }));
          alert("Resume imported successfully!");
        }
      } catch (err) {
        console.error(err);
        alert("Failed to parse PDF resume.");
      } finally {
        setIsAILoading(false);
      }
    }
  };

  const handleImageToggle = (e: React.ChangeEvent<HTMLInputElement>) => {
    setData(prev => ({
      ...prev,
      basics: {
        ...prev.basics,
        image: e.target.checked ? "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?fit=crop&w=300&h=300&q=80" : ""
      }
    }));
  };

  // Generic Job Handlers
  const handleJobChange = (id: string, field: string, value: any) => {
    setData(prev => ({
      ...prev,
      work: prev.work.map(job => job.id === id ? { ...job, [field]: value } : job)
    }));
  };

  const handleAddJob = () => {
    setData(prev => ({
      ...prev,
      work: [...prev.work, { id: crypto.randomUUID(), name: '', position: '', url: '', startDate: '', endDate: '', summary: '', highlights: [] }]
    }));
  };

  const handleRemoveJob = (id: string) => {
    setData(prev => ({
      ...prev,
      work: prev.work.filter(job => job.id !== id)
    }));
  };

  // Education Handlers
  const handleEducationChange = (id: string, field: string, value: any) => {
    setData(prev => ({
      ...prev,
      education: (prev.education || []).map(edu => edu.id === id ? { ...edu, [field]: value } : edu)
    }));
  };

  const handleAddEducation = () => {
    setData(prev => ({
      ...prev,
      education: [...(prev.education || []), { id: crypto.randomUUID(), institution: '', area: '', studyType: '', startDate: '', endDate: '', score: '', courses: [], url: '' }]
    }));
  };

  const handleRemoveEducation = (id: string) => {
    setData(prev => ({
      ...prev,
      education: (prev.education || []).filter(edu => edu.id !== id)
    }));
  };

  // Skills Handlers
  const handleAddSkillCategory = () => {
    setData(prev => ({
      ...prev,
      skills: [...(prev.skills || []), { id: crypto.randomUUID(), name: '', level: '', keywords: [] }]
    }));
  };

  const handleRemoveSkillCategory = (id: string) => {
    setData(prev => ({
      ...prev,
      skills: (prev.skills || []).filter(s => s.id !== id)
    }));
  };

  const handleSkillCategoryChange = (id: string, field: string, value: any) => {
    setData(prev => ({
      ...prev,
      skills: (prev.skills || []).map(s => s.id === id ? { ...s, [field]: value } : s)
    }));
  };

  const handleLayoutChange = (module: 'work' | 'education' | 'skills' | 'projects' | 'references' | 'certifications', cols: number) => {
    setData(prev => ({
      ...prev,
      metadata: {
        ...prev.metadata,
        layout: {
          ...(prev.metadata?.layout || { work: 1, education: 1, skills: 3, projects: 1, references: 2, certifications: 1 }),
          [module]: cols
        }
      }
    }));
  };

  // Projects Handlers
  const handleAddProject = () => {
    setData(prev => ({
      ...prev,
      projects: [...(prev.projects || []), { id: crypto.randomUUID(), name: '', description: '', url: '' }]
    }));
  };

  const handleProjectChange = (id: string, field: string, value: string) => {
    setData(prev => ({
      ...prev,
      projects: (prev.projects || []).map(p => p.id === id ? { ...p, [field]: value } : p)
    }));
  };

  const handleRemoveProject = (id: string) => {
    setData(prev => ({
      ...prev,
      projects: (prev.projects || []).filter(p => p.id !== id)
    }));
  };

  // References Handlers
  const handleAddReference = () => {
    setData(prev => ({
      ...prev,
      references: [...(prev.references || []), { id: crypto.randomUUID(), name: '', reference: '' }]
    }));
  };

  const handleReferenceChange = (id: string, field: string, value: string) => {
    setData(prev => ({
      ...prev,
      references: (prev.references || []).map(r => r.id === id ? { ...r, [field]: value } : r)
    }));
  };

  const handleRemoveReference = (id: string) => {
    setData(prev => ({
      ...prev,
      references: (prev.references || []).filter(r => r.id !== id)
    }));
  };

  // Certifications Handlers
  const handleAddCertification = () => {
    setData(prev => ({
      ...prev,
      certifications: [...(prev.certifications || []), { id: crypto.randomUUID(), name: '', issuer: '', date: '' }]
    }));
  };

  const handleRemoveCertification = (id: string) => {
    setData(prev => ({ ...prev, certifications: (prev.certifications || []).filter(c => c.id !== id) }));
  };

  const handleCertificationChange = (id: string, field: string, value: string) => {
    setData(prev => ({
      ...prev,
      certifications: (prev.certifications || []).map(c => c.id === id ? { ...c, [field]: value } : c)
    }));
  };

  if (isInitialLoading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 'calc(100dvh - 82px)', gap: '1.5rem', background: 'var(--bg-color)', color: 'var(--text-secondary)' }}>
        <Loader2 size={48} className="animate-spin" color="var(--primary)" />
        <p style={{ fontSize: '1.1rem', fontWeight: 500 }}>Loading your workspace...</p>
      </div>
    );
  }

  return (
    <div className="builder-layout" style={{ 
      display: 'flex', 
      flexDirection: isMobile ? 'column' : 'row',
      height: isMobile ? 'auto' : 'calc(100dvh - 82px)', 
      width: '100vw', 
      overflow: isMobile ? 'visible' : 'hidden', 
      position: isMobile ? 'relative' : 'fixed', 
      top: isMobile ? '0' : '82px', 
      left: 0,
      background: 'var(--bg-color)'
    }}>
      {isMobile && (
        <>
          <div style={{ 
            position: 'fixed', 
            top: '60px', 
            left: 0,
            right: 0,
            zIndex: 100, 
            background: 'var(--surface-color)', 
            padding: '0.5rem', 
            display: 'flex', 
            gap: '0.5rem',
            borderBottom: '1px solid var(--glass-border)',
            boxShadow: '0 2px 10px rgba(0,0,0,0.3)'
          }}>
            <button 
              onClick={() => setActiveTab('edit')} 
              className="btn" 
              style={{ 
                flex: 1, 
                background: activeTab === 'edit' ? 'var(--primary)' : 'transparent',
                color: activeTab === 'edit' ? 'var(--bg-color)' : 'var(--text-primary)',
                padding: '0.5rem',
                fontSize: '0.9rem'
              }}
            >
              Edit Resume
            </button>
            <button 
              onClick={() => setActiveTab('preview')} 
              className="btn" 
              style={{ 
                flex: 1, 
                background: activeTab === 'preview' ? 'var(--primary)' : 'transparent',
                color: activeTab === 'preview' ? 'var(--bg-color)' : 'var(--text-primary)',
                padding: '0.5rem',
                fontSize: '0.9rem'
              }}
            >
              Live Preview
            </button>
          </div>
          <div style={{ height: '57px' }} /> {/* Spacer for fixed tabs */}
        </>
      )}

      {/* Sidebar Editor */}
      <aside 
        className="builder-sidebar" 
        style={{ 
          width: isMobile ? '100%' : '400px', 
          background: 'var(--surface-color)', 
          borderRight: isMobile ? 'none' : '1px solid var(--glass-border)', 
          display: isMobile ? (activeTab === 'edit' ? 'flex' : 'none') : 'flex', 
          flexDirection: 'column', 
          height: isMobile ? 'auto' : '100%' 
        }}
      >
        <div style={{ padding: isMobile ? '0.75rem 1.5rem' : '1.5rem', borderBottom: '1px solid var(--glass-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h1 style={{ fontSize: isMobile ? '1.1rem' : '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Link href="/" style={{ color: 'var(--primary)', fontWeight: 'bold' }}>CareerReport</Link> {isMobile ? '' : 'Builder'}
          </h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>

            {isMobile && (
            <select
              value={template}
              onChange={(e) => setTemplate(e.target.value as any)}
              className="input-field"
              style={{ width: 'auto', padding: '0.35rem 0.6rem', background: 'var(--surface-color)', border: '1px solid var(--glass-border)', color: 'var(--text-primary)', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem' }}
            >
              <option value="modern">Modern</option>
              <option value="modern-split">Split</option>
              <option value="minimal">Minimal</option>
              <option value="classic">Classic</option>
            </select>
          )}
          </div>
        </div>

        <div ref={sidebarRef} className="sidebar-scroll" style={{ padding: '1.5rem', flex: 1 }}>
          {/* AI Import Section */}
          <div style={{ marginBottom: '2rem', padding: '1rem', background: 'var(--surface-highlight)', borderRadius: '8px', border: '1px solid var(--primary)', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--primary)' }}>
                <Sparkles size={16} /> AI Resume Import <Lock size={12} />
              </span>
            </div>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5 }}>
              Upload your existing PDF resume and let CareerReport AI instantly extract and populate your profile.
            </p>
            <label className="btn btn-primary" style={{ marginTop: '0.5rem', cursor: isAILoading ? 'not-allowed' : 'pointer', textAlign: 'center', display: 'flex', justifyContent: 'center', gap: '0.5rem', padding: '0.5rem', opacity: isAILoading ? 0.7 : 1 }}>
              {isAILoading ? <RefreshCw size={16} className="animate-spin" /> : <Upload size={16} />}
              {isAILoading ? 'Extracting Data...' : 'Upload PDF'}
              <input type="file" accept=".pdf" style={{ display: 'none' }} onChange={handlePdfImport} disabled={isAILoading} />
            </label>
            
            <div style={{ marginTop: '1rem', borderTop: '1px solid var(--glass-border)', paddingTop: '1rem' }}>
              <label className="label" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                Career Context System Prompt
              </label>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', margin: '0 0 0.5rem 0', lineHeight: 1.4 }}>
                Describe your target industry, tone, or seniority. AI will use this to personalize all rewrites and imports.
              </p>
              <textarea
                className="input-field"
                style={{ minHeight: '60px', resize: 'vertical', fontSize: '0.85rem', padding: '0.5rem' }}
                placeholder="e.g. 'I am a Senior Staff Engineer applying to YC startups. Keep the tone extremely concise and impactful.'"
                value={careerContext}
                onChange={(e) => setCareerContext(e.target.value)}
                onBlur={async () => {
                  if (isSignedIn && user) {
                    await supabase.from('profiles').update({ career_context: careerContext }).eq('id', user.id);
                  }
                }}
              />
            </div>
          </div>

          {/* Basics Section */}
          <div className="form-group">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <label className="label" style={{ marginBottom: 0 }}>Headshot</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input
                  type="checkbox"
                  id="include-headshot"
                  checked={includeHeadshot}
                  onChange={(e) => setIncludeHeadshot(e.target.checked)}
                  style={{ cursor: 'pointer' }}
                />
                <label htmlFor="include-headshot" style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', cursor: 'pointer', margin: 0 }}>Include in resume</label>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '1.5rem' }}>
              {data.basics.image && <img src={data.basics.image} alt="Headshot" style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover', border: '1px solid var(--glass-border)' }} />}
              <label className="btn btn-secondary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem', cursor: 'pointer', flex: 1 }}>
                <Upload size={14} /> {data.basics.image ? 'Change Image' : 'Upload Image'}
                <input
                  type="file"
                  accept="image/*"
                  style={{ display: 'none' }}
                  onChange={(e) => {
                    if (e.target.files && e.target.files.length > 0) {
                      const reader = new FileReader();
                      reader.addEventListener('load', () => setCropImageSrc(reader.result as string));
                      reader.readAsDataURL(e.target.files[0]);
                      // Reset the input value so the same file can be uploaded again if needed
                      e.target.value = '';
                    }
                  }}
                />
              </label>
              {data.basics.image && (
                <button
                  onClick={() => setData(prev => ({ ...prev, basics: { ...prev.basics, image: '' } }))}
                  className="btn-icon"
                  style={{ color: 'var(--danger)', padding: '0.4rem' }}
                  title="Remove Image"
                >
                  <Trash2 size={16} />
                </button>
              )}
            </div>
          </div>

          <div className="form-group">
            <label className="label">Full Name</label>
            <input type="text" className="input-field" value={data.basics.name} onChange={(e) => setData(prev => ({ ...prev, basics: { ...prev.basics, name: e.target.value } }))} />
          </div>
          <div className="form-group">
            <label className="label">Professional Title</label>
            <input type="text" className="input-field" value={data.basics.label} onChange={(e) => setData(prev => ({ ...prev, basics: { ...prev.basics, label: e.target.value } }))} />
          </div>
          <div className="form-group">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
              <label className="label" style={{ margin: 0 }}>Professional Summary</label>
              <button
                onClick={handleRewrite}
                disabled={isAILoading}
                className="btn btn-primary"
                style={{ padding: '0.25rem 0.75rem', fontSize: '0.75rem', background: 'var(--accent)' }}
              >
                {isAILoading ? <RefreshCw size={14} className="animate-spin" /> : <><Sparkles size={14} /> AI Rewrite <Lock size={12} /></>}
              </button>
            </div>
            <textarea
              className="input-field"
              style={{ minHeight: '120px', resize: 'vertical' }}
              value={data.basics.summary}
              onChange={(e) => setData(prev => ({ ...prev, basics: { ...prev.basics, summary: e.target.value } }))}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginBottom: '1rem' }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="label">Email</label>
              <input type="email" className="input-field" value={data.basics.email} onChange={(e) => setData(prev => ({ ...prev, basics: { ...prev.basics, email: e.target.value } }))} />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="label">Phone</label>
              <input type="text" className="input-field" value={data.basics.phone} onChange={(e) => setData(prev => ({ ...prev, basics: { ...prev.basics, phone: e.target.value } }))} />
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginBottom: '1rem' }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="label">Location (City, State)</label>
              <input type="text" className="input-field" value={data.basics.location?.city || ''} onChange={(e) => setData(prev => ({ ...prev, basics: { ...prev.basics, location: { ...prev.basics.location, city: e.target.value, region: '' } } }))} />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="label">Website/URL</label>
              <input type="url" className="input-field" value={data.basics.url} onChange={(e) => setData(prev => ({ ...prev, basics: { ...prev.basics, url: e.target.value } }))} />
            </div>
          </div>

          <div style={{ paddingBottom: '1rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--glass-border)' }}>
            <button
              onClick={() => setShowOverrides(!showOverrides)}
              className="btn btn-secondary"
              style={{ width: '100%', borderStyle: 'dashed', borderColor: 'var(--text-secondary)', justifyContent: 'space-between' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <LayoutTemplate size={16} /> Template Overrides
              </div>
              {showOverrides ? <Minus size={16} /> : <Plus size={16} />}
            </button>

            {showOverrides && (
              <div style={{ marginTop: '1rem', padding: '1rem', background: 'var(--surface-highlight)', borderRadius: '8px', border: '1px solid var(--glass-border)', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                
                {/* Font Family */}
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="label" style={{ fontSize: '0.8rem' }}>Font Family</label>
                  <select className="input-field" value={data.metadata?.fontFamily || ''} onChange={(e) => setData(prev => ({ ...prev, metadata: { ...prev.metadata, fontFamily: e.target.value } }))} style={{ padding: '0.5rem', fontFamily: data.metadata?.fontFamily || 'inherit' }}>
                    <optgroup label="Sans-Serif">
                      <option value="Inter, sans-serif" style={{ fontFamily: 'Inter' }}>Inter (Default Modern)</option>
                      <option value="Lato, sans-serif" style={{ fontFamily: 'Lato' }}>Lato</option>
                      <option value="DM Sans, sans-serif" style={{ fontFamily: 'DM Sans' }}>DM Sans</option>
                      <option value="Raleway, sans-serif" style={{ fontFamily: 'Raleway' }}>Raleway</option>
                      <option value="Nunito Sans, sans-serif" style={{ fontFamily: 'Nunito Sans' }}>Nunito Sans</option>
                    </optgroup>
                    <optgroup label="Serif">
                      <option value="Libre Baskerville, serif" style={{ fontFamily: 'Libre Baskerville' }}>Libre Baskerville (Default Classic)</option>
                      <option value="Merriweather, serif" style={{ fontFamily: 'Merriweather' }}>Merriweather</option>
                      <option value="Playfair Display, serif" style={{ fontFamily: 'Playfair Display' }}>Playfair Display</option>
                      <option value="EB Garamond, serif" style={{ fontFamily: 'EB Garamond' }}>EB Garamond</option>
                    </optgroup>
                    <optgroup label="Monospace">
                      <option value="Source Code Pro, monospace" style={{ fontFamily: 'Source Code Pro' }}>Source Code Pro</option>
                    </optgroup>
                  </select>
                </div>

                {/* Font Size */}
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="label" style={{ fontSize: '0.8rem', display: 'flex', justifyContent: 'space-between' }}>
                    <span>Font Size</span>
                    <span style={{ color: 'var(--primary)', fontWeight: 700 }}>{((data.metadata?.fontSize || 1) * 100).toFixed(0)}%</span>
                  </label>
                  <input
                    type="range" min="0.75" max="1.2" step="0.01"
                    value={data.metadata?.fontSize || 1}
                    onChange={(e) => setData(prev => ({ ...prev, metadata: { ...prev.metadata, fontSize: parseFloat(e.target.value) } }))}
                    style={{ width: '100%' }}
                  />
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                    <span>75%</span><span>100%</span><span>120%</span>
                  </div>
                </div>

                {/* Page Margin */}
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="label" style={{ fontSize: '0.8rem', display: 'flex', justifyContent: 'space-between' }}>
                    <span>Page Margins</span>
                    <span style={{ color: 'var(--primary)', fontWeight: 700 }}>{(data.metadata?.pageMargin || 0.42).toFixed(2)}in</span>
                  </label>
                  <input
                    type="range" min="0.2" max="0.75" step="0.01"
                    value={data.metadata?.pageMargin || 0.42}
                    onChange={(e) => setData(prev => ({ ...prev, metadata: { ...prev.metadata, pageMargin: parseFloat(e.target.value) } }))}
                    style={{ width: '100%' }}
                  />
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                    <span>Narrow</span><span>Standard</span><span>Wide</span>
                  </div>
                </div>

                {/* Theme Color (Modern templates only) */}
                {(template === 'modern' || template === 'modern-split') && (
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="label" style={{ fontSize: '0.8rem' }}>Accent Color</label>
                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                      <input type="color" value={data.metadata?.themeColor || '#3b82f6'} onChange={(e) => setData(prev => ({ ...prev, metadata: { ...prev.metadata, themeColor: e.target.value } }))} style={{ width: '32px', height: '32px', padding: '0', border: 'none', borderRadius: '4px', cursor: 'pointer', background: 'transparent' }} />
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{data.metadata?.themeColor || '#3b82f6'}</span>
                    </div>
                  </div>
                )}

                {/* Sidebar Color (Minimal only) */}
                {template === 'minimal' && (
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="label" style={{ fontSize: '0.8rem' }}>Sidebar Background</label>
                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                      <input type="color" value={data.metadata?.minimalSidebarColor || '#fafafa'} onChange={(e) => setData(prev => ({ ...prev, metadata: { ...prev.metadata, minimalSidebarColor: e.target.value } }))} style={{ width: '32px', height: '32px', padding: '0', border: 'none', borderRadius: '4px', cursor: 'pointer', background: 'transparent' }} />
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{data.metadata?.minimalSidebarColor || '#fafafa'}</span>
                    </div>
                  </div>
                )}

              </div>
            )}
          </div>

          {/* Work Experience Section */}
          <div ref={workRef} style={{ marginTop: '2rem', marginBottom: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--glass-border)', paddingBottom: '0.5rem', marginBottom: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <h2 style={{ fontSize: '1.1rem', color: 'var(--text-primary)', margin: 0 }}>Work Experience</h2>
                {template !== 'modern-split' && (
                  <select className="input-field" style={{ padding: '0.2rem 0.5rem', fontSize: '0.75rem', width: 'auto', minWidth: 0, height: 'auto', background: 'var(--surface-highlight)', border: 'none' }} value={data.metadata?.layout?.work || 1} onChange={(e) => handleLayoutChange('work', parseInt(e.target.value))}>
                    <option value={1}>1 Column</option>
                    <option value={2}>2 Columns</option>
                    <option value={3}>3 Columns</option>
                  </select>
                )}
              </div>
              <button onClick={handleAddJob} className="btn-icon" style={{ background: 'var(--primary)', color: 'white', padding: '4px 8px' }}><Plus size={16} /></button>
            </div>
            {data.work.map((job, index) => (
              <div key={job.id} style={{ background: 'rgba(0,0,0,0.2)', padding: '1rem', borderRadius: '8px', marginBottom: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>Job {index + 1}</div>
                  <button onClick={() => handleRemoveJob(job.id)} className="btn-icon" style={{ color: 'var(--danger)', padding: '2px' }}><Trash2 size={14} /></button>
                </div>
                <div className="form-group" style={{ marginBottom: '0.75rem' }}>
                  <label className="label" style={{ fontSize: '0.75rem' }}>Company</label>
                  <input type="text" className="input-field" style={{ padding: '0.5rem' }} value={job.name} onChange={(e) => handleJobChange(job.id, 'name', e.target.value)} />
                </div>
                <div className="form-group" style={{ marginBottom: '0.75rem' }}>
                  <label className="label" style={{ fontSize: '0.75rem' }}>Position</label>
                  <input type="text" className="input-field" style={{ padding: '0.5rem' }} value={job.position} onChange={(e) => handleJobChange(job.id, 'position', e.target.value)} />
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                  <div className="form-group" style={{ flex: 1, marginBottom: 0, minWidth: 0 }}>
                    <label className="label" style={{ fontSize: '0.75rem' }}>Start Date</label>
                    <MonthYearPicker value={job.startDate} onChange={(val) => handleJobChange(job.id, 'startDate', val)} />
                  </div>
                  <div className="form-group" style={{ flex: 1, marginBottom: 0, minWidth: 0 }}>
                    <label className="label" style={{ fontSize: '0.75rem' }}>End Date</label>
                    <MonthYearPicker disabled={job.endDate === 'Present'} value={job.endDate === 'Present' ? '' : job.endDate} onChange={(val) => handleJobChange(job.id, 'endDate', val)} />
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                  <input type="checkbox" id={`current-${job.id}`} checked={job.endDate === 'Present'} onChange={(e) => handleJobChange(job.id, 'endDate', e.target.checked ? 'Present' : '')} style={{ cursor: 'pointer' }} />
                  <label htmlFor={`current-${job.id}`} style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', cursor: 'pointer', margin: 0 }}>I currently work here</label>
                </div>
                <div className="form-group" style={{ marginBottom: '0.75rem' }}>
                  <label className="label" style={{ fontSize: '0.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    Summary
                    <button
                      onClick={() => handleJobAI(job.id, 'summary')}
                      disabled={aiLoading[`${job.id}-summary`]}
                      className="btn btn-primary"
                      style={{ padding: '0.15rem 0.5rem', fontSize: '0.65rem', background: 'var(--accent)', gap: '4px' }}
                    >
                      {aiLoading[`${job.id}-summary`] ? <RefreshCw size={10} className="animate-spin" /> : <><Sparkles size={10} /> AI Generate <Lock size={8} /></>}
                    </button>
                  </label>
                  <textarea className="input-field" style={{ padding: '0.5rem', minHeight: '60px' }} value={job.summary} onChange={(e) => handleJobChange(job.id, 'summary', e.target.value)} />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="label" style={{ fontSize: '0.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    Bullet Points
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <button
                        onClick={() => handleJobAI(job.id, 'bullets')}
                        disabled={aiLoading[`${job.id}-bullets`]}
                        className="btn btn-primary"
                        style={{ padding: '0.15rem 0.5rem', fontSize: '0.65rem', background: 'var(--accent)', gap: '4px' }}
                      >
                        {aiLoading[`${job.id}-bullets`] ? <RefreshCw size={10} className="animate-spin" /> : <><Sparkles size={10} /> AI Generate <Lock size={8} /></>}
                      </button>
                      <button
                        onClick={() => handleJobChange(job.id, 'highlights', [...(job.highlights || []), ''])}
                        className="btn-icon"
                        style={{ padding: '2px', color: 'var(--primary)' }}
                        title="Add Bullet Point"
                      >
                        <Plus size={14} />
                      </button>
                    </div>
                  </label>
                  {(job.highlights || []).map((highlight, hIndex) => (
                    <div key={hIndex} style={{ display: 'flex', gap: '4px', marginBottom: '6px' }}>
                      <input
                        type="text"
                        className="input-field"
                        style={{ padding: '0.4rem', fontSize: '0.85rem' }}
                        value={highlight}
                        onChange={(e) => {
                          const newHighlights = [...(job.highlights || [])];
                          newHighlights[hIndex] = e.target.value;
                          handleJobChange(job.id, 'highlights', newHighlights);
                        }}
                      />
                      <button
                        onClick={() => {
                          const newHighlights = (job.highlights || []).filter((_, i) => i !== hIndex);
                          handleJobChange(job.id, 'highlights', newHighlights);
                        }}
                        className="btn-icon"
                        style={{ color: 'var(--danger)', padding: '4px' }}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Education Section */}
          <div ref={educationRef} style={{ marginTop: '2rem', marginBottom: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--glass-border)', paddingBottom: '0.5rem', marginBottom: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <h2 style={{ fontSize: '1.1rem', color: 'var(--text-primary)', margin: 0 }}>Education</h2>
                {template !== 'modern-split' && (
                  <select className="input-field" style={{ padding: '0.2rem 0.5rem', fontSize: '0.75rem', width: 'auto', minWidth: 0, height: 'auto', background: 'var(--surface-highlight)', border: 'none' }} value={data.metadata?.layout?.education || 1} onChange={(e) => handleLayoutChange('education', parseInt(e.target.value))}>
                    <option value={1}>1 Column</option>
                    <option value={2}>2 Columns</option>
                    <option value={3}>3 Columns</option>
                  </select>
                )}
              </div>
              <button onClick={handleAddEducation} className="btn-icon" style={{ background: 'var(--primary)', color: 'white', padding: '4px 8px' }}><Plus size={16} /></button>
            </div>
            {(data.education || []).map((edu, index) => (
              <div key={edu.id} style={{ background: 'rgba(0,0,0,0.2)', padding: '1rem', borderRadius: '8px', marginBottom: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>Education {index + 1}</div>
                  <button onClick={() => handleRemoveEducation(edu.id)} className="btn-icon" style={{ color: 'var(--danger)', padding: '2px' }}><Trash2 size={14} /></button>
                </div>
                <div className="form-group" style={{ marginBottom: '0.75rem' }}>
                  <label className="label" style={{ fontSize: '0.75rem' }}>Institution</label>
                  <input type="text" className="input-field" style={{ padding: '0.5rem' }} value={edu.institution} onChange={(e) => handleEducationChange(edu.id, 'institution', e.target.value)} />
                </div>
                <div className="form-group" style={{ marginBottom: '0.75rem' }}>
                  <label className="label" style={{ fontSize: '0.75rem' }}>Area of Study</label>
                  <input type="text" className="input-field" style={{ padding: '0.5rem' }} value={edu.area} onChange={(e) => handleEducationChange(edu.id, 'area', e.target.value)} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginBottom: '0.75rem' }}>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="label" style={{ fontSize: '0.75rem' }}>Degree / Study Type</label>
                    <input type="text" className="input-field" style={{ padding: '0.5rem' }} value={edu.studyType} onChange={(e) => handleEducationChange(edu.id, 'studyType', e.target.value)} />
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="label" style={{ fontSize: '0.75rem' }}>GPA / Score</label>
                    <input type="text" className="input-field" style={{ padding: '0.5rem' }} value={edu.score} onChange={(e) => handleEducationChange(edu.id, 'score', e.target.value)} />
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                  <div className="form-group" style={{ flex: 1, marginBottom: 0, minWidth: 0 }}>
                    <label className="label" style={{ fontSize: '0.75rem' }}>Start Date</label>
                    <MonthYearPicker value={edu.startDate} onChange={(val) => handleEducationChange(edu.id, 'startDate', val)} />
                  </div>
                  <div className="form-group" style={{ flex: 1, marginBottom: 0, minWidth: 0 }}>
                    <label className="label" style={{ fontSize: '0.75rem' }}>End Date</label>
                    <MonthYearPicker disabled={edu.endDate === 'Present'} value={edu.endDate === 'Present' ? '' : edu.endDate} onChange={(val) => handleEducationChange(edu.id, 'endDate', val)} />
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: 0 }}>
                  <input type="checkbox" id={`current-edu-${edu.id}`} checked={edu.endDate === 'Present'} onChange={(e) => handleEducationChange(edu.id, 'endDate', e.target.checked ? 'Present' : '')} style={{ cursor: 'pointer' }} />
                  <label htmlFor={`current-edu-${edu.id}`} style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', cursor: 'pointer', margin: 0 }}>Currently studying</label>
                </div>
              </div>
            ))}
          </div>

          {/* Skills Section */}
          <div ref={skillsRef} style={{ marginTop: '2rem', marginBottom: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--glass-border)', paddingBottom: '0.5rem', marginBottom: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <h2 style={{ fontSize: '1.1rem', color: 'var(--text-primary)', margin: 0 }}>Skills</h2>
                {template !== 'modern-split' && (
                  <select className="input-field" style={{ padding: '0.2rem 0.5rem', fontSize: '0.75rem', width: 'auto', minWidth: 0, height: 'auto', background: 'var(--surface-highlight)', border: 'none' }} value={data.metadata?.layout?.skills || 3} onChange={(e) => handleLayoutChange('skills', parseInt(e.target.value))}>
                    <option value={1}>1 Column</option>
                    <option value={2}>2 Columns</option>
                    <option value={3}>3 Columns</option>
                    <option value={4}>4 Columns</option>
                  </select>
                )}
              </div>
              <button onClick={handleAddSkillCategory} className="btn-icon" style={{ background: 'var(--primary)', color: 'white', padding: '4px 8px' }}><Plus size={16} /></button>
            </div>
            {(data.skills || []).map((skillGroup, index) => (
              <div key={skillGroup.id} style={{ background: 'rgba(0,0,0,0.2)', padding: '1rem', borderRadius: '8px', marginBottom: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>Category {index + 1}</div>
                  <button onClick={() => handleRemoveSkillCategory(skillGroup.id)} className="btn-icon" style={{ color: 'var(--danger)', padding: '2px' }}><Trash2 size={14} /></button>
                </div>
                <div className="form-group" style={{ marginBottom: '0.75rem' }}>
                  <label className="label" style={{ fontSize: '0.75rem' }}>Category Name</label>
                  <input type="text" className="input-field" style={{ padding: '0.5rem' }} value={skillGroup.name} onChange={(e) => handleSkillCategoryChange(skillGroup.id, 'name', e.target.value)} />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="label" style={{ fontSize: '0.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      Skills
                      <button onClick={() => handleGenerateSkills(skillGroup.id)} disabled={aiLoading[`skill-${skillGroup.id}`]} className="btn-icon" style={{ fontSize: '0.7rem', background: 'rgba(16, 185, 129, 0.15)', color: '#10b981', padding: '2px 6px', borderRadius: '4px', border: '1px solid rgba(16, 185, 129, 0.3)', fontWeight: 600 }}>
                        {aiLoading[`skill-${skillGroup.id}`] ? <Loader2 size={12} className="animate-spin" /> : <><Wand2 size={12} style={{ marginRight: '4px' }} /> AI Generate</>}
                      </button>
                    </div>
                    <button
                      onClick={() => handleSkillCategoryChange(skillGroup.id, 'keywords', [...(skillGroup.keywords || []), ''])}
                      className="btn-icon"
                      style={{ padding: '2px', color: 'var(--primary)' }}
                      title="Add Skill"
                    >
                      <Plus size={14} />
                    </button>
                  </label>
                  {(skillGroup.keywords || []).map((keyword, kIndex) => (
                    <div key={kIndex} style={{ display: 'flex', gap: '4px', marginBottom: '6px' }}>
                      <input
                        type="text"
                        className="input-field"
                        style={{ padding: '0.4rem', fontSize: '0.85rem' }}
                        value={keyword}
                        onChange={(e) => {
                          const newKeywords = [...(skillGroup.keywords || [])];
                          newKeywords[kIndex] = e.target.value;
                          handleSkillCategoryChange(skillGroup.id, 'keywords', newKeywords);
                        }}
                      />
                      <button
                        onClick={() => {
                          const newKeywords = (skillGroup.keywords || []).filter((_, i) => i !== kIndex);
                          handleSkillCategoryChange(skillGroup.id, 'keywords', newKeywords);
                        }}
                        className="btn-icon"
                        style={{ color: 'var(--danger)', padding: '4px' }}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Dynamic Portfolio Projects Section */}
          {hasProjectsSection && (
            <div ref={projectsRef} style={{ marginTop: '2rem', marginBottom: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--glass-border)', paddingBottom: '0.5rem', marginBottom: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <h2 style={{ fontSize: '1.1rem', color: 'var(--text-primary)', margin: 0 }}>Portfolio Projects</h2>
                  {template !== 'modern-split' && (
                    <select className="input-field" style={{ padding: '0.2rem 0.5rem', fontSize: '0.75rem', width: 'auto', minWidth: 0, height: 'auto', background: 'var(--surface-highlight)', border: 'none' }} value={data.metadata?.layout?.projects || 1} onChange={(e) => handleLayoutChange('projects', parseInt(e.target.value))}>
                      <option value={1}>1 Column</option>
                      <option value={2}>2 Columns</option>
                      <option value={3}>3 Columns</option>
                    </select>
                  )}
                </div>
                <div>
                  <button onClick={handleAddProject} className="btn-icon" style={{ background: 'var(--primary)', color: 'white', padding: '4px 8px', marginRight: '0.5rem' }}><Plus size={16} /></button>
                  <button onClick={() => { setHasProjectsSection(false); setData(prev => ({ ...prev, projects: [] })); }} className="btn-icon" style={{ color: 'var(--danger)', padding: '4px' }}><Trash2 size={16} /></button>
                </div>
              </div>
              {(data.projects || []).map((proj, index) => (
                <div key={proj.id} style={{ background: 'rgba(0,0,0,0.2)', padding: '1rem', borderRadius: '8px', marginBottom: '1rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                    <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>Project {index + 1}</div>
                    <button onClick={() => handleRemoveProject(proj.id)} className="btn-icon" style={{ color: 'var(--danger)', padding: '2px' }}><Trash2 size={14} /></button>
                  </div>
                  <div className="form-group" style={{ marginBottom: '0.75rem' }}>
                    <label className="label" style={{ fontSize: '0.75rem' }}>Project Name</label>
                    <input type="text" className="input-field" style={{ padding: '0.5rem' }} value={proj.name} onChange={(e) => handleProjectChange(proj.id, 'name', e.target.value)} />
                  </div>
                  <div className="form-group" style={{ marginBottom: '0.75rem' }}>
                    <label className="label" style={{ fontSize: '0.75rem' }}>URL / Link</label>
                    <input type="text" className="input-field" style={{ padding: '0.5rem' }} value={proj.url} onChange={(e) => handleProjectChange(proj.id, 'url', e.target.value)} />
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="label" style={{ fontSize: '0.75rem' }}>Description</label>
                    <textarea className="input-field" style={{ padding: '0.5rem', minHeight: '60px' }} value={proj.description} onChange={(e) => handleProjectChange(proj.id, 'description', e.target.value)} />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Dynamic References Section */}
          {hasReferencesSection && (
            <div ref={referencesRef} style={{ marginTop: '2rem', marginBottom: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--glass-border)', paddingBottom: '0.5rem', marginBottom: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <h2 style={{ fontSize: '1.1rem', color: 'var(--text-primary)', margin: 0 }}>References</h2>
                  {template !== 'modern-split' && (
                    <select className="input-field" style={{ padding: '0.2rem 0.5rem', fontSize: '0.75rem', width: 'auto', minWidth: 0, height: 'auto', background: 'var(--surface-highlight)', border: 'none' }} value={data.metadata?.layout?.references || 2} onChange={(e) => handleLayoutChange('references', parseInt(e.target.value))}>
                      <option value={1}>1 Column</option>
                      <option value={2}>2 Columns</option>
                      <option value={3}>3 Columns</option>
                      <option value={4}>4 Columns</option>
                    </select>
                  )}
                </div>
                <div>
                  <button onClick={handleAddReference} className="btn-icon" style={{ background: 'var(--primary)', color: 'white', padding: '4px 8px', marginRight: '0.5rem' }}><Plus size={16} /></button>
                  <button onClick={() => { setHasReferencesSection(false); setData(prev => ({ ...prev, references: [] })); }} className="btn-icon" style={{ color: 'var(--danger)', padding: '4px' }}><Trash2 size={16} /></button>
                </div>
              </div>
              {(data.references || []).map((ref, index) => (
                <div key={ref.id} style={{ background: 'rgba(0,0,0,0.2)', padding: '1rem', borderRadius: '8px', marginBottom: '1rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                    <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>Reference {index + 1}</div>
                    <button onClick={() => handleRemoveReference(ref.id)} className="btn-icon" style={{ color: 'var(--danger)', padding: '2px' }}><Trash2 size={14} /></button>
                  </div>
                  <div className="form-group" style={{ marginBottom: '0.75rem' }}>
                    <label className="label" style={{ fontSize: '0.75rem' }}>Name</label>
                    <input type="text" className="input-field" style={{ padding: '0.5rem' }} value={ref.name} onChange={(e) => handleReferenceChange(ref.id, 'name', e.target.value)} />
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="label" style={{ fontSize: '0.75rem' }}>Contact Info / Description</label>
                    <input type="text" className="input-field" style={{ padding: '0.5rem' }} value={ref.reference} onChange={(e) => handleReferenceChange(ref.id, 'reference', e.target.value)} />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Dynamic Certifications Section */}
          {hasCertificationsSection && (
            <div ref={certificationsRef} style={{ marginTop: '2rem', marginBottom: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--glass-border)', paddingBottom: '0.5rem', marginBottom: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <h2 style={{ fontSize: '1.1rem', color: 'var(--text-primary)', margin: 0 }}>Certifications</h2>
                  {template !== 'modern-split' && (
                    <select className="input-field" style={{ padding: '0.2rem 0.5rem', fontSize: '0.75rem', width: 'auto', minWidth: 0, height: 'auto', background: 'var(--surface-highlight)', border: 'none' }} value={data.metadata?.layout?.certifications || 1} onChange={(e) => handleLayoutChange('certifications', parseInt(e.target.value))}>
                      <option value={1}>1 Column</option>
                      <option value={2}>2 Columns</option>
                      <option value={3}>3 Columns</option>
                    </select>
                  )}
                </div>
                <div>
                  <button onClick={handleAddCertification} className="btn-icon" style={{ background: 'var(--primary)', color: 'white', padding: '4px 8px', marginRight: '0.5rem' }}><Plus size={16} /></button>
                  <button onClick={() => { setHasCertificationsSection(false); setData(prev => ({ ...prev, certifications: [] })); }} className="btn-icon" style={{ color: 'var(--danger)', padding: '4px' }}><Trash2 size={16} /></button>
                </div>
              </div>
              {(data.certifications || []).map(cert => (
                <div key={cert.id} style={{ background: 'rgba(0,0,0,0.2)', padding: '1rem', borderRadius: '8px', marginBottom: '1rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                    <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>Certification</div>
                    <button onClick={() => handleRemoveCertification(cert.id)} className="btn-icon" style={{ color: 'var(--danger)', padding: '2px' }}><Trash2 size={14} /></button>
                  </div>
                  <div className="form-group" style={{ marginBottom: '0.75rem' }}>
                    <label className="label" style={{ fontSize: '0.75rem' }}>Name</label>
                    <input type="text" className="input-field" style={{ padding: '0.5rem' }} value={cert.name} onChange={(e) => handleCertificationChange(cert.id, 'name', e.target.value)} />
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem' }}>
                    <div className="form-group" style={{ flex: 1, marginBottom: 0 }}>
                      <label className="label" style={{ fontSize: '0.75rem' }}>Issuer</label>
                      <input type="text" className="input-field" style={{ padding: '0.5rem' }} value={cert.issuer} onChange={(e) => handleCertificationChange(cert.id, 'issuer', e.target.value)} />
                    </div>
                    <div className="form-group" style={{ flex: 1, marginBottom: 0 }}>
                      <label className="label" style={{ fontSize: '0.75rem' }}>Date</label>
                      <input type="text" className="input-field" style={{ padding: '0.5rem' }} placeholder="MM/YYYY" value={cert.date} onChange={(e) => handleCertificationChange(cert.id, 'date', e.target.value)} />
                    </div>
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="label" style={{ fontSize: '0.75rem' }}>URL (Optional)</label>
                    <input type="url" className="input-field" style={{ padding: '0.5rem' }} value={cert.url || ''} onChange={(e) => handleCertificationChange(cert.id, 'url', e.target.value)} />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Add Section Menu */}
          <div ref={menuWrapperRef} style={{ marginTop: '2rem' }}>
            <button
              onClick={() => setShowSectionMenu(!showSectionMenu)}
              className="btn btn-secondary"
              style={{ width: '100%', borderStyle: 'dashed', borderColor: 'var(--text-secondary)' }}
            >
              {showSectionMenu ? <Minus size={16} /> : <Plus size={16} />} Add Custom Section
            </button>

            {showSectionMenu && (
              <div style={{ marginTop: '0.5rem', background: 'var(--surface-highlight)', border: '1px solid var(--glass-border)', borderRadius: '8px', overflow: 'hidden' }}>
                {!hasProjectsSection && (
                  <button
                    className="btn"
                    style={{ width: '100%', justifyContent: 'flex-start', background: 'transparent', borderRadius: 0, borderBottom: '1px solid var(--glass-border)', color: 'var(--text-primary)' }}
                    onClick={() => { setHasProjectsSection(true); handleAddProject(); setShowSectionMenu(false); }}
                  >
                    <Plus size={14} /> Portfolio Projects
                  </button>
                )}
                {!hasReferencesSection && (
                  <button
                    className="btn"
                    style={{ width: '100%', justifyContent: 'flex-start', background: 'transparent', borderRadius: 0, borderBottom: '1px solid var(--glass-border)', color: 'var(--text-primary)' }}
                    onClick={() => { setHasReferencesSection(true); handleAddReference(); setShowSectionMenu(false); }}
                  >
                    <Plus size={14} /> Professional References
                  </button>
                )}
                {!hasCertificationsSection && (
                  <button
                    className="btn"
                    style={{ width: '100%', justifyContent: 'flex-start', background: 'transparent', borderRadius: 0, borderBottom: '1px solid var(--glass-border)', color: 'var(--text-primary)' }}
                    onClick={() => { setHasCertificationsSection(true); handleAddCertification(); setShowSectionMenu(false); }}
                  >
                    <Plus size={14} /> Certifications
                  </button>
                )}
                <button
                  className="btn"
                  style={{ width: '100%', justifyContent: 'flex-start', background: 'transparent', borderRadius: 0, opacity: 0.6, color: 'var(--text-secondary)' }}
                  disabled
                  onClick={(e) => { e.preventDefault(); alert("Languages are a premium feature!"); }}
                >
                  <Lock size={14} /> Languages (Premium)
                </button>
              </div>
            )}
          </div>

          <div style={{ padding: '1rem', background: 'rgba(139, 92, 246, 0.1)', border: '1px solid rgba(139, 92, 246, 0.2)', borderRadius: '8px', marginTop: '2rem' }}>
            <h3 style={{ fontSize: '0.9rem', color: 'var(--secondary)', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Lock size={16} /> Premium AI Features
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
              Upgrade your account to access our ATS-optimized AI writer for experience bullets, skills extraction, and custom cover letters.
            </p>
            <button onClick={() => { setUpgradeFeature('CareerReport Pro'); setUpgradeModalOpen(true); }} className="btn btn-secondary" style={{ width: '100%', fontSize: '0.875rem' }}>Upgrade to Premium ($9)</button>
          </div>
        </div>
      </aside>

      {/* Main Preview Area */}
      <main 
        className={isMobile ? "hide-scrollbar" : ""} 
        style={{ 
          flex: isMobile ? undefined : 1, 
          display: isMobile ? (activeTab === 'preview' ? 'flex' : 'none') : 'flex', 
          flexDirection: 'column', 
          background: 'var(--bg-color)',
          // Mobile: position:fixed with explicit offsets is immune to flex
          // height distribution bugs in mobile browsers. top = navbar(60) +
          // tab bar(57). bottom = mobile footer bar height.
          ...(isMobile ? {
            position: 'fixed' as const,
            top: '117px',
            left: 0,
            right: 0,
            bottom: '60px',
            zIndex: 5,
            overflow: 'hidden'
          } : {
            height: 'auto',
            overflow: 'hidden'
          })
        }}
      >
        <header style={{ padding: isMobile ? '0.5rem 1rem' : '1rem 2rem', borderBottom: '1px solid var(--glass-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--glass-bg)', backdropFilter: 'blur(10px)', flexShrink: 0, zIndex: 10 }}>
          <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
            {!isMobile && (
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <LayoutTemplate size={18} color="var(--text-secondary)" />
                <select
                  value={template}
                  onChange={(e) => setTemplate(e.target.value as any)}
                  className="input-field"
                  style={{ width: 'auto', padding: '0.4rem 0.75rem', background: 'var(--surface-color)', border: '1px solid var(--glass-border)', color: 'var(--text-primary)', cursor: 'pointer', fontWeight: 600, fontSize: '0.9rem' }}
                >
                  <option value="modern" style={{ color: '#fff', background: '#1e293b' }}>Modern Template</option>
                  <option value="modern-split" style={{ color: '#fff', background: '#1e293b' }}>Modern Split</option>
                  <option value="minimal" style={{ color: '#fff', background: '#1e293b' }}>Minimal Template</option>
                  <option value="classic" style={{ color: '#fff', background: '#1e293b' }}>Classic Template</option>
                </select>
              </div>
            )}

            {!isMobile && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                {saveStatus === 'saving' && <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><RefreshCw size={14} className="animate-spin" /> Saving...</span>}
                {saveStatus === 'saved' && <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--success)' }}><CheckCircle size={14} /> Autosaved</span>}
                {saveStatus === 'error' && <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--danger)' }}><AlertCircle size={14} /> Save failed</span>}
                {saveStatus === 'idle' && lastSaved && <span style={{ opacity: 0.7 }}>Last saved {lastSaved.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>}
              </div>
            )}
          </div>

          <div style={{ display: 'flex', gap: '0.75rem' }}>
            {isSignedIn && (
              <button
                onClick={async () => {
                  const next = !isPublic;
                  setIsPublic(next);
                  // Refresh token before writing
                  const token = await getToken({ template: 'supabase' });
                  
                  const { error } = await supabase.from('resumes').upsert({
                    user_id: user!.id,
                    data,
                    template,
                    is_public: next,
                    updated_at: new Date().toISOString()
                  }, { onConflict: 'user_id' });
                  if (error) {
                    console.error('Failed to update visibility:', error.message);
                    // Revert optimistic update on failure
                    setIsPublic(!next);
                  }
                }}
                className="btn btn-secondary"
                style={{ padding: '0.5rem 1rem', fontSize: '0.9rem', gap: '0.5rem', color: isPublic ? 'var(--accent)' : 'var(--text-secondary)' }}
                title={isPublic ? 'Resume is public — click to make private' : 'Resume is private — click to make public'}
              >
                {isPublic ? <><span>🌐</span> Public</> : <><Lock size={16} /> Private</>}
              </button>
            )}
            <button
              onClick={() => {
                if (!isSignedIn) {
                  alert("Please sign up to get a public share link for your resume!");
                } else if (!isPublic) {
                  alert("Your resume is set to Private. Toggle it to Public first to share.");
                } else if (profileUsername) {
                  const shareUrl = `${window.location.origin}/u/${profileUsername}`;
                  navigator.clipboard.writeText(shareUrl).then(() => {
                    setSharingCopied(true);
                    setTimeout(() => setSharingCopied(false), 2500);
                  });
                } else {
                  alert("Please set a username in your settings to get a shareable link!");
                }
              }}
              className="btn btn-secondary"
              style={{ padding: '0.5rem 1rem', fontSize: '0.9rem', gap: '0.5rem', color: sharingCopied ? 'var(--accent)' : undefined }}
            >
              {sharingCopied ? <><CheckCircle size={18} /> Copied!</> : <><Share2 size={18} /> Share</>}
            </button>
            <button
              onClick={handleManualSave}
              className="btn btn-secondary"
              style={{ padding: '0.5rem 1rem', fontSize: '0.9rem', gap: '0.5rem' }}
              title="Manual Save"
            >
              <Save size={18} /> Save
            </button>
            <button onClick={() => handlePrint()} className="btn btn-primary" style={{ padding: '0.5rem 1.25rem', fontSize: '0.9rem', gap: '0.5rem' }}>
              <Download size={18} /> Export PDF
            </button>
          </div>
        </header>

        {!isSignedIn && (
          <div style={{ background: 'linear-gradient(90deg, var(--primary), var(--accent))', color: 'white', padding: '0.6rem 2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.9rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <Info size={18} />
              <span>You are currently building as a guest. <strong>Sign up to save your work permanently and get a public profile link!</strong></span>
            </div>
            <SignUpButton mode="modal">
              <button style={{ background: 'white', color: 'var(--primary)', border: 'none', padding: '0.35rem 1rem', borderRadius: '6px', fontWeight: 700, cursor: 'pointer', fontSize: '0.85rem' }}>Sign Up Now</button>
            </SignUpButton>
          </div>
        )}

        {/* Hidden containers — outside zoom wrapper so scrollWidth is read at
            native 850px, keeping pagination counts accurate. */}
        {/* Hidden measurement div — outside the scale wrapper so scrollWidth
            is measured at native 850px for correct pagination. */}
        <div style={{ 
          opacity: 0, 
          position: 'absolute', 
          top: 0, 
          left: 0, 
          pointerEvents: 'none', 
          zIndex: -1,
          width: '850px',
          overflow: 'visible'
        }}>
          <div ref={measureRef} className="resume-ui-layout" style={{ width: '850px', minWidth: '850px' }}>
            <div style={{ zoom: data.metadata?.scale || 1 }}>
              <AtsMetadata data={data} />
              {template === 'modern' && <TemplateModern data={{ ...data, basics: { ...data.basics, image: includeHeadshot ? data.basics.image : '' } }} />}
              {template === 'modern-split' && <TemplateModernSplit data={{ ...data, basics: { ...data.basics, image: includeHeadshot ? data.basics.image : '' } }} />}
              {template === 'classic' && <TemplateClassic data={{ ...data, basics: { ...data.basics, image: includeHeadshot ? data.basics.image : '' } }} />}
              {template === 'minimal' && <TemplateMinimal data={{ ...data, basics: { ...data.basics, image: includeHeadshot ? data.basics.image : '' } }} />}
            </div>
          </div>
        </div>

        {/* Print wrapper */}
        <div style={{ opacity: 0, position: 'absolute', pointerEvents: 'none' }}>
          <div ref={contentRef} className="resume-print-wrapper">
            <style>{`@page { size: 8.5in 11in; margin: ${data.metadata?.pageMargin || 0.42}in; }`}</style>
            <div style={{ zoom: data.metadata?.scale || 1 }}>
              <AtsMetadata data={data} />
              {template === 'modern' && <TemplateModern data={{ ...data, basics: { ...data.basics, image: includeHeadshot ? data.basics.image : '' } }} />}
              {template === 'modern-split' && <TemplateModernSplit data={{ ...data, basics: { ...data.basics, image: includeHeadshot ? data.basics.image : '' } }} />}
              {template === 'classic' && <TemplateClassic data={{ ...data, basics: { ...data.basics, image: includeHeadshot ? data.basics.image : '' } }} />}
              {template === 'minimal' && <TemplateMinimal data={{ ...data, basics: { ...data.basics, image: includeHeadshot ? data.basics.image : '' } }} />}
            </div>
          </div>
        </div>

        {/* Scrollable preview — transform: scale provides pixel-perfect 
            fidelity by scaling the rendered 850px layout. */}
        <div className={!isMobile ? "sidebar-scroll" : ""} style={{
          flex: 1,
          overflowY: 'auto',
          overflowX: 'hidden',
          padding: isMobile ? '0.5rem 0' : '3rem 2rem',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'flex-start',
          direction: 'ltr'
        }}>
          {/* We use transform: scale for pixel-perfect fidelity. 
              To avoid layout gaps, we wrap it in a container with the scaled dimensions. */}
          <div style={{ 
            width: isMobile ? `${850 * mobileScale}px` : '850px',
            height: isMobile ? `${(1100 * pageCount + (pageCount - 1) * 40) * mobileScale}px` : 'auto',
            flexShrink: 0,
            overflow: 'hidden'
          }}>
            <div style={{ 
              transform: isMobile ? `scale(${mobileScale})` : 'none',
              transformOrigin: 'top left',
              width: '850px',
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center' 
            }}>
              {Array.from({ length: pageCount }).map((_, i) => (
                <div key={`page-${i}`} className="resume-ui-page">
                  <div style={{ position: 'absolute', top: 0, left: `-${i * 890}px`, width: '850px' }}>
                    <div className="resume-ui-layout" style={{ padding: `${(data.metadata?.pageMargin || 0.42) * 96}px 0` }}>
                      <div style={{ zoom: data.metadata?.scale || 1 }}>
                        <AtsMetadata data={data} />
                        {template === 'modern' && <TemplateModern data={{ ...data, basics: { ...data.basics, image: includeHeadshot ? data.basics.image : '' } }} />}
                        {template === 'modern-split' && <TemplateModernSplit data={{ ...data, basics: { ...data.basics, image: includeHeadshot ? data.basics.image : '' } }} />}
                        {template === 'classic' && <TemplateClassic data={{ ...data, basics: { ...data.basics, image: includeHeadshot ? data.basics.image : '' } }} />}
                        {template === 'minimal' && <TemplateMinimal data={{ ...data, basics: { ...data.basics, image: includeHeadshot ? data.basics.image : '' } }} />}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
    </main>

      {/* Image Cropper Modal */}
      {cropImageSrc && (
        <ImageCropper
          imageSrc={cropImageSrc}
          onCropComplete={(croppedImage) => {
            setData(prev => ({ ...prev, basics: { ...prev.basics, image: croppedImage } }));
            setIncludeHeadshot(true); // Auto-include if they took the time to upload and crop
            setCropImageSrc(null);
          }}
          onCancel={() => setCropImageSrc(null)}
        />
      )}

      {/* Global Mobile Footer */}
      {isMobile && (
        <div style={{ 
          position: 'fixed', 
          bottom: 0, 
          left: 0, 
          right: 0, 
          padding: '1rem', 
          borderTop: '1px solid var(--glass-border)', 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          background: 'var(--surface-color)',
          zIndex: 1000
        }}>
          <Link href="/support" style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', fontWeight: 500 }}>Support</Link>
          {isSignedIn ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{user?.firstName || 'User'}</span>
              <UserButton />
            </div>
          ) : (
            <SignInButton mode="modal">
              <button className="btn btn-secondary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}>Sign In</button>
            </SignInButton>
          )}
        </div>
      )}
      
      {showUndo && (
        <div style={{ position: 'fixed', bottom: '2rem', right: '2rem', zIndex: 9999, background: 'var(--surface-color)', padding: '1rem', borderRadius: '8px', boxShadow: '0 10px 30px rgba(0,0,0,0.5)', border: '1px solid var(--primary)', display: 'flex', alignItems: 'center', gap: '1rem', animation: 'fadeIn 0.3s ease-out' }}>
          <span style={{ color: 'var(--text-primary)', fontSize: '0.9rem', fontWeight: 500 }}>AI applied successfully.</span>
          <button 
            className="btn btn-primary" 
            style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}
            onClick={() => {
              if (undoData) setData(undoData);
              setShowUndo(false);
            }}
          >
            Undo Change
          </button>
        </div>
      )}

      <UpgradeModal 
        isOpen={upgradeModalOpen} 
        onClose={() => setUpgradeModalOpen(false)} 
        featureName={upgradeFeature} 
      />
    </div>
  );
}
