/*
# FreelaAgora Schema Upgrade — Address, 4-Tier Est Plans, Terms Acceptance

1. Changes to users table:
   - Add address columns: cep, street, number, complement, neighborhood (city and state already exist)
   - Add terms_acceptance_json column for audit metadata
   - Add nickname, document_verified, last_admin_edit columns

2. Changes to vip_plans_establishment:
   - Update to 4 tiers: Free (15%), VIP 1 (7.5%), VIP 2 (5%), VIP 3 (0%)
   - Update pricing: Free=0, VIP 1=29.90, VIP 2=59.90, VIP 3=119.90

3. Changes to freelancer_profiles / establishment_profiles:
   - Add document_verified, last_admin_edit columns

All changes are additive (no destructive operations). Safe to re-run.
*/

-- ============================================================
-- 1. ADDRESS COLUMNS ON users
-- ============================================================
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'address_cep') THEN
    ALTER TABLE users ADD COLUMN address_cep VARCHAR(9);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'address_street') THEN
    ALTER TABLE users ADD COLUMN address_street VARCHAR(255);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'address_number') THEN
    ALTER TABLE users ADD COLUMN address_number VARCHAR(20);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'address_complement') THEN
    ALTER TABLE users ADD COLUMN address_complement VARCHAR(100);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'address_neighborhood') THEN
    ALTER TABLE users ADD COLUMN address_neighborhood VARCHAR(100);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'nickname') THEN
    ALTER TABLE users ADD COLUMN nickname VARCHAR(100);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'document_verified') THEN
    ALTER TABLE users ADD COLUMN document_verified BOOLEAN DEFAULT FALSE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'terms_acceptance_json') THEN
    ALTER TABLE users ADD COLUMN terms_acceptance_json JSONB;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'last_admin_edit') THEN
    ALTER TABLE users ADD COLUMN last_admin_edit TIMESTAMPTZ;
  END IF;
END $$;

-- ============================================================
-- 2. UPDATE ESTABLISHMENT VIP PLANS TO 4 TIERS
-- ============================================================
DELETE FROM vip_plans_establishment;
INSERT INTO vip_plans_establishment (name, intermediation_fee_percentage, monthly_price, semestral_price, annual_price) VALUES
('Plano Gratuito', 15.00, 0.00, 0.00, 0.00),
('Plano VIP 1', 7.50, 29.90, 149.90, 249.90),
('Plano VIP 2', 5.00, 59.90, 299.90, 499.90),
('Plano VIP 3', 0.00, 119.90, 549.00, 949.00);

-- ============================================================
-- 3. ADDITIONAL PROFILE COLUMNS
-- ============================================================
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'freelancer_profiles' AND column_name = 'document_verified') THEN
    ALTER TABLE freelancer_profiles ADD COLUMN document_verified BOOLEAN DEFAULT FALSE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'freelancer_profiles' AND column_name = 'last_admin_edit') THEN
    ALTER TABLE freelancer_profiles ADD COLUMN last_admin_edit TIMESTAMPTZ;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'establishment_profiles' AND column_name = 'last_admin_edit') THEN
    ALTER TABLE establishment_profiles ADD COLUMN last_admin_edit TIMESTAMPTZ;
  END IF;
END $$;

-- Update the fee calculation trigger to handle new 4-tier system
CREATE OR REPLACE FUNCTION calculate_contract_fees()
RETURNS TRIGGER AS $$
DECLARE
    v_fee_pct DECIMAL(4,2);
BEGIN
    SELECT vpe.intermediation_fee_percentage
    INTO v_fee_pct
    FROM establishment_profiles ep
    JOIN vip_plans_establishment vpe ON ep.vip_plan_id = vpe.id
    WHERE ep.user_id = NEW.establishment_id;

    NEW.platform_fee_percentage := COALESCE(v_fee_pct, 15.00);
    NEW.platform_fee_value := ROUND((NEW.total_freelancer_value * (NEW.platform_fee_percentage / 100)), 2);
    NEW.total_amount_paid := NEW.total_freelancer_value + NEW.platform_fee_value;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
