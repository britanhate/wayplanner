import { memo, useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "../../../lib/AuthContext";
import { useExpenses } from "../hooks/useExpenses";
import {
  EXPENSE_CATEGORIES,
  CURRENCIES,
  USERS,
  EXCHANGE_RATES,
} from "../../../lib/constants";
import "./FinanceView.css";
import CalciteIcon from "../../../shared/ui/CalciteIcon";
import { markPerf, measurePerf } from "../../../shared/lib/perf";

let hasAutoSyncedPointCosts = false;

export default function FinanceView() {
  const { user } = useAuth();
  const {
    expenses,
    budget,
    addExpense,
    deleteExpense,
    updateExpense,
    saveBudget,
    loading,
    syncAllPointExpenses,
  } = useExpenses();

  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("Їжа");
  const [statsOpen, setStatsOpen] = useState(false);
  const [syncingPointCosts, setSyncingPointCosts] = useState(false);
  const [syncMessage, setSyncMessage] = useState("");

  // ── Бюджет ──
  const [budgetInput, setBudgetInput] = useState(null);
  const [currency, setCurrency] = useState(null);
  useEffect(() => {
    if (!loading) {
      markPerf("finance_loaded");
      measurePerf("startup_to_finance_loaded", "app_start", "finance_loaded");
    }
  }, [loading]);


  const currentBudgetInput =
    budgetInput !== null
      ? budgetInput
      : budget.amount != null && budget.amount !== 0
        ? String(budget.amount)
        : "";

  const currentCurrency = currency || budget.currency || "EUR";

  // ── Рахуємо тільки витрати у валюті бюджету ──
  const budgetCurrency = currentCurrency;

  const expensesInBudgetCurrency = useMemo(
    () => expenses.filter((e) => (e.currency || budgetCurrency) === budgetCurrency),
    [budgetCurrency, expenses],
  );
  const expensesOther = useMemo(
    () => expenses.filter((e) => (e.currency || budgetCurrency) !== budgetCurrency),
    [budgetCurrency, expenses],
  );

  const { total, totalPaid, totalUnpaid, pct, catTotals } = useMemo(() => {
    const nextCatTotals = {};
    let nextTotal = 0;
    let nextPaid = 0;
    expensesInBudgetCurrency.forEach((e) => {
      const amountValue = e.amount || 0;
      nextTotal += amountValue;
      if (e.paid) nextPaid += amountValue;
      nextCatTotals[e.category] = (nextCatTotals[e.category] || 0) + amountValue;
    });
    return {
      total: nextTotal,
      totalPaid: nextPaid,
      totalUnpaid: nextTotal - nextPaid,
      pct: budget.amount > 0 ? Math.min(100, Math.round((nextTotal / budget.amount) * 100)) : 0,
      catTotals: nextCatTotals,
    };
  }, [budget.amount, expensesInBudgetCurrency]);

  const getUserInfo = (id) =>
    USERS.find((u) => u.id === id) || {
      name: id,
      color: "#8888aa",
      avatar: "user",
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

  const handleSyncPointCosts = useCallback(async ({ silent = false } = {}) => {
    if (!silent) setSyncMessage("");
    setSyncingPointCosts(true);
    try {
      await syncAllPointExpenses();
      if (!silent) setSyncMessage("Point costs synced successfully.");
    } catch (error) {
      console.error(error);
      if (!silent) setSyncMessage("Failed to sync point costs.");
    } finally {
      setSyncingPointCosts(false);
    }
  }, [syncAllPointExpenses]);

  useEffect(() => {
    if (hasAutoSyncedPointCosts) return;
    hasAutoSyncedPointCosts = true;
    const timer = window.setTimeout(() => {
      handleSyncPointCosts({ silent: true });
    }, 0);
    return () => window.clearTimeout(timer);
  }, [handleSyncPointCosts]);

  return (
    <div className="finance-view">
      {/* ── Хедер: бюджет ── */}
      <div className="finance-header">
        <div className="finance-header-top">
          <div className="budget-block">
          <span className="field-label budget-label-nowrap">Бюджет</span>
          <input
            className="budget-inp"
            type="number"
            value={currentBudgetInput}
            onChange={(e) => setBudgetInput(e.target.value)}
            placeholder="0"
          />
          <select
            className="field-sel field-sel-small"
            value={currentCurrency}
            onChange={(e) => setCurrency(e.target.value)}
          >
            {CURRENCIES.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
            <button
              className="btn btn-primary btn-primary-small"
              onClick={handleBudgetSave}
            >
              Зберегти
            </button>
          </div>

          <button
            className="finance-sync-icon-btn"
            onClick={handleSyncPointCosts}
            disabled={syncingPointCosts}
            title={syncingPointCosts ? "Синхронізація витрат з точок..." : "Синхронізувати витрати з точок"}
            aria-label="Синхронізувати витрати з точок"
          >
            <CalciteIcon name="reset" size={20} />
          </button>
        </div>

        {syncMessage ? <span className="finance-sync-message">{syncMessage}</span> : null}

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
              <span className="paid-amount">
                ■ {totalPaid.toFixed(0)} {budgetCurrency}
              </span>
              {" · "}
              <span className="unpaid-amount">
                ■ {totalUnpaid.toFixed(0)} {budgetCurrency}
              </span>
              {budget.amount > 0 && ` / ${budget.amount} ${budgetCurrency}`}
            </span>
            <span className="text-small">{pct}%</span>
          </div>
        </div>

        {/* Попередження про змішані валюти */}
        {expensesOther.length > 0 && (
          <div className="currency-warning">
            <CalciteIcon name="alert" size={16} /> {expensesOther.length} витрат в інших валютах не враховано в
            бюджеті
          </div>
        )}
      </div>

      <div className="finance-body">
        {loading && <div className="finance-loading-hint">Завантаження витрат...</div>}
        {syncingPointCosts && <div className="finance-syncing-hint">Синхронізація витрат з точок…</div>}

      {/* ── Список + форма ── */}
        <div className="finance-left">
          <button
            className="btn btn-secondary stats-toggle-btn"
            onClick={() => setStatsOpen(true)}
          >
            <CalciteIcon name="organization" size={16} /> Статистика
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
              />
              <select
                className="field-sel"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                {EXPENSE_CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.value}
                  </option>
                ))}
              </select>
              <button className="btn btn-primary" onClick={handleAdd}>
                +
              </button>
            </div>
          </div>

          {/* Список витрат */}
          <div className="expenses-list">
            {!expenses.length ? (
              <div className="expenses-empty">
                <div className="stat-icon-large"><CalciteIcon name="coin" size={24} /></div>
                <div className="empty-state-title">Ще немає витрат</div>
                <div className="text-small">Додайте першу витрату вище, щоб бачити бюджет і статистику по поїздці.</div>
              </div>
            ) : (
              expenses.map((e) => {
                const creator = getUserInfo(e.created_by);
                const col = catColors[e.category] || "#8888aa";
                const expCurrency = e.currency || budgetCurrency;
                const isOtherCurrency = expCurrency !== budgetCurrency;

                return (
                  <ExpenseItem
                    key={e.id}
                    expense={e}
                    creator={creator}
                    categoryColor={col}
                    expCurrency={expCurrency}
                    isOtherCurrency={isOtherCurrency}
                    isOwner={e.created_by === user.id}
                    onTogglePaid={togglePaid}
                    onDelete={deleteExpense}
                  />
                );
              })
            )}
          </div>
        </div>

        {/* ── Статистика ── */}
        <aside className={`finance-right ${statsOpen ? "open" : ""}`}>
          <div className="finance-right-header">
            <span className="section-title">Статистика</span>
            <button className="btn btn-icon btn-ghost" onClick={() => setStatsOpen(false)}><CalciteIcon name="close" size={20} /></button>
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
                  Сплачено
                </div>
                <div className="stat-value" style={{ color: "#30d158" }}>
                  {totalPaid.toFixed(0)}
                </div>
                <div className="stat-currency">{budgetCurrency}</div>
              </div>
              <div className="stat-block">
                <div className="stat-label stat-label-warning">
                  ◐ Заплановано
                </div>
                <div className="stat-value stat-value-warning">
                  {totalUnpaid.toFixed(0)}
                </div>
                <div className="stat-currency">{budgetCurrency}</div>
              </div>
            </div>
          </div>

          {/* Залишок бюджету */}
          {budget.amount > 0 && (
            <div className="stat-card glass-panel">
              <div className="stat-block-balanced">
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
                  <CalciteIcon name={budget.amount - total >= 0 ? "coin" : "close"} size={24} />
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

const ExpenseItem = memo(function ExpenseItem({
  expense,
  creator,
  categoryColor,
  expCurrency,
  isOtherCurrency,
  isOwner,
  onTogglePaid,
  onDelete,
}) {
  return (
    <div
      className={`expense-item ${expense.paid ? "paid" : ""}`}
      style={
        isOtherCurrency
          ? {
              borderColor: "rgba(255,159,10,0.2)",
              background: "rgba(255,159,10,0.04)",
            }
          : {}
      }
    >
      <input type="checkbox" className="expense-checkbox" checked={expense.paid || false} onChange={() => onTogglePaid(expense)} />
      <div className="expense-cat-dot" style={{ background: categoryColor }} />
      <div className="expense-info">
        <div className="expense-name">{expense.name}</div>
        <div className="expense-meta">
          <span className="expense-meta-creator" style={{ color: creator.color }}>
            <CalciteIcon name="user" size={16} /> {creator.name}
          </span>
          <span> · {expense.category}</span>
          <span> · {new Date(expense.created_at).toLocaleDateString("uk-UA")}</span>
          {isOtherCurrency && <span className="expense-meta-warning"> · {expCurrency}</span>}
        </div>
      </div>
      <div className="expense-amount">
        {expense.amount?.toFixed(0)} <span className="text-small">{expCurrency}</span>
      </div>
      {isOwner && (
        <button className="btn btn-icon btn-ghost expense-del" onClick={() => onDelete(expense.id)}><CalciteIcon name="trash" size={16} /></button>
      )}
    </div>
  );
});
