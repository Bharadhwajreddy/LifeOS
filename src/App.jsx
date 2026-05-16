import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { useStore } from './store'
import { getTheme } from './lib/themes'
import BottomNav from './components/BottomNav'
import Home from './pages/Home'
import Tasks from './pages/Tasks'
import Finance from './pages/Finance'
import Her from './pages/Her'
import Settings from './pages/Settings'

function PageWrapper({ children }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.18, ease: 'easeOut' }}
    >
      {children}
    </motion.div>
  )
}

function AppInner() {
  const location = useLocation()
  const { darkMode, theme } = useStore()
  const t = getTheme(theme)

  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode)
  }, [darkMode])

  const bgStyle = darkMode
    ? { background: t.darkBg }
    : { background: 'linear-gradient(180deg, #FFFFFF 0%, #F7F8FA 100%)' }

  return (
    <div className="min-h-screen transition-colors overflow-x-hidden" style={bgStyle}>
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
