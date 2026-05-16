import { format, parseISO, isBefore, startOfDay, differenceInDays, addDays } from 'date-fns'
import { CheckCircle2, Circle, ArrowRight, TrendingUp, TrendingDown, Bell, Heart, Flame, Calendar, Clock, MapPin } from 'lucide-react'
import { useStore } from '../store'
import { useNavigate } from 'react-router-dom'

function greeting() {
  const h = new Date().getHours()
  if (h < 5)  return 'Up late'
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}

function ProgressRing({ done, total, size = 56, color = '#3b82f6' }) {
  const r = (size - 8) / 2
  const circ = 2 * Math.PI * r
  const pct = total > 0 ? done / total : 0
  return (
    <svg width={size} height={size} className="-rotate-90">
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="currentColor" strokeWidth={4} className="text-zinc-100 dark:text-zinc-800" />
      <circle
        cx={size/2} cy={size/2} r={r} fill="none"
        stroke={color} strokeWidth={4}
        strokeDasharray={`${circ * pct} ${circ}`}
        strokeLinecap="round"
        style={{ transition: 'stroke-dasharray 0.5s ease' }}
      />
    </svg>
  )
}

export default function Home() {
  const { name, dailyTasks, tasks, appointments, transactions, gifts, dates, currency, habits, habitLogs } = useStore()
  const navigate = useNavigate()

  const todayStr = format(new Date(), 'yyyy-MM-dd')
  const thisMonth = format(new Date(), 'yyyy-MM')

  // Tasks
  const todayTasks = dailyTasks.filter((t) => t.date === todayStr)
  const doneTasks  = todayTasks.filter((t) => t.done).length

  // Habits today
  const habitsToday = habits.map((h) => {
    const log = habitLogs.find((l) => l.habitId === h.id && l.date === todayStr)
    return { ...h, count: log?.count ?? 0, done: (log?.count ?? 0) >= h.target }
  })
  const doneHabits = habitsToday.filter((h) => h.done).length

  // Finance
  const monthTx = transactions.filter((t) => t.date.startsWith(thisMonth))
  const monthIncome   = monthTx.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0)
  const monthExpenses = monthTx.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0)
  const saved = monthIncome - monthExpenses

  // Upcoming appointments (today + next 3 days)
  const in3Days = format(addDays(new Date(), 3), 'yyyy-MM-dd')
  const upcomingApts = (appointments ?? [])
    .filter((a) => a.date >= todayStr && a.date <= in3Days)
    .sort((a, b) => a.date.localeCompare(b.date) || a.startTime.localeCompare(b.startTime))
    .slice(0, 3)

  // Alerts
  const overdueTasks = tasks.filter(
    (t) => t.status !== 'done' && t.dueDate && isBefore(parseISO(t.dueDate), startOfDay(new Date()))
  ).length

  const upcomingDates = dates
    .filter((d) => { try { const diff = differenceInDays(parseISO(d.date), new Date()); return diff >= 0 && diff <= 14 } catch { return false } })
    .sort((a, b) => parseISO(a.date) - parseISO(b.date))

  const pendingGifts = gifts.filter((g) => !g.bought).length

  return (
    <div className="space-y-5">
      {/* ── Greeting ── */}
      <div className="pt-1">
        <p className="text-sm text-zinc-400 dark:text-zinc-500">{format(new Date(), 'EEEE, d MMMM yyyy')}</p>
        <h1 className="text-[26px] font-bold text-zinc-900 dark:text-white mt-0.5 leading-tight">
          {greeting()}, {name} 👋
        </h1>
      </div>

      {/* ── Today's overview ── */}
      <div className="grid grid-cols-2 gap-3">
        {/* Tasks card */}
        <div
          onClick={() => navigate('/tasks')}
          className="bg-blue-500 rounded-2xl p-4 cursor-pointer active:scale-[0.97] transition-all shadow-lg shadow-blue-500/25"
        >
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[11px] font-bold text-blue-100 uppercase tracking-wide">Daily Tasks</p>
              <p className="text-3xl font-bold text-white mt-1">{doneTasks}<span className="text-lg text-blue-200">/{todayTasks.length}</span></p>
              <p className="text-xs text-blue-200 mt-0.5">{todayTasks.length === 0 ? 'Add tasks' : doneTasks === todayTasks.length ? 'All done! 🎉' : `${todayTasks.length - doneTasks} left`}</p>
            </div>
            <ProgressRing done={doneTasks} total={todayTasks.length} size={52} color="rgba(255,255,255,0.9)" />
          </div>
        </div>

        {/* Habits card */}
        <div
          onClick={() => navigate('/tasks')}
          className="bg-violet-500 rounded-2xl p-4 cursor-pointer active:scale-[0.97] transition-all shadow-lg shadow-violet-500/25"
        >
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[11px] font-bold text-violet-100 uppercase tracking-wide">Habits</p>
              <p className="text-3xl font-bold text-white mt-1">{doneHabits}<span className="text-lg text-violet-200">/{habits.length}</span></p>
              <p className="text-xs text-violet-200 mt-0.5">{habits.length === 0 ? 'Set up habits' : doneHabits === habits.length ? 'Perfect day! ✨' : `${habits.length - doneHabits} remaining`}</p>
            </div>
            <ProgressRing done={doneHabits} total={habits.length} size={52} color="rgba(255,255,255,0.9)" />
          </div>
        </div>
      </div>

      {/* ── Finance snapshot ── */}
      <div
        className="bg-gradient-to-br from-white to-zinc-50 dark:from-[#161B27] dark:to-[#1A1F2E] rounded-2xl ring-1 ring-zinc-200/60 dark:ring-white/[0.06] overflow-hidden cursor-pointer active:scale-[0.98] transition-all hover:shadow-md dark:hover:shadow-blue-500/5"
        onClick={() => navigate('/finance')}
      >
        <div className="flex items-center justify-between px-4 pt-4 pb-2">
          <p className="font-semibold text-zinc-800 dark:text-zinc-100">{format(new Date(), 'MMMM')} Finance</p>
          <ArrowRight size={15} className="text-zinc-400" />
        </div>
        <div className="grid grid-cols-3 divide-x divide-zinc-100 dark:divide-zinc-800/60">
          <div className="px-3 py-3">
            <p className="text-[10px] font-bold text-emerald-500 uppercase tracking-wide flex items-center gap-1">
              <TrendingUp size={10} /> Income
            </p>
            <p className="text-lg font-bold text-zinc-900 dark:text-white mt-0.5">{currency}{monthIncome.toFixed(0)}</p>
          </div>
          <div className="px-3 py-3">
            <p className="text-[10px] font-bold text-rose-500 uppercase tracking-wide flex items-center gap-1">
              <TrendingDown size={10} /> Spent
            </p>
            <p className="text-lg font-bold text-zinc-900 dark:text-white mt-0.5">{currency}{monthExpenses.toFixed(0)}</p>
          </div>
          <div className="px-3 py-3">
            <p className={`text-[10px] font-bold uppercase tracking-wide ${saved >= 0 ? 'text-blue-500' : 'text-amber-500'}`}>Saved</p>
            <p className={`text-lg font-bold mt-0.5 ${saved >= 0 ? 'text-zinc-900 dark:text-white' : 'text-amber-500'}`}>
              {saved >= 0 ? '+' : ''}{currency}{saved.toFixed(0)}
            </p>
          </div>
        </div>
      </div>

      {/* ── Habit streaks quick view ── */}
      {habitsToday.length > 0 && (
        <div
          className="bg-gradient-to-br from-white to-zinc-50 dark:from-[#161B27] dark:to-[#1A1F2E] rounded-2xl ring-1 ring-zinc-200/60 dark:ring-white/[0.06] p-4 cursor-pointer active:scale-[0.98] transition-all hover:shadow-md dark:hover:shadow-violet-500/5"
          onClick={() => navigate('/tasks')}
        >
          <div className="flex items-center justify-between mb-3">
            <p className="font-semibold text-zinc-800 dark:text-zinc-100">Today's Habits</p>
            <span className="text-xs font-bold text-zinc-400">{doneHabits}/{habitsToday.length} done</span>
          </div>
          <div className="flex gap-2 flex-wrap">
            {habitsToday.map((h) => (
              <div key={h.id} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                h.done
                  ? 'bg-emerald-100 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-300'
                  : 'bg-zinc-100 dark:bg-zinc-800/80 text-zinc-500 dark:text-zinc-400'
              }`}>
                <span>{h.emoji}</span>
                <span>{h.name}</span>
                <span className={`font-bold ${h.done ? 'opacity-70' : 'opacity-60'}`}>{h.count}/{h.target}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Upcoming appointments ── */}
      {upcomingApts.length > 0 && (
        <div
          className="bg-gradient-to-br from-white to-zinc-50 dark:from-[#161B27] dark:to-[#1A1F2E] rounded-2xl ring-1 ring-zinc-200/60 dark:ring-white/[0.06] overflow-hidden cursor-pointer active:scale-[0.98] transition-all hover:shadow-md dark:hover:shadow-teal-500/5"
          onClick={() => navigate('/tasks')}
        >
          <div className="flex items-center justify-between px-4 pt-4 pb-2">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-teal-500/15 flex items-center justify-center">
                <Calendar size={13} className="text-teal-500" />
              </div>
              <p className="font-semibold text-zinc-800 dark:text-zinc-100">Upcoming</p>
            </div>
            <ArrowRight size={15} className="text-zinc-400" />
          </div>
          <div className="divide-y divide-zinc-100/80 dark:divide-zinc-800/60">
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
                      {apt.location && <span className="text-xs text-zinc-400 flex items-center gap-1 truncate max-w-[120px]"><MapPin size={10} />{apt.location}</span>}
                    </div>
                  </div>
                  <span className={`text-[10px] font-bold shrink-0 px-2.5 py-1 rounded-full ${isAptToday ? 'bg-teal-100 dark:bg-teal-500/20 text-teal-700 dark:text-teal-300' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400'}`}>
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
            <div
              className="flex items-center gap-3 bg-rose-50 dark:bg-rose-500/10 rounded-2xl px-4 py-3 cursor-pointer"
              onClick={() => navigate('/tasks')}
            >
              <Bell size={15} className="text-rose-500 shrink-0" />
              <p className="text-sm font-semibold text-rose-700 dark:text-rose-300">
                {overdueTasks} overdue task{overdueTasks > 1 ? 's' : ''}
              </p>
              <ArrowRight size={14} className="text-rose-400 ml-auto" />
            </div>
          )}
          {upcomingDates.map((d) => {
            const diff = differenceInDays(parseISO(d.date), new Date())
            return (
              <div
                key={d.id}
                className="flex items-center gap-3 bg-pink-50 dark:bg-pink-500/10 rounded-2xl px-4 py-3 cursor-pointer"
                onClick={() => navigate('/her')}
              >
                <Heart size={15} className="text-pink-500 shrink-0" fill="currentColor" />
                <div className="flex-1">
                  <p className="text-sm font-semibold text-pink-700 dark:text-pink-300">{d.name}</p>
                  <p className="text-xs text-pink-400">{diff === 0 ? 'Today! 🎉' : `in ${diff} day${diff > 1 ? 's' : ''}`}</p>
                </div>
                <ArrowRight size={14} className="text-pink-400" />
              </div>
            )
          })}
          {pendingGifts > 0 && (
            <div
              className="flex items-center gap-3 bg-violet-50 dark:bg-violet-500/10 rounded-2xl px-4 py-3 cursor-pointer"
              onClick={() => navigate('/her')}
            >
              <Flame size={15} className="text-violet-500 shrink-0" />
              <p className="text-sm font-semibold text-violet-700 dark:text-violet-300">
                {pendingGifts} gift idea{pendingGifts > 1 ? 's' : ''} not bought yet
              </p>
              <ArrowRight size={14} className="text-violet-400 ml-auto" />
            </div>
          )}
        </div>
      )}
    </div>
  )
}
