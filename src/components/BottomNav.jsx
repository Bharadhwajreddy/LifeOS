import { NavLink } from 'react-router-dom'
import { Home, CheckSquare, Wallet, Heart, Settings } from 'lucide-react'
import { useStore } from '../store'

const tabs = [
  { to: '/', icon: Home, label: 'Home' },
  { to: '/tasks', icon: CheckSquare, label: 'Tasks' },
  { to: '/finance', icon: Wallet, label: 'Finance' },
  { to: '/her', icon: Heart, label: 'Her' },
  { to: '/settings', icon: Settings, label: 'Settings' },
]

export default function BottomNav() {
  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 px-4"
      style={{ paddingBottom: 'max(16px, env(safe-area-inset-bottom))' }}
    >
      <div style={{
        background: 'var(--nav-bg)',
        backdropFilter: 'var(--nav-blur, blur(20px))',
        WebkitBackdropFilter: 'var(--nav-blur, blur(20px))',
        borderRadius: 'var(--radius-xl, 28px)',
        border: '1px solid var(--border)',
        boxShadow: 'var(--shadow-md)',
        overflow: 'clip',
      }}>
        <div className="flex max-w-md mx-auto px-2">
          {tabs.map(({ to, icon: Icon, label }) => (
            <NavLink key={to} to={to} end={to === '/'} className="flex-1">
              {({ isActive }) => (
                <div className="flex flex-col items-center gap-0.5 py-3 px-2">
                  <div style={{
                    padding: 6,
                    borderRadius: 'var(--radius-sm)',
                    background: isActive ? 'color-mix(in srgb, var(--accent) 12%, transparent)' : 'transparent',
                    transition: 'all 0.2s ease',
                  }}>
                    <Icon
                      size={21}
                      strokeWidth={isActive ? 2.2 : 1.75}
                      style={{ color: isActive ? 'var(--nav-active)' : 'var(--nav-inactive)' }}
                    />
                  </div>
                  <div style={{
                    width: 4, height: 4, borderRadius: '50%',
                    background: isActive ? 'var(--nav-indicator)' : 'transparent',
                    transition: 'background 0.2s ease',
                  }} />
                  <span style={{
                    fontSize: 10, fontWeight: 600,
                    color: isActive ? 'var(--nav-active)' : 'var(--nav-inactive)',
                  }}>{label}</span>
                </div>
              )}
            </NavLink>
          ))}
        </div>
      </div>
    </nav>
  )
}
