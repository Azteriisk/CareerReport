-- Safe database migration adding tracking columns 'views' and 'clicks' to jobs table if they do not exist.

DO $$
BEGIN
  -- 1. Check and add 'views' column
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'jobs' AND column_name = 'views'
  ) THEN
    ALTER TABLE jobs ADD COLUMN views INTEGER DEFAULT 0 NOT NULL;
  END IF;

  -- 2. Check and add 'clicks' column
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'jobs' AND column_name = 'clicks'
  ) THEN
    ALTER TABLE jobs ADD COLUMN clicks INTEGER DEFAULT 0 NOT NULL;
  END IF;
END $$;
