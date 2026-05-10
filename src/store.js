import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { format } from 'date-fns'

const today = () => format(new Date(), 'yyyy-MM-dd')

export const useStore = create(
  persist(
    (set, get) => ({
      name: 'Bharadhwaj',
      darkMode: true,
      currency: '€',

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

      tasks: [],
      addTask: (task) => set((s) => ({
        tasks: [...s.tasks, { id: crypto.randomUUID(), status: 'todo', ...task }],
      })),
      updateTask: (id, patch) => set((s) => ({
        tasks: s.tasks.map((t) => t.id === id ? { ...t, ...patch } : t),
      })),
      deleteTask: (id) => set((s) => ({
        tasks: s.tasks.filter((t) => t.id !== id),
      })),
      moveTask: (id, status) => set((s) => ({
        tasks: s.tasks.map((t) => t.id === id ? { ...t, status } : t),
      })),

      transactions: [],
      budgets: { food: 200, transport: 80, shopping: 150, entertainment: 100, other: 100 },
      addTransaction: (tx) => set((s) => ({
        transactions: [...s.transactions, { id: crypto.randomUUID(), date: today(), ...tx }],
      })),
      deleteTransaction: (id) => set((s) => ({
        transactions: s.transactions.filter((t) => t.id !== id),
      })),
      setBudget: (category, amount) => set((s) => ({
        budgets: { ...s.budgets, [category]: amount },
      })),

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
      deleteDateIdea: (id) => set((s) => ({ dateIdeas: s.dateIdeas.filter((d) => d.id !== id) })),

      setName: (name) => set({ name }),
      toggleDarkMode: () => set((s) => ({ darkMode: !s.darkMode })),
      setCurrency: (currency) => set({ currency }),
    }),
    { name: 'lifeos-v2' }
  )
)
