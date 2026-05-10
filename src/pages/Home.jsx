import { format, parseISO, isBefore, startOfDay, differenceInDays } from 'date-fns'
import { CheckCircle2, Circle, Wallet, Heart, TrendingUp, Bell, TrendingDown } from 'lucide-react'
import { useStore } from '../store'
import { Card } from '../components/UI'
import { useNavigate } from 'react-router-dom'

function greeting() {
  const h = new Date().getHours()
  if (h < 5) return 'Up late'
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}

export default function Home() {
  const { name, dailyTasks, tasks, transactions, gifts, dates, currency } = useStore()
  const navigate = useNavigate()

  const todayStr = format(new Date(), 'yyyy-MM-dd')
  const thisMonth = format(new Date(), 'yyyy-MM')

  const todayTasks = dailyTasks.filter((t) => t.date === todayStr)
  const doneCount = todayTasks.filter((t) => t.done).length
  const progress = todayTasks.length ? (doneCount / todayTasks.length) * 100 : 0

  const monthIncome = transactions
    .filter((t) => t.type === 'income' && t.date.startsWith(thisMonth))
    .reduce((s, t) => s + t.amount, 0)
  const monthExpenses = transactions
    .filter((t) => t.type === 'expense' && t.date.startsWith(thisMonth))
    .reduce((s, t) => s + t.amount, 0)
  const saved = monthIncome - monthExpenses

  const overdueTasks = tasks.filter(
    (t) => t.status !== 'done' && t.dueDate && isBefore(parseISO(t.dueDate), startOfDay(new Date()))
  ).length

  const upcomingDates = dates
    .filter((d) => {
      try {
        const diff = differenceInDays(parseISO(d.date), new Date())
        return diff >= 0 && diff <= 14
      } catch { return false }
    })
    .sort((a, b) => parseISO(a.date) - parseISO(b.date))

  const pendingGifts = gifts.filter((g) => !g.bought).length

  return (
    <div className="space-y-5">
      {/* Greeting */}
      <div className="pt-1">
        <p className="text-sm text-zinc-400 dark:text-zinc-500">{format(new Date(), 'EEEE, d MMMM')}</p>
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-white mt-0.5">
          {greeting()}, {name} 👋
        </h1>
      </div>

      {/* Today's tasks */}
      <Card
        className="p-4 cursor-pointer active:scale-[0.98] transition-transform"
        onClick={() => navigate('/tasks')}
      >
        <div className="flex items-center justify-between mb-3">
          <p className="font-semibold text-zinc-800 dark:text-zinc-100">Today's Tasks</p>
          <span className="text-xs font-medium text-zinc-400 bg-zinc-100 dark:bg-zinc-700 px-2 py-0.5 rounded-full">
            {doneCount}/{todayTasks.length}
          </span>
        </div>
        {todayTasks.length === 0 ? (
          <p className="text-sm text-zinc-400">No tasks today — tap to add some</p>
        ) : (
          <>
            <div className="space-y-2 mb-3">
              {todayTasks.slice(0, 4).map((t) => (
                <div key={t.id} className="flex items-center gap-2.5">
                  {t.done
                    ? <CheckCircle2 size={16} className="text-green-500 shrink-0" />
                    : <Circle size={16} className="text-zinc-300 dark:text-zinc-600 shrink-0" />}
                  <span className={`text-sm leading-tight ${t.done ? 'line-through text-zinc-400' : 'text-zinc-700 dark:text-zinc-200'}`}>
                    {t.text}
                  </span>
                </div>
              ))}
              {todayTasks.length > 4 && (
                <p className="text-xs text-zinc-400 pl-6">+{todayTasks.length - 4} more</p>
              )}
            </div>
            <div className="bg-zinc-100 dark:bg-zinc-700/60 rounded-full h-1.5 overflow-hidden">
              <div
                className="h-full rounded-full bg-blue-500 transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
          </>
        )}
      </Card>

      {/* Finance snapshot */}
      <Card
        className="p-4 cursor-pointer active:scale-[0.98] transition-transform"
        onClick={() => navigate('/finance')}
      >
        <div className="flex items-center gap-2 mb-3">
          <Wallet size={15} className="text-zinc-400" />
          <p className="font-semibold text-zinc-800 dark:text-zinc-100">
            {format(new Date(), 'MMMM')} Finance
          </p>
        </div>
        <div className="grid grid-cols-3 gap-2 mb-2">
          <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-2.5">
            <p className="text-[10px] font-medium text-green-600 dark:text-green-400">Income</p>
            <p className="text-base font-bold text-green-700 dark:text-green-300 mt-0.5">{currency}{monthIncome.toFixed(0)}</p>
          </div>
          <div className="bg-red-50 dark:bg-red-900/20 rounded-xl p-2.5">
            <p className="text-[10px] font-medium text-red-600 dark:text-red-400">Spent</p>
            <p className="text-base font-bold text-red-700 dark:text-red-300 mt-0.5">{currency}{monthExpenses.toFixed(0)}</p>
          </div>
          <div className={`rounded-xl p-2.5 ${saved >= 0 ? 'bg-blue-50 dark:bg-blue-900/20' : 'bg-orange-50 dark:bg-orange-900/20'}`}>
            <p className={`text-[10px] font-medium ${saved >= 0 ? 'text-blue-600 dark:text-blue-400' : 'text-orange-600 dark:text-orange-400'}`}>Saved</p>
            <p className={`text-base font-bold mt-0.5 ${saved >= 0 ? 'text-blue-700 dark:text-blue-300' : 'text-orange-700 dark:text-orange-300'}`}>
              {saved >= 0 ? '+' : ''}{currency}{saved.toFixed(0)}
            </p>
          </div>
        </div>
      </Card>

      {/* Alerts */}
      {(overdueTasks > 0 || upcomingDates.length > 0 || pendingGifts > 0) && (
        <div className="space-y-2">
          {overdueTasks > 0 && (
            <div
              className="flex items-center gap-3 bg-red-50 dark:bg-red-900/20 rounded-2xl px-4 py-3 cursor-pointer"
              onClick={() => navigate('/tasks')}
            >
              <Bell size={16} className="text-red-500 shrink-0" />
              <p className="text-sm font-medium text-red-700 dark:text-red-300">
                {overdueTasks} overdue task{overdueTasks > 1 ? 's' : ''}
              </p>
            </div>
          )}
          {upcomingDates.map((d) => {
            const diff = differenceInDays(parseISO(d.date), new Date())
            return (
              <div
                key={d.id}
                className="flex items-center gap-3 bg-pink-50 dark:bg-pink-900/20 rounded-2xl px-4 py-3 cursor-pointer"
                onClick={() => navigate('/her')}
              >
                <Heart size={16} className="text-pink-500 shrink-0" fill="currentColor" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-pink-700 dark:text-pink-300">{d.name}</p>
                  <p className="text-xs text-pink-400">
                    {diff === 0 ? 'Today! 🎉' : `in ${diff} day${diff > 1 ? 's' : ''}`}
                  </p>
                </div>
              </div>
            )
          })}
          {pendingGifts > 0 && (
            <div
              className="flex items-center gap-3 bg-purple-50 dark:bg-purple-900/20 rounded-2xl px-4 py-3 cursor-pointer"
              onClick={() => navigate('/her')}
            >
              <Heart size={16} className="text-purple-500 shrink-0" />
              <p className="text-sm font-medium text-purple-700 dark:text-purple-300">
                {pendingGifts} gift idea{pendingGifts > 1 ? 's' : ''} not bought yet
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
