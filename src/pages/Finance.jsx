import { useState, useRef, useEffect, useLayoutEffect } from 'react'
import { Trash2, TrendingUp, TrendingDown, ChevronDown, Plus, Check } from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { useStore } from '../store'
import Modal from '../components/Modal'
import { Card, Btn, Input, Select, SectionHeader, EmptyState, TabBar } from '../components/UI'

const fmtMonth = (ym) => {
  const [y, m] = ym.split('-')
  return format(new Date(+y, +m - 1, 1), 'MMM yy')
}

function useSortedMonths(transactions) {
  const current = format(new Date(), 'yyyy-MM')
  const fromTx = transactions.map((t) => t.date.slice(0, 7))
  return [...new Set([current, ...fromTx])].sort((a, b) => b.localeCompare(a))
}

// ─── Month Selector ───────────────────────────────────────────────────────────
function MonthSelector({ value, onChange, months }) {
  const ref = useRef(null)
  const firstRender = useRef(true)

  useLayoutEffect(() => {
    const container = ref.current
    if (!container) return
    const active = container.querySelector('[data-active]')
    if (!active) return
    const activeRect    = active.getBoundingClientRect()
    const containerRect = container.getBoundingClientRect()
    const target = Math.max(
      0,
      container.scrollLeft + (activeRect.left - containerRect.left) - containerRect.width / 2 + activeRect.width / 2
    )
    if (firstRender.current) {
      container.scrollLeft = target
      firstRender.current = false
    } else {
      container.scrollTo({ left: target, behavior: 'smooth' })
    }
  }, [value])

  return (
    <div ref={ref} className="flex gap-2 overflow-x-auto scrollbar-hide py-1">
      {months.map((m) => (
        <button
          key={m}
          data-active={m === value ? '' : undefined}
          onClick={() => onChange(m)}
          className={`shrink-0 px-4 py-1.5 rounded-full text-sm font-semibold transition-all ${
            m === value
              ? 'bg-blue-500 text-white shadow-sm shadow-blue-500/30'
              : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400'
          }`}
        >
          {fmtMonth(m)}
        </button>
      ))}
    </div>
  )
}

// ─── Overview ─────────────────────────────────────────────────────────────────
function OverviewTab({ month, months, setMonth }) {
  const { transactions, budgets, currency, incomeSources, expenseCategories } = useStore()

  const mTx      = transactions.filter((t) => t.date.startsWith(month))
  const income   = mTx.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0)
  const expenses = mTx.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0)
  const saved    = income - expenses

  const incomeBySource = incomeSources
    .map((src) => ({ src, amount: mTx.filter((t) => t.type === 'income' && t.category === src).reduce((s, t) => s + t.amount, 0) }))
    .filter((x) => x.amount > 0)

  const expByCategory = expenseCategories
    .map((cat) => ({
      cat,
      amount: mTx.filter((t) => t.type === 'expense' && t.category === cat).reduce((s, t) => s + t.amount, 0),
      budget: budgets[cat] || 0,
    }))
    .filter((x) => x.amount > 0)
    .sort((a, b) => b.amount - a.amount)

  return (
    <div className="space-y-5">
      <MonthSelector value={month} onChange={setMonth} months={months} />

      <div className="grid grid-cols-3 gap-2">
        <div className="bg-emerald-500 rounded-2xl p-3.5 shadow-lg shadow-emerald-500/25">
          <p className="text-[10px] font-bold text-emerald-100 uppercase tracking-wide">Income</p>
          <p className="text-xl font-bold text-white mt-1 leading-none">{currency}{income.toFixed(0)}</p>
        </div>
        <div className="bg-rose-500 rounded-2xl p-3.5 shadow-lg shadow-rose-500/25">
          <p className="text-[10px] font-bold text-rose-100 uppercase tracking-wide">Spent</p>
          <p className="text-xl font-bold text-white mt-1 leading-none">{currency}{expenses.toFixed(0)}</p>
        </div>
        <div className={`rounded-2xl p-3.5 shadow-lg ${saved >= 0 ? 'bg-blue-500 shadow-blue-500/25' : 'bg-amber-500 shadow-amber-500/25'}`}>
          <p className={`text-[10px] font-bold uppercase tracking-wide ${saved >= 0 ? 'text-blue-100' : 'text-amber-100'}`}>Saved</p>
          <p className="text-xl font-bold text-white mt-1 leading-none">
            {saved >= 0 ? '+' : ''}{currency}{saved.toFixed(0)}
          </p>
        </div>
      </div>

      {incomeBySource.length > 0 && (
        <>
          <SectionHeader>Income Sources</SectionHeader>
          <div className="grid grid-cols-2 gap-2">
            {incomeBySource.map(({ src, amount }) => (
              <Card key={src} className="p-4">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-2 h-2 rounded-full bg-emerald-400" />
                  <p className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">{src}</p>
                </div>
                <p className="text-xl font-bold text-zinc-900 dark:text-white">{currency}{amount.toFixed(2)}</p>
                <p className="text-xs text-zinc-400 mt-0.5">{income > 0 ? Math.round((amount / income) * 100) : 0}% of total</p>
              </Card>
            ))}
          </div>
        </>
      )}

      {expByCategory.length > 0 && (
        <>
          <SectionHeader>Where Money Went</SectionHeader>
          <Card className="p-4 divide-y divide-zinc-100 dark:divide-zinc-800">
            {expByCategory.map(({ cat, amount, budget }) => {
              const pct  = budget > 0 ? Math.min((amount / budget) * 100, 100) : 0
              const over = budget > 0 && amount > budget
              return (
                <div key={cat} className="py-3 first:pt-0 last:pb-0">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-sm font-medium text-zinc-700 dark:text-zinc-200">{cat}</span>
                    <div className="flex items-center gap-2">
                      <span className={`text-sm font-bold ${over ? 'text-rose-500' : 'text-zinc-800 dark:text-zinc-100'}`}>
                        {currency}{amount.toFixed(2)}
                      </span>
                      {budget > 0 && <span className="text-xs text-zinc-400">/{currency}{budget}</span>}
                    </div>
                  </div>
                  {budget > 0 && (
                    <div className="h-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full transition-all ${over ? 'bg-rose-400' : 'bg-blue-400'}`} style={{ width: `${pct}%` }} />
                    </div>
                  )}
                </div>
              )
            })}
          </Card>
        </>
      )}

      {mTx.length === 0 && <EmptyState icon={TrendingUp} text="No transactions this month" />}
    </div>
  )
}

// ─── Add ──────────────────────────────────────────────────────────────────────
function AddTab() {
  const { addTransaction, incomeSources, expenseCategories, currency } = useStore()
  const [type, setType]       = useState('expense')
  const [form, setForm]       = useState({ amount: '', category: '', note: '', date: format(new Date(), 'yyyy-MM-dd') })
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
      <div className="flex bg-zinc-100 dark:bg-zinc-800/80 rounded-2xl p-1 gap-1">
        <button
          onClick={() => { setType('expense'); setForm((f) => ({ ...f, category: '' })) }}
          className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all ${type === 'expense' ? 'bg-rose-500 text-white shadow-sm' : 'text-zinc-400'}`}
        >
          Expense
        </button>
        <button
          onClick={() => { setType('income'); setForm((f) => ({ ...f, category: '' })) }}
          className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all ${type === 'income' ? 'bg-emerald-500 text-white shadow-sm' : 'text-zinc-400'}`}
        >
          Income
        </button>
      </div>

      <Card className="p-5">
        <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-3">Amount</p>
        <div className="flex items-center gap-2">
          <span className="text-4xl font-bold text-zinc-300 dark:text-zinc-600">{currency}</span>
          <input
            type="number"
            inputMode="decimal"
            value={form.amount}
            onChange={(e) => setForm({ ...form, amount: e.target.value })}
            placeholder="0.00"
            className="flex-1 text-4xl font-bold bg-transparent border-0 outline-none text-zinc-900 dark:text-white placeholder:text-zinc-200 dark:placeholder:text-zinc-800"
          />
        </div>
      </Card>

      <Select label="Category" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
        <option value="">Select category...</option>
        {categories.map((c) => <option key={c} value={c}>{c}</option>)}
      </Select>
      <Input label="Date" type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
      <Input label="Note (optional)" value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} placeholder="e.g. Lidl run, May rent..." />

      <Btn size="lg" variant={success ? 'success' : 'primary'} onClick={submit} disabled={!form.amount || !form.category}>
        {success ? <><Check size={18} /> Saved!</> : `Add ${type === 'income' ? 'Income' : 'Expense'}`}
      </Btn>
    </div>
  )
}

// ─── History ──────────────────────────────────────────────────────────────────
function HistoryTab({ month, months, setMonth }) {
  const { transactions, deleteTransaction, currency } = useStore()
  const [confirmId, setConfirmId] = useState(null)

  const mTx = transactions
    .filter((t) => t.date.startsWith(month))
    .sort((a, b) => b.date.localeCompare(a.date))

  const grouped = mTx.reduce((acc, t) => {
    if (!acc[t.date]) acc[t.date] = []
    acc[t.date].push(t)
    return acc
  }, {})

  return (
    <div className="space-y-4">
      <MonthSelector value={month} onChange={setMonth} months={months} />
      {mTx.length === 0 && <EmptyState icon={TrendingDown} text="No transactions this month" />}

      {Object.entries(grouped).map(([date, txs]) => {
        const dayInc = txs.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0)
        const dayExp = txs.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0)
        return (
          <div key={date}>
            <div className="flex items-center justify-between mb-2">
              <SectionHeader>{format(parseISO(date), 'EEE, d MMM')}</SectionHeader>
              <div className="flex gap-3 text-xs font-bold pb-2">
                {dayInc > 0 && <span className="text-emerald-500">+{currency}{dayInc.toFixed(2)}</span>}
                {dayExp > 0 && <span className="text-rose-500">-{currency}{dayExp.toFixed(2)}</span>}
              </div>
            </div>
            {txs.map((t) => (
              <Card key={t.id} className="flex items-center gap-3 px-4 py-3.5 mb-2">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${t.type === 'income' ? 'bg-emerald-100 dark:bg-emerald-500/15' : 'bg-rose-100 dark:bg-rose-500/15'}`}>
                  {t.type === 'income'
                    ? <TrendingUp size={16} className="text-emerald-600 dark:text-emerald-400" />
                    : <TrendingDown size={16} className="text-rose-500 dark:text-rose-400" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-100 truncate">{t.category}</p>
                  {t.note && <p className="text-xs text-zinc-400 truncate">{t.note}</p>}
                </div>
                <span className={`text-sm font-bold shrink-0 ${t.type === 'income' ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-500 dark:text-rose-400'}`}>
                  {t.type === 'income' ? '+' : '-'}{currency}{t.amount.toFixed(2)}
                </span>
                <button onClick={() => setConfirmId(t.id)} className="p-1.5 text-zinc-300 dark:text-zinc-700 hover:text-rose-400 transition-colors">
                  <Trash2 size={14} />
                </button>
              </Card>
            ))}
          </div>
        )
      })}

      <Modal open={!!confirmId} onClose={() => setConfirmId(null)} title="Delete transaction?">
        <div className="space-y-3">
          <p className="text-sm text-zinc-500 dark:text-zinc-400">This cannot be undone.</p>
          <Btn variant="danger" size="lg" onClick={() => { deleteTransaction(confirmId); setConfirmId(null) }}><Trash2 size={15} /> Delete</Btn>
          <Btn variant="ghost" size="lg" onClick={() => setConfirmId(null)}>Cancel</Btn>
        </div>
      </Modal>
    </div>
  )
}

// ─── Budgets ──────────────────────────────────────────────────────────────────
function BudgetsTab() {
  const { budgets, setBudget, expenseCategories, currency, transactions } = useStore()
  const [editing, setEditing] = useState(null)
  const [val, setVal]         = useState('')

  const thisMonth = format(new Date(), 'yyyy-MM')
  const mTx = transactions.filter((t) => t.date.startsWith(thisMonth) && t.type === 'expense')

  const save = (cat) => {
    const n = parseFloat(val)
    if (!isNaN(n) && n >= 0) setBudget(cat, n)
    setEditing(null); setVal('')
  }

  return (
    <div className="space-y-4">
      <Card className="p-4 bg-amber-50 dark:bg-amber-500/10 ring-amber-200/60 dark:ring-amber-500/20">
        <p className="text-sm font-semibold text-amber-800 dark:text-amber-300">💡 Set monthly spending limits</p>
        <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">Limits appear as progress bars in Overview. Tap to edit.</p>
      </Card>
      <Card className="divide-y divide-zinc-100 dark:divide-zinc-800">
        {expenseCategories.map((cat) => {
          const spent  = mTx.filter((t) => t.category === cat).reduce((s, t) => s + t.amount, 0)
          const budget = budgets[cat] || 0
          const over   = budget > 0 && spent > budget
          return (
            <div key={cat} className="flex items-center gap-3 px-4 py-3.5">
              <div className="flex-1">
                <p className="text-sm font-medium text-zinc-800 dark:text-zinc-100">{cat}</p>
                {budget > 0 && (
                  <p className={`text-xs mt-0.5 font-medium ${over ? 'text-rose-500' : 'text-zinc-400'}`}>
                    {currency}{spent.toFixed(0)} of {currency}{budget} {over ? '— over!' : ''}
                  </p>
                )}
              </div>
              {editing === cat ? (
                <div className="flex items-center gap-1.5">
                  <span className="text-sm text-zinc-400">{currency}</span>
                  <input
                    autoFocus type="number" value={val}
                    onChange={(e) => setVal(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') save(cat); if (e.key === 'Escape') setEditing(null) }}
                    className="w-20 rounded-xl bg-zinc-100 dark:bg-zinc-800 border-0 px-3 py-1.5 text-sm text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/70"
                  />
                  <button onClick={() => save(cat)} className="p-1.5 text-emerald-500"><Check size={15} /></button>
                </div>
              ) : (
                <button
                  onClick={() => { setEditing(cat); setVal(budget ? String(budget) : '') }}
                  className={`flex items-center gap-1 text-sm font-semibold transition-colors ${budget ? 'text-blue-500' : 'text-zinc-400 hover:text-blue-500'}`}
                >
                  {budget ? `${currency}${budget}` : 'Set limit'}
                  <ChevronDown size={13} />
                </button>
              )}
            </div>
          )
        })}
      </Card>
    </div>
  )
}

// ─── Main ─────────────────────────────────────────────────────────────────────
const TABS = [
  { key: 'overview', label: 'Overview' },
  { key: 'add',      label: '+ Add' },
  { key: 'history',  label: 'History' },
  { key: 'budgets',  label: 'Budgets' },
]

export default function Finance() {
  const { transactions } = useStore()
  const months = useSortedMonths(transactions)
  const [month, setMonth] = useState(months[0] ?? format(new Date(), 'yyyy-MM'))
  const [tab, setTab]     = useState('overview')

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">Finance</h1>
      <TabBar tabs={TABS} active={tab} onChange={setTab} />
      {tab === 'overview' && <OverviewTab month={month} months={months} setMonth={setMonth} />}
      {tab === 'add'      && <AddTab />}
      {tab === 'history'  && <HistoryTab month={month} months={months} setMonth={setMonth} />}
      {tab === 'budgets'  && <BudgetsTab />}
    </div>
  )
}
