import { useState, useRef, useEffect } from 'react'
import { Plus, Trash2, TrendingUp, TrendingDown, ChevronDown } from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { useStore } from '../store'
import Modal from '../components/Modal'
import { Card, Btn, Input, Select, SectionHeader, EmptyState } from '../components/UI'

const fmtMonth = (ym) => {
  const [y, m] = ym.split('-')
  return format(new Date(+y, +m - 1, 1), 'MMM yyyy')
}

function useSortedMonths(transactions) {
  const current = format(new Date(), 'yyyy-MM')
  const fromTx = transactions.map((t) => t.date.slice(0, 7))
  const unique = [...new Set([current, ...fromTx])].sort((a, b) => b.localeCompare(a))
  return unique
}

function MonthSelector({ value, onChange, months }) {
  const scrollRef = useRef(null)

  useEffect(() => {
    const active = scrollRef.current?.querySelector('[data-active]')
    if (active) active.scrollIntoView({ inline: 'center', behavior: 'smooth', block: 'nearest' })
  }, [value])

  return (
    <div ref={scrollRef} className="flex gap-2 overflow-x-auto scrollbar-hide py-1 -mx-4 px-4">
      {months.map((m) => (
        <button
          key={m}
          data-active={m === value ? '' : undefined}
          onClick={() => onChange(m)}
          className={`shrink-0 px-3.5 py-1.5 rounded-full text-sm font-semibold transition-all ${
            m === value
              ? 'bg-blue-500 text-white shadow-sm'
              : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400'
          }`}
        >
          {fmtMonth(m)}
        </button>
      ))}
    </div>
  )
}

// ─── Overview tab ─────────────────────────────────────────────────────────────
function OverviewTab({ month, months, setMonth }) {
  const { transactions, budgets, currency, incomeSources, expenseCategories } = useStore()

  const mTx = transactions.filter((t) => t.date.startsWith(month))
  const income = mTx.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0)
  const expenses = mTx.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0)
  const saved = income - expenses

  const incomeBySource = incomeSources.map((src) => ({
    src,
    amount: mTx.filter((t) => t.type === 'income' && t.category === src).reduce((s, t) => s + t.amount, 0),
  })).filter((x) => x.amount > 0)

  const expByCategory = expenseCategories.map((cat) => ({
    cat,
    amount: mTx.filter((t) => t.type === 'expense' && t.category === cat).reduce((s, t) => s + t.amount, 0),
    budget: budgets[cat] || 0,
  })).filter((x) => x.amount > 0).sort((a, b) => b.amount - a.amount)

  return (
    <div className="space-y-5">
      <MonthSelector value={month} onChange={setMonth} months={months} />

      {/* Summary */}
      <div className="grid grid-cols-3 gap-2">
        <div className="bg-green-50 dark:bg-green-900/20 rounded-2xl p-3">
          <p className="text-[10px] font-semibold text-green-600 dark:text-green-400 uppercase tracking-wide">Income</p>
          <p className="text-xl font-bold text-green-700 dark:text-green-300 mt-0.5">{currency}{income.toFixed(0)}</p>
        </div>
        <div className="bg-red-50 dark:bg-red-900/20 rounded-2xl p-3">
          <p className="text-[10px] font-semibold text-red-600 dark:text-red-400 uppercase tracking-wide">Spent</p>
          <p className="text-xl font-bold text-red-700 dark:text-red-300 mt-0.5">{currency}{expenses.toFixed(0)}</p>
        </div>
        <div className={`rounded-2xl p-3 ${saved >= 0 ? 'bg-blue-50 dark:bg-blue-900/20' : 'bg-orange-50 dark:bg-orange-900/20'}`}>
          <p className={`text-[10px] font-semibold uppercase tracking-wide ${saved >= 0 ? 'text-blue-600 dark:text-blue-400' : 'text-orange-600 dark:text-orange-400'}`}>Saved</p>
          <p className={`text-xl font-bold mt-0.5 ${saved >= 0 ? 'text-blue-700 dark:text-blue-300' : 'text-orange-700 dark:text-orange-300'}`}>
            {saved >= 0 ? '+' : ''}{currency}{saved.toFixed(0)}
          </p>
        </div>
      </div>

      {/* Income by source */}
      {incomeBySource.length > 0 && (
        <div>
          <SectionHeader>Income Sources</SectionHeader>
          <div className="grid grid-cols-2 gap-2">
            {incomeBySource.map(({ src, amount }) => (
              <Card key={src} className="p-3">
                <p className="text-xs text-zinc-400 font-medium">{src}</p>
                <p className="text-lg font-bold text-zinc-800 dark:text-zinc-100 mt-0.5">{currency}{amount.toFixed(2)}</p>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Expenses breakdown */}
      {expByCategory.length > 0 && (
        <div>
          <SectionHeader>Expenses</SectionHeader>
          <Card className="p-4 space-y-3">
            {expByCategory.map(({ cat, amount, budget }) => {
              const pct = budget > 0 ? Math.min((amount / budget) * 100, 100) : 0
              const over = budget > 0 && amount > budget
              return (
                <div key={cat}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-zinc-700 dark:text-zinc-200">{cat}</span>
                    <div className="flex items-center gap-1.5">
                      <span className={`text-sm font-bold ${over ? 'text-red-500' : 'text-zinc-700 dark:text-zinc-200'}`}>
                        {currency}{amount.toFixed(2)}
                      </span>
                      {budget > 0 && (
                        <span className="text-xs text-zinc-400">/ {currency}{budget}</span>
                      )}
                    </div>
                  </div>
                  {budget > 0 && (
                    <div className="h-1.5 bg-zinc-100 dark:bg-zinc-700 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${over ? 'bg-red-400' : 'bg-blue-400'}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  )}
                </div>
              )
            })}
          </Card>
        </div>
      )}

      {mTx.length === 0 && (
        <EmptyState icon={TrendingUp} text="No transactions this month" />
      )}
    </div>
  )
}

// ─── Add tab ──────────────────────────────────────────────────────────────────
function AddTab() {
  const { addTransaction, incomeSources, expenseCategories, currency } = useStore()
  const [type, setType] = useState('expense')
  const [form, setForm] = useState({ amount: '', category: '', note: '', date: format(new Date(), 'yyyy-MM-dd') })
  const [success, setSuccess] = useState(false)

  const categories = type === 'income' ? incomeSources : expenseCategories

  const submit = () => {
    const amount = parseFloat(form.amount)
    if (!amount || !form.category) return
    addTransaction({ type, amount, category: form.category, note: form.note, date: form.date })
    setForm({ amount: '', category: '', note: '', date: format(new Date(), 'yyyy-MM-dd') })
    setSuccess(true)
    setTimeout(() => setSuccess(false), 2000)
  }

  return (
    <div className="space-y-4">
      {/* Type toggle */}
      <div className="flex bg-zinc-100 dark:bg-zinc-800 rounded-2xl p-1 gap-1">
        <button
          onClick={() => { setType('expense'); setForm((f) => ({ ...f, category: '' })) }}
          className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all ${type === 'expense' ? 'bg-red-500 text-white shadow-sm' : 'text-zinc-400'}`}
        >
          Expense
        </button>
        <button
          onClick={() => { setType('income'); setForm((f) => ({ ...f, category: '' })) }}
          className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all ${type === 'income' ? 'bg-green-500 text-white shadow-sm' : 'text-zinc-400'}`}
        >
          Income
        </button>
      </div>

      {/* Amount */}
      <Card className="p-4">
        <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wide mb-2">Amount</p>
        <div className="flex items-center gap-2">
          <span className="text-3xl font-bold text-zinc-400">{currency}</span>
          <input
            type="number"
            inputMode="decimal"
            value={form.amount}
            onChange={(e) => setForm({ ...form, amount: e.target.value })}
            placeholder="0.00"
            className="flex-1 text-4xl font-bold bg-transparent border-0 outline-none text-zinc-900 dark:text-white placeholder:text-zinc-200 dark:placeholder:text-zinc-700"
          />
        </div>
      </Card>

      {/* Category */}
      <Select
        label="Category"
        value={form.category}
        onChange={(e) => setForm({ ...form, category: e.target.value })}
      >
        <option value="">Select category...</option>
        {categories.map((c) => <option key={c} value={c}>{c}</option>)}
      </Select>

      {/* Date */}
      <Input
        label="Date"
        type="date"
        value={form.date}
        onChange={(e) => setForm({ ...form, date: e.target.value })}
      />

      {/* Note */}
      <Input
        label="Note (optional)"
        value={form.note}
        onChange={(e) => setForm({ ...form, note: e.target.value })}
        placeholder="e.g. Supermarket run"
      />

      <Btn
        size="lg"
        variant={success ? 'success' : type === 'income' ? 'success' : 'primary'}
        onClick={submit}
        disabled={!form.amount || !form.category}
      >
        {success ? '✓ Saved!' : `Add ${type === 'income' ? 'Income' : 'Expense'}`}
      </Btn>
    </div>
  )
}

// ─── History tab ──────────────────────────────────────────────────────────────
function HistoryTab({ month, months, setMonth }) {
  const { transactions, deleteTransaction, currency } = useStore()
  const [confirmId, setConfirmId] = useState(null)

  const mTx = transactions
    .filter((t) => t.date.startsWith(month))
    .sort((a, b) => b.date.localeCompare(a.date))

  const grouped = mTx.reduce((acc, t) => {
    const key = t.date
    if (!acc[key]) acc[key] = []
    acc[key].push(t)
    return acc
  }, {})

  return (
    <div className="space-y-4">
      <MonthSelector value={month} onChange={setMonth} months={months} />

      {mTx.length === 0 && <EmptyState icon={TrendingDown} text="No transactions this month" />}

      {Object.entries(grouped).map(([date, txs]) => (
        <div key={date}>
          <SectionHeader>{format(parseISO(date), 'EEE, d MMM')}</SectionHeader>
          {txs.map((t) => (
            <Card key={t.id} className="flex items-center gap-3 px-4 py-3 mb-1.5">
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                t.type === 'income' ? 'bg-green-100 dark:bg-green-900/30' : 'bg-red-100 dark:bg-red-900/30'
              }`}>
                {t.type === 'income'
                  ? <TrendingUp size={15} className="text-green-600 dark:text-green-400" />
                  : <TrendingDown size={15} className="text-red-500 dark:text-red-400" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-zinc-800 dark:text-zinc-100 truncate">{t.category}</p>
                {t.note && <p className="text-xs text-zinc-400 truncate">{t.note}</p>}
              </div>
              <span className={`text-sm font-bold shrink-0 ${
                t.type === 'income' ? 'text-green-600 dark:text-green-400' : 'text-red-500 dark:text-red-400'
              }`}>
                {t.type === 'income' ? '+' : '-'}{currency}{t.amount.toFixed(2)}
              </span>
              <button
                onClick={() => setConfirmId(t.id)}
                className="p-1 text-zinc-200 hover:text-red-400 transition-colors shrink-0"
              >
                <Trash2 size={14} />
              </button>
            </Card>
          ))}
        </div>
      ))}

      <Modal open={!!confirmId} onClose={() => setConfirmId(null)} title="Delete transaction?">
        <div className="space-y-4">
          <p className="text-sm text-zinc-500 dark:text-zinc-400">This cannot be undone.</p>
          <Btn variant="danger" size="lg" onClick={() => { deleteTransaction(confirmId); setConfirmId(null) }}>
            <Trash2 size={15} /> Delete
          </Btn>
          <Btn variant="ghost" size="lg" onClick={() => setConfirmId(null)}>Cancel</Btn>
        </div>
      </Modal>
    </div>
  )
}

// ─── Budgets tab ──────────────────────────────────────────────────────────────
function BudgetsTab() {
  const { budgets, setBudget, expenseCategories, currency } = useStore()
  const [editing, setEditing] = useState(null)
  const [val, setVal] = useState('')

  const save = (cat) => {
    const n = parseFloat(val)
    if (!isNaN(n) && n >= 0) setBudget(cat, n)
    setEditing(null)
    setVal('')
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-zinc-500 dark:text-zinc-400">
        Set monthly spending limits per category. Bars in Overview will show how close you are.
      </p>
      <Card className="divide-y divide-zinc-100 dark:divide-zinc-700/50">
        {expenseCategories.map((cat) => (
          <div key={cat} className="flex items-center gap-3 px-4 py-3">
            <p className="flex-1 text-sm font-medium text-zinc-800 dark:text-zinc-100">{cat}</p>
            {editing === cat ? (
              <>
                <div className="flex items-center gap-1">
                  <span className="text-sm text-zinc-400">{currency}</span>
                  <input
                    autoFocus
                    type="number"
                    value={val}
                    onChange={(e) => setVal(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') save(cat); if (e.key === 'Escape') setEditing(null) }}
                    className="w-20 rounded-lg bg-zinc-100 dark:bg-zinc-700 border-0 px-2 py-1 text-sm text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <button onClick={() => save(cat)} className="p-1 text-green-500"><TrendingUp size={15} /></button>
              </>
            ) : (
              <button
                onClick={() => { setEditing(cat); setVal(budgets[cat] ? String(budgets[cat]) : '') }}
                className="flex items-center gap-1 text-sm text-zinc-400 hover:text-blue-500 transition-colors"
              >
                {budgets[cat] ? `${currency}${budgets[cat]}` : 'Set limit'}
                <ChevronDown size={14} />
              </button>
            )}
          </div>
        ))}
      </Card>
    </div>
  )
}

// ─── Main ─────────────────────────────────────────────────────────────────────
const TABS = [
  { key: 'overview', label: 'Overview' },
  { key: 'add', label: 'Add' },
  { key: 'history', label: 'History' },
  { key: 'budgets', label: 'Budgets' },
]

export default function Finance() {
  const [tab, setTab] = useState('overview')
  const { transactions } = useStore()
  const months = useSortedMonths(transactions)
  const [month, setMonth] = useState(months[0] ?? format(new Date(), 'yyyy-MM'))

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">Finance</h1>
      <div className="flex bg-zinc-100 dark:bg-zinc-800 rounded-2xl p-1 gap-1">
        {TABS.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
              tab === key ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white shadow-sm' : 'text-zinc-400'
            }`}
          >
            {label}
          </button>
        ))}
      </div>
      {tab === 'overview' && <OverviewTab month={month} months={months} setMonth={setMonth} />}
      {tab === 'add' && <AddTab />}
      {tab === 'history' && <HistoryTab month={month} months={months} setMonth={setMonth} />}
      {tab === 'budgets' && <BudgetsTab />}
    </div>
  )
}
