import { useState } from "react";
import { useAuth } from "../../lib/AuthContext";
import { useExpenses } from "../../hooks/useExpenses";
import {
  EXPENSE_CATEGORIES,
  CURRENCIES,
  USERS,
  EXCHANGE_RATES,
} from "../../lib/constants";

export default function FinanceView() {
  const { user } = useAuth();
  const {
    expenses,
    budget,
    addExpense,
    deleteExpense,
    updateExpense,
    saveBudget,
  } = useExpenses();

  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("Їжа");
  const [statsOpen, setStatsOpen] = useState(false);

  // ── Бюджет ──
  const [budgetInput, setBudgetInput] = useState(null);
  const [currency, setCurrency] = useState(null);

  const currentBudgetInput =
    budgetInput !== null
      ? budgetInput
      : budget.amount != null && budget.amount !== 0
        ? String(budget.amount)
        : "";

  const currentCurrency = currency || budget.currency || "EUR";

  // ── Рахуємо тільки витрати у валюті бюджету ──
  const budgetCurrency = currentCurrency;

  const expensesInBudgetCurrency = expenses.filter(
    (e) => (e.currency || budgetCurrency) === budgetCurrency,
  );
  const expensesOther = expenses.filter(
    (e) => (e.currency || budgetCurrency) !== budgetCurrency,
  );

  const total = expensesInBudgetCurrency.reduce(
    (s, e) => s + (e.amount || 0),
    0,
  );
  const totalPaid = expensesInBudgetCurrency.reduce(
    (s, e) => s + (e.paid ? e.amount || 0 : 0),
    0,
  );
  const totalUnpaid = total - totalPaid;
  const pct =
    budget.amount > 0
      ? Math.min(100, Math.round((total / budget.amount) * 100))
      : 0;

  // Категорії — тільки по валюті бюджету
  const catTotals = {};
  expensesInBudgetCurrency.forEach((e) => {
    catTotals[e.category] = (catTotals[e.category] || 0) + e.amount;
  });

  const getUserInfo = (id) =>
    USERS.find((u) => u.id === id) || {
      name: id,
      color: "#8888aa",
      avatar: "👤",
    };

  const catColors = Object.fromEntries(
    EXPENSE_CATEGORIES.map((c) => [c.value, c.color]),
  );

  // Функція конвертації - переводить суму з однієї валюти в іншу
  const convertAmount = (amount, fromCurrency, toCurrency) => {
    if (fromCurrency === toCurrency) return amount;
    const amountInEUR = amount / EXCHANGE_RATES[fromCurrency];
    return amountInEUR * EXCHANGE_RATES[toCurrency];
  };

  const handleAdd = async () => {
    if (!name.trim() || !amount) return;
    await addExpense({
      name: name.trim(),
      amount: parseFloat(amount),
      category,
      created_by: user.id,
      currency: budgetCurrency,
      paid: false,
    });
    setName("");
    setAmount("");
  };

  const handleBudgetSave = async () => {
    const newAmount = parseFloat(budgetInput) || 0;

    // Якщо валюта змінилася - конвертуємо всі витрати
    if (currentCurrency !== budget.currency && expenses.length > 0) {
      const oldCurrency = budget.currency || "EUR";
      for (const expense of expensesInBudgetCurrency) {
        const newAmount = convertAmount(
          expense.amount,
          oldCurrency,
          currentCurrency,
        );
        await updateExpense(expense.id, {
          amount: newAmount,
          currency: currentCurrency,
        });
      }
    }

    await saveBudget({
      amount: newAmount,
      currency: currentCurrency,
    });
  };

  const togglePaid = async (expense) => {
    await updateExpense(expense.id, { paid: !expense.paid });
  };

  return (
    <div className="finance-view">
      {/* ── Хедер: бюджет ── */}
      <div className="finance-header">
        <div className="budget-block">
          <span
            className="field-label"
            style={{ margin: 0, whiteSpace: "nowrap" }}
          >
            Бюджет
          </span>
          <input
            className="budget-inp"
            type="number"
            value={currentBudgetInput}
            onChange={(e) => setBudgetInput(e.target.value)}
            placeholder="0"
          />
          <select
            className="field-sel"
            style={{ width: 80 }}
            value={currentCurrency}
            onChange={(e) => setCurrency(e.target.value)}
          >
            {CURRENCIES.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
          <button
            className="btn-primary"
            style={{ padding: "8px 14px", whiteSpace: "nowrap" }}
            onClick={handleBudgetSave}
          >
            Зберегти
          </button>
        </div>

        {/* Прогрес бюджету */}
        <div className="budget-progress-wrap">
          <div className="budget-progress-bar">
            {/* Синій - фон (всі витрати: не оплачене + оплачене) */}
            {budget.amount > 0 && (
              <div
                className="budget-progress-fill budget-progress-unpaid"
                style={{
                  width:
                    Math.min(
                      100,
                      Math.round(
                        ((totalUnpaid + totalPaid) / budget.amount) * 100,
                      ),
                    ) + "%",
                }}
              />
            )}
            {/* Зелений - накладається поверху (тільки оплачене) */}
            {budget.amount > 0 && total > 0 && (
              <div
                className="budget-progress-fill budget-progress-paid"
                style={{
                  width:
                    Math.min(100, Math.round((totalPaid / total) * 100)) + "%",
                }}
              />
            )}
          </div>
          <div className="budget-progress-labels">
            <span className="text-small">
              <span style={{ color: "#30d158" }}>
                ■ {totalPaid.toFixed(0)} {budgetCurrency}
              </span>
              {" · "}
              <span style={{ color: "#9aa3b2" }}>
                ■ {totalUnpaid.toFixed(0)} {budgetCurrency}
              </span>
              {budget.amount > 0 && ` / ${budget.amount} ${budgetCurrency}`}
            </span>
            <span className="text-small">{pct}%</span>
          </div>
        </div>

        {/* Попередження про змішані валюти */}
        {expensesOther.length > 0 && (
          <div
            style={{
              fontSize: 12,
              color: "#ff9f0a",
              padding: "6px 10px",
              background: "rgba(255,159,10,0.08)",
              borderRadius: 8,
              border: "0.5px solid rgba(255,159,10,0.2)",
            }}
          >
            ⚠️ {expensesOther.length} витрат в інших валютах не враховано в
            бюджеті
          </div>
        )}
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

          {/* Форма додавання */}
          <div
            className="add-expense-form glass-panel"
            style={{ padding: 14, marginBottom: 14 }}
          >
            <div className="section-title" style={{ marginBottom: 10 }}>
              Додати витрату · {budgetCurrency}
            </div>
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
                placeholder={`Сума (${budgetCurrency})`}
                style={{ flex: 1 }}
              />
              <select
                className="field-sel"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                {EXPENSE_CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.emoji} {c.value}
                  </option>
                ))}
              </select>
              <button className="btn-primary" onClick={handleAdd}>
                +
              </button>
            </div>
          </div>

          {/* Список витрат */}
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
                const expCurrency = e.currency || budgetCurrency;
                const isOtherCurrency = expCurrency !== budgetCurrency;

                return (
                  <div
                    key={e.id}
                    className={`expense-item ${e.paid ? "paid" : ""}`}
                    style={
                      isOtherCurrency
                        ? {
                            borderColor: "rgba(255,159,10,0.2)",
                            background: "rgba(255,159,10,0.04)",
                          }
                        : {}
                    }
                  >
                    <input
                      type="checkbox"
                      className="expense-checkbox"
                      checked={e.paid || false}
                      onChange={() => togglePaid(e)}
                    />
                    <div
                      className="expense-cat-dot"
                      style={{ background: col }}
                    />
                    <div className="expense-info">
                      <div className="expense-name">{e.name}</div>
                      <div className="expense-meta">
                        <span style={{ color: creator.color }}>
                          {creator.avatar} {creator.name}
                        </span>
                        <span> · {e.category}</span>
                        <span>
                          {" "}
                          · {new Date(e.created_at).toLocaleDateString("uk-UA")}
                        </span>
                        {isOtherCurrency && (
                          <span style={{ color: "#ff9f0a" }}>
                            {" "}
                            · ⚠️ {expCurrency}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="expense-amount">
                      {e.amount?.toFixed(0)}{" "}
                      <span className="text-small">{expCurrency}</span>
                    </div>
                    {e.created_by === user.id && (
                      <button
                        className="expense-del"
                        onClick={() => deleteExpense(e.id)}
                      >
                        ×
                      </button>
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
            <span className="section-title" style={{ margin: 0 }}>
              Статистика
            </span>
            <button className="btn-ghost" onClick={() => setStatsOpen(false)}>
              ✕
            </button>
          </div>

          <div className="stat-card glass-panel">
            <div className="stat-row">
              <div className="stat-block">
                <div className="stat-label">Всього</div>
                <div className="stat-value">{total.toFixed(0)}</div>
                <div className="stat-currency">{budgetCurrency}</div>
              </div>
              <div className="stat-block">
                <div className="stat-label" style={{ color: "#30d158" }}>
                  ✓ Сплачено
                </div>
                <div className="stat-value" style={{ color: "#30d158" }}>
                  {totalPaid.toFixed(0)}
                </div>
                <div className="stat-currency">{budgetCurrency}</div>
              </div>
              <div className="stat-block">
                <div className="stat-label" style={{ color: "#ff9f0a" }}>
                  ◐ Заплановано
                </div>
                <div className="stat-value" style={{ color: "#ff9f0a" }}>
                  {totalUnpaid.toFixed(0)}
                </div>
                <div className="stat-currency">{budgetCurrency}</div>
              </div>
            </div>
          </div>

          {/* Залишок бюджету */}
          {budget.amount > 0 && (
            <div className="stat-card glass-panel" style={{ marginTop: 8 }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <div>
                  <div className="stat-label">Залишок</div>
                  <div
                    className="stat-value"
                    style={{
                      color: budget.amount - total >= 0 ? "#30d158" : "#ff453a",
                      fontSize: 20,
                    }}
                  >
                    {(budget.amount - total).toFixed(0)}
                  </div>
                  <div className="stat-currency">{budgetCurrency}</div>
                </div>
                <div style={{ fontSize: 32, opacity: 0.4 }}>
                  {budget.amount - total >= 0 ? "💰" : "🚨"}
                </div>
              </div>
            </div>
          )}

          <div
            className="section-title"
            style={{ marginTop: 16, marginBottom: 8 }}
          >
            По категоріях ({budgetCurrency})
          </div>

          {Object.entries(catTotals).length === 0 ? (
            <div style={{ fontSize: 13, color: "var(--muted)" }}>
              Немає витрат у {budgetCurrency}
            </div>
          ) : (
            Object.entries(catTotals)
              .sort((a, b) => b[1] - a[1])
              .map(([cat, sum]) => {
                const pctCat = total > 0 ? Math.round((sum / total) * 100) : 0;
                return (
                  <div key={cat} className="cat-row">
                    <div
                      className="cat-dot"
                      style={{ background: catColors[cat] || "#8888aa" }}
                    />
                    <div className="cat-name">{cat}</div>
                    <div className="cat-bar-wrap">
                      <div
                        className="cat-bar-fill"
                        style={{
                          width: pctCat + "%",
                          background: catColors[cat] || "#8888aa",
                        }}
                      />
                    </div>
                    <div className="cat-amt">
                      {sum.toFixed(0)}{" "}
                      <span className="text-small">{budgetCurrency}</span>
                    </div>
                  </div>
                );
              })
          )}
        </aside>
      </div>

      {statsOpen && (
        <div
          className="finance-stats-overlay"
          onClick={() => setStatsOpen(false)}
        />
      )}
    </div>
  );
}
