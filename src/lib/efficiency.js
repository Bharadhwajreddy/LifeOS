// Efficiency Engine — pure calculation functions, no React, no store imports
// All inputs are plain arrays/values.

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Format a Date as 'YYYY-MM-DD' without date-fns */
function fmtDate(d) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

/** Add `n` days to a Date (returns new Date) */
function addDays(d, n) {
  const r = new Date(d)
  r.setDate(r.getDate() + n)
  return r
}

/** Return today's date string 'YYYY-MM-DD' */
function todayStr() {
  return fmtDate(new Date())
}

/** Is dateStr in the future (strictly after today)? */
function isFuture(dateStr) {
  return dateStr > todayStr()
}

/** Round to one decimal place */
function round1(n) {
  return Math.round(n * 10) / 10
}

// ─── Task Efficiency ──────────────────────────────────────────────────────────

/**
 * Returns 0-100 or null if no tasks exist for that date.
 * Future dates always return null.
 */
export function calcDailyTaskEff(dailyTasks, dateStr) {
  if (!dailyTasks || isFuture(dateStr)) return null
  const tasks = dailyTasks.filter((t) => t.date === dateStr)
  if (tasks.length === 0) return null
  const done = tasks.filter((t) => t.done).length
  return round1((done / tasks.length) * 100)
}

// ─── Habit Efficiency ─────────────────────────────────────────────────────────

/**
 * Returns 0-100 or null if no habits exist at all.
 * Future dates always return null.
 */
export function calcDailyHabitEff(habits, habitLogs, dateStr) {
  if (!habits || habits.length === 0 || isFuture(dateStr)) return null
  let totalPct = 0
  for (const habit of habits) {
    const log = habitLogs.find((l) => l.habitId === habit.id && l.date === dateStr)
    const count = log ? log.count : 0
    const target = habit.target > 0 ? habit.target : 1
    totalPct += Math.min(count / target, 1)
  }
  return round1((totalPct / habits.length) * 100)
}

// ─── Overall Efficiency ───────────────────────────────────────────────────────

/**
 * Combines task (60%) + habit (40%).
 * If only one exists, uses that alone (100% weight).
 * Returns 0-100 or null if both are null.
 */
export function calcDailyOverallEff(dailyTasks, habits, habitLogs, dateStr) {
  const taskEff  = calcDailyTaskEff(dailyTasks, dateStr)
  const habitEff = calcDailyHabitEff(habits, habitLogs, dateStr)

  if (taskEff === null && habitEff === null) return null
  if (taskEff === null) return habitEff
  if (habitEff === null) return taskEff
  return round1(taskEff * 0.6 + habitEff * 0.4)
}

// ─── Weekly Efficiency ────────────────────────────────────────────────────────

/**
 * Returns { avg: number|null, days: [{date, taskEff, habitEff, overall}] }
 * weekStartDate is a Date object (Monday of week).
 * Only includes days up to today.
 */
export function calcWeeklyEff(dailyTasks, habits, habitLogs, weekStartDate) {
  const days = []
  const today = todayStr()

  for (let i = 0; i < 7; i++) {
    const d    = addDays(weekStartDate, i)
    const date = fmtDate(d)
    if (date > today) break // don't include future days

    const taskEff  = calcDailyTaskEff(dailyTasks, date)
    const habitEff = calcDailyHabitEff(habits, habitLogs, date)
    const overall  = calcDailyOverallEff(dailyTasks, habits, habitLogs, date)
    days.push({ date, taskEff, habitEff, overall })
  }

  const withData = days.filter((d) => d.overall !== null)
  const avg = withData.length === 0
    ? null
    : round1(withData.reduce((s, d) => s + d.overall, 0) / withData.length)

  return { avg, days }
}

// ─── Monthly Efficiency ───────────────────────────────────────────────────────

/**
 * Returns { avg: number|null, trend: 'improving'|'declining'|'stable'|null, weeks: [...] }
 * year = e.g. 2026, month = 0-indexed (0=Jan, 11=Dec)
 * weeks is an array of calcWeeklyEff results (each week starting on Monday).
 */
export function calcMonthlyEff(dailyTasks, habits, habitLogs, year, month) {
  // Collect all days in the month that are not in the future
  const today = todayStr()
  const firstDay = new Date(year, month, 1)
  const lastDay  = new Date(year, month + 1, 0) // last day of month

  // Find the Monday on or before the first day of the month
  const dayOfWeek = firstDay.getDay() // 0=Sun, 1=Mon...
  const daysBack  = dayOfWeek === 0 ? 6 : dayOfWeek - 1
  let weekStart   = addDays(firstDay, -daysBack)

  const weeks = []

  // Keep generating weeks until the week start is past the last day of the month
  while (fmtDate(weekStart) <= fmtDate(lastDay)) {
    const week = calcWeeklyEff(dailyTasks, habits, habitLogs, weekStart)
    // Only include weeks that overlap with this month and have at least one day
    if (week.days.length > 0) {
      weeks.push(week)
    }
    weekStart = addDays(weekStart, 7)
  }

  const weeksWithData = weeks.filter((w) => w.avg !== null)
  const avg = weeksWithData.length === 0
    ? null
    : round1(weeksWithData.reduce((s, w) => s + w.avg, 0) / weeksWithData.length)

  // Trend: compare first half vs second half of weeks with data
  let trend = null
  if (weeksWithData.length >= 2) {
    const half    = Math.floor(weeksWithData.length / 2)
    const firstHalf  = weeksWithData.slice(0, half)
    const secondHalf = weeksWithData.slice(-half)
    const firstAvg   = firstHalf.reduce((s, w) => s + w.avg, 0) / firstHalf.length
    const secondAvg  = secondHalf.reduce((s, w) => s + w.avg, 0) / secondHalf.length
    const diff = secondAvg - firstAvg
    if (diff > 3)       trend = 'improving'
    else if (diff < -3) trend = 'declining'
    else                trend = 'stable'
  }

  return { avg, trend, weeks }
}

// ─── Last 30 Days ─────────────────────────────────────────────────────────────

/**
 * Returns the last 30 days (today inclusive) of daily efficiency for charting.
 * Returns [{date, overall, taskEff, habitEff}]
 */
export function calcLast30Days(dailyTasks, habits, habitLogs) {
  const today = new Date()
  const result = []

  for (let i = 29; i >= 0; i--) {
    const d    = addDays(today, -i)
    const date = fmtDate(d)
    const taskEff  = calcDailyTaskEff(dailyTasks, date)
    const habitEff = calcDailyHabitEff(habits, habitLogs, date)
    const overall  = calcDailyOverallEff(dailyTasks, habits, habitLogs, date)
    result.push({ date, overall, taskEff, habitEff })
  }

  return result
}

// ─── Task Streak ──────────────────────────────────────────────────────────────

/**
 * Returns the current task completion streak:
 * consecutive days (going back from yesterday) where overall >= 50%.
 * Today is not included (it may not be over yet).
 */
export function calcTaskStreak(dailyTasks) {
  if (!dailyTasks || dailyTasks.length === 0) return 0

  let streak = 0
  const today = new Date()

  // Start from yesterday and go back
  for (let i = 1; i <= 365; i++) {
    const d    = addDays(today, -i)
    const date = fmtDate(d)
    const tasks = dailyTasks.filter((t) => t.date === date)
    if (tasks.length === 0) break

    const done = tasks.filter((t) => t.done).length
    const pct  = (done / tasks.length) * 100
    if (pct >= 50) {
      streak++
    } else {
      break
    }
  }

  return streak
}

// ─── Best Habit Streak ────────────────────────────────────────────────────────

/**
 * Returns the best single-habit streak across all habits.
 * A day counts if count >= habit.target.
 * Mirrors the logic in store.getHabitStreak but pure.
 */
export function calcBestHabitStreak(habits, habitLogs) {
  if (!habits || habits.length === 0) return 0

  let best = 0

  for (const habit of habits) {
    let streak = 0
    const today = new Date()

    for (let i = 1; i <= 365; i++) {
      const d    = addDays(today, -i)
      const date = fmtDate(d)
      const log  = habitLogs.find((l) => l.habitId === habit.id && l.date === date)
      if (log && log.count >= habit.target) {
        streak++
      } else {
        break
      }
    }

    if (streak > best) best = streak
  }

  return best
}
