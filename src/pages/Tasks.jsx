import {
  useState, useRef, useCallback, useEffect, useLayoutEffect, useMemo,
} from 'react'
import {
  Plus, Trash2, Circle, CheckCircle2, ChevronRight, Flame, Pencil, Check, X,
  ArrowLeft, FileText, Paperclip, FolderOpen, ChevronDown, ChevronUp,
  Bell, BellOff, MapPin, Link2, Star, Calendar, Clock, AlertTriangle,
  CalendarDays,
} from 'lucide-react'
import {
  format, parseISO, startOfDay, isBefore, isToday, isTomorrow,
  addDays, startOfMonth, endOfMonth, eachDayOfInterval, getDay,
  isSameDay, isSameMonth, differenceInCalendarDays,
} from 'date-fns'
import { motion, AnimatePresence } from 'framer-motion'
import { useStore } from '../store'
import Modal from '../components/Modal'
import { Card, Btn, Input, Select, Badge, SectionHeader, EmptyState } from '../components/UI'

// ─── Constants ────────────────────────────────────────────────────────────────
const PRIORITY_COLOR = { high: 'red', med: 'amber', low: 'blue' }
const PRIORITY_LABEL = { high: 'High', med: 'Med', low: 'Low' }
const PRIORITY_DOT   = { high: 'bg-rose-500', med: 'bg-amber-400', low: 'bg-blue-400' }

const STATUSES = [
  { key: 'todo',  label: 'To Do' },
  { key: 'doing', label: 'In Progress' },
  { key: 'done',  label: 'Done' },
]

const PROJECT_COLORS = ['blue','violet','emerald','rose','amber','cyan','pink','indigo']
const PROJECT_EMOJIS = ['🚀','💡','🎯','🔬','📊','🛠️','🎨','📱','🌱','⚡','🏗️','📝']
const COLOR_BG = {
  blue:    'bg-blue-500',   violet:  'bg-violet-500', emerald: 'bg-emerald-500',
  rose:    'bg-rose-500',   amber:   'bg-amber-500',  cyan:    'bg-cyan-500',
  pink:    'bg-pink-500',   indigo:  'bg-indigo-500',
}
const COLOR_LIGHT = {
  blue:    'bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-300',
  violet:  'bg-violet-50 dark:bg-violet-500/10 text-violet-700 dark:text-violet-300',
  emerald: 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-300',
  rose:    'bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-300',
  amber:   'bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-300',
  cyan:    'bg-cyan-50 dark:bg-cyan-500/10 text-cyan-700 dark:text-cyan-300',
  pink:    'bg-pink-50 dark:bg-pink-500/10 text-pink-700 dark:text-pink-300',
  indigo:  'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-300',
}

const HABIT_COLORS = {
  blue:   { dot: 'bg-blue-400',    card: 'bg-blue-50 dark:bg-blue-500/10',       text: 'text-blue-600 dark:text-blue-300',    ring: 'ring-2 ring-blue-300 dark:ring-blue-500/50' },
  green:  { dot: 'bg-emerald-400', card: 'bg-emerald-50 dark:bg-emerald-500/10', text: 'text-emerald-600 dark:text-emerald-300', ring: 'ring-2 ring-emerald-300 dark:ring-emerald-500/50' },
  cyan:   { dot: 'bg-cyan-400',    card: 'bg-cyan-50 dark:bg-cyan-500/10',       text: 'text-cyan-600 dark:text-cyan-300',    ring: 'ring-2 ring-cyan-300 dark:ring-cyan-500/50' },
  purple: { dot: 'bg-violet-400',  card: 'bg-violet-50 dark:bg-violet-500/10',   text: 'text-violet-600 dark:text-violet-300', ring: 'ring-2 ring-violet-300 dark:ring-violet-500/50' },
  amber:  { dot: 'bg-amber-400',   card: 'bg-amber-50 dark:bg-amber-500/10',     text: 'text-amber-600 dark:text-amber-300',  ring: 'ring-2 ring-amber-300 dark:ring-amber-500/50' },
  red:    { dot: 'bg-rose-400',    card: 'bg-rose-50 dark:bg-rose-500/10',       text: 'text-rose-600 dark:text-rose-300',    ring: 'ring-2 ring-rose-300 dark:ring-rose-500/50' },
}
const EMOJI_OPTIONS  = ['🦷','💪','💧','📚','🧘','🏃','🥗','😴','✍️','🎯','🌅','🚶','💊','🎵','🧹','☕']
const COLOR_OPTIONS  = ['blue','green','cyan','purple','amber','red']

const REMINDER_OPTIONS = [
  { value: 'none',   label: 'No reminder' },
  { value: 'at_time', label: 'At the time' },
  { value: '15min',  label: '15 minutes before' },
  { value: '1hour',  label: '1 hour before' },
  { value: '1day',   label: '1 day before' },
]

const todayStr = () => format(new Date(), 'yyyy-MM-dd')

// ─── Helpers ──────────────────────────────────────────────────────────────────
function isOverdueTask(task) {
  if (!task.date || task.done) return false
  return isBefore(startOfDay(parseISO(task.date)), startOfDay(new Date()))
}

function fmtTimeRange(start, end) {
  if (!start && !end) return null
  if (start && end) return `${start} – ${end}`
  return start || end
}

function relativeDateLabel(date) {
  if (isToday(date)) return 'Today'
  if (isTomorrow(date)) return 'Tomorrow'
  const diff = differenceInCalendarDays(date, new Date())
  if (diff > 0) return `In ${diff} days`
  return format(date, 'EEE MMM d')
}

// ─── useReminders hook ────────────────────────────────────────────────────────
function useReminders(appointments) {
  const [permission, setPermission] = useState(
    typeof Notification !== 'undefined' ? Notification.permission : 'denied'
  )
  const scheduled = useRef(new Set())
  const timers    = useRef([])

  const requestPermission = useCallback(async () => {
    if (typeof Notification === 'undefined') return
    const result = await Notification.requestPermission()
    setPermission(result)
  }, [])

  useEffect(() => {
    if (permission !== 'granted' || !appointments?.length) return

    // Clear old timers
    timers.current.forEach(clearTimeout)
    timers.current = []

    const now = Date.now()
    const horizon = now + 25 * 60 * 60 * 1000 // 25 hours

    appointments.forEach((apt) => {
      if (apt.reminder === 'none' || !apt.reminder || !apt.date || !apt.startTime) return

      const key = `${apt.id}-${apt.reminder}`
      if (scheduled.current.has(key)) return

      // Parse appointment datetime
      const [h, m] = apt.startTime.split(':').map(Number)
      const aptDate = parseISO(apt.date)
      const aptMs = new Date(aptDate.getFullYear(), aptDate.getMonth(), aptDate.getDate(), h, m, 0).getTime()

      const offsets = { at_time: 0, '15min': 15 * 60 * 1000, '1hour': 60 * 60 * 1000, '1day': 24 * 60 * 60 * 1000 }
      const offset = offsets[apt.reminder] ?? 0
      const fireAt = aptMs - offset

      if (fireAt < now || fireAt > horizon) return

      scheduled.current.add(key)
      const delay = fireAt - now
      const t = setTimeout(() => {
        new Notification(apt.title, {
          body: [
            apt.reminder !== 'at_time' ? `Starting at ${apt.startTime}` : `Now`,
            apt.location && `📍 ${apt.location}`,
          ].filter(Boolean).join(' · '),
          icon: '/pwa-192x192.png',
        })
      }, delay)
      timers.current.push(t)
    })

    return () => {
      timers.current.forEach(clearTimeout)
      timers.current = []
    }
  }, [appointments, permission])

  return { permission, requestPermission }
}

// ─── Scrollable pill tab bar ──────────────────────────────────────────────────
const TOP_TABS = [
  { key: 'today',     label: 'Today' },
  { key: 'upcoming',  label: 'Upcoming' },
  { key: 'calendar',  label: 'Calendar' },
  { key: 'habits',    label: 'Habits' },
  { key: 'office',    label: 'Office' },
  { key: 'projects',  label: 'Projects' },
]

function PillTabBar({ tabs, active, onChange }) {
  const containerRef = useRef(null)
  const btnRefs      = useRef({})
  const firstRender  = useRef(true)

  useLayoutEffect(() => {
    const container = containerRef.current
    const btn       = btnRefs.current[active]
    if (!container || !btn) return

    const cr  = container.getBoundingClientRect()
    const br  = btn.getBoundingClientRect()
    const targetScroll = container.scrollLeft + (br.left - cr.left) - (cr.width / 2) + (br.width / 2)

    if (firstRender.current) {
      container.scrollLeft = targetScroll
      firstRender.current = false
    } else {
      container.scrollTo({ left: targetScroll, behavior: 'smooth' })
    }
  }, [active])

  return (
    <div
      ref={containerRef}
      className="flex gap-2 overflow-x-auto scrollbar-none pb-0.5"
      style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
    >
      {tabs.map(({ key, label }) => (
        <button
          key={key}
          ref={(el) => { btnRefs.current[key] = el }}
          onClick={() => onChange(key)}
          className={`shrink-0 px-4 py-2 rounded-full text-sm font-semibold transition-all focus:outline-none focus:ring-2 focus:ring-blue-500/70 ${
            active === key
              ? 'bg-blue-500 text-white shadow-sm shadow-blue-500/30'
              : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400'
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  )
}

// ─── Shared: AppointmentCard ──────────────────────────────────────────────────
function AppointmentCard({ apt, onEdit, onDelete }) {
  return (
    <div
      className="border-l-4 border-teal-500 dark:border-teal-400 bg-teal-50/50 dark:bg-teal-500/5 rounded-r-2xl ring-1 ring-teal-200/60 dark:ring-teal-500/20 px-4 py-3 mb-2 cursor-pointer active:scale-[0.99] transition-transform"
      onClick={() => onEdit(apt)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === 'Enter') onEdit(apt) }}
      aria-label={`Appointment: ${apt.title}`}
    >
      <div className="flex items-start gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            {apt.important && <Star size={12} className="text-amber-400 fill-amber-400 shrink-0" />}
            <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-100 truncate">{apt.title}</p>
          </div>
          {fmtTimeRange(apt.startTime, apt.endTime) && (
            <p className="text-xs text-teal-600 dark:text-teal-400 font-medium mt-0.5 flex items-center gap-1">
              <Clock size={11} />
              {fmtTimeRange(apt.startTime, apt.endTime)}
            </p>
          )}
          {apt.location && (
            <p className="text-xs text-zinc-400 mt-0.5 flex items-center gap-1 truncate">
              <MapPin size={11} className="shrink-0" />{apt.location}
            </p>
          )}
          {apt.meetingLink && (
            <a
              href={apt.meetingLink}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="text-xs text-blue-500 mt-0.5 flex items-center gap-1 truncate hover:underline"
              aria-label="Open meeting link"
            >
              <Link2 size={11} className="shrink-0" />Join
            </a>
          )}
        </div>
        <button
          onClick={(e) => { e.stopPropagation(); onDelete(apt.id) }}
          aria-label={`Delete appointment ${apt.title}`}
          className="p-1 text-zinc-300 hover:text-rose-400 transition-colors shrink-0 focus:outline-none focus:ring-2 focus:ring-rose-500/70 rounded"
        >
          <Trash2 size={13} />
        </button>
      </div>
    </div>
  )
}

// ─── Shared: TaskItem ─────────────────────────────────────────────────────────
function TaskItem({ task, onToggle, onEdit, onDelete, onReschedule, showDate = false }) {
  const [showActions, setShowActions] = useState(false)
  const overdue = isOverdueTask(task)

  return (
    <div
      className={`flex items-center gap-3 px-4 py-3.5 mb-2 rounded-2xl ring-1 transition-all ${
        overdue
          ? 'border-l-4 border-rose-500 bg-rose-50/50 dark:bg-rose-500/5 ring-rose-200/60 dark:ring-rose-500/20'
          : 'bg-white dark:bg-[#161B27] ring-zinc-200/60 dark:ring-white/[0.06]'
      }`}
    >
      {/* Square checkbox */}
      <button
        onClick={() => onToggle(task.id)}
        aria-label={task.done ? 'Mark incomplete' : 'Mark complete'}
        className={`w-5 h-5 rounded-md shrink-0 border-2 flex items-center justify-center transition-all focus:outline-none focus:ring-2 focus:ring-blue-500/70 ${
          task.done
            ? 'bg-emerald-500 border-emerald-500'
            : overdue
              ? 'border-rose-400 dark:border-rose-600'
              : 'border-zinc-300 dark:border-zinc-600 hover:border-blue-400'
        }`}
      >
        {task.done && <Check size={12} className="text-white" strokeWidth={3} />}
      </button>

      {/* Text + meta */}
      <div
        className="flex-1 min-w-0 cursor-pointer"
        onClick={() => setShowActions((v) => !v)}
      >
        <p className={`text-sm leading-snug ${task.done ? 'line-through text-zinc-400 dark:text-zinc-600' : 'text-zinc-800 dark:text-zinc-100'}`}>
          {task.text}
        </p>
        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
          {task.dueTime && (
            <span className="text-[11px] text-zinc-400 flex items-center gap-0.5">
              <Clock size={10} />{task.dueTime}
            </span>
          )}
          {showDate && task.date && (
            <span className="text-[11px] text-zinc-400">{format(parseISO(task.date), 'MMM d')}</span>
          )}
          {task.notes && <span className="text-[11px] text-zinc-400 truncate max-w-[100px]">{task.notes}</span>}
        </div>
      </div>

      {/* Priority pill badge (replaces tiny dot) */}
      {task.priority && !task.done && (
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${
          task.priority === 'high' ? 'bg-rose-100 dark:bg-rose-500/20 text-rose-600 dark:text-rose-400' :
          task.priority === 'med'  ? 'bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400' :
                                     'bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400'
        }`} aria-label={`Priority: ${PRIORITY_LABEL[task.priority]}`}>
          {PRIORITY_LABEL[task.priority]}
        </span>
      )}

      {/* Edit icon (shown on row tap) */}
      <AnimatePresence>
        {showActions && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="flex items-center gap-1 shrink-0"
          >
            <button
              onClick={() => { setShowActions(false); onEdit(task) }}
              aria-label="Edit task"
              className="p-1 text-blue-400 hover:text-blue-500 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500/70 rounded"
            >
              <Pencil size={14} />
            </button>
            {onReschedule && (
              <button
                onClick={() => { setShowActions(false); onReschedule(task) }}
                aria-label="Reschedule task"
                className="p-1 text-amber-400 hover:text-amber-500 transition-colors focus:outline-none focus:ring-2 focus:ring-amber-500/70 rounded"
              >
                <CalendarDays size={14} />
              </button>
            )}
            <button
              onClick={() => { setShowActions(false); onDelete(task.id) }}
              aria-label="Delete task"
              className="p-1 text-zinc-300 hover:text-rose-400 transition-colors focus:outline-none focus:ring-2 focus:ring-rose-500/70 rounded"
            >
              <Trash2 size={14} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
      {!showActions && (
        <button
          onClick={() => onDelete(task.id)}
          aria-label="Delete task"
          className="p-1 text-zinc-200 dark:text-zinc-700 hover:text-rose-400 transition-colors shrink-0 focus:outline-none focus:ring-2 focus:ring-rose-500/70 rounded"
        >
          <Trash2 size={13} />
        </button>
      )}
    </div>
  )
}

// ─── Shared: RescheduleModal ──────────────────────────────────────────────────
function RescheduleModal({ open, task, onClose, onReschedule }) {
  const [customDate, setCustomDate] = useState(todayStr())

  const quickMove = (dateStr) => {
    onReschedule(task.id, dateStr)
    onClose()
  }

  return (
    <Modal open={open} onClose={onClose} title="Reschedule Task">
      {task && (
        <div className="space-y-4">
          <p className="text-sm text-zinc-600 dark:text-zinc-400 font-medium">"{task.text}"</p>
          <div className="grid grid-cols-3 gap-2">
            {[
              { label: 'Today',     date: todayStr() },
              { label: 'Tomorrow',  date: format(addDays(new Date(), 1), 'yyyy-MM-dd') },
              { label: 'Next Week', date: format(addDays(new Date(), 7), 'yyyy-MM-dd') },
            ].map(({ label, date }) => (
              <button
                key={label}
                onClick={() => quickMove(date)}
                className="py-2.5 rounded-xl text-sm font-semibold bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200 hover:bg-blue-50 dark:hover:bg-blue-500/10 hover:text-blue-600 dark:hover:text-blue-400 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500/70"
              >
                {label}
              </button>
            ))}
          </div>
          <Input
            label="Or pick a date"
            type="date"
            value={customDate}
            onChange={(e) => setCustomDate(e.target.value)}
          />
          <Btn size="lg" onClick={() => customDate && quickMove(customDate)} disabled={!customDate}>
            Move to date
          </Btn>
        </div>
      )}
    </Modal>
  )
}

// ─── Shared: DailyAgenda (reused in Today + Calendar) ────────────────────────
function DailyAgenda({ date, onEditApt, onDeleteApt, onEditTask, onToggleTask, onDeleteTask, onRescheduleTask }) {
  const { dailyTasks, appointments } = useStore()
  const dateStr = format(date, 'yyyy-MM-dd')

  const dayApts = useMemo(
    () => (appointments ?? [])
      .filter((a) => a.date === dateStr)
      .sort((a, b) => (a.startTime || '').localeCompare(b.startTime || '')),
    [appointments, dateStr]
  )

  const dayTasks = useMemo(
    () => dailyTasks
      .filter((t) => t.date === dateStr)
      .sort((a, b) => {
        const order = { high: 0, med: 1, low: 2 }
        return (order[a.priority] ?? 1) - (order[b.priority] ?? 1)
      }),
    [dailyTasks, dateStr]
  )

  if (!dayApts.length && !dayTasks.length) return null

  return (
    <div className="space-y-2">
      {dayApts.length > 0 && (
        <div>
          <SectionHeader>Appointments · {dayApts.length}</SectionHeader>
          {dayApts.map((apt) => (
            <AppointmentCard key={apt.id} apt={apt} onEdit={onEditApt} onDelete={onDeleteApt} />
          ))}
        </div>
      )}
      {dayTasks.length > 0 && (
        <div>
          <SectionHeader>Tasks · {dayTasks.length}</SectionHeader>
          {dayTasks.map((task) => (
            <TaskItem
              key={task.id}
              task={task}
              onToggle={onToggleTask}
              onEdit={onEditTask}
              onDelete={onDeleteTask}
              onReschedule={onRescheduleTask}
            />
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Task Modal (Add / Edit) ──────────────────────────────────────────────────
function TaskModal({ open, onClose, initial = null, onSave, defaultDate = null }) {
  const today = todayStr()
  const blank = { text: '', notes: '', date: defaultDate || today, dueTime: '', priority: 'med', done: false }
  const [form, setForm] = useState(blank)

  useEffect(() => {
    if (open) setForm(initial ? { ...blank, ...initial } : { ...blank, date: defaultDate || today })
  }, [open, initial, defaultDate])

  const f = (k) => (e) => setForm((prev) => ({ ...prev, [k]: e.target.value }))

  const handleSave = () => {
    if (!form.text.trim()) return
    onSave({ ...form, text: form.text.trim(), notes: form.notes.trim() })
    onClose()
  }

  return (
    <Modal open={open} onClose={onClose} title={initial ? 'Edit Task' : 'New Task'}>
      <div className="space-y-4">
        <Input label="Title *" value={form.text} onChange={f('text')} placeholder="What needs to be done?" />
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest">Notes (optional)</label>
          <textarea
            value={form.notes}
            onChange={f('notes')}
            placeholder="Add notes..."
            rows={2}
            className="w-full rounded-xl bg-zinc-100 dark:bg-zinc-800 border-0 px-4 py-3 text-sm text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-blue-400/80 dark:focus:ring-blue-500/90 resize-none"
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Input label="Date" type="date" value={form.date} onChange={f('date')} />
          <Input label="Time (optional)" type="time" value={form.dueTime} onChange={f('dueTime')} />
        </div>
        {/* Priority segment */}
        <div>
          <p className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest mb-2">Priority</p>
          <div className="flex gap-2">
            {['high','med','low'].map((p) => (
              <button
                key={p}
                onClick={() => setForm((prev) => ({ ...prev, priority: p }))}
                className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all focus:outline-none focus:ring-2 focus:ring-blue-500/70 ${
                  form.priority === p
                    ? p === 'high' ? 'bg-rose-500 text-white' : p === 'med' ? 'bg-amber-400 text-white' : 'bg-blue-500 text-white'
                    : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300'
                }`}
              >
                {PRIORITY_LABEL[p]}
              </button>
            ))}
          </div>
        </div>
        {/* Done toggle (editing only) */}
        {initial && (
          <button
            onClick={() => setForm((prev) => ({ ...prev, done: !prev.done }))}
            className={`w-full py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all focus:outline-none focus:ring-2 focus:ring-blue-500/70 ${
              form.done
                ? 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300'
                : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300'
            }`}
          >
            {form.done ? <CheckCircle2 size={16} /> : <Circle size={16} />}
            {form.done ? 'Marked as done' : 'Mark as done'}
          </button>
        )}
        <Btn size="lg" onClick={handleSave} disabled={!form.text.trim()}>
          {initial ? 'Save Changes' : 'Add Task'}
        </Btn>
      </div>
    </Modal>
  )
}

// ─── Appointment Modal (Add / Edit) ──────────────────────────────────────────
function AppointmentModal({ open, onClose, initial = null, onSave, defaultDate = null }) {
  const today = todayStr()
  const blank = {
    title: '', notes: '', date: defaultDate || today, startTime: '', endTime: '',
    location: '', meetingLink: '', important: false, reminder: 'none',
  }
  const [form, setForm] = useState(blank)

  useEffect(() => {
    if (open) setForm(initial ? { ...blank, ...initial } : { ...blank, date: defaultDate || today })
  }, [open, initial, defaultDate])

  const f = (k) => (e) => setForm((prev) => ({ ...prev, [k]: e.target.value }))

  const handleSave = () => {
    if (!form.title.trim() || !form.date) return
    onSave({ ...form, title: form.title.trim() })
    onClose()
  }

  return (
    <Modal open={open} onClose={onClose} title={initial ? 'Edit Appointment' : 'New Appointment'}>
      <div className="space-y-4">
        <Input label="Title *" value={form.title} onChange={f('title')} placeholder="e.g. Doctor's appointment" />
        <Input label="Date *" type="date" value={form.date} onChange={f('date')} />
        <div className="grid grid-cols-2 gap-3">
          <Input label="Start time" type="time" value={form.startTime} onChange={f('startTime')} />
          <Input label="End time" type="time" value={form.endTime} onChange={f('endTime')} />
        </div>
        <Input label="Location (optional)" value={form.location} onChange={f('location')} placeholder="Address or room" />
        <Input label="Meeting link (optional)" value={form.meetingLink} onChange={f('meetingLink')} placeholder="https://..." />

        {/* Important toggle */}
        <button
          onClick={() => setForm((prev) => ({ ...prev, important: !prev.important }))}
          className={`w-full py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all focus:outline-none focus:ring-2 focus:ring-amber-500/70 ${
            form.important
              ? 'bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300'
              : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300'
          }`}
        >
          <Star size={15} className={form.important ? 'fill-amber-400 text-amber-400' : ''} />
          {form.important ? 'Important' : 'Mark as important'}
        </button>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest">Notes (optional)</label>
          <textarea
            value={form.notes}
            onChange={f('notes')}
            placeholder="Additional details..."
            rows={2}
            className="w-full rounded-xl bg-zinc-100 dark:bg-zinc-800 border-0 px-4 py-3 text-sm text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-blue-400/80 dark:focus:ring-blue-500/90 resize-none"
          />
        </div>

        <Select label="Reminder" value={form.reminder} onChange={f('reminder')}>
          {REMINDER_OPTIONS.map((r) => (
            <option key={r.value} value={r.value}>{r.label}</option>
          ))}
        </Select>

        <Btn size="lg" onClick={handleSave} disabled={!form.title.trim() || !form.date}>
          {initial ? 'Save Changes' : 'Add Appointment'}
        </Btn>

        {initial && (
          <Btn variant="danger" size="lg" onClick={() => { onClose(); /* deletion handled upstream */ }}>
            <Trash2 size={15} /> Delete Appointment
          </Btn>
        )}
      </div>
    </Modal>
  )
}

// ─── TODAY TAB ────────────────────────────────────────────────────────────────
function TodayTab() {
  const {
    dailyTasks, addDailyTask, updateDailyTask, toggleDailyTask, deleteDailyTask,
    appointments, addAppointment, updateAppointment, deleteAppointment,
  } = useStore()

  const { permission, requestPermission } = useReminders(appointments)

  const [overdueOpen,  setOverdueOpen]  = useState(true)
  const [taskModal,    setTaskModal]    = useState(false)
  const [editTask,     setEditTask]     = useState(null)
  const [aptModal,     setAptModal]     = useState(false)
  const [editApt,      setEditApt]      = useState(null)
  const [reschedModal, setReschedModal] = useState(false)
  const [reschedTask,  setReschedTask]  = useState(null)

  const today  = new Date()
  const tStr   = todayStr()

  const overdueTasks = useMemo(
    () => dailyTasks.filter((t) => !t.done && t.date && isBefore(startOfDay(parseISO(t.date)), startOfDay(today))),
    [dailyTasks]
  )

  const todayApts = useMemo(
    () => (appointments ?? [])
      .filter((a) => a.date === tStr)
      .sort((a, b) => (a.startTime || '').localeCompare(b.startTime || '')),
    [appointments, tStr]
  )

  const todayTasks = useMemo(
    () => dailyTasks
      .filter((t) => t.date === tStr)
      .sort((a, b) => {
        const order = { high: 0, med: 1, low: 2 }
        return (order[a.priority] ?? 1) - (order[b.priority] ?? 1)
      }),
    [dailyTasks, tStr]
  )

  const handleSaveTask = (form) => {
    if (editTask) {
      updateDailyTask(editTask.id, form)
    } else {
      addDailyTask(form)
    }
    setEditTask(null)
  }

  const handleSaveApt = (form) => {
    if (editApt) {
      updateAppointment(editApt.id, form)
    } else {
      addAppointment({ ...form, id: undefined, createdAt: undefined })
    }
    setEditApt(null)
  }

  const handleEditApt = (apt) => {
    setEditApt(apt)
    setAptModal(true)
  }

  const handleDeleteApt = (id) => deleteAppointment(id)

  const handleEditTask = (task) => {
    setEditTask(task)
    setTaskModal(true)
  }

  const handleReschedule = (task) => {
    setReschedTask(task)
    setReschedModal(true)
  }

  const handleRescheduleConfirm = (id, date) => {
    updateDailyTask(id, { date })
  }

  const isEmpty = !overdueTasks.length && !todayApts.length && !todayTasks.length

  return (
    <div className="space-y-4">
      {/* Date header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-2xl font-bold text-zinc-900 dark:text-white leading-tight">
            {format(today, 'EEEE')}
          </p>
          <p className="text-sm text-zinc-400 mt-0.5">{format(today, 'MMMM d, yyyy')}</p>
        </div>
        <button
          onClick={requestPermission}
          aria-label={permission === 'granted' ? 'Notifications enabled' : 'Enable notifications'}
          className={`p-2.5 rounded-2xl transition-all focus:outline-none focus:ring-2 focus:ring-blue-500/70 ${
            permission === 'granted'
              ? 'bg-teal-100 dark:bg-teal-500/20 text-teal-600 dark:text-teal-400'
              : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-400'
          }`}
        >
          {permission === 'granted' ? <Bell size={20} /> : <BellOff size={20} />}
        </button>
      </div>

      {/* Notification permission banner */}
      {permission === 'default' && (
        <div className="flex items-center gap-3 px-4 py-3 bg-amber-50 dark:bg-amber-500/10 ring-1 ring-amber-200/60 dark:ring-amber-500/30 rounded-2xl">
          <Bell size={16} className="text-amber-500 shrink-0" />
          <p className="text-sm text-amber-700 dark:text-amber-300 flex-1">Enable reminders for your appointments</p>
          <button
            onClick={requestPermission}
            className="text-xs font-bold text-amber-600 dark:text-amber-400 bg-amber-100 dark:bg-amber-500/20 px-3 py-1.5 rounded-full hover:bg-amber-200 dark:hover:bg-amber-500/30 transition-colors focus:outline-none focus:ring-2 focus:ring-amber-500/70"
          >
            Enable
          </button>
        </div>
      )}

      {/* Overdue section */}
      {overdueTasks.length > 0 && (
        <div>
          <button
            onClick={() => setOverdueOpen((v) => !v)}
            className="flex items-center gap-2 w-full text-left mb-2 focus:outline-none focus:ring-2 focus:ring-rose-500/70 rounded-lg"
          >
            <AlertTriangle size={14} className="text-rose-500" />
            <span className="text-[11px] font-bold uppercase tracking-widest text-rose-500">
              {overdueTasks.length} Overdue
            </span>
            {overdueOpen
              ? <ChevronUp size={13} className="text-rose-400 ml-auto" />
              : <ChevronDown size={13} className="text-rose-400 ml-auto" />
            }
          </button>
          <AnimatePresence>
            {overdueOpen && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                {overdueTasks.map((t) => (
                  <TaskItem
                    key={t.id}
                    task={t}
                    onToggle={toggleDailyTask}
                    onEdit={handleEditTask}
                    onDelete={deleteDailyTask}
                    onReschedule={handleReschedule}
                    showDate
                  />
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* Today's appointments */}
      {todayApts.length > 0 && (
        <div>
          <SectionHeader>Appointments · {todayApts.length}</SectionHeader>
          {todayApts.map((apt) => (
            <AppointmentCard key={apt.id} apt={apt} onEdit={handleEditApt} onDelete={handleDeleteApt} />
          ))}
        </div>
      )}

      {/* Today's tasks */}
      {todayTasks.length > 0 && (
        <div>
          <SectionHeader>Tasks · {todayTasks.length}</SectionHeader>
          <AnimatePresence>
            {todayTasks.map((t) => (
              <motion.div key={t.id} initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: 30 }}>
                <TaskItem
                  task={t}
                  onToggle={toggleDailyTask}
                  onEdit={handleEditTask}
                  onDelete={deleteDailyTask}
                  onReschedule={handleReschedule}
                />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Empty state */}
      {isEmpty && (
        <div className="flex flex-col items-center gap-3 py-14 text-zinc-300 dark:text-zinc-700">
          <CheckCircle2 size={48} strokeWidth={1} />
          <p className="text-sm text-zinc-400 dark:text-zinc-600 text-center">
            Clear day ahead ✨<br />Add a task or appointment below
          </p>
        </div>
      )}

      {/* Add action row */}
      <div className="flex gap-2 pt-2">
        <button
          onClick={() => { setEditTask(null); setTaskModal(true) }}
          className="flex-1 py-3 rounded-2xl border-2 border-dashed border-zinc-200 dark:border-zinc-700 text-sm font-semibold text-zinc-400 dark:text-zinc-500 hover:border-blue-300 dark:hover:border-blue-600 hover:text-blue-500 dark:hover:text-blue-400 transition-all focus:outline-none focus:ring-2 focus:ring-blue-500/70"
        >
          + Task for today
        </button>
        <button
          onClick={() => { setEditApt(null); setAptModal(true) }}
          className="flex-1 py-3 rounded-2xl border-2 border-dashed border-zinc-200 dark:border-zinc-700 text-sm font-semibold text-zinc-400 dark:text-zinc-500 hover:border-teal-300 dark:hover:border-teal-600 hover:text-teal-500 dark:hover:text-teal-400 transition-all focus:outline-none focus:ring-2 focus:ring-teal-500/70"
        >
          + Appointment
        </button>
      </div>

      {/* Task modal */}
      <TaskModal
        open={taskModal}
        onClose={() => { setTaskModal(false); setEditTask(null) }}
        initial={editTask}
        onSave={handleSaveTask}
      />

      {/* Appointment modal */}
      <AppointmentModal
        open={aptModal}
        onClose={() => { setAptModal(false); setEditApt(null) }}
        initial={editApt}
        onSave={handleSaveApt}
      />

      {/* Reschedule modal */}
      <RescheduleModal
        open={reschedModal}
        task={reschedTask}
        onClose={() => { setReschedModal(false); setReschedTask(null) }}
        onReschedule={handleRescheduleConfirm}
      />
    </div>
  )
}

// ─── UPCOMING TAB ─────────────────────────────────────────────────────────────
function UpcomingTab() {
  const {
    dailyTasks, updateDailyTask, toggleDailyTask, deleteDailyTask,
    appointments, deleteAppointment, updateAppointment, addAppointment,
  } = useStore()

  const [range,        setRange]        = useState(7)
  const [taskModal,    setTaskModal]    = useState(false)
  const [editTask,     setEditTask]     = useState(null)
  const [aptModal,     setAptModal]     = useState(false)
  const [editApt,      setEditApt]      = useState(null)
  const [reschedModal, setReschedModal] = useState(false)
  const [reschedTask,  setReschedTask]  = useState(null)

  const groups = useMemo(() => {
    const start = addDays(new Date(), 1)
    const end   = addDays(new Date(), range)
    const days  = eachDayOfInterval({ start, end })

    return days.map((day) => {
      const dStr = format(day, 'yyyy-MM-dd')
      const apts  = (appointments ?? [])
        .filter((a) => a.date === dStr)
        .sort((a, b) => (a.startTime || '').localeCompare(b.startTime || ''))
      const tasks = dailyTasks
        .filter((t) => t.date === dStr)
        .sort((a, b) => {
          const order = { high: 0, med: 1, low: 2 }
          return (order[a.priority] ?? 1) - (order[b.priority] ?? 1)
        })
      return { day, dStr, apts, tasks }
    }).filter((g) => g.apts.length > 0 || g.tasks.length > 0)
  }, [dailyTasks, appointments, range])

  const handleEditTask = (task) => { setEditTask(task); setTaskModal(true) }
  const handleEditApt  = (apt)  => { setEditApt(apt);   setAptModal(true) }
  const handleReschedule = (task) => { setReschedTask(task); setReschedModal(true) }

  return (
    <div className="space-y-4">
      {/* Range filter pills */}
      <div className="flex gap-2">
        {[7, 14, 30].map((d) => (
          <button
            key={d}
            onClick={() => setRange(d)}
            className={`px-4 py-2 rounded-full text-sm font-semibold transition-all focus:outline-none focus:ring-2 focus:ring-blue-500/70 ${
              range === d
                ? 'bg-blue-500 text-white shadow-sm shadow-blue-500/30'
                : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400'
            }`}
          >
            {d} days
          </button>
        ))}
      </div>

      {groups.length === 0 && (
        <EmptyState icon={CalendarDays} text={`Nothing in the next ${range} days`} />
      )}

      {groups.map(({ day, dStr, apts, tasks }) => (
        <div key={dStr}>
          {/* Date header */}
          <div className="flex items-center gap-2 mb-2">
            <p className="text-xs font-bold uppercase tracking-widest text-zinc-400 dark:text-zinc-500">
              {relativeDateLabel(day)} · {format(day, 'EEE MMM d')}
            </p>
          </div>

          {apts.map((apt) => (
            <AppointmentCard key={apt.id} apt={apt} onEdit={handleEditApt} onDelete={(id) => deleteAppointment(id)} />
          ))}
          {tasks.map((t) => (
            <TaskItem
              key={t.id}
              task={t}
              onToggle={toggleDailyTask}
              onEdit={handleEditTask}
              onDelete={deleteDailyTask}
              onReschedule={handleReschedule}
            />
          ))}
        </div>
      ))}

      <TaskModal
        open={taskModal}
        onClose={() => { setTaskModal(false); setEditTask(null) }}
        initial={editTask}
        onSave={(form) => { if (editTask) updateDailyTask(editTask.id, form) }}
      />
      <AppointmentModal
        open={aptModal}
        onClose={() => { setAptModal(false); setEditApt(null) }}
        initial={editApt}
        onSave={(form) => { if (editApt) updateAppointment(editApt.id, form) }}
      />
      <RescheduleModal
        open={reschedModal}
        task={reschedTask}
        onClose={() => { setReschedModal(false); setReschedTask(null) }}
        onReschedule={(id, date) => updateDailyTask(id, { date })}
      />
    </div>
  )
}

// ─── CALENDAR TAB ─────────────────────────────────────────────────────────────
const WEEKDAY_LABELS = ['S','M','T','W','T','F','S']

function CalendarTab() {
  const {
    dailyTasks, addDailyTask, updateDailyTask, toggleDailyTask, deleteDailyTask,
    appointments, addAppointment, deleteAppointment, updateAppointment,
  } = useStore()

  const [cursor,    setCursor]    = useState(new Date())       // month view
  const [selected,  setSelected]  = useState(new Date())       // selected day
  const [taskModal,  setTaskModal]  = useState(false)
  const [editTask,   setEditTask]   = useState(null)
  const [aptModal,   setAptModal]   = useState(false)
  const [editApt,    setEditApt]    = useState(null)
  const [reschedModal, setReschedModal] = useState(false)
  const [reschedTask,  setReschedTask]  = useState(null)

  const monthStart = startOfMonth(cursor)
  const monthEnd   = endOfMonth(cursor)
  const days       = eachDayOfInterval({ start: monthStart, end: monthEnd })

  // Leading blanks so first row starts on the right weekday
  const startOffset = getDay(monthStart)

  // Compute dots per day (tasks + appointments) — memoized for performance
  const dotsMap = useMemo(() => {
    const map = {}
    dailyTasks.forEach((t) => {
      if (!map[t.date]) map[t.date] = { tasks: 0, apts: 0 }
      map[t.date].tasks++
    });
    (appointments ?? []).forEach((a) => {
      if (!map[a.date]) map[a.date] = { tasks: 0, apts: 0 }
      map[a.date].apts++
    })
    return map
  }, [dailyTasks, appointments])

  const prevMonth = () => setCursor((c) => addDays(startOfMonth(c), -1))
  const nextMonth = () => setCursor((c) => addDays(endOfMonth(c), 1))

  const handleEditTask = (task) => { setEditTask(task); setTaskModal(true) }
  const handleEditApt  = (apt)  => { setEditApt(apt);   setAptModal(true) }
  const handleReschedule = (task) => { setReschedTask(task); setReschedModal(true) }

  const selStr = format(selected, 'yyyy-MM-dd')

  const selApts = useMemo(
    () => (appointments ?? [])
      .filter((a) => a.date === selStr)
      .sort((a, b) => (a.startTime || '').localeCompare(b.startTime || '')),
    [appointments, selStr]
  )
  const selTasks = useMemo(
    () => dailyTasks
      .filter((t) => t.date === selStr)
      .sort((a, b) => {
        const order = { high: 0, med: 1, low: 2 }
        return (order[a.priority] ?? 1) - (order[b.priority] ?? 1)
      }),
    [dailyTasks, selStr]
  )

  return (
    <div className="space-y-4">
      {/* Month nav */}
      <div className="flex items-center justify-between">
        <button
          onClick={prevMonth}
          aria-label="Previous month"
          className="p-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500/70"
        >
          <ChevronDown size={18} className="rotate-90" />
        </button>
        <p className="text-base font-bold text-zinc-800 dark:text-zinc-100">
          {format(cursor, 'MMMM yyyy')}
        </p>
        <button
          onClick={nextMonth}
          aria-label="Next month"
          className="p-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500/70"
        >
          <ChevronDown size={18} className="-rotate-90" />
        </button>
      </div>

      {/* Weekday headers */}
      <div className="grid grid-cols-7 gap-0">
        {WEEKDAY_LABELS.map((l, i) => (
          <div key={i} className="text-center text-[11px] font-bold text-zinc-400 dark:text-zinc-600 py-1">{l}</div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-0">
        {Array.from({ length: startOffset }).map((_, i) => <div key={`pad-${i}`} />)}
        {days.map((day) => {
          const dStr    = format(day, 'yyyy-MM-dd')
          const isToday_ = isToday(day)
          const isSel   = isSameDay(day, selected)
          const dots    = dotsMap[dStr]
          return (
            <button
              key={dStr}
              onClick={() => setSelected(day)}
              aria-label={format(day, 'MMMM d, yyyy')}
              className={`flex flex-col items-center py-1.5 rounded-xl transition-all focus:outline-none focus:ring-2 focus:ring-blue-500/70 ${
                isSel
                  ? 'bg-blue-500'
                  : isToday_
                  ? 'bg-blue-50 dark:bg-blue-500/10'
                  : 'hover:bg-zinc-100 dark:hover:bg-zinc-800'
              }`}
            >
              <span className={`text-sm font-semibold leading-none ${
                isSel
                  ? 'text-white'
                  : isToday_
                  ? 'text-blue-600 dark:text-blue-400'
                  : 'text-zinc-700 dark:text-zinc-300'
              }`}>
                {format(day, 'd')}
              </span>
              {/* Dots row */}
              {dots && (
                <div className="flex gap-0.5 mt-1">
                  {dots.tasks > 0 && <div className={`w-1 h-1 rounded-full ${isSel ? 'bg-white/70' : 'bg-blue-400'}`} />}
                  {dots.apts  > 0 && <div className={`w-1 h-1 rounded-full ${isSel ? 'bg-white/70' : 'bg-teal-400'}`} />}
                </div>
              )}
            </button>
          )
        })}
      </div>

      {/* Selected date header + Add buttons */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-bold text-zinc-700 dark:text-zinc-200">
            {isToday(selected) ? 'Today' : isTomorrow(selected) ? 'Tomorrow' : format(selected, 'EEE, MMM d')}
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => { setEditTask(null); setTaskModal(true) }}
              className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-blue-500 text-white text-xs font-bold shadow-sm shadow-blue-500/30 hover:bg-blue-600 active:scale-95 transition-all focus:outline-none focus:ring-2 focus:ring-blue-500/70"
            >
              <Plus size={12} /> Task
            </button>
            <button
              onClick={() => { setEditApt(null); setAptModal(true) }}
              className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-teal-500 text-white text-xs font-bold shadow-sm shadow-teal-500/30 hover:bg-teal-600 active:scale-95 transition-all focus:outline-none focus:ring-2 focus:ring-teal-500/70"
            >
              <Calendar size={12} /> Appt
            </button>
          </div>
        </div>

        {!selApts.length && !selTasks.length && (
          <div className="text-center py-8">
            <p className="text-zinc-400 dark:text-zinc-600 text-sm mb-3">Nothing scheduled</p>
            <p className="text-xs text-zinc-300 dark:text-zinc-700">Tap + Task or + Appt above to add something</p>
          </div>
        )}

        {selApts.map((apt) => (
          <AppointmentCard key={apt.id} apt={apt} onEdit={handleEditApt} onDelete={(id) => deleteAppointment(id)} />
        ))}
        {selTasks.map((t) => (
          <TaskItem
            key={t.id}
            task={t}
            onToggle={toggleDailyTask}
            onEdit={handleEditTask}
            onDelete={deleteDailyTask}
            onReschedule={handleReschedule}
          />
        ))}
      </div>

      <TaskModal
        open={taskModal}
        onClose={() => { setTaskModal(false); setEditTask(null) }}
        initial={editTask}
        defaultDate={selStr}
        onSave={(form) => {
          if (editTask) updateDailyTask(editTask.id, form)
          else addDailyTask(form)
        }}
      />
      <AppointmentModal
        open={aptModal}
        onClose={() => { setAptModal(false); setEditApt(null) }}
        initial={editApt}
        defaultDate={selStr}
        onSave={(form) => {
          if (editApt) updateAppointment(editApt.id, form)
          else addAppointment(form)
        }}
      />
      <RescheduleModal
        open={reschedModal}
        task={reschedTask}
        onClose={() => { setReschedModal(false); setReschedTask(null) }}
        onReschedule={(id, date) => updateDailyTask(id, { date })}
      />
    </div>
  )
}

// ─── HABITS TAB ───────────────────────────────────────────────────────────────
function HabitsTab() {
  const { habits, habitLogs, logHabit, resetHabitToday, addHabit, updateHabit, deleteHabit, getHabitStreak } = useStore()
  const [addModal,  setAddModal]  = useState(false)
  const [editModal, setEditModal] = useState(null)
  const [form, setForm] = useState({ name: '', emoji: '🎯', target: 1, color: 'blue' })
  const tStr = todayStr()

  const habitsWithState = habits.map((h) => {
    const log   = habitLogs.find((l) => l.habitId === h.id && l.date === tStr)
    const count = log?.count ?? 0
    return { ...h, count, done: count >= h.target, streak: getHabitStreak(h.id) }
  })

  const doneCnt = habitsWithState.filter((h) => h.done).length

  const openEdit = (h) => {
    setEditModal(h)
    setForm({ name: h.name, emoji: h.emoji, target: h.target, color: h.color })
  }

  return (
    <div className="space-y-4">
      {habits.length > 0 && (
        <Card className="p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-semibold text-zinc-700 dark:text-zinc-200">Today — {doneCnt} of {habits.length} done</p>
            <span className="text-sm font-bold text-violet-500">{Math.round((doneCnt / habits.length) * 100)}%</span>
          </div>
          <div className="h-2 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-violet-500 rounded-full transition-all duration-500"
              style={{ width: `${(doneCnt / habits.length) * 100}%` }}
            />
          </div>
        </Card>
      )}

      {habits.length === 0 && <EmptyState icon={Flame} text="Add habits to track your daily routine" />}

      {/* List view with progress rings — inspired by Things 3 / LifeFlow */}
      <div className="space-y-2">
        {habitsWithState.map((h) => {
          const c = HABIT_COLORS[h.color] ?? HABIT_COLORS.blue
          const pct = h.target > 0 ? Math.min(h.count / h.target, 1) : 0
          const r = 18; const circ = 2 * Math.PI * r
          const RING_COLOR = { blue: '#3b82f6', green: '#10b981', cyan: '#06b6d4', purple: '#8b5cf6', amber: '#f59e0b', red: '#f43f5e' }
          const ringColor = RING_COLOR[h.color] ?? '#3b82f6'
          return (
            <div
              key={h.id}
              className={`flex items-center gap-3 px-4 py-3.5 rounded-2xl ring-1 transition-all ${
                h.done
                  ? `${c.card} ${c.ring}`
                  : 'bg-white dark:bg-[#161B27] ring-zinc-200/60 dark:ring-white/[0.07]'
              }`}
            >
              <span className="text-2xl shrink-0">{h.emoji}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-100 leading-tight">{h.name}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <p className={`text-xs font-medium ${h.done ? c.text : 'text-zinc-400'}`}>
                    {h.done ? '✓ Done' : `${h.count} of ${h.target} today`}
                  </p>
                  {h.streak > 0 && (
                    <span className={`text-[10px] font-bold flex items-center gap-0.5 ${c.text}`}>
                      <Flame size={10} />{h.streak}d
                    </span>
                  )}
                </div>
              </div>
              {/* SVG circular progress ring */}
              <button
                onClick={() => logHabit(h.id)}
                aria-label={`Log ${h.name}`}
                disabled={h.done}
                className="shrink-0 relative focus:outline-none focus:ring-2 focus:ring-blue-500/70 rounded-full"
              >
                <svg width={44} height={44} className="-rotate-90">
                  <circle cx={22} cy={22} r={r} fill="none" strokeWidth={3.5}
                    stroke="currentColor" className="text-zinc-100 dark:text-zinc-800" />
                  <circle cx={22} cy={22} r={r} fill="none" strokeWidth={3.5}
                    stroke={ringColor} strokeLinecap="round"
                    strokeDasharray={`${circ * pct} ${circ}`}
                    style={{ transition: 'stroke-dasharray 0.4s ease' }} />
                </svg>
                <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-zinc-600 dark:text-zinc-300">
                  {h.done ? '✓' : h.count}
                </span>
              </button>
              <button
                onClick={() => openEdit(h)}
                aria-label={`Edit ${h.name}`}
                className="p-1.5 text-zinc-300 dark:text-zinc-600 hover:text-blue-400 transition-colors shrink-0 focus:outline-none focus:ring-2 focus:ring-blue-500/70 rounded"
              >
                <Pencil size={13} />
              </button>
            </div>
          )
        })}
      </div>

      <Btn
        size="lg"
        variant="ghost"
        onClick={() => { setForm({ name: '', emoji: '🎯', target: 1, color: 'blue' }); setAddModal(true) }}
      >
        <Plus size={18} /> Add Habit
      </Btn>

      <Modal open={addModal} onClose={() => setAddModal(false)} title="New Habit">
        <HabitForm
          form={form}
          setForm={setForm}
          onSave={() => {
            if (form.name.trim()) {
              addHabit({ ...form, name: form.name.trim() })
              setAddModal(false)
            }
          }}
        />
      </Modal>

      <Modal open={!!editModal} onClose={() => setEditModal(null)} title="Edit Habit">
        {editModal && (
          <div className="space-y-4">
            <HabitForm
              form={form}
              setForm={setForm}
              saveLabel="Save Changes"
              onSave={() => {
                if (form.name.trim()) {
                  updateHabit(editModal.id, { ...form, name: form.name.trim() })
                  setEditModal(null)
                }
              }}
            />
            <Btn variant="ghost" size="lg" onClick={() => { resetHabitToday(editModal.id); setEditModal(null) }}>
              Reset Today
            </Btn>
            <Btn variant="danger" size="lg" onClick={() => { deleteHabit(editModal.id); setEditModal(null) }}>
              <Trash2 size={15} /> Delete Habit
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
      <Input
        label="Habit name"
        value={form.name}
        onChange={(e) => setForm({ ...form, name: e.target.value })}
        placeholder="e.g. Morning walk"
      />
      <div>
        <p className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest mb-2">Emoji</p>
        <div className="flex flex-wrap gap-2">
          {EMOJI_OPTIONS.map((em) => (
            <button
              key={em}
              onClick={() => setForm({ ...form, emoji: em })}
              className={`text-2xl p-1.5 rounded-xl transition-all ${
                form.emoji === em ? 'bg-blue-100 dark:bg-blue-500/20 ring-2 ring-blue-400' : 'hover:bg-zinc-100 dark:hover:bg-zinc-800'
              }`}
            >{em}</button>
          ))}
        </div>
      </div>
      <div>
        <p className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest mb-2">Daily Target</p>
        <div className="flex gap-2 flex-wrap">
          {[1,2,3,4,5,6,7,8].map((n) => (
            <button
              key={n}
              onClick={() => setForm({ ...form, target: n })}
              className={`w-10 h-10 rounded-xl text-sm font-bold transition-all ${
                form.target === n ? 'bg-blue-500 text-white' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300'
              }`}
            >{n}</button>
          ))}
        </div>
      </div>
      <div>
        <p className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest mb-2">Color</p>
        <div className="flex gap-2">
          {COLOR_OPTIONS.map((col) => (
            <button
              key={col}
              onClick={() => setForm({ ...form, color: col })}
              className={`w-8 h-8 rounded-full ${HABIT_COLORS[col].dot} ring-2 ring-offset-2 dark:ring-offset-zinc-900 transition-all ${
                form.color === col ? 'ring-blue-500 scale-110' : 'ring-transparent'
              }`}
              aria-label={`Color: ${col}`}
            />
          ))}
        </div>
      </div>
      <Btn size="lg" onClick={onSave} disabled={!form.name.trim()}>{saveLabel}</Btn>
    </div>
  )
}

// ─── OFFICE / KANBAN TAB ──────────────────────────────────────────────────────
function KanbanTab({ category }) {
  const { tasks, addTask, deleteTask, moveTask, updateTask } = useStore()
  const [addModal,  setAddModal]  = useState(false)
  const [detail,    setDetail]    = useState(null)
  const [editMode,  setEditMode]  = useState(false)
  const [form,      setForm]      = useState({ text: '', priority: 'med', dueDate: '' })
  const [editForm,  setEditForm]  = useState({ text: '', priority: 'med', dueDate: '' })

  const items = tasks.filter((t) => t.category === category)
  const isOverdue = (t) => t.dueDate && t.status !== 'done' && isBefore(startOfDay(parseISO(t.dueDate)), startOfDay(new Date()))

  const openDetail = (t) => {
    setDetail(t)
    setEditForm({ text: t.text, priority: t.priority, dueDate: t.dueDate || '' })
    setEditMode(false)
  }

  const saveEdit = () => {
    if (!editForm.text.trim()) return
    updateTask(detail.id, { text: editForm.text.trim(), priority: editForm.priority, dueDate: editForm.dueDate })
    setDetail((d) => ({ ...d, ...editForm, text: editForm.text.trim() }))
    setEditMode(false)
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
              ))
            }
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
          <Btn
            size="lg"
            disabled={!form.text.trim()}
            onClick={() => {
              if (form.text.trim()) {
                addTask({ ...form, text: form.text.trim(), category })
                setForm({ text: '', priority: 'med', dueDate: '' })
                setAddModal(false)
              }
            }}
          >
            Add Task
          </Btn>
        </div>
      </Modal>

      <Modal open={!!detail} onClose={() => setDetail(null)} title={editMode ? 'Edit Task' : (detail?.text ?? '')}>
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
                  <button
                    key={key}
                    onClick={() => { moveTask(detail.id, key); setDetail((d) => ({ ...d, status: key })) }}
                    className={`py-2.5 rounded-xl text-sm font-semibold transition-colors ${
                      detail.status === key ? 'bg-blue-500 text-white shadow-sm' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
            <Btn variant="ghost" size="lg" onClick={() => setEditMode(true)}><Pencil size={15} /> Edit Task</Btn>
            <Btn variant="danger" size="lg" onClick={() => { deleteTask(detail.id); setDetail(null) }}><Trash2 size={15} /> Delete</Btn>
          </div>
        )}
        {detail && editMode && (
          <div className="space-y-4">
            <Input label="Task" value={editForm.text} onChange={(e) => setEditForm({ ...editForm, text: e.target.value })} />
            <Select label="Priority" value={editForm.priority} onChange={(e) => setEditForm({ ...editForm, priority: e.target.value })}>
              <option value="high">High</option>
              <option value="med">Medium</option>
              <option value="low">Low</option>
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

// ─── PROJECTS TAB ─────────────────────────────────────────────────────────────
function ProjectsTab() {
  const [view, setView] = useState(null)
  const { projects } = useStore()
  const currentProject = projects.find((p) => p.id === view)

  if (view && currentProject) {
    return <ProjectDetail project={currentProject} onBack={() => setView(null)} />
  }
  return <ProjectsList onOpen={(id) => setView(id)} />
}

function ProjectsList({ onOpen }) {
  const { projects, addProject, deleteProject, updateProject, projectTasks } = useStore()
  const [modal,     setModal]     = useState(false)
  const [editModal, setEditModal] = useState(null)
  const [form, setForm] = useState({ name: '', description: '', emoji: '🚀', color: 'blue', status: 'active' })

  const openEdit = (p) => {
    setEditModal(p)
    setForm({ name: p.name, description: p.description || '', emoji: p.emoji, color: p.color, status: p.status })
  }

  const statuses = ['active','paused','completed']

  return (
    <div className="space-y-4">
      <Btn
        size="lg"
        onClick={() => {
          setForm({ name: '', description: '', emoji: '🚀', color: 'blue', status: 'active' })
          setModal(true)
        }}
      >
        <FolderOpen size={18} /> Create Project
      </Btn>

      {projects.length === 0 && <EmptyState icon={FolderOpen} text="Create a project to get started" />}

      {statuses.map((status) => {
        const group = projects.filter((p) => p.status === status)
        if (!group.length) return null
        return (
          <div key={status}>
            <SectionHeader>
              {status === 'active' ? 'Active' : status === 'paused' ? 'Paused' : 'Completed'} · {group.length}
            </SectionHeader>
            {group.map((p) => {
              const total = projectTasks.filter((t) => t.projectId === p.id).length
              const done  = projectTasks.filter((t) => t.projectId === p.id && t.status === 'done').length
              const pct   = total > 0 ? Math.round((done / total) * 100) : 0
              return (
                <Card key={p.id} className="p-4 mb-2 cursor-pointer active:scale-[0.98] transition-transform" onClick={() => onOpen(p.id)}>
                  <div className="flex items-start gap-3">
                    <div className={`w-11 h-11 rounded-2xl ${COLOR_BG[p.color]} flex items-center justify-center shrink-0 shadow-sm`}>
                      <span className="text-xl">{p.emoji}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-zinc-900 dark:text-white">{p.name}</p>
                      {p.description && <p className="text-xs text-zinc-400 mt-0.5 truncate">{p.description}</p>}
                      {total > 0 && (
                        <div className="mt-2">
                          <div className="flex justify-between mb-1">
                            <span className="text-[10px] text-zinc-400">{done}/{total} tasks</span>
                            <span className="text-[10px] font-bold text-zinc-500">{pct}%</span>
                          </div>
                          <div className="h-1 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                            <div className={`h-full ${COLOR_BG[p.color]} rounded-full transition-all`} style={{ width: `${pct}%` }} />
                          </div>
                        </div>
                      )}
                      {total === 0 && <p className="text-xs text-zinc-400 mt-1">No tasks yet</p>}
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <button
                        onClick={(e) => { e.stopPropagation(); openEdit(p) }}
                        aria-label={`Edit ${p.name}`}
                        className="p-1.5 text-zinc-300 hover:text-blue-400 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500/70 rounded"
                      >
                        <Pencil size={13} />
                      </button>
                      <ChevronRight size={15} className="text-zinc-300 dark:text-zinc-600 mt-1" />
                    </div>
                  </div>
                </Card>
              )
            })}
          </div>
        )
      })}

      <Modal open={modal} onClose={() => setModal(false)} title="New Project">
        <ProjectForm
          form={form}
          setForm={setForm}
          showStatus={false}
          onSave={() => {
            if (form.name.trim()) {
              addProject({ ...form, name: form.name.trim() })
              setModal(false)
            }
          }}
        />
      </Modal>

      <Modal open={!!editModal} onClose={() => setEditModal(null)} title="Edit Project">
        {editModal && (
          <div className="space-y-4">
            <ProjectForm
              form={form}
              setForm={setForm}
              showStatus
              saveLabel="Save Changes"
              onSave={() => {
                if (form.name.trim()) {
                  updateProject(editModal.id, { ...form, name: form.name.trim() })
                  setEditModal(null)
                }
              }}
            />
            <Btn variant="danger" size="lg" onClick={() => { deleteProject(editModal.id); setEditModal(null) }}>
              <Trash2 size={15} /> Delete Project
            </Btn>
          </div>
        )}
      </Modal>
    </div>
  )
}

function ProjectForm({ form, setForm, onSave, saveLabel = 'Create Project', showStatus = false }) {
  return (
    <div className="space-y-4">
      <Input
        label="Project name"
        value={form.name}
        onChange={(e) => setForm({ ...form, name: e.target.value })}
        placeholder="e.g. Githa App, Ecogenium"
      />
      <Input
        label="Description (optional)"
        value={form.description}
        onChange={(e) => setForm({ ...form, description: e.target.value })}
        placeholder="What is this project about?"
      />
      <div>
        <p className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest mb-2">Emoji</p>
        <div className="flex flex-wrap gap-2">
          {PROJECT_EMOJIS.map((em) => (
            <button
              key={em}
              onClick={() => setForm({ ...form, emoji: em })}
              className={`text-2xl p-1.5 rounded-xl transition-all ${
                form.emoji === em ? 'bg-blue-100 dark:bg-blue-500/20 ring-2 ring-blue-400' : 'hover:bg-zinc-100 dark:hover:bg-zinc-800'
              }`}
            >{em}</button>
          ))}
        </div>
      </div>
      <div>
        <p className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest mb-2">Color</p>
        <div className="flex gap-2 flex-wrap">
          {PROJECT_COLORS.map((col) => (
            <button
              key={col}
              onClick={() => setForm({ ...form, color: col })}
              className={`w-8 h-8 rounded-full ${COLOR_BG[col]} ring-2 ring-offset-2 dark:ring-offset-zinc-900 transition-all ${
                form.color === col ? 'ring-blue-500 scale-110' : 'ring-transparent'
              }`}
              aria-label={`Color: ${col}`}
            />
          ))}
        </div>
      </div>
      {showStatus && (
        <Select label="Status" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
          <option value="active">Active</option>
          <option value="paused">Paused</option>
          <option value="completed">Completed</option>
        </Select>
      )}
      <Btn size="lg" onClick={onSave} disabled={!form.name.trim()}>{saveLabel}</Btn>
    </div>
  )
}

// ─── Project Detail ────────────────────────────────────────────────────────────
const DETAIL_TABS = [
  { key: 'tasks', label: '✓ Tasks' },
  { key: 'notes', label: '📝 Notes' },
  { key: 'files', label: '📎 Files' },
]

function ProjectDetail({ project, onBack }) {
  const [tab, setTab] = useState('tasks')

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <button
          onClick={onBack}
          aria-label="Back to projects"
          className="p-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 focus:outline-none focus:ring-2 focus:ring-blue-500/70"
        >
          <ArrowLeft size={18} />
        </button>
        <div className={`w-10 h-10 rounded-xl ${COLOR_BG[project.color]} flex items-center justify-center shrink-0`}>
          <span className="text-xl">{project.emoji}</span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-base font-bold text-zinc-900 dark:text-white truncate">{project.name}</p>
          {project.description && <p className="text-xs text-zinc-400 truncate">{project.description}</p>}
        </div>
        <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${COLOR_LIGHT[project.color]}`}>
          {project.status}
        </span>
      </div>

      {/* Detail sub-tabs */}
      <div className="flex bg-zinc-100 dark:bg-zinc-800/80 rounded-2xl p-1 gap-1">
        {DETAIL_TABS.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
              tab === key
                ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white shadow-sm'
                : 'text-zinc-400 dark:text-zinc-500'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === 'tasks' && <ProjectTasksTab projectId={project.id} color={project.color} />}
      {tab === 'notes' && <ProjectNotesTab projectId={project.id} />}
      {tab === 'files' && <ProjectFilesTab projectId={project.id} />}
    </div>
  )
}

function ProjectTasksTab({ projectId, color }) {
  const { projectTasks, addProjectTask, updateProjectTask, deleteProjectTask, moveProjectTask } = useStore()
  const [addModal,  setAddModal]  = useState(false)
  const [detail,    setDetail]    = useState(null)
  const [editMode,  setEditMode]  = useState(false)
  const [form,      setForm]      = useState({ text: '', priority: 'med', dueDate: '' })
  const [editForm,  setEditForm]  = useState({ text: '', priority: 'med', dueDate: '' })

  const items = projectTasks.filter((t) => t.projectId === projectId)
  const isOverdue = (t) => t.dueDate && t.status !== 'done' && isBefore(startOfDay(parseISO(t.dueDate)), startOfDay(new Date()))

  const openDetail = (t) => {
    setDetail(t)
    setEditForm({ text: t.text, priority: t.priority, dueDate: t.dueDate || '' })
    setEditMode(false)
  }

  const saveEdit = () => {
    if (!editForm.text.trim()) return
    updateProjectTask(detail.id, { text: editForm.text.trim(), priority: editForm.priority, dueDate: editForm.dueDate })
    setDetail((d) => ({ ...d, ...editForm, text: editForm.text.trim() }))
    setEditMode(false)
  }

  return (
    <div className="space-y-4">
      <Btn size="lg" onClick={() => setAddModal(true)}><Plus size={18} /> Create Task</Btn>
      {items.length === 0 && <EmptyState icon={CheckCircle2} text="No tasks yet — create one above" />}

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
              ))
            }
          </div>
        )
      })}

      <Modal open={addModal} onClose={() => setAddModal(false)} title="New Task">
        <div className="space-y-4">
          <Input label="Task" value={form.text} onChange={(e) => setForm({ ...form, text: e.target.value })} placeholder="What needs to be done?" />
          <Select label="Priority" value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}>
            <option value="high">High</option>
            <option value="med">Medium</option>
            <option value="low">Low</option>
          </Select>
          <Input label="Due date (optional)" type="date" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} />
          <Btn
            size="lg"
            disabled={!form.text.trim()}
            onClick={() => {
              if (form.text.trim()) {
                addProjectTask({ projectId, ...form, text: form.text.trim() })
                setForm({ text: '', priority: 'med', dueDate: '' })
                setAddModal(false)
              }
            }}
          >
            Create Task
          </Btn>
        </div>
      </Modal>

      <Modal open={!!detail} onClose={() => setDetail(null)} title={editMode ? 'Edit Task' : (detail?.text ?? '')}>
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
                  <button
                    key={key}
                    onClick={() => { moveProjectTask(detail.id, key); setDetail((d) => ({ ...d, status: key })) }}
                    className={`py-2.5 rounded-xl text-sm font-semibold transition-colors ${
                      detail.status === key ? 'bg-blue-500 text-white shadow-sm' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
            <Btn variant="ghost" size="lg" onClick={() => setEditMode(true)}><Pencil size={15} /> Edit Task</Btn>
            <Btn variant="danger" size="lg" onClick={() => { deleteProjectTask(detail.id); setDetail(null) }}><Trash2 size={15} /> Delete</Btn>
          </div>
        )}
        {detail && editMode && (
          <div className="space-y-4">
            <Input label="Task" value={editForm.text} onChange={(e) => setEditForm({ ...editForm, text: e.target.value })} />
            <Select label="Priority" value={editForm.priority} onChange={(e) => setEditForm({ ...editForm, priority: e.target.value })}>
              <option value="high">High</option>
              <option value="med">Medium</option>
              <option value="low">Low</option>
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

function ProjectNotesTab({ projectId }) {
  const { projectNotes, updateProjectNote } = useStore()
  const [text,  setText]  = useState(projectNotes[projectId] || '')
  const [saved, setSaved] = useState(true)
  const timer = useRef(null)

  const handleChange = (val) => {
    setText(val)
    setSaved(false)
    clearTimeout(timer.current)
    timer.current = setTimeout(() => {
      updateProjectNote(projectId, val)
      setSaved(true)
    }, 800)
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs text-zinc-400">Tap to edit · auto-saves</p>
        <span className={`text-xs font-semibold transition-colors ${saved ? 'text-emerald-500' : 'text-zinc-400'}`}>
          {saved ? '✓ Saved' : 'Saving...'}
        </span>
      </div>
      <textarea
        value={text}
        onChange={(e) => handleChange(e.target.value)}
        placeholder={"Write anything here — ideas, meeting notes, links, plans...\n\nThis notepad auto-saves as you type."}
        className="w-full min-h-[60vh] rounded-2xl bg-white dark:bg-[#161B27] ring-1 ring-zinc-200/60 dark:ring-white/[0.06] p-4 text-sm text-zinc-800 dark:text-zinc-100 placeholder:text-zinc-300 dark:placeholder:text-zinc-700 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/70 leading-relaxed"
      />
    </div>
  )
}

function ProjectFilesTab({ projectId }) {
  const { projectFiles, addProjectFile, deleteProjectFile } = useStore()
  const files    = projectFiles.filter((f) => f.projectId === projectId)
  const inputRef = useRef(null)

  const handleUpload = (e) => {
    const file = e.target.files[0]
    if (!file) return
    if (file.size > 3 * 1024 * 1024) {
      alert('File is too large (max 3 MB). For large files, store a link in the Notes tab instead.')
      return
    }
    const reader = new FileReader()
    reader.onload = (ev) => {
      addProjectFile({ projectId, name: file.name, size: file.size, type: file.type, dataUrl: ev.target.result })
    }
    reader.readAsDataURL(file)
    e.target.value = ''
  }

  const download = (f) => {
    const a = document.createElement('a')
    a.href = f.dataUrl
    a.download = f.name
    a.click()
  }

  const fmtSize = (bytes) => {
    if (bytes < 1024)        return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`
  }

  return (
    <div className="space-y-4">
      <Card className="p-4 bg-blue-50 dark:bg-blue-500/10 ring-blue-200/60 dark:ring-blue-500/20">
        <p className="text-xs text-blue-700 dark:text-blue-300 font-medium">
          📎 Upload documents, images, PDFs — max 3 MB per file. Stored on this device only.
        </p>
      </Card>
      <input ref={inputRef} type="file" className="hidden" onChange={handleUpload} />
      <Btn size="lg" onClick={() => inputRef.current?.click()}><Paperclip size={18} /> Upload File</Btn>
      {files.length === 0 && <EmptyState icon={Paperclip} text="No files yet — upload to back up documents" />}
      {files.map((f) => {
        const isImage = f.type?.startsWith('image/')
        return (
          <Card key={f.id} className="flex items-center gap-3 px-4 py-3.5">
            <div className="w-10 h-10 rounded-xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center shrink-0 text-lg">
              {isImage ? '🖼️' : f.type?.includes('pdf') ? '📄' : '📎'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-100 truncate">{f.name}</p>
              <p className="text-xs text-zinc-400">{fmtSize(f.size)} · {f.uploadedAt}</p>
            </div>
            <button
              onClick={() => download(f)}
              aria-label={`Download ${f.name}`}
              className="p-1.5 text-blue-400 hover:text-blue-500 transition-colors text-xs font-bold focus:outline-none focus:ring-2 focus:ring-blue-500/70 rounded"
            >
              ↓
            </button>
            <button
              onClick={() => deleteProjectFile(f.id)}
              aria-label={`Delete ${f.name}`}
              className="p-1.5 text-zinc-300 hover:text-rose-400 transition-colors focus:outline-none focus:ring-2 focus:ring-rose-500/70 rounded"
            >
              <Trash2 size={14} />
            </button>
          </Card>
        )
      })}
    </div>
  )
}

// ─── FAB (Floating Action Button) ────────────────────────────────────────────
function FAB() {
  const { addDailyTask, addAppointment } = useStore()
  const [open, setOpen]       = useState(false)
  const [taskOpen, setTaskOpen]   = useState(false)
  const [aptOpen, setAptOpen]     = useState(false)

  return (
    <>
      {/* Fixed blue circle button above bottom nav */}
      <motion.button
        onClick={() => setOpen(true)}
        whileTap={{ scale: 0.9 }}
        aria-label="Quick add task or appointment"
        className="fixed bottom-[88px] right-4 w-14 h-14 bg-blue-500 rounded-full shadow-xl shadow-blue-500/40 flex items-center justify-center text-white z-40 hover:bg-blue-600 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500/70 focus:ring-offset-2"
      >
        <Plus size={26} strokeWidth={2.5} />
      </motion.button>

      {/* FAB choice sheet */}
      <Modal open={open} onClose={() => setOpen(false)} title="Quick Add">
        <div className="grid grid-cols-2 gap-3 pb-2">
          <button
            onClick={() => { setOpen(false); setTimeout(() => setTaskOpen(true), 150) }}
            className="flex flex-col items-center gap-3 py-6 rounded-2xl bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-500/20 transition-colors active:scale-95 focus:outline-none focus:ring-2 focus:ring-blue-500/70"
          >
            <div className="w-12 h-12 rounded-2xl bg-blue-500 flex items-center justify-center shadow-lg shadow-blue-500/30">
              <Check size={22} className="text-white" strokeWidth={2.5} />
            </div>
            <span className="text-sm font-bold">Task</span>
          </button>
          <button
            onClick={() => { setOpen(false); setTimeout(() => setAptOpen(true), 150) }}
            className="flex flex-col items-center gap-3 py-6 rounded-2xl bg-teal-50 dark:bg-teal-500/10 text-teal-600 dark:text-teal-400 hover:bg-teal-100 dark:hover:bg-teal-500/20 transition-colors active:scale-95 focus:outline-none focus:ring-2 focus:ring-teal-500/70"
          >
            <div className="w-12 h-12 rounded-2xl bg-teal-500 flex items-center justify-center shadow-lg shadow-teal-500/30">
              <Calendar size={22} className="text-white" />
            </div>
            <span className="text-sm font-bold">Appointment</span>
          </button>
        </div>
      </Modal>

      <TaskModal
        open={taskOpen}
        onClose={() => setTaskOpen(false)}
        initial={null}
        onSave={(form) => addDailyTask(form)}
      />
      <AppointmentModal
        open={aptOpen}
        onClose={() => setAptOpen(false)}
        initial={null}
        onSave={(form) => addAppointment(form)}
      />
    </>
  )
}

// ─── Main export ──────────────────────────────────────────────────────────────
export default function Tasks() {
  const [tab, setTab] = useState('today')

  return (
    <div className="space-y-4 min-w-0">
      <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">Tasks</h1>
      <PillTabBar tabs={TOP_TABS} active={tab} onChange={setTab} />

      {tab === 'today'    && <TodayTab />}
      {tab === 'upcoming' && <UpcomingTab />}
      {tab === 'calendar' && <CalendarTab />}
      {tab === 'habits'   && <HabitsTab />}
      {tab === 'office'   && <KanbanTab category="office" />}
      {tab === 'projects' && <ProjectsTab />}

      <FAB />
    </div>
  )
}
