-- ============================================================
-- FreelaAgora — Schema simples (rode no SQL Editor do Supabase)
-- Cole tudo isto no SQL Editor do projeto okfaruag e clique em Run.
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Tabela única: o estado inteiro do app fica num JSONB.
-- Simples, preserva todas as funcionalidades atuais.
CREATE TABLE IF NOT EXISTS app_state (
  id text PRIMARY KEY DEFAULT 'freelaagora',
  data jsonb NOT NULL DEFAULT '{}',
  updated_at timestamptz NOT NULL DEFAULT now()
);

INSERT INTO app_state (id, data) VALUES ('freelaagora', '{}')
  ON CONFLICT (id) DO NOTHING;

ALTER TABLE app_state ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_all_app_state" ON app_state;
CREATE POLICY "anon_all_app_state" ON app_state
  FOR ALL TO anon, authenticated
  USING (true) WITH CHECK (true);
