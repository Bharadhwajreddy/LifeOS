import { useState } from 'react'
import { Moon, Sun, Trash2, Plus, Pencil, Check, X } from 'lucide-react'
import { useStore } from '../store'
import { Card, Btn, Input, Select, SectionHeader } from '../components/UI'
import Modal from '../components/Modal'

// ─── Editable list item (inline rename) ──────────────────────────────────────
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
            className="flex-1 rounded-xl bg-zinc-100 dark:bg-zinc-700 border-0 px-3 py-1.5 text-sm text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button onClick={save} className="p-1.5 text-green-500"><Check size={16} /></button>
          <button onClick={() => setEditing(false)} className="p-1.5 text-zinc-400"><X size={16} /></button>
        </>
      ) : (
        <>
          <p className="flex-1 text-sm font-medium text-zinc-800 dark:text-zinc-100">{name}</p>
          <button onClick={() => { setVal(name); setEditing(true) }} className="p-1.5 text-zinc-300 hover:text-blue-400 transition-colors">
            <Pencil size={14} />
          </button>
          {canDelete && (
            <button onClick={() => onDelete(name)} className="p-1.5 text-zinc-300 hover:text-red-400 transition-colors">
              <Trash2 size={14} />
            </button>
          )}
        </>
      )}
    </div>
  )
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function Settings() {
  const {
    name, setName, darkMode, toggleDarkMode, currency, setCurrency,
    incomeSources, addIncomeSource, renameIncomeSource, deleteIncomeSource,
    expenseCategories, addExpenseCategory, renameExpenseCategory, deleteExpenseCategory,
  } = useStore()

  const [nameVal, setNameVal] = useState(name)
  const [newSource, setNewSource] = useState('')
  const [newCat, setNewCat] = useState('')
  const [clearModal, setClearModal] = useState(false)

  return (
    <div className="space-y-6 pb-4">
      <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">Settings</h1>

      {/* ── Profile ── */}
      <section className="space-y-2">
        <SectionHeader>Profile</SectionHeader>
        <Card className="p-4 space-y-3">
          <Input
            label="Your name"
            value={nameVal}
            onChange={(e) => setNameVal(e.target.value)}
            placeholder="Your name"
          />
          <Btn
            onClick={() => setName(nameVal.trim())}
            disabled={!nameVal.trim() || nameVal.trim() === name}
          >
            Save
          </Btn>
        </Card>
      </section>

      {/* ── Appearance ── */}
      <section className="space-y-2">
        <SectionHeader>Appearance</SectionHeader>
        <Card className="flex items-center justify-between px-4 py-4">
          <div className="flex items-center gap-3">
            {darkMode
              ? <Moon size={18} className="text-indigo-400" />
              : <Sun size={18} className="text-amber-500" />}
            <p className="text-sm font-medium text-zinc-800 dark:text-zinc-100">Dark mode</p>
          </div>
          <button
            onClick={toggleDarkMode}
            className={`relative w-12 h-6 rounded-full transition-colors ${darkMode ? 'bg-blue-500' : 'bg-zinc-300'}`}
          >
            <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-all duration-200 ${darkMode ? 'left-[26px]' : 'left-0.5'}`} />
          </button>
        </Card>
      </section>

      {/* ── Currency ── */}
      <section className="space-y-2">
        <SectionHeader>Currency</SectionHeader>
        <Card className="p-4">
          <Select value={currency} onChange={(e) => setCurrency(e.target.value)}>
            <option value="€">€ Euro</option>
            <option value="$">$ Dollar</option>
            <option value="£">£ Pound</option>
            <option value="₹">₹ Rupee</option>
          </Select>
        </Card>
      </section>

      {/* ── Income Sources ── */}
      <section className="space-y-2">
        <SectionHeader>Income Sources</SectionHeader>
        <p className="text-xs text-zinc-400 dark:text-zinc-500 -mt-1 mb-2">
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
              className="flex-1 text-sm bg-transparent outline-none text-zinc-600 dark:text-zinc-300 placeholder:text-zinc-300 dark:placeholder:text-zinc-600"
            />
            <button
              onClick={() => { if (newSource.trim()) { addIncomeSource(newSource.trim()); setNewSource('') } }}
              disabled={!newSource.trim()}
              className="p-1.5 text-blue-500 disabled:text-zinc-300 transition-colors"
            >
              <Plus size={16} />
            </button>
          </div>
        </Card>
      </section>

      {/* ── Expense Categories ── */}
      <section className="space-y-2">
        <SectionHeader>Expense Categories</SectionHeader>
        <p className="text-xs text-zinc-400 dark:text-zinc-500 -mt-1 mb-2">
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
              className="flex-1 text-sm bg-transparent outline-none text-zinc-600 dark:text-zinc-300 placeholder:text-zinc-300 dark:placeholder:text-zinc-600"
            />
            <button
              onClick={() => { if (newCat.trim()) { addExpenseCategory(newCat.trim()); setNewCat('') } }}
              disabled={!newCat.trim()}
              className="p-1.5 text-blue-500 disabled:text-zinc-300 transition-colors"
            >
              <Plus size={16} />
            </button>
          </div>
        </Card>
      </section>

      {/* ── Data ── */}
      <section className="space-y-2">
        <SectionHeader>Data</SectionHeader>
        <Card className="p-4 space-y-2">
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            All data lives on this device only. Nothing is sent to any server.
          </p>
          <Btn variant="danger" onClick={() => setClearModal(true)}>
            <Trash2 size={15} /> Clear all data
          </Btn>
        </Card>
      </section>

      {/* ── About ── */}
      <section className="space-y-2">
        <SectionHeader>About</SectionHeader>
        <Card className="px-4 py-3.5">
          <p className="text-sm font-bold text-zinc-800 dark:text-zinc-100">LifeOS v3.0</p>
          <p className="text-xs text-zinc-400 mt-0.5">Built for Bharadhwaj ✦ Runs offline</p>
        </Card>
      </section>

      <Modal open={clearModal} onClose={() => setClearModal(false)} title="Clear all data?">
        <div className="space-y-4">
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            This deletes everything — tasks, finance history, all of it. Your pre-loaded history will also be gone.
          </p>
          <Btn variant="danger" size="lg" onClick={() => { localStorage.removeItem('lifeos-v3'); window.location.reload() }}>
            Yes, delete everything
          </Btn>
          <Btn variant="ghost" size="lg" onClick={() => setClearModal(false)}>Cancel</Btn>
        </div>
      </Modal>
    </div>
  )
}
