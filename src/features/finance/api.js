import { supabase } from '../../lib/supabase';
import { debugSupabaseFetch } from '../../lib/supabaseDebug';

const EXPENSE_FIELDS = 'id, created_by, name, amount, currency, category, created_at, point_id, paid';

export const fetchExpenses = ({ from = 0, to = 49 } = {}) =>
  debugSupabaseFetch({
    table: 'expenses',
    columns: EXPENSE_FIELDS,
    action: 'select',
    query: () => supabase.from('expenses').select(EXPENSE_FIELDS).order('created_at', { ascending: false }).range(from, to),
  });
export const fetchBudget = () => debugSupabaseFetch({
  table: 'trip_settings',
  columns: 'budget, currency',
  action: 'select',
  query: () => supabase.from('trip_settings').select('budget, currency').eq('id', 1).single(),
});
export const insertExpense = (expense) => supabase.from('expenses').insert([expense]);
export const insertExpenses = (expenses) => supabase.from('expenses').insert(expenses);
export const deleteExpenseById = (id) => supabase.from('expenses').delete().eq('id', id);
export const updateExpenseById = (id, updates) => supabase.from('expenses').update(updates).eq('id', id);
export const deleteExpenseByPoint = (pointId) => supabase.from('expenses').delete().eq('point_id', pointId);
export const upsertBudget = (payload) => supabase.from('trip_settings').upsert(payload);

export const fetchPointExpenses = () => debugSupabaseFetch({
  table: 'expenses',
  columns: 'id, created_by, name, amount, currency, category, created_at, point_id, paid',
  action: 'select',
  query: () => supabase.from('expenses').select('id, created_by, name, amount, currency, category, created_at, point_id, paid').not('point_id', 'is', null).order('created_at', { ascending: true }),
});
