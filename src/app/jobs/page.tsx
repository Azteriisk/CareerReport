"use client";
import Link from 'next/link';
import { Search, MapPin, Building, BadgeCheck, Filter, Loader2, Sparkles, Briefcase, ArrowRight } from 'lucide-react';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useUser } from '@clerk/nextjs';

import { parseJobStatus, formatSalary } from '@/lib/job-tier';
import styles from './page.module.css';

function formatTimeAgo(date: Date) {
  const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
  let interval = Math.floor(seconds / 86400);
  if (interval >= 1) return `${interval}d ago`;
  interval = Math.floor(seconds / 3600);
  if (interval >= 1) return `${interval}h ago`;
  interval = Math.floor(seconds / 60);
  if (interval >= 1) return `${interval}m ago`;
  return 'just now';
}

export default function JobsBoardPage() {
  const { isSignedIn, user } = useUser();
  const [search, setSearch] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filterLocation, setFilterLocation] = useState('');
  const [filterWorkType, setFilterWorkType] = useState('Any');
  const [filterPayType, setFilterPayType] = useState('Any');
  const [jobs, setJobs] = useState<any[]>([]);
  const [candidateProfile, setCandidateProfile] = useState<{ label: string; careerContext: string } | null>(null);
  const [candidateResume, setCandidateResume] = useState<any | null>(null);
  const [sortedJobs, setSortedJobs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load candidate profile & latest public resume context if authenticated
  useEffect(() => {
    async function loadCandidateData() {
      if (!isSignedIn || !user) return;
      try {
        // Fetch profile
        const { data: profileData } = await supabase
          .from('profiles')
          .select('label, career_context')
          .eq('id', user.id)
          .single();
        
        if (profileData) {
          setCandidateProfile({
            label: profileData.label || '',
            careerContext: profileData.career_context || ''
          });
        }

        // Fetch latest public resume
        const { data: resumeData } = await supabase
          .from('resumes')
          .select('data')
          .eq('user_id', user.id)
          .eq('is_public', true)
          .order('updated_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (resumeData) {
          setCandidateResume(resumeData.data);
        }
      } catch (err) {
        console.error("Failed to load candidate data:", err);
      }
    }

    loadCandidateData();
  }, [isSignedIn, user?.id]);

  useEffect(() => {
    async function loadJobs() {
      setIsLoading(true);
      try {
        const { data: dbJobs, error } = await supabase
          .from('jobs')
          .select(`
            id,
            title,
            description,
            salary_min,
            salary_max,
            is_remote,
            location,
            created_at,
            status,
            business_profiles (
              name,
              logo_url,
              slug
            )
          `)
          .like('status', 'open%') // backwards-compatible match for open listings
          .order('created_at', { ascending: false });

        if (error) throw error;

        if (dbJobs) {
          const formatted = dbJobs.map((j: any) => {
            const parsed = parseJobStatus(j.status);
            const locParts = (j.location || '').split(' • ');
            let jobType = 'Full-time';
            if (locParts.length >= 3) {
              jobType = locParts[2];
            } else if (j.is_remote) {
              jobType = 'Remote';
            }
            let displayLocation = locParts[0] || (j.is_remote ? 'Remote' : 'On-site');
            if (locParts.length >= 2 && locParts[1] !== 'On-site') {
              displayLocation += ` (${locParts[1]})`;
            }

            return {
              id: j.id,
              title: j.title,
              description: j.description || '',
              company: j.business_profiles?.name || 'Unknown Company',
              verified: true,
              location: displayLocation,
              salary: j.salary_min || j.salary_max
                ? formatSalary(j.salary_min, j.salary_max, parsed.payType)
                : 'Competitive',
              type: jobType,
              posted: formatTimeAgo(new Date(j.created_at)),
              logo: j.business_profiles?.name?.charAt(0) || 'J',
              logoUrl: j.business_profiles?.logo_url,
              isReal: true,
              payType: parsed.payType,
              // Only actively-running (non-paused) sponsorships get featured treatment
              isFeatured: parsed.isActivelyFeatured
            };
          });

          setJobs(formatted);
        }
      } catch (err) {
        console.error("Error loading real jobs:", err);
      } finally {
        setIsLoading(false);
      }
    }

    loadJobs();
  }, []);

  // Dynamically calculate and sort feed based on search keywords and candidate profile/resume fit
  useEffect(() => {
    if (jobs.length === 0) {
      setSortedJobs([]);
      return;
    }

    const cleanSearch = search.trim().toLowerCase();

    const processed = jobs.map((job: any) => {
      let score = 0;
      const jobTitle = job.title.toLowerCase();
      const jobDesc = job.description.toLowerCase();
      const jobCompany = job.company.toLowerCase();
      const jobLoc = job.location.toLowerCase();

      // 1. Search query prioritization
      if (cleanSearch) {
        if (jobTitle.includes(cleanSearch)) {
          score += 100; // Search keyword in Title is highly relevant
          if (jobTitle.startsWith(cleanSearch) || jobTitle.split(/\s+/).includes(cleanSearch)) {
            score += 50; // Exact prefix or word match in Title
          }
        } else if (jobDesc.includes(cleanSearch)) {
          score += 30; // Search keyword in Description
        } else if (jobCompany.includes(cleanSearch)) {
          score += 20; // Search keyword in Company
        } else if (jobLoc.includes(cleanSearch)) {
          score += 15; // Search keyword in Location
        }
      }

      // 2. Candidate Resume Match scoring (Dynamic fit based on public resume data)
      if (candidateResume) {
        // A. Candidate summary/label title match
        const resumeLabel = (candidateResume.basics?.label || '').toLowerCase();
        if (resumeLabel) {
          if (jobTitle.includes(resumeLabel) || resumeLabel.includes(jobTitle)) {
            score += 45;
          }
        }

        // B. Skills match
        const skills = candidateResume.skills || [];
        skills.forEach((skill: any) => {
          const skillName = (skill.name || '').toLowerCase();
          if (skillName && skillName.length > 2) {
            if (jobTitle.includes(skillName)) {
              score += 15; // Candidate skill matches job title directly
            } else if (jobDesc.includes(skillName)) {
              score += 5;  // Candidate skill matches job description
            }
          }
        });

        // C. Work history positions match
        const workHistory = candidateResume.work || [];
        workHistory.forEach((w: any) => {
          const position = (w.position || '').toLowerCase();
          if (position && position.length > 2) {
            if (jobTitle.includes(position)) {
              score += 10;
            }
          }
        });
      }

      // 3. Fallback Candidate Profile Match
      if (candidateProfile) {
        const profileLabel = (candidateProfile.label || '').toLowerCase();
        if (profileLabel) {
          if (jobTitle.includes(profileLabel) || profileLabel.includes(jobTitle)) {
            score += 20;
          }
        }
      }

      // 4. Featured sponsored boost (Pinned sponsor ads get standard prominence boost)
      if (job.isFeatured) {
        score += 25;
      }

      // Determine match strength descriptors
      const hasResumeMatch = score > 35; 

      return {
        ...job,
        matchScore: score,
        isRelevantMatch: job.isFeatured && hasResumeMatch, // Pin sponsor matching jobs
        hasResumeMatch
      };
    });

    // Filter by search query and active filters
    const filtered = processed.filter((job: any) => {
      // 1. Text Search
      if (cleanSearch) {
        const matchesSearch = job.title.toLowerCase().includes(cleanSearch) ||
                              job.company.toLowerCase().includes(cleanSearch) ||
                              job.location.toLowerCase().includes(cleanSearch) ||
                              job.description.toLowerCase().includes(cleanSearch);
        if (!matchesSearch) return false;
      }

      // 2. Location Filter
      if (filterLocation.trim() !== '') {
        const locLower = filterLocation.toLowerCase().trim();
        if (!job.location.toLowerCase().includes(locLower)) return false;
      }

      // 3. Work Type Filter
      if (filterWorkType !== 'Any') {
        if (job.type !== filterWorkType) return false;
      }

      // 4. Pay Type Filter
      if (filterPayType !== 'Any') {
        // e.g., 'salary', 'hourly', 'contract'
        if (job.payType !== filterPayType.toLowerCase()) return false;
      }

      return true;
    });

    // Dynamic prioritization sort by matching score descending
    const sorted = [...filtered].sort((a: any, b: any) => {
      // 1. Relevant matching sponsored items stay at the top (by score desc)
      if (a.isRelevantMatch && !b.isRelevantMatch) return -1;
      if (!a.isRelevantMatch && b.isRelevantMatch) return 1;
      
      // 2. Sort by matchScore descending
      if (b.matchScore !== a.matchScore) {
        return b.matchScore - a.matchScore;
      }
      
      // Chronological fallback
      return 0;
    });

    setSortedJobs(sorted);
  }, [jobs, candidateProfile, candidateResume, search, filterLocation, filterWorkType, filterPayType]);


  return (
    <div className={`landing-container ${styles.page}`}>
      <main className={styles.main}>
        <div className={styles.pageHeading}>
          <h2 className={styles.pageTitle}>Discover Opportunities</h2>
          <p className={styles.pageSubtitle}>Apply with your CareerReport profile in one click.</p>
        </div>

        <div className={`jobs-search-row ${styles.searchRow}`}>
          <div className={styles.searchBox}>
            <Search size={20} color="var(--text-secondary)" className={styles.searchIcon} />
            <input
              type="text"
              placeholder="Search by job title, company, or keywords..."
              className={styles.searchInput}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <button 
            className={`btn btn-secondary ${styles.filterBtn}`}
            onClick={() => setShowFilters(!showFilters)}
            style={showFilters ? { background: 'var(--surface-highlight)', borderColor: 'var(--primary)' } : {}}
          >
            <Filter size={18} /> Filters
          </button>
        </div>

        {/* Filters Panel */}
        {showFilters && (
          <div style={{ background: 'var(--surface-color)', border: '1px solid var(--glass-border)', borderRadius: '12px', padding: '1.5rem', marginBottom: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontSize: '1.1rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Filter size={18} color="var(--primary)" /> Filter Opportunities
              </h3>
              <button 
                onClick={() => {
                  setFilterLocation('');
                  setFilterWorkType('Any');
                  setFilterPayType('Any');
                }}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', fontSize: '0.85rem', cursor: 'pointer', textDecoration: 'underline' }}
              >
                Clear All
              </button>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
              {/* Location */}
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="label">Location</label>
                <div style={{ position: 'relative' }}>
                  <MapPin size={16} color="var(--text-secondary)" style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)' }} />
                  <input 
                    type="text" 
                    className="input-field" 
                    placeholder="City, State, or Zip" 
                    style={{ paddingLeft: '2.5rem', marginBottom: 0 }}
                    value={filterLocation}
                    onChange={(e) => setFilterLocation(e.target.value)}
                  />
                </div>
              </div>

              {/* Work Type */}
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="label">Work Type</label>
                <select 
                  className="input-field" 
                  style={{ marginBottom: 0 }}
                  value={filterWorkType}
                  onChange={(e) => setFilterWorkType(e.target.value)}
                >
                  <option value="Any">Any Work Type</option>
                  <option value="Full-time">Full-time</option>
                  <option value="Part-time">Part-time</option>
                  <option value="Contract">Contract</option>
                  <option value="Freelance">Freelance</option>
                  <option value="Internship">Internship</option>
                  <option value="Remote">Remote Only</option>
                </select>
              </div>

              {/* Pay Type */}
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="label">Pay Type</label>
                <select 
                  className="input-field" 
                  style={{ marginBottom: 0 }}
                  value={filterPayType}
                  onChange={(e) => setFilterPayType(e.target.value)}
                >
                  <option value="Any">Any Pay Type</option>
                  <option value="Salary">Salary</option>
                  <option value="Hourly">Hourly</option>
                  <option value="Contract">Contract / Project</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Personalized Feed Banner */}
        {(candidateResume || candidateProfile) && (
          <div className={styles.feedBanner}>
            <div className={styles.feedBannerLeft}>
              <div className={styles.feedBannerIcon}>
                <Sparkles size={20} className="pulse" />
              </div>
              <div>
                <h4 className={styles.feedBannerTitle}>Intelligent Feed Active 🧠</h4>
                <p className={styles.feedBannerText}>
                  Prioritizing opportunities aligned with your public resume {candidateResume?.basics?.label ? `(${candidateResume.basics.label})` : candidateProfile?.label ? `(${candidateProfile.label})` : ''} and active search terms.
                </p>
              </div>
            </div>
            <span className={styles.feedBannerBadge}>
              Matched {sortedJobs.filter(j => j.matchScore > 20).length} Roles
            </span>
          </div>
        )}

        {isLoading ? (
          <div className="flex-center" style={{ padding: '3rem 0' }}>
            <Loader2 className="animate-spin text-primary" size={32} />
          </div>
        ) : jobs.length === 0 ? (
          <div className={styles.emptyState}>
            <div className={styles.emptyStateIcon}>
              <Sparkles size={36} />
            </div>
            <div>
              <span className={styles.emptyStateBadge}>Early Adopter Phase</span>
              <h3 className={styles.emptyStateTitle}>Welcome, Early Adopter!</h3>
              <p className={styles.emptyStateText}>
                Thank you for being part of CareerReport at this early stage. We are currently building partnerships with top employers to populate this board with exclusive opportunities.
              </p>
            </div>
            <div className={styles.hiringCard}>
              <div className={styles.hiringCardIcon}><Briefcase size={20} /></div>
              <div>
                <h4 className={styles.hiringCardTitle}>Are you hiring?</h4>
                <p className={styles.hiringCardText}>
                  Help us shape the future of recruiting. Set up a company profile today to list your open roles completely free! Candidates apply instantly using their verified, ATS-optimized profiles.
                </p>
              </div>
            </div>
            <div className={styles.emptyStateCtas}>
              <Link href="/business/create" className={styles.ctaLink}>
                <button className={`btn btn-primary ${styles.ctaBtn}`}>
                  Post a Job (Free) <ArrowRight size={18} />
                </button>
              </Link>
              <Link href="/business/advertise" className={styles.ctaLink}>
                <button className={`btn btn-secondary ${styles.ctaBtn}`}>
                  Explore Recruiter Benefits
                </button>
              </Link>
            </div>
          </div>
        ) : (
          <div className={styles.jobList}>
            {sortedJobs.map(job => (
              <Link href={`/jobs/${job.id}`} key={job.id} className={styles.jobLink}>
                <div
                  className={styles.jobCard}
                  style={{
                    background: job.isRelevantMatch
                      ? 'linear-gradient(135deg, rgba(250, 189, 47, 0.07) 0%, rgba(251, 191, 36, 0.01) 100%)'
                      : job.isFeatured
                      ? 'linear-gradient(135deg, rgba(250, 189, 47, 0.04) 0%, var(--surface-color) 100%)'
                      : 'var(--surface-color)',
                    border: job.isRelevantMatch
                      ? '2px solid rgba(250, 189, 47, 0.65)'
                      : job.isFeatured
                      ? '1px solid rgba(250, 189, 47, 0.35)'
                      : '1px solid var(--glass-border)',
                    boxShadow: job.isRelevantMatch
                      ? '0 8px 30px rgba(250, 189, 47, 0.08)'
                      : job.isFeatured
                      ? '0 6px 20px rgba(250, 189, 47, 0.03)'
                      : 'none'
                  }}
                >
                  <div className={styles.jobLogoWrap}>
                    {job.logoUrl ? (
                      <img src={job.logoUrl} alt={job.company} className={styles.jobLogoImg} />
                    ) : (
                      <span className={styles.jobLogoFallback}>{job.logo}</span>
                    )}
                  </div>

                  <div className={styles.jobInfo}>
                    <div className={styles.jobTitleRow}>
                      <h3 className={styles.jobTitle}>{job.title}</h3>
                      {job.isRelevantMatch && (
                        <span className={styles.badgeSponsoredMatch}>✨ Sponsored Match for You</span>
                      )}
                      {!job.isRelevantMatch && job.isFeatured && (
                        <span className={styles.badgeFeatured}>🔥 Featured</span>
                      )}
                      {job.hasResumeMatch && !job.isRelevantMatch && (
                        <span className={styles.badgeStrongMatch}>
                          🎯 Strong Match {job.matchScore > 0 ? `(${Math.min(99, Math.round(55 + (job.matchScore / 4.5)))}% Fit)` : ''}
                        </span>
                      )}
                    </div>
                    <div className={`job-card-meta ${styles.jobMeta}`}>
                      <span className={styles.jobMetaCompany}>
                        <Building size={16} /> {job.company}
                        {job.verified && <span title="Verified Business Account" className={styles.jobMetaVerified}><BadgeCheck size={16} color="var(--primary)" /></span>}
                      </span>
                      <span>•</span>
                      <span className={styles.jobMetaLocation}><MapPin size={16} /> {job.location}</span>
                    </div>
                    <div className={styles.jobTags}>
                      <span className={styles.tagType}>{job.type}</span>
                      <span className={styles.tagSalary}>{job.salary}</span>
                    </div>
                  </div>

                  <div className={`job-card-action ${styles.jobAction}`}>
                    <div className={styles.jobPosted}>{job.posted}</div>
                    <button className={`btn btn-primary ${styles.applyBtn}`}>Easy Apply</button>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
