import { useState, useEffect, useCallback } from "react";
import { supabase } from "../../../lib/supabase";
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
} from "../api";
import { fetchPoints } from "../../points/api";

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

  const syncAllPointExpenses = async () => {
    const [{ data: points, error: pointsError }, { data: pointExpenses, error: expensesError }] = await Promise.all([
      fetchPoints(),
      fetchPointExpenses(),
    ]);

    if (pointsError) throw pointsError;
    if (expensesError) throw expensesError;

    const expensesByPointId = new Map();
    const duplicates = [];

    (pointExpenses || []).forEach((expense) => {
      if (!expense.point_id) return;
      const key = expense.point_id;
      const existing = expensesByPointId.get(key);
      if (!existing) {
        expensesByPointId.set(key, expense);
        return;
      }
      duplicates.push(expense.id);
    });

    const toCreate = [];
    const toDelete = [...duplicates];
    const toUpdate = [];

    (points || []).forEach((point) => {
      const normalizedAmount = Number(point.estimated_cost ?? point.estimatedCost);
      const hasCost = Number.isFinite(normalizedAmount) && normalizedAmount > 0;
      const existingExpense = expensesByPointId.get(point.id);

      if (!hasCost) {
        if (existingExpense) toDelete.push(existingExpense.id);
        return;
      }

      const payload = {
        name: `🏷️ ${point.name}`,
        amount: normalizedAmount,
        currency: point.currency || "EUR",
        category: "Місце",
        note: point.addr || null,
        point_id: point.id,
        created_by: point.created_by,
        created_at: point.point_date || point.created_at,
      };

      if (!existingExpense) {
        toCreate.push(payload);
        return;
      }

      toUpdate.push({ id: existingExpense.id, payload });
    });

    if (toDelete.length) {
      const { error } = await supabase.from("expenses").delete().in("id", toDelete);
      if (error) throw error;
    }

    if (toCreate.length) {
      const { error } = await insertExpenses(toCreate);
      if (error) throw error;
    }

    if (toUpdate.length) {
      await Promise.all(
        toUpdate.map(async ({ id, payload }) => {
          const { error } = await updateExpenseById(id, payload);
          if (error) throw error;
        }),
      );
    }

    if (enabled) {
      await refresh();
    }
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
    syncAllPointExpenses,
    saveBudget,
  };
}
