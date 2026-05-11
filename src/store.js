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
      addDailyTask: (text) => set((s) => ({
        dailyTasks: [...s.dailyTasks, { id: crypto.randomUUID(), text, done: false, date: today() }],
      })),
      updateDailyTask: (id, text) => set((s) => ({
        dailyTasks: s.dailyTasks.map((t) => t.id === id ? { ...t, text } : t),
      })),
      toggleDailyTask: (id) => set((s) => ({
        dailyTasks: s.dailyTasks.map((t) => t.id === id ? { ...t, done: !t.done } : t),
      })),
      deleteDailyTask: (id) => set((s) => ({
        dailyTasks: s.dailyTasks.filter((t) => t.id !== id),
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
          return { habitLogs: s.habitLogs.map((l) => l.habitId === habitId && l.date === todayStr ? { ...l, count: l.count + 1 } : l) }
        }
        return { habitLogs: [...s.habitLogs, { habitId, date: todayStr, count: 1 }] }
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
      setCurrency: (currency) => set({ currency }),
    }),
    { name: 'lifeos-v4' }
  )
)
