import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../../lib/supabase';
import type { Expense, Point } from '../../../shared/types/domain';
import {
  fetchExpenses,
  fetchBudget,
  insertExpense,
  insertExpenses,
  deleteExpenseById,
  updateExpenseById,
  deleteExpenseByPoint,
  upsertBudget,
  fetchPointExpenses,
  type BudgetSettings,
} from '../api';
import { fetchPoints } from '../../points/api';

const PAGE_SIZE = 50;

type ExpenseRow = Expense & { name?: string; paid?: boolean; id: number; point_id?: number | null; created_at?: string };
type BudgetPayload = { amount: number; currency: string };
type UseExpensesOptions = { enabled?: boolean; tripId?: string | null };
type UseExpensesResult = {
  expenses: ExpenseRow[];
  budget: BudgetPayload;
  loading: boolean;
  hasMore: boolean;
  loadMore: () => Promise<void>;
  refresh: () => Promise<void>;
  addExpense: (expense: Partial<ExpenseRow>) => Promise<void>;
  deleteExpense: (id: number) => Promise<void>;
  updateExpense: (id: number, updates: Partial<ExpenseRow>) => Promise<void>;
  deleteExpenseByPointId: (pointId: number) => Promise<void>;
  syncAllPointExpenses: () => Promise<void>;
  saveBudget: (payload: BudgetPayload) => Promise<void>;
};

export function useExpenses({ enabled = true, tripId }: UseExpensesOptions = {}): UseExpensesResult {
  const [expenses, setExpenses] = useState<ExpenseRow[]>([]);
  const [budget, setBudgetState] = useState<BudgetPayload>({ amount: 0, currency: 'UAH' });
  const [loading, setLoading] = useState(enabled);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(false);

  const loadExpensesPage = useCallback(async (pageToLoad = 0, append = false) => {
    const from = pageToLoad * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;
    const { data } = await fetchExpenses({ from, to, tripId });
    const nextData = (data as ExpenseRow[]) || [];
    setHasMore(nextData.length === PAGE_SIZE);
    setExpenses(prev => (append ? [...prev, ...nextData] : nextData));
  }, [tripId]);

  const loadMore = useCallback(async () => {
    const nextPage = page + 1;
    await loadExpensesPage(nextPage, true);
    setPage(nextPage);
  }, [loadExpensesPage, page]);

  const refresh = useCallback(async () => {
    setLoading(true);
    setPage(0);
    await loadExpensesPage(0, false);
    setLoading(false);
  }, [loadExpensesPage]);

  useEffect(() => {
    if (!enabled) return;
    let alive = true;
    const bootstrap = async () => {
      setLoading(true);
      await Promise.all([
        loadExpensesPage(0, false),
        fetchBudget().then(({ data }) => {
          const budgetData = data as { budget: number; currency: string } | null;
          if (alive && budgetData) setBudgetState({ amount: budgetData.budget, currency: budgetData.currency });
        }),
      ]);
      if (alive) setLoading(false);
    };
    bootstrap();

    const channel = supabase
      .channel('expenses-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'expenses' }, () => {
        refresh();
      })
      .subscribe();

    return () => {
      alive = false;
      supabase.removeChannel(channel);
    };
  }, [enabled, loadExpensesPage, refresh]);

  const addExpense = async (expense: Partial<ExpenseRow>) => {
    const { error } = await insertExpense(expense);
    if (error) throw error;
  };
  const deleteExpense = async (id: number) => {
    const { error } = await deleteExpenseById(id);
    if (error) throw error;
  };
  const updateExpense = async (id: number, updates: Partial<ExpenseRow>) => {
    const { error } = await updateExpenseById(id, updates);
    if (error) throw error;
  };
  const deleteExpenseByPointId = async (pointId: number) => {
    const { error } = await deleteExpenseByPoint(pointId);
    if (error) throw error;
  };

  const syncAllPointExpenses = async () => {
    const [{ data: points, error: pointsError }, { data: pointExpenses, error: expensesError }] = await Promise.all([fetchPoints(tripId), fetchPointExpenses(tripId)]);
    if (pointsError) throw pointsError;
    if (expensesError) throw expensesError;
    const expensesByPointId = new Map<number, ExpenseRow>();
    const duplicates: number[] = [];
    ((pointExpenses as ExpenseRow[]) || []).forEach(expense => {
      if (!expense.point_id) return;
      const key = expense.point_id;
      const existing = expensesByPointId.get(key);
      if (!existing) return void expensesByPointId.set(key, expense);
      existing.paid = Boolean(existing.paid || expense.paid);
      duplicates.push(expense.id);
    });

    const toCreate: Partial<ExpenseRow>[] = [];
    const toDelete = [...duplicates];
    const toUpdate: Array<{ id: number; payload: Partial<ExpenseRow> }> = [];

    ((points as Array<Point & { estimatedCost?: number; currency?: string; created_at?: string }>) || []).forEach(point => {
      const normalizedAmount = Number(point.estimated_cost ?? point.estimatedCost);
      const hasCost = Number.isFinite(normalizedAmount) && normalizedAmount > 0;
      const existingExpense = point.id ? expensesByPointId.get(point.id) : undefined;
      if (!hasCost) {
        if (existingExpense) toDelete.push(existingExpense.id);
        return;
      }
      const nextName = `🏷️ ${point.name}`;
      const nextCurrency = point.currency || 'EUR';
      if (!existingExpense) {
        toCreate.push({ name: nextName, amount: normalizedAmount, currency: nextCurrency, category: 'Місце', point_id: point.id, created_by: point.created_by, created_at: point.point_date || point.created_at, paid: false, trip_id: tripId });
        return;
      }
      const payload: Partial<ExpenseRow> = { name: nextName, amount: normalizedAmount, currency: nextCurrency, category: 'Місце', point_id: point.id, created_by: point.created_by };
      const shouldUpdate = existingExpense.name !== payload.name || Number(existingExpense.amount) !== payload.amount || existingExpense.currency !== payload.currency || existingExpense.category !== payload.category || existingExpense.point_id !== payload.point_id || existingExpense.created_by !== payload.created_by;
      if (shouldUpdate) toUpdate.push({ id: existingExpense.id, payload });
    });

    if (toDelete.length) {
      const { error } = await supabase.from('expenses').delete().in('id', toDelete);
      if (error) throw error;
    }
    if (toCreate.length) {
      const { error } = await insertExpenses(toCreate);
      if (error) throw error;
    }
    if (toUpdate.length) {
      await Promise.all(toUpdate.map(async ({ id, payload }) => {
        const { error } = await updateExpenseById(id, payload);
        if (error) throw error;
      }));
    }
    if (enabled) await refresh();
  };

  const saveBudget = async ({ amount, currency }: BudgetPayload) => {
    setBudgetState({ amount, currency });
    await upsertBudget({ id: 1, budget: amount, currency } as BudgetSettings & { id: number; budget: number });
  };

  return { expenses, budget, loading, hasMore, loadMore, refresh, addExpense, deleteExpense, updateExpense, deleteExpenseByPointId, syncAllPointExpenses, saveBudget };
}
