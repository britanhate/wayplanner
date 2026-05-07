import { useState } from 'react'
import { useAuth } from '../../lib/AuthContext'
import { useExpenses } from '../../hooks/useExpenses'
import { EXPENSE_CATEGORIES, CURRENCIES, USERS } from '../../lib/constants'

export default function FinanceView() {
  const { user } = useAuth()
  const { expenses, budget, addExpense, deleteExpense, saveBudget } = useExpenses()
  const [name, setName] = useState('')
  const [amount, setAmount] = useState('')
  const [category, setCategory] = useState('Їжа')
  const [budgetInput, setBudgetInput] = useState(budget.amount || '')
  const [currency, setCurrency] = useState(budget.currency || 'UAH')

  const total = expenses.reduce((s, e) => s + (e.amount || 0), 0)
  const pct = budget.amount > 0 ? Math.min(100, Math.round(total / budget.amount * 100)) : 0

  const getUserInfo = (id) => USERS.find(u => u.id === id) || { name: id, color: '#8888aa', avatar: '👤' }

  const catColors = Object.fromEntries(EXPENSE_CATEGORIES.map(c => [c.value, c.color]))

  const handleAdd = async () => {
    if (!name.trim() || !amount) return
    await addExpense({ name: name.trim(), amount: parseFloat(amount), category, created_by: user.id, currency: budget.currency })
    setName(''); setAmount('')
  }

  const handleBudgetSave = async () => {
    await saveBudget({ amount: parseFloat(budgetInput) || 0, currency })
  }

  // Category breakdown
  const catTotals = {}
  expenses.forEach(e => { catTotals[e.category] = (catTotals[e.category] || 0) + e.amount })

  return (
    <div className="finance-view">
      <div className="finance-header">
        <div className="budget-block">
          <span className="field-label" style={{ margin: 0 }}>Бюджет:</span>
          <input className="budget-inp" type="number" value={budgetInput}
            onChange={e => setBudgetInput(e.target.value)} placeholder="0" />
          <select className="field-sel" value={currency} onChange={e => setCurrency(e.target.value)}>
            {CURRENCIES.map(c => <option key={c}>{c}</option>)}
          </select>
          <button className="btn-primary" style={{ padding: '6px 14px' }} onClick={handleBudgetSave}>Зберегти</button>
        </div>
      </div>

      <div className="finance-body">
        <div className="finance-left">
          <div className="add-expense-form">
            <div className="sidebar-section-title">Додати витрату</div>
            <div className="form-row">
              <input className="field-inp" value={name} onChange={e => setName(e.target.value)}
                placeholder="Назва витрати..." style={{ flex: 2 }} />
              <input className="field-inp" type="number" value={amount}
                onChange={e => setAmount(e.target.value)} placeholder="Сума" style={{ width: 90 }} />
              <select className="field-sel" value={category} onChange={e => setCategory(e.target.value)}>
                {EXPENSE_CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.emoji} {c.value}</option>)}
              </select>
              <button className="btn-primary" onClick={handleAdd}>Додати</button>
            </div>
          </div>

          {!expenses.length
            ? <div className="empty-hint" style={{ textAlign: 'center', padding: 40 }}>Витрат ще немає!</div>
            : expenses.map(e => {
              const creator = getUserInfo(e.created_by)
              const col = catColors[e.category] || '#8888aa'
              return (
                <div key={e.id} className="expense-item">
                  <div className="expense-cat-dot" style={{ background: col }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="expense-name">{e.name}</div>
                    <div className="expense-meta">
                      <span style={{ color: creator.color }}>{creator.avatar} {creator.name}</span>
                      <span> · {e.category}</span>
                      <span> · {new Date(e.created_at).toLocaleDateString('uk-UA')}</span>
                    </div>
                  </div>
                  <div className="expense-amount">{e.amount?.toFixed(0)} {e.currency || budget.currency}</div>
                  {e.created_by === user.id && (
                    <button className="expense-del" onClick={() => deleteExpense(e.id)}>×</button>
                  )}
                </div>
              )
            })
          }
        </div>

        <div className="finance-right">
          <div className="stat-card">
            <div className="stat-label">Витрачено</div>
            <div className="stat-value">{total.toFixed(0)} {budget.currency}</div>
            <div className="stat-sub">з бюджету {budget.amount || 0} {budget.currency}</div>
            <div className="progress-bar">
              <div className="progress-fill" style={{ width: pct + '%', background: pct >= 100 ? '#e8622a' : '#2abf6e' }} />
            </div>
            <div style={{ fontSize: 11, color: 'var(--ink3)' }}>{pct}% використано</div>
          </div>

          <div className="sidebar-section-title" style={{ marginBottom: 8 }}>По категоріях</div>
          {Object.entries(catTotals).sort((a, b) => b[1] - a[1]).map(([cat, sum]) => (
            <div key={cat} className="cat-row">
              <div className="cat-dot" style={{ background: catColors[cat] || '#8888aa' }} />
              <div className="cat-name">{cat}</div>
              <div className="cat-amt">{sum.toFixed(0)} {budget.currency}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
