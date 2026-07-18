-- ============================================
-- RLS Policies - نظام فزاع ERP
-- النظام داخلي للمستخدمين فقط (SuperAdmin, CFO, Accountant)
-- لا يوجد مستثمرون يدخلون النظام
-- ============================================

-- تعطيل RLS لجميع الجداول (نظام داخلي)
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE investors DISABLE ROW LEVEL SECURITY;
ALTER TABLE contracts DISABLE ROW LEVEL SECURITY;
ALTER TABLE chart_of_accounts DISABLE ROW LEVEL SECURITY;
ALTER TABLE journal_entries DISABLE ROW LEVEL SECURITY;
ALTER TABLE journal_items DISABLE ROW LEVEL SECURITY;
ALTER TABLE receipts DISABLE ROW LEVEL SECURITY;
ALTER TABLE payments DISABLE ROW LEVEL SECURITY;
ALTER TABLE profit_distributions DISABLE ROW LEVEL SECURITY;
ALTER TABLE profit_distribution_items DISABLE ROW LEVEL SECURITY;
ALTER TABLE investor_transactions DISABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs DISABLE ROW LEVEL SECURITY;
ALTER TABLE notifications DISABLE ROW LEVEL SECURITY;
ALTER TABLE files DISABLE ROW LEVEL SECURITY;
ALTER TABLE settings DISABLE ROW LEVEL SECURITY;
ALTER TABLE system_logs DISABLE ROW LEVEL SECURITY;
