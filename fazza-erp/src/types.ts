// ============================================
// نظام فزاع ERP - TypeScript Types
// ============================================

export type UserRole = 'superadmin' | 'cfo' | 'accountant';
export type TransactionType = 'receipt' | 'payment' | 'journal' | 'profit_distribution' | 'investment' | 'withdrawal';
export type EntryType = 'debit' | 'credit';
export type AccountType = 'asset' | 'liability' | 'equity' | 'income' | 'expense';
export type ContractStatus = 'active' | 'completed' | 'terminated' | 'suspended';
export type NotificationType = 'info' | 'warning' | 'success' | 'error';
export type FileCategory = 'contract' | 'receipt' | 'payment' | 'report' | 'other';

export interface User {
  id: string;
  auth_id?: string;
  full_name: string;
  email: string;
  phone?: string;
  role: UserRole;
  is_active: boolean;
  last_login?: string;
  avatar_url?: string;
  created_at: string;
  updated_at: string;
  deleted_at?: string;
}

export interface Investor {
  id: string;
  code: string;
  full_name: string;
  email?: string;
  phone?: string;
  national_id?: string;
  address?: string;
  bank_name?: string;
  bank_account?: string;
  iban?: string;
  investment_capital: number;
  profit_share_percentage: number;
  current_balance: number;
  total_profit_earned: number;
  total_withdrawn: number;
  status: string;
  join_date: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface Contract {
  id: string;
  contract_number: string;
  investor_id: string;
  contract_type: string;
  title: string;
  description?: string;
  amount: number;
  profit_sharing_ratio?: number;
  start_date: string;
  end_date?: string;
  status: ContractStatus;
  terms?: string;
  signed_at?: string;
}

export interface ChartOfAccount {
  id: string;
  account_code: string;
  parent_id?: string;
  account_name: string;
  account_name_en?: string;
  account_type: AccountType;
  is_parent: boolean;
  level: number;
  balance: number;
  opening_balance: number;
  is_active: boolean;
  description?: string;
  children?: ChartOfAccount[];
}

export interface JournalEntry {
  id: string;
  entry_number: string;
  entry_date: string;
  reference_type: TransactionType;
  reference_id?: string;
  description?: string;
  total_debit: number;
  total_credit: number;
  is_posted: boolean;
  is_approved: boolean;
  approved_by?: string;
  approved_at?: string;
  fiscal_period?: string;
  items?: JournalItem[];
  created_by?: string;
}

export interface JournalItem {
  id: string;
  journal_entry_id: string;
  account_id: string;
  entry_type: EntryType;
  amount: number;
  description?: string;
  investor_id?: string;
  contract_id?: string;
  account?: ChartOfAccount;
}

export interface Receipt {
  id: string;
  receipt_number: string;
  receipt_date: string;
  investor_id: string;
  amount: number;
  payment_method: string;
  reference_number?: string;
  description?: string;
  journal_entry_id?: string;
  is_posted: boolean;
  investor?: Investor;
}

export interface Payment {
  id: string;
  payment_number: string;
  payment_date: string;
  investor_id?: string;
  amount: number;
  payment_type: string;
  payment_method: string;
  reference_number?: string;
  description?: string;
  journal_entry_id?: string;
  is_posted: boolean;
  investor?: Investor;
}

export interface ProfitDistribution {
  id: string;
  distribution_number: string;
  distribution_date: string;
  period_start?: string;
  period_end?: string;
  total_profit: number;
  total_distributed: number;
  notes?: string;
  journal_entry_id?: string;
  is_posted: boolean;
  items?: ProfitDistributionItem[];
}

export interface ProfitDistributionItem {
  id: string;
  distribution_id: string;
  investor_id: string;
  share_percentage: number;
  profit_amount: number;
  is_paid: boolean;
  paid_at?: string;
  investor?: Investor;
}

export interface InvestorTransaction {
  id: string;
  investor_id: string;
  transaction_type: TransactionType;
  amount: number;
  reference_type?: string;
  reference_id?: string;
  balance_before: number;
  balance_after: number;
  description?: string;
  journal_entry_id?: string;
  created_at: string;
}

export interface AuditLog {
  id: string;
  table_name: string;
  record_id: string;
  action: string;
  old_data?: any;
  new_data?: any;
  changed_by?: string;
  changed_at: string;
}

export interface Notification {
  id: string;
  user_id?: string;
  title: string;
  message?: string;
  type: NotificationType;
  is_read: boolean;
  link?: string;
  created_at: string;
}

export interface FileRecord {
  id: string;
  file_name: string;
  original_name: string;
  file_path: string;
  file_size?: number;
  mime_type?: string;
  category: FileCategory;
  reference_type?: string;
  reference_id?: string;
  uploaded_by?: string;
  created_at: string;
}

export interface Setting {
  id: string;
  key: string;
  value?: string;
  description?: string;
}

export interface SystemLog {
  id: string;
  level: string;
  module?: string;
  message?: string;
  details?: any;
  created_at: string;
}

export interface TrialBalanceRow {
  account_code: string;
  account_name: string;
  account_type: AccountType;
  opening_balance: number;
  total_debit: number;
  total_credit: number;
  net_debit: number;
  net_credit: number;
  closing_balance: number;
}

export interface BalanceSheetRow {
  account_code: string;
  account_name: string;
  account_type: AccountType;
  balance: number;
}

export interface IncomeStatementRow {
  account_code: string;
  account_name: string;
  account_type: AccountType;
  balance: number;
}

export interface DashboardStats {
  total_investors: number;
  active_investors: number;
  total_investments: number;
  total_profits: number;
  total_withdrawals: number;
  current_assets: number;
  total_receipts_today: number;
  total_payments_today: number;
  pending_distributions: number;
}
