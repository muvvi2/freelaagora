/*
# FreelaAgora — Schema alignment for full Supabase migration

This migration brings the database schema in line with the frontend data model
so the app can switch from localStorage to Supabase as its data store.

## Changes

### 1. users table — add missing columns
- `nickname` already exists
- `address_lat` (numeric, nullable) — latitude for geo queries
- `address_lng` (numeric, nullable) — longitude for geo queries
- `service_radius_km` (integer, nullable) — freelancer service radius
- `accepts_interstate` (boolean, default false) — freelancer accepts interstate jobs
- `establishment_type` (varchar, nullable) — type of establishment
- `bio` (text, nullable) — freelancer bio
- `hourly_rate` (numeric, nullable) — freelancer hourly rate
- `daily_rate` (numeric, nullable) — freelancer daily rate
- `pix_key` (varchar, nullable) — freelancer PIX key
- `asaas_wallet_id` (varchar, nullable) — Asaas wallet ID for split payments
- `rating_average` (numeric, default 0) — user rating
- `reviews_count` (integer, default 0)
- `completed_shifts` (integer, default 0)
- `vip_tier` (varchar, default 'free') — freelancer VIP tier
- `est_vip_tier` (varchar, default 'free') — establishment VIP tier
- `vip_expires_at` (timestamptz, nullable) — freelancer VIP expiry
- `est_vip_expires_at` (timestamptz, nullable) — establishment VIP expiry
- `wallet_balance` (numeric, default 0)
- `is_admin` (boolean, default false)
- `banned` already exists

### 2. New table: platform_config
- Singleton config table for platform-wide settings
- `id` (serial, primary key, always 1)
- `default_fee_percent` (numeric, default 15.0)

### 3. New table: contract_events
- Append-only history of contract status changes
- `id` (uuid, primary key)
- `contract_id` (uuid, FK to contracts)
- `status` (varchar) — the status value at this event
- `note` (text, nullable)
- `created_at` (timestamptz)

### 4. New table: contract_reviews
- Reviews attached to a contract, from either party
- `id` (uuid, primary key)
- `contract_id` (uuid, FK to contracts)
- `from_user_id` (uuid, FK to users)
- `to_user_id` (uuid, FK to users)
- `rating` (integer, 1-5)
- `comment` (text, nullable)
- `created_at` (timestamptz)

### 5. New table: job_applicants
- Join table for job applications
- `job_id` (uuid, FK to jobs)
- `freelancer_id` (uuid, FK to users)
- `created_at` (timestamptz)
- PK (job_id, freelancer_id)

### 6. contracts table — add missing columns
- `category` (varchar, nullable) — category slug
- `freelancer_name` (varchar, nullable)
- `establishment_name` (varchar, nullable)
- `freelancer_photo` (text, nullable)
- `freelancer_phone` (varchar, nullable)
- `freelancer_whatsapp` (varchar, nullable)
- `review_from_establishment_id` (uuid, nullable, FK to contract_reviews)
- `review_from_freelancer_id` (uuid, nullable, FK to contract_reviews)

### 7. jobs table — add missing columns
- `establishment_name` (varchar, nullable)
- `establishment_photo` (text, nullable)
- `applicants` column is replaced by job_applicants table (no column needed)

### 8. freelancer_availability — add date availability support
- `specific_date` (date, nullable) — for date-specific availability overrides
- `unique` constraint extended to (freelancer_id, day_of_week, specific_date)

### 9. Security
- RLS enabled on all new tables
- platform_config: public read (anon + authenticated), admin-only write
- contract_events: parties + admin can read, parties + admin can insert
- contract_reviews: public read, authenticated insert (from_user must be self)
- job_applicants: public read, freelancer can insert own, establishment can delete own job's applicants

### 10. Policies for users table
- Add INSERT policy so new users can self-register
- Add admin UPDATE policy so admins can modify any user
- Add admin INSERT/DELETE policies
*/

-- ============================================================
-- 1. USERS TABLE — ADD MISSING COLUMNS
-- ============================================================
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'address_lat') THEN
    ALTER TABLE users ADD COLUMN address_lat NUMERIC(10,7);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'address_lng') THEN
    ALTER TABLE users ADD COLUMN address_lng NUMERIC(10,7);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'service_radius_km') THEN
    ALTER TABLE users ADD COLUMN service_radius_km INTEGER;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'accepts_interstate') THEN
    ALTER TABLE users ADD COLUMN accepts_interstate BOOLEAN DEFAULT FALSE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'establishment_type') THEN
    ALTER TABLE users ADD COLUMN establishment_type VARCHAR(100);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'bio') THEN
    ALTER TABLE users ADD COLUMN bio TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'hourly_rate') THEN
    ALTER TABLE users ADD COLUMN hourly_rate NUMERIC(10,2);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'daily_rate') THEN
    ALTER TABLE users ADD COLUMN daily_rate NUMERIC(10,2);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'pix_key') THEN
    ALTER TABLE users ADD COLUMN pix_key VARCHAR(255);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'asaas_wallet_id') THEN
    ALTER TABLE users ADD COLUMN asaas_wallet_id VARCHAR(255);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'rating_average') THEN
    ALTER TABLE users ADD COLUMN rating_average NUMERIC(3,2) DEFAULT 0.0;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'reviews_count') THEN
    ALTER TABLE users ADD COLUMN reviews_count INTEGER DEFAULT 0;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'completed_shifts') THEN
    ALTER TABLE users ADD COLUMN completed_shifts INTEGER DEFAULT 0;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'vip_tier') THEN
    ALTER TABLE users ADD COLUMN vip_tier VARCHAR(10) DEFAULT 'free';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'est_vip_tier') THEN
    ALTER TABLE users ADD COLUMN est_vip_tier VARCHAR(10) DEFAULT 'free';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'vip_expires_at') THEN
    ALTER TABLE users ADD COLUMN vip_expires_at TIMESTAMPTZ;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'est_vip_expires_at') THEN
    ALTER TABLE users ADD COLUMN est_vip_expires_at TIMESTAMPTZ;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'wallet_balance') THEN
    ALTER TABLE users ADD COLUMN wallet_balance NUMERIC(10,2) DEFAULT 0.00;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'is_admin') THEN
    ALTER TABLE users ADD COLUMN is_admin BOOLEAN DEFAULT FALSE;
  END IF;
END $$;

-- Update users policies for self-registration and admin access
DROP POLICY IF EXISTS "users_insert_own" ON users;
CREATE POLICY "users_insert_own" ON users FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "users_update_own_or_admin" ON users;
CREATE POLICY "users_update_own_or_admin" ON users FOR UPDATE
  TO authenticated USING (
    auth.uid() = id OR EXISTS (SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.is_admin = TRUE)
  ) WITH CHECK (
    auth.uid() = id OR EXISTS (SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.is_admin = TRUE)
  );

DROP POLICY IF EXISTS "users_delete_admin" ON users;
CREATE POLICY "users_delete_admin" ON users FOR DELETE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.is_admin = TRUE)
  );

-- ============================================================
-- 2. PLATFORM_CONFIG TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS platform_config (
  id SERIAL PRIMARY KEY,
  default_fee_percent NUMERIC(5,2) DEFAULT 15.00 NOT NULL
);

INSERT INTO platform_config (id, default_fee_percent) VALUES (1, 15.00)
  ON CONFLICT (id) DO NOTHING;

ALTER TABLE platform_config ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "config_select_all" ON platform_config;
CREATE POLICY "config_select_all" ON platform_config FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "config_update_admin" ON platform_config;
CREATE POLICY "config_update_admin" ON platform_config FOR UPDATE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.is_admin = TRUE)
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.is_admin = TRUE)
  );

-- ============================================================
-- 3. CONTRACT_EVENTS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS contract_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  contract_id UUID REFERENCES contracts(id) ON DELETE CASCADE,
  status VARCHAR(30) NOT NULL,
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

ALTER TABLE contract_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "events_select_parties" ON contract_events;
CREATE POLICY "events_select_parties" ON contract_events FOR SELECT
  TO authenticated USING (
    EXISTS (SELECT 1 FROM contracts c WHERE c.id = contract_events.contract_id
      AND (c.establishment_id = auth.uid() OR c.freelancer_id = auth.uid()
           OR EXISTS (SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.is_admin = TRUE)))
  );

DROP POLICY IF EXISTS "events_insert_parties" ON contract_events;
CREATE POLICY "events_insert_parties" ON contract_events FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM contracts c WHERE c.id = contract_events.contract_id
      AND (c.establishment_id = auth.uid() OR c.freelancer_id = auth.uid()
           OR EXISTS (SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.is_admin = TRUE)))
  );

-- ============================================================
-- 4. CONTRACT_REVIEWS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS contract_reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  contract_id UUID REFERENCES contracts(id) ON DELETE CASCADE,
  from_user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  to_user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  rating INTEGER CHECK (rating BETWEEN 1 AND 5) NOT NULL,
  comment TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

ALTER TABLE contract_reviews ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "reviews_select_all" ON contract_reviews;
CREATE POLICY "reviews_select_all" ON contract_reviews FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "reviews_insert_own" ON contract_reviews;
CREATE POLICY "reviews_insert_own" ON contract_reviews FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = from_user_id);

-- ============================================================
-- 5. JOB_APPLICANTS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS job_applicants (
  job_id UUID REFERENCES jobs(id) ON DELETE CASCADE,
  freelancer_id UUID REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  PRIMARY KEY (job_id, freelancer_id)
);

ALTER TABLE job_applicants ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "applicants_select_all" ON job_applicants;
CREATE POLICY "applicants_select_all" ON job_applicants FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "applicants_insert_own" ON job_applicants;
CREATE POLICY "applicants_insert_own" ON job_applicants FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = freelancer_id);

DROP POLICY IF EXISTS "applicants_delete_job_owner" ON job_applicants;
CREATE POLICY "applicants_delete_job_owner" ON job_applicants FOR DELETE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM jobs j WHERE j.id = job_applicants.job_id AND j.establishment_id = auth.uid())
  );

-- ============================================================
-- 6. CONTRACTS TABLE — ADD COLUMNS
-- ============================================================
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'contracts' AND column_name = 'category') THEN
    ALTER TABLE contracts ADD COLUMN category VARCHAR(50);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'contracts' AND column_name = 'freelancer_name') THEN
    ALTER TABLE contracts ADD COLUMN freelancer_name VARCHAR(255);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'contracts' AND column_name = 'establishment_name') THEN
    ALTER TABLE contracts ADD COLUMN establishment_name VARCHAR(255);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'contracts' AND column_name = 'freelancer_photo') THEN
    ALTER TABLE contracts ADD COLUMN freelancer_photo TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'contracts' AND column_name = 'freelancer_phone') THEN
    ALTER TABLE contracts ADD COLUMN freelancer_phone VARCHAR(20);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'contracts' AND column_name = 'freelancer_whatsapp') THEN
    ALTER TABLE contracts ADD COLUMN freelancer_whatsapp VARCHAR(20);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'contracts' AND column_name = 'review_from_establishment_id') THEN
    ALTER TABLE contracts ADD COLUMN review_from_establishment_id UUID REFERENCES contract_reviews(id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'contracts' AND column_name = 'review_from_freelancer_id') THEN
    ALTER TABLE contracts ADD COLUMN review_from_freelancer_id UUID REFERENCES contract_reviews(id);
  END IF;
END $$;

-- ============================================================
-- 7. JOBS TABLE — ADD COLUMNS
-- ============================================================
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'jobs' AND column_name = 'establishment_name') THEN
    ALTER TABLE jobs ADD COLUMN establishment_name VARCHAR(255);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'jobs' AND column_name = 'establishment_photo') THEN
    ALTER TABLE jobs ADD COLUMN establishment_photo TEXT;
  END IF;
END $$;

-- ============================================================
-- 8. FREELANCER_AVAILABILITY — ADD DATE-SPECIFIC SUPPORT
-- ============================================================
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'freelancer_availability' AND column_name = 'specific_date') THEN
    ALTER TABLE freelancer_availability ADD COLUMN specific_date DATE;
  END IF;
END $$;

-- Drop old unique constraint and add new one that includes specific_date
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'freelancer_availability_freelancer_id_day_of_week_key') THEN
    ALTER TABLE freelancer_availability DROP CONSTRAINT freelancer_availability_freelancer_id_day_of_week_key;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fl_avail_unique') THEN
    ALTER TABLE freelancer_availability ADD CONSTRAINT fl_avail_unique UNIQUE (freelancer_id, day_of_week, specific_date);
  END IF;
END $$;

-- Allow freelancer_availability insert by owner
DROP POLICY IF EXISTS "fl_avail_insert_own" ON freelancer_availability;
CREATE POLICY "fl_avail_insert_own" ON freelancer_availability FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = freelancer_id);

DROP POLICY IF EXISTS "fl_avail_delete_own" ON freelancer_availability;
CREATE POLICY "fl_avail_delete_own" ON freelancer_availability FOR DELETE
  TO authenticated USING (auth.uid() = freelancer_id);

-- ============================================================
-- 9. INDEXES for performance
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_users_user_type ON users(user_type);
CREATE INDEX IF NOT EXISTS idx_users_city ON users(city);
CREATE INDEX IF NOT EXISTS idx_contracts_establishment ON contracts(establishment_id);
CREATE INDEX IF NOT EXISTS idx_contracts_freelancer ON contracts(freelancer_id);
CREATE INDEX IF NOT EXISTS idx_contracts_status ON contracts(status);
CREATE INDEX IF NOT EXISTS idx_jobs_status ON jobs(status);
CREATE INDEX IF NOT EXISTS idx_jobs_city ON jobs(city);
CREATE INDEX IF NOT EXISTS idx_wallet_user ON wallet_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_notif_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_events_contract ON contract_events(contract_id);
CREATE INDEX IF NOT EXISTS idx_reviews_to_user ON contract_reviews(to_user_id);
