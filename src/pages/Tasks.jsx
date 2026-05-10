import { useState } from 'react'
import { Plus, Trash2, Circle, CheckCircle2, ChevronRight } from 'lucide-react'
import { format, isPast, parseISO, startOfDay } from 'date-fns'
import { motion, AnimatePresence } from 'framer-motion'
import { useStore } from '../store'
import Modal from '../components/Modal'
import { Card, Btn, Input, Select, Badge, SectionHeader, EmptyState } from '../components/UI'

const PRIORITY_COLOR = { high: 'red', med: 'amber', low: 'blue' }
const PRIORITY_LABEL = { high: 'High', med: 'Med', low: 'Low' }
const STATUSES = [
  { key: 'todo', label: 'To Do' },
  { key: 'doing', label: 'In Progress' },
  { key: 'done', label: 'Done' },
]

// ─── Daily tab ────────────────────────────────────────────────────────────────
function DailyTab() {
  const { dailyTasks, addDailyTask, toggleDailyTask, deleteDailyTask } = useStore()
  const [text, setText] = useState('')
  const todayStr = format(new Date(), 'yyyy-MM-dd')
  const items = dailyTasks.filter((t) => t.date === todayStr)
  const done = items.filter((t) => t.done)
  const pending = items.filter((t) => !t.done)

  const submit = (e) => {
    e.preventDefault()
    if (!text.trim()) return
    addDailyTask(text.trim())
    setText('')
  }

  return (
    <div className="space-y-4">
      <form onSubmit={submit} className="flex gap-2">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Add a task for today..."
          className="flex-1 rounded-xl bg-zinc-100 dark:bg-zinc-700/60 border-0 px-4 py-3 text-sm text-zinc-900 dark:text-white placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                <Card className="flex items-center gap-3 px-4 py-3 mb-2">
                  <button onClick={() => toggleDailyTask(t.id)} className="shrink-0">
                    <Circle size={22} className="text-zinc-300 dark:text-zinc-600" />
                  </button>
                  <span className="flex-1 text-sm text-zinc-800 dark:text-zinc-100">{t.text}</span>
                  <button onClick={() => deleteDailyTask(t.id)} className="p-1 text-zinc-300 hover:text-red-400 transition-colors">
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
            <Card key={t.id} className="flex items-center gap-3 px-4 py-3 mb-2 opacity-60">
              <button onClick={() => toggleDailyTask(t.id)} className="shrink-0">
                <CheckCircle2 size={22} className="text-green-500" />
              </button>
              <span className="flex-1 text-sm line-through text-zinc-400">{t.text}</span>
              <button onClick={() => deleteDailyTask(t.id)} className="p-1 text-zinc-300 hover:text-red-400 transition-colors">
                <Trash2 size={14} />
              </button>
            </Card>
          ))}
        </>
      )}
    </div>
  )
}

// ─── Kanban tab (Office / Projects) ───────────────────────────────────────────
function KanbanTab({ category }) {
  const { tasks, addTask, deleteTask, moveTask } = useStore()
  const [addModal, setAddModal] = useState(false)
  const [detail, setDetail] = useState(null)
  const [form, setForm] = useState({ text: '', priority: 'med', dueDate: '' })

  const items = tasks.filter((t) => t.category === category)
  const isOverdue = (t) =>
    t.dueDate && t.status !== 'done' && isPast(startOfDay(parseISO(t.dueDate)))

  const submit = () => {
    if (!form.text.trim()) return
    addTask({ ...form, text: form.text.trim(), category })
    setForm({ text: '', priority: 'med', dueDate: '' })
    setAddModal(false)
  }

  return (
    <div className="space-y-4">
      <Btn size="lg" onClick={() => setAddModal(true)}><Plus size={18} /> Add Task</Btn>

      {STATUSES.map(({ key, label }) => {
        const col = items.filter((t) => t.status === key)
        return (
          <div key={key}>
            <SectionHeader>{label} · {col.length}</SectionHeader>
            {col.length === 0
              ? <div className="bg-zinc-50 dark:bg-zinc-800/30 rounded-2xl py-4 text-center text-xs text-zinc-400">Empty</div>
              : col.map((t) => (
                <Card
                  key={t.id}
                  className="p-3.5 mb-2 cursor-pointer active:scale-[0.98] transition-transform"
                  onClick={() => setDetail(t)}
                >
                  <div className="flex items-start gap-2">
                    <div className="flex-1">
                      <p className={`text-sm font-medium leading-snug ${t.status === 'done' ? 'line-through text-zinc-400' : 'text-zinc-800 dark:text-zinc-100'}`}>
                        {t.text}
                      </p>
                      <div className="flex flex-wrap gap-1.5 mt-1.5">
                        <Badge color={PRIORITY_COLOR[t.priority]}>{PRIORITY_LABEL[t.priority]}</Badge>
                        {t.dueDate && (
                          <Badge color={isOverdue(t) ? 'red' : 'zinc'}>
                            {isOverdue(t) ? '⚠ ' : ''}{format(parseISO(t.dueDate), 'MMM d')}
                          </Badge>
                        )}
                      </div>
                    </div>
                    <ChevronRight size={15} className="text-zinc-300 mt-0.5 shrink-0" />
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

      {/* Detail / move modal */}
      <Modal open={!!detail} onClose={() => setDetail(null)} title={detail?.text ?? ''}>
        {detail && (
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
              <Badge color={PRIORITY_COLOR[detail.priority]}>{PRIORITY_LABEL[detail.priority]} priority</Badge>
              {detail.dueDate && <Badge color="zinc">Due {format(parseISO(detail.dueDate), 'MMM d, yyyy')}</Badge>}
            </div>
            <div>
              <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400 mb-2">Move to</p>
              <div className="grid grid-cols-3 gap-2">
                {STATUSES.map(({ key, label }) => (
                  <button
                    key={key}
                    onClick={() => { moveTask(detail.id, key); setDetail(null) }}
                    className={`py-2.5 rounded-xl text-sm font-semibold transition-colors ${
                      detail.status === key
                        ? 'bg-blue-500 text-white'
                        : 'bg-zinc-100 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-200'
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
  { key: 'daily', label: 'Daily' },
  { key: 'office', label: 'Office' },
  { key: 'projects', label: 'Projects' },
]

export default function Tasks() {
  const [tab, setTab] = useState('daily')
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">Tasks</h1>
      <div className="flex bg-zinc-100 dark:bg-zinc-800 rounded-2xl p-1 gap-1">
        {TABS.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`flex-1 py-2 rounded-xl text-sm font-bold transition-all ${
              tab === key ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white shadow-sm' : 'text-zinc-400'
            }`}
          >
            {label}
          </button>
        ))}
      </div>
      {tab === 'daily' && <DailyTab />}
      {tab === 'office' && <KanbanTab category="office" />}
      {tab === 'projects' && <KanbanTab category="projects" />}
    </div>
  )
}
