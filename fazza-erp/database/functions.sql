-- ============================================
-- دوال نظام فزاع ERP
-- ============================================

-- دالة التحقق من صحة القيد المحاسبي
CREATE OR REPLACE FUNCTION validate_journal(p_journal_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    v_total_debit DECIMAL(18,2);
    v_total_credit DECIMAL(18,2);
    v_diff DECIMAL(18,2);
BEGIN
    SELECT 
        COALESCE(SUM(CASE WHEN entry_type = 'debit' THEN amount ELSE 0 END), 0),
        COALESCE(SUM(CASE WHEN entry_type = 'credit' THEN amount ELSE 0 END), 0)
    INTO v_total_debit, v_total_credit
    FROM journal_items
    WHERE journal_entry_id = p_journal_id;
    
    v_diff := ABS(v_total_debit - v_total_credit);
    
    IF v_diff > 0.001 THEN
        RAISE EXCEPTION 'القيد غير متوازن: الفرق = %', v_diff;
    END IF;
    
    UPDATE journal_entries 
    SET total_debit = v_total_debit, 
        total_credit = v_total_credit 
    WHERE id = p_journal_id;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- دالة إعادة حساب أرصدة الحسابات
CREATE OR REPLACE FUNCTION recalculate_accounts()
RETURNS VOID AS $$
DECLARE
    v_account RECORD;
    v_balance DECIMAL(18,2);
BEGIN
    FOR v_account IN SELECT id, account_type, opening_balance FROM chart_of_accounts WHERE is_active = true
    LOOP
        SELECT 
            COALESCE(SUM(CASE WHEN ji.entry_type = 'debit' THEN ji.amount ELSE 0 END), 0) -
            COALESCE(SUM(CASE WHEN ji.entry_type = 'credit' THEN ji.amount ELSE 0 END), 0)
        INTO v_balance
        FROM journal_items ji
        INNER JOIN journal_entries je ON ji.journal_entry_id = je.id
        WHERE ji.account_id = v_account.id 
          AND je.is_posted = true 
          AND je.deleted_at IS NULL;
        
        -- حسب نوع الحساب
        IF v_account.account_type IN ('asset', 'expense') THEN
            v_balance := v_account.opening_balance + v_balance;
        ELSIF v_account.account_type IN ('liability', 'equity', 'income') THEN
            v_balance := v_account.opening_balance - v_balance;
        END IF;
        
        UPDATE chart_of_accounts SET balance = v_balance, updated_at = NOW() WHERE id = v_account.id;
    END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- دالة ترحيل سند القبض
CREATE OR REPLACE FUNCTION post_receipt(p_receipt_id UUID)
RETURNS UUID AS $$
DECLARE
    v_receipt receipts%ROWTYPE;
    v_journal_id UUID;
    v_entry_number TEXT;
    v_cash_account_id UUID;
    v_receivable_account_id UUID;
    v_investor_code TEXT;
BEGIN
    SELECT * INTO v_receipt FROM receipts WHERE id = p_receipt_id;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'سند القبض غير موجود';
    END IF;
    
    IF v_receipt.is_posted THEN
        RAISE EXCEPTION 'سند القبض تم ترحيله مسبقاً';
    END IF;
    
    -- الحصول على حساب الصندوق/البنك
    SELECT id INTO v_cash_account_id FROM chart_of_accounts WHERE account_code = '1110' AND is_active = true;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'حساب الصندوق غير موجود';
    END IF;
    
    -- الحصول على حساب المستثمر
    SELECT code INTO v_investor_code FROM investors WHERE id = v_receipt.investor_id;
    
    SELECT id INTO v_receivable_account_id FROM chart_of_accounts WHERE account_code = '1310' AND is_active = true;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'حساب المستثمرين غير موجود';
    END IF;
    
    -- إنشاء رقم القيد
    v_entry_number := 'RV-' || TO_CHAR(CURRENT_DATE, 'YYYYMMDD') || '-' || FLOOR(RANDOM() * 10000)::TEXT;
    
    -- إنشاء القيد المحاسبي
    INSERT INTO journal_entries (
        entry_number, entry_date, reference_type, reference_id,
        description, total_debit, total_credit, is_posted, is_approved,
        created_by
    ) VALUES (
        v_entry_number, v_receipt.receipt_date, 'receipt', p_receipt_id,
        'سند قبض - ' || v_investor_code || ' - ' || COALESCE(v_receipt.description, ''),
        v_receipt.amount, v_receipt.amount, true, true,
        v_receipt.created_by
    ) RETURNING id INTO v_journal_id;
    
    -- مدين: الصندوق/البنك
    INSERT INTO journal_items (journal_entry_id, account_id, entry_type, amount, description, investor_id)
    VALUES (v_journal_id, v_cash_account_id, 'debit', v_receipt.amount, 'قبض من المستثمر ' || v_investor_code, v_receipt.investor_id);
    
    -- دائن: حساب المستثمر
    INSERT INTO journal_items (journal_entry_id, account_id, entry_type, amount, description, investor_id)
    VALUES (v_journal_id, v_receivable_account_id, 'credit', v_receipt.amount, 'قبض من المستثمر ' || v_investor_code, v_receipt.investor_id);
    
    -- تحديث سند القبض
    UPDATE receipts SET is_posted = true, journal_entry_id = v_journal_id, updated_at = NOW() WHERE id = p_receipt_id;
    
    -- تحديث رصيد المستثمر
    UPDATE investors SET 
        current_balance = current_balance + v_receipt.amount,
        updated_at = NOW()
    WHERE id = v_receipt.investor_id;
    
    -- إضافة حركة للمستثمر
    INSERT INTO investor_transactions (
        investor_id, transaction_type, amount, reference_type, reference_id,
        balance_before, balance_after, description, journal_entry_id, created_by
    ) VALUES (
        v_receipt.investor_id, 'investment', v_receipt.amount, 'receipt', p_receipt_id,
        (SELECT current_balance - v_receipt.amount FROM investors WHERE id = v_receipt.investor_id),
        (SELECT current_balance FROM investors WHERE id = v_receipt.investor_id),
        'إيداع استثماري', v_journal_id, v_receipt.created_by
    );
    
    -- إعادة حساب الأرصدة
    PERFORM recalculate_accounts();
    
    RETURN v_journal_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- دالة ترحيل سند الصرف
CREATE OR REPLACE FUNCTION post_payment(p_payment_id UUID)
RETURNS UUID AS $$
DECLARE
    v_payment payments%ROWTYPE;
    v_journal_id UUID;
    v_entry_number TEXT;
    v_cash_account_id UUID;
    v_payable_account_id UUID;
    v_investor_code TEXT;
    v_investor_balance DECIMAL(18,2);
BEGIN
    SELECT * INTO v_payment FROM payments WHERE id = p_payment_id;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'سند الصرف غير موجود';
    END IF;
    
    IF v_payment.is_posted THEN
        RAISE EXCEPTION 'سند الصرف تم ترحيله مسبقاً';
    END IF;
    
    -- التحقق من رصيد المستثمر
    SELECT current_balance INTO v_investor_balance FROM investors WHERE id = v_payment.investor_id;
    IF v_investor_balance < v_payment.amount THEN
        RAISE EXCEPTION 'رصيد المستثمر غير كافي: الرصيد = %', v_investor_balance;
    END IF;
    
    SELECT id INTO v_cash_account_id FROM chart_of_accounts WHERE account_code = '1110' AND is_active = true;
    SELECT id INTO v_payable_account_id FROM chart_of_accounts WHERE account_code = '1310' AND is_active = true;
    
    SELECT code INTO v_investor_code FROM investors WHERE id = v_payment.investor_id;
    
    v_entry_number := 'PM-' || TO_CHAR(CURRENT_DATE, 'YYYYMMDD') || '-' || FLOOR(RANDOM() * 10000)::TEXT;
    
    INSERT INTO journal_entries (
        entry_number, entry_date, reference_type, reference_id,
        description, total_debit, total_credit, is_posted, is_approved, created_by
    ) VALUES (
        v_entry_number, v_payment.payment_date, 'payment', p_payment_id,
        'سند صرف - ' || v_investor_code || ' - ' || COALESCE(v_payment.description, ''),
        v_payment.amount, v_payment.amount, true, true, v_payment.created_by
    ) RETURNING id INTO v_journal_id;
    
    -- مدين: حساب المستثمر
    INSERT INTO journal_items (journal_entry_id, account_id, entry_type, amount, description, investor_id)
    VALUES (v_journal_id, v_payable_account_id, 'debit', v_payment.amount, 'صرف للمستثمر ' || v_investor_code, v_payment.investor_id);
    
    -- دائن: الصندوق/البنك
    INSERT INTO journal_items (journal_entry_id, account_id, entry_type, amount, description, investor_id)
    VALUES (v_journal_id, v_cash_account_id, 'credit', v_payment.amount, 'صرف للمستثمر ' || v_investor_code, v_payment.investor_id);
    
    UPDATE payments SET is_posted = true, journal_entry_id = v_journal_id, updated_at = NOW() WHERE id = p_payment_id;
    
    UPDATE investors SET 
        current_balance = current_balance - v_payment.amount,
        total_withdrawn = total_withdrawn + v_payment.amount,
        updated_at = NOW()
    WHERE id = v_payment.investor_id;
    
    INSERT INTO investor_transactions (
        investor_id, transaction_type, amount, reference_type, reference_id,
        balance_before, balance_after, description, journal_entry_id, created_by
    ) VALUES (
        v_payment.investor_id, 'withdrawal', v_payment.amount, 'payment', p_payment_id,
        v_investor_balance,
        (SELECT current_balance FROM investors WHERE id = v_payment.investor_id),
        'سحب / صرف', v_journal_id, v_payment.created_by
    );
    
    PERFORM recalculate_accounts();
    
    RETURN v_journal_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- دالة ترحيل توزيع الأرباح
CREATE OR REPLACE FUNCTION post_profit_distribution(p_distribution_id UUID)
RETURNS UUID AS $$
DECLARE
    v_distribution profit_distributions%ROWTYPE;
    v_journal_id UUID;
    v_entry_number TEXT;
    v_retained_earnings_id UUID;
    v_payable_account_id UUID;
    v_item RECORD;
BEGIN
    SELECT * INTO v_distribution FROM profit_distributions WHERE id = p_distribution_id;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'توزيع الأرباح غير موجود';
    END IF;
    
    IF v_distribution.is_posted THEN
        RAISE EXCEPTION 'توزيع الأرباح تم ترحيله مسبقاً';
    END IF;
    
    SELECT id INTO v_retained_earnings_id FROM chart_of_accounts WHERE account_code = '3200' AND is_active = true;
    IF NOT FOUND THEN
        SELECT id INTO v_retained_earnings_id FROM chart_of_accounts WHERE account_type = 'equity' AND is_active = true LIMIT 1;
    END IF;
    
    SELECT id INTO v_payable_account_id FROM chart_of_accounts WHERE account_code = '1310' AND is_active = true;
    
    v_entry_number := 'PD-' || TO_CHAR(CURRENT_DATE, 'YYYYMMDD') || '-' || FLOOR(RANDOM() * 10000)::TEXT;
    
    INSERT INTO journal_entries (
        entry_number, entry_date, reference_type, reference_id,
        description, total_debit, total_credit, is_posted, is_approved, created_by
    ) VALUES (
        v_entry_number, v_distribution.distribution_date, 'profit_distribution', p_distribution_id,
        'توزيع أرباح - ' || COALESCE(v_distribution.notes, ''),
        v_distribution.total_distributed, v_distribution.total_distributed, true, true, v_distribution.created_by
    ) RETURNING id INTO v_journal_id;
    
    -- مدين: الأرباح المحتجزة
    INSERT INTO journal_items (journal_entry_id, account_id, entry_type, amount, description)
    VALUES (v_journal_id, v_retained_earnings_id, 'debit', v_distribution.total_distributed, 'توزيع أرباح');
    
    -- دائن: لكل مستثمر حصته
    FOR v_item IN SELECT * FROM profit_distribution_items WHERE distribution_id = p_distribution_id
    LOOP
        INSERT INTO journal_items (journal_entry_id, account_id, entry_type, amount, description, investor_id)
        VALUES (v_journal_id, v_payable_account_id, 'credit', v_item.profit_amount, 
                'أرباح مستحقة - ' || (SELECT full_name FROM investors WHERE id = v_item.investor_id), v_item.investor_id);
        
        -- تحديث أرباح المستثمر
        UPDATE investors SET 
            total_profit_earned = total_profit_earned + v_item.profit_amount,
            updated_at = NOW()
        WHERE id = v_item.investor_id;
        
        INSERT INTO investor_transactions (
            investor_id, transaction_type, amount, reference_type, reference_id,
            balance_before, balance_after, description, journal_entry_id, created_by
        ) VALUES (
            v_item.investor_id, 'profit_distribution', v_item.profit_amount, 'profit_distribution', p_distribution_id,
            (SELECT total_profit_earned - v_item.profit_amount FROM investors WHERE id = v_item.investor_id),
            (SELECT total_profit_earned FROM investors WHERE id = v_item.investor_id),
            'توزيع أرباح', v_journal_id, v_distribution.created_by
        );
        
        UPDATE profit_distribution_items SET is_paid = true, paid_at = NOW() WHERE id = v_item.id;
    END LOOP;
    
    UPDATE profit_distributions SET is_posted = true, journal_entry_id = v_journal_id, updated_at = NOW() WHERE id = p_distribution_id;
    
    PERFORM recalculate_accounts();
    
    RETURN v_journal_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- دالة الحصول على رصيد المستثمر
CREATE OR REPLACE FUNCTION get_investor_balance(p_investor_id UUID)
RETURNS DECIMAL(18,2) AS $$
DECLARE
    v_balance DECIMAL(18,2);
BEGIN
    SELECT current_balance INTO v_balance FROM investors WHERE id = p_investor_id;
    RETURN COALESCE(v_balance, 0);
END;
$$ LANGUAGE plpgsql STABLE;

-- دالة ميزان المراجعة
CREATE OR REPLACE FUNCTION get_trial_balance(p_start_date DATE DEFAULT NULL, p_end_date DATE DEFAULT NULL)
RETURNS TABLE (
    account_code VARCHAR,
    account_name VARCHAR,
    account_type account_type,
    opening_balance DECIMAL(18,2),
    total_debit DECIMAL(18,2),
    total_credit DECIMAL(18,2),
    net_debit DECIMAL(18,2),
    net_credit DECIMAL(18,2),
    closing_balance DECIMAL(18,2)
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        coa.account_code,
        coa.account_name,
        coa.account_type,
        coa.opening_balance,
        COALESCE(debits.total, 0) AS total_debit,
        COALESCE(credits.total, 0) AS total_credit,
        CASE WHEN COALESCE(debits.total, 0) > COALESCE(credits.total, 0) 
             THEN COALESCE(debits.total, 0) - COALESCE(credits.total, 0) ELSE 0 END AS net_debit,
        CASE WHEN COALESCE(credits.total, 0) > COALESCE(debits.total, 0) 
             THEN COALESCE(credits.total, 0) - COALESCE(debits.total, 0) ELSE 0 END AS net_credit,
        coa.opening_balance + 
        CASE 
            WHEN coa.account_type IN ('asset', 'expense') THEN 
                COALESCE(debits.total, 0) - COALESCE(credits.total, 0)
            ELSE 
                COALESCE(credits.total, 0) - COALESCE(debits.total, 0)
        END AS closing_balance
    FROM chart_of_accounts coa
    LEFT JOIN (
        SELECT account_id, SUM(amount) AS total
        FROM journal_items ji
        INNER JOIN journal_entries je ON ji.journal_entry_id = je.id
        WHERE ji.entry_type = 'debit' AND je.is_posted = true AND je.deleted_at IS NULL
          AND (p_start_date IS NULL OR je.entry_date >= p_start_date)
          AND (p_end_date IS NULL OR je.entry_date <= p_end_date)
        GROUP BY account_id
    ) debits ON coa.id = debits.account_id
    LEFT JOIN (
        SELECT account_id, SUM(amount) AS total
        FROM journal_items ji
        INNER JOIN journal_entries je ON ji.journal_entry_id = je.id
        WHERE ji.entry_type = 'credit' AND je.is_posted = true AND je.deleted_at IS NULL
          AND (p_start_date IS NULL OR je.entry_date >= p_start_date)
          AND (p_end_date IS NULL OR je.entry_date <= p_end_date)
        GROUP BY account_id
    ) credits ON coa.id = credits.account_id
    WHERE coa.is_active = true AND coa.deleted_at IS NULL
    ORDER BY coa.account_code;
END;
$$ LANGUAGE plpgsql STABLE;

-- دالة الميزانية العمومية
CREATE OR REPLACE FUNCTION get_balance_sheet(p_as_of_date DATE DEFAULT CURRENT_DATE)
RETURNS TABLE (
    account_code VARCHAR,
    account_name VARCHAR,
    account_type account_type,
    balance DECIMAL(18,2)
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        coa.account_code,
        coa.account_name,
        coa.account_type,
        coa.balance
    FROM chart_of_accounts coa
    WHERE coa.account_type IN ('asset', 'liability', 'equity')
      AND coa.is_active = true 
      AND coa.deleted_at IS NULL
    ORDER BY coa.account_code;
END;
$$ LANGUAGE plpgsql STABLE;

-- دالة قائمة الدخل
CREATE OR REPLACE FUNCTION get_income_statement(p_start_date DATE, p_end_date DATE)
RETURNS TABLE (
    account_code VARCHAR,
    account_name VARCHAR,
    account_type account_type,
    balance DECIMAL(18,2)
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        coa.account_code,
        coa.account_name,
        coa.account_type,
        COALESCE(SUM(CASE WHEN ji.entry_type = 'credit' THEN ji.amount ELSE -ji.amount END), 0) AS balance
    FROM chart_of_accounts coa
    LEFT JOIN journal_items ji ON coa.id = ji.account_id
    LEFT JOIN journal_entries je ON ji.journal_entry_id = je.id
    WHERE coa.account_type IN ('income', 'expense')
      AND coa.is_active = true 
      AND coa.deleted_at IS NULL
      AND je.is_posted = true
      AND je.deleted_at IS NULL
      AND je.entry_date BETWEEN p_start_date AND p_end_date
    GROUP BY coa.id, coa.account_code, coa.account_name, coa.account_type
    ORDER BY coa.account_code;
END;
$$ LANGUAGE plpgsql STABLE;
