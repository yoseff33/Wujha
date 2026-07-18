-- ============================================
-- Seed Data - نظام فزاع ERP
-- ============================================

-- إدراج شجرة الحسابات
INSERT INTO chart_of_accounts (account_code, account_name, account_name_en, account_type, is_parent, level, opening_balance) VALUES
('1', 'الأصول', 'Assets', 'asset', true, 1, 0),
('11', 'الأصول المتداولة', 'Current Assets', 'asset', true, 2, 0),
('111', 'النقد وما يعادله', 'Cash & Equivalents', 'asset', true, 3, 0),
('1110', 'الصندوق', 'Cash on Hand', 'asset', false, 4, 0),
('1111', 'البنك', 'Bank Account', 'asset', false, 4, 0),
('112', 'المدينون', 'Accounts Receivable', 'asset', false, 3, 0),
('12', 'الأصول غير المتداولة', 'Non-Current Assets', 'asset', true, 2, 0),
('121', 'الممتلكات والمعدات', 'Property & Equipment', 'asset', false, 3, 0),
('13', 'استثمارات', 'Investments', 'asset', true, 2, 0),
('131', 'استثمارات المضاربة', 'Mudaraba Investments', 'asset', true, 3, 0),
('1310', 'حسابات المستثمرين', 'Investor Accounts', 'asset', false, 4, 0),

('2', 'الخصوم', 'Liabilities', 'liability', true, 1, 0),
('21', 'الخصوم المتداولة', 'Current Liabilities', 'liability', true, 2, 0),
('211', 'الدائنون', 'Accounts Payable', 'liability', false, 3, 0),
('212', 'أرباح مستحقة الدفع', 'Profit Payable', 'liability', false, 3, 0),
('22', 'الخصوم غير المتداولة', 'Non-Current Liabilities', 'liability', true, 2, 0),

('3', 'حقوق الملكية', 'Equity', 'equity', true, 1, 0),
('31', 'رأس المال', 'Capital', 'equity', false, 2, 0),
('32', 'الأرباح المحتجزة', 'Retained Earnings', 'equity', false, 2, 0),
('3200', 'الأرباح المحتجزة', 'Retained Earnings', 'equity', false, 3, 0),
('33', 'أرباح الفترة', 'Current Period Profit', 'equity', false, 2, 0),

('4', 'الإيرادات', 'Income', 'income', true, 1, 0),
('41', 'إيرادات المضاربة', 'Mudaraba Income', 'income', false, 2, 0),
('42', 'إيرادات استثمارية', 'Investment Income', 'income', false, 2, 0),
('43', 'إيرادات أخرى', 'Other Income', 'income', false, 2, 0),

('5', 'المصروفات', 'Expenses', 'expense', true, 1, 0),
('51', 'المصروفات التشغيلية', 'Operating Expenses', 'expense', false, 2, 0),
('52', 'الرواتب والأجور', 'Salaries & Wages', 'expense', false, 2, 0),
('53', 'مصروفات إدارية', 'Administrative Expenses', 'expense', false, 2, 0);

-- إدراج إعدادات افتراضية
INSERT INTO settings (key, value, description) VALUES
('company_name', 'شركة فزاع', 'اسم الشركة'),
('company_name_en', 'Fazza Company', 'Company name in English'),
('company_phone', '+966500000000', 'رقم الهاتف'),
('company_email', 'info@fazza.sa', 'البريد الإلكتروني'),
('company_address', 'المملكة العربية السعودية', 'العنوان'),
('company_cr', '1010101010', 'السجل التجاري'),
('company_vat', '300000000000003', 'الرقم الضريبي'),
('fiscal_year_start', '01-01', 'بداية السنة المالية'),
('currency', 'SAR', 'العملة'),
('currency_symbol', 'ريال', 'رمز العملة'),
('date_format', 'YYYY-MM-DD', 'تنسيق التاريخ'),
('language', 'ar', 'اللغة الافتراضية');
