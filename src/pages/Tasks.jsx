import { useState } from 'react'
import { Plus, Trash2, Circle, CheckCircle2, ChevronRight, Flame } from 'lucide-react'
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

// ─── Daily tab ────────────────────────────────────────────────────────────────
function DailyTab() {
  const { dailyTasks, addDailyTask, toggleDailyTask, deleteDailyTask } = useStore()
  const [text, setText] = useState('')
  const todayStr = format(new Date(), 'yyyy-MM-dd')
  const items   = dailyTasks.filter((t) => t.date === todayStr)
  const pending = items.filter((t) => !t.done)
  const done    = items.filter((t) => t.done)
  const progress = items.length ? Math.round((done.length / items.length) * 100) : 0

  const submit = (e) => { e.preventDefault(); if (!text.trim()) return; addDailyTask(text.trim()); setText('') }

  return (
    <div className="space-y-4">
      {/* Progress bar */}
      {items.length > 0 && (
        <div className="bg-white dark:bg-zinc-900 rounded-2xl ring-1 ring-zinc-200/60 dark:ring-white/[0.06] p-4">
          <div className="flex justify-between items-center mb-2">
            <p className="text-sm font-semibold text-zinc-700 dark:text-zinc-200">Today's Progress</p>
            <span className="text-sm font-bold text-blue-500">{progress}%</span>
          </div>
          <div className="h-2 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
            <div className="h-full bg-blue-500 rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
          </div>
          <p className="text-xs text-zinc-400 mt-1.5">{done.length} of {items.length} completed</p>
        </div>
      )}

      <form onSubmit={submit} className="flex gap-2">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
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
                  <span className="flex-1 text-sm text-zinc-800 dark:text-zinc-100">{t.text}</span>
                  <button onClick={() => deleteDailyTask(t.id)} className="p-1 text-zinc-300 hover:text-rose-400 transition-colors">
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

// ─── Habits tab ───────────────────────────────────────────────────────────────
const HABIT_COLORS = {
  blue:   { dot: 'bg-blue-400',   card: 'dark:bg-blue-500/10 bg-blue-50',   text: 'text-blue-600 dark:text-blue-300',   ring: 'ring-blue-200 dark:ring-blue-500/30' },
  green:  { dot: 'bg-emerald-400',card: 'dark:bg-emerald-500/10 bg-emerald-50', text: 'text-emerald-600 dark:text-emerald-300', ring: 'ring-emerald-200 dark:ring-emerald-500/30' },
  cyan:   { dot: 'bg-cyan-400',   card: 'dark:bg-cyan-500/10 bg-cyan-50',   text: 'text-cyan-600 dark:text-cyan-300',   ring: 'ring-cyan-200 dark:ring-cyan-500/30' },
  purple: { dot: 'bg-violet-400', card: 'dark:bg-violet-500/10 bg-violet-50', text: 'text-violet-600 dark:text-violet-300', ring: 'ring-violet-200 dark:ring-violet-500/30' },
  amber:  { dot: 'bg-amber-400',  card: 'dark:bg-amber-500/10 bg-amber-50', text: 'text-amber-600 dark:text-amber-300', ring: 'ring-amber-200 dark:ring-amber-500/30' },
  red:    { dot: 'bg-rose-400',   card: 'dark:bg-rose-500/10 bg-rose-50',   text: 'text-rose-600 dark:text-rose-300',   ring: 'ring-rose-200 dark:ring-rose-500/30' },
}

const EMOJI_OPTIONS = ['🦷','💪','💧','📚','🧘','🏃','🥗','😴','✍️','🎯','🌅','🚶','💊','🎵','🧹']
const COLOR_OPTIONS = ['blue','green','cyan','purple','amber','red']

function HabitsTab() {
  const { habits, habitLogs, logHabit, resetHabitToday, addHabit, deleteHabit, getHabitStreak } = useStore()
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState({ name: '', emoji: '🎯', target: 1, color: 'blue' })
  const todayStr = format(new Date(), 'yyyy-MM-dd')

  const habitsWithState = habits.map((h) => {
    const log   = habitLogs.find((l) => l.habitId === h.id && l.date === todayStr)
    const count  = log?.count ?? 0
    const done   = count >= h.target
    const streak = getHabitStreak(h.id)
    return { ...h, count, done, streak }
  })

  const todayDone = habitsWithState.filter((h) => h.done).length

  return (
    <div className="space-y-4">
      {habits.length > 0 && (
        <div className="bg-white dark:bg-zinc-900 rounded-2xl ring-1 ring-zinc-200/60 dark:ring-white/[0.06] p-4">
          <p className="text-sm font-semibold text-zinc-700 dark:text-zinc-200 mb-1">Today's Progress</p>
          <div className="flex items-center gap-3">
            <div className="flex-1 h-2 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-violet-500 rounded-full transition-all duration-500"
                style={{ width: habits.length ? `${(todayDone / habits.length) * 100}%` : '0%' }}
              />
            </div>
            <span className="text-sm font-bold text-violet-500">{todayDone}/{habits.length}</span>
          </div>
        </div>
      )}

      {habits.length === 0 && <EmptyState icon={Flame} text="Add habits to track your daily routine" />}

      <div className="grid grid-cols-2 gap-3">
        {habitsWithState.map((h) => {
          const c = HABIT_COLORS[h.color] ?? HABIT_COLORS.blue
          return (
            <button
              key={h.id}
              onClick={() => logHabit(h.id)}
              onContextMenu={(e) => { e.preventDefault(); resetHabitToday(h.id) }}
              className={`relative rounded-2xl p-4 text-left ring-1 transition-all active:scale-95 ${
                h.done
                  ? `${c.card} ${c.ring}`
                  : 'bg-white dark:bg-zinc-900 ring-zinc-200/60 dark:ring-white/[0.06]'
              }`}
            >
              {h.streak > 0 && (
                <div className={`absolute top-3 right-3 flex items-center gap-0.5 text-[10px] font-bold ${c.text}`}>
                  <Flame size={10} />
                  {h.streak}
                </div>
              )}
              <p className="text-3xl mb-2">{h.emoji}</p>
              <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-100 leading-tight">{h.name}</p>
              <div className="flex gap-1 mt-2">
                {Array.from({ length: h.target }).map((_, i) => (
                  <div
                    key={i}
                    className={`w-2.5 h-2.5 rounded-full ${i < h.count ? c.dot : 'bg-zinc-200 dark:bg-zinc-700'}`}
                  />
                ))}
              </div>
              <p className={`text-xs mt-1 font-medium ${h.done ? c.text : 'text-zinc-400'}`}>
                {h.done ? '✓ Done' : `${h.count}/${h.target}`}
              </p>
            </button>
          )
        })}
      </div>

      <Btn size="lg" variant="ghost" onClick={() => setModal(true)}><Plus size={18} /> Add Habit</Btn>
      <p className="text-xs text-zinc-400 dark:text-zinc-600 text-center">Tap to log · Long-press to reset today</p>

      <Modal open={modal} onClose={() => setModal(false)} title="New Habit">
        <div className="space-y-4">
          <Input label="Habit name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Morning walk" />
          <div>
            <p className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide mb-2">Emoji</p>
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
            <p className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide mb-2">Daily Target</p>
            <div className="flex gap-2">
              {[1,2,3,4,5,6,7,8].map((n) => (
                <button key={n} onClick={() => setForm({ ...form, target: n })}
                  className={`w-10 h-10 rounded-xl text-sm font-bold transition-all ${form.target === n ? 'bg-blue-500 text-white' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300'}`}>
                  {n}
                </button>
              ))}
            </div>
          </div>
          <div>
            <p className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide mb-2">Color</p>
            <div className="flex gap-2">
              {COLOR_OPTIONS.map((col) => (
                <button key={col} onClick={() => setForm({ ...form, color: col })}
                  className={`w-8 h-8 rounded-full ${HABIT_COLORS[col].dot} ring-2 ring-offset-2 dark:ring-offset-zinc-900 transition-all ${form.color === col ? 'ring-blue-500 scale-110' : 'ring-transparent'}`}
                />
              ))}
            </div>
          </div>
          <Btn size="lg" onClick={() => { if (form.name.trim()) { addHabit({ ...form, name: form.name.trim() }); setForm({ name: '', emoji: '🎯', target: 1, color: 'blue' }); setModal(false) } }} disabled={!form.name.trim()}>
            Add Habit
          </Btn>
        </div>
      </Modal>
    </div>
  )
}

// ─── Kanban tab ───────────────────────────────────────────────────────────────
function KanbanTab({ category }) {
  const { tasks, addTask, deleteTask, moveTask } = useStore()
  const [addModal, setAddModal] = useState(false)
  const [detail, setDetail]   = useState(null)
  const [form, setForm]       = useState({ text: '', priority: 'med', dueDate: '' })

  const items = tasks.filter((t) => t.category === category)
  const isOverdue = (t) => t.dueDate && t.status !== 'done' && isPast(startOfDay(parseISO(t.dueDate)))

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
        if (col.length === 0) return (
          <div key={key}>
            <SectionHeader>{label} · 0</SectionHeader>
            <div className="bg-zinc-50 dark:bg-zinc-800/30 rounded-2xl py-4 text-center text-xs text-zinc-400 dark:text-zinc-600">Empty</div>
          </div>
        )
        return (
          <div key={key}>
            <SectionHeader>{label} · {col.length}</SectionHeader>
            {col.map((t) => (
              <Card
                key={t.id}
                className="p-4 mb-2 cursor-pointer active:scale-[0.98] transition-transform"
                onClick={() => setDetail(t)}
              >
                <div className="flex items-start gap-2">
                  <div className="flex-1">
                    <p className={`text-sm font-medium leading-snug ${t.status === 'done' ? 'line-through text-zinc-400' : 'text-zinc-800 dark:text-zinc-100'}`}>
                      {t.text}
                    </p>
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      <Badge color={PRIORITY_COLOR[t.priority]}>{PRIORITY_LABEL[t.priority]}</Badge>
                      {t.dueDate && (
                        <Badge color={isOverdue(t) ? 'red' : 'zinc'}>
                          {isOverdue(t) ? '⚠ ' : ''}{format(parseISO(t.dueDate), 'MMM d')}
                        </Badge>
                      )}
                    </div>
                  </div>
                  <ChevronRight size={15} className="text-zinc-300 dark:text-zinc-600 mt-0.5 shrink-0" />
                </div>
              </Card>
            ))}
          </div>
        )
      })}

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

      <Modal open={!!detail} onClose={() => setDetail(null)} title={detail?.text ?? ''}>
        {detail && (
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
              <Badge color={PRIORITY_COLOR[detail.priority]}>{PRIORITY_LABEL[detail.priority]} priority</Badge>
              {detail.dueDate && <Badge color="zinc">Due {format(parseISO(detail.dueDate), 'MMM d, yyyy')}</Badge>}
            </div>
            <div>
              <p className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide mb-2">Move to</p>
              <div className="grid grid-cols-3 gap-2">
                {STATUSES.map(({ key, label }) => (
                  <button
                    key={key}
                    onClick={() => { moveTask(detail.id, key); setDetail(null) }}
                    className={`py-2.5 rounded-xl text-sm font-semibold transition-colors ${
                      detail.status === key
                        ? 'bg-blue-500 text-white shadow-sm'
                        : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
            <Btn variant="danger" size="lg" onClick={() => { deleteTask(detail.id); setDetail(null) }}>
              <Trash2 size={15} /> Delete task
            </Btn>
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
