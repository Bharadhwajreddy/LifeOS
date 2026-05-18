import { NavLink, useLocation } from 'react-router-dom'
import { Home, CheckSquare, Wallet, Heart, Settings } from 'lucide-react'
import { motion } from 'framer-motion'
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
      style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 8px)' }}
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
                <motion.div
                  whileTap={{ scale: 0.85 }}
                  className="flex flex-col items-center gap-0.5 py-3 px-2"
                  style={{ position: 'relative' }}
                >
                  {/* Sliding pill background */}
                  {isActive && (
                    <motion.div
                      layoutId="nav-active-bg"
                      style={{
                        position: 'absolute',
                        inset: '6px 4px',
                        borderRadius: 'var(--radius-sm, 10px)',
                        background: 'color-mix(in srgb, var(--accent) 12%, transparent)',
                        zIndex: 0,
                      }}
                      transition={{ type: 'spring', stiffness: 380, damping: 34 }}
                    />
                  )}

                  {/* Icon wrapper with glow */}
                  <div
                    style={{
                      position: 'relative',
                      zIndex: 1,
                      padding: 6,
                      borderRadius: 'var(--radius-sm)',
                      transition: 'all 0.2s ease',
                      filter: isActive
                        ? 'drop-shadow(0 2px 8px var(--nav-active))'
                        : 'none',
                    }}
                  >
                    <div style={{
                      transform: isActive ? 'scale(1.1)' : 'scale(1)',
                      transition: 'transform 0.2s ease',
                    }}>
                      <Icon
                        size={21}
                        strokeWidth={isActive ? 2.2 : 1.75}
                        style={{ color: isActive ? 'var(--nav-active)' : 'var(--nav-inactive)' }}
                      />
                    </div>
                  </div>

                  <div style={{
                    width: 4, height: 4, borderRadius: '50%',
                    background: isActive ? 'var(--nav-indicator)' : 'transparent',
                    transition: 'background 0.2s ease',
                    position: 'relative',
                    zIndex: 1,
                  }} />
                  <span style={{
                    fontSize: 10, fontWeight: 600,
                    color: isActive ? 'var(--nav-active)' : 'var(--nav-inactive)',
                    position: 'relative',
                    zIndex: 1,
                  }}>{label}</span>
                </motion.div>
              )}
            </NavLink>
          ))}
        </div>
      </div>
    </nav>
  )
}
