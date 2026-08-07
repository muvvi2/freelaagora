/*
# FreelaAgora Core Schema — Marketplace + Fintech

Creates the complete database for a dual-sided freelance marketplace with:
- Category catalog (12 Brazilian freelance industries)
- Users master table (freelancer, establishment, admin)
- VIP plan matrices for freelancers (4 tiers) and establishments (3 tiers with variable intermediation fees)
- Freelancer/establishment profiles with VIP plan references
- Weekly availability grid (7 days x 3 shifts)
- Contracts with escrow, variable platform fees, and auto-calculation trigger
- Notifications, reviews, wallet transactions, jobs

## Security (RLS)
- All tables have RLS enabled
- users: owner-scoped select/update, admin full access
- profiles: public select, owner-scoped update
- contracts: both parties + admin can read/update
- categories and VIP plans: public read
- Other tables: owner-scoped
*/

-- EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =========================================================================
-- 1. CATEGORIES
-- =========================================================================
CREATE TABLE IF NOT EXISTS categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

INSERT INTO categories (name) VALUES
('Segurança Privada'), ('Garçom / Garçonete'), ('Cozinheiro(a) / Auxiliar'),
('Barista / Bartender'), ('Limpeza / Diarista'), ('Recepcionista / Portaria'),
('Promotor(a) de Eventos'), ('Suporte de TI / Infraestrutura'), ('Motoboy / Entregador'),
('Montador(a) de Palco / Roadie'), ('Fotógrafo(a) / Videomaker'), ('DJ / Sonoplasta')
ON CONFLICT (name) DO NOTHING;

ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "public_read_categories" ON categories;
CREATE POLICY "public_read_categories" ON categories FOR SELECT TO anon, authenticated USING (true);

-- =========================================================================
-- 2. USERS
-- =========================================================================
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    user_type VARCHAR(20) CHECK (user_type IN ('freelancer', 'establishment', 'admin')) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    photo_url TEXT,
    document_cpf VARCHAR(14) UNIQUE,
    document_cnpj VARCHAR(18) UNIQUE,
    whatsapp VARCHAR(20) NOT NULL,
    phone_contact VARCHAR(20),
    city VARCHAR(100) NOT NULL,
    state CHAR(2) NOT NULL,
    banned BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "users_select_own_or_admin" ON users;
CREATE POLICY "users_select_own_or_admin" ON users FOR SELECT
    TO authenticated USING (auth.uid() = id OR EXISTS (SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.user_type = 'admin'));
DROP POLICY IF EXISTS "users_update_own" ON users;
CREATE POLICY "users_update_own" ON users FOR UPDATE
    TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- =========================================================================
-- 3. VIP PLAN MATRICES
-- =========================================================================
CREATE TABLE IF NOT EXISTS vip_plans_freelancer (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    max_categories INT NOT NULL,
    monthly_price DECIMAL(10,2) NOT NULL,
    semestral_price DECIMAL(10,2) NOT NULL,
    annual_price DECIMAL(10,2) NOT NULL,
    search_boost_level INT DEFAULT 0,
    badge_type VARCHAR(20) DEFAULT NULL
);

INSERT INTO vip_plans_freelancer (name, max_categories, monthly_price, semestral_price, annual_price, search_boost_level, badge_type) VALUES
('Free', 2, 0.00, 0.00, 0.00, 0, NULL),
('VIP 1', 4, 14.90, 59.90, 99.90, 1, NULL),
('VIP 2', 5, 24.90, 99.90, 169.90, 2, 'verified'),
('VIP 3', 999, 39.90, 159.90, 279.90, 3, 'diamond')
ON CONFLICT DO NOTHING;

CREATE TABLE IF NOT EXISTS vip_plans_establishment (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    intermediation_fee_percentage DECIMAL(4,2) NOT NULL,
    monthly_price DECIMAL(10,2) NOT NULL,
    semestral_price DECIMAL(10,2) NOT NULL,
    annual_price DECIMAL(10,2) NOT NULL
);

INSERT INTO vip_plans_establishment (name, intermediation_fee_percentage, monthly_price, semestral_price, annual_price) VALUES
('VIP 1 / Free', 7.50, 0.00, 0.00, 0.00),
('VIP 2 / Standard', 5.00, 49.90, 229.00, 399.00),
('VIP 3 / Premium', 0.00, 119.90, 549.00, 949.00)
ON CONFLICT DO NOTHING;

ALTER TABLE vip_plans_freelancer ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "public_read_vip_fl" ON vip_plans_freelancer;
CREATE POLICY "public_read_vip_fl" ON vip_plans_freelancer FOR SELECT TO anon, authenticated USING (true);

ALTER TABLE vip_plans_establishment ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "public_read_vip_es" ON vip_plans_establishment;
CREATE POLICY "public_read_vip_es" ON vip_plans_establishment FOR SELECT TO anon, authenticated USING (true);

-- =========================================================================
-- 4. PROFILES
-- =========================================================================
CREATE TABLE IF NOT EXISTS freelancer_profiles (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    bio TEXT,
    specialties TEXT[],
    hourly_rate DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    daily_rate DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    pix_key VARCHAR(255),
    vip_plan_id INT REFERENCES vip_plans_freelancer(id) DEFAULT 1,
    vip_expires_at TIMESTAMPTZ,
    rating_average DECIMAL(3,2) DEFAULT 5.0,
    reviews_count INT DEFAULT 0,
    completed_shifts INT DEFAULT 0,
    wallet_balance DECIMAL(10,2) DEFAULT 0.00,
    core_bank_account_id VARCHAR(255),
    is_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS establishment_profiles (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    company_description TEXT,
    establishment_type VARCHAR(100),
    address VARCHAR(255),
    vip_plan_id INT REFERENCES vip_plans_establishment(id) DEFAULT 1,
    vip_expires_at TIMESTAMPTZ,
    rating_average DECIMAL(3,2) DEFAULT 0.0,
    reviews_count INT DEFAULT 0,
    wallet_balance DECIMAL(10,2) DEFAULT 0.00,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

ALTER TABLE freelancer_profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "fl_profiles_select_all" ON freelancer_profiles;
CREATE POLICY "fl_profiles_select_all" ON freelancer_profiles FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "fl_profiles_update_own" ON freelancer_profiles;
CREATE POLICY "fl_profiles_update_own" ON freelancer_profiles FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "fl_profiles_insert_own" ON freelancer_profiles;
CREATE POLICY "fl_profiles_insert_own" ON freelancer_profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

ALTER TABLE establishment_profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "es_profiles_select_all" ON establishment_profiles;
CREATE POLICY "es_profiles_select_all" ON establishment_profiles FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "es_profiles_update_own" ON establishment_profiles;
CREATE POLICY "es_profiles_update_own" ON establishment_profiles FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "es_profiles_insert_own" ON establishment_profiles;
CREATE POLICY "es_profiles_insert_own" ON establishment_profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- =========================================================================
-- 5. CATEGORIES + AVAILABILITY
-- =========================================================================
CREATE TABLE IF NOT EXISTS freelancer_categories (
    freelancer_id UUID REFERENCES users(id) ON DELETE CASCADE,
    category_id INT REFERENCES categories(id) ON DELETE CASCADE,
    PRIMARY KEY (freelancer_id, category_id)
);

ALTER TABLE freelancer_categories ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "fl_cat_select_all" ON freelancer_categories;
CREATE POLICY "fl_cat_select_all" ON freelancer_categories FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "fl_cat_manage_own" ON freelancer_categories;
CREATE POLICY "fl_cat_manage_own" ON freelancer_categories FOR ALL TO authenticated USING (auth.uid() = freelancer_id) WITH CHECK (auth.uid() = freelancer_id);

CREATE TABLE IF NOT EXISTS freelancer_availability (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    freelancer_id UUID REFERENCES users(id) ON DELETE CASCADE,
    day_of_week INT CHECK (day_of_week BETWEEN 0 AND 6),
    shift_morning BOOLEAN DEFAULT FALSE,
    shift_afternoon BOOLEAN DEFAULT FALSE,
    shift_night BOOLEAN DEFAULT FALSE,
    UNIQUE(freelancer_id, day_of_week)
);

ALTER TABLE freelancer_availability ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "fl_avail_select_all" ON freelancer_availability;
CREATE POLICY "fl_avail_select_all" ON freelancer_availability FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "fl_avail_manage_own" ON freelancer_availability;
CREATE POLICY "fl_avail_manage_own" ON freelancer_availability FOR ALL TO authenticated USING (auth.uid() = freelancer_id) WITH CHECK (auth.uid() = freelancer_id);

-- =========================================================================
-- 6. CONTRACTS + ESCROW
-- =========================================================================
CREATE TABLE IF NOT EXISTS contracts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    establishment_id UUID REFERENCES users(id) ON DELETE RESTRICT,
    freelancer_id UUID REFERENCES users(id) ON DELETE RESTRICT,
    job_id UUID,
    contract_date DATE NOT NULL,
    shifts_contracted VARCHAR(50) NOT NULL,
    hours_contracted INT NOT NULL DEFAULT 1,
    total_freelancer_value DECIMAL(10,2) NOT NULL,
    platform_fee_percentage DECIMAL(4,2) NOT NULL,
    platform_fee_value DECIMAL(10,2) NOT NULL,
    total_amount_paid DECIMAL(10,2) NOT NULL,
    status VARCHAR(30) CHECK (status IN (
        'pending_admin_check', 'approved_by_admin', 'accepted_by_freela',
        'paid_escrow', 'check_in_done', 'completed_split', 'canceled'
    )) DEFAULT 'pending_admin_check',
    cora_invoice_id VARCHAR(255),
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

ALTER TABLE contracts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "contracts_select_parties" ON contracts;
CREATE POLICY "contracts_select_parties" ON contracts FOR SELECT
    TO authenticated USING (
        auth.uid() = establishment_id OR auth.uid() = freelancer_id OR
        EXISTS (SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.user_type = 'admin')
    );
DROP POLICY IF EXISTS "contracts_insert_parties" ON contracts;
CREATE POLICY "contracts_insert_parties" ON contracts FOR INSERT
    TO authenticated WITH CHECK (
        auth.uid() = establishment_id OR
        EXISTS (SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.user_type = 'admin')
    );
DROP POLICY IF EXISTS "contracts_update_parties" ON contracts;
CREATE POLICY "contracts_update_parties" ON contracts FOR UPDATE
    TO authenticated USING (
        auth.uid() = establishment_id OR auth.uid() = freelancer_id OR
        EXISTS (SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.user_type = 'admin')
    ) WITH CHECK (true);

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

    NEW.platform_fee_percentage := COALESCE(v_fee_pct, 7.50);
    NEW.platform_fee_value := ROUND((NEW.total_freelancer_value * (NEW.platform_fee_percentage / 100)), 2);
    NEW.total_amount_paid := NEW.total_freelancer_value + NEW.platform_fee_value;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_calculate_contract_fees ON contracts;
CREATE TRIGGER trg_calculate_contract_fees
BEFORE INSERT ON contracts
FOR EACH ROW
EXECUTE FUNCTION calculate_contract_fees();

-- =========================================================================
-- 7. WALLET TRANSACTIONS
-- =========================================================================
CREATE TABLE IF NOT EXISTS wallet_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(30) NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    description TEXT,
    contract_id UUID,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

ALTER TABLE wallet_transactions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "wallet_select_own_or_admin" ON wallet_transactions;
CREATE POLICY "wallet_select_own_or_admin" ON wallet_transactions FOR SELECT
    TO authenticated USING (
        auth.uid() = user_id OR
        EXISTS (SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.user_type = 'admin')
    );
DROP POLICY IF EXISTS "wallet_insert_own" ON wallet_transactions;
CREATE POLICY "wallet_insert_own" ON wallet_transactions FOR INSERT
    TO authenticated WITH CHECK (auth.uid() = user_id);

-- =========================================================================
-- 8. NOTIFICATIONS
-- =========================================================================
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(30) NOT NULL,
    title VARCHAR(255) NOT NULL,
    body TEXT,
    read BOOLEAN DEFAULT FALSE,
    contract_id UUID,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "notif_select_own" ON notifications;
CREATE POLICY "notif_select_own" ON notifications FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "notif_update_own" ON notifications;
CREATE POLICY "notif_update_own" ON notifications FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "notif_insert_own" ON notifications;
CREATE POLICY "notif_insert_own" ON notifications FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- =========================================================================
-- 9. REVIEWS
-- =========================================================================
CREATE TABLE IF NOT EXISTS reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    contract_id UUID REFERENCES contracts(id) ON DELETE CASCADE,
    from_user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    to_user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    rating INT CHECK (rating BETWEEN 1 AND 5) NOT NULL,
    comment TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "reviews_select_all" ON reviews;
CREATE POLICY "reviews_select_all" ON reviews FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "reviews_insert_own" ON reviews;
CREATE POLICY "reviews_insert_own" ON reviews FOR INSERT TO authenticated WITH CHECK (auth.uid() = from_user_id);

-- =========================================================================
-- 10. JOBS
-- =========================================================================
CREATE TABLE IF NOT EXISTS jobs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    establishment_id UUID REFERENCES users(id) ON DELETE CASCADE,
    category_id INT REFERENCES categories(id),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    job_date DATE NOT NULL,
    start_time VARCHAR(10) DEFAULT '18:00',
    hours INT NOT NULL DEFAULT 1,
    value DECIMAL(10,2) NOT NULL DEFAULT 0,
    urgency VARCHAR(20) DEFAULT 'esta_semana',
    status VARCHAR(20) DEFAULT 'active',
    city VARCHAR(100),
    state CHAR(2),
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "jobs_select_all" ON jobs;
CREATE POLICY "jobs_select_all" ON jobs FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "jobs_insert_own" ON jobs;
CREATE POLICY "jobs_insert_own" ON jobs FOR INSERT TO authenticated WITH CHECK (auth.uid() = establishment_id);
DROP POLICY IF EXISTS "jobs_update_own" ON jobs;
CREATE POLICY "jobs_update_own" ON jobs FOR UPDATE TO authenticated USING (auth.uid() = establishment_id) WITH CHECK (auth.uid() = establishment_id);
DROP POLICY IF EXISTS "jobs_delete_own" ON jobs;
CREATE POLICY "jobs_delete_own" ON jobs FOR DELETE TO authenticated USING (auth.uid() = establishment_id);
