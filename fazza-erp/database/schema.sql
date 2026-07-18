-- ============================================
-- نظام فزاع ERP - مخطط قاعدة البيانات
-- Supabase PostgreSQL
-- ============================================

-- تفعيل الامتدادات
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================
-- ENUMs
-- ============================================
CREATE TYPE user_role AS ENUM ('superadmin', 'cfo', 'accountant');
CREATE TYPE transaction_type AS ENUM ('receipt', 'payment', 'journal', 'profit_distribution', 'investment', 'withdrawal');
CREATE TYPE entry_type AS ENUM ('debit', 'credit');
CREATE TYPE account_type AS ENUM ('asset', 'liability', 'equity', 'income', 'expense');
CREATE TYPE contract_status AS ENUM ('active', 'completed', 'terminated', 'suspended');
CREATE TYPE notification_type AS ENUM ('info', 'warning', 'success', 'error');
CREATE TYPE file_category AS ENUM ('contract', 'receipt', 'payment', 'report', 'other');

-- ============================================
-- المستخدمين
-- ============================================
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    auth_id UUID UNIQUE,
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(50),
    role user_role NOT NULL DEFAULT 'accountant',
    is_active BOOLEAN DEFAULT true,
    last_login TIMESTAMPTZ,
    avatar_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ,
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id),
    deleted_by UUID REFERENCES users(id)
);

-- ============================================
-- المستثمرون
-- ============================================
CREATE TABLE investors (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(50) UNIQUE NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(50),
    national_id VARCHAR(50) UNIQUE,
    address TEXT,
    bank_name VARCHAR(255),
    bank_account VARCHAR(100),
    iban VARCHAR(100),
    investment_capital DECIMAL(18,2) NOT NULL DEFAULT 0,
    profit_share_percentage DECIMAL(5,2) NOT NULL DEFAULT 0,
    current_balance DECIMAL(18,2) NOT NULL DEFAULT 0,
    total_profit_earned DECIMAL(18,2) NOT NULL DEFAULT 0,
    total_withdrawn DECIMAL(18,2) NOT NULL DEFAULT 0,
    status VARCHAR(50) DEFAULT 'active',
    join_date DATE DEFAULT CURRENT_DATE,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ,
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id),
    deleted_by UUID REFERENCES users(id)
);

-- ============================================
-- العقود
-- ============================================
CREATE TABLE contracts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    contract_number VARCHAR(100) UNIQUE NOT NULL,
    investor_id UUID NOT NULL REFERENCES investors(id) ON DELETE RESTRICT,
    contract_type VARCHAR(100) NOT NULL DEFAULT 'mudaraba',
    title VARCHAR(255) NOT NULL,
    description TEXT,
    amount DECIMAL(18,2) NOT NULL,
    profit_sharing_ratio DECIMAL(5,2),
    start_date DATE NOT NULL,
    end_date DATE,
    status contract_status DEFAULT 'active',
    terms TEXT,
    signed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ,
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id),
    deleted_by UUID REFERENCES users(id)
);

-- ============================================
-- دليل الحسابات (شجرة الحسابات)
-- ============================================
CREATE TABLE chart_of_accounts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    account_code VARCHAR(20) UNIQUE NOT NULL,
    parent_id UUID REFERENCES chart_of_accounts(id),
    account_name VARCHAR(255) NOT NULL,
    account_name_en VARCHAR(255),
    account_type account_type NOT NULL,
    is_parent BOOLEAN DEFAULT false,
    level INT DEFAULT 0,
    balance DECIMAL(18,2) DEFAULT 0,
    opening_balance DECIMAL(18,2) DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ,
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id)
);

-- ============================================
-- قيود اليومية
-- ============================================
CREATE TABLE journal_entries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    entry_number VARCHAR(100) UNIQUE NOT NULL,
    entry_date DATE NOT NULL DEFAULT CURRENT_DATE,
    reference_type transaction_type NOT NULL,
    reference_id UUID,
    description TEXT,
    total_debit DECIMAL(18,2) NOT NULL DEFAULT 0,
    total_credit DECIMAL(18,2) NOT NULL DEFAULT 0,
    is_posted BOOLEAN DEFAULT false,
    is_approved BOOLEAN DEFAULT false,
    approved_by UUID REFERENCES users(id),
    approved_at TIMESTAMPTZ,
    fiscal_period VARCHAR(20),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ,
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id),
    deleted_by UUID REFERENCES users(id),
    CONSTRAINT chk_balance CHECK (ABS(total_debit - total_credit) < 0.001)
);

-- ============================================
-- بنود القيد
-- ============================================
CREATE TABLE journal_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    journal_entry_id UUID NOT NULL REFERENCES journal_entries(id) ON DELETE CASCADE,
    account_id UUID NOT NULL REFERENCES chart_of_accounts(id),
    entry_type entry_type NOT NULL,
    amount DECIMAL(18,2) NOT NULL,
    description TEXT,
    investor_id UUID REFERENCES investors(id),
    contract_id UUID REFERENCES contracts(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- سندات القبض
-- ============================================
CREATE TABLE receipts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    receipt_number VARCHAR(100) UNIQUE NOT NULL,
    receipt_date DATE NOT NULL DEFAULT CURRENT_DATE,
    investor_id UUID NOT NULL REFERENCES investors(id),
    amount DECIMAL(18,2) NOT NULL,
    payment_method VARCHAR(50) DEFAULT 'bank_transfer',
    reference_number VARCHAR(100),
    description TEXT,
    journal_entry_id UUID REFERENCES journal_entries(id),
    is_posted BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ,
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id),
    deleted_by UUID REFERENCES users(id)
);

-- ============================================
-- سندات الصرف
-- ============================================
CREATE TABLE payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    payment_number VARCHAR(100) UNIQUE NOT NULL,
    payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
    investor_id UUID REFERENCES investors(id),
    amount DECIMAL(18,2) NOT NULL,
    payment_type VARCHAR(50) DEFAULT 'profit_withdrawal',
    payment_method VARCHAR(50) DEFAULT 'bank_transfer',
    reference_number VARCHAR(100),
    description TEXT,
    journal_entry_id UUID REFERENCES journal_entries(id),
    is_posted BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ,
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id),
    deleted_by UUID REFERENCES users(id)
);

-- ============================================
-- توزيعات الأرباح
-- ============================================
CREATE TABLE profit_distributions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    distribution_number VARCHAR(100) UNIQUE NOT NULL,
    distribution_date DATE NOT NULL DEFAULT CURRENT_DATE,
    period_start DATE,
    period_end DATE,
    total_profit DECIMAL(18,2) NOT NULL,
    total_distributed DECIMAL(18,2) NOT NULL DEFAULT 0,
    notes TEXT,
    journal_entry_id UUID REFERENCES journal_entries(id),
    is_posted BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ,
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id),
    deleted_by UUID REFERENCES users(id)
);

-- ============================================
-- تفاصيل توزيع الأرباح لكل مستثمر
-- ============================================
CREATE TABLE profit_distribution_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    distribution_id UUID NOT NULL REFERENCES profit_distributions(id) ON DELETE CASCADE,
    investor_id UUID NOT NULL REFERENCES investors(id),
    share_percentage DECIMAL(5,2) NOT NULL,
    profit_amount DECIMAL(18,2) NOT NULL,
    is_paid BOOLEAN DEFAULT false,
    paid_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- حركات المستثمرين
-- ============================================
CREATE TABLE investor_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    investor_id UUID NOT NULL REFERENCES investors(id),
    transaction_type transaction_type NOT NULL,
    amount DECIMAL(18,2) NOT NULL,
    reference_type VARCHAR(50),
    reference_id UUID,
    balance_before DECIMAL(18,2) DEFAULT 0,
    balance_after DECIMAL(18,2) DEFAULT 0,
    description TEXT,
    journal_entry_id UUID REFERENCES journal_entries(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES users(id)
);

-- ============================================
-- سجل التدقيق
-- ============================================
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    table_name VARCHAR(100) NOT NULL,
    record_id UUID NOT NULL,
    action VARCHAR(50) NOT NULL,
    old_data JSONB,
    new_data JSONB,
    changed_by UUID REFERENCES users(id),
    changed_at TIMESTAMPTZ DEFAULT NOW(),
    ip_address VARCHAR(50),
    user_agent TEXT
);

-- ============================================
-- الإشعارات
-- ============================================
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id),
    title VARCHAR(255) NOT NULL,
    message TEXT,
    type notification_type DEFAULT 'info',
    is_read BOOLEAN DEFAULT false,
    link VARCHAR(500),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- الملفات
-- ============================================
CREATE TABLE files (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    file_name VARCHAR(255) NOT NULL,
    original_name VARCHAR(255) NOT NULL,
    file_path TEXT NOT NULL,
    file_size BIGINT,
    mime_type VARCHAR(100),
    category file_category DEFAULT 'other',
    reference_type VARCHAR(50),
    reference_id UUID,
    uploaded_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

-- ============================================
-- الإعدادات
-- ============================================
CREATE TABLE settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    key VARCHAR(100) UNIQUE NOT NULL,
    value TEXT,
    description TEXT,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    updated_by UUID REFERENCES users(id)
);

-- ============================================
-- سجل النظام
-- ============================================
CREATE TABLE system_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    level VARCHAR(20) DEFAULT 'info',
    module VARCHAR(100),
    message TEXT,
    details JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    user_id UUID REFERENCES users(id)
);

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_investors_code ON investors(code);
CREATE INDEX idx_investors_status ON investors(status);
CREATE INDEX idx_contracts_investor ON contracts(investor_id);
CREATE INDEX idx_contracts_status ON contracts(status);
CREATE INDEX idx_chart_of_accounts_code ON chart_of_accounts(account_code);
CREATE INDEX idx_chart_of_accounts_parent ON chart_of_accounts(parent_id);
CREATE INDEX idx_chart_of_accounts_type ON chart_of_accounts(account_type);
CREATE INDEX idx_journal_entries_date ON journal_entries(entry_date);
CREATE INDEX idx_journal_entries_number ON journal_entries(entry_number);
CREATE INDEX idx_journal_entries_reference ON journal_entries(reference_type, reference_id);
CREATE INDEX idx_journal_items_entry ON journal_items(journal_entry_id);
CREATE INDEX idx_journal_items_account ON journal_items(account_id);
CREATE INDEX idx_receipts_investor ON receipts(investor_id);
CREATE INDEX idx_receipts_date ON receipts(receipt_date);
CREATE INDEX idx_payments_investor ON payments(investor_id);
CREATE INDEX idx_payments_date ON payments(payment_date);
CREATE INDEX idx_profit_distributions_date ON profit_distributions(distribution_date);
CREATE INDEX idx_investor_transactions_investor ON investor_transactions(investor_id);
CREATE INDEX idx_investor_transactions_type ON investor_transactions(transaction_type);
CREATE INDEX idx_investor_transactions_date ON investor_transactions(created_at);
CREATE INDEX idx_audit_logs_table ON audit_logs(table_name, record_id);
CREATE INDEX idx_audit_logs_date ON audit_logs(changed_at);
CREATE INDEX idx_notifications_user ON notifications(user_id, is_read);
CREATE INDEX idx_files_reference ON files(reference_type, reference_id);
CREATE INDEX idx_system_logs_date ON system_logs(created_at);
CREATE INDEX idx_system_logs_level ON system_logs(level);
