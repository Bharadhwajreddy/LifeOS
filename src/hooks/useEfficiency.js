import { useMemo } from 'react'
import { useStore } from '../store'
import { format, startOfWeek, startOfMonth } from 'date-fns'
import {
  calcDailyOverallEff,
  calcWeeklyEff,
  calcMonthlyEff,
  calcLast30Days,
  calcTaskStreak,
  calcBestHabitStreak,
  calcDailyTaskEff,
  calcDailyHabitEff,
} from '../lib/efficiency'

export function useEfficiency() {
  const { dailyTasks, habits, habitLogs } = useStore()
  const today = format(new Date(), 'yyyy-MM-dd')
  const now = new Date()

  return useMemo(() => {
    const todayTaskEff  = calcDailyTaskEff(dailyTasks, today)
    const todayHabitEff = calcDailyHabitEff(habits, habitLogs, today)
    const todayOverall  = calcDailyOverallEff(dailyTasks, habits, habitLogs, today)

    const weekStart = startOfWeek(now, { weekStartsOn: 1 }) // Monday
    const weekly    = calcWeeklyEff(dailyTasks, habits, habitLogs, weekStart)

    const monthly   = calcMonthlyEff(dailyTasks, habits, habitLogs, now.getFullYear(), now.getMonth())

    const last30    = calcLast30Days(dailyTasks, habits, habitLogs)

    const taskStreak      = calcTaskStreak(dailyTasks)
    const bestHabitStreak = calcBestHabitStreak(habits, habitLogs)

    return {
      today: { taskEff: todayTaskEff, habitEff: todayHabitEff, overall: todayOverall },
      weekly,
      monthly,
      last30,
      taskStreak,
      bestHabitStreak,
    }
  }, [dailyTasks, habits, habitLogs, today])
}
