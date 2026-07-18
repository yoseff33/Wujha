import { supabase } from './supabaseClient'
import type { Investor, Receipt, Payment, Contract } from '../types'

export async function fetchInvestors(): Promise<Investor[]> {
  const { data, error } = await supabase.from('investors').select('*')
  if (error) throw error
  return data as Investor[]
}

export async function fetchReceipts(): Promise<Receipt[]> {
  const { data, error } = await supabase.from('receipts').select('*')
  if (error) throw error
  return data as Receipt[]
}

export async function fetchPayments(): Promise<Payment[]> {
  const { data, error } = await supabase.from('payments').select('*')
  if (error) throw error
  return data as Payment[]
}
