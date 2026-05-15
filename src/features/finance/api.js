import { supabase } from '../../lib/supabase';

const EXPENSE_FIELDS = 'id, name, point_id, amount, category, note, currency, paid, created_by, created_at';

export const fetchExpenses = ({ from = 0, to = 49 } = {}) =>
  supabase.from('expenses').select(EXPENSE_FIELDS).order('created_at', { ascending: false }).range(from, to);
export const fetchBudget = () => supabase.from('trip_settings').select('budget, currency').eq('id', 1).single();
export const insertExpense = (expense) => supabase.from('expenses').insert([expense]);
export const deleteExpenseById = (id) => supabase.from('expenses').delete().eq('id', id);
export const updateExpenseById = (id, updates) => supabase.from('expenses').update(updates).eq('id', id);
export const deleteExpenseByPoint = (pointId) => supabase.from('expenses').delete().eq('point_id', pointId);
export const upsertBudget = (payload) => supabase.from('trip_settings').upsert(payload);
