import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { useStore } from './store'
import BottomNav from './components/BottomNav'
import Home from './pages/Home'
import Tasks from './pages/Tasks'
import Finance from './pages/Finance'
import Her from './pages/Her'
import Settings from './pages/Settings'

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
  const { theme } = useStore()

  // Apply data-theme attribute + remove old dark class (themes handle it)
  useEffect(() => {
    const root = document.documentElement
    // All 4 themes carry their own bg color — dark class no longer needed
    root.setAttribute('data-theme', theme)
    // Keep dark class for any residual tailwind dark: utilities
    const isDark = theme === 'glass' || theme === 'neon'
    root.classList.toggle('dark', isDark)
  }, [theme])

  return (
    // lf-app picks up the data-theme attribute for CSS variable resolution
    <div className="lf-app min-h-screen overflow-x-hidden transition-colors" data-theme={theme}>
      <main className="max-w-md mx-auto px-4 pt-6 pb-32">
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
