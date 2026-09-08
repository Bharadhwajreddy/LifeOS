import { useEffect, useRef, useState } from 'react'
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { onAuthStateChanged } from 'firebase/auth'
import { auth } from './lib/firebase'
import { subscribeToCloud, saveToCloud } from './lib/firestoreSync'
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

  // Refs to coordinate cloud sync safely:
  //  - hydratedRef: true once we've received the first cloud snapshot. We must
  //    NOT save to cloud before this, or a device opening with stale local data
  //    would overwrite fresher cloud data (the cross-device bug).
  //  - applyingRemoteRef: set while we apply a remote snapshot, so the store
  //    subscription doesn't immediately echo that same data back to the cloud.
  const hydratedRef = useRef(false)
  const applyingRemoteRef = useRef(false)
  const saveTimer = useRef(null)

  // Firebase auth + real-time cloud subscription
  useEffect(() => {
    if (!auth) return
    let unsubSnap = null
    const unsub = onAuthStateChanged(auth, (firebaseUser) => {
      if (unsubSnap) { unsubSnap(); unsubSnap = null }
      hydratedRef.current = false

      if (firebaseUser) {
        setUser(firebaseUser)
        // Live listener: fires now with current cloud doc, then on every change.
        unsubSnap = subscribeToCloud(
          firebaseUser.uid,
          (cloudData) => {
            if (cloudData) {
              applyingRemoteRef.current = true
              // eslint-disable-next-line no-unused-vars
              const { setUser: _su, clearUser: _cu, setIsOnboarded: _si, ...mergeable } = cloudData
              useStore.setState((s) => ({ ...s, ...mergeable }))
            }
            hydratedRef.current = true
            setAuthReady(true)
          },
          () => {
            // Offline / rules error — fall back to local data so we don't hang.
            hydratedRef.current = true
            setAuthReady(true)
          }
        )
        // Safety: never hang on the spinner if the network is slow.
        setTimeout(() => setAuthReady(true), 5000)
      } else {
        clearUser()
        setAuthReady(true)
      }
    })
    return () => { if (unsubSnap) unsubSnap(); unsub() }
  }, [])

  // Save local changes to cloud (debounced), but only after cloud hydration and
  // never for changes that were themselves applied from a remote snapshot.
  useEffect(() => {
    if (!auth) return
    const unsub = useStore.subscribe((state) => {
      if (!state.userId || !hydratedRef.current) return
      if (applyingRemoteRef.current) { applyingRemoteRef.current = false; return }
      clearTimeout(saveTimer.current)
      saveTimer.current = setTimeout(() => {
        saveToCloud(state.userId, useStore.getState())
      }, 1500)
    })
    return () => { clearTimeout(saveTimer.current); unsub() }
  }, [])

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
