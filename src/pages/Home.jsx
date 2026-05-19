import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  format, parseISO, isBefore, startOfDay, differenceInDays,
  addDays, subDays, eachDayOfInterval, isSameDay, isToday,
} from 'date-fns'
import {
  ArrowRight, TrendingUp, TrendingDown, Bell, Heart, Flame,
  Calendar, Clock, MapPin, CheckSquare, Sparkles, Check,
  ChevronRight, Star, Zap,
} from 'lucide-react'
import { useStore } from '../store'
import { useNavigate } from 'react-router-dom'
import XPBar from '../components/XPBar'
import MoodCheckIn from '../components/MoodCheckIn'
import WeatherWidget from '../components/WeatherWidget'
import DailyQuote from '../components/DailyQuote'

// ─── Helpers ────────────────────────────────────────────────────────────────

function greeting() {
  const h = new Date().getHours()
  if (h < 5)  return 'Up late'
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}

// ─── Animated Number ─────────────────────────────────────────────────────────

function AnimatedNumber({ value, duration = 1000, prefix = '', suffix = '' }) {
  const [display, setDisplay] = useState(0)
  useEffect(() => {
    const start = Date.now()
    const timer = setInterval(() => {
      const elapsed = Date.now() - start
      const progress = Math.min(elapsed / duration, 1)
      setDisplay(Math.round(value * progress))
      if (progress >= 1) clearInterval(timer)
    }, 16)
    return () => clearInterval(timer)
  }, [value, duration])
  return <span>{prefix}{display}{suffix}</span>
}

// ─── Progress Ring ────────────────────────────────────────────────────────────

function ProgressRing({ done, total, size = 48, color = 'rgba(255,255,255,0.9)', trackColor = 'rgba(255,255,255,0.2)' }) {
  const r = (size - 6) / 2
  const circ = 2 * Math.PI * r
  const pct = total > 0 ? Math.min(done / total, 1) : 0
  const offset = circ * (1 - pct)
  return (
    <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={trackColor} strokeWidth={4} />
      <motion.circle
        cx={size / 2} cy={size / 2} r={r} fill="none"
        stroke={color} strokeWidth={4} strokeLinecap="round"
        strokeDasharray={circ}
        initial={{ strokeDashoffset: circ }}
        animate={{ strokeDashoffset: offset }}
        transition={{ duration: 1, ease: 'easeOut', delay: 0.3 }}
      />
    </svg>
  )
}

// ─── Animated Finance Bar ─────────────────────────────────────────────────────

function FinanceBar({ income, expenses }) {
  const total = income + expenses
  const incomePct = total > 0 ? (income / total) * 100 : 50
  return (
    <div style={{ background: 'rgba(255,255,255,0.08)', borderRadius: 99 }} className="h-2 w-full overflow-hidden flex mt-3">
      <motion.div
        style={{ background: 'var(--success)', borderRadius: 99 }}
        initial={{ width: '0%' }}
        animate={{ width: `${incomePct}%` }}
        transition={{ duration: 1, ease: 'easeOut', delay: 0.5 }}
      />
    </div>
  )
}

// ─── Streak Card ─────────────────────────────────────────────────────────────

function StreakCard({ label, value, gradient, emoji, delay = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      style={{
        background: gradient,
        borderRadius: 'var(--card-radius)',
        boxShadow: 'var(--shadow-pop)',
      }}
      className="flex-1 p-4 relative overflow-hidden"
    >
      <span className="absolute -right-2 -bottom-2 text-5xl opacity-10 select-none pointer-events-none">{emoji}</span>
      <div className="flex items-center gap-2 mb-2">
        <motion.div
          animate={{ scale: [1, 1.15, 1] }}
          transition={{ repeat: Infinity, duration: 1.5, ease: 'easeInOut' }}
          className="text-xl leading-none"
        >
          🔥
        </motion.div>
        <p style={{ color: 'rgba(255,255,255,0.8)' }} className="text-[10px] font-bold uppercase tracking-widest">{label}</p>
      </div>
      <p style={{ color: '#fff' }} className="text-3xl font-black leading-none">
        <AnimatedNumber value={value} duration={900} />
      </p>
      <p style={{ color: 'rgba(255,255,255,0.65)' }} className="text-xs font-semibold mt-1">
        day{value !== 1 ? 's' : ''} streak
      </p>
    </motion.div>
  )
}


// ─── Efficiency Panel ─────────────────────────────────────────────────────────

function EfficiencyPanel() {
  const { dailyTasks, habits, habitLogs } = useStore()
  const todayStr = format(new Date(), 'yyyy-MM-dd')

  // Inline daily calculation (no external dependency needed)
  const todayTasks = dailyTasks.filter(t => t.date === todayStr)
  const taskEff = todayTasks.length > 0
    ? Math.round((todayTasks.filter(t => t.done).length / todayTasks.length) * 100)
    : null

  const habitsToday = habits.map(h => {
    const log = habitLogs.find(l => l.habitId === h.id && l.date === todayStr)
    return { ...h, count: log?.count ?? 0, done: (log?.count ?? 0) >= h.target }
  })
  const habitEff = habits.length > 0
    ? Math.round((habitsToday.filter(h => h.done).length / habits.length) * 100)
    : null

  const overall = taskEff !== null && habitEff !== null
    ? Math.round(taskEff * 0.6 + habitEff * 0.4)
    : taskEff ?? habitEff

  const color = overall === null ? 'var(--text-3)'
    : overall >= 80 ? 'var(--success)'
    : overall >= 50 ? 'var(--gold)'
    : 'var(--danger)'

  if (overall === null) return null // No data today yet

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4 }}
      style={{
        background: 'var(--surface)',
        border: '1px solid var(--card-border)',
        borderRadius: 'var(--card-radius)',
        boxShadow: 'var(--shadow-md)',
        backdropFilter: 'var(--backdrop)',
        WebkitBackdropFilter: 'var(--backdrop)',
        padding: '16px 20px',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <p style={{ color: 'var(--text-3)', fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 4 }}>Today's Efficiency</p>
          <p style={{ color, fontSize: 36, fontWeight: 900, lineHeight: 1 }}>
            <AnimatedNumber value={overall} suffix="%" />
          </p>
          <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
            {taskEff !== null && (
              <span style={{ color: 'var(--text-2)', fontSize: 12 }}>
                Tasks: <span style={{ color: 'var(--text)', fontWeight: 700 }}>{taskEff}%</span>
              </span>
            )}
            {habitEff !== null && (
              <span style={{ color: 'var(--text-2)', fontSize: 12 }}>
                Habits: <span style={{ color: 'var(--text)', fontWeight: 700 }}>{habitEff}%</span>
              </span>
            )}
          </div>
        </div>
        <div style={{ position: 'relative', width: 72, height: 72 }}>
          <ProgressRing done={overall} total={100} size={72} color={color} trackColor="var(--border)" />
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontSize: 11, fontWeight: 800, color }}>{overall}%</span>
          </div>
        </div>
      </div>
      {overall === 100 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          style={{ marginTop: 10, padding: '6px 12px', background: 'var(--success)', borderRadius: 99, display: 'inline-flex', alignItems: 'center', gap: 6 }}
        >
          <span style={{ fontSize: 14 }}>🏆</span>
          <span style={{ color: 'white', fontSize: 12, fontWeight: 700 }}>Perfect Day!</span>
        </motion.div>
      )}
    </motion.div>
  )
}


// ─── Main Component ───────────────────────────────────────────────────────────

export default function Home() {
  const {
    name, dailyTasks, tasks, appointments, transactions, gifts, dates, currency, habits, habitLogs, getHabitStreak,
    dailyChallenge, generateDailyChallenge, completeDailyChallenge,
    notificationsEnabled, reminderTime,
  } = useStore()
  const navigate = useNavigate()

  // Live clock
  const [now, setNow] = useState(new Date())
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 60_000)
    return () => clearInterval(t)
  }, [])

  // Generate daily challenge on mount
  useEffect(() => { generateDailyChallenge() }, [])

  // Schedule browser notification reminder for habits
  useEffect(() => {
    if (!(notificationsEnabled ?? false) || !(reminderTime ?? '09:00')) return
    const [h, m] = (reminderTime ?? '09:00').split(':').map(Number)
    const target = new Date()
    target.setHours(h, m, 0, 0)
    if (target < new Date()) target.setDate(target.getDate() + 1)
    const ms = target - new Date()
    const timer = setTimeout(() => {
      if (Notification.permission === 'granted') {
        new Notification('LifeOS — Habit Reminder 💪', {
          body: 'Time to check your habits for today!',
          icon: '/pwa-192x192.png',
        })
      }
    }, ms)
    return () => clearTimeout(timer)
  }, [notificationsEnabled, reminderTime])

  const todayStr = format(now, 'yyyy-MM-dd')
  const thisMonth = format(now, 'yyyy-MM')

  // ── Tasks ──
  const todayTasks = dailyTasks.filter((t) => t.date === todayStr)
  const doneTasks  = todayTasks.filter((t) => t.done).length

  // ── Habits ──
  const habitsToday = habits.map((h) => {
    const log = habitLogs.find((l) => l.habitId === h.id && l.date === todayStr)
    return { ...h, count: log?.count ?? 0, done: (log?.count ?? 0) >= h.target }
  })
  const doneHabits = habitsToday.filter((h) => h.done).length

  // ── Finance ──
  const monthTx       = transactions.filter((tx) => tx.date.startsWith(thisMonth))
  const monthIncome   = monthTx.filter((tx) => tx.type === 'income').reduce((s, tx) => s + tx.amount, 0)
  const monthExpenses = monthTx.filter((tx) => tx.type === 'expense').reduce((s, tx) => s + tx.amount, 0)
  const saved         = monthIncome - monthExpenses

  // ── Appointments ──
  const in3Days = format(addDays(now, 3), 'yyyy-MM-dd')
  const upcomingApts = (appointments ?? [])
    .filter((a) => a.date >= todayStr && a.date <= in3Days)
    .sort((a, b) => a.date.localeCompare(b.date) || (a.startTime ?? '').localeCompare(b.startTime ?? ''))
    .slice(0, 3)

  // ── Alerts ──
  const overdueTasks = tasks.filter(
    (tk) => tk.status !== 'done' && tk.dueDate && isBefore(parseISO(tk.dueDate), startOfDay(now))
  ).length

  const upcomingDates = dates
    .filter((d) => { try { const diff = differenceInDays(parseISO(d.date), now); return diff >= 0 && diff <= 14 } catch { return false } })
    .sort((a, b) => parseISO(a.date) - parseISO(b.date))

  const pendingGifts = gifts.filter((g) => !g.bought).length

  // ── 7-Day Calendar ──
  const calStart = subDays(now, 3)
  const calEnd   = addDays(now, 3)
  const calDays  = eachDayOfInterval({ start: calStart, end: calEnd })

  // Task dot per day: needs dailyTasks with matching date
  function getDayDot(day) {
    const ds = format(day, 'yyyy-MM-dd')
    const dayTasks = dailyTasks.filter((t) => t.date === ds)
    if (dayTasks.length === 0) return 'none'
    const done = dayTasks.filter((t) => t.done).length
    if (done === dayTasks.length) return 'green'
    if (done > 0) return 'yellow'
    return 'gray'
  }

  // ── Task Streak: consecutive days with >= 50% tasks done ──
  function calcTaskStreak() {
    let streak = 0
    let d = subDays(now, 1)
    while (streak < 365) {
      const ds = format(d, 'yyyy-MM-dd')
      const dt = dailyTasks.filter((t) => t.date === ds)
      if (dt.length === 0) break
      const dn = dt.filter((t) => t.done).length
      if (dn / dt.length >= 0.5) { streak++; d = subDays(d, 1) } else break
    }
    return streak
  }

  // ── Best habit streak ──
  function calcBestHabitStreak() {
    if (!getHabitStreak || habits.length === 0) return 0
    return Math.max(0, ...habits.map((h) => getHabitStreak(h.id)))
  }

  const taskStreak   = calcTaskStreak()
  const habitStreak  = calcBestHabitStreak()

  // ── Shared card style ──
  const cardStyle = {
    background: 'var(--card-bg)',
    border: '1px solid var(--card-border)',
    borderRadius: 'var(--card-radius)',
    boxShadow: 'var(--shadow-md)',
    backdropFilter: 'var(--backdrop)',
    WebkitBackdropFilter: 'var(--backdrop)',
  }

  const dotColor = { green: 'var(--success)', yellow: 'var(--gold)', gray: 'var(--text-3)', none: 'transparent' }

  // ── Animation variants ──
  const fadeUp = (delay = 0) => ({
    initial: { opacity: 0, y: 24 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.45, delay, ease: [0.22, 1, 0.36, 1] },
  })

  const stagger = {
    animate: { transition: { staggerChildren: 0.05 } },
  }

  const staggerChild = {
    initial: { opacity: 0, y: 16 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] },
  }

  return (
    <div className="space-y-5 pb-6">

      {/* ── Rotating gradient keyframes ── */}
      <style>{`
        @keyframes spin-border {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
        @keyframes pulse-glow {
          0%, 100% { opacity: 0.5; }
          50%       { opacity: 1; }
        }
      `}</style>

      {/* ══════════════════════════════════════════════════
          HERO SECTION
      ══════════════════════════════════════════════════ */}
      <motion.div
        {...fadeUp(0)}
        style={{
          background: 'var(--grad-tasks)',
          borderRadius: 'var(--radius-xl)',
          boxShadow: 'var(--shadow-pop)',
          position: 'relative',
          overflow: 'hidden',
        }}
        className="p-5 pt-6"
      >
        {/* Decorative floating emojis */}
        <span style={{ position: 'absolute', top: 14, right: 60, opacity: 0.15, fontSize: 28, pointerEvents: 'none', userSelect: 'none' }}>✨</span>
        <span style={{ position: 'absolute', bottom: 18, right: 20, opacity: 0.15, fontSize: 32, pointerEvents: 'none', userSelect: 'none' }}>🎯</span>
        <span style={{ position: 'absolute', top: 50, left: 16, opacity: 0.12, fontSize: 24, pointerEvents: 'none', userSelect: 'none' }}>💪</span>

        <div className="flex items-start justify-between">
          {/* Left: greeting + date */}
          <div className="flex-1 min-w-0">
            <motion.p
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, delay: 0.1 }}
              style={{ color: 'rgba(255,255,255,0.7)', fontFamily: 'var(--font-sans)' }}
              className="text-xs font-semibold uppercase tracking-widest"
            >
              {format(now, 'EEEE, d MMMM yyyy')}
            </motion.p>

            <motion.h1
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
              style={{ color: '#fff', fontFamily: 'var(--font-sans)', lineHeight: 1.15 }}
              className="text-2xl font-black mt-1"
            >
              {greeting()},<br />{name} 👋
            </motion.h1>

            {/* Live clock */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              style={{ color: 'rgba(255,255,255,0.85)', fontFamily: 'var(--font-sans)' }}
              className="flex items-center gap-1.5 mt-3"
            >
              <Clock size={13} />
              <span className="text-sm font-bold tabular-nums">{format(now, 'HH:mm')}</span>
              <span style={{ color: 'rgba(255,255,255,0.5)' }} className="text-xs">&mdash; local time</span>
            </motion.div>
          </div>

          {/* Avatar with rotating gradient border */}
          <motion.div
            initial={{ opacity: 0, scale: 0.7 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.2, ease: [0.34, 1.56, 0.64, 1] }}
            style={{ position: 'relative', width: 60, height: 60, flexShrink: 0 }}
          >
            {/* Spinning gradient ring */}
            <div style={{
              position: 'absolute', inset: -3,
              borderRadius: '50%',
              background: 'conic-gradient(from 0deg, rgba(255,255,255,0.9), rgba(255,255,255,0.1), rgba(255,255,255,0.9))',
              animation: 'spin-border 3s linear infinite',
            }} />
            <div style={{
              position: 'absolute', inset: 1,
              borderRadius: '50%',
              background: 'var(--grad-tasks)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <span style={{ color: '#fff', fontFamily: 'var(--font-sans)', fontWeight: 900, fontSize: 22 }}>
                {name?.[0]?.toUpperCase() ?? 'U'}
              </span>
            </div>
          </motion.div>
        </div>

        {/* Quick summary bar */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45 }}
          style={{ background: 'rgba(0,0,0,0.18)', borderRadius: 12 }}
          className="flex items-center gap-4 mt-4 px-4 py-2.5"
        >
          <div className="flex items-center gap-1.5">
            <CheckSquare size={13} color="rgba(255,255,255,0.7)" />
            <span style={{ color: '#fff' }} className="text-sm font-bold">{doneTasks}/{todayTasks.length}</span>
            <span style={{ color: 'rgba(255,255,255,0.55)' }} className="text-xs">tasks</span>
          </div>
          <div style={{ width: 1, height: 14, background: 'rgba(255,255,255,0.25)' }} />
          <div className="flex items-center gap-1.5">
            <Flame size={13} color="rgba(255,255,255,0.7)" />
            <span style={{ color: '#fff' }} className="text-sm font-bold">{doneHabits}/{habits.length}</span>
            <span style={{ color: 'rgba(255,255,255,0.55)' }} className="text-xs">habits</span>
          </div>
          <div style={{ width: 1, height: 14, background: 'rgba(255,255,255,0.25)' }} />
          <div className="flex items-center gap-1.5">
            <Sparkles size={13} color="rgba(255,255,255,0.7)" />
            <span style={{ color: saved >= 0 ? '#fff' : 'rgba(255,120,120,0.9)' }} className="text-sm font-bold">
              {saved >= 0 ? '+' : ''}{currency}{Math.abs(saved).toFixed(0)}
            </span>
            <span style={{ color: 'rgba(255,255,255,0.55)' }} className="text-xs">saved</span>
          </div>
        </motion.div>
      </motion.div>

      {/* ── XP Bar ── */}
      <motion.div {...fadeUp(0.06)}>
        <XPBar />
      </motion.div>

      {/* ── Weather + Quote ── */}
      <motion.div {...fadeUp(0.065)} className="space-y-2">
        <WeatherWidget />
        <DailyQuote />
      </motion.div>

      {/* ── Daily Challenge Card ── */}
      {dailyChallenge && (
        <motion.div
          {...fadeUp(0.07)}
          style={{ padding: '14px 16px', borderRadius: 16, background: 'var(--surface)', border: '1px solid var(--border)', marginBottom: 0 }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
            <span style={{ fontSize: 18 }}>⚔️</span>
            <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Daily Challenge</span>
            <span style={{ marginLeft: 'auto', fontSize: 11, fontWeight: 700, color: 'var(--gold, #F5B342)' }}>+{dailyChallenge.xpReward} XP</span>
          </div>
          <p style={{ fontSize: 14, color: 'var(--text)', margin: '0 0 10px', lineHeight: 1.4 }}>{dailyChallenge.text}</p>
          {!dailyChallenge.completed ? (
            <motion.button whileTap={{ scale: 0.95 }}
              onClick={completeDailyChallenge}
              style={{ width: '100%', padding: '8px 0', borderRadius: 10, background: 'var(--accent)', color: 'white', border: 'none', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}
            >Complete Challenge ✓</motion.button>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--success)' }}>
              <span>✅</span>
              <span style={{ fontSize: 13, fontWeight: 600 }}>Challenge Complete! +{dailyChallenge.xpReward} XP earned</span>
            </div>
          )}
        </motion.div>
      )}

      {/* ══════════════════════════════════════════════════
          7-DAY CALENDAR STRIP
      ══════════════════════════════════════════════════ */}
      <motion.div {...fadeUp(0.08)}>
        <p style={{ color: 'var(--text-3)', fontFamily: 'var(--font-sans)' }} className="text-[10px] font-bold uppercase tracking-widest mb-2.5 px-0.5">
          Week at a glance
        </p>
        <motion.div
          className="flex gap-2 overflow-x-auto pb-1"
          style={{ scrollbarWidth: 'none' }}
          variants={stagger}
          initial="initial"
          animate="animate"
        >
          {calDays.map((day) => {
            const today_ = isToday(day)
            const dot    = getDayDot(day)
            return (
              <motion.div
                key={day.toISOString()}
                variants={staggerChild}
                onClick={() => navigate('/tasks')}
                style={today_
                  ? { background: 'var(--accent)', borderRadius: 'var(--card-radius)', boxShadow: 'var(--shadow-pop)', minWidth: 52, cursor: 'pointer' }
                  : { background: 'var(--card-bg)', border: '1px solid var(--card-border)', borderRadius: 'var(--card-radius)', boxShadow: 'var(--shadow-md)', minWidth: 52, cursor: 'pointer' }
                }
                whileTap={{ scale: 0.93 }}
                className="flex flex-col items-center py-3 px-1 shrink-0"
              >
                <p style={{ color: today_ ? 'rgba(255,255,255,0.8)' : 'var(--text-3)', fontFamily: 'var(--font-sans)' }} className="text-[10px] font-bold uppercase">
                  {format(day, 'EEE')}
                </p>
                <p style={{ color: today_ ? '#fff' : 'var(--text)', fontFamily: 'var(--font-sans)' }} className="text-lg font-black mt-0.5 leading-none">
                  {format(day, 'd')}
                </p>
                {/* dot */}
                <div
                  style={{
                    width: 6, height: 6, borderRadius: '50%', marginTop: 6,
                    background: dot === 'none' ? 'transparent' : dotColor[dot],
                    border: dot === 'none' ? '1.5px solid var(--border)' : 'none',
                    opacity: today_ && dot === 'none' ? 0.5 : 1,
                    boxShadow: dot === 'green' ? '0 0 4px var(--success)' : dot === 'yellow' ? '0 0 4px var(--gold)' : 'none',
                  }}
                />
              </motion.div>
            )
          })}
        </motion.div>
      </motion.div>

      {/* ══════════════════════════════════════════════════
          STREAK COUNTERS ROW
      ══════════════════════════════════════════════════ */}
      <motion.div {...fadeUp(0.12)} className="flex gap-3">
        <StreakCard
          label="Task Streak"
          value={taskStreak}
          gradient="linear-gradient(135deg, var(--warm) 0%, var(--gold) 100%)"
          emoji="⚡"
          delay={0.12}
        />
        <StreakCard
          label="Best Habit"
          value={habitStreak}
          gradient="linear-gradient(135deg, var(--lavender) 0%, var(--accent-2) 100%)"
          emoji="🏆"
          delay={0.2}
        />
      </motion.div>

      {/* ══════════════════════════════════════════════════
          WEEKLY STATS CARD
      ══════════════════════════════════════════════════ */}
      <motion.div {...fadeUp(0.13)}>
        {(() => {
          // Compute this week's dates (Mon–Sun containing today)
          const dayOfWeek = now.getDay() // 0=Sun
          const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek
          const weekStart = format(addDays(now, mondayOffset), 'yyyy-MM-dd')
          const weekEnd = format(addDays(now, mondayOffset + 6), 'yyyy-MM-dd')
          const weekDates = []
          for (let i = 0; i <= 6; i++) weekDates.push(format(addDays(new Date(weekStart), i), 'yyyy-MM-dd'))

          const weekTasksDone = dailyTasks.filter((t) => weekDates.includes(t.date) && t.done).length
          const weekTasksTotal = dailyTasks.filter((t) => weekDates.includes(t.date)).length
          const weekHabitsHit = habitLogs.filter((l) => {
            if (!weekDates.includes(l.date)) return false
            const habit = habits.find((h) => h.id === l.habitId)
            return habit && l.count >= habit.target
          }).length

          const { xp, moodLog } = useStore.getState()
          const latestMood = (moodLog ?? []).slice().sort((a, b) => b.date.localeCompare(a.date))[0]
          const moodEmojis = { 1: '😞', 2: '😕', 3: '😐', 4: '😊', 5: '🤩' }

          const miniStats = [
            { label: 'Tasks done', value: weekTasksDone, icon: '✅', suffix: `/${weekTasksTotal}` },
            { label: 'Habits hit', value: weekHabitsHit, icon: '🔥', suffix: '' },
            { label: 'Total XP', value: xp ?? 0, icon: '⚡', suffix: '' },
            { label: 'Mood', value: latestMood ? moodEmojis[latestMood.mood] : '—', icon: '💭', isEmoji: true },
          ]

          return (
            <div>
              <p style={{ color: 'var(--text-3)', fontFamily: 'var(--font-sans)' }} className="text-[10px] font-bold uppercase tracking-widest mb-2.5 px-0.5">
                This week
              </p>
              <div style={{ display: 'flex', gap: 8 }}>
                {miniStats.map((s, i) => (
                  <motion.div
                    key={s.label}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.13 + i * 0.05, duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                    style={{
                      flex: 1,
                      background: 'var(--surface)',
                      border: '1px solid var(--border)',
                      borderRadius: 'var(--card-radius)',
                      padding: '10px 8px',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: 2,
                      textAlign: 'center',
                    }}
                  >
                    <span style={{ fontSize: 18, lineHeight: 1 }}>{s.icon}</span>
                    <span style={{ color: 'var(--text)', fontSize: s.isEmoji ? 18 : 15, fontWeight: 900, lineHeight: 1.1, fontFamily: 'var(--font-sans)' }}>
                      {s.isEmoji ? s.value : <>{s.value}<span style={{ color: 'var(--text-muted)', fontSize: 11 }}>{s.suffix}</span></>}
                    </span>
                    <span style={{ color: 'var(--text-muted)', fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{s.label}</span>
                  </motion.div>
                ))}
              </div>
            </div>
          )
        })()}
      </motion.div>

      {/* ══════════════════════════════════════════════════
          BOSS BATTLE CARD
      ══════════════════════════════════════════════════ */}
      <motion.div {...fadeUp(0.135)}>
        {(() => {
          const dayOfWeek = now.getDay()
          const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek
          const weekStart = format(addDays(now, mondayOffset), 'yyyy-MM-dd')
          const weekDates = []
          for (let i = 0; i <= 6; i++) weekDates.push(format(addDays(new Date(weekStart), i), 'yyyy-MM-dd'))
          const weekTasksAll = dailyTasks.filter((t) => weekDates.includes(t.date))
          const weekDone = weekTasksAll.filter((t) => t.done).length
          const weekTotal = weekTasksAll.length
          const pct = weekTotal > 0 ? Math.round((weekDone / weekTotal) * 100) : 0
          const bossHp = 100 - pct
          const left = weekTotal - weekDone

          let statusEmoji, statusText, statusColor
          if (pct >= 80) {
            statusEmoji = '🏆'
            statusText = 'Boss Defeated! You crushed it this week!'
            statusColor = 'var(--success)'
          } else if (pct >= 50) {
            statusEmoji = '⚔️'
            statusText = `Boss is weak! Keep going... ${left} task${left !== 1 ? 's' : ''} left`
            statusColor = 'var(--gold, #F5B342)'
          } else {
            statusEmoji = '💀'
            statusText = 'Boss Challenge: Complete 80% of tasks to win!'
            statusColor = 'var(--danger)'
          }

          return (
            <div style={{
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--card-radius)',
              padding: '14px 16px',
              overflow: 'hidden',
              position: 'relative',
            }}>
              {/* Background boss shadow */}
              <div style={{ position: 'absolute', right: -10, top: -10, fontSize: 80, opacity: 0.05, pointerEvents: 'none', userSelect: 'none', lineHeight: 1 }}>👹</div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                <div>
                  <p style={{ color: 'var(--text-muted)', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 2 }}>Weekly Boss Battle</p>
                  <p style={{ color: statusColor, fontSize: 12, fontWeight: 700, lineHeight: 1.3 }}>
                    {statusEmoji} {statusText}
                  </p>
                </div>
                {/* Wobbling boss emoji */}
                <motion.div
                  animate={pct < 80 ? { rotate: [-5, 5, -5, 5, 0], scale: [1, 1.05, 1] } : { scale: [1, 0.9, 1] }}
                  transition={{ duration: pct < 80 ? 0.8 : 1.5, repeat: Infinity, ease: 'easeInOut' }}
                  style={{ fontSize: 36, lineHeight: 1, flexShrink: 0, marginLeft: 8 }}
                >
                  {pct >= 80 ? '💀' : '👹'}
                </motion.div>
              </div>

              {/* Boss HP bar */}
              <div style={{ marginBottom: 4 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ color: 'var(--text-muted)', fontSize: 10, fontWeight: 700 }}>Boss HP</span>
                  <span style={{ color: statusColor, fontSize: 10, fontWeight: 700 }}>{bossHp}%</span>
                </div>
                <div style={{ background: 'var(--border)', borderRadius: 99, height: 10, overflow: 'hidden' }}>
                  <motion.div
                    initial={{ width: '100%' }}
                    animate={{ width: `${bossHp}%` }}
                    transition={{ duration: 1.2, ease: 'easeOut', delay: 0.3 }}
                    style={{
                      height: '100%',
                      borderRadius: 99,
                      background: pct >= 80 ? 'var(--success)' : pct >= 50 ? 'var(--gold, #F5B342)' : 'var(--danger)',
                      boxShadow: `0 0 8px ${pct >= 80 ? 'var(--success)' : pct >= 50 ? 'var(--gold, #F5B342)' : 'var(--danger)'}`,
                    }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
                <span style={{ color: 'var(--text-muted)', fontSize: 11 }}>{weekDone}/{weekTotal} tasks</span>
                <span style={{ color: statusColor, fontSize: 11, fontWeight: 700 }}>{pct}% complete</span>
              </div>
            </div>
          )
        })()}
      </motion.div>

      {/* ── Efficiency Panel ── */}
      <motion.div {...fadeUp(0.14)}>
        <EfficiencyPanel />
      </motion.div>

      {/* ── Mood Check-In ── */}
      <motion.div {...fadeUp(0.15)}>
        <MoodCheckIn />
      </motion.div>

      {/* ══════════════════════════════════════════════════
          THREE STAT CARDS
      ══════════════════════════════════════════════════ */}
      <motion.div {...fadeUp(0.16)}>
        <p style={{ color: 'var(--text-3)', fontFamily: 'var(--font-sans)' }} className="text-[10px] font-bold uppercase tracking-widest mb-2.5 px-0.5">
          Today at a glance
        </p>
        <div className="grid grid-cols-3 gap-2.5">

          {/* Tasks card */}
          <motion.div
            onClick={() => navigate('/tasks')}
            style={{ background: 'var(--grad-tasks)', borderRadius: 'var(--card-radius)', boxShadow: 'var(--shadow-pop)', cursor: 'pointer', overflow: 'hidden', position: 'relative' }}
            whileTap={{ scale: 0.95 }}
            whileHover={{ scale: 1.02 }}
            className="p-3.5"
          >
            <span style={{ position: 'absolute', right: -4, bottom: -4, fontSize: 52, opacity: 0.13, pointerEvents: 'none', userSelect: 'none' }}>✅</span>
            <ProgressRing done={doneTasks} total={todayTasks.length} size={44} />
            <p style={{ color: '#fff', fontFamily: 'var(--font-sans)' }} className="text-xl font-black mt-2 leading-none">
              <AnimatedNumber value={doneTasks} />
              <span style={{ color: 'rgba(255,255,255,0.5)' }} className="text-sm font-bold">/{todayTasks.length}</span>
            </p>
            <p style={{ color: 'rgba(255,255,255,0.75)' }} className="text-[10px] font-bold uppercase tracking-wide mt-1">Tasks</p>
          </motion.div>

          {/* Habits card */}
          <motion.div
            onClick={() => navigate('/tasks')}
            style={{ background: 'var(--grad-habits)', borderRadius: 'var(--card-radius)', boxShadow: 'var(--shadow-pop)', cursor: 'pointer', overflow: 'hidden', position: 'relative' }}
            whileTap={{ scale: 0.95 }}
            whileHover={{ scale: 1.02 }}
            className="p-3.5"
          >
            <span style={{ position: 'absolute', right: -4, bottom: -4, fontSize: 52, opacity: 0.13, pointerEvents: 'none', userSelect: 'none' }}>🔥</span>
            <ProgressRing done={doneHabits} total={habits.length} size={44} />
            <p style={{ color: '#fff', fontFamily: 'var(--font-sans)' }} className="text-xl font-black mt-2 leading-none">
              <AnimatedNumber value={doneHabits} />
              <span style={{ color: 'rgba(255,255,255,0.5)' }} className="text-sm font-bold">/{habits.length}</span>
            </p>
            <p style={{ color: 'rgba(255,255,255,0.75)' }} className="text-[10px] font-bold uppercase tracking-wide mt-1">Habits</p>
          </motion.div>

          {/* Finance card */}
          <motion.div
            onClick={() => navigate('/finance')}
            style={{ background: 'var(--grad-finance)', borderRadius: 'var(--card-radius)', boxShadow: 'var(--shadow-pop)', cursor: 'pointer', overflow: 'hidden', position: 'relative' }}
            whileTap={{ scale: 0.95 }}
            whileHover={{ scale: 1.02 }}
            className="p-3.5"
          >
            <span style={{ position: 'absolute', right: -4, bottom: -4, fontSize: 52, opacity: 0.13, pointerEvents: 'none', userSelect: 'none' }}>💰</span>
            <div style={{ width: 44, height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {saved >= 0
                ? <TrendingUp size={24} color="rgba(255,255,255,0.9)" strokeWidth={2.5} />
                : <TrendingDown size={24} color="rgba(255,255,255,0.9)" strokeWidth={2.5} />
              }
            </div>
            <p style={{ color: '#fff', fontFamily: 'var(--font-sans)' }} className="text-xl font-black mt-2 leading-none">
              {currency}<AnimatedNumber value={Math.abs(saved)} />
            </p>
            <p style={{ color: 'rgba(255,255,255,0.75)' }} className="text-[10px] font-bold uppercase tracking-wide mt-1">Saved</p>
          </motion.div>
        </div>
      </motion.div>

      {/* ══════════════════════════════════════════════════
          FINANCE DETAIL CARD
      ══════════════════════════════════════════════════ */}
      <motion.div
        {...fadeUp(0.2)}
        onClick={() => navigate('/finance')}
        style={{ ...cardStyle, cursor: 'pointer', position: 'relative', overflow: 'hidden' }}
        whileTap={{ scale: 0.98 }}
        className="p-4"
      >
        <span style={{ position: 'absolute', right: 12, top: 12, fontSize: 44, opacity: 0.07, pointerEvents: 'none', userSelect: 'none' }}>📊</span>

        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div style={{ background: 'var(--accent-soft)', borderRadius: 8, width: 30, height: 30, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <TrendingUp size={15} style={{ color: 'var(--accent)' }} />
            </div>
            <p style={{ color: 'var(--text)', fontFamily: 'var(--font-sans)' }} className="text-sm font-bold">
              {format(now, 'MMMM')} Finance
            </p>
          </div>
          <ChevronRight size={16} style={{ color: 'var(--text-3)' }} />
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wide flex items-center gap-1" style={{ color: 'var(--success)' }}>
              <TrendingUp size={9} /> Income
            </p>
            <p style={{ color: 'var(--text)', fontFamily: 'var(--font-sans)' }} className="text-lg font-black mt-1">
              {currency}<AnimatedNumber value={monthIncome} />
            </p>
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wide flex items-center gap-1" style={{ color: 'var(--danger)' }}>
              <TrendingDown size={9} /> Spent
            </p>
            <p style={{ color: 'var(--text)', fontFamily: 'var(--font-sans)' }} className="text-lg font-black mt-1">
              {currency}<AnimatedNumber value={monthExpenses} />
            </p>
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wide" style={{ color: saved >= 0 ? 'var(--success)' : 'var(--danger)' }}>
              {saved >= 0 ? 'Saved' : 'Deficit'}
            </p>
            <p style={{ color: saved >= 0 ? 'var(--success)' : 'var(--danger)', fontFamily: 'var(--font-sans)' }} className="text-lg font-black mt-1">
              {saved >= 0 ? '+' : '-'}{currency}<AnimatedNumber value={Math.abs(saved)} />
            </p>
          </div>
        </div>

        {/* Income vs Expense animated bar */}
        <div className="mt-3">
          <div className="flex justify-between mb-1">
            <span style={{ color: 'var(--success)' }} className="text-[10px] font-bold">Income {monthIncome + monthExpenses > 0 ? Math.round((monthIncome / (monthIncome + monthExpenses)) * 100) : 50}%</span>
            <span style={{ color: 'var(--danger)' }} className="text-[10px] font-bold">Expenses {monthIncome + monthExpenses > 0 ? Math.round((monthExpenses / (monthIncome + monthExpenses)) * 100) : 50}%</span>
          </div>
          <div style={{ background: 'var(--border)', borderRadius: 99, height: 8, overflow: 'hidden', display: 'flex' }}>
            <motion.div
              style={{ background: 'var(--success)', borderRadius: 99 }}
              initial={{ width: '0%' }}
              animate={{ width: `${monthIncome + monthExpenses > 0 ? (monthIncome / (monthIncome + monthExpenses)) * 100 : 50}%` }}
              transition={{ duration: 1.2, ease: 'easeOut', delay: 0.4 }}
            />
            <motion.div
              style={{ background: 'var(--danger)', flex: 1 }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
            />
          </div>
        </div>
      </motion.div>

      {/* ══════════════════════════════════════════════════
          HABIT PROGRESS ROW
      ══════════════════════════════════════════════════ */}
      {habitsToday.length > 0 && (
        <motion.div {...fadeUp(0.24)}>
          <div className="flex items-center justify-between mb-2.5 px-0.5">
            <p style={{ color: 'var(--text-3)', fontFamily: 'var(--font-sans)' }} className="text-[10px] font-bold uppercase tracking-widest">
              Habits today
            </p>
            <button
              onClick={() => navigate('/tasks')}
              style={{ color: 'var(--accent)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
              className="text-xs font-bold flex items-center gap-1"
            >
              All <ArrowRight size={11} />
            </button>
          </div>
          <div className="flex gap-2.5 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
            {habitsToday.map((h, i) => {
              const pct = h.target > 0 ? Math.min(h.count / h.target, 1) : 0
              return (
                <motion.div
                  key={h.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.25 + i * 0.06, duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                  onClick={() => navigate('/tasks')}
                  style={{
                    background: h.done ? 'var(--accent-soft)' : 'var(--card-bg)',
                    border: h.done ? '1.5px solid var(--accent)' : '1px solid var(--card-border)',
                    borderRadius: 'var(--card-radius)',
                    boxShadow: h.done ? 'var(--shadow-pop)' : 'var(--shadow-md)',
                    minWidth: 90,
                    cursor: 'pointer',
                    position: 'relative',
                    overflow: 'hidden',
                  }}
                  className="p-3 shrink-0"
                  whileTap={{ scale: 0.94 }}
                >
                  {h.done && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                      style={{
                        position: 'absolute', top: 6, right: 6,
                        background: 'var(--accent)', borderRadius: '50%',
                        width: 16, height: 16, display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}
                    >
                      <Check size={10} color="#fff" strokeWidth={3} />
                    </motion.div>
                  )}
                  <div className="text-lg leading-none mb-1">{h.emoji}</div>
                  <p style={{ color: h.done ? 'var(--accent)' : 'var(--text)', fontFamily: 'var(--font-sans)' }} className="text-xs font-bold leading-tight truncate max-w-[72px]">
                    {h.name}
                  </p>
                  <p style={{ color: 'var(--text-3)' }} className="text-[10px] font-semibold mt-0.5">{h.count}/{h.target}</p>
                  {/* mini progress bar */}
                  <div style={{ background: 'var(--border)', borderRadius: 99, height: 3, marginTop: 6, overflow: 'hidden' }}>
                    <motion.div
                      style={{
                        background: h.done ? 'var(--accent)' : 'var(--accent-2)',
                        height: '100%', borderRadius: 99,
                      }}
                      initial={{ width: '0%' }}
                      animate={{ width: `${pct * 100}%` }}
                      transition={{ duration: 0.8, ease: 'easeOut', delay: 0.3 + i * 0.05 }}
                    />
                  </div>
                </motion.div>
              )
            })}
          </div>
        </motion.div>
      )}

      {/* ══════════════════════════════════════════════════
          UPCOMING APPOINTMENTS TIMELINE
      ══════════════════════════════════════════════════ */}
      {upcomingApts.length > 0 && (
        <motion.div {...fadeUp(0.28)}>
          <div className="flex items-center justify-between mb-2.5 px-0.5">
            <p style={{ color: 'var(--text-3)', fontFamily: 'var(--font-sans)' }} className="text-[10px] font-bold uppercase tracking-widest">
              Upcoming
            </p>
            <button
              onClick={() => navigate('/tasks')}
              style={{ color: 'var(--accent)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
              className="text-xs font-bold flex items-center gap-1"
            >
              All <ArrowRight size={11} />
            </button>
          </div>
          <div style={cardStyle} className="overflow-hidden">
            {upcomingApts.map((apt, i) => {
              const isAptToday = apt.date === todayStr
              const diff = differenceInDays(parseISO(apt.date), now)
              return (
                <motion.div
                  key={apt.id}
                  initial={{ opacity: 0, x: -16 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 + i * 0.08, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                  onClick={() => navigate('/tasks')}
                  style={{
                    borderBottom: i < upcomingApts.length - 1 ? '1px solid var(--card-border)' : 'none',
                    cursor: 'pointer',
                    position: 'relative',
                    paddingLeft: 0,
                  }}
                  className="flex items-center gap-3 px-4 py-3"
                  whileTap={{ scale: 0.98 }}
                >
                  {/* Left accent border */}
                  <div style={{ width: 3, height: 44, background: 'var(--accent-2)', borderRadius: 99, flexShrink: 0 }} />

                  {/* Time badge */}
                  <div style={{
                    background: isAptToday ? 'var(--accent-soft)' : 'var(--surface)',
                    borderRadius: 8, padding: '4px 8px', flexShrink: 0, textAlign: 'center', minWidth: 42,
                  }}>
                    {apt.startTime
                      ? <p style={{ color: isAptToday ? 'var(--accent)' : 'var(--text-3)', fontFamily: 'var(--font-sans)' }} className="text-xs font-black tabular-nums">{apt.startTime}</p>
                      : <Calendar size={14} style={{ color: 'var(--text-3)' }} />
                    }
                    <p style={{ color: isAptToday ? 'var(--accent)' : 'var(--text-3)' }} className="text-[9px] font-bold uppercase mt-0.5">
                      {isAptToday ? 'Today' : diff === 1 ? 'Tmrw' : `+${diff}d`}
                    </p>
                  </div>

                  {/* Details */}
                  <div className="flex-1 min-w-0">
                    <p style={{ color: 'var(--text)', fontFamily: 'var(--font-sans)' }} className="text-sm font-bold truncate">{apt.title}</p>
                    {apt.location && (
                      <p style={{ color: 'var(--text-3)' }} className="text-xs flex items-center gap-1 mt-0.5 truncate">
                        <MapPin size={10} />{apt.location}
                      </p>
                    )}
                  </div>

                  <ChevronRight size={14} style={{ color: 'var(--text-3)', flexShrink: 0 }} />
                </motion.div>
              )
            })}
          </div>
        </motion.div>
      )}

      {/* ══════════════════════════════════════════════════
          ALERT ROWS
      ══════════════════════════════════════════════════ */}
      {(overdueTasks > 0 || upcomingDates.length > 0 || pendingGifts > 0) && (
        <motion.div {...fadeUp(0.32)} className="space-y-2">
          <p style={{ color: 'var(--text-3)', fontFamily: 'var(--font-sans)' }} className="text-[10px] font-bold uppercase tracking-widest mb-2 px-0.5">
            Alerts
          </p>

          {overdueTasks > 0 && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, delay: 0.35 }}
              onClick={() => navigate('/tasks')}
              style={{
                background: 'var(--card-bg)',
                border: '1px solid var(--card-border)',
                borderRadius: 'var(--card-radius)',
                borderLeft: '3px solid var(--danger)',
                boxShadow: 'var(--shadow-md)',
                cursor: 'pointer',
              }}
              className="flex items-center gap-3 px-4 py-3"
              whileTap={{ scale: 0.97 }}
            >
              <div style={{ background: 'rgba(239,68,68,0.12)', borderRadius: 8, width: 30, height: 30, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Bell size={14} style={{ color: 'var(--danger)' }} />
              </div>
              <p style={{ color: 'var(--text)', fontFamily: 'var(--font-sans)' }} className="flex-1 text-sm font-semibold">
                <span style={{ color: 'var(--danger)' }} className="font-black">{overdueTasks}</span> overdue task{overdueTasks > 1 ? 's' : ''}
              </p>
              <ChevronRight size={14} style={{ color: 'var(--text-3)' }} />
            </motion.div>
          )}

          {upcomingDates.map((d, i) => {
            const diff = differenceInDays(parseISO(d.date), now)
            return (
              <motion.div
                key={d.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4, delay: 0.38 + i * 0.06 }}
                onClick={() => navigate('/her')}
                style={{
                  background: 'var(--card-bg)',
                  border: '1px solid var(--card-border)',
                  borderRadius: 'var(--card-radius)',
                  borderLeft: '3px solid var(--lavender)',
                  boxShadow: 'var(--shadow-md)',
                  cursor: 'pointer',
                }}
                className="flex items-center gap-3 px-4 py-3"
                whileTap={{ scale: 0.97 }}
              >
                <div style={{ background: 'rgba(167,139,250,0.12)', borderRadius: 8, width: 30, height: 30, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Heart size={14} style={{ color: 'var(--lavender)' }} fill="currentColor" />
                </div>
                <div className="flex-1">
                  <p style={{ color: 'var(--text)', fontFamily: 'var(--font-sans)' }} className="text-sm font-semibold">{d.name}</p>
                  <p style={{ color: 'var(--lavender)' }} className="text-xs font-bold mt-0.5">
                    {diff === 0 ? 'Today! 🎉' : `in ${diff} day${diff > 1 ? 's' : ''}`}
                  </p>
                </div>
                <ChevronRight size={14} style={{ color: 'var(--text-3)' }} />
              </motion.div>
            )
          })}

          {pendingGifts > 0 && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, delay: 0.44 }}
              onClick={() => navigate('/her')}
              style={{
                background: 'var(--card-bg)',
                border: '1px solid var(--card-border)',
                borderRadius: 'var(--card-radius)',
                borderLeft: '3px solid var(--accent)',
                boxShadow: 'var(--shadow-md)',
                cursor: 'pointer',
              }}
              className="flex items-center gap-3 px-4 py-3"
              whileTap={{ scale: 0.97 }}
            >
              <div style={{ background: 'var(--accent-soft)', borderRadius: 8, width: 30, height: 30, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Sparkles size={14} style={{ color: 'var(--accent)' }} />
              </div>
              <p style={{ color: 'var(--text)', fontFamily: 'var(--font-sans)' }} className="flex-1 text-sm font-semibold">
                <span style={{ color: 'var(--accent)' }} className="font-black">{pendingGifts}</span> gift idea{pendingGifts > 1 ? 's' : ''} not bought yet
              </p>
              <ChevronRight size={14} style={{ color: 'var(--text-3)' }} />
            </motion.div>
          )}
        </motion.div>
      )}

    </div>
  )
}
