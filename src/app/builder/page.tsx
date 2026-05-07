"use client";

import React, { useState, useRef } from 'react';
import { defaultResume } from '@/lib/default-resume';
import { TemplateModern } from '@/components/TemplateModern';
import { TemplateClassic } from '@/components/TemplateClassic';
import { TemplateMinimal } from '@/components/TemplateMinimal';
import { useReactToPrint } from 'react-to-print';
import { Download, Sparkles, LayoutTemplate, Lock, RefreshCw, LogOut, Plus, Minus, Trash2, Upload } from 'lucide-react';
import { useAutoAnimate } from '@formkit/auto-animate/react';
import Link from 'next/link';
import { ImageCropper } from '@/components/ImageCropper';
import { AtsMetadata } from '@/components/AtsMetadata';
import { TemplateModernSplit } from '@/components/TemplateModernSplit';

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
  const [data, setData] = useState(defaultResume);
  const [template, setTemplate] = useState<'modern' | 'classic' | 'minimal' | 'modern-split'>('modern-split');
  const [isAILoading, setIsAILoading] = useState(false);
  const [showSectionMenu, setShowSectionMenu] = useState(false);
  
  // Track which optional sections are actively in the editor
  const [hasProjectsSection, setHasProjectsSection] = useState(false);
  const [hasReferencesSection, setHasReferencesSection] = useState(false);
  const [hasCertificationsSection, setHasCertificationsSection] = useState(false);
  const [showOverrides, setShowOverrides] = useState(false);
  const [includeHeadshot, setIncludeHeadshot] = useState(true);
  const [cropImageSrc, setCropImageSrc] = useState<string | null>(null);
  
  const [sidebarRef] = useAutoAnimate<HTMLDivElement>();
  const [workRef] = useAutoAnimate<HTMLDivElement>();
  const [skillsRef] = useAutoAnimate<HTMLDivElement>();
  const [projectsRef] = useAutoAnimate<HTMLDivElement>();
  const [referencesRef] = useAutoAnimate<HTMLDivElement>();
  const [certificationsRef] = useAutoAnimate<HTMLDivElement>();
  const [menuWrapperRef] = useAutoAnimate<HTMLDivElement>();
  
  const user = null; // Mock auth for demo
  
  const contentRef = useRef<HTMLDivElement>(null);
  const handlePrint = useReactToPrint({
    contentRef
  });

  const [aiLoading, setAiLoading] = useState<Record<string, boolean>>({});

  const handleJobAI = (jobId: string, type: 'summary' | 'bullets') => {
    setAiLoading(prev => ({ ...prev, [`${jobId}-${type}`]: true }));
    setTimeout(() => {
      setData(prev => ({
        ...prev,
        work: prev.work.map(job => {
          if (job.id === jobId) {
            if (type === 'summary') {
              return { ...job, summary: `Spearheaded operations at ${job.name || 'the company'}, driving significant cross-functional growth and improving key metrics by optimizing core workflows. Managed complex deliverables and consistently exceeded quarterly performance targets.` };
            }
            if (type === 'bullets') {
              return { ...job, highlights: [
                `Optimized core processes resulting in a 25% increase in operational efficiency.`,
                `Led a cross-functional team of 5+ members to deliver key ${job.position || 'departmental'} projects 2 weeks ahead of schedule.`,
                `Implemented robust tracking systems that improved overall data accuracy by 40%.`
              ]};
            }
          }
          return job;
        })
      }));
      setAiLoading(prev => ({ ...prev, [`${jobId}-${type}`]: false }));
      alert(`AI ${type === 'summary' ? 'Summary' : 'Bullet Points'} Generated! (Premium Feature Demo)`);
    }, 1500);
  };

  const handleRewrite = () => {
    setIsAILoading(true);
    setTimeout(() => {
      setData(prev => ({
        ...prev,
        basics: {
          ...prev.basics,
          summary: "Highly motivated and results-driven " + prev.basics.label + " with a proven track record of delivering scalable solutions. Adept at cross-functional collaboration and leading high-performing teams to exceed strategic objectives. Passionate about leveraging cutting-edge technologies to drive business growth."
        }
      }));
      setIsAILoading(false);
      alert("AI Rewrite Complete! (Premium Feature Demo)");
    }, 1500);
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
  const handleJobChange = (id: string, field: string, value: string) => {
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

  return (
    <div className="builder-layout" style={{ display: 'flex', height: '100%', flex: 1, overflow: 'hidden' }}>
      {/* Sidebar Editor */}
      <aside className="builder-sidebar" style={{ width: '400px', background: 'var(--surface-color)', borderRight: '1px solid var(--glass-border)', display: 'flex', flexDirection: 'column', height: '100%' }}>
        <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--glass-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h1 style={{ fontSize: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Link href="/" style={{ color: 'var(--primary)', fontWeight: 'bold' }}>CareerReport</Link> Builder
          </h1>
          {user ? (
             <button className="btn-icon" title="Log Out"><LogOut size={18} /></button>
          ) : null}
        </div>

        <div ref={sidebarRef} className="sidebar-scroll" style={{ padding: '1.5rem', flex: 1 }}>
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
              <div style={{ marginTop: '1rem', padding: '1rem', background: 'var(--surface-highlight)', borderRadius: '8px', border: '1px solid var(--glass-border)' }}>
                {(template === 'modern' || template === 'modern-split') && (
                  <>
                    <div className="form-group" style={{ marginBottom: '1rem' }}>
                      <label className="label" style={{ fontSize: '0.8rem' }}>Font Style</label>
                      <select className="input-field" value={data.metadata?.fontFamily || 'sans-serif'} onChange={(e) => setData(prev => ({ ...prev, metadata: { ...prev.metadata, fontFamily: e.target.value } }))} style={{ padding: '0.5rem' }}>
                        <option value="sans-serif">Modern Sans</option>
                        <option value="serif">Classic Serif</option>
                        <option value="monospace">Technical Mono</option>
                      </select>
                    </div>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="label" style={{ fontSize: '0.8rem' }}>Primary Accent Color</label>
                      <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                        <input type="color" value={data.metadata?.themeColor || '#3b82f6'} onChange={(e) => setData(prev => ({ ...prev, metadata: { ...prev.metadata, themeColor: e.target.value } }))} style={{ width: '32px', height: '32px', padding: '0', border: 'none', borderRadius: '4px', cursor: 'pointer', background: 'transparent' }} />
                      </div>
                    </div>
                  </>
                )}
                {template === 'classic' && (
                  <>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="label" style={{ fontSize: '0.8rem' }}>Font Style</label>
                      <select className="input-field" value={data.metadata?.fontFamily || 'serif'} onChange={(e) => setData(prev => ({ ...prev, metadata: { ...prev.metadata, fontFamily: e.target.value } }))} style={{ padding: '0.5rem' }}>
                        <option value="serif">Classic Serif (Default)</option>
                        <option value="sans-serif">Clean Sans</option>
                      </select>
                    </div>
                  </>
                )}
                {template === 'minimal' && (
                  <>
                    <div className="form-group" style={{ marginBottom: '1rem' }}>
                      <label className="label" style={{ fontSize: '0.8rem' }}>Font Style</label>
                      <select className="input-field" value={data.metadata?.fontFamily || 'sans-serif'} onChange={(e) => setData(prev => ({ ...prev, metadata: { ...prev.metadata, fontFamily: e.target.value } }))} style={{ padding: '0.5rem' }}>
                        <option value="sans-serif">Minimalist Sans (Default)</option>
                        <option value="serif">Editorial Serif</option>
                        <option value="monospace">Developer Mono</option>
                      </select>
                    </div>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="label" style={{ fontSize: '0.8rem' }}>Sidebar Background</label>
                      <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                        <input type="color" value={data.metadata?.minimalSidebarColor || '#fafafa'} onChange={(e) => setData(prev => ({ ...prev, metadata: { ...prev.metadata, minimalSidebarColor: e.target.value } }))} style={{ width: '32px', height: '32px', padding: '0', border: 'none', borderRadius: '4px', cursor: 'pointer', background: 'transparent' }} />
                      </div>
                    </div>
                  </>
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
                    Skills
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
            <button className="btn btn-secondary" style={{ width: '100%', fontSize: '0.875rem' }}>Upgrade to Premium ($10)</button>
          </div>
        </div>
      </aside>

      {/* Main Preview Area */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', background: 'var(--bg-color)' }}>
        <header style={{ padding: '1rem 2rem', borderBottom: '1px solid var(--glass-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--glass-bg)' }}>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <LayoutTemplate size={18} color="var(--text-secondary)" />
            <select 
              value={template} 
              onChange={(e) => setTemplate(e.target.value as any)}
              className="input-field"
              style={{ width: 'auto', padding: '0.5rem', background: 'var(--surface-color)', border: '1px solid var(--glass-border)', color: 'var(--text-primary)', cursor: 'pointer', fontWeight: 600 }}
            >
              <option value="modern" style={{ color: '#fff', background: '#1e293b' }}>Modern Template</option>
              <option value="modern-split" style={{ color: '#fff', background: '#1e293b' }}>Modern Split</option>
              <option value="minimal" style={{ color: '#fff', background: '#1e293b' }}>Minimal Template</option>
              <option value="classic" style={{ color: '#fff', background: '#1e293b' }}>Classic Template</option>
            </select>
          </div>

          <button onClick={() => handlePrint()} className="btn btn-primary">
            <Download size={18} /> Export PDF
          </button>
        </header>

        <div style={{ flex: 1, overflowY: 'auto', padding: '2rem', display: 'flex', justifyContent: 'center' }}>
          <div style={{ width: '100%', maxWidth: '850px' }}>
            <div ref={contentRef} className="resume-preview" style={{ position: 'relative' }}>
              <AtsMetadata data={data} />
              {template === 'modern' && <TemplateModern data={{ ...data, basics: { ...data.basics, image: includeHeadshot ? data.basics.image : '' } }} />}
              {template === 'modern-split' && <TemplateModernSplit data={{ ...data, basics: { ...data.basics, image: includeHeadshot ? data.basics.image : '' } }} />}
              {template === 'classic' && <TemplateClassic data={{ ...data, basics: { ...data.basics, image: includeHeadshot ? data.basics.image : '' } }} />}
              {template === 'minimal' && <TemplateMinimal data={{ ...data, basics: { ...data.basics, image: includeHeadshot ? data.basics.image : '' } }} />}
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
    </div>
  );
}
