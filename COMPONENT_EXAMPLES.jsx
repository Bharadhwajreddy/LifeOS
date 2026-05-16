// COMPONENT_EXAMPLES.jsx
// Copy these patterns into your existing components

import { motion } from 'framer-motion'
import { Check, Clock, MapPin, Flame, TrendingUp } from 'lucide-react'

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// TASK ITEM - Premium checkbox + priority pill
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export function TaskItem({ task, done, priority, onToggle, onDelete }) {
  const priorityConfig = {
    high: { bg: 'bg-red-100 dark:bg-red-500/20', text: 'text-red-700 dark:text-red-300', label: 'HIGH' },
    med: { bg: 'bg-amber-100 dark:bg-amber-500/20', text: 'text-amber-700 dark:text-amber-300', label: 'MED' },
    low: { bg: 'bg-green-100 dark:bg-green-500/20', text: 'text-green-700 dark:text-green-300', label: 'LOW' },
  }
  const p = priorityConfig[priority] || priorityConfig.med

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.2 }}
      className="flex items-start gap-3 p-3 bg-white dark:bg-[#161B27] rounded-lg border border-zinc-200/50 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-[#1F2433] active:scale-[0.98] transition-all group"
    >
      {/* SQUARE CHECKBOX - NO RADIUS */}
      <motion.input
        type="checkbox"
        checked={done}
        onChange={onToggle}
        whileTap={{ scale: 0.95 }}
        className="w-5 h-5 rounded-none border-2 border-zinc-300 dark:border-zinc-600 appearance-none cursor-pointer checked:bg-blue-500 checked:border-blue-500 flex-shrink-0 mt-0.5 transition-colors"
      />

      {/* TEXT + DUE TIME */}
      <div className="flex-1 min-w-0">
        <p
          className={`text-sm font-medium ${
            done
              ? 'line-through text-zinc-400 dark:text-zinc-600'
              : 'text-zinc-900 dark:text-white'
          }`}
        >
          {task.text}
        </p>
        {task.dueTime && (
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5 flex items-center gap-1">
            <Clock size={12} /> {task.dueTime}
          </p>
        )}
      </div>

      {/* PRIORITY PILL */}
      <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full whitespace-nowrap flex-shrink-0 ${p.bg} ${p.text}`}>
        {p.label}
      </span>

      {/* DELETE BUTTON (on hover) */}
      <motion.button
        initial={{ opacity: 0 }}
        whileHover={{ opacity: 1 }}
        onClick={onDelete}
        className="opacity-0 text-zinc-400 hover:text-red-500 dark:hover:text-red-400 transition-colors p-1"
      >
        ✕
      </motion.button>
    </motion.div>
  )
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// APPOINTMENT CARD - Gradient bg + icon support
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export function AppointmentCard({ appointment, onDelete }) {
  const isUpcoming = new Date(appointment.date + ' ' + appointment.startTime) > new Date()
  const isOverdue = !isUpcoming && appointment.date < new Date().toISOString().split('T')[0]

  return (
    <motion.div
      whileHover={{ y: -2 }}
      onClick={(e) => e.stopPropagation()}
      className={`rounded-xl p-4 border transition-all ${
        isOverdue
          ? 'bg-red-50 dark:bg-red-500/5 border-red-200/50 dark:border-red-900/30'
          : 'bg-gradient-to-br from-white to-zinc-50 dark:from-[#161B27] dark:to-[#1A1F2E] border-zinc-200/60 dark:border-zinc-700/60 hover:shadow-lg dark:hover:shadow-blue-500/10'
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          {/* DATE LABEL */}
          <p className={`text-xs font-bold uppercase tracking-wide ${
            isOverdue ? 'text-red-600 dark:text-red-400' : 'text-zinc-500 dark:text-zinc-400'
          }`}>
            {appointment.date}
          </p>

          {/* TITLE */}
          <h3 className={`text-sm font-semibold mt-1 ${
            isOverdue ? 'text-red-700 dark:text-red-300' : 'text-zinc-900 dark:text-white'
          }`}>
            {appointment.title}
          </h3>

          {/* META: TIME + LOCATION */}
          <div className="flex items-center gap-4 mt-2 text-xs text-zinc-600 dark:text-zinc-400">
            {appointment.startTime && (
              <span className="flex items-center gap-1">
                <Clock size={13} className="flex-shrink-0" /> {appointment.startTime}
              </span>
            )}
            {appointment.location && (
              <span className="flex items-center gap-1 truncate">
                <MapPin size={13} className="flex-shrink-0" /> {appointment.location}
              </span>
            )}
          </div>
        </div>

        {/* IMPORTANCE INDICATOR */}
        {appointment.important && (
          <div className="w-2.5 h-2.5 rounded-full bg-red-500 flex-shrink-0 mt-1 animate-pulse" />
        )}
      </div>
    </motion.div>
  )
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// HABIT ROW - With circular progress ring on right
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function ProgressRing({ done, total, size = 48, color = '#3b82f6' }) {
  const r = (size - 8) / 2
  const circ = 2 * Math.PI * r
  const pct = total > 0 ? done / total : 0
  return (
    <svg width={size} height={size} className="-rotate-90" style={{ flexShrink: 0 }}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="currentColor" strokeWidth={4} className="text-zinc-200 dark:text-zinc-700" />
      <motion.circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke={color}
        strokeWidth={4}
        strokeDasharray={`${circ * pct} ${circ}`}
        strokeLinecap="round"
        initial={{ strokeDasharray: `0 ${circ}` }}
        animate={{ strokeDasharray: `${circ * pct} ${circ}` }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
      />
    </svg>
  )
}

const colorMap = {
  blue: '#3B82F6',
  green: '#10B981',
  purple: '#8B5CF6',
  amber: '#F59E0B',
  cyan: '#06B6D4',
}

export function HabitRow({ habit, count, onLog, onDelete }) {
  const isDone = count >= habit.target

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -8 }}
      transition={{ duration: 0.2 }}
      className="flex items-center justify-between p-3 bg-white dark:bg-[#161B27] rounded-lg border border-zinc-200/50 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-[#1F2433] transition-colors"
    >
      {/* LEFT: EMOJI + TEXT */}
      <div
        onClick={onLog}
        className="flex items-center gap-3 flex-1 cursor-pointer active:scale-95 transition-transform"
      >
        <span className="text-2xl">{habit.emoji}</span>
        <div>
          <p className="text-sm font-semibold text-zinc-900 dark:text-white">{habit.name}</p>
          <p className={`text-xs ${isDone ? 'text-green-600 dark:text-green-400' : 'text-zinc-500 dark:text-zinc-400'}`}>
            {count}/{habit.target} today
          </p>
        </div>
      </div>

      {/* RIGHT: PROGRESS RING */}
      <ProgressRing done={count} total={habit.target} size={48} color={colorMap[habit.color]} />
    </motion.div>
  )
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// STAT CARD - Finance/Summary metrics
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export function StatCard({ label, value, change, positive = true, Icon = TrendingUp }) {
  return (
    <motion.div
      whileHover={{ y: -2 }}
      className="bg-gradient-to-br from-white to-zinc-50 dark:from-[#161B27] dark:to-[#1A1F2E] rounded-xl p-4 border border-zinc-200/60 dark:border-zinc-700/60 hover:shadow-lg dark:hover:shadow-blue-500/10 transition-all"
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-xs font-bold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
            {label}
          </p>
          <p className="text-2xl font-bold text-zinc-900 dark:text-white mt-2">{value}</p>
          <div className={`text-xs mt-2 font-semibold flex items-center gap-1 ${
            positive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
          }`}>
            <Icon size={13} /> {change}
          </div>
        </div>
      </div>
    </motion.div>
  )
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// PILL TAB - Navigation/Filter buttons
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export function PillTab({ label, active, onClick }) {
  return (
    <motion.button
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      className={`px-4 py-2 rounded-full text-sm font-semibold transition-all ${
        active
          ? 'bg-blue-500 text-white shadow-md shadow-blue-500/30'
          : 'bg-zinc-100 dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-800'
      }`}
    >
      {label}
    </motion.button>
  )
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// FAB - Floating Action Button
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export function FAB({ onClick, Icon, label = 'Add' }) {
  return (
    <motion.button
      whileTap={{ scale: 0.92 }}
      whileHover={{ scale: 1.05 }}
      onClick={onClick}
      className="w-14 h-14 rounded-full bg-blue-500 hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700 shadow-lg shadow-blue-500/50 flex items-center justify-center text-white transition-colors"
      title={label}
    >
      <Icon size={24} strokeWidth={2.5} />
    </motion.button>
  )
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// CALENDAR DAY CELL - Monthly grid view
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export function CalendarDayCell({ day, events = [], isToday = false, onClick }) {
  return (
    <motion.button
      whileHover={{ y: -1 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      className={`aspect-square rounded-lg border p-2 transition-all ${
        isToday
          ? 'bg-blue-50 dark:bg-blue-500/10 border-blue-300 dark:border-blue-600'
          : 'bg-white dark:bg-[#161B27] border-zinc-200/50 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-[#1F2433]'
      }`}
    >
      <p className={`text-xs font-semibold text-center ${
        isToday ? 'text-blue-600 dark:text-blue-400' : 'text-zinc-900 dark:text-white'
      }`}>
        {day}
      </p>
      {events.length > 0 && (
        <div className="flex justify-center gap-1 mt-1.5">
          {events.slice(0, 2).map((e, i) => (
            <div key={i} className="w-1.5 h-1.5 rounded-full bg-blue-500" />
          ))}
          {events.length > 2 && <p className="text-[8px] text-zinc-500 dark:text-zinc-400">+{events.length - 2}</p>}
        </div>
      )}
    </motion.button>
  )
}
