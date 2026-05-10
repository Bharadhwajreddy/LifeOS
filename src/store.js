import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { format } from 'date-fns'
import { SEED_TRANSACTIONS } from './lib/seedData'

const today = () => format(new Date(), 'yyyy-MM-dd')

export const useStore = create(
  persist(
    (set) => ({
      // ── SETTINGS ──────────────────────────────────────────────────────────
      name: 'Bharadhwaj',
      darkMode: true,
      currency: '€',
      setName: (name) => set({ name }),
      toggleDarkMode: () => set((s) => ({ darkMode: !s.darkMode })),
      setCurrency: (currency) => set({ currency }),

      // ── INCOME SOURCES (editable list) ────────────────────────────────────
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

      // ── EXPENSE CATEGORIES (editable list) ────────────────────────────────
      expenseCategories: [
        'Rent', 'Insurance', 'Phone', 'Groceries', 'India Transfer',
        'Transport', 'Entertainment', 'Mutual Funds', 'Health', 'Education',
        'Bank Fees', 'Other',
      ],
      addExpenseCategory: (name) => set((s) => ({
        expenseCategories: s.expenseCategories.includes(name)
          ? s.expenseCategories
          : [...s.expenseCategories, name],
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

      // ── FINANCE ──────────────────────────────────────────────────────────
      // Pre-loaded with all historical data from your Google Sheets
      transactions: SEED_TRANSACTIONS,
      budgets: {
        Rent: 285, Insurance: 150, Phone: 55, Groceries: 150,
        'India Transfer': 100, Transport: 50, Entertainment: 80,
        'Mutual Funds': 60, Health: 60, Education: 0, 'Bank Fees': 5, Other: 50,
      },
      addTransaction: (tx) => set((s) => ({
        transactions: [...s.transactions, { id: crypto.randomUUID(), date: today(), ...tx }],
      })),
      deleteTransaction: (id) => set((s) => ({
        transactions: s.transactions.filter((t) => t.id !== id),
      })),
      setBudget: (category, amount) => set((s) => ({
        budgets: { ...s.budgets, [category]: amount },
      })),

      // ── DAILY TASKS ───────────────────────────────────────────────────────
      // { id, text, done, date }
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

      // ── OFFICE / PROJECT TASKS ────────────────────────────────────────────
      // { id, text, status: 'todo'|'doing'|'done', priority: 'low'|'med'|'high', dueDate, category }
      tasks: [],
      addTask: (task) => set((s) => ({
        tasks: [...s.tasks, { id: crypto.randomUUID(), status: 'todo', ...task }],
      })),
      deleteTask: (id) => set((s) => ({
        tasks: s.tasks.filter((t) => t.id !== id),
      })),
      moveTask: (id, status) => set((s) => ({
        tasks: s.tasks.map((t) => t.id === id ? { ...t, status } : t),
      })),

      // ── GIRLFRIEND SECTION ────────────────────────────────────────────────
      movies: [],
      addMovie: (item) => set((s) => ({
        movies: [...s.movies, { id: crypto.randomUUID(), watched: false, ...item }],
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
      deleteDateIdea: (id) => set((s) => ({ dateIdeas: s.dateIdeas.filter((d) => d.id !== id) })),
    }),
    { name: 'lifeos-v3' }
  )
)
