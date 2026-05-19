"use client";

import React, { useEffect, useState, use } from 'react';
import { supabase } from '@/lib/supabase';
import { Building2, Globe, MapPin, Users, Calendar, Briefcase, Mail, FileText, X, ChevronRight, BadgeCheck, Loader2, Edit, Check, UserMinus, Plus } from 'lucide-react';
import Link from 'next/link';
import { useUser } from '@clerk/nextjs';

function parseEmployeeStatus(status: string | null) {
  if (!status) return { approved: false, permissions: [] as string[], title: '' };
  
  const parts = status.split('|');
  const mainPart = parts[0];
  let title = '';
  
  for (let i = 1; i < parts.length; i++) {
    if (parts[i].startsWith('title=')) {
      title = decodeURIComponent(parts[i].substring(6));
    }
  }
  
  const isOwner = mainPart === 'owner';
  const approved = mainPart.startsWith('approved') || isOwner;
  let permissions: string[] = [];
  if (mainPart.includes(':')) {
    permissions = mainPart.split(':')[1].split(',');
  }
  
  return { approved, permissions, title, isOwner };
}

function encodeEmployeeStatus(baseStatus: 'approved' | 'owner', permissions: string[], title: string) {
  let main = baseStatus === 'owner' ? 'owner' : 'approved';
  if (permissions.length > 0 && baseStatus !== 'owner') {
    main = `approved:${permissions.join(',')}`;
  }
  if (title) {
    main = `${main}|title=${encodeURIComponent(title)}`;
  }
  return main;
}

export default function CompanyProfilePage({ params }: { params: Promise<{ slug: string }> }) {
  const resolvedParams = use(params);
  const slug = resolvedParams.slug;

  const { user, isSignedIn, isLoaded: isClerkLoaded } = useUser();
  const [company, setCompany] = useState<any>(null);
  const [jobs, setJobs] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [allEmployeeRecords, setAllEmployeeRecords] = useState<any[]>([]);
  const [pendingRequests, setPendingRequests] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRequesting, setIsRequesting] = useState(false);
  const [hasRequested, setHasRequested] = useState(false);
  const [currentUserEmployee, setCurrentUserEmployee] = useState<any>(null);

  // Employer Dashboard State
  const [activeTab, setActiveTab] = useState<'jobs' | 'applications' | 'team'>('jobs');
  const [applications, setApplications] = useState<any[]>([]);
  const [loadingApplications, setLoadingApplications] = useState(false);
  
  // Candidate Resume Modal State
  const [selectedApp, setSelectedApp] = useState<any>(null);
  const [candidateResume, setCandidateResume] = useState<any>(null);
  const [loadingResume, setLoadingResume] = useState(false);

  // Edit Company State
  const [isEditingCompany, setIsEditingCompany] = useState(false);
  const [editName, setEditName] = useState('');
  const [editBio, setEditBio] = useState('');
  const [editWebsite, setEditWebsite] = useState('');
  const [editLogoUrl, setEditLogoUrl] = useState('');
  const [savingCompany, setSavingCompany] = useState(false);

  // Team Invite State
  const [inviteUsername, setInviteUsername] = useState('');
  const [isInviting, setIsInviting] = useState(false);

  // Logo upload state
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  useEffect(() => {
    async function loadCompany() {
      if (!slug) return;
      setIsLoading(true);
      try {
        // Fetch company profile with joined owner profile details
        const { data: comp, error: compErr } = await supabase
          .from('business_profiles')
          .select('*, profiles(username, full_name, avatar_url)')
          .eq('slug', slug)
          .single();

        if (compErr) throw compErr;
        setCompany(comp);

        // Fetch active jobs
        const { data: jobList } = await supabase
          .from('jobs')
          .select('*')
          .eq('business_id', comp.id)
          .order('created_at', { ascending: false });
          
        if (jobList) setJobs(jobList);

        // Fetch all employee and request records
        const { data: empList } = await supabase
          .from('company_employees')
          .select('user_id, status, profiles(username, full_name, avatar_url)')
          .eq('business_id', comp.id);

        const ownerEmpRow = empList?.find(e => e.user_id === comp.owner_id);
        const ownerStatus = ownerEmpRow?.status || 'owner';

        const ownerRecord = {
          user_id: comp.owner_id,
          status: ownerStatus,
          profiles: {
            username: comp.profiles?.username || user?.username || 'owner',
            full_name: comp.profiles?.full_name || (user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() : null) || 'Company Owner',
            avatar_url: comp.profiles?.avatar_url || user?.imageUrl || null,
            label: 'Owner'
          }
        };

        if (empList) {
          setAllEmployeeRecords(empList);
          // Split approved team members (excluding the owner to avoid duplicates) and pending requests
          const approvedEmployees = empList.filter(e => e.status && e.status.startsWith('approved') && e.user_id !== comp.owner_id);
          setEmployees([ownerRecord, ...approvedEmployees]);
          setPendingRequests(empList.filter(e => e.status === 'pending'));

          // Check if current user has already requested employee status
          if (isSignedIn && user) {
            const userEmpRecord = empList.find(e => e.user_id === user.id);
            if (userEmpRecord) {
              setHasRequested(true);
              setCurrentUserEmployee(userEmpRecord);
            } else if (comp.owner_id === user.id) {
              setCurrentUserEmployee(ownerRecord);
            }
          }
        } else {
          setEmployees([ownerRecord]);
          if (isSignedIn && user && comp.owner_id === user.id) {
            setCurrentUserEmployee(ownerRecord);
          }
        }

      } catch (err) {
        console.error("Error loading company:", err);
      } finally {
        setIsLoading(false);
      }
    }

    if (isClerkLoaded) {
      loadCompany();
    }
  }, [slug, isSignedIn, user, isClerkLoaded]);

  // Load applications if authorized users view the applications tab
  useEffect(() => {
    if (!company?.id || jobs.length === 0 || activeTab !== 'applications') return;
    setLoadingApplications(true);
    async function loadApplications() {
      try {
        const { data, error } = await supabase
          .from('job_applications')
          .select(`
            id,
            created_at,
            job_id,
            applicant_id,
            profiles:applicant_id (
              username,
              full_name,
              avatar_url,
              label,
              email,
              career_context
            )
          `)
          .in('job_id', jobs.map(j => j.id))
          .order('created_at', { ascending: false });

        if (error) throw error;
        if (data) {
          setApplications(data);
        }
      } catch (err) {
        console.error("Error loading applications:", err);
      } finally {
        setLoadingApplications(false);
      }
    }

    loadApplications();
  }, [company?.id, activeTab, jobs]);

  // Permission Checks
  const isOwner = isSignedIn && user && company && company.owner_id === user.id;
  const hasPostsPermission = isOwner || (currentUserEmployee?.status?.includes('posts'));
  const hasJobsPermission = isOwner || (currentUserEmployee?.status?.includes('jobs'));
  const hasProfilePermission = isOwner || (currentUserEmployee?.status?.includes('profile'));

  const viewCandidateDetails = async (app: any) => {
    setSelectedApp(app);
    setCandidateResume(null);
    setLoadingResume(true);
    try {
      const { data, error } = await supabase
        .from('resumes')
        .select('data')
        .eq('user_id', app.applicant_id)
        .maybeSingle();
      if (data) {
        setCandidateResume(data.data);
      }
    } catch (err) {
      console.error("Error loading candidate resume:", err);
    } finally {
      setLoadingResume(false);
    }
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 5 * 1024 * 1024) {
        alert("Logo image must be less than 5MB");
        return;
      }
      setLogoFile(file);
      setLogoPreview(URL.createObjectURL(file));
    }
  };

  const openEditModal = () => {
    setEditName(company.name || '');
    setEditBio(company.bio || '');
    setEditWebsite(company.website || '');
    setEditLogoUrl(company.logo_url || '');
    setLogoFile(null);
    setLogoPreview(company.logo_url || null);
    setIsEditingCompany(true);
  };

  const handleUpdateCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingCompany(true);
    try {
      let finalLogoUrl = editLogoUrl;

      // Upload logo image to Supabase Storage if a new file is chosen
      if (logoFile) {
        const fileExt = logoFile.name.split('.').pop();
        const randId = Math.random().toString(36).substring(2);
        const fileName = `logo-${company.id}-${randId}.${fileExt}`;
        const filePath = `public/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('post-images')
          .upload(filePath, logoFile);

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage.from('post-images').getPublicUrl(filePath);
        finalLogoUrl = urlData.publicUrl;
      }

      const { data, error } = await supabase
        .from('business_profiles')
        .update({
          name: editName,
          bio: editBio,
          website: editWebsite,
          logo_url: finalLogoUrl
        })
        .eq('id', company.id)
        .select()
        .single();

      if (error) throw error;
      if (data) {
        setCompany(data);
        setIsEditingCompany(false);
        alert("Company profile updated successfully!");
      }
    } catch (err: any) {
      console.error(err);
      alert("Failed to update company: " + (err.message || err));
    } finally {
      setSavingCompany(false);
    }
  };

  // Team Permissions Handlers
  const handleTogglePermission = async (targetUserId: string, permission: 'posts' | 'jobs' | 'profile') => {
    const emp = allEmployeeRecords.find(e => e.user_id === targetUserId);
    if (!emp) return;

    const parsed = parseEmployeeStatus(emp.status);
    let newPerms: string[] = [];
    if (parsed.permissions.includes(permission)) {
      newPerms = parsed.permissions.filter(p => p !== permission);
    } else {
      newPerms = [...parsed.permissions, permission];
    }

    const newStatus = encodeEmployeeStatus('approved', newPerms, parsed.title);

    try {
      const { error } = await supabase
        .from('company_employees')
        .update({ status: newStatus })
        .eq('business_id', company.id)
        .eq('user_id', targetUserId);

      if (error) throw error;

      // Update state locally
      setAllEmployeeRecords(prev => prev.map(e => e.user_id === targetUserId ? { ...e, status: newStatus } : e));
      setEmployees(prev => prev.map(e => e.user_id === targetUserId ? { ...e, status: newStatus } : e));
    } catch (err: any) {
      alert("Failed to update permissions: " + (err.message || err));
    }
  };

  const handleUpdateTitle = async (targetUserId: string, newTitle: string) => {
    const isTargetOwner = targetUserId === company.owner_id;
    const emp = allEmployeeRecords.find(e => e.user_id === targetUserId);
    
    // For owner, synthesize status if not present in records
    const currentStatus = emp?.status || (isTargetOwner ? 'owner' : 'approved');
    const parsed = parseEmployeeStatus(currentStatus);
    
    const baseStatus = isTargetOwner ? 'owner' : 'approved';
    const newStatus = encodeEmployeeStatus(baseStatus, parsed.permissions, newTitle);

    try {
      // 1. Perform an upsert in the database
      const { error } = await supabase
        .from('company_employees')
        .upsert({
          business_id: company.id,
          user_id: targetUserId,
          status: newStatus
        }, { onConflict: 'business_id,user_id' });

      if (error) {
        // Fallback to direct update if upsert fails
        const { error: updateErr } = await supabase
          .from('company_employees')
          .update({ status: newStatus })
          .eq('business_id', company.id)
          .eq('user_id', targetUserId);
          
        if (updateErr) {
          // Fallback to direct insert
          const { error: insertErr } = await supabase
            .from('company_employees')
            .insert({
              business_id: company.id,
              user_id: targetUserId,
              status: newStatus
            });
          if (insertErr) throw insertErr;
        }
      }

      // Update state locally
      setAllEmployeeRecords(prev => {
        const exists = prev.some(e => e.user_id === targetUserId);
        if (exists) {
          return prev.map(e => e.user_id === targetUserId ? { ...e, status: newStatus } : e);
        } else {
          return [...prev, { user_id: targetUserId, status: newStatus }];
        }
      });

      setEmployees(prev => prev.map(e => e.user_id === targetUserId ? { ...e, status: newStatus } : e));
    } catch (err: any) {
      alert("Failed to update title: " + (err.message || err));
    }
  };

  const handleGrantOwnership = async (targetUserId: string, targetName: string) => {
    if (!isOwner) return;
    
    const confirm1 = confirm(`WARNING: Are you sure you want to transfer ownership of ${company.name} to ${targetName}? You will lose owner privileges.`);
    if (!confirm1) return;
    
    const confirm2 = confirm(`FINAL CONFIRMATION: You are about to transfer complete ownership of this business page. This action CANNOT be undone. Proceed?`);
    if (!confirm2) return;

    try {
      // 1. Update the business_profiles table's owner_id
      const { error: profileErr } = await supabase
        .from('business_profiles')
        .update({ owner_id: targetUserId })
        .eq('id', company.id);

      if (profileErr) throw profileErr;

      // 2. Change the old owner's employee record to standard approved employee in company_employees
      // And change the new owner's record to status 'owner'
      const oldOwnerStatus = encodeEmployeeStatus('approved', ['posts', 'jobs', 'profile'], 'Former Owner');
      const { error: oldOwnerErr } = await supabase
        .from('company_employees')
        .upsert({
          business_id: company.id,
          user_id: user!.id,
          status: oldOwnerStatus
        }, { onConflict: 'business_id,user_id' });
      
      if (oldOwnerErr) {
        // Fallback update
        await supabase
          .from('company_employees')
          .update({ status: oldOwnerStatus })
          .eq('business_id', company.id)
          .eq('user_id', user!.id);
      }

      // 3. Update the new owner's status in company_employees to 'owner'
      const { error: newOwnerErr } = await supabase
        .from('company_employees')
        .update({ status: 'owner' })
        .eq('business_id', company.id)
        .eq('user_id', targetUserId);

      if (newOwnerErr) console.warn("Failed to update new owner status row:", newOwnerErr);

      alert(`Ownership of ${company.name} has been successfully transferred to ${targetName}!`);
      window.location.reload();
    } catch (err: any) {
      alert("Failed to transfer ownership: " + (err.message || err));
    }
  };

  const handleApproveRequest = async (targetUserId: string) => {
    try {
      const { error } = await supabase
        .from('company_employees')
        .update({ status: 'approved' })
        .eq('business_id', company.id)
        .eq('user_id', targetUserId);

      if (error) throw error;

      setAllEmployeeRecords(prev => prev.map(e => e.user_id === targetUserId ? { ...e, status: 'approved' } : e));
      const approvedEmp = allEmployeeRecords.find(e => e.user_id === targetUserId);
      if (approvedEmp) {
        setEmployees(prev => [...prev, { ...approvedEmp, status: 'approved' }]);
      }
      setPendingRequests(prev => prev.filter(e => e.user_id !== targetUserId));
    } catch (err: any) {
      alert("Failed to approve request: " + (err.message || err));
    }
  };

  const handleRejectRequest = async (targetUserId: string) => {
    try {
      const { error } = await supabase
        .from('company_employees')
        .delete()
        .eq('business_id', company.id)
        .eq('user_id', targetUserId);

      if (error) throw error;

      setAllEmployeeRecords(prev => prev.filter(e => e.user_id !== targetUserId));
      setPendingRequests(prev => prev.filter(e => e.user_id !== targetUserId));
    } catch (err: any) {
      alert("Failed to reject request: " + (err.message || err));
    }
  };

  const handleRemoveMember = async (targetUserId: string) => {
    if (!confirm("Are you sure you want to remove this member from your business team?")) return;
    try {
      const { error } = await supabase
        .from('company_employees')
        .delete()
        .eq('business_id', company.id)
        .eq('user_id', targetUserId);

      if (error) throw error;

      setAllEmployeeRecords(prev => prev.filter(e => e.user_id !== targetUserId));
      setEmployees(prev => prev.filter(e => e.user_id !== targetUserId));
    } catch (err: any) {
      alert("Failed to remove member: " + (err.message || err));
    }
  };

  const handleInviteMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteUsername.trim()) return;
    setIsInviting(true);
    try {
      // 1. Fetch user from profiles table
      const { data: profile, error: profileErr } = await supabase
        .from('profiles')
        .select('id, username, full_name, avatar_url')
        .eq('username', inviteUsername.trim())
        .maybeSingle();

      if (profileErr) throw profileErr;
      if (!profile) {
        alert(`User with username "@${inviteUsername}" was not found.`);
        setIsInviting(false);
        return;
      }

      // Check if user is already a team member, pending, or the owner themselves
      const exists = allEmployeeRecords.some(e => e.user_id === profile.id) || profile.id === company.owner_id;
      if (exists) {
        alert("This user is already a team member, the owner, or has a pending request.");
        setIsInviting(false);
        return;
      }

      // 2. Insert into company_employees table as immediately approved
      const { error: insertErr } = await supabase
        .from('company_employees')
        .insert({
          business_id: company.id,
          user_id: profile.id,
          status: 'approved'
        });

      if (insertErr) throw insertErr;

      // Add to local state
      const newRecord = {
        user_id: profile.id,
        status: 'approved',
        profiles: profile
      };
      setAllEmployeeRecords(prev => [...prev, newRecord]);
      setEmployees(prev => [...prev, newRecord]);
      setInviteUsername('');
      alert(`Successfully added @${profile.username} to your team!`);
    } catch (err: any) {
      alert("Failed to invite member: " + (err.message || err));
    } finally {
      setIsInviting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex-center" style={{ minHeight: '100dvh', background: 'var(--bg-color)' }}>
        <Loader2 className="animate-spin text-primary" size={48} />
      </div>
    );
  }

  if (!company) {
    return (
      <div className="flex-center" style={{ minHeight: '100dvh', background: 'var(--bg-color)', flexDirection: 'column', gap: '1rem' }}>
        <Building2 size={48} color="var(--text-secondary)" opacity={0.5} />
        <h1 style={{ color: 'var(--text-primary)' }}>Company not found</h1>
        <p style={{ color: 'var(--text-secondary)' }}>This business profile does not exist.</p>
        <Link href="/" className="btn btn-secondary">Return Home</Link>
      </div>
    );
  }

  return (
    <main style={{ minHeight: '100dvh', background: 'var(--bg-color)' }}>
      {/* Hero Header */}
      <div style={{ background: 'var(--surface-color)', borderBottom: '1px solid var(--glass-border)', padding: '4rem 0' }}>
        <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '0 1.5rem', display: 'flex', gap: '2rem', alignItems: 'flex-start', flexWrap: 'wrap' }}>
          <div style={{ width: '120px', height: '120px', borderRadius: '16px', background: 'var(--surface-highlight)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0, border: '1px solid var(--glass-border)' }}>
            {company.logo_url ? (
              <img src={company.logo_url} alt={`${company.name} logo`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <Building2 size={48} color="var(--primary)" />
            )}
          </div>
          
          <div style={{ flex: 1, minWidth: '280px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem', flexWrap: 'wrap' }}>
              <h1 style={{ margin: 0, fontSize: '2.5rem', color: 'var(--text-primary)', fontWeight: 800 }}>{company.name}</h1>
              <span title="Verified Business Account" style={{ display: 'flex' }}><BadgeCheck size={26} color="var(--primary)" /></span>
              
              {hasProfilePermission && (
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  {isOwner ? (
                    <span style={{ background: 'rgba(250, 189, 47, 0.15)', color: 'var(--primary)', padding: '4px 10px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 600 }}>Owner View</span>
                  ) : (
                    <span style={{ background: 'rgba(16, 185, 129, 0.15)', color: 'var(--success)', padding: '4px 10px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 600 }}>Team Member (Authorized)</span>
                  )}
                  <button 
                    onClick={openEditModal}
                    className="btn btn-secondary"
                    style={{ padding: '0.35rem 0.75rem', fontSize: '0.75rem', borderRadius: '100px', display: 'inline-flex', alignItems: 'center', gap: '0.25rem', cursor: 'pointer' }}
                  >
                    <Edit size={12} /> Edit Profile
                  </button>
                </div>
              )}
            </div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem', margin: '0 0 1.5rem 0', maxWidth: '600px', lineHeight: 1.6 }}>{company.bio}</p>
            
            <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
              {company.website && (
                <a href={company.website} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--primary)', fontSize: '0.9rem', fontWeight: 500, textDecoration: 'none' }}>
                  <Globe size={16} /> {company.website.replace(/^https?:\/\//, '')}
                </a>
              )}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                <Users size={16} /> {employees.length} Employees
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                <Calendar size={16} /> Joined {new Date(company.created_at).getFullYear()}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Panel */}
      <div style={{ maxWidth: '1000px', margin: '3rem auto', padding: '0 1.5rem' }}>
        
        {/* Tab Selection */}
        {(isOwner || hasJobsPermission) && (
          <div style={{ display: 'flex', gap: '0.5rem', borderBottom: '1px solid var(--glass-border)', marginBottom: '2.5rem', paddingBottom: '0.25rem' }}>
            <button 
              onClick={() => setActiveTab('jobs')}
              className={`btn-tab ${activeTab === 'jobs' ? 'active' : ''}`}
              style={{
                background: 'transparent',
                border: 'none',
                color: activeTab === 'jobs' ? 'var(--primary)' : 'var(--text-secondary)',
                fontSize: '1.05rem',
                fontWeight: 600,
                padding: '0.75rem 1.5rem',
                cursor: 'pointer',
                borderBottom: activeTab === 'jobs' ? '2px solid var(--primary)' : 'none',
                transition: 'all 0.2s ease'
              }}
            >
              Open Positions ({jobs.length})
            </button>
            <button 
              onClick={() => setActiveTab('applications')}
              className={`btn-tab ${activeTab === 'applications' ? 'active' : ''}`}
              style={{
                background: 'transparent',
                border: 'none',
                color: activeTab === 'applications' ? 'var(--primary)' : 'var(--text-secondary)',
                fontSize: '1.05rem',
                fontWeight: 600,
                padding: '0.75rem 1.5rem',
                cursor: 'pointer',
                borderBottom: activeTab === 'applications' ? '2px solid var(--primary)' : 'none',
                transition: 'all 0.2s ease'
              }}
            >
              Candidate Applications ({applications.length})
            </button>
            {hasProfilePermission && (
              <button 
                onClick={() => setActiveTab('team')}
                className={`btn-tab ${activeTab === 'team' ? 'active' : ''}`}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: activeTab === 'team' ? 'var(--primary)' : 'var(--text-secondary)',
                  fontSize: '1.05rem',
                  fontWeight: 600,
                  padding: '0.75rem 1.5rem',
                  cursor: 'pointer',
                  borderBottom: activeTab === 'team' ? '2px solid var(--primary)' : 'none',
                  transition: 'all 0.2s ease'
                }}
              >
                Team Management
              </button>
            )}
          </div>
        )}

        {/* Tab 1: Positions Grid */}
        {activeTab === 'jobs' && (
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '3rem', alignItems: 'flex-start' }}>
            {/* Jobs Board Section */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h2 style={{ color: 'var(--text-primary)', fontSize: '1.5rem', margin: 0, display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <Briefcase size={24} color="var(--primary)" /> Jobs Board
                </h2>
                {hasJobsPermission && (
                  <Link href="/jobs/new" className="btn btn-primary" style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}>
                    Post New Job
                  </Link>
                )}
              </div>
              
              {jobs.length === 0 ? (
                <div style={{ background: 'var(--surface-color)', border: '1px dashed var(--glass-border)', padding: '4rem 2rem', borderRadius: '16px', textAlign: 'center' }}>
                  <p style={{ color: 'var(--text-secondary)', margin: 0 }}>There are no open positions at {company.name} right now.</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {jobs.map(job => (
                    <Link key={job.id} href={`/jobs/${job.id}`} style={{ textDecoration: 'none' }}>
                      <div className="job-card-hover" style={{ background: 'var(--surface-color)', border: '1px solid var(--glass-border)', padding: '1.5rem', borderRadius: '12px', transition: 'all 0.2s ease', cursor: 'pointer' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                          <h3 style={{ margin: 0, color: 'var(--text-primary)', fontSize: '1.25rem', fontWeight: 600 }}>{job.title}</h3>
                          {job.salary_min && job.salary_max && (
                            <span style={{ color: 'var(--success)', fontWeight: 600, fontSize: '0.9rem', background: 'rgba(16, 185, 129, 0.1)', padding: '0.25rem 0.75rem', borderRadius: '100px' }}>
                              ${(job.salary_min/1000).toFixed(0)}k - ${(job.salary_max/1000).toFixed(0)}k
                            </span>
                          )}
                        </div>
                        
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', margin: '0 0 1.5rem 0', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                          {job.description}
                        </p>
                        
                        <div style={{ display: 'flex', gap: '1.25rem', flexWrap: 'wrap' }}>
                          {job.location && (
                            <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                              <MapPin size={14} /> {job.location}
                            </span>
                          )}
                          {job.is_remote && (
                            <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: 'var(--primary)', fontSize: '0.85rem' }}>
                              <Globe size={14} /> Remote
                            </span>
                          )}
                          <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                            <Calendar size={14} /> Posted {new Date(job.created_at).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {/* Employees Section */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h2 style={{ color: 'var(--text-primary)', fontSize: '1.25rem', margin: 0, display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <Users size={20} color="var(--primary)" /> Team
                </h2>
                {!isOwner && !hasRequested && (
                  <button 
                    onClick={async () => {
                      if (hasRequested) return;
                      setIsRequesting(true);
                      if (!isSignedIn) {
                        alert("Please sign in to claim your employee profile.");
                        setIsRequesting(false);
                        return;
                      }
                      const { error } = await supabase.from('company_employees').insert({
                        business_id: company.id,
                        user_id: user!.id,
                        status: 'pending'
                      });
                      if (!error) {
                        setHasRequested(true);
                        alert("Join request successfully sent! The company owner will review it.");
                      }
                      setIsRequesting(false);
                    }}
                    disabled={isRequesting || hasRequested}
                    className={`btn ${hasRequested ? 'btn-secondary' : 'btn-primary'}`}
                    style={{ padding: '0.4rem 0.75rem', fontSize: '0.8rem' }}
                  >
                    {hasRequested ? 'Request Pending' : 'I work here'}
                  </button>
                )}
                {hasRequested && !currentUserEmployee?.status?.startsWith('approved') && (
                  <span style={{ fontSize: '0.8rem', background: 'rgba(250, 189, 47, 0.12)', color: 'var(--primary)', padding: '4px 10px', borderRadius: '100px', fontWeight: 600 }}>Request Pending</span>
                )}
              </div>
              
              {employees.length === 0 ? (
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', fontStyle: 'italic' }}>No public employees listed yet.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {employees.map(emp => {
                    const profile = emp.profiles || {};
                    const name = profile.full_name || profile.username || 'Team Member';
                    return (
                      <Link key={emp.user_id} href={`/u/${profile.username}`} style={{ textDecoration: 'none' }}>
                        <div className="hover-bg" style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem', background: 'var(--surface-color)', border: '1px solid var(--glass-border)', borderRadius: '12px' }}>
                          <img 
                            src={profile.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${profile.username}`} 
                            alt={name}
                            style={{ width: '40px', height: '40px', borderRadius: '50%', border: '1px solid var(--glass-border)' }}
                          />
                          <div>
                            {(() => {
                              const parsed = parseEmployeeStatus(emp.status);
                              const isOwnerRole = emp.status && emp.status.startsWith('owner');
                              const displayTitle = parsed.title || (isOwnerRole ? 'Owner' : 'Team Member');
                              return (
                                <h4 style={{ margin: 0, color: 'var(--text-primary)', fontSize: '0.95rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                  {name}
                                  <span style={{ 
                                    fontSize: '0.7rem', 
                                    background: isOwnerRole ? 'rgba(250, 189, 47, 0.15)' : 'rgba(255, 255, 255, 0.06)', 
                                    color: isOwnerRole ? 'var(--primary)' : 'var(--text-secondary)', 
                                    padding: '2px 8px', 
                                    borderRadius: '4px', 
                                    fontWeight: 600 
                                  }}>
                                    {displayTitle}
                                  </span>
                                </h4>
                              );
                            })()}
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab 2: Applications Panel */}
        {activeTab === 'applications' && hasJobsPermission && (
          <div>
            <h2 style={{ color: 'var(--text-primary)', fontSize: '1.5rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <Users size={24} color="var(--primary)" /> Candidate Applications
            </h2>

            {loadingApplications ? (
              <div className="flex-center" style={{ padding: '4rem 0' }}>
                <p style={{ color: 'var(--text-secondary)' }}>Loading candidates...</p>
              </div>
            ) : applications.length === 0 ? (
              <div style={{ background: 'var(--surface-color)', border: '1px dashed var(--glass-border)', padding: '5rem 2rem', borderRadius: '16px', textAlign: 'center' }}>
                <Users size={48} color="var(--text-secondary)" opacity={0.3} style={{ marginBottom: '1rem' }} />
                <h3 style={{ color: 'var(--text-primary)', margin: '0 0 0.5rem 0' }}>No Applications Yet</h3>
                <p style={{ color: 'var(--text-secondary)', margin: 0, maxWidth: '400px', marginInline: 'auto', fontSize: '0.95rem' }}>
                  When candidates submit their profiles for your open positions, they will appear here.
                </p>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
                {applications.map(app => {
                  const profile = app.profiles || {};
                  const name = profile.full_name || profile.username || 'Candidate';
                  const jobName = jobs.find(j => j.id === app.job_id)?.title || 'Position';
                  
                  return (
                    <div 
                      key={app.id} 
                      onClick={() => viewCandidateDetails(app)}
                      className="job-card-hover" 
                      style={{ 
                        background: 'var(--surface-color)', 
                        border: '1px solid var(--glass-border)', 
                        padding: '1.5rem', 
                        borderRadius: '16px', 
                        cursor: 'pointer',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      <div>
                        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginBottom: '1.25rem' }}>
                          <img 
                            src={profile.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${profile.username}`} 
                            alt={name}
                            style={{ width: '48px', height: '48px', borderRadius: '50%', border: '1px solid var(--glass-border)', objectFit: 'cover' }}
                          />
                          <div>
                            <h4 style={{ margin: 0, color: 'var(--text-primary)', fontSize: '1.05rem', fontWeight: 700 }}>{name}</h4>
                            <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.8rem' }}>@{profile.username}</p>
                          </div>
                        </div>

                        <div style={{ background: 'var(--surface-highlight)', padding: '0.75rem 1rem', borderRadius: '8px', marginBottom: '1rem' }}>
                          <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-secondary)', fontWeight: 600, display: 'block', marginBottom: '2px' }}>Applying For</span>
                          <span style={{ fontSize: '0.9rem', color: 'var(--text-primary)', fontWeight: 600 }}>{jobName}</span>
                        </div>

                        {profile.label && (
                          <p style={{ fontSize: '0.85rem', color: 'var(--text-primary)', fontWeight: 500, margin: '0 0 0.5rem 0' }}>
                            {profile.label}
                          </p>
                        )}

                        {profile.career_context && (
                          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: '0 0 1rem 0', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden', lineHeight: 1.5 }}>
                            {profile.career_context}
                          </p>
                        )}
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--glass-border)', paddingTop: '1rem', marginTop: '1rem' }}>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                          Applied {new Date(app.created_at).toLocaleDateString()}
                        </span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.85rem', color: 'var(--primary)', fontWeight: 600 }}>
                          Review Profile <ChevronRight size={14} />
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Tab 3: Team Management & Granular Permissions */}
        {activeTab === 'team' && hasProfilePermission && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
            
            {/* Invite team members directly */}
            <div style={{ background: 'var(--surface-color)', border: '1px solid var(--glass-border)', padding: '2rem', borderRadius: '16px' }}>
              <h3 style={{ margin: '0 0 0.5rem 0', color: 'var(--text-primary)', fontSize: '1.25rem', fontWeight: 700 }}>Add Team Member</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', margin: '0 0 1.5rem 0' }}>Search and add registered professionals directly by their unique username.</p>
              
              <form onSubmit={handleInviteMember} style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
                <div style={{ position: 'relative', flex: 1, minWidth: '240px' }}>
                  <span style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)', fontWeight: 600 }}>@</span>
                  <input 
                    type="text"
                    required
                    placeholder="johndoe"
                    className="input-field"
                    value={inviteUsername}
                    onChange={e => setInviteUsername(e.target.value)}
                    style={{ paddingLeft: '2.2rem', marginBottom: 0 }}
                  />
                </div>
                <button type="submit" disabled={isInviting} className="btn btn-primary" style={{ padding: '0.75rem 1.5rem', display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
                  {isInviting ? <Loader2 size={16} className="animate-spin" /> : <><Plus size={16} /> Add to Team</>}
                </button>
              </form>
            </div>

            {/* Pending join requests review */}
            {pendingRequests.length > 0 && (
              <div style={{ background: 'rgba(250, 189, 47, 0.03)', border: '1px solid rgba(250, 189, 47, 0.2)', padding: '2rem', borderRadius: '16px' }}>
                <h3 style={{ margin: '0 0 0.5rem 0', color: 'var(--text-primary)', fontSize: '1.25rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ width: '8px', height: '8px', background: 'var(--primary)', borderRadius: '50%', display: 'inline-block' }}></span>
                  Join Requests ({pendingRequests.length})
                </h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', margin: '0 0 1.5rem 0' }}>Review professionals requesting to be listed on your business team.</p>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {pendingRequests.map(req => {
                    const profile = req.profiles || {};
                    const name = profile.full_name || profile.username || 'Applicant';
                    return (
                      <div key={req.user_id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--surface-color)', border: '1px solid var(--glass-border)', padding: '1.25rem 1.5rem', borderRadius: '12px', flexWrap: 'wrap', gap: '1rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                          <img 
                            src={profile.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${profile.username}`} 
                            alt={name}
                            style={{ width: '40px', height: '40px', borderRadius: '50%', border: '1px solid var(--glass-border)', objectFit: 'cover' }}
                          />
                          <div>
                            <h4 style={{ margin: 0, color: 'var(--text-primary)', fontSize: '0.95rem', fontWeight: 700 }}>{name}</h4>
                            <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.8rem' }}>@{profile.username} • {profile.label || 'Professional'}</p>
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: '0.75rem' }}>
                          <button onClick={() => handleApproveRequest(req.user_id)} className="btn btn-primary" style={{ padding: '0.45rem 1rem', fontSize: '0.85rem', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                            <Check size={14} /> Approve
                          </button>
                          <button onClick={() => handleRejectRequest(req.user_id)} className="btn btn-secondary" style={{ padding: '0.45rem 1rem', fontSize: '0.85rem', color: 'var(--danger)', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                            <X size={14} /> Reject
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Current team members permissions grid */}
            <div style={{ background: 'var(--surface-color)', border: '1px solid var(--glass-border)', padding: '2rem', borderRadius: '16px' }}>
              <h3 style={{ margin: '0 0 0.5rem 0', color: 'var(--text-primary)', fontSize: '1.25rem', fontWeight: 700 }}>Team Members & Permissions</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', margin: '0 0 2rem 0' }}>Assign granular permissions to team members. Unchecked capacities grant standard "Team Member Only" listing.</p>
              
              {employees.length === 0 ? (
                <p style={{ color: 'var(--text-secondary)', fontStyle: 'italic', margin: 0 }}>No approved team members yet.</p>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid var(--glass-border)', paddingBottom: '0.75rem' }}>
                        <th style={{ padding: '0.75rem 1rem', color: 'var(--text-secondary)', fontWeight: 600, fontSize: '0.85rem', textTransform: 'uppercase' }}>Member</th>
                        <th style={{ padding: '0.75rem 1rem', color: 'var(--text-secondary)', fontWeight: 600, fontSize: '0.85rem', textTransform: 'uppercase' }}>Title</th>
                        <th style={{ padding: '0.75rem 1rem', color: 'var(--text-secondary)', fontWeight: 600, fontSize: '0.85rem', textTransform: 'uppercase', textAlign: 'center' }}>Make Posts</th>
                        <th style={{ padding: '0.75rem 1rem', color: 'var(--text-secondary)', fontWeight: 600, fontSize: '0.85rem', textTransform: 'uppercase', textAlign: 'center' }}>Manage Jobs</th>
                        <th style={{ padding: '0.75rem 1rem', color: 'var(--text-secondary)', fontWeight: 600, fontSize: '0.85rem', textTransform: 'uppercase', textAlign: 'center' }}>Update Profile</th>
                        <th style={{ padding: '0.75rem 1rem', color: 'var(--text-secondary)', fontWeight: 600, fontSize: '0.85rem', textTransform: 'uppercase', textAlign: 'right' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {employees.map(emp => {
                        const profile = emp.profiles || {};
                        const name = profile.full_name || profile.username || 'Team Member';
                        const status = emp.status || 'approved';
                        
                        const isOwnerRole = status && status.startsWith('owner');
                        const parsed = parseEmployeeStatus(status);
                        const isTitleEditable = (!isOwnerRole && hasProfilePermission) || (isOwnerRole && isOwner);
                        const displayTitle = parsed.title || (isOwnerRole ? 'Owner' : 'Team Member');

                        const canPosts = parsed.permissions.includes('posts');
                        const canJobs = parsed.permissions.includes('jobs');
                        const canProfile = parsed.permissions.includes('profile');

                        return (
                          <tr key={emp.user_id} style={{ borderBottom: '1px solid var(--glass-border)', transition: 'background 0.2s' }}>
                            <td style={{ padding: '1.25rem 1rem' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                <img 
                                  src={profile.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${profile.username}`} 
                                  alt={name}
                                  style={{ width: '36px', height: '36px', borderRadius: '50%', border: '1px solid var(--glass-border)', objectFit: 'cover' }}
                                />
                                <div>
                                  <h4 style={{ margin: 0, color: 'var(--text-primary)', fontSize: '0.9rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                                    {name}
                                    {isOwnerRole && <span style={{ fontSize: '0.7rem', background: 'rgba(250, 189, 47, 0.15)', color: 'var(--primary)', padding: '2px 6px', borderRadius: '4px', fontWeight: 700 }}>Owner</span>}
                                  </h4>
                                  <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.75rem' }}>@{profile.username}</p>
                                </div>
                              </div>
                            </td>
                            
                            <td style={{ padding: '1.25rem 1rem' }}>
                              {isTitleEditable ? (
                                <input 
                                  type="text"
                                  defaultValue={parsed.title}
                                  placeholder={isOwnerRole ? 'Owner' : 'Team Member'}
                                  onBlur={async (e) => {
                                    const val = e.target.value.trim();
                                    if (val !== parsed.title) {
                                      await handleUpdateTitle(emp.user_id, val);
                                    }
                                  }}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                      e.currentTarget.blur();
                                    }
                                  }}
                                  style={{ 
                                    background: 'rgba(255, 255, 255, 0.03)', 
                                    border: '1px solid var(--glass-border)', 
                                    color: 'var(--text-primary)', 
                                    padding: '0.35rem 0.65rem', 
                                    borderRadius: '6px', 
                                    fontSize: '0.85rem',
                                    width: '140px'
                                  }}
                                />
                              ) : (
                                <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>{displayTitle}</span>
                              )}
                            </td>
                            
                            <td style={{ padding: '1.25rem 1rem', textAlign: 'center' }}>
                              <input 
                                type="checkbox"
                                checked={isOwnerRole ? true : canPosts}
                                disabled={isOwnerRole}
                                onChange={() => handleTogglePermission(emp.user_id, 'posts')}
                                style={{ width: '18px', height: '18px', cursor: isOwnerRole ? 'default' : 'pointer', accentColor: 'var(--primary)' }}
                              />
                            </td>
                            
                            <td style={{ padding: '1.25rem 1rem', textAlign: 'center' }}>
                              <input 
                                type="checkbox"
                                checked={isOwnerRole ? true : canJobs}
                                disabled={isOwnerRole}
                                onChange={() => handleTogglePermission(emp.user_id, 'jobs')}
                                style={{ width: '18px', height: '18px', cursor: isOwnerRole ? 'default' : 'pointer', accentColor: 'var(--primary)' }}
                              />
                            </td>
                            
                            <td style={{ padding: '1.25rem 1rem', textAlign: 'center' }}>
                              <input 
                                type="checkbox"
                                checked={isOwnerRole ? true : canProfile}
                                disabled={isOwnerRole}
                                onChange={() => handleTogglePermission(emp.user_id, 'profile')}
                                style={{ width: '18px', height: '18px', cursor: isOwnerRole ? 'default' : 'pointer', accentColor: 'var(--primary)' }}
                              />
                            </td>
                            
                            <td style={{ padding: '1.25rem 1rem', textAlign: 'right' }}>
                              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'flex-end' }}>
                                {isOwner && !isOwnerRole && (
                                  <button 
                                    onClick={() => handleGrantOwnership(emp.user_id, name)}
                                    className="btn btn-secondary" 
                                    style={{ padding: '0.35rem 0.75rem', fontSize: '0.75rem', color: 'var(--primary)', border: '1px solid rgba(250, 189, 47, 0.25)', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}
                                  >
                                    <BadgeCheck size={12} /> Make Owner
                                  </button>
                                )}
                                
                                {isOwnerRole ? (
                                  <span style={{ fontSize: '0.75rem', background: 'rgba(250, 189, 47, 0.15)', color: 'var(--primary)', padding: '4px 10px', borderRadius: '100px', fontWeight: 700 }}>Owner</span>
                                ) : (
                                  <button 
                                    onClick={() => handleRemoveMember(emp.user_id)}
                                    className="btn btn-secondary" 
                                    style={{ padding: '0.35rem 0.75rem', fontSize: '0.75rem', color: 'var(--danger)', border: '1px solid rgba(255, 68, 68, 0.15)', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}
                                  >
                                    <UserMinus size={12} /> Remove
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

          </div>
        )}

      </div>

      {/* Edit Company Profile Modal */}
      {isEditingCompany && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.85)',
          backdropFilter: 'blur(8px)',
          zIndex: 9999,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          padding: '1.5rem'
        }} onClick={() => setIsEditingCompany(false)}>
          <div style={{
            background: 'var(--surface-color)',
            border: '1px solid var(--glass-border)',
            borderRadius: '20px',
            width: '100%',
            maxWidth: '500px',
            overflow: 'hidden',
            boxShadow: '0 30px 70px rgba(0,0,0,0.5)',
            position: 'relative'
          }} onClick={e => e.stopPropagation()}>
            {/* Modal Header */}
            <div style={{ padding: '1.5rem 2rem', borderBottom: '1px solid var(--glass-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, color: 'var(--text-primary)', fontSize: '1.25rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Building2 size={22} color="var(--primary)" /> Edit Company Profile
              </h3>
              <button onClick={() => setIsEditingCompany(false)} style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', display: 'flex', padding: '4px' }}>
                <X size={22} />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleUpdateCompany} style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="label">Company Name</label>
                <input 
                  type="text" 
                  required 
                  className="input-field" 
                  value={editName} 
                  onChange={e => setEditName(e.target.value)} 
                />
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="label">Website URL</label>
                <input 
                  type="url" 
                  className="input-field" 
                  placeholder="https://company.com"
                  value={editWebsite} 
                  onChange={e => setEditWebsite(e.target.value)} 
                />
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="label">Company Logo</label>
                <div style={{ display: 'flex', gap: '1.25rem', alignItems: 'center' }}>
                  <div style={{ 
                    width: '72px', 
                    height: '72px', 
                    borderRadius: '12px', 
                    background: 'var(--surface-highlight)', 
                    border: '1px solid var(--glass-border)', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    overflow: 'hidden', 
                    flexShrink: 0,
                    boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.2)'
                  }}>
                    {logoPreview ? (
                      <img src={logoPreview} alt="Logo preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <Building2 size={32} color="var(--primary)" />
                    )}
                  </div>
                  
                  <div style={{ flex: 1 }}>
                    <button 
                      type="button" 
                      onClick={() => fileInputRef.current?.click()}
                      className="btn btn-secondary"
                      style={{ padding: '0.5rem 1rem', fontSize: '0.85rem', width: 'auto', display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}
                    >
                      Choose Logo Image
                    </button>
                    <input 
                      type="file" 
                      ref={fileInputRef} 
                      accept="image/*" 
                      style={{ display: 'none' }} 
                      onChange={handleLogoChange} 
                    />
                    <p style={{ margin: '0.4rem 0 0 0', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                      Supports PNG, JPG, or GIF up to 5MB.
                    </p>
                  </div>
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="label">About / Description</label>
                <textarea 
                  required 
                  className="input-field" 
                  style={{ minHeight: '100px', resize: 'vertical' }}
                  value={editBio} 
                  onChange={e => setEditBio(e.target.value)} 
                />
              </div>

              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '1rem' }}>
                <button type="button" onClick={() => setIsEditingCompany(false)} className="btn btn-secondary">
                  Cancel
                </button>
                <button type="submit" disabled={savingCompany} className="btn btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
                  {savingCompany ? <Loader2 size={16} className="animate-spin" /> : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Candidate Resume & Details Modal */}
      {selectedApp && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.85)',
          backdropFilter: 'blur(8px)',
          zIndex: 9999,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          padding: '1.5rem'
        }} onClick={() => setSelectedApp(null)}>
          
          <div style={{
            background: 'var(--surface-color)',
            border: '1px solid var(--glass-border)',
            borderRadius: '20px',
            width: '100%',
            maxWidth: '750px',
            maxHeight: '90dvh',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            boxShadow: '0 30px 70px rgba(0,0,0,0.5)',
            position: 'relative'
          }} onClick={e => e.stopPropagation()}>
            
            {/* Modal Header */}
            <div style={{ padding: '1.5rem 2rem', borderBottom: '1px solid var(--glass-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <span style={{ fontSize: '0.8rem', color: 'var(--primary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Job Applicant Profile</span>
                <h3 style={{ margin: '0.25rem 0 0 0', color: 'var(--text-primary)', fontSize: '1.4rem', fontWeight: 800 }}>
                  {selectedApp.profiles?.full_name || selectedApp.profiles?.username}
                </h3>
              </div>
              <button 
                onClick={() => setSelectedApp(null)}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', display: 'flex', padding: '4px' }}
              >
                <X size={24} />
              </button>
            </div>

            {/* Modal Content */}
            <div style={{ overflowY: 'auto', padding: '2rem', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
              
              {/* Applicant Header Stats */}
              <div style={{ display: 'flex', gap: '2rem', alignItems: 'flex-start', flexWrap: 'wrap', background: 'var(--surface-highlight)', padding: '1.5rem', borderRadius: '12px' }}>
                <img 
                  src={selectedApp.profiles?.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${selectedApp.profiles?.username}`} 
                  alt={selectedApp.profiles?.username}
                  style={{ width: '80px', height: '80px', borderRadius: '50%', objectFit: 'cover', border: '1px solid var(--glass-border)' }}
                />
                <div style={{ flex: 1 }}>
                  <h4 style={{ margin: '0 0 0.25rem 0', color: 'var(--text-primary)', fontSize: '1.15rem' }}>{selectedApp.profiles?.label || 'Professional Applicant'}</h4>
                  <p style={{ margin: '0 0 1rem 0', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>@{selectedApp.profiles?.username}</p>
                  
                  <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
                    {selectedApp.profiles?.email && (
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-primary)', fontSize: '0.9rem' }}>
                        <Mail size={16} color="var(--primary)" /> {selectedApp.profiles.email}
                      </span>
                    )}
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                      <Calendar size={16} /> Applied {new Date(selectedApp.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Career Context / Pitch */}
              {selectedApp.profiles?.career_context && (
                <div>
                  <h4 style={{ color: 'var(--text-primary)', fontSize: '1.1rem', margin: '0 0 0.75rem 0', fontWeight: 700 }}>AI Professional Summary</h4>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: 1.6, margin: 0, background: 'rgba(250, 189, 47, 0.03)', borderLeft: '3px solid var(--primary)', paddingLeft: '1rem' }}>
                    {selectedApp.profiles.career_context}
                  </p>
                </div>
              )}

              {/* Dynamic Resume Viewer */}
              <div>
                <h4 style={{ color: 'var(--text-primary)', fontSize: '1.1rem', margin: '0 0 1.25rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700 }}>
                  <FileText size={18} color="var(--primary)" /> CareerReport Resume details
                </h4>

                {loadingResume ? (
                  <div style={{ textAlign: 'center', padding: '2rem 0' }}>
                    <p style={{ color: 'var(--text-secondary)' }}>Retrieving candidate resume details...</p>
                  </div>
                ) : !candidateResume ? (
                  <div style={{ padding: '2rem', border: '1px dashed var(--glass-border)', borderRadius: '12px', textAlign: 'center' }}>
                    <p style={{ color: 'var(--text-secondary)', margin: 0 }}>This candidate has not generated a custom builder resume yet. You can contact them directly via email.</p>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                    
                    {/* Work Experience */}
                    {candidateResume.work && candidateResume.work.length > 0 && (
                      <div>
                        <h5 style={{ color: 'var(--text-primary)', fontSize: '0.95rem', textTransform: 'uppercase', letterSpacing: '0.5px', borderBottom: '1px solid var(--glass-border)', paddingBottom: '0.5rem', marginBottom: '1rem', fontWeight: 700 }}>Experience</h5>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                          {candidateResume.work.map((w: any) => (
                            <div key={w.id}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                                <span style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.95rem' }}>{w.position}</span>
                                <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>{w.startDate} - {w.endDate || 'Present'}</span>
                              </div>
                              <div style={{ color: 'var(--primary)', fontSize: '0.85rem', fontWeight: 500, marginBottom: '0.5rem' }}>{w.name}</div>
                              {w.summary && <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>{w.summary}</p>}
                              {w.highlights && w.highlights.length > 0 && (
                                <ul style={{ margin: 0, paddingLeft: '1.25rem', color: 'var(--text-secondary)', fontSize: '0.85rem', lineHeight: 1.5 }}>
                                  {w.highlights.map((h: string, idx: number) => <li key={idx}>{h}</li>)}
                                </ul>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Education */}
                    {candidateResume.education && candidateResume.education.length > 0 && (
                      <div>
                        <h5 style={{ color: 'var(--text-primary)', fontSize: '0.95rem', textTransform: 'uppercase', letterSpacing: '0.5px', borderBottom: '1px solid var(--glass-border)', paddingBottom: '0.5rem', marginBottom: '1rem', fontWeight: 700 }}>Education</h5>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                          {candidateResume.education.map((e: any) => (
                            <div key={e.id}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                                <span style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.95rem' }}>{e.area}</span>
                                <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>{e.startDate} - {e.endDate || 'Present'}</span>
                              </div>
                              <div style={{ color: 'var(--primary)', fontSize: '0.85rem', fontWeight: 500 }}>{e.studyType} • {e.institution}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Skills */}
                    {candidateResume.skills && candidateResume.skills.length > 0 && (
                      <div>
                        <h5 style={{ color: 'var(--text-primary)', fontSize: '0.95rem', textTransform: 'uppercase', letterSpacing: '0.5px', borderBottom: '1px solid var(--glass-border)', paddingBottom: '0.5rem', marginBottom: '1rem', fontWeight: 700 }}>Skills</h5>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                          {candidateResume.skills.map((s: any) => (
                            <span 
                              key={s.id} 
                              style={{ 
                                background: 'var(--surface-highlight)', 
                                border: '1px solid var(--glass-border)', 
                                color: 'var(--text-primary)', 
                                padding: '4px 12px', 
                                borderRadius: '20px', 
                                fontSize: '0.85rem', 
                                fontWeight: 500 
                              }}
                            >
                              {s.name} {s.level ? `(${s.level})` : ''}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Projects */}
                    {candidateResume.projects && candidateResume.projects.length > 0 && (
                      <div>
                        <h5 style={{ color: 'var(--text-primary)', fontSize: '0.95rem', textTransform: 'uppercase', letterSpacing: '0.5px', borderBottom: '1px solid var(--glass-border)', paddingBottom: '0.5rem', marginBottom: '1rem', fontWeight: 700 }}>Projects</h5>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                          {candidateResume.projects.map((p: any) => (
                            <div key={p.id}>
                              <span style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.95rem', display: 'block', marginBottom: '0.25rem' }}>{p.name}</span>
                              {p.url && <a href={p.url} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--primary)', fontSize: '0.85rem', display: 'block', marginBottom: '0.5rem', textDecoration: 'none' }}>{p.url}</a>}
                              {p.description && <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>{p.description}</p>}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div style={{ padding: '1.5rem 2rem', borderTop: '1px solid var(--glass-border)', display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
              <a 
                href={selectedApp.profiles?.email ? `mailto:${selectedApp.profiles.email}?subject=CareerReport Application: ${jobs.find(j => j.id === selectedApp.job_id)?.title || 'Open Position'}` : '#'}
                className="btn btn-primary"
                style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}
              >
                <Mail size={18} /> Contact Applicant
              </a>
              <button 
                onClick={() => setSelectedApp(null)}
                className="btn btn-secondary"
              >
                Close Review
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Global CSS Styles for premium interactions */}
      <style dangerouslySetInnerHTML={{__html: `
        .job-card-hover:hover {
          border-color: var(--primary) !important;
          transform: translateY(-2px);
          box-shadow: 0 10px 25px rgba(0,0,0,0.15);
        }
        .btn-tab:hover {
          color: var(--primary) !important;
        }
        .hover-row:hover {
          background: rgba(255, 255, 255, 0.02);
        }
      `}} />
    </main>
  );
}
