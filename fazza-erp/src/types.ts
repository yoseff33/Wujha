// Shared types for Fazza ERP

export interface Investor {
  id: number;
  name: string;
  email?: string;
  created_at?: string;
}

export interface Receipt {
  id: number;
  investor_id: number;
  amount: number;
  created_at?: string;
}

export interface Payment {
  id: number;
  investor_id: number;
  amount: number;
  created_at?: string;
}

export interface Contract {
  id: number;
  investor_id: number;
  title?: string;
  signed_at?: string;
}
