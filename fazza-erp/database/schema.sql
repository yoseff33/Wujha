-- Schema for Fazza ERP

CREATE TABLE IF NOT EXISTS investors (
  id serial PRIMARY KEY,
  name text NOT NULL,
  email text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS receipts (
  id serial PRIMARY KEY,
  investor_id integer REFERENCES investors(id),
  amount numeric NOT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS payments (
  id serial PRIMARY KEY,
  investor_id integer REFERENCES investors(id),
  amount numeric NOT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS contracts (
  id serial PRIMARY KEY,
  investor_id integer REFERENCES investors(id),
  title text,
  signed_at date
);

-- Accounting example table
CREATE TABLE IF NOT EXISTS accounting_entries (
  id serial PRIMARY KEY,
  entry_date date NOT NULL,
  description text,
  amount numeric NOT NULL
);
