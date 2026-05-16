import { NavLink } from 'react-router-dom'
import { Home, CheckSquare, Wallet, Heart, Settings } from 'lucide-react'
import { useStore } from '../store'
import { getTheme } from '../lib/themes'

const tabs = [
  { to: '/', icon: Home, label: 'Home' },
  { to: '/tasks', icon: CheckSquare, label: 'Tasks' },
  { to: '/finance', icon: Wallet, label: 'Finance' },
  { to: '/her', icon: Heart, label: 'Her' },
  { to: '/settings', icon: Settings, label: 'Settings' },
]

export default function BottomNav() {
  const { theme } = useStore()
  const t = getTheme(theme)

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 px-4 pb-4" style={{ paddingBottom: 'max(16px, env(safe-area-inset-bottom))' }}>
      <div className="bg-white/85 dark:bg-[#151C2A]/95 backdrop-blur-2xl rounded-[28px] border border-zinc-200/60 dark:border-white/[0.08] shadow-[0_8px_32px_rgba(15,23,42,0.12)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.5)] overflow-hidden">
        <div className="flex max-w-md mx-auto px-2">
          {tabs.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className="flex-1"
            >
              {({ isActive }) => (
                <div className="flex flex-col items-center gap-0.5 py-3 px-3">
                  <div className={`p-1.5 rounded-xl transition-all duration-200 ${isActive ? t.navActiveBg : ''}`}>
                    <Icon size={21} strokeWidth={isActive ? 2.2 : 1.75} className={isActive ? t.navActive : 'text-zinc-400 dark:text-zinc-500'} />
                  </div>
                  <div className={`w-1 h-1 rounded-full transition-all ${isActive ? t.navDot : 'bg-transparent'}`} />
                  <span className={`text-[10px] font-semibold ${isActive ? t.navActive : 'text-zinc-400 dark:text-zinc-500'}`}>{label}</span>
                </div>
              )}
            </NavLink>
          ))}
        </div>
      </div>
    </nav>
  )
}
