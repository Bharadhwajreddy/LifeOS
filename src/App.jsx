import { useEffect, useState } from 'react'
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { onAuthStateChanged } from 'firebase/auth'
import { auth } from './lib/firebase'
import { loadFromCloud, saveToCloud } from './lib/firestoreSync'
import { useStore } from './store'
import BottomNav from './components/BottomNav'
import Home from './pages/Home'
import Tasks from './pages/Tasks'
import Finance from './pages/Finance'
import Her from './pages/Her'
import Settings from './pages/Settings'
import PomodoroWidget from './components/PomodoroWidget'
import AchievementToast from './components/AchievementToast'
import XPFloater from './components/XPFloater'
import LevelUpModal from './components/LevelUpModal'
import AuthScreen from './pages/AuthScreen'

function PageWrapper({ children }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -4 }}
      transition={{ duration: 0.22, ease: [0.25, 0.46, 0.45, 0.94] }}
    >
      {children}
    </motion.div>
  )
}

function AppInner() {
  const location = useLocation()
  const { theme, pendingAchievement, dismissAchievement, userId, isOnboarded, setUser, clearUser } = useStore()
  const [authReady, setAuthReady] = useState(!auth) // if no firebase, skip auth gate

  // Firebase auth state listener
  useEffect(() => {
    if (!auth) return
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser)
        // Load cloud data for this user
        const cloudData = await loadFromCloud(firebaseUser.uid)
        if (cloudData) {
          // Merge cloud data into store (cloud wins for most fields)
          // eslint-disable-next-line no-unused-vars
          const { setUser: _su, clearUser: _cu, setIsOnboarded: _si, ...mergeable } = cloudData
          useStore.setState((s) => ({ ...s, ...mergeable }))
        }
      } else {
        clearUser()
      }
      setAuthReady(true)
    })
    return unsub
  }, [])

  // Sync to cloud whenever store changes (3s debounce)
  useEffect(() => {
    if (!userId) return
    const t = setTimeout(() => {
      saveToCloud(userId, useStore.getState())
    }, 3000)
    return () => clearTimeout(t)
  })

  // Theme effect
  useEffect(() => {
    const root = document.documentElement
    root.setAttribute('data-theme', theme)
    const isDark = theme === 'glass' || theme === 'neon'
    root.classList.toggle('dark', isDark)
  }, [theme])

  // Show loading spinner briefly while auth initializes
  if (!authReady) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)' }}>
        <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          style={{ width: 32, height: 32, borderRadius: '50%', border: '3px solid var(--border)', borderTopColor: 'var(--accent)' }}
        />
      </div>
    )
  }

  // Show auth screen if not signed in OR not yet onboarded
  if (!userId || !isOnboarded) {
    return (
      <div className="lf-app" data-theme={theme}>
        <AuthScreen />
      </div>
    )
  }

  return (
    // lf-app picks up the data-theme attribute for CSS variable resolution
    <div className="lf-app min-h-screen overflow-x-hidden transition-colors" data-theme={theme}>
      <main className="lf-main max-w-lg mx-auto px-4 pt-6 pb-32">
        <AnimatePresence mode="wait">
          <Routes location={location} key={location.pathname}>
            <Route path="/" element={<PageWrapper><Home /></PageWrapper>} />
            <Route path="/tasks" element={<PageWrapper><Tasks /></PageWrapper>} />
            <Route path="/finance" element={<PageWrapper><Finance /></PageWrapper>} />
            <Route path="/her" element={<PageWrapper><Her /></PageWrapper>} />
            <Route path="/settings" element={<PageWrapper><Settings /></PageWrapper>} />
          </Routes>
        </AnimatePresence>
      </main>
      <BottomNav />
      <PomodoroWidget />
      <AchievementToast achievement={pendingAchievement} onDismiss={dismissAchievement} />
      <LevelUpModal />
      <XPFloater />
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AppInner />
    </BrowserRouter>
  )
}
