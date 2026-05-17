import { useState, useRef, useLayoutEffect } from 'react'
import { Trash2, TrendingUp, TrendingDown, ChevronDown, Check } from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { motion, AnimatePresence } from 'framer-motion'
import { useStore } from '../store'
import Modal from '../components/Modal'
import { Card, Btn, Input, Select, SectionHeader, EmptyState, TabBar } from '../components/UI'
import { AnimatedNumber, StaggerContainer, StaggerItem } from '../components/Animations'

// ─── Helpers ──────────────────────────────────────────────────────────────────
const fmtMonth = (ym) => {
  const [y, m] = ym.split('-')
  return format(new Date(+y, +m - 1, 1), 'MMM yy')
}

function useSortedMonths(transactions) {
  const current = format(new Date(), 'yyyy-MM')
  const fromTx = transactions.map((t) => t.date.slice(0, 7))
  return [...new Set([current, ...fromTx])].sort((a, b) => b.localeCompare(a))
}

// Category → emoji map
const CAT_EMOJI = {
  Rent: '🏠',
  Insurance: '🛡️',
  Phone: '📱',
  Groceries: '🛒',
  'India Transfer': '🌏',
  Transport: '🚗',
  Entertainment: '🎬',
  'Mutual Funds': '📈',
  Health: '💊',
  Education: '📚',
  'Bank Fees': '🏦',
  Other: '📦',
  Lumileds: '💼',
  Hexenhof: '💼',
  Tips: '💵',
}
const catEmoji = (cat) => CAT_EMOJI[cat] ?? '💰'

// Donut palette – vivid but CSS-variable-safe hex values
const DONUT_COLORS = [
  '#f87171', // red
  '#fb923c', // orange
  '#facc15', // yellow
  '#34d399', // emerald
  '#60a5fa', // blue
]

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
          style={
            m === value
              ? { background: 'var(--accent)', color: '#fff', boxShadow: '0 2px 8px var(--shadow-pop)' }
              : { background: 'var(--surface)', color: 'var(--text-2)' }
          }
          className="shrink-0 px-4 py-1.5 rounded-full text-sm font-semibold transition-all"
        >
          {fmtMonth(m)}
        </button>
      ))}
    </div>
  )
}

// ─── Animated Donut Chart ─────────────────────────────────────────────────────
function DonutChart({ slices, total, currency }) {
  const size   = 160
  const stroke = 22
  const r      = (size - stroke) / 2
  const circ   = 2 * Math.PI * r
  const cx     = size / 2
  const cy     = size / 2

  // Build cumulative offset per slice
  let cumulative = 0
  const segments = slices.map((s, i) => {
    const pct  = total > 0 ? s.amount / total : 0
    const dash = pct * circ
    const gap  = circ - dash
    const offset = -cumulative * circ      // negative because we rotate -90deg via transform
    cumulative += pct
    return { ...s, dash, gap, offset, color: DONUT_COLORS[i % DONUT_COLORS.length] }
  })

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
      {/* SVG donut */}
      <div style={{ position: 'relative', width: size, height: size }}>
        <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
          {/* track */}
          <circle
            cx={cx} cy={cy} r={r}
            fill="none"
            stroke="rgba(128,128,128,0.12)"
            strokeWidth={stroke}
          />
          {segments.map((seg, i) => (
            <motion.circle
              key={seg.cat}
              cx={cx} cy={cy} r={r}
              fill="none"
              stroke={seg.color}
              strokeWidth={stroke}
              strokeLinecap="butt"
              strokeDasharray={`${seg.dash} ${seg.gap}`}
              strokeDashoffset={-cumulative * circ + seg.offset + seg.dash}
              initial={{ strokeDasharray: `0 ${circ}` }}
              animate={{ strokeDasharray: `${seg.dash} ${seg.gap}` }}
              transition={{ duration: 0.7, ease: 'easeOut', delay: 0.2 + i * 0.12 }}
            />
          ))}
        </svg>
        {/* center label */}
        <div style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-2)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Spent</span>
          <span style={{ fontSize: 20, fontWeight: 800, color: 'var(--text)', lineHeight: 1.2 }}>
            {currency}<AnimatedNumber value={Math.round(total)} duration={900} />
          </span>
        </div>
      </div>

      {/* Legend */}
      <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 6 }}>
        {segments.map((seg) => (
          <div key={seg.cat} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ width: 10, height: 10, borderRadius: 9999, background: seg.color, flexShrink: 0 }} />
            <span style={{ flex: 1, fontSize: 13, color: 'var(--text)', fontWeight: 500 }}>{seg.cat}</span>
            <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>
              {currency}{seg.amount.toFixed(2)}
            </span>
            <span style={{ fontSize: 11, color: 'var(--text-2)', minWidth: 32, textAlign: 'right' }}>
              {total > 0 ? Math.round((seg.amount / total) * 100) : 0}%
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Income vs Expense Bar ────────────────────────────────────────────────────
function IncomeExpenseBar({ income, expenses }) {
  const total  = income + expenses
  const incPct = total > 0 ? (income / total) * 100 : 50
  const expPct = total > 0 ? (expenses / total) * 100 : 50

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
        <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--success)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          Income
        </span>
        <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--danger)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          Expense
        </span>
      </div>
      <div style={{
        height: 10,
        borderRadius: 9999,
        overflow: 'hidden',
        background: 'rgba(128,128,128,0.12)',
        display: 'flex',
      }}>
        <motion.div
          style={{ height: '100%', background: 'var(--success)', borderRadius: '9999px 0 0 9999px' }}
          initial={{ width: 0 }}
          animate={{ width: `${incPct}%` }}
          transition={{ duration: 0.9, ease: 'easeOut', delay: 0.2 }}
        />
        <motion.div
          style={{ height: '100%', background: 'var(--danger)', borderRadius: '0 9999px 9999px 0', marginLeft: 'auto' }}
          initial={{ width: 0 }}
          animate={{ width: `${expPct}%` }}
          transition={{ duration: 0.9, ease: 'easeOut', delay: 0.2 }}
        />
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
        <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--success)' }}>{Math.round(incPct)}%</span>
        <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--danger)' }}>{Math.round(expPct)}%</span>
      </div>
    </div>
  )
}

// ─── Budget Progress Bar ───────────────────────────────────────────────────────
function BudgetBar({ spent, budget }) {
  const pct   = budget > 0 ? Math.min((spent / budget) * 100, 100) : 0
  const color = pct >= 90 ? 'var(--danger)' : pct >= 70 ? '#f59e0b' : 'var(--success)'
  return (
    <div style={{ height: 6, borderRadius: 9999, overflow: 'hidden', background: 'rgba(128,128,128,0.12)' }}>
      <motion.div
        style={{ height: '100%', borderRadius: 9999, background: color }}
        initial={{ width: 0 }}
        animate={{ width: `${pct}%` }}
        transition={{ duration: 0.8, ease: 'easeOut', delay: 0.15 }}
      />
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

  const top5 = expByCategory.slice(0, 5)

  const savedColor = saved >= 0 ? 'var(--success)' : 'var(--danger)'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <MonthSelector value={month} onChange={setMonth} months={months} />

      {/* ── Summary stat cards ── */}
      <StaggerContainer stagger={0.07}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
          <StaggerItem>
            <div style={{ background: 'var(--success)', borderRadius: 16, padding: '14px 12px', boxShadow: '0 4px 16px rgba(52,211,153,0.25)' }}>
              <p style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.8)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Income</p>
              <p style={{ fontSize: 20, fontWeight: 800, color: '#fff', marginTop: 4, lineHeight: 1 }}>
                {currency}<AnimatedNumber value={Math.round(income)} duration={800} />
              </p>
            </div>
          </StaggerItem>
          <StaggerItem>
            <div style={{ background: 'var(--danger)', borderRadius: 16, padding: '14px 12px', boxShadow: '0 4px 16px rgba(248,113,113,0.25)' }}>
              <p style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.8)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Spent</p>
              <p style={{ fontSize: 20, fontWeight: 800, color: '#fff', marginTop: 4, lineHeight: 1 }}>
                {currency}<AnimatedNumber value={Math.round(expenses)} duration={800} />
              </p>
            </div>
          </StaggerItem>
          <StaggerItem>
            <div style={{ background: saved >= 0 ? 'var(--accent)' : '#f59e0b', borderRadius: 16, padding: '14px 12px', boxShadow: `0 4px 16px var(--shadow-pop)` }}>
              <p style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.8)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Saved</p>
              <p style={{ fontSize: 20, fontWeight: 800, color: '#fff', marginTop: 4, lineHeight: 1 }}>
                {saved >= 0 ? '+' : ''}{currency}<AnimatedNumber value={Math.abs(Math.round(saved))} duration={800} />
              </p>
            </div>
          </StaggerItem>
        </div>
      </StaggerContainer>

      {/* ── Income vs Expense bar ── */}
      {(income > 0 || expenses > 0) && (
        <Card style={{ padding: 16 }}>
          <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-2)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12 }}>
            Income vs Expense
          </p>
          <IncomeExpenseBar income={income} expenses={expenses} />
        </Card>
      )}

      {/* ── Donut chart — top 5 categories ── */}
      {top5.length > 0 && (
        <>
          <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-2)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Where Money Went
          </p>
          <Card style={{ padding: 20 }}>
            <DonutChart slices={top5} total={expenses} currency={currency} />
          </Card>
        </>
      )}

      {/* ── Income sources ── */}
      {incomeBySource.length > 0 && (
        <>
          <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-2)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Income Sources
          </p>
          <StaggerContainer stagger={0.06}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {incomeBySource.map(({ src, amount }) => (
                <StaggerItem key={src}>
                  <Card style={{ padding: 14 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                      <span style={{ fontSize: 15 }}>{catEmoji(src)}</span>
                      <p style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-2)' }}>{src}</p>
                    </div>
                    <p style={{ fontSize: 18, fontWeight: 800, color: 'var(--text)' }}>
                      {currency}{amount.toFixed(2)}
                    </p>
                    <p style={{ fontSize: 11, color: 'var(--text-2)', marginTop: 2 }}>
                      {income > 0 ? Math.round((amount / income) * 100) : 0}% of total
                    </p>
                  </Card>
                </StaggerItem>
              ))}
            </div>
          </StaggerContainer>
        </>
      )}

      {/* ── Budget bars for categories with budgets ── */}
      {expByCategory.some((x) => x.budget > 0) && (
        <>
          <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-2)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Budget Progress
          </p>
          <Card style={{ padding: 4 }}>
            {expByCategory.filter((x) => x.budget > 0).map(({ cat, amount, budget }, idx, arr) => {
              const over = amount > budget
              const pct  = Math.min((amount / budget) * 100, 100)
              return (
                <div
                  key={cat}
                  style={{
                    padding: '12px 16px',
                    borderBottom: idx < arr.length - 1 ? '1px solid rgba(128,128,128,0.1)' : 'none',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 16 }}>{catEmoji(cat)}</span>
                      <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{cat}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ fontSize: 13, fontWeight: 700, color: over ? 'var(--danger)' : 'var(--text)' }}>
                        {currency}{amount.toFixed(0)}
                      </span>
                      <span style={{ fontSize: 11, color: 'var(--text-2)' }}>/ {currency}{budget}</span>
                      {over && <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--danger)', background: 'rgba(248,113,113,0.12)', borderRadius: 6, padding: '2px 6px' }}>Over!</span>}
                    </div>
                  </div>
                  <BudgetBar spent={amount} budget={budget} />
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* type toggle */}
      <div style={{ display: 'flex', background: 'var(--surface-2)', borderRadius: 20, padding: 4, gap: 4 }}>
        <button
          onClick={() => { setType('expense'); setForm((f) => ({ ...f, category: '' })) }}
          style={type === 'expense'
            ? { background: 'var(--danger)', color: '#fff', flex: 1, padding: '10px 0', borderRadius: 16, fontSize: 14, fontWeight: 700, border: 'none', cursor: 'pointer', transition: 'all 0.2s' }
            : { color: 'var(--text-2)', flex: 1, padding: '10px 0', borderRadius: 16, fontSize: 14, fontWeight: 700, border: 'none', cursor: 'pointer', background: 'transparent', transition: 'all 0.2s' }}
        >
          Expense
        </button>
        <button
          onClick={() => { setType('income'); setForm((f) => ({ ...f, category: '' })) }}
          style={type === 'income'
            ? { background: 'var(--success)', color: '#fff', flex: 1, padding: '10px 0', borderRadius: 16, fontSize: 14, fontWeight: 700, border: 'none', cursor: 'pointer', transition: 'all 0.2s' }
            : { color: 'var(--text-2)', flex: 1, padding: '10px 0', borderRadius: 16, fontSize: 14, fontWeight: 700, border: 'none', cursor: 'pointer', background: 'transparent', transition: 'all 0.2s' }}
        >
          Income
        </button>
      </div>

      <Card style={{ padding: 20 }}>
        <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>Amount</p>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 36, fontWeight: 700, color: 'var(--text-3)' }}>{currency}</span>
          <input
            type="number"
            inputMode="decimal"
            value={form.amount}
            onChange={(e) => setForm({ ...form, amount: e.target.value })}
            placeholder="0.00"
            style={{
              flex: 1, fontSize: 36, fontWeight: 700,
              background: 'transparent', border: 'none', outline: 'none',
              color: 'var(--text)',
            }}
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <MonthSelector value={month} onChange={setMonth} months={months} />
      {mTx.length === 0 && <EmptyState icon={TrendingDown} text="No transactions this month" />}

      <AnimatePresence mode="wait">
        <StaggerContainer key={month} stagger={0.05}>
          {Object.entries(grouped).map(([date, txs]) => {
            const dayInc = txs.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0)
            const dayExp = txs.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0)
            return (
              <StaggerItem key={date}>
                <div style={{ marginBottom: 12 }}>
                  {/* date header */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                    <SectionHeader>{format(parseISO(date), 'EEE, d MMM')}</SectionHeader>
                    <div style={{ display: 'flex', gap: 12, paddingBottom: 8 }}>
                      {dayInc > 0 && (
                        <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--success)' }}>
                          +{currency}{dayInc.toFixed(2)}
                        </span>
                      )}
                      {dayExp > 0 && (
                        <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--danger)' }}>
                          -{currency}{dayExp.toFixed(2)}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* transaction cards */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {txs.map((t) => (
                      <motion.div
                        key={t.id}
                        layout
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 8, height: 0, marginBottom: 0 }}
                        transition={{ duration: 0.25 }}
                        style={{
                          background: 'var(--surface)',
                          border: '1px solid var(--card-border)',
                          borderRadius: 'var(--card-radius)',
                          borderLeft: `3px solid ${t.type === 'income' ? 'var(--success)' : 'var(--danger)'}`,
                          display: 'flex',
                          alignItems: 'center',
                          gap: 12,
                          padding: '12px 14px',
                          boxShadow: 'var(--shadow-sm)',
                        }}
                      >
                        {/* emoji icon */}
                        <div style={{
                          width: 36,
                          height: 36,
                          borderRadius: 10,
                          background: t.type === 'income' ? 'rgba(52,211,153,0.12)' : 'rgba(248,113,113,0.12)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: 18,
                          flexShrink: 0,
                        }}>
                          {catEmoji(t.category)}
                        </div>

                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {t.category}
                          </p>
                          {t.note && (
                            <p style={{ fontSize: 11, color: 'var(--text-2)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {t.note}
                            </p>
                          )}
                        </div>

                        <span style={{ fontSize: 13, fontWeight: 700, flexShrink: 0, color: t.type === 'income' ? 'var(--success)' : 'var(--danger)' }}>
                          {t.type === 'income' ? '+' : '-'}{currency}{t.amount.toFixed(2)}
                        </span>

                        <button
                          onClick={() => setConfirmId(t.id)}
                          style={{ padding: 6, color: 'var(--text-2)', background: 'none', border: 'none', cursor: 'pointer', flexShrink: 0 }}
                        >
                          <Trash2 size={14} />
                        </button>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </StaggerItem>
            )
          })}
        </StaggerContainer>
      </AnimatePresence>

      <Modal open={!!confirmId} onClose={() => setConfirmId(null)} title="Delete transaction?">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <p style={{ fontSize: 14, color: 'var(--text-2)' }}>This cannot be undone.</p>
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* info banner */}
      <div style={{
        padding: '12px 16px',
        borderRadius: 16,
        background: 'rgba(245,158,11,0.08)',
        border: '1px solid rgba(245,158,11,0.25)',
      }}>
        <p style={{ fontSize: 13, fontWeight: 600, color: '#f59e0b' }}>💡 Set monthly spending limits</p>
        <p style={{ fontSize: 12, color: '#f59e0b', opacity: 0.8, marginTop: 2 }}>
          Limits appear as animated bars in Overview. Tap to edit.
        </p>
      </div>

      <Card>
        <StaggerContainer stagger={0.04}>
          {expenseCategories.map((cat, idx, arr) => {
            const spent  = mTx.filter((t) => t.category === cat).reduce((s, t) => s + t.amount, 0)
            const budget = budgets[cat] || 0
            const over   = budget > 0 && spent > budget
            const pct    = budget > 0 ? Math.min((spent / budget) * 100, 100) : 0
            const barColor = pct >= 90 ? 'var(--danger)' : pct >= 70 ? '#f59e0b' : 'var(--success)'

            return (
              <StaggerItem key={cat}>
                <div style={{
                  padding: '14px 16px',
                  borderBottom: idx < arr.length - 1 ? '1px solid rgba(128,128,128,0.08)' : 'none',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontSize: 18, flexShrink: 0 }}>{catEmoji(cat)}</span>
                    <div style={{ flex: 1 }}>
                      <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{cat}</p>
                      {budget > 0 && (
                        <p style={{ fontSize: 11, marginTop: 1, fontWeight: 500, color: over ? 'var(--danger)' : 'var(--text-2)' }}>
                          {currency}{spent.toFixed(0)} of {currency}{budget}{over ? ' — over!' : ''}
                        </p>
                      )}
                    </div>

                    {editing === cat ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ fontSize: 13, color: 'var(--text-2)' }}>{currency}</span>
                        <input
                          autoFocus
                          type="number"
                          value={val}
                          onChange={(e) => setVal(e.target.value)}
                          onKeyDown={(e) => { if (e.key === 'Enter') save(cat); if (e.key === 'Escape') setEditing(null) }}
                          style={{
                            width: 72,
                            borderRadius: 10,
                            background: 'var(--surface)',
                            border: '1px solid var(--card-border)',
                            padding: '6px 10px',
                            fontSize: 13,
                            color: 'var(--text)',
                            outline: 'none',
                          }}
                        />
                        <button
                          onClick={() => save(cat)}
                          style={{ padding: 6, color: 'var(--success)', background: 'none', border: 'none', cursor: 'pointer' }}
                        >
                          <Check size={15} />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => { setEditing(cat); setVal(budget ? String(budget) : '') }}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 4,
                          fontSize: 13,
                          fontWeight: 600,
                          color: budget ? 'var(--accent)' : 'var(--text-2)',
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          padding: 0,
                        }}
                      >
                        {budget ? `${currency}${budget}` : 'Set limit'}
                        <ChevronDown size={13} />
                      </button>
                    )}
                  </div>

                  {budget > 0 && (
                    <div style={{ marginTop: 8, height: 6, borderRadius: 9999, overflow: 'hidden', background: 'rgba(128,128,128,0.12)' }}>
                      <motion.div
                        style={{ height: '100%', borderRadius: 9999, background: barColor }}
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ duration: 0.7, ease: 'easeOut' }}
                      />
                    </div>
                  )}
                </div>
              </StaggerItem>
            )
          })}
        </StaggerContainer>
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <h1 style={{ fontSize: 24, fontWeight: 800, color: 'var(--text)' }}>Finance</h1>
      <TabBar tabs={TABS} active={tab} onChange={setTab} />
      <AnimatePresence mode="wait">
        <motion.div
          key={tab}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.22 }}
        >
          {tab === 'overview' && <OverviewTab month={month} months={months} setMonth={setMonth} />}
          {tab === 'add'      && <AddTab />}
          {tab === 'history'  && <HistoryTab month={month} months={months} setMonth={setMonth} />}
          {tab === 'budgets'  && <BudgetsTab />}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
