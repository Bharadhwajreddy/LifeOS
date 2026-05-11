import { NavLink } from 'react-router-dom'
import { Home, CheckSquare, Wallet, Heart, Settings } from 'lucide-react'

const tabs = [
  { to: '/', icon: Home, label: 'Home' },
  { to: '/tasks', icon: CheckSquare, label: 'Tasks' },
  { to: '/finance', icon: Wallet, label: 'Finance' },
  { to: '/her', icon: Heart, label: 'Her' },
  { to: '/settings', icon: Settings, label: 'Settings' },
]

export default function BottomNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white/90 dark:bg-zinc-950/90 backdrop-blur-2xl border-t border-zinc-200/60 dark:border-zinc-800/60 safe-bottom">
      <div className="flex max-w-md mx-auto px-2">
        {tabs.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className="flex-1"
          >
            {({ isActive }) => (
              <div className={`flex flex-col items-center gap-0.5 py-2 mx-0.5 rounded-xl transition-all ${
                isActive ? 'text-blue-500' : 'text-zinc-400 dark:text-zinc-600'
              }`}>
                <div className={`relative p-1.5 rounded-xl transition-all ${
                  isActive ? 'bg-blue-50 dark:bg-blue-500/10' : ''
                }`}>
                  <Icon size={20} strokeWidth={isActive ? 2.3 : 1.8} />
                </div>
                <span className={`text-[10px] font-semibold ${isActive ? 'text-blue-500' : 'text-zinc-400 dark:text-zinc-600'}`}>
                  {label}
                </span>
              </div>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
