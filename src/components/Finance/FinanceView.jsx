import { useState } from "react";
import { useAuth } from "../../lib/AuthContext";
import { useExpenses } from "../../hooks/useExpenses";
import { EXPENSE_CATEGORIES, CURRENCIES, USERS } from "../../lib/constants";

export default function FinanceView() {
  const { user } = useAuth();
  const { expenses, budget, addExpense, deleteExpense, updateExpense, saveBudget } =
    useExpenses();

  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("Їжа");
  const [budgetInput, setBudgetInput] = useState(budget.amount || "");
  const [currency, setCurrency] = useState(budget.currency || "UAH");
  const [statsOpen, setStatsOpen] = useState(false);

  const total = expenses.reduce((s, e) => s + (e.amount || 0), 0);
  const totalPaid = expenses.reduce((s, e) => s + (e.paid ? e.amount || 0 : 0), 0);
  const totalUnpaid = total - totalPaid;
  const pct = budget.amount > 0 ? Math.min(100, Math.round((total / budget.amount) * 100)) : 0;

  const getUserInfo = (id) =>
    USERS.find((u) => u.id === id) || { name: id, color: "#8888aa", avatar: "👤" };

  const catColors = Object.fromEntries(EXPENSE_CATEGORIES.map((c) => [c.value, c.color]));

  const catTotals = {};
  expenses.forEach((e) => {
    catTotals[e.category] = (catTotals[e.category] || 0) + e.amount;
  });

  const handleAdd = async () => {
    if (!name.trim() || !amount) return;
    await addExpense({
      name: name.trim(),
      amount: parseFloat(amount),
      category,
      created_by: user.id,
      currency: budget.currency,
      paid: false,
    });
    setName("");
    setAmount("");
  };

  const handleBudgetSave = async () => {
    await saveBudget({ amount: parseFloat(budgetInput) || 0, currency });
  };

  const togglePaid = async (expense) => {
    await updateExpense(expense.id, { paid: !expense.paid });
  };

  return (
    <div className="finance-view">

      {/* ── Хедер: бюджет ── */}
      <div className="finance-header">
        <div className="budget-block">
          <span className="field-label" style={{ margin: 0, whiteSpace: "nowrap" }}>Бюджет</span>
          <input
            className="budget-inp"
            type="number"
            value={budgetInput}
            onChange={(e) => setBudgetInput(e.target.value)}
            placeholder="0"
          />
          <select
            className="field-sel"
            style={{ width: 80 }}
            value={currency}
            onChange={(e) => setCurrency(e.target.value)}
          >
            {CURRENCIES.map((c) => <option key={c}>{c}</option>)}
          </select>
          <button
            className="btn-primary"
            style={{ padding: "8px 14px", whiteSpace: "nowrap" }}
            onClick={handleBudgetSave}
          >
            Зберегти
          </button>
        </div>

        <div className="budget-progress-wrap">
          <div className="budget-progress-bar">
            <div
              className="budget-progress-fill"
              style={{
                width: pct + "%",
                background: pct >= 90 ? "#ff453a" : pct >= 70 ? "#ff9f0a" : "#30d158",
              }}
            />
          </div>
          <div className="budget-progress-labels">
            <span className="text-small">{total.toFixed(0)} {budget.currency} витрачено</span>
            <span className="text-small">{pct}%</span>
          </div>
        </div>
      </div>

      <div className="finance-body">

        {/* ── Список + форма ── */}
        <div className="finance-left">
          <button
            className="stats-toggle-btn"
            onClick={() => setStatsOpen(true)}
          >
            📊 Статистика
          </button>

          {/* Форма */}
          <div className="add-expense-form glass-panel" style={{ padding: 14, marginBottom: 14 }}>
            <div className="section-title" style={{ marginBottom: 10 }}>Додати витрату</div>
            <input
              className="field-inp"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Назва витрати..."
              style={{ marginBottom: 8 }}
              onKeyDown={(e) => e.key === "Enter" && handleAdd()}
            />
            <div className="finance-add-row">
              <input
                className="field-inp"
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="Сума"
                style={{ flex: 1 }}
              />
              <select
                className="field-sel"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                {EXPENSE_CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>{c.emoji} {c.value}</option>
                ))}
              </select>
              <button className="btn-primary" onClick={handleAdd}>+</button>
            </div>
          </div>

          {/* Витрати */}
          <div className="expenses-list">
            {!expenses.length ? (
              <div className="expenses-empty">
                <div style={{ fontSize: 32, opacity: 0.3 }}>💸</div>
                <div className="text-small">Витрат ще немає</div>
              </div>
            ) : (
              expenses.map((e) => {
                const creator = getUserInfo(e.created_by);
                const col = catColors[e.category] || "#8888aa";
                return (
                  <div key={e.id} className={`expense-item ${e.paid ? "paid" : ""}`}>
                    <input
                      type="checkbox"
                      className="expense-checkbox"
                      checked={e.paid || false}
                      onChange={() => togglePaid(e)}
                    />
                    <div className="expense-cat-dot" style={{ background: col }} />
                    <div className="expense-info">
                      <div className="expense-name">{e.name}</div>
                      <div className="expense-meta">
                        <span style={{ color: creator.color }}>{creator.avatar} {creator.name}</span>
                        <span> · {e.category}</span>
                        <span> · {new Date(e.created_at).toLocaleDateString("uk-UA")}</span>
                      </div>
                    </div>
                    <div className="expense-amount">
                      {e.amount?.toFixed(0)}{" "}
                      <span className="text-small">{e.currency || budget.currency}</span>
                    </div>
                    {e.created_by === user.id && (
                      <button className="expense-del" onClick={() => deleteExpense(e.id)}>×</button>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* ── Статистика ── */}
        <aside className={`finance-right ${statsOpen ? "open" : ""}`}>
          <div className="finance-right-header">
            <span className="section-title" style={{ margin: 0 }}>Статистика</span>
            <button className="btn-ghost" onClick={() => setStatsOpen(false)}>✕</button>
          </div>

          <div className="stat-card glass-panel">
            <div className="stat-row">
              <div className="stat-block">
                <div className="stat-label">Всього</div>
                <div className="stat-value">{total.toFixed(0)}</div>
                <div className="stat-currency">{budget.currency}</div>
              </div>
              <div className="stat-block">
                <div className="stat-label" style={{ color: "#30d158" }}>✓ Сплачено</div>
                <div className="stat-value" style={{ color: "#30d158" }}>{totalPaid.toFixed(0)}</div>
                <div className="stat-currency">{budget.currency}</div>
              </div>
              <div className="stat-block">
                <div className="stat-label" style={{ color: "#ff9f0a" }}>◐ Борг</div>
                <div className="stat-value" style={{ color: "#ff9f0a" }}>{totalUnpaid.toFixed(0)}</div>
                <div className="stat-currency">{budget.currency}</div>
              </div>
            </div>
          </div>

          <div className="section-title" style={{ marginTop: 16, marginBottom: 8 }}>По категоріях</div>

          {Object.entries(catTotals)
            .sort((a, b) => b[1] - a[1])
            .map(([cat, sum]) => {
              const pctCat = total > 0 ? Math.round((sum / total) * 100) : 0;
              return (
                <div key={cat} className="cat-row">
                  <div className="cat-dot" style={{ background: catColors[cat] || "#8888aa" }} />
                  <div className="cat-name">{cat}</div>
                  <div className="cat-bar-wrap">
                    <div className="cat-bar-fill" style={{ width: pctCat + "%", background: catColors[cat] || "#8888aa" }} />
                  </div>
                  <div className="cat-amt">
                    {sum.toFixed(0)} <span className="text-small">{budget.currency}</span>
                  </div>
                </div>
              );
            })}
        </aside>
      </div>

      {statsOpen && (
        <div className="finance-stats-overlay" onClick={() => setStatsOpen(false)} />
      )}
    </div>
  );
}