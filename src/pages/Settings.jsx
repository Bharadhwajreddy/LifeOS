import { useState, useRef } from 'react'
import {
  Moon, Sun, Trash2, Plus, Pencil, Check, X,
  Download, Upload, User, DollarSign,
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { format } from 'date-fns'
import { useStore } from '../store'
import { Card, Btn, Input, Select, SectionHeader } from '../components/UI'
import Modal from '../components/Modal'

function exportToCSV(data, filename) {
  if (!data.length) return
  const headers = Object.keys(data[0])
  const rows = data.map(row =>
    headers.map(h => {
      const val = row[h] ?? ''
      const str = String(val).replace(/"/g, '""')
      return str.includes(',') || str.includes('"') || str.includes('\n') ? `"${str}"` : str
    }).join(',')
  )
  const csv = [headers.join(','), ...rows].join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

function EditableItem({ name, onRename, onDelete, canDelete }) {
  const [editing, setEditing] = useState(false)
  const [val, setVal] = useState(name)

  const save = () => {
    if (val.trim() && val.trim() !== name) onRename(name, val.trim())
    setEditing(false)
  }

  return (
    <div className="flex items-center gap-2 px-4 py-3">
      {editing ? (
        <>
          <input
            autoFocus
            value={val}
            onChange={(e) => setVal(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') save(); if (e.key === 'Escape') setEditing(false) }}
            style={{
              flex: 1, borderRadius: 12, background: 'var(--surface)',
              border: '1px solid var(--border)', padding: '6px 12px',
              fontSize: 14, color: 'var(--text)', outline: 'none',
            }}
          />
          <button onClick={save} style={{ padding: 6, color: 'var(--success)' }}><Check size={16} /></button>
          <button onClick={() => setEditing(false)} style={{ padding: 6, color: 'var(--text-3)' }}><X size={16} /></button>
        </>
      ) : (
        <>
          <p style={{ flex: 1, fontSize: 14, fontWeight: 500, color: 'var(--text)' }}>{name}</p>
          <button onClick={() => { setVal(name); setEditing(true) }} style={{ padding: 6, color: 'var(--text-3)' }}>
            <Pencil size={14} />
          </button>
          {canDelete && (
            <button onClick={() => onDelete(name)} style={{ padding: 6, color: 'var(--text-3)' }}>
              <Trash2 size={14} />
            </button>
          )}
        </>
      )}
    </div>
  )
}

const CURRENCY_SYMBOLS = {
  '€': { symbol: '€', name: 'Euro', color: '#4F7CFF' },
  '$': { symbol: '$', name: 'Dollar', color: '#22C55E' },
  '£': { symbol: '£', name: 'Pound', color: '#8B5CF6' },
  '₹': { symbol: '₹', name: 'Rupee', color: '#F59E0B' },
}

function IconCircle({ color, children, size = 36 }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      background: color,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      flexShrink: 0,
    }}>
      {children}
    </div>
  )
}

export default function Settings() {
  const {
    name, setName, darkMode, toggleDarkMode, currency, setCurrency,
    theme, setTheme,
    incomeSources, addIncomeSource, renameIncomeSource, deleteIncomeSource,
    expenseCategories, addExpenseCategory, renameExpenseCategory, deleteExpenseCategory,
    dailyTasks, habits, habitLogs, transactions, xp, level,
    appointments, tasks, movies, gifts, dates, dateIdeas, achievements, moodLog,
  } = useStore()

  const [nameVal, setNameVal] = useState(name)
  const [newSource, setNewSource] = useState('')
  const [newCat, setNewCat] = useState('')
  const [clearModal, setClearModal] = useState(false)
  const [importSuccess, setImportSuccess] = useState(false)
  const [importError, setImportError] = useState(false)
  const [exportedTasks, setExportedTasks] = useState(false)
  const [exportedHabits, setExportedHabits] = useState(false)
  const [exportedFinance, setExportedFinance] = useState(false)
  const [exportedBackup, setExportedBackup] = useState(false)
  const fileRef = useRef(null)

  const initials = (name || 'U').split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase()

  // ── CSV Export handlers ────────────────────────────────────────────────────

  const handleExportTasks = () => {
    const rows = dailyTasks.map(t => ({
      date: t.date ?? t.createdAt ?? '',
      text: t.text ?? '',
      priority: t.priority ?? '',
      done: t.done ? 'true' : 'false',
      notes: t.notes ?? '',
    }))
    exportToCSV(rows, `lifeos-tasks-${format(new Date(), 'yyyy-MM-dd')}.csv`)
    setExportedTasks(true)
    setTimeout(() => setExportedTasks(false), 2000)
  }

  const handleExportHabits = () => {
    const rows = habitLogs.map(log => {
      const habit = habits.find(h => h.id === log.habitId)
      return {
        date: log.date ?? '',
        habit: habit?.name ?? log.habitId,
        emoji: habit?.emoji ?? '',
        count: log.count ?? 0,
        target: habit?.target ?? 1,
        completed: (log.count ?? 0) >= (habit?.target ?? 1) ? 'true' : 'false',
      }
    })
    if (!rows.length) {
      // export habit definitions if no logs yet
      const defs = habits.map(h => ({
        id: h.id,
        name: h.name,
        emoji: h.emoji ?? '',
        target: h.target ?? 1,
        color: h.color ?? '',
      }))
      exportToCSV(defs, `lifeos-habits-${format(new Date(), 'yyyy-MM-dd')}.csv`)
    } else {
      exportToCSV(rows, `lifeos-habits-${format(new Date(), 'yyyy-MM-dd')}.csv`)
    }
    setExportedHabits(true)
    setTimeout(() => setExportedHabits(false), 2000)
  }

  const handleExportFinance = () => {
    const rows = transactions.map(t => ({
      date: t.date ?? '',
      type: t.type ?? '',
      category: t.category ?? t.source ?? '',
      amount: t.amount ?? 0,
    }))
    exportToCSV(rows, `lifeos-finance-${format(new Date(), 'yyyy-MM-dd')}.csv`)
    setExportedFinance(true)
    setTimeout(() => setExportedFinance(false), 2000)
  }

  // ── Full JSON backup ───────────────────────────────────────────────────────

  const handleFullExport = () => {
    const state = useStore.getState()
    const exportData = {
      dailyTasks: state.dailyTasks,
      appointments: state.appointments,
      tasks: state.tasks,
      habits: state.habits,
      habitLogs: state.habitLogs,
      transactions: state.transactions,
      movies: state.movies,
      gifts: state.gifts,
      dates: state.dates,
      dateIdeas: state.dateIdeas,
      xp: state.xp,
      level: state.level,
      achievements: state.achievements,
      moodLog: state.moodLog ?? [],
      exportedAt: new Date().toISOString(),
      version: 'lifeos-v4',
    }
    const json = JSON.stringify(exportData, null, 2)
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `lifeos-backup-${format(new Date(), 'yyyy-MM-dd')}.json`
    a.click()
    URL.revokeObjectURL(url)
    setExportedBackup(true)
    setTimeout(() => setExportedBackup(false), 2000)
  }

  // ── JSON Import ────────────────────────────────────────────────────────────

  const handleImport = (e) => {
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target.result)
        if (data.dailyTasks) useStore.setState(s => ({ dailyTasks: [...s.dailyTasks, ...data.dailyTasks.filter(t => !s.dailyTasks.find(x => x.id === t.id))] }))
        if (data.transactions) useStore.setState(s => ({ transactions: [...s.transactions, ...data.transactions.filter(t => !s.transactions.find(x => x.id === t.id))] }))
        setImportSuccess(true)
        setTimeout(() => setImportSuccess(false), 3000)
      } catch {
        setImportError(true)
        setTimeout(() => setImportError(false), 3000)
      }
    }
    reader.readAsText(file)
    // reset input so same file can be re-imported
    e.target.value = ''
  }

  const currencyInfo = CURRENCY_SYMBOLS[currency] ?? CURRENCY_SYMBOLS['$']

  return (
    <div className="space-y-6 pb-4">

      {/* Profile hero section */}
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        gap: 12, padding: '24px 16px 20px',
        background: 'var(--surface)',
        borderRadius: 'var(--radius-xl)',
        border: '1px solid var(--border)',
        position: 'relative', overflow: 'hidden',
      }}>
        {/* Aurora shimmer bg */}
        <div style={{
          position: 'absolute', inset: 0, opacity: 0.3,
          background: 'var(--grad-tasks, linear-gradient(135deg, var(--accent-soft), var(--lavender)))',
          pointerEvents: 'none',
        }} />

        {/* Avatar */}
        <motion.div
          animate={{ boxShadow: ['0 0 0 0px color-mix(in srgb, var(--accent) 30%, transparent)', '0 0 0 8px color-mix(in srgb, var(--accent) 0%, transparent)'] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          style={{
            width: 76, height: 76, borderRadius: '50%',
            background: 'linear-gradient(135deg, var(--accent), var(--accent-2, var(--lavender)))',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 28, fontWeight: 800, color: 'white',
            position: 'relative', zIndex: 1,
            border: '3px solid var(--card-bg)',
          }}
        >
          {initials}
        </motion.div>

        <div style={{ textAlign: 'center', position: 'relative', zIndex: 1 }}>
          <p style={{ fontSize: 20, fontWeight: 800, color: 'var(--text)', letterSpacing: '-0.3px' }}>
            {name || 'Your Name'}
          </p>
          <p style={{ fontSize: 13, color: 'var(--text-3)', marginTop: 2 }}>LifeOS Member</p>
        </div>

        {/* Inline name edit */}
        <div style={{ display: 'flex', gap: 8, width: '100%', maxWidth: 280, position: 'relative', zIndex: 1 }}>
          <input
            value={nameVal}
            onChange={(e) => setNameVal(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && nameVal.trim()) setName(nameVal.trim()) }}
            placeholder="Your name"
            style={{
              flex: 1, borderRadius: 12, background: 'var(--card-bg)',
              border: '1px solid var(--border)', padding: '8px 12px',
              fontSize: 14, color: 'var(--text)', outline: 'none',
            }}
          />
          <motion.button
            whileTap={{ scale: 0.92 }}
            onClick={() => setName(nameVal.trim())}
            disabled={!nameVal.trim() || nameVal.trim() === name}
            style={{
              padding: '8px 16px', borderRadius: 12,
              background: 'var(--accent)', color: 'white',
              fontSize: 13, fontWeight: 700, border: 'none', cursor: 'pointer',
              opacity: !nameVal.trim() || nameVal.trim() === name ? 0.4 : 1,
              transition: 'opacity 0.15s',
            }}
          >
            Save
          </motion.button>
        </div>
      </div>

      {/* Appearance */}
      <section className="space-y-2">
        <SectionHeader>Appearance</SectionHeader>
        <div style={{
          background: 'var(--card-bg)',
          borderRadius: 'var(--card-radius)',
          border: '1px solid var(--card-border)',
          padding: '4px 16px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBlock: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <IconCircle color={darkMode ? '#4F46E5' : '#F59E0B'} size={34}>
                {darkMode ? <Moon size={16} color="white" /> : <Sun size={16} color="white" />}
              </IconCircle>
              <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>Dark mode</p>
            </div>
            <motion.button
              onClick={toggleDarkMode}
              animate={{ background: darkMode ? 'var(--accent)' : 'var(--border)' }}
              transition={{ duration: 0.2 }}
              style={{
                position: 'relative', width: 48, height: 26, borderRadius: 13,
                border: 'none', cursor: 'pointer', flexShrink: 0,
              }}
            >
              <motion.div
                animate={{ x: darkMode ? 22 : 2 }}
                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                style={{
                  position: 'absolute', top: 3, width: 20, height: 20,
                  borderRadius: '50%', background: 'white',
                  boxShadow: '0 1px 4px rgba(0,0,0,0.2)',
                }}
              />
            </motion.button>
          </div>
        </div>
      </section>

      {/* Theme picker */}
      <section className="space-y-3">
        <SectionHeader>Theme</SectionHeader>
        <div className="grid grid-cols-2 gap-3">
          {[
            { id: 'aurora', name: 'Aurora', subtitle: 'Light & Airy', emoji: '☀️',
              colors: ['#4F7CFF','#7BC7BE','#FF8A6B'], bg: 'linear-gradient(135deg,#FAFAF7,#E6EDFF)' },
            { id: 'glass', name: 'Glass', subtitle: 'Dark & Frosted', emoji: '🌙',
              colors: ['#6B8FFF','#5EEAD4','#C4B5FD'], bg: 'linear-gradient(135deg,#07091A,#0C1027)' },
            { id: 'paper', name: 'Paper', subtitle: 'Warm Editorial', emoji: '📜',
              colors: ['#B8472A','#4A5D3A','#C9923D'], bg: 'linear-gradient(135deg,#F1EBDC,#E8DFCC)' },
            { id: 'neon', name: 'Neon', subtitle: 'Bold & Electric', emoji: '⚡',
              colors: ['#4488FF','#00FFB3','#AA88FF'], bg: 'linear-gradient(135deg,#08080F,#0E0E1A)' },
          ].map((th) => {
            const isActive = theme === th.id
            const isDark = th.id === 'glass' || th.id === 'neon'
            return (
              <motion.button
                key={th.id}
                onClick={() => setTheme(th.id)}
                whileHover={{ y: -3, boxShadow: '0 8px 24px rgba(0,0,0,0.15)' }}
                whileTap={{ scale: 0.96 }}
                animate={{
                  border: isActive ? '2px solid var(--accent)' : '2px solid transparent',
                  boxShadow: isActive ? '0 0 0 3px color-mix(in srgb, var(--accent) 20%, transparent)' : '0 2px 8px rgba(0,0,0,0.08)',
                }}
                transition={{ duration: 0.18 }}
                style={{
                  background: th.bg,
                  borderRadius: 16,
                  padding: 16,
                  cursor: 'pointer',
                  textAlign: 'left',
                  transform: isActive ? 'scale(1.02)' : 'scale(1)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                  <span style={{ fontSize: 20 }}>{th.emoji}</span>
                  <AnimatePresence>
                    {isActive && (
                      <motion.div
                        initial={{ scale: 0, rotate: -20 }}
                        animate={{ scale: 1, rotate: 0 }}
                        exit={{ scale: 0 }}
                        transition={{ type: 'spring', stiffness: 500, damping: 25 }}
                        style={{
                          width: 20, height: 20, borderRadius: '50%',
                          background: 'var(--accent)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}
                      >
                        <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                          <path d="M1 4l2.5 2.5L9 1" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Color swatches */}
                <div style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
                  {th.colors.map((c, i) => (
                    <div key={i} style={{
                      width: 18, height: 18, borderRadius: '50%', background: c,
                      boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                    }} />
                  ))}
                </div>

                {/* Mini theme preview animation */}
                <div style={{
                  height: 4, borderRadius: 2, marginBottom: 10,
                  background: th.colors[0],
                  opacity: 0.7,
                  overflow: 'hidden',
                  position: 'relative',
                }}>
                  {th.id === 'aurora' && (
                    <motion.div
                      animate={{ x: ['-100%', '200%'] }}
                      transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                      style={{
                        position: 'absolute', inset: 0, width: '50%',
                        background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.6), transparent)',
                      }}
                    />
                  )}
                  {th.id === 'neon' && (
                    <motion.div
                      animate={{ opacity: [0.4, 1, 0.4] }}
                      transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
                      style={{
                        position: 'absolute', inset: 0,
                        background: th.colors[0],
                        boxShadow: `0 0 8px ${th.colors[0]}`,
                      }}
                    />
                  )}
                </div>

                <p style={{ fontWeight: 700, fontSize: 13, color: isDark ? '#ECEEFF' : '#1B2030', marginBottom: 2 }}>
                  {th.name}
                </p>
                <p style={{ fontWeight: 500, fontSize: 11, color: isDark ? 'rgba(236,238,255,0.6)' : 'rgba(27,32,48,0.5)' }}>
                  {th.subtitle}
                </p>
              </motion.button>
            )
          })}
        </div>
      </section>

      {/* Currency */}
      <section className="space-y-2">
        <SectionHeader>Currency</SectionHeader>
        <div style={{
          background: 'var(--card-bg)', borderRadius: 'var(--card-radius)',
          border: '1px solid var(--card-border)', padding: 16,
          display: 'flex', alignItems: 'center', gap: 14,
        }}>
          <motion.div
            key={currency}
            initial={{ scale: 0.7, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 400, damping: 22 }}
            style={{
              width: 44, height: 44, borderRadius: '50%',
              background: currencyInfo.color,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 20, fontWeight: 800, color: 'white',
              flexShrink: 0, boxShadow: `0 4px 14px ${currencyInfo.color}55`,
            }}
          >
            {currencyInfo.symbol}
          </motion.div>
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: 12, color: 'var(--text-3)', fontWeight: 600, marginBottom: 4 }}>Select currency</p>
            <Select value={currency} onChange={(e) => setCurrency(e.target.value)}>
              <option value="€">€ Euro</option>
              <option value="$">$ Dollar</option>
              <option value="£">£ Pound</option>
              <option value="₹">₹ Rupee</option>
            </Select>
          </div>
        </div>
      </section>

      {/* Income Sources */}
      <section className="space-y-2">
        <SectionHeader>Income Sources</SectionHeader>
        <p style={{ fontSize: 12, color: 'var(--text-3)', marginBottom: 8 }}>
          Tap the pencil to rename. Renaming updates all your existing transactions too.
        </p>
        <Card className="divide-y divide-zinc-100 dark:divide-zinc-700/50">
          {incomeSources.map((src) => (
            <EditableItem
              key={src}
              name={src}
              onRename={renameIncomeSource}
              onDelete={deleteIncomeSource}
              canDelete={incomeSources.length > 1}
            />
          ))}
          <div className="flex items-center gap-2 px-4 py-3">
            <input
              value={newSource}
              onChange={(e) => setNewSource(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && newSource.trim()) {
                  addIncomeSource(newSource.trim()); setNewSource('')
                }
              }}
              placeholder="Add new source..."
              style={{ flex: 1, fontSize: 14, background: 'transparent', outline: 'none', color: 'var(--text-2)', border: 'none' }}
            />
            <button
              onClick={() => { if (newSource.trim()) { addIncomeSource(newSource.trim()); setNewSource('') } }}
              disabled={!newSource.trim()}
              style={{ padding: 6, color: 'var(--accent)', opacity: newSource.trim() ? 1 : 0.3 }}
            >
              <Plus size={16} />
            </button>
          </div>
        </Card>
      </section>

      {/* Expense Categories */}
      <section className="space-y-2">
        <SectionHeader>Expense Categories</SectionHeader>
        <p style={{ fontSize: 12, color: 'var(--text-3)', marginBottom: 8 }}>
          Tap the pencil to rename a category. Renaming updates all transactions.
        </p>
        <Card className="divide-y divide-zinc-100 dark:divide-zinc-700/50">
          {expenseCategories.map((cat) => (
            <EditableItem
              key={cat}
              name={cat}
              onRename={renameExpenseCategory}
              onDelete={deleteExpenseCategory}
              canDelete={expenseCategories.length > 1}
            />
          ))}
          <div className="flex items-center gap-2 px-4 py-3">
            <input
              value={newCat}
              onChange={(e) => setNewCat(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && newCat.trim()) {
                  addExpenseCategory(newCat.trim()); setNewCat('')
                }
              }}
              placeholder="Add new category..."
              style={{ flex: 1, fontSize: 14, background: 'transparent', outline: 'none', color: 'var(--text-2)', border: 'none' }}
            />
            <button
              onClick={() => { if (newCat.trim()) { addExpenseCategory(newCat.trim()); setNewCat('') } }}
              disabled={!newCat.trim()}
              style={{ padding: 6, color: 'var(--accent)', opacity: newCat.trim() ? 1 : 0.3 }}
            >
              <Plus size={16} />
            </button>
          </div>
        </Card>
      </section>

      {/* Export Data */}
      <section className="space-y-2">
        <SectionHeader>Export Data</SectionHeader>
        <div style={{
          background: 'var(--surface)',
          borderRadius: 'var(--card-radius)',
          border: '1px solid var(--card-border)',
          padding: 16,
          display: 'flex', flexDirection: 'column', gap: 10,
        }}>
          <p style={{ fontSize: 13, color: 'var(--text-3)' }}>
            Download your data as CSV spreadsheets or a full JSON backup.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {/* Export Tasks */}
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={handleExportTasks}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                padding: '10px 14px', borderRadius: 12,
                background: exportedTasks
                  ? 'color-mix(in srgb, var(--success, #22C55E) 15%, transparent)'
                  : 'var(--accent-soft)',
                border: exportedTasks
                  ? '1px solid color-mix(in srgb, var(--success, #22C55E) 30%, transparent)'
                  : '1px solid color-mix(in srgb, var(--accent) 20%, transparent)',
                color: exportedTasks ? 'var(--success, #22C55E)' : 'var(--accent)',
                fontWeight: 700, fontSize: 13, cursor: 'pointer',
                transition: 'background 0.2s, color 0.2s, border 0.2s',
              }}
            >
              <AnimatePresence mode="wait">
                {exportedTasks ? (
                  <motion.span key="check" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}
                    style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Check size={15} /> Exported!
                  </motion.span>
                ) : (
                  <motion.span key="dl" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}
                    style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Download size={15} /> Export Tasks (CSV)
                  </motion.span>
                )}
              </AnimatePresence>
            </motion.button>

            {/* Export Habits */}
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={handleExportHabits}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                padding: '10px 14px', borderRadius: 12,
                background: exportedHabits
                  ? 'color-mix(in srgb, var(--success, #22C55E) 15%, transparent)'
                  : 'var(--accent-soft)',
                border: exportedHabits
                  ? '1px solid color-mix(in srgb, var(--success, #22C55E) 30%, transparent)'
                  : '1px solid color-mix(in srgb, var(--accent) 20%, transparent)',
                color: exportedHabits ? 'var(--success, #22C55E)' : 'var(--accent)',
                fontWeight: 700, fontSize: 13, cursor: 'pointer',
                transition: 'background 0.2s, color 0.2s, border 0.2s',
              }}
            >
              <AnimatePresence mode="wait">
                {exportedHabits ? (
                  <motion.span key="check" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}
                    style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Check size={15} /> Exported!
                  </motion.span>
                ) : (
                  <motion.span key="dl" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}
                    style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Download size={15} /> Export Habits (CSV)
                  </motion.span>
                )}
              </AnimatePresence>
            </motion.button>

            {/* Export Finance */}
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={handleExportFinance}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                padding: '10px 14px', borderRadius: 12,
                background: exportedFinance
                  ? 'color-mix(in srgb, var(--success, #22C55E) 15%, transparent)'
                  : 'var(--accent-soft)',
                border: exportedFinance
                  ? '1px solid color-mix(in srgb, var(--success, #22C55E) 30%, transparent)'
                  : '1px solid color-mix(in srgb, var(--accent) 20%, transparent)',
                color: exportedFinance ? 'var(--success, #22C55E)' : 'var(--accent)',
                fontWeight: 700, fontSize: 13, cursor: 'pointer',
                transition: 'background 0.2s, color 0.2s, border 0.2s',
              }}
            >
              <AnimatePresence mode="wait">
                {exportedFinance ? (
                  <motion.span key="check" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}
                    style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Check size={15} /> Exported!
                  </motion.span>
                ) : (
                  <motion.span key="dl" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}
                    style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Download size={15} /> Export Finance (CSV)
                  </motion.span>
                )}
              </AnimatePresence>
            </motion.button>

            {/* Full JSON Backup */}
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={handleFullExport}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                padding: '10px 14px', borderRadius: 12,
                background: exportedBackup
                  ? 'color-mix(in srgb, var(--success, #22C55E) 15%, transparent)'
                  : 'var(--surface)',
                border: exportedBackup
                  ? '1px solid color-mix(in srgb, var(--success, #22C55E) 30%, transparent)'
                  : '1px solid var(--border)',
                color: exportedBackup ? 'var(--success, #22C55E)' : 'var(--text-2)',
                fontWeight: 700, fontSize: 13, cursor: 'pointer',
                transition: 'background 0.2s, color 0.2s, border 0.2s',
              }}
            >
              <AnimatePresence mode="wait">
                {exportedBackup ? (
                  <motion.span key="check" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}
                    style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Check size={15} /> Backup saved!
                  </motion.span>
                ) : (
                  <motion.span key="dl" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}
                    style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Download size={15} /> Full Backup (JSON)
                  </motion.span>
                )}
              </AnimatePresence>
            </motion.button>
          </div>
        </div>
      </section>

      {/* Data */}
      <section className="space-y-2">
        <SectionHeader>Data</SectionHeader>
        <div style={{
          background: 'var(--card-bg)', borderRadius: 'var(--card-radius)',
          border: '1px solid var(--card-border)', padding: 16,
          display: 'flex', flexDirection: 'column', gap: 10,
        }}>
          <p style={{ fontSize: 13, color: 'var(--text-3)' }}>
            All data lives on this device only. Nothing is sent to any server.
          </p>

          {/* Hidden file input for import */}
          <input
            ref={fileRef}
            type="file"
            accept=".json"
            onChange={handleImport}
            style={{ display: 'none' }}
          />

          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => fileRef.current?.click()}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
              padding: '10px 14px', borderRadius: 12,
              background: importSuccess
                ? 'color-mix(in srgb, var(--success, #22C55E) 15%, transparent)'
                : importError
                  ? 'color-mix(in srgb, var(--danger) 10%, transparent)'
                  : 'var(--surface)',
              border: importSuccess
                ? '1px solid color-mix(in srgb, var(--success, #22C55E) 30%, transparent)'
                : importError
                  ? '1px solid color-mix(in srgb, var(--danger) 20%, transparent)'
                  : '1px solid var(--border)',
              color: importSuccess
                ? 'var(--success, #22C55E)'
                : importError
                  ? 'var(--danger)'
                  : 'var(--text-2)',
              fontWeight: 700, fontSize: 13, cursor: 'pointer',
              transition: 'background 0.2s, color 0.2s, border 0.2s',
              width: '100%',
            }}
          >
            <AnimatePresence mode="wait">
              {importSuccess ? (
                <motion.span key="ok" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}
                  style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Check size={15} /> Import successful!
                </motion.span>
              ) : importError ? (
                <motion.span key="err" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}
                  style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <X size={15} /> Invalid file
                </motion.span>
              ) : (
                <motion.span key="up" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}
                  style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Upload size={15} /> Import Backup (JSON)
                </motion.span>
              )}
            </AnimatePresence>
          </motion.button>

          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={() => setClearModal(true)}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
              padding: '10px 14px', borderRadius: 12,
              background: 'color-mix(in srgb, var(--danger) 10%, transparent)',
              border: '1px solid color-mix(in srgb, var(--danger) 20%, transparent)',
              color: 'var(--danger)', fontWeight: 700, fontSize: 13, cursor: 'pointer',
              width: '100%',
            }}
          >
            <Trash2 size={15} /> Clear all data
          </motion.button>
        </div>
      </section>

      {/* About with animated version text */}
      <section className="space-y-2">
        <SectionHeader>About</SectionHeader>
        <div style={{
          background: 'var(--card-bg)', borderRadius: 'var(--card-radius)',
          border: '1px solid var(--card-border)', padding: '14px 16px',
          textAlign: 'center',
        }}>
          <motion.p
            animate={{ backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'] }}
            transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
            style={{
              fontSize: 18, fontWeight: 800,
              background: 'linear-gradient(90deg, var(--accent), var(--lavender, #8B5CF6), var(--warm, #F59E0B), var(--accent))',
              backgroundSize: '200% auto',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              letterSpacing: '-0.3px',
            }}
          >
            LifeOS v1.0
          </motion.p>
          <p style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 4 }}>Built for Bharadhwaj · Runs offline</p>
        </div>
      </section>

      <Modal open={clearModal} onClose={() => setClearModal(false)} title="Clear all data?">
        <div className="space-y-4">
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            This deletes everything — tasks, finance history, all of it. Your pre-loaded history will also be gone.
          </p>
          <Btn variant="danger" size="lg" onClick={() => { localStorage.removeItem('lifeos-v4'); window.location.reload() }}>
            Yes, delete everything
          </Btn>
          <Btn variant="ghost" size="lg" onClick={() => setClearModal(false)}>Cancel</Btn>
        </div>
      </Modal>
    </div>
  )
}
