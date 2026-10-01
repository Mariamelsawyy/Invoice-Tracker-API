CREATE TABLE IF NOT EXISTS clients (
  id          SERIAL PRIMARY KEY,
  name        TEXT NOT NULL,
  email       TEXT NOT NULL UNIQUE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS invoices (
  id          SERIAL PRIMARY KEY,
  client_id   INTEGER NOT NULL REFERENCES clients(id) ON DELETE RESTRICT,
  amount      NUMERIC(12,2) NOT NULL CHECK (amount > 0),
  vat_rate    NUMERIC(5,2) NOT NULL DEFAULT 20.00 CHECK (vat_rate >= 0 AND vat_rate <= 100),
  status      TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'paid')),
  due_date    DATE NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_invoices_client_id ON invoices(client_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);