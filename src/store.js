import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { format, subDays } from 'date-fns'
import { SEED_TRANSACTIONS } from './lib/seedData'

const today = () => format(new Date(), 'yyyy-MM-dd')

// ─── Seed Tasks — historical + active ────────────────────────────────────────
const SEED_TASKS = [
  // ── OFFICE (Lumileds) ──────────────────────────────────────────────────────
  // Active
  { id: 'o1',  category: 'office', text: 'Submit May timesheet to HR',              status: 'todo',  priority: 'high', dueDate: '2026-05-15' },
  { id: 'o2',  category: 'office', text: 'Prepare Q2 phosphor efficiency report',    status: 'doing', priority: 'high', dueDate: '2026-05-20' },
  { id: 'o3',  category: 'office', text: 'Calibrate spectrophotometer after repair', status: 'todo',  priority: 'med',  dueDate: '' },
  { id: 'o4',  category: 'office', text: 'Attend weekly lab sync meeting',           status: 'doing', priority: 'med',  dueDate: '' },
  // Done — recent
  { id: 'o5',  category: 'office', text: 'Submit April timesheet',                  status: 'done',  priority: 'high', dueDate: '' },
  { id: 'o6',  category: 'office', text: 'Review LED degradation test data',         status: 'done',  priority: 'high', dueDate: '' },
  { id: 'o7',  category: 'office', text: 'Fix broken sample labelling system',       status: 'done',  priority: 'med',  dueDate: '' },
  { id: 'o8',  category: 'office', text: 'Train new intern on measurement setup',    status: 'done',  priority: 'low',  dueDate: '' },
  // Done — older
  { id: 'o9',  category: 'office', text: 'Complete Q1 project status presentation',  status: 'done',  priority: 'high', dueDate: '' },
  { id: 'o10', category: 'office', text: 'Update SOPs for coating process',          status: 'done',  priority: 'med',  dueDate: '' },
  { id: 'o11', category: 'office', text: 'Order replacement thermal paste',          status: 'done',  priority: 'low',  dueDate: '' },
  { id: 'o12', category: 'office', text: 'Compile October testing results',          status: 'done',  priority: 'high', dueDate: '' },

  // ── PROJECTS (Ecogenium) ───────────────────────────────────────────────────
  // Active
  { id: 'e1',  category: 'projects', text: 'Plan June Ecogenium sustainability event',   status: 'todo',  priority: 'high', dueDate: '2026-06-01' },
  { id: 'e2',  category: 'projects', text: 'Write May meeting minutes',                  status: 'doing', priority: 'med',  dueDate: '' },
  { id: 'e3',  category: 'projects', text: 'Contact new sponsors for next semester',     status: 'todo',  priority: 'low',  dueDate: '' },
  // Done — recent
  { id: 'e4',  category: 'projects', text: 'Organise Earth Day poster campaign',         status: 'done',  priority: 'high', dueDate: '' },
  { id: 'e5',  category: 'projects', text: 'Prepare Ecogenium intro deck for freshers',  status: 'done',  priority: 'med',  dueDate: '' },
  // Done — older
  { id: 'e6',  category: 'projects', text: 'Submit semester activity report',            status: 'done',  priority: 'high', dueDate: '' },
  { id: 'e7',  category: 'projects', text: 'Host panel discussion on renewable energy',  status: 'done',  priority: 'high', dueDate: '' },
  { id: 'e8',  category: 'projects', text: 'Set up club Instagram page',                 status: 'done',  priority: 'low',  dueDate: '' },
  { id: 'e9',  category: 'projects', text: 'Recruit 5 new members for Ecogenium',        status: 'done',  priority: 'med',  dueDate: '' },
  { id: 'e10', category: 'projects', text: 'Plan winter charity drive logistics',        status: 'done',  priority: 'high', dueDate: '' },
  { id: 'e11', category: 'projects', text: 'Book seminar room for spring workshop',      status: 'done',  priority: 'med',  dueDate: '' },

  // ── PROJECTS (Githa App) ───────────────────────────────────────────────────
  // Active
  { id: 'g1',  category: 'projects', text: 'Build Githa authentication flow',           status: 'doing', priority: 'high', dueDate: '' },
  { id: 'g2',  category: 'projects', text: 'Design Githa home dashboard UI',            status: 'todo',  priority: 'high', dueDate: '' },
  { id: 'g3',  category: 'projects', text: 'Write Githa API documentation',             status: 'todo',  priority: 'low',  dueDate: '' },
  // Done
  { id: 'g4',  category: 'projects', text: 'Define Githa database schema',              status: 'done',  priority: 'high', dueDate: '' },
  { id: 'g5',  category: 'projects', text: 'Set up Githa Vite + React project',         status: 'done',  priority: 'high', dueDate: '' },
  { id: 'g6',  category: 'projects', text: 'Research tech stack for Githa',             status: 'done',  priority: 'med',  dueDate: '' },

  // ── PROJECTS (University) ──────────────────────────────────────────────────
  { id: 'u1',  category: 'projects', text: 'OLS exam preparation — finish past papers', status: 'done',  priority: 'high', dueDate: '' },
  { id: 'u2',  category: 'projects', text: 'Submit semester registration',              status: 'done',  priority: 'high', dueDate: '' },
  { id: 'u3',  category: 'projects', text: 'Pay tuition fee for new semester',         status: 'done',  priority: 'high', dueDate: '' },
  { id: 'u4',  category: 'projects', text: 'Collect Uniklinik health certificate',      status: 'done',  priority: 'med',  dueDate: '' },
]

// ─── Seed Habits ──────────────────────────────────────────────────────────────
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
      renameExpenseCategory: (oldName, newName) => set((s) => ({
        expenseCategories: s.expenseCategories.map((n) => n === oldName ? newName : n),
        transactions: s.transactions.map((t) =>
          t.type === 'expense' && t.category === oldName ? { ...t, category: newName } : t
        ),
      })),
      deleteExpenseCategory: (name) => set((s) => ({
        expenseCategories: s.expenseCategories.filter((n) => n !== name),
      })),

      // ── Daily tasks ──────────────────────────────────────────────────────────
      dailyTasks: [],
      addDailyTask: (text) => set((s) => ({
        dailyTasks: [...s.dailyTasks, { id: crypto.randomUUID(), text, done: false, date: today() }],
      })),
      toggleDailyTask: (id) => set((s) => ({
        dailyTasks: s.dailyTasks.map((t) => t.id === id ? { ...t, done: !t.done } : t),
      })),
      deleteDailyTask: (id) => set((s) => ({
        dailyTasks: s.dailyTasks.filter((t) => t.id !== id),
      })),

      // ── Kanban tasks (pre-seeded) ────────────────────────────────────────────
      tasks: SEED_TASKS,
      addTask: (task) => set((s) => ({
        tasks: [...s.tasks, { id: crypto.randomUUID(), status: 'todo', ...task }],
      })),
      deleteTask: (id) => set((s) => ({ tasks: s.tasks.filter((t) => t.id !== id) })),
      moveTask: (id, status) => set((s) => ({
        tasks: s.tasks.map((t) => t.id === id ? { ...t, status } : t),
      })),

      // ── Habits / Routines ────────────────────────────────────────────────────
      habits: SEED_HABITS,
      habitLogs: [],
      addHabit: (habit) => set((s) => ({
        habits: [...s.habits, { id: crypto.randomUUID(), target: 1, color: 'blue', ...habit }],
      })),
      deleteHabit: (id) => set((s) => ({
        habits: s.habits.filter((h) => h.id !== id),
        habitLogs: s.habitLogs.filter((l) => l.habitId !== id),
      })),
      updateHabit: (id, patch) => set((s) => ({
        habits: s.habits.map((h) => h.id === id ? { ...h, ...patch } : h),
      })),
      logHabit: (habitId) => set((s) => {
        const todayStr = today()
        const habit = s.habits.find((h) => h.id === habitId)
        if (!habit) return s
        const existing = s.habitLogs.find((l) => l.habitId === habitId && l.date === todayStr)
        if (existing) {
          if (existing.count >= habit.target) return s
          return {
            habitLogs: s.habitLogs.map((l) =>
              l.habitId === habitId && l.date === todayStr ? { ...l, count: l.count + 1 } : l
            ),
          }
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
        for (let i = 0; i < 365; i++) {
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
      toggleMovie: (id) => set((s) => ({
        movies: s.movies.map((m) => m.id === id ? { ...m, watched: !m.watched } : m),
      })),
      deleteMovie: (id) => set((s) => ({ movies: s.movies.filter((m) => m.id !== id) })),

      gifts: [],
      addGift: (item) => set((s) => ({
        gifts: [...s.gifts, { id: crypto.randomUUID(), bought: false, ...item }],
      })),
      toggleGift: (id) => set((s) => ({
        gifts: s.gifts.map((g) => g.id === id ? { ...g, bought: !g.bought } : g),
      })),
      deleteGift: (id) => set((s) => ({ gifts: s.gifts.filter((g) => g.id !== id) })),

      dates: [],
      addDate: (item) => set((s) => ({
        dates: [...s.dates, { id: crypto.randomUUID(), ...item }],
      })),
      deleteDate: (id) => set((s) => ({ dates: s.dates.filter((d) => d.id !== id) })),

      dateIdeas: [],
      addDateIdea: (idea) => set((s) => ({
        dateIdeas: [...s.dateIdeas, { id: crypto.randomUUID(), idea, done: false }],
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
    { name: 'lifeos-v3' }
  )
)
