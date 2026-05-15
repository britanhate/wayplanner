import { useState, useEffect, useCallback } from "react";
import { supabase } from "../../../lib/supabase";
import {
  fetchExpenses,
  fetchBudget,
  insertExpense,
  deleteExpenseById,
  updateExpenseById,
  deleteExpenseByPoint,
  upsertBudget,
} from "../api";

const PAGE_SIZE = 50;

export function useExpenses({ enabled = true } = {}) {
  const [expenses, setExpenses] = useState([]);
  const [budget, setBudgetState] = useState({ amount: 0, currency: "UAH" });
  const [loading, setLoading] = useState(enabled);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(false);

  const loadExpensesPage = useCallback(async (pageToLoad = 0, append = false) => {
    const from = pageToLoad * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;
    const { data } = await fetchExpenses({ from, to });
    const nextData = data || [];
    setHasMore(nextData.length === PAGE_SIZE);
    setExpenses((prev) => (append ? [...prev, ...nextData] : nextData));
  }, []);

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
          if (alive && data) {
            setBudgetState({ amount: data.budget, currency: data.currency });
          }
        }),
      ]);
      if (alive) setLoading(false);
    };

    bootstrap();

    const channel = supabase
      .channel("expenses-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "expenses" }, () => {
        refresh();
      })
      .subscribe();

    return () => {
      alive = false;
      supabase.removeChannel(channel);
    };
  }, [enabled, loadExpensesPage, refresh]);

  const addExpense = async (expense) => {
    const { error } = await insertExpense(expense);
    if (error) throw error;
  };

  const deleteExpense = async (id) => {
    const { error } = await deleteExpenseById(id);
    if (error) throw error;
  };

  const updateExpense = async (id, updates) => {
    const { error } = await updateExpenseById(id, updates);
    if (error) throw error;
  };

  const deleteExpenseByPointId = async (pointId) => {
    const { error } = await deleteExpenseByPoint(pointId);
    if (error) throw error;
  };

  const saveBudget = async ({ amount, currency }) => {
    setBudgetState({ amount, currency });
    await upsertBudget({ id: 1, budget: amount, currency });
  };

  return {
    expenses,
    budget,
    loading,
    hasMore,
    loadMore,
    refresh,
    addExpense,
    deleteExpense,
    updateExpense,
    deleteExpenseByPointId,
    saveBudget,
  };
}
