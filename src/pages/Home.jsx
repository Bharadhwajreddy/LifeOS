import { format, parseISO, isBefore, startOfDay, differenceInDays, addDays } from 'date-fns'
import { ArrowRight, TrendingUp, TrendingDown, Bell, Heart, Flame, Calendar, Clock, MapPin, CheckSquare, Sparkles } from 'lucide-react'
import { useStore } from '../store'
import { useNavigate } from 'react-router-dom'

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

const infoCardStyle = {
  background: 'var(--surface)',
  border: '1px solid var(--card-border)',
  borderRadius: 'var(--card-radius)',
  boxShadow: 'var(--shadow-md)',
  backdropFilter: 'var(--backdrop)',
  WebkitBackdropFilter: 'var(--backdrop)',
}

export default function Home() {
  const { name, dailyTasks, tasks, appointments, transactions, gifts, dates, currency, habits, habitLogs } = useStore()
  const navigate = useNavigate()

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
          <p style={{ color: 'var(--text-3)', fontFamily: 'var(--font-sans)' }} className="text-sm">
            {format(new Date(), 'EEEE, d MMMM yyyy')}
          </p>
          <h1 style={{ color: 'var(--text)', fontFamily: 'var(--font-sans)' }} className="text-[26px] font-bold mt-0.5 leading-tight">
            {greeting()}, {name} 👋
          </h1>
        </div>
        <div style={{ background: 'var(--grad-tasks)' }} className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-lg mt-1 shrink-0">
          {name?.[0]?.toUpperCase() ?? 'U'}
        </div>
      </div>

      {/* ── Today at a Glance — 3 stat cards ── */}
      <div>
        <p style={{ color: 'var(--text-3)', fontFamily: 'var(--font-sans)' }} className="text-[11px] font-bold uppercase tracking-widest mb-3">Today at a glance</p>
        <div className="grid grid-cols-3 gap-2.5">

          {/* Tasks */}
          <div
            onClick={() => navigate('/tasks')}
            style={{ background: 'var(--grad-tasks)', borderRadius: 'var(--card-radius)' }}
            className="relative overflow-hidden p-3.5 cursor-pointer active:scale-[0.97] transition-all shadow-lg"
          >
            <span className="absolute -right-2 -bottom-2 text-6xl opacity-[0.15] select-none pointer-events-none">✅</span>
            <ProgressRing done={doneTasks} total={todayTasks.length} size={40} />
            <p style={{ color: '#fff' }} className="text-xl font-bold mt-2">
              {doneTasks}<span style={{ color: 'rgba(255,255,255,0.6)' }} className="text-sm">/{todayTasks.length}</span>
            </p>
            <p style={{ color: 'rgba(255,255,255,0.8)' }} className="text-[10px] font-bold uppercase tracking-wide mt-0.5">Tasks</p>
          </div>

          {/* Habits */}
          <div
            onClick={() => navigate('/tasks')}
            style={{ background: 'var(--grad-habits)', borderRadius: 'var(--card-radius)' }}
            className="relative overflow-hidden p-3.5 cursor-pointer active:scale-[0.97] transition-all shadow-lg"
          >
            <span className="absolute -right-2 -bottom-2 text-6xl opacity-[0.15] select-none pointer-events-none">🔥</span>
            <ProgressRing done={doneHabits} total={habits.length} size={40} />
            <p style={{ color: '#fff' }} className="text-xl font-bold mt-2">
              {doneHabits}<span style={{ color: 'rgba(255,255,255,0.6)' }} className="text-sm">/{habits.length}</span>
            </p>
            <p style={{ color: 'rgba(255,255,255,0.8)' }} className="text-[10px] font-bold uppercase tracking-wide mt-0.5">Habits</p>
          </div>

          {/* Finance */}
          <div
            onClick={() => navigate('/finance')}
            style={{ background: 'var(--grad-finance)', borderRadius: 'var(--card-radius)' }}
            className="relative overflow-hidden p-3.5 cursor-pointer active:scale-[0.97] transition-all shadow-lg"
          >
            <span className="absolute -right-2 -bottom-2 text-6xl opacity-[0.15] select-none pointer-events-none">💰</span>
            <div className="w-10 h-10 flex items-center justify-center">
              <TrendingUp size={22} color="#fff" strokeWidth={2} />
            </div>
            <p style={{ color: '#fff' }} className="text-xl font-bold mt-2">
              {currency}{Math.abs(saved).toFixed(0)}
            </p>
            <p style={{ color: 'rgba(255,255,255,0.8)' }} className="text-[10px] font-bold uppercase tracking-wide mt-0.5">Saved</p>
          </div>
        </div>
      </div>

      {/* ── Finance detail card ── */}
      <div
        onClick={() => navigate('/finance')}
        style={infoCardStyle}
        className="relative overflow-hidden p-4 cursor-pointer active:scale-[0.98] transition-all"
      >
        <span className="absolute right-3 top-3 text-5xl opacity-[0.08] select-none pointer-events-none">📊</span>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div style={{ background: 'var(--accent-2-soft)', borderRadius: 'var(--radius-sm)' }} className="w-7 h-7 flex items-center justify-center">
              <TrendingUp size={14} style={{ color: 'var(--accent-2)' }} />
            </div>
            <p style={{ color: 'var(--text)', fontFamily: 'var(--font-sans)' }} className="text-sm font-semibold">
              {format(new Date(), 'MMMM')} Finance
            </p>
          </div>
          <ArrowRight size={14} style={{ color: 'var(--text-3)' }} />
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wide flex items-center gap-1" style={{ color: 'var(--success)' }}>
              <TrendingUp size={9} />Income
            </p>
            <p style={{ color: 'var(--text)', fontFamily: 'var(--font-sans)' }} className="text-lg font-bold mt-0.5">
              {currency}{monthIncome.toFixed(0)}
            </p>
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wide flex items-center gap-1" style={{ color: 'var(--danger)' }}>
              <TrendingDown size={9} />Spent
            </p>
            <p style={{ color: 'var(--text)', fontFamily: 'var(--font-sans)' }} className="text-lg font-bold mt-0.5">
              {currency}{monthExpenses.toFixed(0)}
            </p>
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wide" style={{ color: saved >= 0 ? 'var(--accent)' : 'var(--warning)' }}>
              Saved
            </p>
            <p style={{ color: saved >= 0 ? 'var(--text)' : 'var(--warning)', fontFamily: 'var(--font-sans)' }} className="text-lg font-bold mt-0.5">
              {saved >= 0 ? '+' : ''}{currency}{saved.toFixed(0)}
            </p>
          </div>
        </div>
      </div>

      {/* ── Habits quick view ── */}
      {habitsToday.length > 0 && (
        <div
          onClick={() => navigate('/tasks')}
          style={infoCardStyle}
          className="relative overflow-hidden p-4 cursor-pointer active:scale-[0.98] transition-all"
        >
          <span className="absolute right-3 top-3 text-5xl opacity-[0.08] select-none pointer-events-none">🏆</span>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div style={{ background: 'var(--lavender-soft)', borderRadius: 'var(--radius-sm)' }} className="w-7 h-7 flex items-center justify-center">
                <Flame size={14} style={{ color: 'var(--lavender)' }} />
              </div>
              <p style={{ color: 'var(--text)', fontFamily: 'var(--font-sans)' }} className="text-sm font-semibold">Habits</p>
            </div>
            <span style={{ color: 'var(--text-3)', fontFamily: 'var(--font-sans)' }} className="text-xs font-bold">
              {doneHabits}/{habitsToday.length} done
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {habitsToday.map((h) => (
              <div
                key={h.id}
                style={h.done
                  ? { background: 'var(--accent-2-soft)', color: 'var(--accent-2)', borderRadius: 'var(--radius-pill)' }
                  : { background: 'var(--surface-3)', color: 'var(--text-3)', borderRadius: 'var(--radius-pill)' }
                }
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold transition-all"
              >
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
          style={infoCardStyle}
          className="relative overflow-hidden cursor-pointer active:scale-[0.98] transition-all"
        >
          <span className="absolute right-3 top-3 text-5xl opacity-[0.08] select-none pointer-events-none">📅</span>
          <div className="flex items-center justify-between px-4 pt-4 pb-2">
            <div className="flex items-center gap-2">
              <div style={{ background: 'var(--accent-2-soft)', borderRadius: 'var(--radius-sm)' }} className="w-7 h-7 flex items-center justify-center">
                <Calendar size={13} style={{ color: 'var(--accent-2)' }} />
              </div>
              <p style={{ color: 'var(--text)', fontFamily: 'var(--font-sans)' }} className="text-sm font-semibold">Upcoming</p>
            </div>
            <ArrowRight size={14} style={{ color: 'var(--text-3)' }} />
          </div>
          <div style={{ borderTop: '1px solid var(--divider)' }}>
            {upcomingApts.map((apt) => {
              const isAptToday = apt.date === todayStr
              const diff = differenceInDays(parseISO(apt.date), new Date())
              return (
                <div key={apt.id} style={{ borderBottom: '1px solid var(--divider)' }} className="flex items-center gap-3 px-4 py-2.5 last:border-b-0">
                  <div style={{ background: 'var(--accent-2)' }} className="w-0.5 h-8 rounded-full shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p style={{ color: 'var(--text)', fontFamily: 'var(--font-sans)' }} className="text-sm font-semibold truncate">{apt.title}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      {apt.startTime && (
                        <span style={{ color: 'var(--text-3)' }} className="text-xs flex items-center gap-1">
                          <Clock size={10} />{apt.startTime}
                        </span>
                      )}
                      {apt.location && (
                        <span style={{ color: 'var(--text-3)' }} className="text-xs flex items-center gap-1 truncate max-w-[110px]">
                          <MapPin size={10} />{apt.location}
                        </span>
                      )}
                    </div>
                  </div>
                  <span
                    style={isAptToday
                      ? { background: 'var(--accent-2-soft)', color: 'var(--accent-2)', borderRadius: 'var(--radius-pill)' }
                      : { background: 'var(--surface-3)', color: 'var(--text-3)', borderRadius: 'var(--radius-pill)' }
                    }
                    className="text-[10px] font-bold shrink-0 px-2.5 py-1"
                  >
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
              onClick={() => navigate('/tasks')}
              style={{ background: 'var(--warm-soft)', border: '1px solid var(--warm)', borderRadius: 'var(--card-radius)' }}
              className="flex items-center gap-3 px-4 py-3 cursor-pointer active:scale-[0.98] transition-all"
            >
              <div style={{ background: 'var(--warm-soft)', borderRadius: 'var(--radius-sm)' }} className="w-7 h-7 flex items-center justify-center shrink-0">
                <Bell size={14} style={{ color: 'var(--warm)' }} />
              </div>
              <p style={{ color: 'var(--warm)', fontFamily: 'var(--font-sans)' }} className="flex-1 text-sm font-semibold">
                {overdueTasks} overdue task{overdueTasks > 1 ? 's' : ''}
              </p>
              <ArrowRight size={14} style={{ color: 'var(--warm)' }} />
            </div>
          )}
          {upcomingDates.map((d) => {
            const diff = differenceInDays(parseISO(d.date), new Date())
            return (
              <div
                key={d.id}
                onClick={() => navigate('/her')}
                style={{ background: 'var(--lavender-soft)', border: '1px solid var(--lavender)', borderRadius: 'var(--card-radius)' }}
                className="flex items-center gap-3 px-4 py-3 cursor-pointer active:scale-[0.98] transition-all"
              >
                <div style={{ background: 'var(--lavender-soft)', borderRadius: 'var(--radius-sm)' }} className="w-7 h-7 flex items-center justify-center shrink-0">
                  <Heart size={14} style={{ color: 'var(--lavender)' }} fill="currentColor" />
                </div>
                <div className="flex-1">
                  <p style={{ color: 'var(--lavender)', fontFamily: 'var(--font-sans)' }} className="text-sm font-semibold">{d.name}</p>
                  <p style={{ color: 'var(--lavender)' }} className="text-xs opacity-70">
                    {diff === 0 ? 'Today! 🎉' : `in ${diff} day${diff > 1 ? 's' : ''}`}
                  </p>
                </div>
                <ArrowRight size={14} style={{ color: 'var(--lavender)' }} />
              </div>
            )
          })}
          {pendingGifts > 0 && (
            <div
              onClick={() => navigate('/her')}
              style={{ background: 'var(--accent-soft)', border: '1px solid var(--accent)', borderRadius: 'var(--card-radius)' }}
              className="flex items-center gap-3 px-4 py-3 cursor-pointer active:scale-[0.98] transition-all"
            >
              <div style={{ background: 'var(--accent-soft)', borderRadius: 'var(--radius-sm)' }} className="w-7 h-7 flex items-center justify-center shrink-0">
                <Sparkles size={14} style={{ color: 'var(--accent)' }} />
              </div>
              <p style={{ color: 'var(--accent)', fontFamily: 'var(--font-sans)' }} className="flex-1 text-sm font-semibold">
                {pendingGifts} gift idea{pendingGifts > 1 ? 's' : ''} not bought yet
              </p>
              <ArrowRight size={14} style={{ color: 'var(--accent)' }} />
            </div>
          )}
        </div>
      )}
    </div>
  )
}
