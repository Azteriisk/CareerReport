-- Hardening RLS Policies for Core Tables
-- Ensure that the application cannot expose data or be abused by unauthorized users.

-- Enable RLS on core tables (if not already enabled)
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_profiles ENABLE ROW LEVEL SECURITY;

-- ==========================================
-- JOBS TABLE POLICIES
-- ==========================================

-- 1. Anyone can view jobs (read access is public for candidates to see the board)
DROP POLICY IF EXISTS "Public can view jobs" ON public.jobs;
CREATE POLICY "Public can view jobs" 
  ON public.jobs FOR SELECT 
  USING (true);

-- 2. Only business owners or authorized recruiters can insert/update jobs
DROP POLICY IF EXISTS "Recruiters can insert jobs" ON public.jobs;
CREATE POLICY "Recruiters can insert jobs" 
  ON public.jobs FOR INSERT 
  WITH CHECK (
    -- Assuming your application logic verifies business_id ownership via auth token or service role.
    -- If using service role for all inserts, this policy is bypassed anyway. 
    -- If users insert directly from the client:
    (auth.jwt() ->> 'sub') IN (SELECT owner_id FROM public.business_profiles WHERE id = business_id)
  );

DROP POLICY IF EXISTS "Recruiters can update own jobs" ON public.jobs;
CREATE POLICY "Recruiters can update own jobs" 
  ON public.jobs FOR UPDATE 
  USING (
    (auth.jwt() ->> 'sub') IN (SELECT owner_id FROM public.business_profiles WHERE id = business_id)
  );

-- ==========================================
-- JOB APPLICATIONS TABLE POLICIES
-- ==========================================

-- 1. Candidates can only view their own applications
DROP POLICY IF EXISTS "Candidates view own applications" ON public.job_applications;
CREATE POLICY "Candidates view own applications" 
  ON public.job_applications FOR SELECT 
  USING ((auth.jwt() ->> 'sub') = applicant_id);

-- 2. Candidates can insert their own applications
DROP POLICY IF EXISTS "Candidates can apply" ON public.job_applications;
CREATE POLICY "Candidates can apply" 
  ON public.job_applications FOR INSERT 
  WITH CHECK ((auth.jwt() ->> 'sub') = applicant_id);

-- 3. Recruiters can view applications for their jobs
DROP POLICY IF EXISTS "Recruiters view applications for their jobs" ON public.job_applications;
CREATE POLICY "Recruiters view applications for their jobs" 
  ON public.job_applications FOR SELECT 
  USING (
    job_id IN (
      SELECT id FROM public.jobs WHERE business_id IN (
        SELECT id FROM public.business_profiles WHERE owner_id = (auth.jwt() ->> 'sub')
      )
    )
  );

-- ==========================================
-- BUSINESS PROFILES TABLE POLICIES
-- ==========================================

-- 1. Public can view business profiles (for job listings)
DROP POLICY IF EXISTS "Public can view business profiles" ON public.business_profiles;
CREATE POLICY "Public can view business profiles" 
  ON public.business_profiles FOR SELECT 
  USING (true);

-- 2. Only the owner can update their business profile
DROP POLICY IF EXISTS "Owners can update business profiles" ON public.business_profiles;
CREATE POLICY "Owners can update business profiles" 
  ON public.business_profiles FOR UPDATE 
  USING ((auth.jwt() ->> 'sub') = owner_id);

-- NOTE: The Supabase Service Role key used in your API routes (e.g., webhook, AI generators)
-- will automatically bypass these RLS policies to perform administrative updates (like injecting credits).
