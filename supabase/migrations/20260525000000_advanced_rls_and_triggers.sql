-- ── ROW LEVEL SECURITY SAFEGUARDS ──

-- Enable RLS on company_employees table
ALTER TABLE IF EXISTS company_employees ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can read employee records (Public Directory)
CREATE POLICY "Allow public read of company employees"
  ON company_employees
  FOR SELECT
  USING (true);

-- Policy: Only business owners can insert employee records (or invite them)
CREATE POLICY "Allow business owners to insert employees"
  ON company_employees
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM business_profiles
      WHERE business_profiles.id = company_employees.business_id
      AND business_profiles.owner_id = (auth.jwt() ->> 'sub')
    )
  );

-- Policy: Business owners can update/delete employee records, but NON-owners cannot touch the owner's record.
CREATE POLICY "Allow business owners to manage employees except owner record"
  ON company_employees
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM business_profiles
      WHERE business_profiles.id = company_employees.business_id
      AND business_profiles.owner_id = (auth.jwt() ->> 'sub')
    )
    AND company_employees.user_id <> (
      SELECT owner_id FROM business_profiles WHERE id = company_employees.business_id
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM business_profiles
      WHERE business_profiles.id = company_employees.business_id
      AND business_profiles.owner_id = (auth.jwt() ->> 'sub')
    )
    AND company_employees.user_id <> (
      SELECT owner_id FROM business_profiles WHERE id = company_employees.business_id
    )
  );

CREATE POLICY "Allow business owners to delete employees except owner record"
  ON company_employees
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM business_profiles
      WHERE business_profiles.id = company_employees.business_id
      AND business_profiles.owner_id = (auth.jwt() ->> 'sub')
    )
    AND company_employees.user_id <> (
      SELECT owner_id FROM business_profiles WHERE id = company_employees.business_id
    )
  );


-- ── CASCADE ORPHAN CLEANUP DB TRIGGERS ──

-- 1. Helper function to clean up user-related orphans when a profile is deleted
CREATE OR REPLACE FUNCTION handle_deleted_profile_cleanup()
RETURNS TRIGGER AS $$
BEGIN
  -- Delete all posts created by the user
  DELETE FROM posts WHERE user_id = OLD.id;
  
  -- Delete all comments made by the user
  DELETE FROM comments WHERE user_id = OLD.id;
  
  -- Delete all likes registered by the user
  DELETE FROM post_likes WHERE user_id = OLD.id;
  
  -- Delete all company employee associations for the user
  DELETE FROM company_employees WHERE user_id = OLD.id;
  
  -- Delete all job applications submitted by the user
  DELETE FROM job_applications WHERE applicant_id = OLD.id;

  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger: When a profile is deleted, run handle_deleted_profile_cleanup
CREATE TRIGGER on_profile_deleted_cleanup
  BEFORE DELETE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION handle_deleted_profile_cleanup();


-- 2. Helper function to clean up post-related orphans when a post is deleted
CREATE OR REPLACE FUNCTION handle_deleted_post_cleanup()
RETURNS TRIGGER AS $$
BEGIN
  -- Delete all comments linked to the post
  DELETE FROM comments WHERE post_id = OLD.id;
  
  -- Delete all likes linked to the post
  DELETE FROM post_likes WHERE post_id = OLD.id;

  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger: When a post is deleted, run handle_deleted_post_cleanup
CREATE TRIGGER on_post_deleted_cleanup
  BEFORE DELETE ON posts
  FOR EACH ROW
  EXECUTE FUNCTION handle_deleted_post_cleanup();


-- 3. Helper function to clean up business-related orphans when a business profile is deleted
CREATE OR REPLACE FUNCTION handle_deleted_business_cleanup()
RETURNS TRIGGER AS $$
BEGIN
  -- Delete all jobs posted by the business
  DELETE FROM jobs WHERE business_id = OLD.id;
  
  -- Delete all employees registered under the business
  DELETE FROM company_employees WHERE business_id = OLD.id;

  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger: When a business profile is deleted, run handle_deleted_business_cleanup
CREATE TRIGGER on_business_deleted_cleanup
  BEFORE DELETE ON business_profiles
  FOR EACH ROW
  EXECUTE FUNCTION handle_deleted_business_cleanup();
