-- ============================================
-- Triggers نظام فزاع ERP
-- ============================================

-- دالة مساعدة لتسجيل التدقيق
CREATE OR REPLACE FUNCTION fn_audit_log()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        INSERT INTO audit_logs (table_name, record_id, action, new_data, changed_by)
        VALUES (TG_TABLE_NAME, NEW.id, 'INSERT', to_jsonb(NEW), NEW.created_by);
    ELSIF TG_OP = 'UPDATE' THEN
        INSERT INTO audit_logs (table_name, record_id, action, old_data, new_data, changed_by)
        VALUES (TG_TABLE_NAME, NEW.id, 'UPDATE', to_jsonb(OLD), to_jsonb(NEW), NEW.updated_by);
    ELSIF TG_OP = 'DELETE' THEN
        INSERT INTO audit_logs (table_name, record_id, action, old_data, changed_by)
        VALUES (TG_TABLE_NAME, OLD.id, 'DELETE', to_jsonb(OLD), OLD.deleted_by);
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- دالة لتحديث updated_at تلقائياً
CREATE OR REPLACE FUNCTION fn_update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- دالة منع حذف القيود المرحلة
CREATE OR REPLACE FUNCTION fn_prevent_delete_posted_journal()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.is_posted = true THEN
        RAISE EXCEPTION 'لا يمكن حذف قيد مرحل';
    END IF;
    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- دالة منع تعديل القيود المرحلة
CREATE OR REPLACE FUNCTION fn_prevent_update_posted_journal()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.is_posted = true AND (
        NEW.entry_date != OLD.entry_date OR
        NEW.total_debit != OLD.total_debit OR
        NEW.total_credit != OLD.total_credit
    ) THEN
        RAISE EXCEPTION 'لا يمكن تعديل قيد مرحل';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- دالة إنشاء إشعار عند توزيع الأرباح
CREATE OR REPLACE FUNCTION fn_notify_profit_distribution()
RETURNS TRIGGER AS $$
DECLARE
    v_user RECORD;
    v_item RECORD;
BEGIN
    IF NEW.is_posted = true AND OLD.is_posted = false THEN
        FOR v_user IN SELECT id FROM users WHERE role IN ('superadmin', 'cfo') AND is_active = true AND deleted_at IS NULL
        LOOP
            INSERT INTO notifications (user_id, title, message, type, link)
            VALUES (v_user.id, 'توزيع أرباح جديد', 
                    'تم ترحيل توزيع أرباح بقيمة ' || NEW.total_distributed::TEXT || ' ريال',
                    'success', '/profit-distributions/' || NEW.id);
        END LOOP;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- تطبيق Triggers
CREATE TRIGGER trg_users_audit AFTER INSERT OR UPDATE OR DELETE ON users FOR EACH ROW EXECUTE FUNCTION fn_audit_log();
CREATE TRIGGER trg_users_timestamp BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION fn_update_timestamp();
CREATE TRIGGER trg_investors_audit AFTER INSERT OR UPDATE OR DELETE ON investors FOR EACH ROW EXECUTE FUNCTION fn_audit_log();
CREATE TRIGGER trg_investors_timestamp BEFORE UPDATE ON investors FOR EACH ROW EXECUTE FUNCTION fn_update_timestamp();
CREATE TRIGGER trg_contracts_audit AFTER INSERT OR UPDATE OR DELETE ON contracts FOR EACH ROW EXECUTE FUNCTION fn_audit_log();
CREATE TRIGGER trg_contracts_timestamp BEFORE UPDATE ON contracts FOR EACH ROW EXECUTE FUNCTION fn_update_timestamp();
CREATE TRIGGER trg_journal_entries_audit AFTER INSERT OR UPDATE OR DELETE ON journal_entries FOR EACH ROW EXECUTE FUNCTION fn_audit_log();
CREATE TRIGGER trg_journal_entries_timestamp BEFORE UPDATE ON journal_entries FOR EACH ROW EXECUTE FUNCTION fn_update_timestamp();
CREATE TRIGGER trg_journal_entries_prevent_delete BEFORE DELETE ON journal_entries FOR EACH ROW EXECUTE FUNCTION fn_prevent_delete_posted_journal();
CREATE TRIGGER trg_journal_entries_prevent_update BEFORE UPDATE ON journal_entries FOR EACH ROW EXECUTE FUNCTION fn_prevent_update_posted_journal();
CREATE TRIGGER trg_receipts_audit AFTER INSERT OR UPDATE OR DELETE ON receipts FOR EACH ROW EXECUTE FUNCTION fn_audit_log();
CREATE TRIGGER trg_receipts_timestamp BEFORE UPDATE ON receipts FOR EACH ROW EXECUTE FUNCTION fn_update_timestamp();
CREATE TRIGGER trg_payments_audit AFTER INSERT OR UPDATE OR DELETE ON payments FOR EACH ROW EXECUTE FUNCTION fn_audit_log();
CREATE TRIGGER trg_payments_timestamp BEFORE UPDATE ON payments FOR EACH ROW EXECUTE FUNCTION fn_update_timestamp();
CREATE TRIGGER trg_profit_distributions_audit AFTER INSERT OR UPDATE OR DELETE ON profit_distributions FOR EACH ROW EXECUTE FUNCTION fn_audit_log();
CREATE TRIGGER trg_profit_distributions_timestamp BEFORE UPDATE ON profit_distributions FOR EACH ROW EXECUTE FUNCTION fn_update_timestamp();
CREATE TRIGGER trg_profit_distributions_notify AFTER UPDATE ON profit_distributions FOR EACH ROW EXECUTE FUNCTION fn_notify_profit_distribution();
