import {
  useState, useRef, useCallback, useEffect, useLayoutEffect, useMemo,
} from 'react'
import {
  Plus, Trash2, Circle, CheckCircle2, ChevronRight, Flame, Pencil, Check, X,
  ArrowLeft, FileText, Paperclip, FolderOpen, ChevronDown, ChevronUp,
  Bell, BellOff, MapPin, Link2, Star, Calendar, Clock, AlertTriangle,
  CalendarDays, Repeat,
} from 'lucide-react'
import {
  format, parseISO, startOfDay, isBefore, isToday, isTomorrow, isYesterday,
  addDays, subDays, startOfMonth, endOfMonth, eachDayOfInterval, getDay,
  isSameDay, isSameMonth, differenceInCalendarDays,
} from 'date-fns'
import { motion, AnimatePresence, useMotionValue } from 'framer-motion'
import { useStore } from '../store'
import Modal from '../components/Modal'
import { Card, Btn, Input, Select, Badge, SectionHeader, EmptyState } from '../components/UI'
import { usePomodoroLauncher } from '../components/PomodoroWidget'

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
const PLAN_TABS = [
  { key: 'today',    label: '📅 Today' },
  { key: 'upcoming', label: '⏭ Next' },
  { key: 'calendar', label: '🗓 Calendar' },
  { key: 'habits',   label: '🔥 Habits' },
]
const WORK_TABS = [
  { key: 'office',   label: '💼 Office' },
  { key: 'projects', label: '🚀 Projects' },
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
  const launchPomodoro = usePomodoroLauncher()
  const updateDailyTask = useStore((s) => s.updateDailyTask)
  const x = useMotionValue(0)

  const toggleChecklistItem = (itemId) => {
    const newChecklist = (task.checklist || []).map((c) => c.id === itemId ? { ...c, done: !c.done } : c)
    updateDailyTask(task.id, { checklist: newChecklist })
  }

  return (
    <div style={{ position: 'relative', overflow: 'hidden', borderRadius: 16, marginBottom: 8 }}>
      {/* Red delete backdrop */}
      <div style={{ position: 'absolute', right: 0, top: 0, bottom: 0, display: 'flex', alignItems: 'center', paddingRight: 16, background: 'var(--danger)', borderRadius: 12, minWidth: 60 }}>
        <Trash2 size={18} style={{ color: 'white' }} />
      </div>
      {/* Draggable card — dragDirectionLock lets vertical scroll pass through */}
      <motion.div
        drag="x"
        dragConstraints={{ left: -120, right: 0 }}
        dragElastic={0.1}
        dragDirectionLock={true}
        style={{ x, position: 'relative', zIndex: 1 }}
        onDragEnd={(_, info) => {
          if (info.offset.x < -80) {
            onDelete(task.id)
          }
        }}
      >
    <div
      className="rounded-2xl transition-all"
      style={{
        background: overdue ? 'rgba(255,100,100,0.07)' : 'var(--surface-3, var(--surface))',
        border: overdue ? '1px solid var(--danger)' : '1px solid var(--border)',
        borderLeft: overdue ? '4px solid var(--danger)' : undefined,
        padding: '14px 16px',
      }}
    >
      {/* Main row */}
      <div className="flex items-center gap-3">
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
        <p style={{
          fontSize: 14, lineHeight: 1.4, margin: 0,
          color: task.done ? 'var(--text-muted, var(--text-3))' : 'var(--text)',
          textDecoration: task.done ? 'line-through' : 'none',
        }}>
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
          {task.notes && !showActions && <span style={{ fontSize: 11, color: 'var(--text-3)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 120 }}>{task.notes}</span>}
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
        <>
          <motion.button
            whileTap={{ scale: 0.85 }}
            onClick={() => launchPomodoro(task.id, task.text)}
            style={{
              fontSize: 16, background: 'none', border: 'none',
              cursor: 'pointer', padding: '2px 4px', opacity: 0.6,
              lineHeight: 1,
            }}
            title="Start Pomodoro"
          >🍅</motion.button>
          <button
            onClick={() => onDelete(task.id)}
            aria-label="Delete task"
            className="p-1 text-zinc-200 dark:text-zinc-700 hover:text-rose-400 transition-colors shrink-0 focus:outline-none focus:ring-2 focus:ring-rose-500/70 rounded"
          >
            <Trash2 size={13} />
          </button>
        </>
      )}
      </div>
      {/* Expanded notes + checklist */}
      {showActions && (task.notes || (task.checklist && task.checklist.length > 0)) && (
        <div style={{ marginTop: 10, paddingTop: 10, borderTop: '1px solid var(--border)' }}>
          {task.notes && (
            <p style={{ fontSize: 13, color: 'var(--text-2)', lineHeight: 1.6, whiteSpace: 'pre-wrap', marginBottom: task.checklist?.length ? 8 : 0 }}>
              {task.notes}
            </p>
          )}
          {task.checklist && task.checklist.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
              {task.checklist.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={(e) => { e.stopPropagation(); toggleChecklistItem(item.id) }}
                  style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'none', border: 'none', padding: 0, cursor: 'pointer', textAlign: 'left', width: '100%' }}
                >
                  <div style={{
                    width: 16, height: 16, borderRadius: 4, flexShrink: 0, border: '1.5px solid var(--border)',
                    background: item.done ? 'var(--accent)' : 'transparent',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    {item.done && <Check size={10} style={{ color: '#fff' }} strokeWidth={3} />}
                  </div>
                  <span style={{ fontSize: 13, color: item.done ? 'var(--text-3)' : 'var(--text)', textDecoration: item.done ? 'line-through' : 'none' }}>
                    {item.text}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
      </motion.div>
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
  const blank = { text: '', notes: '', date: defaultDate || today, dueTime: '', priority: 'med', done: false, checklist: [] }
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
        {/* Checklist */}
        <div className="flex flex-col gap-2">
          <p className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest">Checklist (optional)</p>
          {(form.checklist || []).map((item, idx) => (
            <div key={item.id} className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  const updated = form.checklist.map((c, i) => i === idx ? { ...c, done: !c.done } : c)
                  setForm((prev) => ({ ...prev, checklist: updated }))
                }}
                style={{
                  width: 18, height: 18, borderRadius: 5, flexShrink: 0, border: '1.5px solid var(--border)',
                  background: item.done ? 'var(--accent)' : 'var(--surface)', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
              >
                {item.done && <Check size={11} style={{ color: '#fff' }} strokeWidth={3} />}
              </button>
              <input
                value={item.text}
                onChange={(e) => {
                  const updated = form.checklist.map((c, i) => i === idx ? { ...c, text: e.target.value } : c)
                  setForm((prev) => ({ ...prev, checklist: updated }))
                }}
                placeholder="List item..."
                style={{
                  flex: 1, fontSize: 13, background: 'var(--surface-3, var(--surface))',
                  border: '1px solid var(--border)', borderRadius: 10, padding: '7px 12px',
                  outline: 'none',
                  textDecoration: item.done ? 'line-through' : 'none',
                  color: item.done ? 'var(--text-3)' : 'var(--text)',
                }}
              />
              <button
                type="button"
                onClick={() => setForm((prev) => ({ ...prev, checklist: prev.checklist.filter((_, i) => i !== idx) }))}
                style={{ padding: 4, color: 'var(--text-3)', background: 'none', border: 'none', cursor: 'pointer' }}
              >
                <X size={13} />
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={() => setForm((prev) => ({ ...prev, checklist: [...(prev.checklist || []), { id: crypto.randomUUID(), text: '', done: false }] }))}
            style={{
              display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 600,
              color: 'var(--accent)', background: 'none', border: '1.5px dashed var(--border)',
              borderRadius: 10, padding: '8px 12px', cursor: 'pointer', width: '100%',
            }}
          >
            <Plus size={13} /> Add item
          </button>
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

// ─── RECURRING SECTION ───────────────────────────────────────────────────────
const DAYS_SHORT = ['Su','Mo','Tu','We','Th','Fr','Sa']

function RecurringSection() {
  const { recurringTasks, addRecurringTask, updateRecurringTask, deleteRecurringTask } = useStore()
  const [open, setOpen] = useState(false)
  const [showAdd, setShowAdd] = useState(false)
  const [editId, setEditId] = useState(null)
  const [form, setForm] = useState({ text:'', recurrence:'daily', daysOfWeek:[1,2,3,4,5], dayOfMonth:1, priority:'med', dueTime:'', notes:'' })

  const resetForm = () => setForm({ text:'', recurrence:'daily', daysOfWeek:[1,2,3,4,5], dayOfMonth:1, priority:'med', dueTime:'', notes:'' })

  const handleSave = () => {
    if (!form.text.trim()) return
    if (editId) {
      updateRecurringTask(editId, form)
      setEditId(null)
    } else {
      addRecurringTask(form)
    }
    resetForm()
    setShowAdd(false)
  }

  const handleEdit = (r) => {
    setForm({ text: r.text, recurrence: r.recurrence, daysOfWeek: r.daysOfWeek || [1,2,3,4,5], dayOfMonth: r.dayOfMonth || 1, priority: r.priority, dueTime: r.dueTime || '', notes: r.notes || '' })
    setEditId(r.id)
    setShowAdd(true)
  }

  const toggleDay = (d) => {
    setForm((f) => ({
      ...f,
      daysOfWeek: f.daysOfWeek.includes(d) ? f.daysOfWeek.filter((x) => x !== d) : [...f.daysOfWeek, d],
    }))
  }

  const recurrenceLabel = (r) => {
    if (r.recurrence === 'daily') return 'Every day'
    if (r.recurrence === 'weekly') {
      const days = (r.daysOfWeek || []).sort().map((d) => DAYS_SHORT[d]).join(', ')
      return `Weekly: ${days || 'no days'}`
    }
    return `Monthly on day ${r.dayOfMonth}`
  }

  return (
    <div style={{ marginBottom: 16 }}>
      {/* Header toggle */}
      <motion.button
        onClick={() => setOpen((v) => !v)}
        style={{ display:'flex', alignItems:'center', gap:8, width:'100%', background:'none', border:'none', cursor:'pointer', padding:'8px 0', color:'var(--text-muted)' }}
        whileTap={{ scale: 0.97 }}
      >
        <Repeat size={14} />
        <span style={{ fontSize:12, fontWeight:600, letterSpacing:'0.06em', textTransform:'uppercase' }}>
          Recurring ({recurringTasks.filter(r=>r.active).length})
        </span>
        <motion.span animate={{ rotate: open ? 180 : 0 }} style={{ marginLeft:'auto' }}>
          <ChevronDown size={14} />
        </motion.span>
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            style={{ overflow: 'hidden' }}
          >
            {/* Recurring task list */}
            {recurringTasks.map((r) => (
              <motion.div key={r.id} layout
                style={{ display:'flex', alignItems:'center', gap:8, padding:'8px 10px', marginBottom:6, borderRadius:10, background:'var(--surface)', border:'1px solid var(--border)' }}
              >
                <Repeat size={13} style={{ color:'var(--accent)', flexShrink:0 }} />
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontSize:13, fontWeight:600, color:'var(--text)', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{r.text}</div>
                  <div style={{ fontSize:11, color:'var(--text-muted)', marginTop:1 }}>{recurrenceLabel(r)}</div>
                </div>
                <motion.button whileTap={{scale:0.9}} onClick={() => handleEdit(r)}
                  style={{ background:'none', border:'none', cursor:'pointer', padding:4, color:'var(--text-muted)' }}>
                  <Pencil size={13} />
                </motion.button>
                <motion.button whileTap={{scale:0.9}} onClick={() => deleteRecurringTask(r.id)}
                  style={{ background:'none', border:'none', cursor:'pointer', padding:4, color:'var(--danger)' }}>
                  <Trash2 size={13} />
                </motion.button>
              </motion.div>
            ))}

            {/* Add form toggle */}
            {!showAdd ? (
              <motion.button
                onClick={() => { setShowAdd(true); setEditId(null); resetForm() }}
                style={{ display:'flex', alignItems:'center', gap:6, padding:'6px 10px', borderRadius:10, background:'none', border:'1px dashed var(--border)', cursor:'pointer', color:'var(--accent)', fontSize:12, fontWeight:600, width:'100%', marginTop:4 }}
                whileTap={{ scale: 0.97 }}
              >
                <Plus size={13} /> Add recurring task
              </motion.button>
            ) : (
              <motion.div
                initial={{ opacity:0, y:6 }} animate={{ opacity:1, y:0 }}
                style={{ padding:12, borderRadius:12, background:'var(--surface)', border:'1px solid var(--accent)', marginTop:6 }}
              >
                <input value={form.text} onChange={(e) => setForm((f) => ({...f, text:e.target.value}))}
                  placeholder="Task name…"
                  style={{ width:'100%', background:'var(--input-bg, var(--surface))', border:'1px solid var(--border)', borderRadius:8, padding:'8px 10px', fontSize:14, color:'var(--text)', outline:'none', marginBottom:8, boxSizing:'border-box' }}
                />

                {/* Recurrence type */}
                <div style={{ display:'flex', gap:6, marginBottom:8 }}>
                  {['daily','weekly','monthly'].map((rec) => (
                    <motion.button key={rec} whileTap={{scale:0.95}}
                      onClick={() => setForm((f) => ({...f, recurrence:rec}))}
                      style={{ flex:1, padding:'5px 0', borderRadius:8, border:'1px solid var(--border)', background: form.recurrence===rec ? 'var(--accent)' : 'var(--surface)', color: form.recurrence===rec ? 'white' : 'var(--text-muted)', fontSize:11, fontWeight:600, cursor:'pointer', textTransform:'capitalize' }}
                    >{rec}</motion.button>
                  ))}
                </div>

                {/* Day-of-week picker for weekly */}
                {form.recurrence === 'weekly' && (
                  <div style={{ display:'flex', gap:4, marginBottom:8 }}>
                    {DAYS_SHORT.map((label, idx) => (
                      <motion.button key={idx} whileTap={{scale:0.9}}
                        onClick={() => toggleDay(idx)}
                        style={{ flex:1, height:32, borderRadius:8, border:'1px solid var(--border)', background: form.daysOfWeek.includes(idx) ? 'var(--accent)' : 'var(--surface)', color: form.daysOfWeek.includes(idx) ? 'white' : 'var(--text-muted)', fontSize:11, fontWeight:700, cursor:'pointer' }}
                      >{label}</motion.button>
                    ))}
                  </div>
                )}

                {/* Day of month for monthly */}
                {form.recurrence === 'monthly' && (
                  <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:8 }}>
                    <span style={{ fontSize:12, color:'var(--text-muted)' }}>Day of month:</span>
                    <input type="number" min={1} max={31} value={form.dayOfMonth}
                      onChange={(e) => setForm((f) => ({...f, dayOfMonth: parseInt(e.target.value)||1}))}
                      style={{ width:60, padding:'5px 8px', borderRadius:8, border:'1px solid var(--border)', background:'var(--surface)', color:'var(--text)', fontSize:13, outline:'none' }}
                    />
                  </div>
                )}

                {/* Priority */}
                <div style={{ display:'flex', gap:6, marginBottom:8 }}>
                  {['high','med','low'].map((p) => (
                    <motion.button key={p} whileTap={{scale:0.95}}
                      onClick={() => setForm((f) => ({...f, priority:p}))}
                      style={{ flex:1, padding:'5px 0', borderRadius:8, border:'1px solid var(--border)', background: form.priority===p ? 'var(--accent)' : 'var(--surface)', color: form.priority===p ? 'white' : 'var(--text-muted)', fontSize:11, fontWeight:600, cursor:'pointer', textTransform:'capitalize' }}
                    >{p}</motion.button>
                  ))}
                </div>

                {/* Time */}
                <input type="time" value={form.dueTime}
                  onChange={(e) => setForm((f) => ({...f, dueTime:e.target.value}))}
                  style={{ width:'100%', padding:'6px 10px', borderRadius:8, border:'1px solid var(--border)', background:'var(--surface)', color:'var(--text)', fontSize:13, outline:'none', marginBottom:8, boxSizing:'border-box' }}
                />

                {/* Actions */}
                <div style={{ display:'flex', gap:8 }}>
                  <motion.button whileTap={{scale:0.95}} onClick={handleSave}
                    style={{ flex:1, padding:'8px 0', borderRadius:10, background:'var(--accent)', color:'white', border:'none', fontSize:13, fontWeight:700, cursor:'pointer' }}
                  >{editId ? 'Save' : 'Add'}</motion.button>
                  <motion.button whileTap={{scale:0.95}} onClick={() => { setShowAdd(false); setEditId(null); resetForm() }}
                    style={{ padding:'8px 16px', borderRadius:10, background:'var(--surface)', color:'var(--text-muted)', border:'1px solid var(--border)', fontSize:13, cursor:'pointer' }}
                  >Cancel</motion.button>
                </div>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ─── TODAY TAB ────────────────────────────────────────────────────────────────
function TodayTab() {
  const {
    dailyTasks, addDailyTask, updateDailyTask, toggleDailyTask, deleteDailyTask,
    appointments, addAppointment, updateAppointment, deleteAppointment,
    generateDueTasks,
  } = useStore()

  useEffect(() => {
    generateDueTasks()
  }, [])

  const { permission, requestPermission } = useReminders(appointments)

  const [overdueOpen,  setOverdueOpen]  = useState(true)
  const [taskModal,    setTaskModal]    = useState(false)
  const [editTask,     setEditTask]     = useState(null)
  const [aptModal,     setAptModal]     = useState(false)
  const [editApt,      setEditApt]      = useState(null)
  const [reschedModal, setReschedModal] = useState(false)
  const [reschedTask,  setReschedTask]  = useState(null)
  const [selectedDate, setSelectedDate] = useState(new Date())

  const today          = new Date()
  const tStr           = format(selectedDate, 'yyyy-MM-dd')
  const isViewingToday = isToday(selectedDate)

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

  const isEmpty = !(isViewingToday && overdueTasks.length) && !todayApts.length && !todayTasks.length

  return (
    <div className="space-y-4">
      {/* Date header with day navigation */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <motion.button
          whileTap={{ scale: 0.88 }}
          onClick={() => setSelectedDate(d => subDays(d, 1))}
          aria-label="Previous day"
          style={{
            width: 36, height: 36, borderRadius: '50%',
            background: 'var(--surface)', border: '1px solid var(--border)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', color: 'var(--text-2)', flexShrink: 0,
          }}
        >
          <ChevronDown size={16} style={{ transform: 'rotate(90deg)' }} />
        </motion.button>

        <div style={{ flex: 1, textAlign: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
            <p style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text)', lineHeight: 1.1 }}>
              {isViewingToday ? 'Today' : isTomorrow(selectedDate) ? 'Tomorrow' : isYesterday(selectedDate) ? 'Yesterday' : format(selectedDate, 'EEEE')}
            </p>
            {!isViewingToday && (
              <button
                onClick={() => setSelectedDate(new Date())}
                style={{
                  fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 99,
                  background: 'var(--accent-soft, rgba(59,158,255,0.15))',
                  color: 'var(--accent)', border: 'none', cursor: 'pointer',
                }}
              >
                Today
              </button>
            )}
          </div>
          <p style={{ fontSize: '0.8125rem', color: 'var(--text-3)', marginTop: 2 }}>
            {format(selectedDate, 'MMMM d, yyyy')}
          </p>
        </div>

        <motion.button
          whileTap={{ scale: 0.88 }}
          onClick={() => setSelectedDate(d => addDays(d, 1))}
          aria-label="Next day"
          style={{
            width: 36, height: 36, borderRadius: '50%',
            background: 'var(--surface)', border: '1px solid var(--border)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', color: 'var(--text-2)', flexShrink: 0,
          }}
        >
          <ChevronDown size={16} style={{ transform: 'rotate(-90deg)' }} />
        </motion.button>

        <button
          onClick={requestPermission}
          aria-label={permission === 'granted' ? 'Notifications enabled' : 'Enable notifications'}
          style={{
            width: 36, height: 36, borderRadius: 10, border: 'none', cursor: 'pointer',
            background: permission === 'granted' ? 'rgba(20,184,166,0.15)' : 'var(--surface)',
            color: permission === 'granted' ? '#14B8A6' : 'var(--text-3)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}
        >
          {permission === 'granted' ? <Bell size={18} /> : <BellOff size={18} />}
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

      {/* Overdue section — only visible when viewing today */}
      {isViewingToday && overdueTasks.length > 0 && (
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

      {/* Recurring tasks section */}
      <RecurringSection />

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
          + {isViewingToday ? 'Task for today' : `Task for ${format(selectedDate, 'MMM d')}`}
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
        defaultDate={editTask ? undefined : tStr}
        onSave={handleSaveTask}
      />

      {/* Appointment modal */}
      <AppointmentModal
        open={aptModal}
        onClose={() => { setAptModal(false); setEditApt(null) }}
        initial={editApt}
        defaultDate={editApt ? undefined : tStr}
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

  // Enhanced dot color logic: green=all done, yellow=partial, red=has overdue
  const taskStatusMap = useMemo(() => {
    const map = {}
    dailyTasks.forEach((t) => {
      if (!map[t.date]) map[t.date] = { total: 0, done: 0, overdue: 0 }
      map[t.date].total++
      if (t.done) map[t.date].done++
      if (isOverdueTask(t)) map[t.date].overdue++
    })
    return map
  }, [dailyTasks])

  const monthKey = format(cursor, 'yyyy-MM')

  return (
    <div className="space-y-4">
      {/* Month nav — large month name */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '4px 0' }}>
        <motion.button
          whileTap={{ scale: 0.88 }}
          onClick={prevMonth}
          aria-label="Previous month"
          style={{
            width: 38, height: 38,
            borderRadius: '50%',
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer',
            color: 'var(--text-2)',
          }}
        >
          <ChevronDown size={18} style={{ transform: 'rotate(90deg)' }} />
        </motion.button>

        <div style={{ textAlign: 'center' }}>
          <p style={{ fontSize: 22, fontWeight: 800, color: 'var(--text)', lineHeight: 1.1, letterSpacing: '-0.5px' }}>
            {format(cursor, 'MMMM')}
          </p>
          <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-3)', marginTop: 1 }}>
            {format(cursor, 'yyyy')}
          </p>
        </div>

        <motion.button
          whileTap={{ scale: 0.88 }}
          onClick={nextMonth}
          aria-label="Next month"
          style={{
            width: 38, height: 38,
            borderRadius: '50%',
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer',
            color: 'var(--text-2)',
          }}
        >
          <ChevronDown size={18} style={{ transform: 'rotate(-90deg)' }} />
        </motion.button>
      </div>

      {/* Weekday headers */}
      <div className="grid grid-cols-7 gap-0">
        {WEEKDAY_LABELS.map((l, i) => (
          <div key={i} style={{ textAlign: 'center', fontSize: 11, fontWeight: 700, color: 'var(--text-3)', paddingTop: 4, paddingBottom: 4 }}>{l}</div>
        ))}
      </div>

      {/* Calendar grid with smooth month transition */}
      <AnimatePresence mode="wait">
        <motion.div
          key={monthKey}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.18, ease: 'easeOut' }}
          className="grid grid-cols-7 gap-0"
        >
          {Array.from({ length: startOffset }).map((_, i) => <div key={`pad-${i}`} />)}
          {days.map((day) => {
            const dStr     = format(day, 'yyyy-MM-dd')
            const isToday_ = isToday(day)
            const isSel    = isSameDay(day, selected)
            const dots     = dotsMap[dStr]
            const status   = taskStatusMap[dStr]

            // Task dot color: green=all done, amber=partial, red=has overdue
            let taskDotColor = 'var(--accent)'
            if (status) {
              if (status.overdue > 0) taskDotColor = 'var(--danger)'
              else if (status.done === status.total) taskDotColor = 'var(--success)'
              else taskDotColor = '#F59E0B'
            }

            const cellStyle = {
              width: 36, height: 36,
              borderRadius: '50%',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: isSel ? 'var(--accent)' : isToday_ ? 'var(--accent-soft)' : 'transparent',
              color: isSel ? 'white' : isToday_ ? 'var(--accent)' : 'var(--text)',
              fontWeight: isToday_ || isSel ? 700 : 400,
              cursor: 'pointer',
              transition: 'all 0.15s ease',
              boxShadow: isSel ? '0 2px 10px color-mix(in srgb, var(--accent) 40%, transparent)' : 'none',
              outline: isToday_ && !isSel ? '2px solid var(--accent)' : 'none',
              outlineOffset: -2,
              margin: '0 auto',
            }

            return (
              <button
                key={dStr}
                onClick={() => setSelected(day)}
                aria-label={format(day, 'MMMM d, yyyy')}
                style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center',
                  paddingTop: 4, paddingBottom: 4, background: 'none', border: 'none',
                  cursor: 'pointer',
                  borderRadius: 12,
                  transition: 'background 0.12s ease',
                }}
              >
                <div style={cellStyle}>
                  <span style={{ fontSize: 13, lineHeight: 1 }}>
                    {format(day, 'd')}
                  </span>
                </div>

                {/* Task count badge: done/total format */}
                {dots && dots.tasks > 0 && (
                  <div style={{
                    marginTop: 2,
                    fontSize: 8,
                    fontWeight: 700,
                    lineHeight: 1,
                    paddingInline: 3,
                    paddingBlock: 1.5,
                    borderRadius: 99,
                    background: isSel ? 'rgba(255,255,255,0.25)' : taskDotColor,
                    color: 'white',
                    minWidth: 16,
                    textAlign: 'center',
                    letterSpacing: '-0.2px',
                  }}>
                    {status?.done ?? 0}/{status?.total ?? dots.tasks}
                  </div>
                )}

                {/* Appointment count pill */}
                {dots && dots.apts > 0 && (
                  <div style={{
                    marginTop: dots.tasks > 0 ? 1 : 2,
                    fontSize: 8,
                    fontWeight: 700,
                    lineHeight: 1,
                    paddingInline: 3,
                    paddingBlock: 1.5,
                    borderRadius: 99,
                    background: isSel ? 'rgba(255,255,255,0.2)' : 'rgba(20,184,166,0.25)',
                    color: isSel ? 'white' : '#0D9488',
                    minWidth: 16,
                    textAlign: 'center',
                  }}>
                    {dots.apts} apt
                  </div>
                )}
              </button>
            )
          })}
        </motion.div>
      </AnimatePresence>

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
          <div className="space-y-3 pt-2 pb-4">
            <p className="text-center text-sm text-zinc-400 dark:text-zinc-500 mb-1">
              Nothing on {isToday(selected) ? 'today' : format(selected, 'MMM d')} — add something:
            </p>
            <button
              onClick={() => { setEditTask(null); setTaskModal(true) }}
              className="w-full flex items-center gap-3 p-4 rounded-2xl bg-blue-50 dark:bg-blue-500/10 border border-blue-200/50 dark:border-blue-500/20 text-left active:scale-[0.98] transition-all"
            >
              <div className="w-10 h-10 rounded-xl bg-blue-500 flex items-center justify-center shrink-0 shadow-md shadow-blue-500/30">
                <Plus size={20} className="text-white" strokeWidth={2.5} />
              </div>
              <div>
                <p className="text-sm font-bold text-blue-700 dark:text-blue-300">Add Task</p>
                <p className="text-xs text-blue-500/70 dark:text-blue-400/60">for {isToday(selected) ? 'today' : format(selected, 'EEE, MMM d')}</p>
              </div>
            </button>
            <button
              onClick={() => { setEditApt(null); setAptModal(true) }}
              className="w-full flex items-center gap-3 p-4 rounded-2xl bg-teal-50 dark:bg-teal-500/10 border border-teal-200/50 dark:border-teal-500/20 text-left active:scale-[0.98] transition-all"
            >
              <div className="w-10 h-10 rounded-xl bg-teal-500 flex items-center justify-center shrink-0 shadow-md shadow-teal-500/30">
                <Calendar size={18} className="text-white" />
              </div>
              <div>
                <p className="text-sm font-bold text-teal-700 dark:text-teal-300">Add Appointment</p>
                <p className="text-xs text-teal-500/70 dark:text-teal-400/60">for {isToday(selected) ? 'today' : format(selected, 'EEE, MMM d')}</p>
              </div>
            </button>
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

// ─── HABIT ANALYTICS ──────────────────────────────────────────────────────────
function HabitAnalytics({ habits, habitLogs }) {
  const [expanded, setExpanded] = useState(false)

  const today = new Date()
  const last7 = eachDayOfInterval({ start: subDays(today, 6), end: today })
  const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

  // Weekly efficiency: for each of last 7 days, ratio of completed habits
  const weeklyEfficiency = last7.map((day) => {
    const dateStr = format(day, 'yyyy-MM-dd')
    if (habits.length === 0) return { day, dateStr, ratio: 0 }
    let done = 0
    habits.forEach((h) => {
      const log = habitLogs.find((l) => l.habitId === h.id && l.date === dateStr)
      if (log && log.count >= h.target) done++
    })
    return { day, dateStr, ratio: habits.length > 0 ? done / habits.length : 0 }
  })

  // Per-habit stats
  const habitStats = habits.map((h) => {
    // Streak: consecutive days (excluding today) meeting target
    let streak = 0
    let d = subDays(today, 1)
    while (streak < 365) {
      const dateStr = format(d, 'yyyy-MM-dd')
      const log = habitLogs.find((l) => l.habitId === h.id && l.date === dateStr)
      if (log && log.count >= h.target) { streak++; d = subDays(d, 1) } else break
    }

    // Last 7 days dots
    const dots = last7.map((day) => {
      const dateStr = format(day, 'yyyy-MM-dd')
      const log = habitLogs.find((l) => l.habitId === h.id && l.date === dateStr)
      return !!(log && log.count >= h.target)
    })

    // Completion % over last 14 days
    const last14 = eachDayOfInterval({ start: subDays(today, 13), end: today })
    let completed14 = 0
    last14.forEach((day) => {
      const dateStr = format(day, 'yyyy-MM-dd')
      const log = habitLogs.find((l) => l.habitId === h.id && l.date === dateStr)
      if (log && log.count >= h.target) completed14++
    })
    const pct14 = Math.round((completed14 / 14) * 100)

    return { ...h, streak, dots, pct14 }
  })

  const squareColor = (ratio) => {
    if (ratio === 0) return 'var(--surface-2, rgba(120,120,120,0.15))'
    if (ratio < 0.5) return 'var(--danger, #f43f5e)'
    if (ratio < 1)   return 'var(--gold, #f5b342)'
    return 'var(--success, #10b981)'
  }

  if (habits.length === 0) return null

  return (
    <div style={{
      background: 'var(--surface)',
      border: '1px solid var(--border, rgba(120,120,120,0.15))',
      borderRadius: 'var(--card-radius, 16px)',
      overflow: 'hidden',
      marginBottom: 8,
    }}>
      {/* Collapsible header */}
      <button
        onClick={() => setExpanded((v) => !v)}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '12px 16px',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          color: 'var(--text)',
        }}
        aria-expanded={expanded}
        aria-label="Toggle habit analytics"
      >
        <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-2)' }}>
          📊 Habit Analytics
        </span>
        <span style={{ color: 'var(--text-3)', fontSize: 13 }}>
          {expanded ? '▲' : '▼'}
        </span>
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            style={{ overflow: 'hidden' }}
          >
            <div style={{ padding: '0 16px 16px' }}>
              {/* Section: Weekly Efficiency Bar */}
              <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>
                Weekly Efficiency
              </p>
              <div style={{ display: 'flex', gap: 6, marginBottom: 16 }}>
                {weeklyEfficiency.map(({ day, dateStr, ratio }, i) => (
                  <div key={dateStr} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                    <div
                      title={`${format(day, 'EEE MMM d')}: ${Math.round(ratio * 100)}%`}
                      style={{
                        width: '100%',
                        aspectRatio: '1',
                        borderRadius: 6,
                        background: squareColor(ratio),
                        transition: 'background 0.3s ease',
                      }}
                    />
                    <span style={{ fontSize: 9, color: 'var(--text-3)', fontWeight: 600 }}>
                      {DAY_LABELS[getDay(day) === 0 ? 6 : getDay(day) - 1]}
                    </span>
                  </div>
                ))}
              </div>

              {/* Section: Per-habit breakdown */}
              <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>
                Per Habit · Last 7 Days
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {habitStats.map((h) => (
                  <div key={h.id} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    {/* Emoji + name */}
                    <span style={{ fontSize: 18, flexShrink: 0 }}>{h.emoji}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                        <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 90 }}>
                          {h.name}
                        </span>
                        {h.streak > 0 && (
                          <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--gold, #f5b342)', display: 'flex', alignItems: 'center', gap: 2, flexShrink: 0 }}>
                            🔥{h.streak}d
                          </span>
                        )}
                        {h.pct14 < 30 && (
                          <span style={{ fontSize: 9, fontWeight: 700, color: 'var(--gold, #f5b342)', background: 'rgba(245,179,66,0.12)', borderRadius: 99, padding: '1px 6px', flexShrink: 0 }}>
                            Consider adjusting
                          </span>
                        )}
                      </div>
                      {/* 7-day mini dots */}
                      <div style={{ display: 'flex', gap: 3, alignItems: 'center' }}>
                        {h.dots.map((done, i) => (
                          <div
                            key={i}
                            title={format(last7[i], 'EEE MMM d')}
                            style={{
                              width: 8, height: 8, borderRadius: '50%',
                              background: done ? 'var(--success, #10b981)' : 'var(--surface-2, rgba(120,120,120,0.2))',
                              border: done ? 'none' : '1.5px solid var(--border, rgba(120,120,120,0.25))',
                              transition: 'background 0.2s',
                            }}
                          />
                        ))}
                      </div>
                    </div>
                    {/* 14-day completion % */}
                    <span style={{
                      fontSize: 11,
                      fontWeight: 700,
                      flexShrink: 0,
                      color: h.pct14 >= 70 ? 'var(--success, #10b981)' : h.pct14 >= 30 ? 'var(--gold, #f5b342)' : 'var(--danger, #f43f5e)',
                    }}>
                      {h.pct14}%
                    </span>
                  </div>
                ))}
              </div>

              {/* Legend */}
              <div style={{ display: 'flex', gap: 12, marginTop: 14, flexWrap: 'wrap' }}>
                {[
                  { color: 'var(--success, #10b981)', label: '100%' },
                  { color: 'var(--gold, #f5b342)',    label: '50–99%' },
                  { color: 'var(--danger, #f43f5e)',  label: '1–49%' },
                  { color: 'var(--surface-2, rgba(120,120,120,0.2))', label: '0%', border: '1px solid var(--border)' },
                ].map(({ color, label, border }) => (
                  <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <div style={{ width: 10, height: 10, borderRadius: 3, background: color, border: border || 'none' }} />
                    <span style={{ fontSize: 10, color: 'var(--text-3)' }}>{label}</span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
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
      <HabitAnalytics habits={habits} habitLogs={habitLogs} />

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

// ─── MATRIX VIEW ──────────────────────────────────────────────────────────────
function MatrixView({ tasks, onMoveTask }) {
  const quadrants = [
    { key: 'q1', label: 'Do First',   sublabel: 'Urgent + Important',         color: 'var(--danger, #f43f5e)',  bg: 'var(--warm-soft, rgba(255,107,107,0.08))' },
    { key: 'q2', label: 'Schedule',   sublabel: 'Not Urgent + Important',      color: 'var(--accent, #3b82f6)', bg: 'var(--accent-soft, rgba(59,130,246,0.08))' },
    { key: 'q3', label: 'Delegate',   sublabel: 'Urgent + Not Important',      color: 'var(--gold, #f5b342)',   bg: 'var(--gold-soft, rgba(245,179,66,0.08))' },
    { key: 'q4', label: 'Eliminate',  sublabel: 'Not Urgent + Not Important',  color: 'var(--text-3)',          bg: 'var(--surface-2, rgba(120,120,120,0.08))' },
  ]

  const today = new Date()
  const in3Days = addDays(today, 3)

  const getQuadrant = (task) => {
    const isHighPriority = task.priority === 'high'
    const hasDue  = !!task.dueDate
    const isUrgent = hasDue && isBefore(parseISO(task.dueDate), in3Days)
    if (isHighPriority && isUrgent)  return 'q1'
    if (isHighPriority && !isUrgent) return 'q2'
    if (!isHighPriority && isUrgent) return 'q3'
    return 'q4'
  }

  const tasksByQ = { q1: [], q2: [], q3: [], q4: [] }
  tasks.filter((t) => t.status !== 'done').forEach((t) => {
    tasksByQ[getQuadrant(t)].push(t)
  })

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 12 }}>
      {quadrants.map((q) => (
        <div key={q.key} style={{
          background: q.bg,
          border: `1px solid ${q.color}33`,
          borderRadius: 'var(--card-radius, 16px)',
          padding: 12,
          minHeight: 140,
        }}>
          <div style={{ borderBottom: `2px solid ${q.color}`, paddingBottom: 6, marginBottom: 10 }}>
            <p style={{ color: q.color, fontSize: 12, fontWeight: 800 }}>{q.label}</p>
            <p style={{ color: 'var(--text-3)', fontSize: 10 }}>{q.sublabel}</p>
          </div>
          {tasksByQ[q.key].length === 0 ? (
            <p style={{ color: 'var(--text-3)', fontSize: 11, textAlign: 'center', marginTop: 20 }}>Empty</p>
          ) : (
            tasksByQ[q.key].map((task) => (
              <motion.div
                key={task.id}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                style={{
                  background: 'var(--surface)',
                  borderRadius: 8,
                  padding: '6px 10px',
                  marginBottom: 6,
                  fontSize: 12,
                  color: 'var(--text)',
                }}
              >
                {task.text || task.title || 'Untitled'}
              </motion.div>
            ))
          )}
        </div>
      ))}
    </div>
  )
}

// ─── OFFICE / KANBAN TAB ──────────────────────────────────────────────────────
// ─── Shared: Checklist editor + display ───────────────────────────────────────
function ChecklistEditor({ items, onChange }) {
  const list = items || []
  const update = (idx, patch) => onChange(list.map((c, i) => i === idx ? { ...c, ...patch } : c))
  const remove = (idx) => onChange(list.filter((_, i) => i !== idx))
  const add = () => onChange([...list, { id: crypto.randomUUID(), text: '', done: false }])
  return (
    <div className="flex flex-col gap-2">
      <p className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest">Checklist (optional)</p>
      {list.map((item, idx) => (
        <div key={item.id} className="flex items-center gap-2">
          <button type="button" onClick={() => update(idx, { done: !item.done })}
            style={{ width: 18, height: 18, borderRadius: 5, flexShrink: 0, border: '1.5px solid var(--border)',
              background: item.done ? 'var(--accent)' : 'var(--surface)', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {item.done && <Check size={11} style={{ color: '#fff' }} strokeWidth={3} />}
          </button>
          <input value={item.text} onChange={(e) => update(idx, { text: e.target.value })} placeholder="List item..."
            style={{ flex: 1, fontSize: 13, background: 'var(--surface-3, var(--surface))',
              border: '1px solid var(--border)', borderRadius: 10, padding: '7px 12px', outline: 'none',
              textDecoration: item.done ? 'line-through' : 'none',
              color: item.done ? 'var(--text-3)' : 'var(--text)' }} />
          <button type="button" onClick={() => remove(idx)}
            style={{ padding: 4, color: 'var(--text-3)', background: 'none', border: 'none', cursor: 'pointer' }}>
            <X size={13} />
          </button>
        </div>
      ))}
      <button type="button" onClick={add}
        style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 600,
          color: 'var(--accent)', background: 'none', border: '1.5px dashed var(--border)',
          borderRadius: 10, padding: '8px 12px', cursor: 'pointer', width: '100%' }}>
        <Plus size={13} /> Add item
      </button>
    </div>
  )
}

function ChecklistDisplay({ items, onToggle }) {
  if (!items || items.length === 0) return null
  const done = items.filter((i) => i.done).length
  return (
    <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: '12px 14px' }}>
      <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>
        Checklist · {done}/{items.length}
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {items.map((item) => (
          <button key={item.id} type="button" onClick={() => onToggle(item.id)}
            style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'none', border: 'none', cursor: 'pointer', padding: 0, textAlign: 'left', width: '100%' }}>
            <div style={{ width: 16, height: 16, borderRadius: 4, flexShrink: 0, border: '1.5px solid var(--border)',
              background: item.done ? 'var(--accent)' : 'transparent',
              display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {item.done && <Check size={10} style={{ color: '#fff' }} strokeWidth={3} />}
            </div>
            <span style={{ fontSize: 13, color: item.done ? 'var(--text-3)' : 'var(--text)', textDecoration: item.done ? 'line-through' : 'none' }}>{item.text}</span>
          </button>
        ))}
      </div>
    </div>
  )
}

function KanbanTab({ category }) {
  const { tasks, addTask, deleteTask, moveTask, updateTask } = useStore()
  const [addModal,    setAddModal]    = useState(false)
  const [detail,      setDetail]      = useState(null)
  const [editMode,    setEditMode]    = useState(false)
  const [form,        setForm]        = useState({ text: '', priority: 'med', dueDate: '', notes: '', checklist: [] })
  const [editForm,    setEditForm]    = useState({ text: '', priority: 'med', dueDate: '', notes: '', checklist: [] })
  const [matrixMode,  setMatrixMode]  = useState(false)

  const items = tasks.filter((t) => t.category === category)
  const isOverdue = (t) => t.dueDate && t.status !== 'done' && isBefore(startOfDay(parseISO(t.dueDate)), startOfDay(new Date()))

  const openDetail = (t) => {
    setDetail(t)
    setEditForm({ text: t.text, priority: t.priority, dueDate: t.dueDate || '', notes: t.notes || '', checklist: t.checklist || [] })
    setEditMode(false)
  }

  const saveEdit = () => {
    if (!editForm.text.trim()) return
    updateTask(detail.id, { text: editForm.text.trim(), priority: editForm.priority, dueDate: editForm.dueDate, notes: editForm.notes, checklist: editForm.checklist })
    setDetail((d) => ({ ...d, ...editForm, text: editForm.text.trim() }))
    setEditMode(false)
  }

  const toggleChecklistItem = (itemId) => {
    const newChecklist = (detail.checklist || []).map((c) => c.id === itemId ? { ...c, done: !c.done } : c)
    updateTask(detail.id, { checklist: newChecklist })
    setDetail((d) => ({ ...d, checklist: newChecklist }))
  }

  return (
    <div className="space-y-4">
      {/* Header row: Add Task + Matrix/List toggle */}
      <div style={{ display: 'flex', gap: 8, alignItems: 'stretch' }}>
        <div style={{ flex: 1 }}>
          <Btn size="lg" onClick={() => setAddModal(true)}><Plus size={18} /> Add Task</Btn>
        </div>
        <button
          onClick={() => setMatrixMode((v) => !v)}
          aria-label={matrixMode ? 'Switch to list view' : 'Switch to matrix view'}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: '10px 14px',
            borderRadius: 'var(--card-radius, 16px)',
            border: '1.5px solid var(--border, rgba(120,120,120,0.2))',
            background: matrixMode ? 'var(--accent, #3b82f6)' : 'var(--surface)',
            color: matrixMode ? '#fff' : 'var(--text-2)',
            fontSize: 13,
            fontWeight: 700,
            cursor: 'pointer',
            flexShrink: 0,
            transition: 'all 0.15s ease',
            whiteSpace: 'nowrap',
          }}
        >
          {matrixMode ? '📋 List' : '🎯 Matrix'}
        </button>
      </div>

      {items.length === 0 && <EmptyState icon={CheckCircle2} text="No tasks yet — add one above" />}

      {/* Matrix view */}
      {matrixMode && items.length > 0 && (
        <MatrixView tasks={items} onMoveTask={moveTask} />
      )}

      {/* List / Kanban columns */}
      {!matrixMode && STATUSES.map(({ key, label }) => {
        const col = items.filter((t) => t.status === key)
        return (
          <div key={key}>
            <SectionHeader>{label} · {col.length}</SectionHeader>
            {col.length === 0
              ? <div className="bg-zinc-50 dark:bg-zinc-800/30 rounded-2xl py-4 text-center text-xs text-zinc-400 dark:text-zinc-600">Empty</div>
              : col.map((t) => (
                <Card key={t.id} className="p-4 mb-2 active:scale-[0.98] transition-transform">
                  <div className="flex items-start gap-3">
                    {/* Quick complete button */}
                    <button
                      onClick={(e) => { e.stopPropagation(); moveTask(t.id, t.status === 'done' ? 'todo' : 'done') }}
                      style={{
                        width: 20, height: 20, borderRadius: 6, flexShrink: 0, border: '2px solid',
                        borderColor: t.status === 'done' ? 'var(--success)' : 'var(--border)',
                        background: t.status === 'done' ? 'var(--success)' : 'transparent',
                        cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: 1,
                      }}
                    >
                      {t.status === 'done' && <Check size={11} style={{ color: '#fff' }} strokeWidth={3} />}
                    </button>
                    <div className="flex-1 cursor-pointer" onClick={() => openDetail(t)}>
                      <p style={{ fontSize: 13, fontWeight: 500, color: t.status === 'done' ? 'var(--text-3)' : 'var(--text)', textDecoration: t.status === 'done' ? 'line-through' : 'none', lineHeight: 1.4 }}>{t.text}</p>
                      {t.notes && <p style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.notes}</p>}
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        <Badge color={PRIORITY_COLOR[t.priority]}>{PRIORITY_LABEL[t.priority]}</Badge>
                        {t.dueDate && <Badge color={isOverdue(t) ? 'red' : 'zinc'}>{isOverdue(t) ? '⚠ ' : ''}{format(parseISO(t.dueDate), 'MMM d')}</Badge>}
                        {t.checklist && t.checklist.length > 0 && <Badge color="zinc">✓ {t.checklist.filter((c) => c.done).length}/{t.checklist.length}</Badge>}
                      </div>
                    </div>
                    <ChevronRight size={15} style={{ color: 'var(--text-3)', marginTop: 2, flexShrink: 0 }} onClick={() => openDetail(t)} />
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
          <Input label="Notes (optional)" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Additional details..." />
          <ChecklistEditor items={form.checklist} onChange={(checklist) => setForm({ ...form, checklist })} />
          <Btn
            size="lg"
            disabled={!form.text.trim()}
            onClick={() => {
              if (form.text.trim()) {
                addTask({ ...form, text: form.text.trim(), category })
                setForm({ text: '', priority: 'med', dueDate: '', notes: '', checklist: [] })
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
            {detail.notes && (
              <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: '12px 14px' }}>
                <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>Notes</p>
                <p style={{ fontSize: 13, color: 'var(--text-2)', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{detail.notes}</p>
              </div>
            )}
            <ChecklistDisplay items={detail.checklist} onToggle={toggleChecklistItem} />
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
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest">Notes</label>
              <textarea
                value={editForm.notes}
                onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                placeholder="Additional details..."
                rows={2}
                style={{ background: 'var(--surface-3, var(--surface))', color: 'var(--text)', border: '1px solid var(--border)', borderRadius: 12, padding: '10px 14px', fontSize: 13, outline: 'none', resize: 'none', width: '100%' }}
              />
            </div>
            <ChecklistEditor items={editForm.checklist} onChange={(checklist) => setEditForm({ ...editForm, checklist })} />
            <Btn size="lg" onClick={saveEdit} disabled={!editForm.text.trim()}>Save Changes</Btn>
            <Btn variant="ghost" size="lg" onClick={() => setEditMode(false)}>Cancel</Btn>
          </div>
        )}
      </Modal>
    </div>
  )
}

// ─── PROJECTS TAB ─────────────────────────────────────────────────────────────
// Label config so the same folder system reads correctly in both tabs.
const FOLDER_LABELS = {
  project: { create: 'Create Project', newTitle: 'New Project', editTitle: 'Edit Project', empty: 'Create a project to get started', save: 'Create Project', deleteBtn: 'Delete Project', singular: 'Project' },
  office:  { create: 'Create Folder',  newTitle: 'New Folder',  editTitle: 'Edit Folder',  empty: 'Create a folder to get started',  save: 'Create Folder',  deleteBtn: 'Delete Folder',  singular: 'Folder'  },
}

function ProjectsTab({ scope = 'project' }) {
  const [view, setView] = useState(null)
  const { projects } = useStore()
  const currentProject = projects.find((p) => p.id === view)

  if (view && currentProject) {
    return <ProjectDetail project={currentProject} onBack={() => setView(null)} />
  }
  return <ProjectsList onOpen={(id) => setView(id)} scope={scope} />
}

function ProjectsList({ onOpen, scope = 'project' }) {
  const { projects, addProject, deleteProject, updateProject, projectTasks } = useStore()
  const labels = FOLDER_LABELS[scope] || FOLDER_LABELS.project
  const scoped = projects.filter((p) => (p.scope || 'project') === scope)
  const [modal,     setModal]     = useState(false)
  const [editModal, setEditModal] = useState(null)
  const [form, setForm] = useState({ name: '', description: '', emoji: '🚀', color: 'blue', status: 'active', checklist: [] })

  const openEdit = (p) => {
    setEditModal(p)
    setForm({ name: p.name, description: p.description || '', emoji: p.emoji, color: p.color, status: p.status, checklist: p.checklist || [] })
  }

  const statuses = ['active','paused','completed']

  return (
    <div className="space-y-4">
      <Btn
        size="lg"
        onClick={() => {
          setForm({ name: '', description: '', emoji: '🚀', color: 'blue', status: 'active', checklist: [] })
          setModal(true)
        }}
      >
        <FolderOpen size={18} /> {labels.create}
      </Btn>

      {scoped.length === 0 && <EmptyState icon={FolderOpen} text={labels.empty} />}

      {statuses.map((status) => {
        const group = scoped.filter((p) => p.status === status)
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

      <Modal open={modal} onClose={() => setModal(false)} title={labels.newTitle}>
        <ProjectForm
          form={form}
          setForm={setForm}
          showStatus={false}
          saveLabel={labels.save}
          singular={labels.singular}
          onSave={() => {
            if (form.name.trim()) {
              addProject({ ...form, name: form.name.trim(), scope })
              setModal(false)
            }
          }}
        />
      </Modal>

      <Modal open={!!editModal} onClose={() => setEditModal(null)} title={labels.editTitle}>
        {editModal && (
          <div className="space-y-4">
            <ProjectForm
              form={form}
              setForm={setForm}
              showStatus
              saveLabel="Save Changes"
              singular={labels.singular}
              onSave={() => {
                if (form.name.trim()) {
                  updateProject(editModal.id, { ...form, name: form.name.trim() })
                  setEditModal(null)
                }
              }}
            />
            <Btn variant="danger" size="lg" onClick={() => { deleteProject(editModal.id); setEditModal(null) }}>
              <Trash2 size={15} /> {labels.deleteBtn}
            </Btn>
          </div>
        )}
      </Modal>
    </div>
  )
}

function ProjectForm({ form, setForm, onSave, saveLabel = 'Create Project', showStatus = false, singular = 'Project' }) {
  return (
    <div className="space-y-4">
      <Input
        label={`${singular} name`}
        value={form.name}
        onChange={(e) => setForm({ ...form, name: e.target.value })}
        placeholder={singular === 'Folder' ? 'e.g. Work, Errands, Admin' : 'e.g. Githa App, Ecogenium'}
      />
      <Input
        label="Description (optional)"
        value={form.description}
        onChange={(e) => setForm({ ...form, description: e.target.value })}
        placeholder="What is this project about?"
      />
      <ChecklistEditor items={form.checklist} onChange={(checklist) => setForm({ ...form, checklist })} />
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
function MarkCompleteBtn({ projectId }) {
  const { updateProject } = useStore()
  const [done, setDone] = useState(false)
  const handleClick = () => {
    setDone(true)
    updateProject(projectId, { status: 'completed' })
  }
  return (
    <button
      onClick={handleClick}
      disabled={done}
      style={{
        fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 8, border: 'none',
        background: done ? 'rgba(52,211,153,0.2)' : 'var(--surface)', color: done ? 'var(--success)' : 'var(--text-3)',
        cursor: done ? 'default' : 'pointer', display: 'flex', alignItems: 'center', gap: 4,
      }}
    >
      <Check size={11} /> {done ? 'Done!' : 'Complete'}
    </button>
  )
}

const DETAIL_TABS = [
  { key: 'tasks', label: '✓ Tasks' },
  { key: 'notes', label: '📝 Notes' },
  { key: 'files', label: '📎 Files' },
]

function ProjectDetail({ project, onBack }) {
  const [tab, setTab] = useState('tasks')
  const updateProject = useStore((s) => s.updateProject)

  const toggleChecklistItem = (itemId) => {
    const newChecklist = (project.checklist || []).map((c) => c.id === itemId ? { ...c, done: !c.done } : c)
    updateProject(project.id, { checklist: newChecklist })
  }

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
        <div className="flex items-center gap-2">
          <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${COLOR_LIGHT[project.color]}`}>
            {project.status}
          </span>
          {project.status !== 'completed' && (
            <MarkCompleteBtn projectId={project.id} />
          )}
        </div>
      </div>

      {/* Project-level checklist — shows whenever the project is opened */}
      <ChecklistDisplay items={project.checklist} onToggle={toggleChecklistItem} />

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
  const [form,      setForm]      = useState({ text: '', priority: 'med', dueDate: '', notes: '', checklist: [] })
  const [editForm,  setEditForm]  = useState({ text: '', priority: 'med', dueDate: '', notes: '', checklist: [] })

  const items = projectTasks.filter((t) => t.projectId === projectId)
  const isOverdue = (t) => t.dueDate && t.status !== 'done' && isBefore(startOfDay(parseISO(t.dueDate)), startOfDay(new Date()))

  const openDetail = (t) => {
    setDetail(t)
    setEditForm({ text: t.text, priority: t.priority, dueDate: t.dueDate || '', notes: t.notes || '', checklist: t.checklist || [] })
    setEditMode(false)
  }

  const saveEdit = () => {
    if (!editForm.text.trim()) return
    updateProjectTask(detail.id, { text: editForm.text.trim(), priority: editForm.priority, dueDate: editForm.dueDate, notes: editForm.notes, checklist: editForm.checklist })
    setDetail((d) => ({ ...d, ...editForm, text: editForm.text.trim() }))
    setEditMode(false)
  }

  const toggleChecklistItem = (itemId) => {
    const newChecklist = (detail.checklist || []).map((c) => c.id === itemId ? { ...c, done: !c.done } : c)
    updateProjectTask(detail.id, { checklist: newChecklist })
    setDetail((d) => ({ ...d, checklist: newChecklist }))
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
                <Card key={t.id} className="p-4 mb-2 active:scale-[0.98] transition-transform">
                  <div className="flex items-start gap-3">
                    {/* Quick complete button */}
                    <button
                      onClick={(e) => { e.stopPropagation(); moveProjectTask(t.id, t.status === 'done' ? 'todo' : 'done') }}
                      style={{
                        width: 20, height: 20, borderRadius: 6, flexShrink: 0, border: '2px solid',
                        borderColor: t.status === 'done' ? 'var(--success)' : 'var(--border)',
                        background: t.status === 'done' ? 'var(--success)' : 'transparent',
                        cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: 1,
                      }}
                    >
                      {t.status === 'done' && <Check size={11} style={{ color: '#fff' }} strokeWidth={3} />}
                    </button>
                    <div className="flex-1 cursor-pointer" onClick={() => openDetail(t)}>
                      <p style={{ fontSize: 13, fontWeight: 500, color: t.status === 'done' ? 'var(--text-3)' : 'var(--text)', textDecoration: t.status === 'done' ? 'line-through' : 'none', lineHeight: 1.4 }}>{t.text}</p>
                      {t.notes && <p style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.notes}</p>}
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        <Badge color={PRIORITY_COLOR[t.priority]}>{PRIORITY_LABEL[t.priority]}</Badge>
                        {t.dueDate && <Badge color={isOverdue(t) ? 'red' : 'zinc'}>{isOverdue(t) ? '⚠ ' : ''}{format(parseISO(t.dueDate), 'MMM d')}</Badge>}
                        {t.checklist && t.checklist.length > 0 && <Badge color="zinc">✓ {t.checklist.filter((c) => c.done).length}/{t.checklist.length}</Badge>}
                      </div>
                    </div>
                    <ChevronRight size={15} style={{ color: 'var(--text-3)', marginTop: 2, flexShrink: 0 }} onClick={() => openDetail(t)} />
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
          <Input label="Notes (optional)" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Additional details..." />
          <ChecklistEditor items={form.checklist} onChange={(checklist) => setForm({ ...form, checklist })} />
          <Btn
            size="lg"
            disabled={!form.text.trim()}
            onClick={() => {
              if (form.text.trim()) {
                addProjectTask({ projectId, ...form, text: form.text.trim() })
                setForm({ text: '', priority: 'med', dueDate: '', notes: '', checklist: [] })
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
            {detail.notes && (
              <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: '12px 14px' }}>
                <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>Notes</p>
                <p style={{ fontSize: 13, color: 'var(--text-2)', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{detail.notes}</p>
              </div>
            )}
            <ChecklistDisplay items={detail.checklist} onToggle={toggleChecklistItem} />
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
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest">Notes</label>
              <textarea
                value={editForm.notes}
                onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                placeholder="Additional details..."
                rows={2}
                style={{ background: 'var(--surface-3, var(--surface))', color: 'var(--text)', border: '1px solid var(--border)', borderRadius: 12, padding: '10px 14px', fontSize: 13, outline: 'none', resize: 'none', width: '100%' }}
              />
            </div>
            <ChecklistEditor items={editForm.checklist} onChange={(checklist) => setEditForm({ ...editForm, checklist })} />
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
      {/* Floating action button above bottom nav */}
      <motion.button
        onClick={() => setOpen(true)}
        whileTap={{ scale: 0.9 }}
        aria-label="Quick add task or appointment"
        className="fixed bottom-[88px] right-4 w-14 h-14 rounded-full flex items-center justify-center z-40 focus:outline-none"
        style={{ background: 'var(--accent)', boxShadow: 'var(--shadow-pop, 0 8px 24px rgba(0,0,0,0.25))', color: 'var(--text-on-accent, #fff)' }}
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
  const [mode, setMode] = useState('plan')
  const [tab,  setTab]  = useState('today')
  const migrateOfficeFolders = useStore((s) => s.migrateOfficeFolders)

  // One-time: move any legacy flat Office tasks into a "General" folder.
  useEffect(() => { migrateOfficeFolders() }, [migrateOfficeFolders])

  const handleMode = (m) => {
    setMode(m)
    setTab(m === 'plan' ? 'today' : 'office')
  }

  return (
    <div className="space-y-4 min-w-0">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: 'var(--text)' }}>Tasks</h1>
        {/* Plan / Work segment selector */}
        <div style={{ display: 'flex', background: 'var(--surface)', border: '1.5px solid var(--border)', borderRadius: 12, padding: 3, gap: 3 }}>
          {[['plan','Plan'],['work','Work']].map(([m,l]) => (
            <button key={m} onClick={() => handleMode(m)}
              style={{
                fontSize: 12, fontWeight: 700, padding: '5px 14px', borderRadius: 9, border: 'none', cursor: 'pointer',
                background: mode === m ? 'var(--accent)' : 'transparent',
                color: mode === m ? '#fff' : 'var(--text-2)',
                transition: 'all 0.15s',
              }}>
              {l}
            </button>
          ))}
        </div>
      </div>

      <PillTabBar tabs={mode === 'plan' ? PLAN_TABS : WORK_TABS} active={tab} onChange={setTab} />

      {tab === 'today'    && <TodayTab />}
      {tab === 'upcoming' && <UpcomingTab />}
      {tab === 'calendar' && <CalendarTab />}
      {tab === 'habits'   && <HabitsTab />}
      {tab === 'office'   && <ProjectsTab scope="office" />}
      {tab === 'projects' && <ProjectsTab scope="project" />}

      <FAB />
    </div>
  )
}
