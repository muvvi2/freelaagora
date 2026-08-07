/*
# Add discount coupons and admin audit logs tables

1. New Tables
- `discount_coupons`: Marketing coupon codes with discount percentages, active toggle, and expiry.
  - `id` (serial, primary key)
  - `code` (varchar, unique) — the coupon code string
  - `discount_percentage` (decimal) — percentage off (0-100)
  - `is_active` (boolean, default true)
  - `expires_at` (timestamptz, nullable) — optional expiry date
  - `created_at` (timestamptz, default now)
- `admin_audit_logs`: Irreversible chronological log of every admin action for compliance.
  - `id` (uuid, primary key)
  - `admin_id` (uuid, nullable) — references users.id
  - `action_performed` (text) — description of the action
  - `target_user_id` (uuid, nullable) — the affected user if any
  - `created_at` (timestamptz, default now)

2. Security
- Enable RLS on both tables.
- Admin-only access: policies scoped to authenticated users with user_type = 'admin'.
  (The app has a sign-in screen, so TO authenticated with an admin check predicate.)
*/

CREATE TABLE IF NOT EXISTS discount_coupons (
    id SERIAL PRIMARY KEY,
    code VARCHAR(50) UNIQUE NOT NULL,
    discount_percentage DECIMAL(5,2) NOT NULL DEFAULT 0.00,
    is_active BOOLEAN DEFAULT TRUE,
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

CREATE TABLE IF NOT EXISTS admin_audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    admin_id UUID REFERENCES users(id),
    action_performed TEXT NOT NULL,
    target_user_id UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

ALTER TABLE discount_coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_audit_logs ENABLE ROW LEVEL SECURITY;

-- Admin-only policies for discount_coupons
DROP POLICY IF EXISTS "admin_select_coupons" ON discount_coupons;
CREATE POLICY "admin_select_coupons" ON discount_coupons FOR SELECT
  TO authenticated USING (
    EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.user_type = 'admin')
  );

DROP POLICY IF EXISTS "admin_insert_coupons" ON discount_coupons;
CREATE POLICY "admin_insert_coupons" ON discount_coupons FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.user_type = 'admin')
  );

DROP POLICY IF EXISTS "admin_update_coupons" ON discount_coupons;
CREATE POLICY "admin_update_coupons" ON discount_coupons FOR UPDATE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.user_type = 'admin')
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.user_type = 'admin')
  );

DROP POLICY IF EXISTS "admin_delete_coupons" ON discount_coupons;
CREATE POLICY "admin_delete_coupons" ON discount_coupons FOR DELETE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.user_type = 'admin')
  );

-- Admin-only policies for admin_audit_logs (insert + select, no update/delete)
DROP POLICY IF EXISTS "admin_select_audit_logs" ON admin_audit_logs;
CREATE POLICY "admin_select_audit_logs" ON admin_audit_logs FOR SELECT
  TO authenticated USING (
    EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.user_type = 'admin')
  );

DROP POLICY IF EXISTS "admin_insert_audit_logs" ON admin_audit_logs;
CREATE POLICY "admin_insert_audit_logs" ON admin_audit_logs FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.user_type = 'admin')
  );
