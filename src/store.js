import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { format, subDays } from 'date-fns'
import { SEED_TRANSACTIONS } from './lib/seedData'

const today = () => format(new Date(), 'yyyy-MM-dd')

const SEED_HABITS = [
  { id: 'hab1', name: 'Brush Teeth', target: 2, emoji: '🦷', color: 'blue' },
  { id: 'hab2', name: 'Exercise',    target: 1, emoji: '💪', color: 'green' },
  { id: 'hab3', name: 'Drink Water', target: 8, emoji: '💧', color: 'cyan' },
  { id: 'hab4', name: 'Read',        target: 1, emoji: '📚', color: 'purple' },
  { id: 'hab5', name: 'Meditate',    target: 1, emoji: '🧘', color: 'amber' },
]

export const useStore = create(
  persist(
    (set, get) => ({
      name: 'Bharadhwaj',
      darkMode: true,
      theme: 'glass',
      currency: '€',

      // ── Income sources ───────────────────────────────────────────────────────
      incomeSources: ['Lumileds', 'Hexenhof', 'Tips', 'Other'],
      addIncomeSource: (name) => set((s) => ({
        incomeSources: s.incomeSources.includes(name) ? s.incomeSources : [...s.incomeSources, name],
      })),
      renameIncomeSource: (oldName, newName) => set((s) => ({
        incomeSources: s.incomeSources.map((n) => n === oldName ? newName : n),
        transactions: s.transactions.map((t) =>
          t.type === 'income' && t.category === oldName ? { ...t, category: newName } : t
        ),
      })),
      deleteIncomeSource: (name) => set((s) => ({
        incomeSources: s.incomeSources.filter((n) => n !== name),
      })),

      // ── Expense categories ───────────────────────────────────────────────────
      expenseCategories: [
        'Rent', 'Insurance', 'Phone', 'Groceries', 'India Transfer',
        'Transport', 'Entertainment', 'Mutual Funds', 'Health', 'Education', 'Bank Fees', 'Other',
      ],
      addExpenseCategory: (name) => set((s) => ({
        expenseCategories: s.expenseCategories.includes(name) ? s.expenseCategories : [...s.expenseCategories, name],
      })),
      renameExpenseCategory: (oldName, newName) => set((s) => {
        // also migrate budget key so budget bars don't break
        const newBudgets = { ...s.budgets }
        if (newBudgets[oldName] !== undefined) {
          newBudgets[newName] = newBudgets[oldName]
          delete newBudgets[oldName]
        }
        return {
          expenseCategories: s.expenseCategories.map((n) => n === oldName ? newName : n),
          transactions: s.transactions.map((t) =>
            t.type === 'expense' && t.category === oldName ? { ...t, category: newName } : t
          ),
          budgets: newBudgets,
        }
      }),
      deleteExpenseCategory: (name) => set((s) => ({
        expenseCategories: s.expenseCategories.filter((n) => n !== name),
      })),

      // ── Daily tasks ──────────────────────────────────────────────────────────
      dailyTasks: [],
      // Accepts a full task object OR a plain string for backwards compatibility
      addDailyTask: (task) => set((s) => {
        const obj = typeof task === 'string'
          ? { text: task, date: today(), priority: 'med', notes: '', dueTime: '' }
          : { text: task.text, date: task.date || today(), priority: task.priority || 'med', notes: task.notes || '', dueTime: task.dueTime || '' }
        return { dailyTasks: [...s.dailyTasks, { id: crypto.randomUUID(), done: false, createdAt: today(), ...obj }] }
      }),
      // Accepts a patch object OR a plain string (text-only patch) for backwards compatibility
      updateDailyTask: (id, patch) => set((s) => ({
        dailyTasks: s.dailyTasks.map((t) =>
          t.id === id ? { ...t, ...(typeof patch === 'string' ? { text: patch } : patch) } : t
        ),
      })),
      toggleDailyTask: (id) => set((s) => {
        const task = s.dailyTasks.find((t) => t.id === id)
        const wasNotDone = task && !task.done
        const xpReward = wasNotDone ? (task.priority === 'high' ? 30 : task.priority === 'low' ? 10 : 20) : 0
        const newXP = s.xp + xpReward
        const THRESHOLDS = [0, 100, 250, 500, 1000, 2000, 4000, 8000, 16000, 32000]
        let newLevel = 1
        for (let i = THRESHOLDS.length - 1; i >= 0; i--) {
          if (newXP >= THRESHOLDS[i]) { newLevel = i + 1; break }
        }
        return {
          dailyTasks: s.dailyTasks.map((t) => t.id === id ? { ...t, done: !t.done } : t),
          xp: wasNotDone ? newXP : s.xp,
          level: wasNotDone ? Math.min(newLevel, 10) : s.level,
        }
      }),
      deleteDailyTask: (id) => set((s) => ({
        dailyTasks: s.dailyTasks.filter((t) => t.id !== id),
      })),

      // ── Appointments ─────────────────────────────────────────────────────────
      appointments: [],
      addAppointment: (apt) => set((s) => ({
        appointments: [...s.appointments, {
          id: crypto.randomUUID(),
          title: apt.title || '',
          notes: apt.notes || '',
          date: apt.date || today(),
          startTime: apt.startTime || '',
          endTime: apt.endTime || '',
          location: apt.location || '',
          meetingLink: apt.meetingLink || '',
          important: apt.important || false,
          reminder: apt.reminder || 'none',
          createdAt: today(),
        }],
      })),
      updateAppointment: (id, patch) => set((s) => ({
        appointments: s.appointments.map((a) => a.id === id ? { ...a, ...patch } : a),
      })),
      deleteAppointment: (id) => set((s) => ({
        appointments: s.appointments.filter((a) => a.id !== id),
      })),

      // ── Kanban tasks ─────────────────────────────────────────────────────────
      tasks: [],
      addTask: (task) => set((s) => ({
        tasks: [...s.tasks, { id: crypto.randomUUID(), status: 'todo', ...task }],
      })),
      updateTask: (id, patch) => set((s) => ({
        tasks: s.tasks.map((t) => t.id === id ? { ...t, ...patch } : t),
      })),
      deleteTask: (id) => set((s) => ({ tasks: s.tasks.filter((t) => t.id !== id) })),
      moveTask: (id, status) => set((s) => ({
        tasks: s.tasks.map((t) => t.id === id ? { ...t, status } : t),
      })),

      // ── Habits ───────────────────────────────────────────────────────────────
      habits: SEED_HABITS,
      habitLogs: [],
      addHabit: (habit) => set((s) => ({
        habits: [...s.habits, { id: crypto.randomUUID(), target: 1, color: 'blue', ...habit }],
      })),
      updateHabit: (id, patch) => set((s) => ({
        habits: s.habits.map((h) => h.id === id ? { ...h, ...patch } : h),
      })),
      deleteHabit: (id) => set((s) => ({
        habits: s.habits.filter((h) => h.id !== id),
        habitLogs: s.habitLogs.filter((l) => l.habitId !== id),
      })),
      logHabit: (habitId) => set((s) => {
        const todayStr = today()
        const habit = s.habits.find((h) => h.id === habitId)
        if (!habit || habit.target < 1) return s
        const existing = s.habitLogs.find((l) => l.habitId === habitId && l.date === todayStr)
        if (existing) {
          if (existing.count >= habit.target) return s
          const newCount = existing.count + 1
          const hitTarget = newCount >= habit.target
          return {
            habitLogs: s.habitLogs.map((l) => l.habitId === habitId && l.date === todayStr ? { ...l, count: newCount } : l),
            xp: hitTarget ? s.xp + 15 : s.xp,
          }
        }
        const hitTarget = 1 >= habit.target
        return {
          habitLogs: [...s.habitLogs, { habitId, date: todayStr, count: 1 }],
          xp: hitTarget ? s.xp + 15 : s.xp,
        }
      }),
      resetHabitToday: (habitId) => set((s) => ({
        habitLogs: s.habitLogs.filter((l) => !(l.habitId === habitId && l.date === today())),
      })),
      getHabitStreak: (habitId) => {
        const { habitLogs, habits } = get()
        const habit = habits.find((h) => h.id === habitId)
        if (!habit) return 0
        let streak = 0
        let d = subDays(new Date(), 1)
        while (streak < 365) {
          const dateStr = format(d, 'yyyy-MM-dd')
          const log = habitLogs.find((l) => l.habitId === habitId && l.date === dateStr)
          if (log && log.count >= habit.target) { streak++; d = subDays(d, 1) } else break
        }
        return streak
      },

      // ── Projects ─────────────────────────────────────────────────────────────
      projects: [],
      addProject: (p) => set((s) => ({
        projects: [...s.projects, { id: crypto.randomUUID(), status: 'active', createdAt: today(), ...p }],
      })),
      updateProject: (id, patch) => set((s) => ({
        projects: s.projects.map((p) => p.id === id ? { ...p, ...patch } : p),
      })),
      deleteProject: (id) => set((s) => ({
        projects: s.projects.filter((p) => p.id !== id),
        projectTasks: s.projectTasks.filter((t) => t.projectId !== id),
        projectNotes: Object.fromEntries(Object.entries(s.projectNotes).filter(([k]) => k !== id)),
        projectFiles: s.projectFiles.filter((f) => f.projectId !== id),
      })),

      projectTasks: [],
      addProjectTask: (task) => set((s) => ({
        projectTasks: [...s.projectTasks, { id: crypto.randomUUID(), status: 'todo', ...task }],
      })),
      updateProjectTask: (id, patch) => set((s) => ({
        projectTasks: s.projectTasks.map((t) => t.id === id ? { ...t, ...patch } : t),
      })),
      deleteProjectTask: (id) => set((s) => ({
        projectTasks: s.projectTasks.filter((t) => t.id !== id),
      })),
      moveProjectTask: (id, status) => set((s) => ({
        projectTasks: s.projectTasks.map((t) => t.id === id ? { ...t, status } : t),
      })),

      projectNotes: {},
      updateProjectNote: (projectId, content) => set((s) => ({
        projectNotes: { ...s.projectNotes, [projectId]: content },
      })),

      projectFiles: [],
      addProjectFile: (file) => set((s) => ({
        projectFiles: [...s.projectFiles, { id: crypto.randomUUID(), uploadedAt: today(), ...file }],
      })),
      deleteProjectFile: (id) => set((s) => ({
        projectFiles: s.projectFiles.filter((f) => f.id !== id),
      })),

      // ── Finance ──────────────────────────────────────────────────────────────
      transactions: SEED_TRANSACTIONS,
      budgets: {},
      addTransaction: (tx) => set((s) => ({
        transactions: [...s.transactions, { id: crypto.randomUUID(), date: today(), ...tx }],
      })),
      deleteTransaction: (id) => set((s) => ({
        transactions: s.transactions.filter((t) => t.id !== id),
      })),
      setBudget: (category, amount) => set((s) => ({
        budgets: { ...s.budgets, [category]: amount },
      })),

      // ── Her ──────────────────────────────────────────────────────────────────
      movies: [],
      addMovie: (item) => set((s) => ({
        movies: [...s.movies, { id: crypto.randomUUID(), watched: false, addedAt: today(), ...item }],
      })),
      updateMovie: (id, patch) => set((s) => ({
        movies: s.movies.map((m) => m.id === id ? { ...m, ...patch } : m),
      })),
      toggleMovie: (id) => set((s) => ({
        movies: s.movies.map((m) => m.id === id ? { ...m, watched: !m.watched } : m),
      })),
      deleteMovie: (id) => set((s) => ({ movies: s.movies.filter((m) => m.id !== id) })),

      gifts: [],
      addGift: (item) => set((s) => ({
        gifts: [...s.gifts, { id: crypto.randomUUID(), bought: false, ...item }],
      })),
      updateGift: (id, patch) => set((s) => ({
        gifts: s.gifts.map((g) => g.id === id ? { ...g, ...patch } : g),
      })),
      toggleGift: (id) => set((s) => ({
        gifts: s.gifts.map((g) => g.id === id ? { ...g, bought: !g.bought } : g),
      })),
      deleteGift: (id) => set((s) => ({ gifts: s.gifts.filter((g) => g.id !== id) })),

      dates: [],
      addDate: (item) => set((s) => ({
        dates: [...s.dates, { id: crypto.randomUUID(), ...item }],
      })),
      updateDate: (id, patch) => set((s) => ({
        dates: s.dates.map((d) => d.id === id ? { ...d, ...patch } : d),
      })),
      deleteDate: (id) => set((s) => ({ dates: s.dates.filter((d) => d.id !== id) })),

      dateIdeas: [],
      addDateIdea: (idea) => set((s) => ({
        dateIdeas: [...s.dateIdeas, { id: crypto.randomUUID(), idea, done: false }],
      })),
      updateDateIdea: (id, idea) => set((s) => ({
        dateIdeas: s.dateIdeas.map((d) => d.id === id ? { ...d, idea } : d),
      })),
      toggleDateIdea: (id) => set((s) => ({
        dateIdeas: s.dateIdeas.map((d) => d.id === id ? { ...d, done: !d.done } : d),
      })),
      deleteDateIdea: (id) => set((s) => ({
        dateIdeas: s.dateIdeas.filter((d) => d.id !== id),
      })),

      // ── Profile ──────────────────────────────────────────────────────────────
      setName: (name) => set({ name }),
      toggleDarkMode: () => set((s) => ({ darkMode: !s.darkMode })),
      setTheme: (theme) => set({ theme }),
      setCurrency: (currency) => set({ currency }),

      // ── Gamification ─────────────────────────────────────────────────────────
      xp: 0,
      level: 1,
      achievements: [],  // array of { id, unlockedAt }
      pendingAchievement: null,  // { id, name, description, xp, emoji } | null

      dismissAchievement: () => set({ pendingAchievement: null }),

      addXP: (amount) => set((s) => {
        const newXP = s.xp + amount
        // Level thresholds: 100, 250, 500, 1000, 2000, 4000, 8000...
        const THRESHOLDS = [0, 100, 250, 500, 1000, 2000, 4000, 8000, 16000, 32000]
        let newLevel = 1
        for (let i = THRESHOLDS.length - 1; i >= 0; i--) {
          if (newXP >= THRESHOLDS[i]) { newLevel = i + 1; break }
        }
        return { xp: newXP, level: Math.min(newLevel, 10) }
      }),

      unlockAchievement: (id, meta = {}) => set((s) => {
        if (s.achievements.find((a) => a.id === id)) return s
        return {
          achievements: [...s.achievements, { id, unlockedAt: format(new Date(), 'yyyy-MM-dd') }],
          pendingAchievement: { id, name: meta.name ?? id, description: meta.description ?? '', xp: meta.xp ?? null, emoji: meta.emoji ?? '🏆' },
        }
      }),

      // ── Mood Log ─────────────────────────────────────────────────────────────
      moodLog: [],  // [{ date: 'YYYY-MM-DD', mood: 1|2|3|4|5 }]
      logMood: (mood) => set((s) => {
        const todayStr = format(new Date(), 'yyyy-MM-dd')
        const existing = s.moodLog.find((m) => m.date === todayStr)
        if (existing) {
          return { moodLog: s.moodLog.map((m) => m.date === todayStr ? { ...m, mood } : m) }
        }
        return { moodLog: [...s.moodLog, { date: todayStr, mood }] }
      }),

      // ── Pomodoro ──────────────────────────────────────────────────────────────
      pomodoro: {
        active: false,
        taskId: null,
        taskLabel: '',
        mode: 'work',       // 'work' | 'short_break' | 'long_break'
        seconds: 25 * 60,  // remaining seconds
        totalSessions: 0,
      },
      setPomodoroState: (patch) => set((s) => ({ pomodoro: { ...s.pomodoro, ...patch } })),
    }),
    { name: 'lifeos-v4' }
  )
)
