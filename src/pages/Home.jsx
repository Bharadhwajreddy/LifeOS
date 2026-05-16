import { format, parseISO, isBefore, startOfDay, differenceInDays, addDays } from 'date-fns'
import { CheckCircle2, ArrowRight, TrendingUp, TrendingDown, Bell, Heart, Flame, Calendar, Clock, MapPin } from 'lucide-react'
import { useStore } from '../store'
import { useNavigate } from 'react-router-dom'

function greeting() {
  const h = new Date().getHours()
  if (h < 5)  return 'Up late'
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}

function ProgressRing({ done, total, size = 40, color = '#3b82f6' }) {
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
    .sort((a, b) => a.date.localeCompare(b.date) || (a.startTime ?? '').localeCompare(b.startTime ?? ''))
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

      {/* ── Section 1: Header (greeting) ── */}
      <div className="flex items-start justify-between pt-1">
        <div>
          <p className="text-sm text-zinc-400 dark:text-zinc-500">{format(new Date(), 'EEEE, d MMMM yyyy')}</p>
          <h1 className="text-[26px] font-bold text-zinc-900 dark:text-[#E6EAF2] mt-0.5 leading-tight">
            {greeting()}, {name} 👋
          </h1>
        </div>
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-violet-500 flex items-center justify-center text-white font-bold text-sm shadow-lg mt-1 shrink-0">
          {name?.[0]?.toUpperCase() ?? 'U'}
        </div>
      </div>

      {/* ── Section 2: Today at a Glance — 3 stat cards ── */}
      <div>
        <p className="text-[11px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest mb-3">Today at a glance</p>
        <div className="grid grid-cols-3 gap-2.5">
          {/* Tasks card — blue */}
          <div onClick={() => navigate('/tasks')} className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-3.5 cursor-pointer active:scale-[0.97] transition-all shadow-lg shadow-blue-500/25">
            <ProgressRing done={doneTasks} total={todayTasks.length} size={40} color="rgba(255,255,255,0.9)" />
            <p className="text-xl font-bold text-white mt-2">{doneTasks}<span className="text-sm text-blue-200">/{todayTasks.length}</span></p>
            <p className="text-[10px] font-bold text-blue-100 uppercase tracking-wide mt-0.5">Tasks</p>
          </div>
          {/* Habits card — violet */}
          <div onClick={() => navigate('/tasks')} className="bg-gradient-to-br from-violet-500 to-purple-600 rounded-2xl p-3.5 cursor-pointer active:scale-[0.97] transition-all shadow-lg shadow-violet-500/25">
            <ProgressRing done={doneHabits} total={habits.length} size={40} color="rgba(255,255,255,0.9)" />
            <p className="text-xl font-bold text-white mt-2">{doneHabits}<span className="text-sm text-violet-200">/{habits.length}</span></p>
            <p className="text-[10px] font-bold text-violet-100 uppercase tracking-wide mt-0.5">Habits</p>
          </div>
          {/* Finance card — teal */}
          <div onClick={() => navigate('/finance')} className="bg-gradient-to-br from-teal-500 to-emerald-600 rounded-2xl p-3.5 cursor-pointer active:scale-[0.97] transition-all shadow-lg shadow-teal-500/25">
            <div className="w-10 h-10 flex items-center justify-center">
              <TrendingUp size={20} className="text-white" />
            </div>
            <p className="text-xl font-bold text-white mt-2">{currency}{saved >= 0 ? saved.toFixed(0) : (saved * -1).toFixed(0)}</p>
            <p className="text-[10px] font-bold text-teal-100 uppercase tracking-wide mt-0.5">Saved</p>
          </div>
        </div>
      </div>

      {/* ── Section 3: Finance Card ── */}
      <div onClick={() => navigate('/finance')} className="bg-white dark:bg-[#151C2A] rounded-2xl p-4 border border-zinc-100 dark:border-white/[0.06] shadow-[0_8px_24px_rgba(15,23,42,0.06)] dark:shadow-[0_8px_24px_rgba(0,0,0,0.35)] cursor-pointer active:scale-[0.98] transition-all">
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-semibold text-zinc-800 dark:text-[#E6EAF2]">{format(new Date(), 'MMMM')} Finance</p>
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

      {/* ── Section 4: Habits quick view (only if habits exist) ── */}
      {habitsToday.length > 0 && (
        <div onClick={() => navigate('/tasks')} className="bg-white dark:bg-[#151C2A] rounded-2xl p-4 border border-zinc-100 dark:border-white/[0.06] shadow-[0_8px_24px_rgba(15,23,42,0.06)] dark:shadow-[0_8px_24px_rgba(0,0,0,0.35)] cursor-pointer active:scale-[0.98] transition-all">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-semibold text-zinc-800 dark:text-[#E6EAF2]">Habits</p>
            <span className="text-xs font-bold text-zinc-400">{doneHabits}/{habitsToday.length}</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {habitsToday.map((h) => (
              <div key={h.id} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                h.done ? 'bg-emerald-100 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-300' : 'bg-zinc-100 dark:bg-white/[0.06] text-zinc-500 dark:text-zinc-400'
              }`}>
                <span>{h.emoji}</span>
                <span>{h.name}</span>
                <span className="opacity-60 font-bold">{h.count}/{h.target}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Section 5: Upcoming Appointments (only if any) ── */}
      {upcomingApts.length > 0 && (
        <div onClick={() => navigate('/tasks')} className="bg-white dark:bg-[#151C2A] rounded-2xl border border-zinc-100 dark:border-white/[0.06] shadow-[0_8px_24px_rgba(15,23,42,0.06)] dark:shadow-[0_8px_24px_rgba(0,0,0,0.35)] overflow-hidden cursor-pointer active:scale-[0.98] transition-all">
          <div className="flex items-center justify-between px-4 pt-4 pb-2">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-teal-500/15 dark:bg-teal-500/20 flex items-center justify-center">
                <Calendar size={13} className="text-teal-500" />
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
                      {apt.location && <span className="text-xs text-zinc-400 flex items-center gap-1 truncate max-w-[120px]"><MapPin size={10} />{apt.location}</span>}
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

      {/* ── Section 6: Alerts ── */}
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
