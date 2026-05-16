import { format, parseISO, isBefore, startOfDay, differenceInDays, addDays } from 'date-fns'
import { ArrowRight, TrendingUp, TrendingDown, Bell, Heart, Flame, Calendar, Clock, MapPin, CheckSquare, Sparkles } from 'lucide-react'
import { useStore } from '../store'
import { useNavigate } from 'react-router-dom'
import { getTheme } from '../lib/themes'

function greeting() {
  const h = new Date().getHours()
  if (h < 5)  return 'Up late'
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}

function ProgressRing({ done, total, size = 40, color = 'rgba(255,255,255,0.9)' }) {
  const r = (size - 6) / 2
  const circ = 2 * Math.PI * r
  const pct = total > 0 ? Math.min(done / total, 1) : 0
  return (
    <svg width={size} height={size} className="-rotate-90">
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth={3} />
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={3}
        strokeDasharray={`${circ * pct} ${circ}`} strokeLinecap="round"
        style={{ transition: 'stroke-dasharray 0.5s ease' }} />
    </svg>
  )
}

export default function Home() {
  const { name, dailyTasks, tasks, appointments, transactions, gifts, dates, currency, habits, habitLogs, theme } = useStore()
  const navigate = useNavigate()
  const t = getTheme(theme)

  const todayStr = format(new Date(), 'yyyy-MM-dd')
  const thisMonth = format(new Date(), 'yyyy-MM')

  const todayTasks = dailyTasks.filter((t) => t.date === todayStr)
  const doneTasks  = todayTasks.filter((t) => t.done).length

  const habitsToday = habits.map((h) => {
    const log = habitLogs.find((l) => l.habitId === h.id && l.date === todayStr)
    return { ...h, count: log?.count ?? 0, done: (log?.count ?? 0) >= h.target }
  })
  const doneHabits = habitsToday.filter((h) => h.done).length

  const monthTx = transactions.filter((tx) => tx.date.startsWith(thisMonth))
  const monthIncome   = monthTx.filter((tx) => tx.type === 'income').reduce((s, tx) => s + tx.amount, 0)
  const monthExpenses = monthTx.filter((tx) => tx.type === 'expense').reduce((s, tx) => s + tx.amount, 0)
  const saved = monthIncome - monthExpenses

  const in3Days = format(addDays(new Date(), 3), 'yyyy-MM-dd')
  const upcomingApts = (appointments ?? [])
    .filter((a) => a.date >= todayStr && a.date <= in3Days)
    .sort((a, b) => a.date.localeCompare(b.date) || (a.startTime ?? '').localeCompare(b.startTime ?? ''))
    .slice(0, 3)

  const overdueTasks = tasks.filter(
    (tk) => tk.status !== 'done' && tk.dueDate && isBefore(parseISO(tk.dueDate), startOfDay(new Date()))
  ).length

  const upcomingDates = dates
    .filter((d) => { try { const diff = differenceInDays(parseISO(d.date), new Date()); return diff >= 0 && diff <= 14 } catch { return false } })
    .sort((a, b) => parseISO(a.date) - parseISO(b.date))

  const pendingGifts = gifts.filter((g) => !g.bought).length

  return (
    <div className="space-y-5">

      {/* ── Header ── */}
      <div className="flex items-start justify-between pt-1">
        <div>
          <p className="text-sm text-zinc-400 dark:text-zinc-500">{format(new Date(), 'EEEE, d MMMM yyyy')}</p>
          <h1 className="text-[26px] font-bold text-zinc-900 dark:text-[#E6EAF2] mt-0.5 leading-tight">
            {greeting()}, {name} 👋
          </h1>
        </div>
        <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${t.tasksGrad} flex items-center justify-center text-white font-bold text-sm shadow-lg mt-1 shrink-0`}>
          {name?.[0]?.toUpperCase() ?? 'U'}
        </div>
      </div>

      {/* ── Today at a Glance — 3 stat cards ── */}
      <div>
        <p className="text-[11px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest mb-3">Today at a glance</p>
        <div className="grid grid-cols-3 gap-2.5">

          {/* Tasks */}
          <div
            onClick={() => navigate('/tasks')}
            className={`relative overflow-hidden bg-gradient-to-br ${t.tasksGrad} shadow-lg ${t.tasksShadow} rounded-2xl p-3.5 cursor-pointer active:scale-[0.97] transition-all`}
          >
            <span className="absolute -right-2 -bottom-2 text-6xl opacity-[0.15] select-none pointer-events-none">✅</span>
            <ProgressRing done={doneTasks} total={todayTasks.length} size={40} />
            <p className="text-xl font-bold text-white mt-2">{doneTasks}<span className="text-sm text-white/60">/{todayTasks.length}</span></p>
            <p className="text-[10px] font-bold text-white/80 uppercase tracking-wide mt-0.5">Tasks</p>
          </div>

          {/* Habits */}
          <div
            onClick={() => navigate('/tasks')}
            className={`relative overflow-hidden bg-gradient-to-br ${t.habitsGrad} shadow-lg ${t.habitsShadow} rounded-2xl p-3.5 cursor-pointer active:scale-[0.97] transition-all`}
          >
            <span className="absolute -right-2 -bottom-2 text-6xl opacity-[0.15] select-none pointer-events-none">🔥</span>
            <ProgressRing done={doneHabits} total={habits.length} size={40} />
            <p className="text-xl font-bold text-white mt-2">{doneHabits}<span className="text-sm text-white/60">/{habits.length}</span></p>
            <p className="text-[10px] font-bold text-white/80 uppercase tracking-wide mt-0.5">Habits</p>
          </div>

          {/* Finance */}
          <div
            onClick={() => navigate('/finance')}
            className={`relative overflow-hidden bg-gradient-to-br ${t.finGrad} shadow-lg ${t.finShadow} rounded-2xl p-3.5 cursor-pointer active:scale-[0.97] transition-all`}
          >
            <span className="absolute -right-2 -bottom-2 text-6xl opacity-[0.15] select-none pointer-events-none">💰</span>
            <div className="w-10 h-10 flex items-center justify-center">
              <TrendingUp size={22} className="text-white" strokeWidth={2} />
            </div>
            <p className="text-xl font-bold text-white mt-2">{currency}{Math.abs(saved).toFixed(0)}</p>
            <p className="text-[10px] font-bold text-white/80 uppercase tracking-wide mt-0.5">Saved</p>
          </div>
        </div>
      </div>

      {/* ── Finance detail card ── */}
      <div
        onClick={() => navigate('/finance')}
        className="relative overflow-hidden bg-white dark:bg-[#151C2A] rounded-2xl p-4 border border-zinc-100 dark:border-white/[0.06] shadow-[0_8px_24px_rgba(15,23,42,0.06)] dark:shadow-[0_8px_24px_rgba(0,0,0,0.35)] cursor-pointer active:scale-[0.98] transition-all"
      >
        <span className="absolute right-3 top-3 text-5xl opacity-[0.07] dark:opacity-[0.12] select-none pointer-events-none">📊</span>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-emerald-100 dark:bg-emerald-500/20 flex items-center justify-center">
              <TrendingUp size={14} className="text-emerald-600 dark:text-emerald-400" />
            </div>
            <p className="text-sm font-semibold text-zinc-800 dark:text-[#E6EAF2]">{format(new Date(), 'MMMM')} Finance</p>
          </div>
          <ArrowRight size={14} className="text-zinc-400" />
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div>
            <p className="text-[10px] font-bold text-emerald-500 uppercase tracking-wide flex items-center gap-1"><TrendingUp size={9} />Income</p>
            <p className="text-lg font-bold text-zinc-900 dark:text-white mt-0.5">{currency}{monthIncome.toFixed(0)}</p>
          </div>
          <div>
            <p className="text-[10px] font-bold text-rose-500 uppercase tracking-wide flex items-center gap-1"><TrendingDown size={9} />Spent</p>
            <p className="text-lg font-bold text-zinc-900 dark:text-white mt-0.5">{currency}{monthExpenses.toFixed(0)}</p>
          </div>
          <div>
            <p className={`text-[10px] font-bold uppercase tracking-wide ${saved >= 0 ? 'text-blue-500' : 'text-amber-500'}`}>Saved</p>
            <p className={`text-lg font-bold mt-0.5 ${saved >= 0 ? 'text-zinc-900 dark:text-white' : 'text-amber-500'}`}>
              {saved >= 0 ? '+' : ''}{currency}{saved.toFixed(0)}
            </p>
          </div>
        </div>
      </div>

      {/* ── Habits quick view ── */}
      {habitsToday.length > 0 && (
        <div
          onClick={() => navigate('/tasks')}
          className="relative overflow-hidden bg-white dark:bg-[#151C2A] rounded-2xl p-4 border border-zinc-100 dark:border-white/[0.06] shadow-[0_8px_24px_rgba(15,23,42,0.06)] dark:shadow-[0_8px_24px_rgba(0,0,0,0.35)] cursor-pointer active:scale-[0.98] transition-all"
        >
          <span className="absolute right-3 top-3 text-5xl opacity-[0.07] dark:opacity-[0.12] select-none pointer-events-none">🏆</span>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-violet-100 dark:bg-violet-500/20 flex items-center justify-center">
                <Flame size={14} className="text-violet-600 dark:text-violet-400" />
              </div>
              <p className="text-sm font-semibold text-zinc-800 dark:text-[#E6EAF2]">Habits</p>
            </div>
            <span className="text-xs font-bold text-zinc-400">{doneHabits}/{habitsToday.length} done</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {habitsToday.map((h) => (
              <div key={h.id} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                h.done
                  ? 'bg-emerald-100 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-300'
                  : 'bg-zinc-100 dark:bg-white/[0.06] text-zinc-500 dark:text-zinc-400'
              }`}>
                <span>{h.emoji}</span>
                <span>{h.name}</span>
                <span className="opacity-60 font-bold">{h.count}/{h.target}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Upcoming appointments ── */}
      {upcomingApts.length > 0 && (
        <div
          onClick={() => navigate('/tasks')}
          className="relative overflow-hidden bg-white dark:bg-[#151C2A] rounded-2xl border border-zinc-100 dark:border-white/[0.06] shadow-[0_8px_24px_rgba(15,23,42,0.06)] dark:shadow-[0_8px_24px_rgba(0,0,0,0.35)] cursor-pointer active:scale-[0.98] transition-all"
        >
          <span className="absolute right-3 top-3 text-5xl opacity-[0.07] dark:opacity-[0.12] select-none pointer-events-none">📅</span>
          <div className="flex items-center justify-between px-4 pt-4 pb-2">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-teal-100 dark:bg-teal-500/20 flex items-center justify-center">
                <Calendar size={13} className="text-teal-600 dark:text-teal-400" />
              </div>
              <p className="text-sm font-semibold text-zinc-800 dark:text-[#E6EAF2]">Upcoming</p>
            </div>
            <ArrowRight size={14} className="text-zinc-400" />
          </div>
          <div className="divide-y divide-zinc-100 dark:divide-white/[0.04]">
            {upcomingApts.map((apt) => {
              const isAptToday = apt.date === todayStr
              const diff = differenceInDays(parseISO(apt.date), new Date())
              return (
                <div key={apt.id} className="flex items-center gap-3 px-4 py-2.5">
                  <div className="w-0.5 h-8 rounded-full bg-teal-500 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-100 truncate">{apt.title}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      {apt.startTime && <span className="text-xs text-zinc-400 flex items-center gap-1"><Clock size={10} />{apt.startTime}</span>}
                      {apt.location && <span className="text-xs text-zinc-400 flex items-center gap-1 truncate max-w-[110px]"><MapPin size={10} />{apt.location}</span>}
                    </div>
                  </div>
                  <span className={`text-[10px] font-bold shrink-0 px-2.5 py-1 rounded-full ${isAptToday ? 'bg-teal-100 dark:bg-teal-500/20 text-teal-700 dark:text-teal-300' : 'bg-zinc-100 dark:bg-white/[0.06] text-zinc-500 dark:text-zinc-400'}`}>
                    {isAptToday ? 'Today' : diff === 1 ? 'Tomorrow' : `In ${diff}d`}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* ── Alerts ── */}
      {(overdueTasks > 0 || upcomingDates.length > 0 || pendingGifts > 0) && (
        <div className="space-y-2">
          {overdueTasks > 0 && (
            <div className="flex items-center gap-3 bg-rose-50 dark:bg-rose-500/10 rounded-2xl px-4 py-3 cursor-pointer active:scale-[0.98] transition-all border border-rose-100/60 dark:border-rose-500/20" onClick={() => navigate('/tasks')}>
              <div className="w-7 h-7 rounded-lg bg-rose-100 dark:bg-rose-500/20 flex items-center justify-center shrink-0">
                <Bell size={14} className="text-rose-500" />
              </div>
              <p className="flex-1 text-sm font-semibold text-rose-700 dark:text-rose-300">
                {overdueTasks} overdue task{overdueTasks > 1 ? 's' : ''}
              </p>
              <ArrowRight size={14} className="text-rose-400" />
            </div>
          )}
          {upcomingDates.map((d) => {
            const diff = differenceInDays(parseISO(d.date), new Date())
            return (
              <div key={d.id} className="flex items-center gap-3 bg-pink-50 dark:bg-pink-500/10 rounded-2xl px-4 py-3 cursor-pointer active:scale-[0.98] transition-all border border-pink-100/60 dark:border-pink-500/20" onClick={() => navigate('/her')}>
                <div className="w-7 h-7 rounded-lg bg-pink-100 dark:bg-pink-500/20 flex items-center justify-center shrink-0">
                  <Heart size={14} className="text-pink-500" fill="currentColor" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-pink-700 dark:text-pink-300">{d.name}</p>
                  <p className="text-xs text-pink-400">{diff === 0 ? 'Today! 🎉' : `in ${diff} day${diff > 1 ? 's' : ''}`}</p>
                </div>
                <ArrowRight size={14} className="text-pink-400" />
              </div>
            )
          })}
          {pendingGifts > 0 && (
            <div className="flex items-center gap-3 bg-violet-50 dark:bg-violet-500/10 rounded-2xl px-4 py-3 cursor-pointer active:scale-[0.98] transition-all border border-violet-100/60 dark:border-violet-500/20" onClick={() => navigate('/her')}>
              <div className="w-7 h-7 rounded-lg bg-violet-100 dark:bg-violet-500/20 flex items-center justify-center shrink-0">
                <Sparkles size={14} className="text-violet-500" />
              </div>
              <p className="flex-1 text-sm font-semibold text-violet-700 dark:text-violet-300">
                {pendingGifts} gift idea{pendingGifts > 1 ? 's' : ''} not bought yet
              </p>
              <ArrowRight size={14} className="text-violet-400" />
            </div>
          )}
        </div>
      )}
    </div>
  )
}
