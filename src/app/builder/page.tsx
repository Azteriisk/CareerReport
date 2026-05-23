"use client";

import React, { useState, useRef, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { defaultResume } from '@/lib/default-resume';
import { pageCountFromScrollWidth } from '@/lib/resume-pagination';
import { ResumeData } from '@/lib/resume-schema';
import { useReactToPrint } from 'react-to-print';
import { Download, Sparkles, LayoutTemplate, Lock, RefreshCw, Plus, Minus, Trash2, Upload, Save, CheckCircle, AlertCircle, Info, Share2, X, Loader2, Wand2, FileText, Edit, Copy, Check } from 'lucide-react';
import { useUser, useAuth, SignInButton, SignUpButton, UserButton } from '@clerk/nextjs';
import { supabase } from "@/lib/supabase";
import { useAutoAnimate } from '@formkit/auto-animate/react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { AtsMetadata } from '@/components/AtsMetadata';
import { BuilderErrorBoundary } from '@/components/BuilderErrorBoundary';

// Dynamically import heavy components so they're code-split from the initial bundle
const TemplateModern = dynamic(() => import('@/components/TemplateModern').then(m => ({ default: m.TemplateModern })));
const TemplateClassic = dynamic(() => import('@/components/TemplateClassic').then(m => ({ default: m.TemplateClassic })));
const TemplateMinimal = dynamic(() => import('@/components/TemplateMinimal').then(m => ({ default: m.TemplateMinimal })));
const TemplateModernSplit = dynamic(() => import('@/components/TemplateModernSplit').then(m => ({ default: m.TemplateModernSplit })));
const ImageCropper = dynamic(() => import('@/components/ImageCropper').then(m => ({ default: m.ImageCropper })));
const UpgradeModal = dynamic(() => import('@/components/UpgradeModal').then(m => ({ default: m.UpgradeModal })));

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

function BuilderPageContent() {
  const { isSignedIn, isLoaded, user } = useUser();
  const { getToken } = useAuth();
  const searchParams = useSearchParams();
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
  const [isPro, setIsPro] = useState(false);
  const [showSectionMenu, setShowSectionMenu] = useState(false);
  const [targetCompany, setTargetCompany] = useState('');
  const [targetJobTitle, setTargetJobTitle] = useState('');
  const [targetJobDesc, setTargetJobDesc] = useState('');
  const [generatedCoverLetter, setGeneratedCoverLetter] = useState('');
  const [coverLetterMode, setCoverLetterMode] = useState<'ai' | 'guided'>('ai');
  const [storyType, setStoryType] = useState('standard');
  const [includeCoverLetter, setIncludeCoverLetter] = useState(false);
  const [guidedHook, setGuidedHook] = useState('');
  const [guidedValue, setGuidedValue] = useState('');
  const [guidedAlign, setGuidedAlign] = useState('');
  const [guidedClose, setGuidedClose] = useState('');
  const [isGeneratingCoverLetter, setIsGeneratingCoverLetter] = useState(false);
  const [copiedCoverLetter, setCopiedCoverLetter] = useState(false);
  const [showCoverLetterSection, setShowCoverLetterSection] = useState(false);
  const [showGuestExportPrompt, setShowGuestExportPrompt] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [isPublic, setIsPublic] = useState(true);
  const [profileUsername, setProfileUsername] = useState<string | null>(null);
  const [sharingCopied, setSharingCopied] = useState(false);

  // Multiple resumes interface and state variables
  interface SavedResume {
    id: string;
    name: string;
    data: ResumeData;
    template: 'modern' | 'classic' | 'minimal' | 'modern-split';
    isPublic: boolean;
    updatedAt: string;
  }
  const [savedResumes, setSavedResumes] = useState<SavedResume[]>([]);
  const [activeResumeId, setActiveResumeId] = useState<string | null>(null);
  const [showResumesDropdown, setShowResumesDropdown] = useState(false);
  const [resumeRenameId, setResumeRenameId] = useState<string | null>(null);
  const [renameText, setRenameText] = useState('');

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

  // Verify Stripe payment on redirect — placed after all useState/useAutoAnimate declarations
  // to satisfy react-hooks/rules-of-hooks (no forward references to state setters)
  useEffect(() => {
    const success = searchParams?.get('success');
    const sessionId = searchParams?.get('session_id');

    if (success === 'true' && sessionId) {
      const verifyPayment = async () => {
        try {
          const res = await fetch(`/api/checkout/verify?session_id=${sessionId}`);
          if (res.ok) {
            const result = await res.json();
            if (result.success) {
              setIsPro(true);
              // Clean up query parameters so we don't repeat this on refresh
              const newUrl = window.location.pathname;
              window.history.replaceState({}, '', newUrl);
              alert("Payment successful! Welcome to CareerReport Pro. All premium AI features are now unlocked.");
            }
          }
        } catch (err) {
          console.error("Stripe payment verification failed:", err);
        }
      };
      verifyPayment();
    }
  }, [searchParams]);

  // Load data from Supabase (if signed in) or localStorage (if guest)
  useEffect(() => {
    // Safety net: if Clerk never resolves isLoaded (e.g. production keys on localhost),
    // fall through to guest/localStorage mode after 3s so the builder is never stuck.
    const clerkTimeout = setTimeout(() => {
      setIsInitialLoading(false);
    }, 3000);

    async function loadInitialData() {
      if (!isLoaded) return;
      clearTimeout(clerkTimeout);

      try {
        if (isSignedIn && user) {
          const { data: remoteData, error } = await supabase
            .from('resumes')
            .select('*')
            .eq('user_id', user.id)
            .order('updated_at', { ascending: false })
            .limit(1)
            .single();

          if (error && error.code !== 'PGRST116') {
            console.error('Failed to load resume from Supabase:', error);
          }

          let activeData = remoteData?.data || defaultResume;
          let activeTemplate = remoteData?.template || 'modern-split';
          let activeIsPublic = typeof remoteData?.is_public === 'boolean' ? remoteData.is_public : true;
          let activeUpdatedAt = remoteData?.updated_at || new Date().toISOString();

          if (remoteData) {
            setData(activeData);
            if (remoteData.template) setTemplate(remoteData.template as any);
            if (typeof remoteData.is_public === 'boolean') setIsPublic(remoteData.is_public);
            setSaveStatus('saved');
            setLastSaved(new Date(remoteData.updated_at));
          } else {
            setSaveStatus('idle');
          }

          // Also fetch the Supabase username, career context, and pro status
          const { data: profileRow } = await supabase
            .from('profiles')
            .select('username, career_context, is_pro, resume_data')
            .eq('id', user.id)
            .single();
          if (profileRow?.username) setProfileUsername(profileRow.username);
          if (profileRow?.career_context) setCareerContext(profileRow.career_context);
          
          const isUserPro = !!profileRow?.is_pro;
          if (isUserPro) {
            setIsPro(true);

            let parsedResumes: SavedResume[] = [];
            if (profileRow?.resume_data) {
              try {
                parsedResumes = (typeof profileRow.resume_data === 'string' 
                  ? JSON.parse(profileRow.resume_data) 
                  : profileRow.resume_data) as SavedResume[];
              } catch (err) {
                console.error("Failed to parse saved resumes from profiles:", err);
              }
            }

            // If no saved resumes list exists (first-time Pro user), initialize it optimistically
            if (!parsedResumes || parsedResumes.length === 0) {
              const initialResume: SavedResume = {
                id: 'default',
                name: 'Default Resume',
                data: activeData,
                template: activeTemplate as any,
                isPublic: activeIsPublic,
                updatedAt: activeUpdatedAt
              };
              parsedResumes = [initialResume];
              
              // Sync initialized list back to profiles row
              await supabase
                .from('profiles')
                .update({ resume_data: parsedResumes })
                .eq('id', user.id);
            }

            setSavedResumes(parsedResumes);

            // Get activeResumeId from localStorage or default to first one
            const savedActiveId = localStorage.getItem(`cr-active-resume-id-${user.id}`);
            const matched = parsedResumes.find(r => r.id === savedActiveId);
            if (matched) {
              setActiveResumeId(matched.id);
              setData(matched.data);
              setTemplate(matched.template);
              setIsPublic(matched.isPublic);
            } else {
              setActiveResumeId(parsedResumes[0].id);
              setData(parsedResumes[0].data);
              setTemplate(parsedResumes[0].template);
              setIsPublic(parsedResumes[0].isPublic);
              localStorage.setItem(`cr-active-resume-id-${user.id}`, parsedResumes[0].id);
            }
          }

          return;
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
      } catch (err) {
        console.error("loadInitialData error:", err);
      } finally {
        // Always clear the loading state, regardless of success or error
        setIsInitialLoading(false);
      }
    }

    loadInitialData();
    return () => clearTimeout(clerkTimeout);
  }, [isLoaded, isSignedIn, user?.id, getToken]);

  // Load cover letter details from data if present on initial load
  useEffect(() => {
    if (data?.coverLetter) {
      if (data.coverLetter.company) setTargetCompany(data.coverLetter.company);
      if (data.coverLetter.jobTitle) setTargetJobTitle(data.coverLetter.jobTitle);
      if (data.coverLetter.jobDesc) setTargetJobDesc(data.coverLetter.jobDesc || '');
      if (data.coverLetter.storyType) setStoryType(data.coverLetter.storyType);
      if (data.coverLetter.content) setGeneratedCoverLetter(data.coverLetter.content);
      if (data.coverLetter.isGuided) setCoverLetterMode('guided');
      if (data.coverLetter.guidedSteps) {
        if (data.coverLetter.guidedSteps.hook) setGuidedHook(data.coverLetter.guidedSteps.hook);
        if (data.coverLetter.guidedSteps.value) setGuidedValue(data.coverLetter.guidedSteps.value);
        if (data.coverLetter.guidedSteps.align) setGuidedAlign(data.coverLetter.guidedSteps.align);
        if (data.coverLetter.guidedSteps.close) setGuidedClose(data.coverLetter.guidedSteps.close);
      }
    }
  }, [data?.basics?.name]); // Run on initial load of the resume data to populate database values correctly

  // Helper to update the cover letter object in ResumeData state
  const saveCoverLetterToData = (
    company: string,
    title: string,
    desc: string,
    tone: string,
    content: string,
    mode: 'ai' | 'guided',
    steps?: any
  ) => {
    setData(prev => ({
      ...prev,
      coverLetter: {
        company,
        jobTitle: title,
        jobDesc: desc,
        storyType: tone,
        content,
        isGuided: mode === 'guided',
        guidedSteps: steps || null
      }
    }));
    setSaveStatus('idle'); // Set dirty state for the autosave loop to trigger
  };

  // Synchronize compiled guided cover letter dynamically
  useEffect(() => {
    if (coverLetterMode === 'guided') {
      const comp = targetCompany || '[Company]';
      const title = targetJobTitle || '[Job Title]';
      
      const hook = guidedHook || `I am writing to express my enthusiastic interest in the ${title} position at ${comp}. With a proven track record in designing and building scalable software solutions, I am excited about the opportunity to contribute to your team.`;
      const value = guidedValue || `Throughout my professional career, I have focused on engineering high-fidelity systems, refining user experiences, and collaborating with stakeholders. My skills in full-stack architecture, clean coding practices, and strategic execution align perfectly with the requirements of this role.`;
      const align = guidedAlign || `I am particularly drawn to ${comp} because of your team's commitment to pushing engineering boundaries and cultivating an outstanding product culture. I would love to bring my technical expertise and creative problem-solving skills to help you achieve your goals.`;
      const close = guidedClose || `Thank you for your time, consideration, and review of my application details. I look forward to the possibility of discussing how my background and past achievements can support your current priorities.`;
      
      // Update states if empty
      if (!guidedHook) setGuidedHook(hook);
      if (!guidedValue) setGuidedValue(value);
      if (!guidedAlign) setGuidedAlign(align);
      if (!guidedClose) setGuidedClose(close);
      
      // Concatenate the final letter
      const compiled = `Dear Hiring Team,

${hook}

${value}

${align}

${close}

Sincerely,
${data.basics.name || 'Applicant'}`;

      setGeneratedCoverLetter(compiled);
      
      // Push back to ResumeData
      saveCoverLetterToData(
        targetCompany,
        targetJobTitle,
        targetJobDesc,
        storyType,
        compiled,
        'guided',
        { hook, value, align, close }
      );
    }
  }, [coverLetterMode, targetCompany, targetJobTitle, guidedHook, guidedValue, guidedAlign, guidedClose, data.basics.name]);

  // Lock body scroll on desktop
  useEffect(() => {
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

  // Autosave
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

          const { error } = await supabase
            .from('resumes')
            .upsert({
              user_id: user.id,
              data,
              template,
              is_public: isPublic,
              updated_at: timestamp
            }, { onConflict: 'user_id' });

          if (error) {
            console.error('Supabase sync error:', error.message || error);
          }

          // 3. If Pro and have an activeResumeId, also update profiles.resume_data list
          if (isPro && activeResumeId) {
            setSavedResumes(prev => {
              const updated = prev.map(r => r.id === activeResumeId ? {
                ...r,
                data,
                template,
                isPublic,
                updatedAt: timestamp
              } : r);

              // Update in database background
              supabase
                .from('profiles')
                .update({ resume_data: updated })
                .eq('id', user.id)
                .then(({ error: profileErr }) => {
                  if (profileErr) {
                    console.error('Failed to sync saved resumes list to profiles:', profileErr);
                  }
                });

              return updated;
            });
          }
        }

        setSaveStatus('saved');
        setLastSaved(new Date());
        setTimeout(() => setSaveStatus('idle'), 3000);
      } catch (e) {
        console.error("Failed to autosave resume data", e);
        setSaveStatus('error');
      }
    }, 2000);

    return () => clearTimeout(timer);
  }, [data, template, isPublic, isSignedIn, user?.id, getToken, isPro, activeResumeId]);

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

  // Resume CRUD operations for Pro users
  const handleCreateNewResume = async (name: string, cloneCurrent: boolean) => {
    if (!isSignedIn || !user || !isPro) return;
    setSaveStatus('saving');

    const newId = crypto.randomUUID();
    const timestamp = new Date().toISOString();
    
    const newResume: SavedResume = {
      id: newId,
      name: name.trim() || `New Resume`,
      data: cloneCurrent ? { ...data } : { ...defaultResume },
      template: cloneCurrent ? template : 'modern-split',
      isPublic: cloneCurrent ? isPublic : true,
      updatedAt: timestamp
    };

    const updatedList = [...savedResumes, newResume];
    setSavedResumes(updatedList);
    setActiveResumeId(newId);
    localStorage.setItem(`cr-active-resume-id-${user.id}`, newId);

    // Update active states
    setData(newResume.data);
    setTemplate(newResume.template);
    setIsPublic(newResume.isPublic);

    try {
      // 1. Sync resumes list to profiles table
      const { error: profileErr } = await supabase
        .from('profiles')
        .update({ resume_data: updatedList })
        .eq('id', user.id);
      if (profileErr) throw profileErr;

      // 2. Sync active resume to resumes table
      const { error: resumeErr } = await supabase
        .from('resumes')
        .upsert({
          user_id: user.id,
          data: newResume.data,
          template: newResume.template,
          is_public: newResume.isPublic,
          updated_at: timestamp
        }, { onConflict: 'user_id' });
      if (resumeErr) throw resumeErr;

      setSaveStatus('saved');
      setLastSaved(new Date());
      setTimeout(() => setSaveStatus('idle'), 3000);
    } catch (err) {
      console.error("Failed to create new resume:", err);
      setSaveStatus('error');
    }
  };

  const handleSwitchResume = async (targetId: string) => {
    if (!isSignedIn || !user || !isPro) return;
    const target = savedResumes.find(r => r.id === targetId);
    if (!target) return;

    setSaveStatus('saving');
    const timestamp = new Date().toISOString();

    // 1. Save currently active state into our local savedResumes array for old ID
    let updatedList = savedResumes.map(r => r.id === activeResumeId ? {
      ...r,
      data,
      template,
      isPublic,
      updatedAt: timestamp
    } : r);

    setSavedResumes(updatedList);
    setActiveResumeId(targetId);
    localStorage.setItem(`cr-active-resume-id-${user.id}`, targetId);

    // 2. Load the target state
    setData(target.data);
    setTemplate(target.template);
    setIsPublic(target.isPublic);

    try {
      // 3. Save the full lists and active mirror to database
      const { error: profileErr } = await supabase
        .from('profiles')
        .update({ resume_data: updatedList })
        .eq('id', user.id);
      if (profileErr) throw profileErr;

      const { error: resumeErr } = await supabase
        .from('resumes')
        .upsert({
          user_id: user.id,
          data: target.data,
          template: target.template,
          is_public: target.isPublic,
          updated_at: timestamp
        }, { onConflict: 'user_id' });
      if (resumeErr) throw resumeErr;

      setSaveStatus('saved');
      setLastSaved(new Date());
      setTimeout(() => setSaveStatus('idle'), 3000);
    } catch (err) {
      console.error("Failed to switch resume:", err);
      setSaveStatus('error');
    }
  };

  const handleRenameResume = async (targetId: string, newName: string) => {
    if (!isSignedIn || !user || !isPro || !newName.trim()) return;
    const updatedList = savedResumes.map(r => r.id === targetId ? { ...r, name: newName.trim() } : r);
    setSavedResumes(updatedList);

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ resume_data: updatedList })
        .eq('id', user.id);
      if (error) throw error;
    } catch (err) {
      console.error("Failed to rename resume:", err);
    }
  };

  const handleDeleteResume = async (targetId: string) => {
    if (!isSignedIn || !user || !isPro) return;
    if (savedResumes.length <= 1) {
      alert("You must keep at least one saved resume!");
      return;
    }

    const confirmDelete = confirm("Are you sure you want to delete this resume? This action cannot be undone.");
    if (!confirmDelete) return;

    setSaveStatus('saving');
    const filteredList = savedResumes.filter(r => r.id !== targetId);
    setSavedResumes(filteredList);

    try {
      // If we are deleting the active resume, switch to the first remaining one
      if (activeResumeId === targetId) {
        const nextActive = filteredList[0];
        setActiveResumeId(nextActive.id);
        localStorage.setItem(`cr-active-resume-id-${user.id}`, nextActive.id);
        
        setData(nextActive.data);
        setTemplate(nextActive.template);
        setIsPublic(nextActive.isPublic);

        const timestamp = new Date().toISOString();
        const { error: profileErr } = await supabase
          .from('profiles')
          .update({ resume_data: filteredList })
          .eq('id', user.id);
        if (profileErr) throw profileErr;

        const { error: resumeErr } = await supabase
          .from('resumes')
          .upsert({
            user_id: user.id,
            data: nextActive.data,
            template: nextActive.template,
            is_public: nextActive.isPublic,
            updated_at: timestamp
          }, { onConflict: 'user_id' });
        if (resumeErr) throw resumeErr;
      } else {
        const { error: profileErr } = await supabase
          .from('profiles')
          .update({ resume_data: filteredList })
          .eq('id', user.id);
        if (profileErr) throw profileErr;
      }

      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 3000);
    } catch (err) {
      console.error("Failed to delete resume:", err);
      setSaveStatus('error');
    }
  };

  const contentRef = useRef<HTMLDivElement>(null);
  const measureRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [pageCount, setPageCount] = useState(1);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowResumesDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const measure = () => {
      if (measureRef.current) {
        setPageCount(pageCountFromScrollWidth(measureRef.current.scrollWidth));
      }
    };

    // ResizeObserver watches for font/image loading or content scale adjustments
    const observer = new ResizeObserver(() => {
      // Small debounce to let browser settle
      setTimeout(measure, 100);
    });

    if (measureRef.current) {
      observer.observe(measureRef.current);
    }

    if (typeof document !== 'undefined' && 'fonts' in document) {
      document.fonts.ready.then(measure);
    }

    measure();
    return () => observer.disconnect();
  }, [data, template, data.metadata?.scale, data.metadata?.pageMargin]);

  const handlePrint = useReactToPrint({
    contentRef
  });

  const [aiLoading, setAiLoading] = useState<Record<string, boolean>>({});

  const handleJobAI = async (jobId: string, type: 'summary' | 'bullets') => {
    if (!isPro) {
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
    if (!isPro) {
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
    if (!isPro) {
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

  const handleGenerateCoverLetter = async () => {
    if (!targetCompany || !targetJobTitle) {
      alert("Please provide at least a Target Company Name and Job Title to generate your cover letter.");
      return;
    }

    setIsGeneratingCoverLetter(true);
    try {
      const response = await fetch('/api/ai/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          context: {
            targetCompany,
            targetJobTitle,
            targetJobDesc,
            storyType,
            fullResume: data,
          },
          type: 'cover-letter',
          careerContext,
        }),
      });

      if (!response.ok) throw new Error('Generation failed');
      const text = await response.text();
      const content = text.trim();
      setGeneratedCoverLetter(content);
      
      // Auto-save generated letter back to database via ResumeData state
      saveCoverLetterToData(targetCompany, targetJobTitle, targetJobDesc, storyType, content, 'ai');
    } catch (e) {
      console.error(e);
      alert("Failed to generate cover letter. Please try again.");
    } finally {
      setIsGeneratingCoverLetter(false);
    }
  };

  const handleCopyCoverLetter = () => {
    navigator.clipboard.writeText(generatedCoverLetter);
    setCopiedCoverLetter(true);
    setTimeout(() => setCopiedCoverLetter(false), 2000);
  };

  const handlePdfImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      e.target.value = ''; // reset input

      if (!isPro) {
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

        const result = await response.json().catch(() => ({}));
        if (!response.ok) {
          if (response.status === 403) {
            setUpgradeFeature('AI PDF Resume Import');
            setUpgradeModalOpen(true);
          }
          throw new Error(result.error || 'Failed to parse PDF');
        }

        const { _importMethod, ...parsedData } = result;
        if (parsedData) {
          saveUndoState();
          setData(prev => ({
            ...prev,
            ...parsedData,
            metadata: prev.metadata
          }));
          const methodNote =
            _importMethod === 'pdf-vision-ai'
              ? ' (read via AI vision — scanned or image PDF)'
              : _importMethod === 'embedded-json'
                ? ' (imported from embedded resume data)'
                : '';
          alert(`Resume imported successfully!${methodNote}`);
        }
      } catch (err) {
        console.error(err);
        const message = err instanceof Error ? err.message : 'Failed to parse PDF resume.';
        alert(message);
      } finally {
        setIsAILoading(false);
      }
    }
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
      width: '100%',
      overflow: isMobile ? 'visible' : 'hidden',
      position: 'relative',
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
                <Sparkles size={16} /> AI Resume Import {!isPro && <Lock size={12} />}
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
              {/* eslint-disable-next-line @next/next/no-img-element -- preview thumbnail; Next/Image not suitable for inline dynamic previews */}
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
              <label className="label" style={{ marginBottom: 0 }}>Professional Summary</label>
              <button
                onClick={handleRewrite}
                disabled={isAILoading}
                className="btn-icon"
                style={{ fontSize: '0.7rem', background: 'rgba(16, 185, 129, 0.15)', color: '#10b981', padding: '2px 6px', borderRadius: '4px', border: '1px solid rgba(16, 185, 129, 0.3)', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '4px' }}
              >
                {isAILoading ? <Loader2 size={12} className="animate-spin" /> : <><Wand2 size={12} /> AI Rewrite {!isPro && <Lock size={10} />}</>}
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
                      className="btn-icon"
                      style={{ fontSize: '0.65rem', background: 'rgba(16, 185, 129, 0.15)', color: '#10b981', padding: '2px 6px', borderRadius: '4px', border: '1px solid rgba(16, 185, 129, 0.3)', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                    >
                      {aiLoading[`${job.id}-summary`] ? <Loader2 size={10} className="animate-spin" /> : <><Wand2 size={10} /> AI Generate {!isPro && <Lock size={8} />}</>}
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
                        className="btn-icon"
                        style={{ fontSize: '0.65rem', background: 'rgba(16, 185, 129, 0.15)', color: '#10b981', padding: '2px 6px', borderRadius: '4px', border: '1px solid rgba(16, 185, 129, 0.3)', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                      >
                        {aiLoading[`${job.id}-bullets`] ? <Loader2 size={10} className="animate-spin" /> : <><Wand2 size={10} /> AI Generate {!isPro && <Lock size={8} />}</>}
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
                  onClick={(e) => { e.preventDefault(); alert(isPro ? "Languages section coming soon for Pro!" : "Languages are a premium feature!"); }}
                >
                  {isPro ? <CheckCircle size={14} color="var(--accent)" /> : <Lock size={14} />} Languages {isPro ? "(Pro Unlocked)" : "(Premium)"}
                </button>
              </div>
            )}
          </div>

          {/* AI & Guided Cover Letter Generator */}
          <div style={{ marginTop: '2rem', background: 'var(--surface-highlight)', border: '1px solid var(--glass-border)', borderRadius: '12px', overflow: 'hidden' }}>
            <button
              onClick={() => setShowCoverLetterSection(!showCoverLetterSection)}
              style={{
                width: '100%',
                padding: '1rem',
                background: 'transparent',
                border: 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                cursor: 'pointer',
                color: 'var(--text-primary)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontWeight: 700, fontSize: '0.95rem' }}>
                <FileText size={18} color="var(--primary)" />
                <span>Cover Letter Architect</span>
              </div>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                {showCoverLetterSection ? 'Collapse' : 'Expand'}
              </span>
            </button>

            {showCoverLetterSection && (
              <div style={{ padding: '1.25rem', borderTop: '1px solid var(--glass-border)', display: 'flex', flexDirection: 'column', gap: '1.25rem', background: 'rgba(0, 0, 0, 0.15)' }}>
                
                {/* Mode Selector Tabs */}
                <div style={{ display: 'flex', gap: '0.25rem', padding: '2px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px', border: '1px solid var(--glass-border)', marginBottom: '0.5rem' }}>
                  <button
                    onClick={() => setCoverLetterMode('ai')}
                    style={{
                      flex: 1,
                      padding: '0.45rem',
                      fontSize: '0.8rem',
                      fontWeight: 700,
                      borderRadius: '6px',
                      background: coverLetterMode === 'ai' ? 'var(--primary)' : 'transparent',
                      color: coverLetterMode === 'ai' ? 'var(--bg-color)' : 'var(--text-secondary)',
                      border: 'none',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.25rem'
                    }}
                  >
                    <span>🧠 AI Generator</span>
                    {!isPro && <Lock size={10} />}
                  </button>
                  <button
                    onClick={() => setCoverLetterMode('guided')}
                    style={{
                      flex: 1,
                      padding: '0.45rem',
                      fontSize: '0.8rem',
                      fontWeight: 700,
                      borderRadius: '6px',
                      background: coverLetterMode === 'guided' ? 'var(--primary)' : 'transparent',
                      color: coverLetterMode === 'guided' ? 'var(--bg-color)' : 'var(--text-secondary)',
                      border: 'none',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.25rem'
                    }}
                  >
                    <span>✍️ Guided Creator</span>
                    <span style={{ fontSize: '0.65rem', background: 'rgba(16, 185, 129, 0.18)', color: 'var(--accent)', padding: '1px 6px', borderRadius: '4px', fontWeight: 800 }}>FREE</span>
                  </button>
                </div>

                {/* AI GENERATOR TAB (Pro Protected) */}
                {coverLetterMode === 'ai' && (
                  !isPro ? (
                    <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem', padding: '0.5rem 0' }}>
                      <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5 }}>
                        Write tailor-made, ATS-optimized cover letters for any target company instantly using your custom resume context and Gemini-powered storytelling tones.
                      </p>
                      <button
                        className="btn btn-primary"
                        style={{ width: '100%', display: 'flex', justifyContent: 'center', gap: '0.5rem', marginTop: '0.5rem' }}
                        onClick={() => { setUpgradeFeature('AI Cover Letter Generator'); setUpgradeModalOpen(true); }}
                      >
                        <Lock size={14} /> Unlock AI Cover Letters (Pro)
                      </button>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                      <div>
                        <label className="label" style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '0.25rem', letterSpacing: '0.5px' }}>Target Company</label>
                        <input
                          type="text"
                          className="input-field"
                          placeholder="e.g. Google"
                          value={targetCompany}
                          onChange={e => setTargetCompany(e.target.value)}
                          style={{ padding: '0.5rem 0.75rem', fontSize: '0.95rem' }}
                        />
                      </div>
                      <div>
                        <label className="label" style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '0.25rem', letterSpacing: '0.5px' }}>Target Job Title</label>
                        <input
                          type="text"
                          className="input-field"
                          placeholder="e.g. Senior Software Engineer"
                          value={targetJobTitle}
                          onChange={e => setTargetJobTitle(e.target.value)}
                          style={{ padding: '0.5rem 0.75rem', fontSize: '0.95rem' }}
                        />
                      </div>
                      <div>
                        <label className="label" style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '0.25rem', letterSpacing: '0.5px' }}>Narrative Story Tone</label>
                        <select
                          className="input-field"
                          value={storyType}
                          onChange={e => setStoryType(e.target.value)}
                          style={{ padding: '0.5rem 0.75rem', fontSize: '0.9rem', fontWeight: 600, background: 'var(--surface-color)', color: 'var(--text-primary)', width: '100%' }}
                        >
                          <option value="standard">Standard Corporate Narrative (Balanced)</option>
                          <option value="passionate">Passionate & Purpose-Driven (Personal Story)</option>
                          <option value="growth">Growth & Adaptability (Quick Learner/Scaler)</option>
                          <option value="technical">Technical Excellence (Metrics & Architecture)</option>
                          <option value="leadership">Strategic Leadership (Team Ownership & Metrics)</option>
                        </select>
                      </div>
                      <div>
                        <label className="label" style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '0.25rem', letterSpacing: '0.5px' }}>Job Description/Requirements (Optional)</label>
                        <textarea
                          className="input-field"
                          placeholder="Paste job context here to match your skills directly..."
                          value={targetJobDesc}
                          onChange={e => setTargetJobDesc(e.target.value)}
                          style={{ minHeight: '60px', padding: '0.5rem 0.75rem', fontSize: '0.85rem', resize: 'vertical' }}
                        />
                      </div>

                      <button
                        className="btn btn-primary"
                        disabled={isGeneratingCoverLetter}
                        style={{ width: '100%', display: 'flex', justifyContent: 'center', gap: '0.5rem', padding: '0.65rem' }}
                        onClick={handleGenerateCoverLetter}
                      >
                        {isGeneratingCoverLetter ? (
                          <>
                            <Loader2 size={16} className="animate-spin" />
                            <span>Generating Story...</span>
                          </>
                        ) : (
                          <>
                            <Sparkles size={16} />
                            <span>Generate Cover Letter</span>
                          </>
                        )}
                      </button>

                      {generatedCoverLetter && (
                        <div style={{ marginTop: '1rem', borderTop: '1px solid var(--glass-border)', paddingTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--primary)' }}>AI Generated Output</span>
                            <button
                              className="btn btn-secondary"
                              onClick={handleCopyCoverLetter}
                              style={{ padding: '0.25rem 0.5rem', fontSize: '0.7rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                            >
                              {copiedCoverLetter ? (
                                <>
                                  <CheckCircle size={10} color="var(--accent)" />
                                  <span>Copied!</span>
                                </>
                              ) : (
                                <span>Copy to Clipboard</span>
                              )}
                            </button>
                          </div>
                          <textarea
                            className="input-field"
                            value={generatedCoverLetter}
                            onChange={e => {
                              setGeneratedCoverLetter(e.target.value);
                              saveCoverLetterToData(targetCompany, targetJobTitle, targetJobDesc, storyType, e.target.value, 'ai');
                            }}
                            style={{ minHeight: '200px', fontSize: '0.8rem', fontFamily: 'monospace', padding: '0.75rem', lineHeight: 1.4, resize: 'vertical' }}
                          />
                        </div>
                      )}
                    </div>
                  )
                )}

                {/* GUIDED CREATOR TAB (100% Free) */}
                {coverLetterMode === 'guided' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div>
                      <label className="label" style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '0.25rem', letterSpacing: '0.5px' }}>Target Company</label>
                      <input
                        type="text"
                        className="input-field"
                        placeholder="e.g. Google"
                        value={targetCompany}
                        onChange={e => setTargetCompany(e.target.value)}
                        style={{ padding: '0.5rem 0.75rem', fontSize: '0.95rem' }}
                      />
                    </div>
                    <div>
                      <label className="label" style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '0.25rem', letterSpacing: '0.5px' }}>Target Job Title</label>
                      <input
                        type="text"
                        className="input-field"
                        placeholder="e.g. Senior Software Engineer"
                        value={targetJobTitle}
                        onChange={e => setTargetJobTitle(e.target.value)}
                        style={{ padding: '0.5rem 0.75rem', fontSize: '0.95rem' }}
                      />
                    </div>

                    <div style={{ borderTop: '1px solid var(--glass-border)', paddingTop: '1rem', marginTop: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                      <span style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--primary)' }}>✍️ Guided Cover Letter Editor</span>
                      
                      <div>
                        <label className="label" style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Step 1: The Hook (Opening paragraph)</label>
                        <textarea
                          className="input-field"
                          placeholder="Why you are writing and excited about the position..."
                          value={guidedHook}
                          onChange={e => setGuidedHook(e.target.value)}
                          style={{ minHeight: '60px', padding: '0.5rem', fontSize: '0.8rem', resize: 'vertical' }}
                        />
                      </div>
                      <div>
                        <label className="label" style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Step 2: The Value Story (Body paragraph)</label>
                        <textarea
                          className="input-field"
                          placeholder="Highlight your skills, credentials, and accomplishments..."
                          value={guidedValue}
                          onChange={e => setGuidedValue(e.target.value)}
                          style={{ minHeight: '70px', padding: '0.5rem', fontSize: '0.8rem', resize: 'vertical' }}
                        />
                      </div>
                      <div>
                        <label className="label" style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Step 3: Company Alignment (Why this company?)</label>
                        <textarea
                          className="input-field"
                          placeholder="Connect your culture fit and alignment with their mission..."
                          value={guidedAlign}
                          onChange={e => setGuidedAlign(e.target.value)}
                          style={{ minHeight: '60px', padding: '0.5rem', fontSize: '0.8rem', resize: 'vertical' }}
                        />
                      </div>
                      <div>
                        <label className="label" style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Step 4: Close & Call to Action</label>
                        <textarea
                          className="input-field"
                          placeholder="Thank them and request a strategic follow-up discussion..."
                          value={guidedClose}
                          onChange={e => setGuidedClose(e.target.value)}
                          style={{ minHeight: '50px', padding: '0.5rem', fontSize: '0.8rem', resize: 'vertical' }}
                        />
                      </div>
                    </div>

                    <div style={{ borderTop: '1px dashed var(--glass-border)', paddingTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--primary)' }}>Aggregated Cover Letter Output</span>
                        <button
                          className="btn btn-secondary"
                          onClick={handleCopyCoverLetter}
                          style={{ padding: '0.25rem 0.5rem', fontSize: '0.7rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                        >
                          {copiedCoverLetter ? 'Copied!' : 'Copy to Clipboard'}
                        </button>
                      </div>
                      <textarea
                        className="input-field"
                        value={generatedCoverLetter}
                        onChange={e => {
                          setGeneratedCoverLetter(e.target.value);
                          saveCoverLetterToData(
                            targetCompany,
                            targetJobTitle,
                            targetJobDesc,
                            storyType,
                            e.target.value,
                            'guided',
                            { hook: guidedHook, value: guidedValue, align: guidedAlign, close: guidedClose }
                          );
                        }}
                        style={{ minHeight: '160px', fontSize: '0.775rem', fontFamily: 'monospace', padding: '0.75rem', lineHeight: 1.4, resize: 'vertical' }}
                      />
                    </div>
                  </div>
                )}

              </div>
            )}
          </div>

          {isPro ? (
            <div style={{ padding: '1.25rem', background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.25)', borderRadius: '8px', marginTop: '2rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', textAlign: 'center' }}>
              <h3 style={{ fontSize: '0.9rem', color: 'var(--accent)', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700 }}>
                <Sparkles size={16} color="var(--accent)" /> Pro Unlocked
              </h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.4 }}>
                You have unlimited, lifetime access to all state-of-the-art AI parsing and generation features.
              </p>
            </div>
          ) : (
            <div style={{ padding: '1rem', background: 'rgba(139, 92, 246, 0.1)', border: '1px solid rgba(139, 92, 246, 0.2)', borderRadius: '8px', marginTop: '2rem' }}>
              <h3 style={{ fontSize: '0.9rem', color: 'var(--secondary)', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Lock size={16} /> Premium AI Features
              </h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
                Upgrade your account to access our ATS-optimized AI writer for experience bullets, skills extraction, and custom cover letters.
              </p>
              <button onClick={() => { setUpgradeFeature('CareerReport Pro'); setUpgradeModalOpen(true); }} className="btn btn-secondary" style={{ width: '100%', fontSize: '0.875rem' }}>Upgrade to Premium ($9)</button>
            </div>
          )}
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

            {/* Resume Selector */}
            {!isMobile && (
              <div ref={dropdownRef} style={{ position: 'relative' }}>
                {!isPro ? (
                  <button
                    onClick={() => {
                      setUpgradeFeature("Multiple Resumes");
                      setUpgradeModalOpen(true);
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      padding: '0.4rem 0.75rem',
                      background: 'var(--surface-color)',
                      border: '1px solid var(--glass-border)',
                      borderRadius: '8px',
                      color: 'var(--text-secondary)',
                      cursor: 'pointer',
                      fontWeight: 600,
                      fontSize: '0.9rem',
                      transition: 'all 0.2s ease',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = 'var(--primary)';
                      e.currentTarget.style.color = 'var(--text-primary)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = 'var(--glass-border)';
                      e.currentTarget.style.color = 'var(--text-secondary)';
                    }}
                  >
                    <FileText size={16} />
                    <span>Resume: Default</span>
                    <Lock size={12} color="var(--primary)" />
                  </button>
                ) : (
                  <>
                    <button
                      onClick={() => setShowResumesDropdown(!showResumesDropdown)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        padding: '0.4rem 0.75rem',
                        background: 'var(--surface-color)',
                        border: `1px solid ${showResumesDropdown ? 'var(--primary)' : 'var(--glass-border)'}`,
                        borderRadius: '8px',
                        color: 'var(--text-primary)',
                        cursor: 'pointer',
                        fontWeight: 600,
                        fontSize: '0.9rem',
                        transition: 'all 0.2s ease',
                      }}
                    >
                      <FileText size={16} color="var(--accent)" />
                      <span style={{ maxWidth: '160px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        Resume: {savedResumes.find(r => r.id === activeResumeId)?.name || 'Default Resume'}
                      </span>
                      <span style={{ fontSize: '0.75rem', opacity: 0.7 }}>▼</span>
                    </button>

                    {showResumesDropdown && (
                      <div
                        className="glass-panel"
                        style={{
                          position: 'absolute',
                          top: '100%',
                          left: 0,
                          marginTop: '0.5rem',
                          width: '280px',
                          maxHeight: '380px',
                          overflowY: 'auto',
                          background: 'var(--surface-color)',
                          border: '1px solid var(--glass-border)',
                          boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
                          zIndex: 50,
                          padding: '0.75rem',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '0.5rem',
                          borderRadius: '12px',
                        }}
                      >
                        <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', paddingBottom: '0.25rem', borderBottom: '1px solid var(--glass-border)', marginBottom: '0.25rem' }}>
                          Saved Resumes
                        </div>
                        
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', maxHeight: '200px', overflowY: 'auto', paddingRight: '2px' }} className="sidebar-scroll">
                          {savedResumes.map((resume) => (
                            <div key={resume.id}>
                              {resumeRenameId === resume.id ? (
                                <div style={{ display: 'flex', gap: '0.25rem', width: '100%', padding: '0.25rem 0' }}>
                                  <input
                                    value={renameText}
                                    onChange={(e) => setRenameText(e.target.value)}
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter') {
                                        handleRenameResume(resume.id, renameText);
                                        setResumeRenameId(null);
                                      } else if (e.key === 'Escape') {
                                        setResumeRenameId(null);
                                      }
                                    }}
                                    autoFocus
                                    className="input-field"
                                    style={{
                                      padding: '0.25rem 0.5rem',
                                      fontSize: '0.8rem',
                                      flex: 1,
                                      background: 'var(--bg-color)',
                                      border: '1px solid var(--primary)',
                                      color: 'var(--text-primary)',
                                      borderRadius: '4px',
                                    }}
                                  />
                                  <button
                                    onClick={() => {
                                      handleRenameResume(resume.id, renameText);
                                      setResumeRenameId(null);
                                    }}
                                    style={{
                                      background: 'var(--accent)',
                                      color: 'var(--bg-color)',
                                      border: 'none',
                                      borderRadius: '4px',
                                      cursor: 'pointer',
                                      padding: '0.25rem',
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      width: '28px',
                                      height: '28px',
                                    }}
                                  >
                                    <Check size={14} />
                                  </button>
                                  <button
                                    onClick={() => setResumeRenameId(null)}
                                    style={{
                                      background: 'var(--danger)',
                                      color: '#fff',
                                      border: 'none',
                                      borderRadius: '4px',
                                      cursor: 'pointer',
                                      padding: '0.25rem',
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      width: '28px',
                                      height: '28px',
                                    }}
                                  >
                                    <X size={14} />
                                  </button>
                                </div>
                              ) : (
                                <div
                                  style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    padding: '0.5rem',
                                    borderRadius: '6px',
                                    background: resume.id === activeResumeId ? 'var(--surface-highlight)' : 'transparent',
                                    border: `1px solid ${resume.id === activeResumeId ? 'rgba(142, 192, 124, 0.3)' : 'transparent'}`,
                                    transition: 'all 0.2s',
                                    cursor: 'pointer',
                                  }}
                                  onClick={() => {
                                    if (resume.id !== activeResumeId) {
                                      handleSwitchResume(resume.id);
                                    }
                                  }}
                                  onMouseEnter={(e) => {
                                    if (resume.id !== activeResumeId) {
                                      e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
                                    }
                                  }}
                                  onMouseLeave={(e) => {
                                    if (resume.id !== activeResumeId) {
                                      e.currentTarget.style.background = 'transparent';
                                    }
                                  }}
                                >
                                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', overflow: 'hidden', flex: 1 }}>
                                    <span style={{
                                      fontSize: '0.85rem',
                                      fontWeight: resume.id === activeResumeId ? 700 : 500,
                                      color: resume.id === activeResumeId ? 'var(--text-primary)' : 'var(--text-secondary)',
                                      whiteSpace: 'nowrap',
                                      overflow: 'hidden',
                                      textOverflow: 'ellipsis'
                                    }}>
                                      {resume.name}
                                    </span>
                                    <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', opacity: 0.6 }}>
                                      Updated {new Date(resume.updatedAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                                    </span>
                                  </div>
                                  
                                  <div style={{ display: 'flex', gap: '0.25rem', marginLeft: '0.5rem' }} onClick={(e) => e.stopPropagation()}>
                                    <button
                                      onClick={() => {
                                        setResumeRenameId(resume.id);
                                        setRenameText(resume.name);
                                      }}
                                      className="btn-icon"
                                      style={{ padding: '4px', borderRadius: '4px' }}
                                      title="Rename Resume"
                                    >
                                      <Edit size={12} />
                                    </button>
                                    
                                    <button
                                      onClick={() => handleDeleteResume(resume.id)}
                                      disabled={savedResumes.length <= 1}
                                      className="btn-icon"
                                      style={{
                                        padding: '4px',
                                        borderRadius: '4px',
                                        color: savedResumes.length <= 1 ? 'rgba(255,255,255,0.1)' : 'var(--danger)',
                                        cursor: savedResumes.length <= 1 ? 'not-allowed' : 'pointer'
                                      }}
                                      title="Delete Resume"
                                    >
                                      <Trash2 size={12} />
                                    </button>
                                  </div>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>

                        <div style={{ borderTop: '1px solid var(--glass-border)', paddingTop: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                          <button
                            onClick={() => {
                              const activeResume = savedResumes.find(r => r.id === activeResumeId);
                              const baseName = activeResume ? activeResume.name : 'Resume';
                              handleCreateNewResume(`${baseName} Copy`, true);
                              setShowResumesDropdown(false);
                            }}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '0.4rem',
                              padding: '0.5rem',
                              background: 'transparent',
                              border: '1px solid var(--glass-border)',
                              borderRadius: '6px',
                              color: 'var(--text-primary)',
                              fontSize: '0.8rem',
                              fontWeight: 600,
                              cursor: 'pointer',
                              width: '100%',
                              transition: 'all 0.2s',
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.background = 'var(--surface-highlight)';
                              e.currentTarget.style.borderColor = 'var(--accent)';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.background = 'transparent';
                              e.currentTarget.style.borderColor = 'var(--glass-border)';
                            }}
                          >
                            <Copy size={13} color="var(--accent)" />
                            <span>Clone Current Resume</span>
                          </button>

                          <button
                            onClick={() => {
                              const name = prompt("Enter a name for your new resume:");
                              if (name !== null) {
                                handleCreateNewResume(name, false);
                                setShowResumesDropdown(false);
                              }
                            }}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '0.4rem',
                              padding: '0.5rem',
                              background: 'linear-gradient(135deg, var(--primary), var(--secondary))',
                              border: 'none',
                              borderRadius: '6px',
                              color: 'var(--bg-color)',
                              fontSize: '0.8rem',
                              fontWeight: 700,
                              cursor: 'pointer',
                              width: '100%',
                              transition: 'all 0.2s',
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.opacity = '0.9';
                              e.currentTarget.style.transform = 'translateY(-1px)';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.opacity = '1';
                              e.currentTarget.style.transform = 'none';
                            }}
                          >
                            <Plus size={14} />
                            <span>Create New Resume</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </>
                )}
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
            {generatedCoverLetter && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--glass-border)', padding: '0.4rem 0.75rem', borderRadius: '8px' }}>
                <input 
                  type="checkbox" 
                  id="includeCoverLetter"
                  checked={includeCoverLetter} 
                  onChange={e => setIncludeCoverLetter(e.target.checked)} 
                  style={{ accentColor: 'var(--primary)', cursor: 'pointer' }}
                />
                <label htmlFor="includeCoverLetter" style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  💼 Export Cover Letter
                </label>
              </div>
            )}
            <button
              onClick={() => {
                if (!isSignedIn) {
                  setShowGuestExportPrompt(true);
                } else {
                  handlePrint();
                }
              }}
              className="btn btn-primary"
              style={{ padding: '0.5rem 1.25rem', fontSize: '0.9rem', gap: '0.5rem' }}
            >
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
        {/* Hidden measurement div — uses CSS columns to detect exactly how many
            850px columns (pages) the content overflows into. */}
        <div className="no-print" style={{
          visibility: 'hidden',
          position: 'absolute',
          top: 0,
          left: 0,
          pointerEvents: 'none',
          zIndex: -1,
          width: 'fit-content',
          minWidth: '850px',
          overflow: 'visible'
        }}>
          <div ref={measureRef} className="resume-ui-layout" style={{
            width: 'auto',
            minWidth: '850px',
            columnFill: 'auto',
            padding: `${(data.metadata?.pageMargin || 0.42) * 96}px 0`
          }}>
            <div style={{ zoom: data.metadata?.scale || 1 }}>
              {template === 'modern' && <TemplateModern data={{ ...data, basics: { ...data.basics, image: includeHeadshot ? data.basics.image : '' } }} />}
              {template === 'modern-split' && <TemplateModernSplit data={{ ...data, basics: { ...data.basics, image: includeHeadshot ? data.basics.image : '' } }} />}
              {template === 'classic' && <TemplateClassic data={{ ...data, basics: { ...data.basics, image: includeHeadshot ? data.basics.image : '' } }} />}
              {template === 'minimal' && <TemplateMinimal data={{ ...data, basics: { ...data.basics, image: includeHeadshot ? data.basics.image : '' } }} />}
              <AtsMetadata data={data} />
            </div>
          </div>
        </div>

        {/* Print wrapper — USES THE SAME PAGE LOOP AS THE UI PREVIEW FOR TRUE WYSIWYG */}
        <div style={{ opacity: 0, position: 'absolute', pointerEvents: 'none', top: 0, left: 0 }}>
          <div ref={contentRef} className="resume-print-container">
            <style>{`
              @page { size: 8.5in 11in; margin: 0; }
              @media print {
                .resume-print-page { break-after: page; page-break-after: always; }
              }
            `}</style>
            {/* We scale the 850px layout slightly to fit 8.5in (816px) paper perfectly */}
            <div style={{ zoom: 0.96 }}>
              {/* Optional Cover Letter page */}
              {includeCoverLetter && generatedCoverLetter && (
                <div className="resume-print-page" style={{
                  width: '850px',
                  height: '1100px',
                  padding: '5rem 4.5rem',
                  background: 'white',
                  color: 'black',
                  fontFamily: 'Georgia, serif',
                  fontSize: '11pt',
                  lineHeight: 1.6,
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  boxSizing: 'border-box',
                  position: 'relative'
                }}>
                  <div style={{ display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'space-between' }}>
                    <div>
                      {/* Business letterhead */}
                      <div style={{ borderBottom: '2px solid #eaeaea', paddingBottom: '1rem', marginBottom: '2.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                        <div>
                          <strong style={{ fontSize: '1.75rem', letterSpacing: '-0.5px', color: '#1a1a1a' }}>{data.basics.name}</strong>
                          <div style={{ fontSize: '1rem', color: '#8b5cf6', fontWeight: 600, marginTop: '2px' }}>{data.basics.label}</div>
                        </div>
                        <div style={{ textAlign: 'right', fontSize: '0.85rem', color: '#666' }}>
                          {data.basics.email} | {data.basics.phone}<br />
                          {data.basics.url || window.location.host}
                        </div>
                      </div>

                      {/* Recipient block */}
                      <div style={{ marginBottom: '2rem', fontSize: '0.95rem' }}>
                        {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}<br /><br />
                        <strong>Hiring Team</strong><br />
                        {targetCompany || 'Target Company'}<br />
                      </div>

                      {/* Subject */}
                      <div style={{ marginBottom: '1.5rem', fontSize: '1rem', fontWeight: 'bold', color: '#222' }}>
                        Subject: Application for the {targetJobTitle || 'Open Position'} role
                      </div>

                      {/* Body */}
                      <div style={{ whiteSpace: 'pre-wrap', color: '#333', textAlign: 'justify', fontSize: '0.95rem' }}>
                        {generatedCoverLetter}
                      </div>
                    </div>

                    {/* Sign-off */}
                    <div style={{ marginTop: '2rem', fontSize: '0.95rem', color: '#333' }}>
                      Sincerely,<br /><br />
                      <strong>{data.basics.name}</strong>
                    </div>
                  </div>
                </div>
              )}

              {Array.from({ length: pageCount }).map((_, i) => (
                <div key={`print-page-${i}`} className="resume-print-page" style={{
                  width: '850px',
                  height: '1100px',
                  overflow: 'hidden',
                  position: 'relative',
                  background: 'white'
                }}>
                  <div style={{ position: 'absolute', top: 0, left: `-${i * 890}px`, width: 'auto' }}>
                    <div className="resume-ui-layout" style={{ width: 'auto', minWidth: '850px', padding: `${(data.metadata?.pageMargin || 0.42) * 96}px 0` }}>
                      <div style={{ zoom: data.metadata?.scale || 1, width: '850px', overflow: 'visible' }}>
                        {template === 'modern' && <TemplateModern data={{ ...data, basics: { ...data.basics, image: includeHeadshot ? data.basics.image : '' } }} />}
                        {template === 'modern-split' && <TemplateModernSplit data={{ ...data, basics: { ...data.basics, image: includeHeadshot ? data.basics.image : '' } }} />}
                        {template === 'classic' && <TemplateClassic data={{ ...data, basics: { ...data.basics, image: includeHeadshot ? data.basics.image : '' } }} />}
                        {template === 'minimal' && <TemplateMinimal data={{ ...data, basics: { ...data.basics, image: includeHeadshot ? data.basics.image : '' } }} />}
                        <AtsMetadata data={data} />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
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
                  <div style={{ position: 'absolute', top: 0, left: `-${i * 890}px`, width: 'auto' }}>
                    <div className="resume-ui-layout" style={{ width: 'auto', minWidth: '850px', padding: `${(data.metadata?.pageMargin || 0.42) * 96}px 0` }}>
                      <div style={{ zoom: data.metadata?.scale || 1, width: '850px', overflow: 'visible' }}>
                        {template === 'modern' && <TemplateModern data={{ ...data, basics: { ...data.basics, image: includeHeadshot ? data.basics.image : '' } }} />}
                        {template === 'modern-split' && <TemplateModernSplit data={{ ...data, basics: { ...data.basics, image: includeHeadshot ? data.basics.image : '' } }} />}
                        {template === 'classic' && <TemplateClassic data={{ ...data, basics: { ...data.basics, image: includeHeadshot ? data.basics.image : '' } }} />}
                        {template === 'minimal' && <TemplateMinimal data={{ ...data, basics: { ...data.basics, image: includeHeadshot ? data.basics.image : '' } }} />}
                        <AtsMetadata data={data} />
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
        onUpgradeSuccess={() => setIsPro(true)}
      />

      {/* Guest Export Call-to-Action Modal */}
      {showGuestExportPrompt && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.85)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          backdropFilter: 'blur(8px)',
          padding: '1rem'
        }} onClick={() => setShowGuestExportPrompt(false)}>
          <div style={{
            background: 'var(--surface-color)',
            borderRadius: '20px',
            width: '100%',
            maxWidth: '460px',
            overflow: 'hidden',
            border: '1px solid var(--glass-border)',
            boxShadow: '0 25px 60px rgba(0,0,0,0.6)',
            position: 'relative'
          }} onClick={e => e.stopPropagation()}>
            
            {/* Close Button */}
            <button 
              onClick={() => setShowGuestExportPrompt(false)}
              className="btn-icon hover-opacity" 
              style={{ 
                position: 'absolute', 
                top: '1.25rem', 
                right: '1.25rem', 
                color: 'var(--text-secondary)',
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                zIndex: 10
              }}
            >
              <X size={20} />
            </button>

            <div>
              <div style={{ 
                background: 'linear-gradient(135deg, var(--surface-highlight) 0%, var(--surface-color) 100%)', 
                padding: '2.5rem 2rem 2rem 2rem', 
                textAlign: 'center',
                borderBottom: '1px solid var(--glass-border)'
              }}>
                <div style={{ 
                  width: '64px', 
                  height: '64px', 
                  background: 'var(--primary)', 
                  borderRadius: '50%', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  margin: '0 auto 1.25rem',
                  boxShadow: '0 0 25px rgba(250, 189, 47, 0.45)'
                }}>
                  <Sparkles size={32} color="var(--bg-color)" />
                </div>
                
                <h2 style={{ fontSize: '1.65rem', fontWeight: 800, margin: '0 0 0.5rem 0', color: 'var(--text-primary)', fontFamily: 'Plus Jakarta Sans, sans-serif' }}>Claim Your Profile Link</h2>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', margin: 0, lineHeight: 1.5 }}>
                  Before you export, do you want to create a free account to claim your public resume page and save your work permanently?
                </p>
              </div>

              <div style={{ padding: '2rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '2rem' }}>
                  {[
                    "Claim your personalized public shareable URL",
                    "Save and edit your resume anytime in the cloud",
                    "Unlock professional networking & direct applications"
                  ].map((benefit, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'var(--text-primary)' }}>
                      <CheckCircle size={16} color="var(--accent)" style={{ flexShrink: 0 }} />
                      <span style={{ fontSize: '0.9rem', fontWeight: 500 }}>{benefit}</span>
                    </div>
                  ))}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <SignUpButton mode="modal">
                    <button className="btn btn-primary" style={{ width: '100%', padding: '1rem', fontWeight: 700, fontSize: '1rem', cursor: 'pointer', display: 'flex', justifyContent: 'center', gap: '0.5rem' }}>
                      Claim Link & Export
                    </button>
                  </SignUpButton>
                  
                  <button 
                    className="btn btn-secondary" 
                    style={{ width: '100%', padding: '1rem', fontWeight: 700, fontSize: '1rem', cursor: 'pointer', display: 'flex', justifyContent: 'center', gap: '0.5rem' }}
                    onClick={() => {
                      setShowGuestExportPrompt(false);
                      handlePrint();
                    }}
                  >
                    Just Export (Guest Session)
                  </button>
                </div>
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}

export default function BuilderPage() {
  return (
    <BuilderErrorBoundary>
      <React.Suspense fallback={
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: 'var(--bg-color)', gap: '1rem', flexDirection: 'column' }}>
          <Loader2 className="animate-spin" size={48} color="var(--primary)" />
          <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', fontWeight: 500 }}>Loading Builder...</span>
        </div>
      }>
        <BuilderPageContent />
      </React.Suspense>
    </BuilderErrorBoundary>
  );
}
