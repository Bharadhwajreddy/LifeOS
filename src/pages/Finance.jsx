import { useState, useMemo, useRef, useEffect } from 'react'
import { Plus, Trash2, TrendingUp, TrendingDown, ChevronLeft, ChevronRight } from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { useStore } from '../store'
import Modal from '../components/Modal'
import { Card, Btn, Input, Select, SectionHeader, EmptyState, Badge } from '../components/UI'

// ─── helpers ────────────────────────────────────────────────────────────────

function parseMonth(ym) {
  const [y, m] = ym.split('-')
  return new Date(+y, +m - 1, 1)
}
function fmtMonth(ym) {
  return format(parseMonth(ym), 'MMM yyyy')
}

function useSortedMonths(transactions) {
  return useMemo(() => {
    const set = new Set(transactions.map((t) => t.date.slice(0, 7)))
    const current = format(new Date(), 'yyyy-MM')
    set.add(current)
    return [...set].sort((a, b) => b.localeCompare(a))
  }, [transactions])
}

// ─── Month selector ──────────────────────────────────────────────────────────
function MonthSelector({ value, onChange, months }) {
  const scrollRef = useRef(null)
  useEffect(() => {
    const el = scrollRef.current?.querySelector('[data-active]')
    if (el) el.scrollIntoView({ inline: 'center', behavior: 'smooth' })
  }, [value])

  return (
    <div ref={scrollRef} className="flex gap-2 overflow-x-auto scrollbar-hide py-1">
      {months.map((m) => (
        <button
          key={m}
          data-active={m === value ? '' : undefined}
          onClick={() => onChange(m)}
          className={`shrink-0 px-3 py-1.5 rounded-full text-sm font-semibold transition-all ${
            m === value
              ? 'bg-blue-500 text-white shadow-sm shadow-blue-200 dark:shadow-blue-900'
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
function OverviewTab() {
  const { transactions, currency, budgets, incomeSources } = useStore()
  const months = useSortedMonths(transactions)
  const [month, setMonth] = useState(format(new Date(), 'yyyy-MM'))

  const monthTx = transactions.filter((t) => t.date.startsWith(month))
  const incomeTx = monthTx.filter((t) => t.type === 'income')
  const expenseTx = monthTx.filter((t) => t.type === 'expense')

  const totalIncome = incomeTx.reduce((s, t) => s + t.amount, 0)
  const totalExpenses = expenseTx.reduce((s, t) => s + t.amount, 0)
  const saved = totalIncome - totalExpenses

  const bySource = incomeTx.reduce((acc, t) => {
    acc[t.category] = (acc[t.category] || 0) + t.amount
    return acc
  }, {})

  const byCategory = expenseTx.reduce((acc, t) => {
    acc[t.category] = (acc[t.category] || 0) + t.amount
    return acc
  }, {})

  const sourceColors = ['blue', 'green', 'purple', 'amber', 'red']
  const knownSources = [...incomeSources]

  return (
    <div className="space-y-5">
      <MonthSelector value={month} onChange={setMonth} months={months} />

      {/* Big summary */}
      <div className="grid grid-cols-3 gap-2.5">
        <div className="bg-green-50 dark:bg-green-900/20 rounded-2xl p-3.5">
          <p className="text-xs font-medium text-green-600 dark:text-green-400 mb-1">Income</p>
          <p className="text-xl font-bold text-green-700 dark:text-green-300 leading-tight">
            {currency}{totalIncome.toFixed(0)}
          </p>
        </div>
        <div className="bg-red-50 dark:bg-red-900/20 rounded-2xl p-3.5">
          <p className="text-xs font-medium text-red-600 dark:text-red-400 mb-1">Spent</p>
          <p className="text-xl font-bold text-red-700 dark:text-red-300 leading-tight">
            {currency}{totalExpenses.toFixed(0)}
          </p>
        </div>
        <div className={`rounded-2xl p-3.5 ${saved >= 0 ? 'bg-blue-50 dark:bg-blue-900/20' : 'bg-orange-50 dark:bg-orange-900/20'}`}>
          <p className={`text-xs font-medium mb-1 ${saved >= 0 ? 'text-blue-600 dark:text-blue-400' : 'text-orange-600 dark:text-orange-400'}`}>Saved</p>
          <p className={`text-xl font-bold leading-tight ${saved >= 0 ? 'text-blue-700 dark:text-blue-300' : 'text-orange-700 dark:text-orange-300'}`}>
            {saved >= 0 ? '+' : ''}{currency}{saved.toFixed(0)}
          </p>
        </div>
      </div>

      {/* Income breakdown */}
      {Object.keys(bySource).length > 0 && (
        <>
          <SectionHeader>Income sources</SectionHeader>
          <div className="grid grid-cols-2 gap-2">
            {Object.entries(bySource).sort((a, b) => b[1] - a[1]).map(([src, amt], i) => (
              <Card key={src} className="p-3.5">
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center mb-2 ${
                  i === 0 ? 'bg-blue-100 dark:bg-blue-900/30' :
                  i === 1 ? 'bg-green-100 dark:bg-green-900/30' :
                  'bg-purple-100 dark:bg-purple-900/30'
                }`}>
                  <TrendingUp size={16} className={
                    i === 0 ? 'text-blue-500' : i === 1 ? 'text-green-500' : 'text-purple-500'
                  } />
                </div>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">{src}</p>
                <p className="text-base font-bold text-zinc-900 dark:text-white mt-0.5">{currency}{amt.toFixed(2)}</p>
              </Card>
            ))}
          </div>
        </>
      )}

      {/* Expense breakdown */}
      {Object.keys(byCategory).length > 0 && (
        <>
          <SectionHeader>Expenses</SectionHeader>
          <div className="space-y-2">
            {Object.entries(byCategory).sort((a, b) => b[1] - a[1]).map(([cat, amt]) => {
              const budget = budgets[cat]
              const pct = budget ? Math.min((amt / budget) * 100, 100) : null
              const over = budget && amt > budget
              return (
                <Card key={cat} className="px-4 py-3">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-sm font-medium text-zinc-700 dark:text-zinc-200">{cat}</p>
                    <div className="flex items-center gap-2">
                      {over && <span className="text-xs text-red-500 font-semibold">Over!</span>}
                      <p className={`text-sm font-bold ${over ? 'text-red-600 dark:text-red-400' : 'text-zinc-800 dark:text-zinc-100'}`}>
                        {currency}{amt.toFixed(0)}
                      </p>
                    </div>
                  </div>
                  {budget > 0 && (
                    <>
                      <div className="h-1.5 bg-zinc-100 dark:bg-zinc-700 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${
                            over ? 'bg-red-500' : pct > 70 ? 'bg-amber-500' : 'bg-blue-500'
                          }`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <p className="text-xs text-zinc-400 mt-1">{currency}{amt.toFixed(0)} of {currency}{budget} budget</p>
                    </>
                  )}
                </Card>
              )
            })}
          </div>
        </>
      )}

      {monthTx.length === 0 && (
        <div className="py-10 text-center text-sm text-zinc-400">No data for {fmtMonth(month)}</div>
      )}
    </div>
  )
}

// ─── Add tab ──────────────────────────────────────────────────────────────────
function AddTab() {
  const { addTransaction, currency, incomeSources, expenseCategories } = useStore()
  const [type, setType] = useState('expense')
  const [form, setForm] = useState({
    amount: '', category: 'Groceries', note: '', date: format(new Date(), 'yyyy-MM-dd'),
  })

  const cats = type === 'expense' ? expenseCategories : incomeSources

  const submit = () => {
    const amt = parseFloat(form.amount)
    if (!amt || isNaN(amt)) return
    addTransaction({ type, amount: amt, category: form.category, note: form.note, date: form.date })
    setForm((f) => ({ ...f, amount: '', note: '' }))
  }

  const setField = (k, v) => setForm((f) => ({ ...f, [k]: v }))

  return (
    <div className="space-y-5">
      {/* Expense / Income toggle */}
      <div className="flex bg-zinc-100 dark:bg-zinc-800 rounded-2xl p-1 gap-1">
        {['expense', 'income'].map((tp) => (
          <button
            key={tp}
            onClick={() => {
              setType(tp)
              setField('category', tp === 'expense' ? 'Groceries' : incomeSources[0])
            }}
            className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all ${
              type === tp
                ? tp === 'expense'
                  ? 'bg-red-500 text-white shadow'
                  : 'bg-green-500 text-white shadow'
                : 'text-zinc-400'
            }`}
          >
            {tp === 'expense' ? '− Expense' : '+ Income'}
          </button>
        ))}
      </div>

      {/* Amount — big and prominent */}
      <div className="relative">
        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl font-bold text-zinc-400">{currency}</span>
        <input
          type="number"
          inputMode="decimal"
          placeholder="0.00"
          value={form.amount}
          onChange={(e) => setField('amount', e.target.value)}
          className="w-full rounded-2xl bg-zinc-100 dark:bg-zinc-800 border-0 pl-10 pr-4 py-4 text-2xl font-bold text-zinc-900 dark:text-white placeholder:text-zinc-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <Select label="Category" value={form.category} onChange={(e) => setField('category', e.target.value)}>
        {cats.map((c) => <option key={c}>{c}</option>)}
      </Select>
      <Input label="Note (optional)" value={form.note} placeholder="What's this for?" onChange={(e) => setField('note', e.target.value)} />
      <Input label="Date" type="date" value={form.date} onChange={(e) => setField('date', e.target.value)} />

      <Btn
        size="lg"
        variant={type === 'expense' ? 'danger' : 'success'}
        onClick={submit}
        disabled={!form.amount}
      >
        {type === 'expense' ? '− Add Expense' : '+ Add Income'}
      </Btn>
    </div>
  )
}

// ─── History tab ──────────────────────────────────────────────────────────────
function HistoryTab() {
  const { transactions, deleteTransaction, currency } = useStore()
  const months = useSortedMonths(transactions)
  const [month, setMonth] = useState(format(new Date(), 'yyyy-MM'))

  const monthTx = useMemo(() =>
    transactions.filter((t) => t.date.startsWith(month)).sort((a, b) => b.date.localeCompare(a.date)),
    [transactions, month]
  )

  // Group by date
  const groups = useMemo(() => {
    return monthTx.reduce((acc, t) => {
      const key = t.date
      ;(acc[key] = acc[key] || []).push(t)
      return acc
    }, {})
  }, [monthTx])

  return (
    <div className="space-y-4">
      <MonthSelector value={month} onChange={setMonth} months={months} />

      {monthTx.length === 0
        ? <div className="py-10 text-center text-sm text-zinc-400">No transactions in {fmtMonth(month)}</div>
        : Object.entries(groups).map(([date, items]) => (
          <div key={date}>
            <SectionHeader>{format(parseISO(date), 'EEEE, d MMM')}</SectionHeader>
            <div className="space-y-2">
              {items.map((tx) => (
                <Card key={tx.id} className="flex items-center gap-3 px-4 py-3">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                    tx.type === 'expense'
                      ? 'bg-red-100 dark:bg-red-900/30'
                      : 'bg-green-100 dark:bg-green-900/30'
                  }`}>
                    {tx.type === 'expense'
                      ? <TrendingDown size={15} className="text-red-500" />
                      : <TrendingUp size={15} className="text-green-500" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-100">{tx.category}</p>
                    {tx.note && <p className="text-xs text-zinc-400 truncate">{tx.note}</p>}
                  </div>
                  <p className={`text-sm font-bold shrink-0 ${
                    tx.type === 'expense' ? 'text-red-500' : 'text-green-500'
                  }`}>
                    {tx.type === 'expense' ? '-' : '+'}{currency}{tx.amount.toFixed(2)}
                  </p>
                  <button onClick={() => deleteTransaction(tx.id)} className="p-1.5 text-zinc-200 hover:text-red-400 transition-colors">
                    <Trash2 size={14} />
                  </button>
                </Card>
              ))}
            </div>
          </div>
        ))}
    </div>
  )
}

// ─── Budgets tab ──────────────────────────────────────────────────────────────
function BudgetsTab() {
  const { budgets, setBudget, expenseCategories, currency } = useStore()
  const [editing, setEditing] = useState(null)
  const [val, setVal] = useState('')

  return (
    <div className="space-y-3">
      <p className="text-sm text-zinc-500 dark:text-zinc-400">
        Set monthly limits per category. A progress bar will show how close you are.
      </p>
      {expenseCategories.map((cat) => (
        <Card
          key={cat}
          className="flex items-center justify-between px-4 py-3.5 cursor-pointer active:scale-[0.98] transition-transform"
          onClick={() => { setEditing(cat); setVal(String(budgets[cat] ?? 0)) }}
        >
          <p className="text-sm font-medium text-zinc-700 dark:text-zinc-200">{cat}</p>
          <div className="flex items-center gap-2">
            <p className="text-sm font-bold text-zinc-800 dark:text-zinc-100">
              {budgets[cat] ? `${currency}${budgets[cat]}/mo` : 'No limit'}
            </p>
            <span className="text-zinc-300 dark:text-zinc-600 text-xs">›</span>
          </div>
        </Card>
      ))}

      <Modal open={!!editing} onClose={() => setEditing(null)} title={`Budget: ${editing}`}>
        <div className="space-y-4">
          <Input
            label={`Monthly limit (${currency})`}
            type="number"
            inputMode="decimal"
            value={val}
            onChange={(e) => setVal(e.target.value)}
            placeholder="0 = no limit"
          />
          <Btn size="lg" onClick={() => { setBudget(editing, parseFloat(val) || 0); setEditing(null) }}>
            Save Budget
          </Btn>
        </div>
      </Modal>
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

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">Finance</h1>

      <div className="flex bg-zinc-100 dark:bg-zinc-800 rounded-2xl p-1 gap-0.5">
        {TABS.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
              tab === key
                ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white shadow-sm'
                : 'text-zinc-400'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === 'overview' && <OverviewTab />}
      {tab === 'add' && <AddTab />}
      {tab === 'history' && <HistoryTab />}
      {tab === 'budgets' && <BudgetsTab />}
    </div>
  )
}
