import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";

export function useExpenses() {
  const [expenses, setExpenses] = useState([]);
  const [budget, setBudgetState] = useState({ amount: 0, currency: "UAH" });

  useEffect(() => {
    supabase
      .from("expenses")
      .select("id, point_id, amount, category, note, currency, created_at")
      .order("created_at", { ascending: false })
      .then(({ data }) => setExpenses(data || []));

    supabase
      .from("trip_settings")
      .select("budget, currency")
      .eq("id", 1)
      .single()
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
    const { error } = await supabase.from("expenses").insert([expense]);
    if (error) throw error;
  };

  const deleteExpense = async (id) => {
    const { error } = await supabase.from("expenses").delete().eq("id", id);
    if (error) throw error;
  };

  const updateExpense = async (id, updates) => {
    const { error } = await supabase
      .from("expenses")
      .update(updates)
      .eq("id", id);
    if (error) throw error;
  };

  const deleteExpenseByPointId = async (pointId) => {
    const { error } = await supabase
      .from("expenses")
      .delete()
      .eq("point_id", pointId);
    if (error) throw error;
  };

  const saveBudget = async ({ amount, currency }) => {
    setBudgetState({ amount, currency });
    await supabase
      .from("trip_settings")
      .upsert({ id: 1, budget: amount, currency });
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
