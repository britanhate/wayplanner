import { useState, useEffect } from "react";
import { supabase } from "../../../lib/supabase";
import { fetchExpenses, fetchBudget, insertExpense, deleteExpenseById, updateExpenseById, deleteExpenseByPoint, upsertBudget } from "../api";

export function useExpenses() {
  const [expenses, setExpenses] = useState([]);
  const [budget, setBudgetState] = useState({ amount: 0, currency: "UAH" });

  useEffect(() => {
    fetchExpenses()
      .then(({ data }) => setExpenses(data || []));

    fetchBudget()
      .then(({ data }) => {
        if (data)
          setBudgetState({ amount: data.budget, currency: data.currency });
      });

    const channel = supabase
      .channel("expenses-changes")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "expenses" },
        (payload) => setExpenses((prev) => [payload.new, ...prev]),
      )
      .on(
        "postgres_changes",
        { event: "DELETE", schema: "public", table: "expenses" },
        (payload) =>
          setExpenses((prev) => prev.filter((e) => e.id !== payload.old.id)),
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "expenses" },
        (payload) =>
          setExpenses((prev) =>
            prev.map((e) => (e.id === payload.new.id ? payload.new : e)),
          ),
      )
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, []);

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
    addExpense,
    deleteExpense,
    updateExpense,
    deleteExpenseByPointId,
    saveBudget,
  };
}
