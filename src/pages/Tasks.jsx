import { useState } from 'react'
import { Plus, Trash2, Circle, CheckCircle2, ChevronRight, Flame, Pencil, Check, X } from 'lucide-react'
import { format, isPast, parseISO, startOfDay } from 'date-fns'
import { motion, AnimatePresence } from 'framer-motion'
import { useStore } from '../store'
import Modal from '../components/Modal'
import { Card, Btn, Input, Select, Badge, SectionHeader, EmptyState, TabBar } from '../components/UI'

const PRIORITY_COLOR = { high: 'red', med: 'amber', low: 'blue' }
const PRIORITY_LABEL = { high: 'High', med: 'Med', low: 'Low' }
const STATUSES = [
  { key: 'todo',  label: 'To Do' },
  { key: 'doing', label: 'In Progress' },
  { key: 'done',  label: 'Done' },
]

// ─── Inline editable text ─────────────────────────────────────────────────────
function InlineEdit({ value, onSave, className = '' }) {
  const [editing, setEditing] = useState(false)
  const [val, setVal] = useState(value)
  const save = () => { if (val.trim()) onSave(val.trim()); setEditing(false) }
  if (editing) return (
    <div className="flex items-center gap-1.5 flex-1">
      <input
        autoFocus value={val} onChange={(e) => setVal(e.target.value)}
        onKeyDown={(e) => { if (e.key === 'Enter') save(); if (e.key === 'Escape') setEditing(false) }}
        className="flex-1 bg-zinc-100 dark:bg-zinc-800 rounded-lg px-2 py-1 text-sm text-zinc-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500/70"
      />
      <button onClick={save} className="p-1 text-emerald-500 shrink-0"><Check size={14} /></button>
      <button onClick={() => setEditing(false)} className="p-1 text-zinc-400 shrink-0"><X size={14} /></button>
    </div>
  )
  return (
    <span className={`flex-1 ${className}`} onDoubleClick={() => { setVal(value); setEditing(true) }}>
      {value}
    </span>
  )
}

// ─── Daily ────────────────────────────────────────────────────────────────────
function DailyTab() {
  const { dailyTasks, addDailyTask, updateDailyTask, toggleDailyTask, deleteDailyTask } = useStore()
  const [text, setText] = useState('')
  const todayStr = format(new Date(), 'yyyy-MM-dd')
  const items   = dailyTasks.filter((t) => t.date === todayStr)
  const pending = items.filter((t) => !t.done)
  const done    = items.filter((t) => t.done)
  const progress = items.length ? Math.round((done.length / items.length) * 100) : 0

  const submit = (e) => { e.preventDefault(); if (!text.trim()) return; addDailyTask(text.trim()); setText('') }

  return (
    <div className="space-y-4">
      {items.length > 0 && (
        <Card className="p-4">
          <div className="flex justify-between items-center mb-2">
            <p className="text-sm font-semibold text-zinc-700 dark:text-zinc-200">Today's Progress</p>
            <span className="text-sm font-bold text-blue-500">{progress}%</span>
          </div>
          <div className="h-2 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
            <div className="h-full bg-blue-500 rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
          </div>
          <p className="text-xs text-zinc-400 mt-1.5">{done.length} of {items.length} done</p>
        </Card>
      )}

      <form onSubmit={submit} className="flex gap-2">
        <input
          value={text} onChange={(e) => setText(e.target.value)}
          placeholder="Add a task for today..."
          className="flex-1 rounded-xl bg-zinc-100 dark:bg-zinc-800 border-0 px-4 py-3 text-sm text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-blue-500/70"
        />
        <Btn type="submit" disabled={!text.trim()}><Plus size={18} /></Btn>
      </form>

      {items.length === 0 && <EmptyState icon={CheckCircle2} text="Nothing today — add something above" />}

      {pending.length > 0 && (
        <>
          <SectionHeader>Pending · {pending.length}</SectionHeader>
          <AnimatePresence>
            {pending.map((t) => (
              <motion.div key={t.id} initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: 40 }}>
                <Card className="flex items-center gap-3 px-4 py-3.5 mb-2">
                  <button onClick={() => toggleDailyTask(t.id)} className="shrink-0">
                    <Circle size={22} className="text-zinc-300 dark:text-zinc-600" />
                  </button>
                  <InlineEdit
                    value={t.text}
                    onSave={(v) => updateDailyTask(t.id, v)}
                    className="text-sm text-zinc-800 dark:text-zinc-100 cursor-text"
                  />
                  <p className="text-[10px] text-zinc-300 dark:text-zinc-700 shrink-0">dbl-tap to edit</p>
                  <button onClick={() => deleteDailyTask(t.id)} className="p-1 text-zinc-300 hover:text-rose-400 transition-colors shrink-0">
                    <Trash2 size={14} />
                  </button>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </>
      )}

      {done.length > 0 && (
        <>
          <SectionHeader>Done · {done.length}</SectionHeader>
          {done.map((t) => (
            <Card key={t.id} className="flex items-center gap-3 px-4 py-3.5 mb-2 opacity-50">
              <button onClick={() => toggleDailyTask(t.id)} className="shrink-0">
                <CheckCircle2 size={22} className="text-emerald-500" />
              </button>
              <span className="flex-1 text-sm line-through text-zinc-400">{t.text}</span>
              <button onClick={() => deleteDailyTask(t.id)} className="p-1 text-zinc-300 hover:text-rose-400 transition-colors">
                <Trash2 size={14} />
              </button>
            </Card>
          ))}
        </>
      )}
    </div>
  )
}

// ─── Habits ───────────────────────────────────────────────────────────────────
const HABIT_COLORS = {
  blue:   { dot: 'bg-blue-400',    card: 'bg-blue-50 dark:bg-blue-500/10',    text: 'text-blue-600 dark:text-blue-300',    ring: 'ring-2 ring-blue-300 dark:ring-blue-500/50' },
  green:  { dot: 'bg-emerald-400', card: 'bg-emerald-50 dark:bg-emerald-500/10', text: 'text-emerald-600 dark:text-emerald-300', ring: 'ring-2 ring-emerald-300 dark:ring-emerald-500/50' },
  cyan:   { dot: 'bg-cyan-400',    card: 'bg-cyan-50 dark:bg-cyan-500/10',    text: 'text-cyan-600 dark:text-cyan-300',    ring: 'ring-2 ring-cyan-300 dark:ring-cyan-500/50' },
  purple: { dot: 'bg-violet-400',  card: 'bg-violet-50 dark:bg-violet-500/10', text: 'text-violet-600 dark:text-violet-300', ring: 'ring-2 ring-violet-300 dark:ring-violet-500/50' },
  amber:  { dot: 'bg-amber-400',   card: 'bg-amber-50 dark:bg-amber-500/10',  text: 'text-amber-600 dark:text-amber-300',  ring: 'ring-2 ring-amber-300 dark:ring-amber-500/50' },
  red:    { dot: 'bg-rose-400',    card: 'bg-rose-50 dark:bg-rose-500/10',    text: 'text-rose-600 dark:text-rose-300',    ring: 'ring-2 ring-rose-300 dark:ring-rose-500/50' },
}
const EMOJI_OPTIONS = ['🦷','💪','💧','📚','🧘','🏃','🥗','😴','✍️','🎯','🌅','🚶','💊','🎵','🧹','☕']
const COLOR_OPTIONS = ['blue','green','cyan','purple','amber','red']

function HabitsTab() {
  const { habits, habitLogs, logHabit, resetHabitToday, addHabit, updateHabit, deleteHabit, getHabitStreak } = useStore()
  const [addModal, setAddModal]   = useState(false)
  const [editModal, setEditModal] = useState(null) // habit object being edited
  const [form, setForm]           = useState({ name: '', emoji: '🎯', target: 1, color: 'blue' })
  const todayStr = format(new Date(), 'yyyy-MM-dd')

  const habitsWithState = habits.map((h) => {
    const log   = habitLogs.find((l) => l.habitId === h.id && l.date === todayStr)
    const count = log?.count ?? 0
    return { ...h, count, done: count >= h.target, streak: getHabitStreak(h.id) }
  })

  const todayDone = habitsWithState.filter((h) => h.done).length

  const openEdit = (h) => {
    setEditModal(h)
    setForm({ name: h.name, emoji: h.emoji, target: h.target, color: h.color })
  }

  return (
    <div className="space-y-4">
      {habits.length > 0 && (
        <Card className="p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-semibold text-zinc-700 dark:text-zinc-200">Today</p>
            <span className="text-sm font-bold text-violet-500">{todayDone}/{habits.length}</span>
          </div>
          <div className="h-2 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
            <div className="h-full bg-violet-500 rounded-full transition-all duration-500"
              style={{ width: habits.length ? `${(todayDone / habits.length) * 100}%` : '0%' }} />
          </div>
        </Card>
      )}

      {habits.length === 0 && <EmptyState icon={Flame} text="Add habits to track your daily routine" />}

      <div className="grid grid-cols-2 gap-3">
        {habitsWithState.map((h) => {
          const c = HABIT_COLORS[h.color] ?? HABIT_COLORS.blue
          return (
            <div key={h.id} className={`relative rounded-2xl p-4 ring-1 transition-all ${h.done ? `${c.card} ${c.ring}` : 'bg-white dark:bg-zinc-900 ring-zinc-200/60 dark:ring-white/[0.08]'}`}>
              {/* Edit button */}
              <button
                onClick={() => openEdit(h)}
                className="absolute top-2.5 right-2.5 p-1 rounded-lg text-zinc-300 dark:text-zinc-600 hover:text-blue-400 transition-colors"
              >
                <Pencil size={11} />
              </button>
              {/* Streak */}
              {h.streak > 0 && (
                <div className={`absolute top-2.5 left-2.5 flex items-center gap-0.5 text-[10px] font-bold ${c.text}`}>
                  <Flame size={10} />{h.streak}
                </div>
              )}
              {/* Tap to log */}
              <button className="w-full text-left" onClick={() => logHabit(h.id)}>
                <p className="text-3xl mt-3 mb-2">{h.emoji}</p>
                <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-100 leading-tight pr-4">{h.name}</p>
                <div className="flex gap-1 mt-2">
                  {Array.from({ length: h.target }).map((_, i) => (
                    <div key={i} className={`w-2.5 h-2.5 rounded-full ${i < h.count ? c.dot : 'bg-zinc-200 dark:bg-zinc-700'}`} />
                  ))}
                </div>
                <p className={`text-xs mt-1.5 font-semibold ${h.done ? c.text : 'text-zinc-400'}`}>
                  {h.done ? '✓ Done' : `${h.count}/${h.target}`}
                </p>
              </button>
            </div>
          )
        })}
      </div>

      <Btn size="lg" variant="ghost" onClick={() => { setForm({ name: '', emoji: '🎯', target: 1, color: 'blue' }); setAddModal(true) }}>
        <Plus size={18} /> Add Habit
      </Btn>

      {/* Add Modal */}
      <Modal open={addModal} onClose={() => setAddModal(false)} title="New Habit">
        <HabitForm form={form} setForm={setForm} onSave={() => {
          if (form.name.trim()) { addHabit({ ...form, name: form.name.trim() }); setAddModal(false) }
        }} />
      </Modal>

      {/* Edit Modal */}
      <Modal open={!!editModal} onClose={() => setEditModal(null)} title="Edit Habit">
        {editModal && (
          <div className="space-y-4">
            <HabitForm form={form} setForm={setForm} onSave={() => {
              if (form.name.trim()) { updateHabit(editModal.id, { ...form, name: form.name.trim() }); setEditModal(null) }
            }} saveLabel="Save Changes" />
            <Btn variant="danger" size="lg" onClick={() => { deleteHabit(editModal.id); setEditModal(null) }}>
              <Trash2 size={15} /> Delete Habit
            </Btn>
            <Btn variant="ghost" size="lg" onClick={() => { resetHabitToday(editModal.id); setEditModal(null) }}>
              Reset Today
            </Btn>
          </div>
        )}
      </Modal>
    </div>
  )
}

function HabitForm({ form, setForm, onSave, saveLabel = 'Add Habit' }) {
  return (
    <div className="space-y-4">
      <Input label="Habit name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Morning walk" />
      <div>
        <p className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest mb-2">Emoji</p>
        <div className="flex flex-wrap gap-2">
          {EMOJI_OPTIONS.map((em) => (
            <button key={em} onClick={() => setForm({ ...form, emoji: em })}
              className={`text-2xl p-1.5 rounded-xl transition-all ${form.emoji === em ? 'bg-blue-100 dark:bg-blue-500/20 ring-2 ring-blue-400' : 'hover:bg-zinc-100 dark:hover:bg-zinc-800'}`}>
              {em}
            </button>
          ))}
        </div>
      </div>
      <div>
        <p className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest mb-2">Daily Target</p>
        <div className="flex gap-2 flex-wrap">
          {[1,2,3,4,5,6,7,8].map((n) => (
            <button key={n} onClick={() => setForm({ ...form, target: n })}
              className={`w-10 h-10 rounded-xl text-sm font-bold transition-all ${form.target === n ? 'bg-blue-500 text-white' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300'}`}>
              {n}
            </button>
          ))}
        </div>
      </div>
      <div>
        <p className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest mb-2">Color</p>
        <div className="flex gap-2">
          {COLOR_OPTIONS.map((col) => (
            <button key={col} onClick={() => setForm({ ...form, color: col })}
              className={`w-8 h-8 rounded-full ${HABIT_COLORS[col].dot} ring-2 ring-offset-2 dark:ring-offset-zinc-900 transition-all ${form.color === col ? 'ring-blue-500 scale-110' : 'ring-transparent'}`}
            />
          ))}
        </div>
      </div>
      <Btn size="lg" onClick={onSave} disabled={!form.name.trim()}>{saveLabel}</Btn>
    </div>
  )
}

// ─── Kanban ───────────────────────────────────────────────────────────────────
function KanbanTab({ category }) {
  const { tasks, addTask, deleteTask, moveTask, updateTask } = useStore()
  const [addModal, setAddModal]   = useState(false)
  const [detail, setDetail]       = useState(null)
  const [editMode, setEditMode]   = useState(false)
  const [form, setForm]           = useState({ text: '', priority: 'med', dueDate: '' })
  const [editForm, setEditForm]   = useState({ text: '', priority: 'med', dueDate: '' })

  const items = tasks.filter((t) => t.category === category)
  const isOverdue = (t) => t.dueDate && t.status !== 'done' && isPast(startOfDay(parseISO(t.dueDate)))

  const openDetail = (t) => {
    setDetail(t)
    setEditForm({ text: t.text, priority: t.priority, dueDate: t.dueDate || '' })
    setEditMode(false)
  }

  const saveEdit = () => {
    if (!editForm.text.trim()) return
    updateTask(detail.id, { text: editForm.text.trim(), priority: editForm.priority, dueDate: editForm.dueDate })
    setDetail((d) => ({ ...d, text: editForm.text.trim(), priority: editForm.priority, dueDate: editForm.dueDate }))
    setEditMode(false)
  }

  const submit = () => {
    if (!form.text.trim()) return
    addTask({ ...form, text: form.text.trim(), category })
    setForm({ text: '', priority: 'med', dueDate: '' })
    setAddModal(false)
  }

  return (
    <div className="space-y-4">
      <Btn size="lg" onClick={() => setAddModal(true)}><Plus size={18} /> Add Task</Btn>
      {items.length === 0 && <EmptyState icon={CheckCircle2} text="No tasks yet — add one above" />}

      {STATUSES.map(({ key, label }) => {
        const col = items.filter((t) => t.status === key)
        return (
          <div key={key}>
            <SectionHeader>{label} · {col.length}</SectionHeader>
            {col.length === 0
              ? <div className="bg-zinc-50 dark:bg-zinc-800/30 rounded-2xl py-4 text-center text-xs text-zinc-400 dark:text-zinc-600">Empty</div>
              : col.map((t) => (
                <Card key={t.id} className="p-4 mb-2 cursor-pointer active:scale-[0.98] transition-transform" onClick={() => openDetail(t)}>
                  <div className="flex items-start gap-2">
                    <div className="flex-1">
                      <p className={`text-sm font-medium leading-snug ${t.status === 'done' ? 'line-through text-zinc-400' : 'text-zinc-800 dark:text-zinc-100'}`}>{t.text}</p>
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        <Badge color={PRIORITY_COLOR[t.priority]}>{PRIORITY_LABEL[t.priority]}</Badge>
                        {t.dueDate && <Badge color={isOverdue(t) ? 'red' : 'zinc'}>{isOverdue(t) ? '⚠ ' : ''}{format(parseISO(t.dueDate), 'MMM d')}</Badge>}
                      </div>
                    </div>
                    <ChevronRight size={15} className="text-zinc-300 dark:text-zinc-600 mt-0.5 shrink-0" />
                  </div>
                </Card>
              ))}
          </div>
        )
      })}

      {/* Add modal */}
      <Modal open={addModal} onClose={() => setAddModal(false)} title="New Task">
        <div className="space-y-4">
          <Input label="Task" value={form.text} onChange={(e) => setForm({ ...form, text: e.target.value })} placeholder="What needs to be done?" />
          <Select label="Priority" value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}>
            <option value="high">High priority</option>
            <option value="med">Medium priority</option>
            <option value="low">Low priority</option>
          </Select>
          <Input label="Due date (optional)" type="date" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} />
          <Btn size="lg" onClick={submit} disabled={!form.text.trim()}>Add Task</Btn>
        </div>
      </Modal>

      {/* Detail / edit modal */}
      <Modal open={!!detail} onClose={() => setDetail(null)} title={editMode ? 'Edit Task' : detail?.text ?? ''}>
        {detail && !editMode && (
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
              <Badge color={PRIORITY_COLOR[detail.priority]}>{PRIORITY_LABEL[detail.priority]} priority</Badge>
              {detail.dueDate && <Badge color="zinc">Due {format(parseISO(detail.dueDate), 'MMM d, yyyy')}</Badge>}
            </div>
            <div>
              <p className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest mb-2">Move to</p>
              <div className="grid grid-cols-3 gap-2">
                {STATUSES.map(({ key, label }) => (
                  <button key={key}
                    onClick={() => { moveTask(detail.id, key); setDetail((d) => ({ ...d, status: key })) }}
                    className={`py-2.5 rounded-xl text-sm font-semibold transition-colors ${detail.status === key ? 'bg-blue-500 text-white shadow-sm' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200'}`}>
                    {label}
                  </button>
                ))}
              </div>
            </div>
            <Btn variant="ghost" size="lg" onClick={() => setEditMode(true)}>
              <Pencil size={15} /> Edit Task
            </Btn>
            <Btn variant="danger" size="lg" onClick={() => { deleteTask(detail.id); setDetail(null) }}>
              <Trash2 size={15} /> Delete Task
            </Btn>
          </div>
        )}
        {detail && editMode && (
          <div className="space-y-4">
            <Input label="Task" value={editForm.text} onChange={(e) => setEditForm({ ...editForm, text: e.target.value })} />
            <Select label="Priority" value={editForm.priority} onChange={(e) => setEditForm({ ...editForm, priority: e.target.value })}>
              <option value="high">High priority</option>
              <option value="med">Medium priority</option>
              <option value="low">Low priority</option>
            </Select>
            <Input label="Due date" type="date" value={editForm.dueDate} onChange={(e) => setEditForm({ ...editForm, dueDate: e.target.value })} />
            <Btn size="lg" onClick={saveEdit} disabled={!editForm.text.trim()}>Save Changes</Btn>
            <Btn variant="ghost" size="lg" onClick={() => setEditMode(false)}>Cancel</Btn>
          </div>
        )}
      </Modal>
    </div>
  )
}

// ─── Main ─────────────────────────────────────────────────────────────────────
const TABS = [
  { key: 'daily',    label: 'Daily' },
  { key: 'habits',   label: 'Habits' },
  { key: 'office',   label: 'Office' },
  { key: 'projects', label: 'Projects' },
]

export default function Tasks() {
  const [tab, setTab] = useState('daily')
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">Tasks</h1>
      <TabBar tabs={TABS} active={tab} onChange={setTab} />
      {tab === 'daily'    && <DailyTab />}
      {tab === 'habits'   && <HabitsTab />}
      {tab === 'office'   && <KanbanTab category="office" />}
      {tab === 'projects' && <KanbanTab category="projects" />}
    </div>
  )
}
