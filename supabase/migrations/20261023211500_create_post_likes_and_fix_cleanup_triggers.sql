-- ── CREATE POST_LIKES TABLE & SAFEGUARD DELETE TRIGGERS ──

-- 1. Create post_likes table
CREATE TABLE IF NOT EXISTS public.post_likes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  CONSTRAINT post_likes_post_user_unique UNIQUE(post_id, user_id)
);

-- 2. Enable Row Level Security
ALTER TABLE public.post_likes ENABLE ROW LEVEL SECURITY;

-- 3. RLS Policies for post_likes
DROP POLICY IF EXISTS "Allow public read of post_likes" ON public.post_likes;
CREATE POLICY "Allow public read of post_likes"
  ON public.post_likes
  FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Allow authenticated insert of post_likes" ON public.post_likes;
CREATE POLICY "Allow authenticated insert of post_likes"
  ON public.post_likes
  FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "Allow users to delete their own post_likes" ON public.post_likes;
CREATE POLICY "Allow users to delete their own post_likes"
  ON public.post_likes
  FOR DELETE
  USING (true);

-- 4. Indexes for fast lookup
CREATE INDEX IF NOT EXISTS idx_post_likes_post_id ON public.post_likes(post_id);
CREATE INDEX IF NOT EXISTS idx_post_likes_user_id ON public.post_likes(user_id);

-- 5. Safeguard handle_deleted_post_cleanup trigger function
CREATE OR REPLACE FUNCTION handle_deleted_post_cleanup()
RETURNS TRIGGER AS $$
BEGIN
  -- Delete all comments linked to the post
  DELETE FROM public.comments WHERE post_id = OLD.id;
  
  -- Delete all likes linked to the post (safe guard if table exists)
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'post_likes') THEN
    DELETE FROM public.post_likes WHERE post_id = OLD.id;
  END IF;

  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Safeguard handle_deleted_profile_cleanup trigger function
CREATE OR REPLACE FUNCTION handle_deleted_profile_cleanup()
RETURNS TRIGGER AS $$
BEGIN
  -- Delete all posts created by the user
  DELETE FROM public.posts WHERE user_id = OLD.id;
  
  -- Delete all comments made by the user
  DELETE FROM public.comments WHERE user_id = OLD.id;
  
  -- Delete all likes registered by the user
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'post_likes') THEN
    DELETE FROM public.post_likes WHERE user_id = OLD.id;
  END IF;
  
  -- Delete all company employee associations for the user
  DELETE FROM public.company_employees WHERE user_id = OLD.id;
  
  -- Delete all job applications submitted by the user
  DELETE FROM public.job_applications WHERE applicant_id = OLD.id;

  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
