import supabase from './supabaseClient';
import type {
  User, Investor, Contract, ChartOfAccount,
  JournalEntry, JournalItem, Receipt, Payment,
  ProfitDistribution, ProfitDistributionItem,
  InvestorTransaction, AuditLog, Notification,
  FileRecord, Setting, SystemLog,
  TrialBalanceRow, BalanceSheetRow, IncomeStatementRow,
  DashboardStats
} from '../types';

// ============================================
// Users API
// ============================================
export const usersApi = {
  getAll: async () => {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .is('deleted_at', null)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data as User[];
  },
  getById: async (id: string) => {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', id)
      .single();
    if (error) throw error;
    return data as User;
  },
  create: async (user: Partial<User>) => {
    const { data, error } = await supabase
      .from('users')
      .insert(user)
      .select()
      .single();
    if (error) throw error;
    return data as User;
  },
  update: async (id: string, user: Partial<User>) => {
    const { data, error } = await supabase
      .from('users')
      .update({ ...user, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data as User;
  },
  softDelete: async (id: string, deletedBy: string) => {
    const { error } = await supabase
      .from('users')
      .update({ deleted_at: new Date().toISOString(), deleted_by: deletedBy })
      .eq('id', id);
    if (error) throw error;
  }
};

// ============================================
// Investors API
// ============================================
export const investorsApi = {
  getAll: async () => {
    const { data, error } = await supabase
      .from('investors')
      .select('*')
      .is('deleted_at', null)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data as Investor[];
  },
  getById: async (id: string) => {
    const { data, error } = await supabase
      .from('investors')
      .select('*')
      .eq('id', id)
      .single();
    if (error) throw error;
    return data as Investor;
  },
  create: async (investor: Partial<Investor>) => {
    const { data, error } = await supabase
      .from('investors')
      .insert(investor)
      .select()
      .single();
    if (error) throw error;
    return data as Investor;
  },
  update: async (id: string, investor: Partial<Investor>) => {
    const { data, error } = await supabase
      .from('investors')
      .update({ ...investor, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data as Investor;
  },
  softDelete: async (id: string, deletedBy: string) => {
    const { error } = await supabase
      .from('investors')
      .update({ deleted_at: new Date().toISOString(), deleted_by: deletedBy })
      .eq('id', id);
    if (error) throw error;
  },
  getBalance: async (id: string) => {
    const { data, error } = await supabase
      .rpc('get_investor_balance', { p_investor_id: id });
    if (error) throw error;
    return data as number;
  },
  getTransactions: async (investorId: string) => {
    const { data, error } = await supabase
      .from('investor_transactions')
      .select('*')
      .eq('investor_id', investorId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data as InvestorTransaction[];
  }
};

// ============================================
// Contracts API
// ============================================
export const contractsApi = {
  getAll: async () => {
    const { data, error } = await supabase
      .from('contracts')
      .select('*, investor:investors(full_name, code)')
      .is('deleted_at', null)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data;
  },
  getById: async (id: string) => {
    const { data, error } = await supabase
      .from('contracts')
      .select('*, investor:investors(*)')
      .eq('id', id)
      .single();
    if (error) throw error;
    return data;
  },
  create: async (contract: Partial<Contract>) => {
    const { data, error } = await supabase
      .from('contracts')
      .insert(contract)
      .select()
      .single();
    if (error) throw error;
    return data;
  },
  update: async (id: string, contract: Partial<Contract>) => {
    const { data, error } = await supabase
      .from('contracts')
      .update({ ...contract, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },
  softDelete: async (id: string, deletedBy: string) => {
    const { error } = await supabase
      .from('contracts')
      .update({ deleted_at: new Date().toISOString(), deleted_by: deletedBy })
      .eq('id', id);
    if (error) throw error;
  }
};

// ============================================
// Chart of Accounts API
// ============================================
export const chartOfAccountsApi = {
  getAll: async () => {
    const { data, error } = await supabase
      .from('chart_of_accounts')
      .select('*')
      .is('deleted_at', null)
      .order('account_code');
    if (error) throw error;
    return data as ChartOfAccount[];
  },
  getTree: async () => {
    const accounts = await chartOfAccountsApi.getAll();
    const buildTree = (parentId: string | null): ChartOfAccount[] => {
      return accounts
        .filter(a => a.parent_id === parentId)
        .map(a => ({ ...a, children: buildTree(a.id) }));
    };
    return buildTree(null);
  },
  create: async (account: Partial<ChartOfAccount>) => {
    const { data, error } = await supabase
      .from('chart_of_accounts')
      .insert(account)
      .select()
      .single();
    if (error) throw error;
    return data as ChartOfAccount;
  },
  update: async (id: string, account: Partial<ChartOfAccount>) => {
    const { data, error } = await supabase
      .from('chart_of_accounts')
      .update({ ...account, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data as ChartOfAccount;
  }
};

// ============================================
// Journal Entries API
// ============================================
export const journalApi = {
  getAll: async () => {
    const { data, error } = await supabase
      .from('journal_entries')
      .select('*, items:journal_items(*, account:chart_of_accounts(account_code, account_name))')
      .is('deleted_at', null)
      .order('entry_date', { ascending: false });
    if (error) throw error;
    return data;
  },
  getById: async (id: string) => {
    const { data, error } = await supabase
      .from('journal_entries')
      .select('*, items:journal_items(*, account:chart_of_accounts(*))')
      .eq('id', id)
      .single();
    if (error) throw error;
    return data;
  },
  create: async (entry: Partial<JournalEntry>, items: Partial<JournalItem>[]) => {
    const { data, error } = await supabase
      .from('journal_entries')
      .insert(entry)
      .select()
      .single();
    if (error) throw error;

    if (items.length > 0) {
      const itemsWithEntryId = items.map(item => ({
        ...item,
        journal_entry_id: data.id
      }));
      const { error: itemsError } = await supabase
        .from('journal_items')
        .insert(itemsWithEntryId);
      if (itemsError) throw itemsError;
    }

    // Validate journal
    const { error: validateError } = await supabase
      .rpc('validate_journal', { p_journal_id: data.id });
    if (validateError) throw validateError;

    return data;
  },
  softDelete: async (id: string, deletedBy: string) => {
    const { error } = await supabase
      .from('journal_entries')
      .update({ deleted_at: new Date().toISOString(), deleted_by: deletedBy })
      .eq('id', id);
    if (error) throw error;
  }
};

// ============================================
// Receipts API
// ============================================
export const receiptsApi = {
  getAll: async () => {
    const { data, error } = await supabase
      .from('receipts')
      .select('*, investor:investors(full_name, code)')
      .is('deleted_at', null)
      .order('receipt_date', { ascending: false });
    if (error) throw error;
    return data;
  },
  create: async (receipt: Partial<Receipt>) => {
    const { data, error } = await supabase
      .from('receipts')
      .insert(receipt)
      .select()
      .single();
    if (error) throw error;
    return data;
  },
  post: async (id: string) => {
    const { data, error } = await supabase
      .rpc('post_receipt', { p_receipt_id: id });
    if (error) throw error;
    return data;
  }
};

// ============================================
// Payments API
// ============================================
export const paymentsApi = {
  getAll: async () => {
    const { data, error } = await supabase
      .from('payments')
      .select('*, investor:investors(full_name, code)')
      .is('deleted_at', null)
      .order('payment_date', { ascending: false });
    if (error) throw error;
    return data;
  },
  create: async (payment: Partial<Payment>) => {
    const { data, error } = await supabase
      .from('payments')
      .insert(payment)
      .select()
      .single();
    if (error) throw error;
    return data;
  },
  post: async (id: string) => {
    const { data, error } = await supabase
      .rpc('post_payment', { p_payment_id: id });
    if (error) throw error;
    return data;
  }
};

// ============================================
// Profit Distributions API
// ============================================
export const profitDistributionsApi = {
  getAll: async () => {
    const { data, error } = await supabase
      .from('profit_distributions')
      .select('*, items:profit_distribution_items(*, investor:investors(full_name, code))')
      .is('deleted_at', null)
      .order('distribution_date', { ascending: false });
    if (error) throw error;
    return data;
  },
  create: async (distribution: Partial<ProfitDistribution>, items: Partial<ProfitDistributionItem>[]) => {
    const { data, error } = await supabase
      .from('profit_distributions')
      .insert(distribution)
      .select()
      .single();
    if (error) throw error;

    if (items.length > 0) {
      const itemsWithDistId = items.map(item => ({
        ...item,
        distribution_id: data.id
      }));
      const { error: itemsError } = await supabase
        .from('profit_distribution_items')
        .insert(itemsWithDistId);
      if (itemsError) throw itemsError;
    }
    return data;
  },
  post: async (id: string) => {
    const { data, error } = await supabase
      .rpc('post_profit_distribution', { p_distribution_id: id });
    if (error) throw error;
    return data;
  }
};

// ============================================
// Reports API
// ============================================
export const reportsApi = {
  getTrialBalance: async (startDate?: string, endDate?: string) => {
    const { data, error } = await supabase
      .rpc('get_trial_balance', { p_start_date: startDate, p_end_date: endDate });
    if (error) throw error;
    return data as TrialBalanceRow[];
  },
  getBalanceSheet: async (asOfDate?: string) => {
    const { data, error } = await supabase
      .rpc('get_balance_sheet', { p_as_of_date: asOfDate });
    if (error) throw error;
    return data as BalanceSheetRow[];
  },
  getIncomeStatement: async (startDate: string, endDate: string) => {
    const { data, error } = await supabase
      .rpc('get_income_statement', { p_start_date: startDate, p_end_date: endDate });
    if (error) throw error;
    return data as IncomeStatementRow[];
  }
};

// ============================================
// Dashboard API
// ============================================
export const dashboardApi = {
  getStats: async (): Promise<DashboardStats> => {
    const [
      { count: totalInvestors },
      { count: activeInvestors },
      { data: investments },
      { data: receiptsToday },
      { data: paymentsToday }
    ] = await Promise.all([
      supabase.from('investors').select('*', { count: 'exact', head: true }).is('deleted_at', null),
      supabase.from('investors').select('*', { count: 'exact', head: true }).eq('status', 'active').is('deleted_at', null),
      supabase.from('investors').select('investment_capital, total_profit_earned, total_withdrawn').is('deleted_at', null),
      supabase.from('receipts').select('amount').eq('receipt_date', new Date().toISOString().split('T')[0]).is('deleted_at', null),
      supabase.from('payments').select('amount').eq('payment_date', new Date().toISOString().split('T')[0]).is('deleted_at', null)
    ]);

    return {
      total_investors: totalInvestors || 0,
      active_investors: activeInvestors || 0,
      total_investments: investments?.reduce((sum, i) => sum + (i.investment_capital || 0), 0) || 0,
      total_profits: investments?.reduce((sum, i) => sum + (i.total_profit_earned || 0), 0) || 0,
      total_withdrawals: investments?.reduce((sum, i) => sum + (i.total_withdrawn || 0), 0) || 0,
      current_assets: 0,
      total_receipts_today: receiptsToday?.reduce((sum, r) => sum + (r.amount || 0), 0) || 0,
      total_payments_today: paymentsToday?.reduce((sum, p) => sum + (p.amount || 0), 0) || 0,
      pending_distributions: 0
    };
  }
};

// ============================================
// Settings API
// ============================================
export const settingsApi = {
  getAll: async () => {
    const { data, error } = await supabase.from('settings').select('*');
    if (error) throw error;
    return data as Setting[];
  },
  getByKey: async (key: string) => {
    const { data, error } = await supabase
      .from('settings')
      .select('*')
      .eq('key', key)
      .single();
    if (error) return null;
    return data as Setting;
  },
  set: async (key: string, value: string) => {
    const { data, error } = await supabase
      .from('settings')
      .upsert({ key, value, updated_at: new Date().toISOString() })
      .select()
      .single();
    if (error) throw error;
    return data as Setting;
  }
};

// ============================================
// Notifications API
// ============================================
export const notificationsApi = {
  getAll: async (userId: string) => {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(50);
    if (error) throw error;
    return data as Notification[];
  },
  markAsRead: async (id: string) => {
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', id);
    if (error) throw error;
  },
  markAllAsRead: async (userId: string) => {
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', userId)
      .eq('is_read', false);
    if (error) throw error;
  },
  getUnreadCount: async (userId: string) => {
    const { count, error } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('is_read', false);
    if (error) throw error;
    return count || 0;
  }
};

// ============================================
// Audit Logs API
// ============================================
export const auditLogsApi = {
  getAll: async (limit = 100) => {
    const { data, error } = await supabase
      .from('audit_logs')
      .select('*, changed_by_user:users!audit_logs_changed_by_fkey(full_name)')
      .order('changed_at', { ascending: false })
      .limit(limit);
    if (error) throw error;
    return data;
  }
};
