import { NavLink } from 'react-router-dom'
import { Home, CheckSquare, Wallet, Heart, Settings } from 'lucide-react'
import { motion } from 'framer-motion'

const tabs = [
  { to: '/', icon: Home, label: 'Home' },
  { to: '/tasks', icon: CheckSquare, label: 'Tasks' },
  { to: '/finance', icon: Wallet, label: 'Finance' },
  { to: '/her', icon: Heart, label: 'Her' },
  { to: '/settings', icon: Settings, label: 'Settings' },
]

function NavItem({ to, icon: Icon, label, sidebar = false }) {
  return (
    <NavLink to={to} end={to === '/'} style={{ textDecoration: 'none' }} className={sidebar ? 'block' : 'flex-1'}>
      {({ isActive }) =>
        sidebar ? (
          <motion.div
            whileHover={{ x: 3 }}
            whileTap={{ scale: 0.97 }}
            style={{
              display: 'flex', alignItems: 'center', gap: 12,
              padding: '11px 14px', borderRadius: 12, cursor: 'pointer',
              background: isActive ? 'color-mix(in srgb, var(--accent) 14%, transparent)' : 'transparent',
              transition: 'background 0.15s',
            }}
          >
            <Icon size={19} strokeWidth={isActive ? 2.2 : 1.75}
              style={{ color: isActive ? 'var(--nav-active)' : 'var(--nav-inactive)', flexShrink: 0 }} />
            <span style={{ fontSize: 14, fontWeight: isActive ? 700 : 500, color: isActive ? 'var(--nav-active)' : 'var(--nav-inactive)' }}>
              {label}
            </span>
            {isActive && (
              <motion.div layoutId="side-indicator"
                style={{ marginLeft: 'auto', width: 6, height: 6, borderRadius: '50%', background: 'var(--accent)' }} />
            )}
          </motion.div>
        ) : (
          <motion.div
            whileTap={{ scale: 0.85 }}
            className="flex flex-col items-center gap-0.5 py-3 px-2"
            style={{ position: 'relative' }}
          >
            {isActive && (
              <motion.div layoutId="nav-active-bg"
                style={{
                  position: 'absolute', inset: '6px 4px',
                  borderRadius: 'var(--radius-sm, 10px)',
                  background: 'color-mix(in srgb, var(--accent) 12%, transparent)', zIndex: 0,
                }}
                transition={{ type: 'spring', stiffness: 380, damping: 34 }}
              />
            )}
            <div style={{
              position: 'relative', zIndex: 1, padding: 6,
              borderRadius: 'var(--radius-sm)',
              filter: isActive ? 'drop-shadow(0 2px 8px var(--nav-active))' : 'none',
            }}>
              <div style={{ transform: isActive ? 'scale(1.1)' : 'scale(1)', transition: 'transform 0.2s ease' }}>
                <Icon size={21} strokeWidth={isActive ? 2.2 : 1.75}
                  style={{ color: isActive ? 'var(--nav-active)' : 'var(--nav-inactive)' }} />
              </div>
            </div>
            <div style={{
              width: 4, height: 4, borderRadius: '50%',
              background: isActive ? 'var(--nav-indicator)' : 'transparent',
              transition: 'background 0.2s ease', position: 'relative', zIndex: 1,
            }} />
            <span style={{ fontSize: 10, fontWeight: 600, color: isActive ? 'var(--nav-active)' : 'var(--nav-inactive)', position: 'relative', zIndex: 1 }}>
              {label}
            </span>
          </motion.div>
        )
      }
    </NavLink>
  )
}

export default function BottomNav() {
  return (
    <>
      {/* ── Mobile bottom nav ── */}
      <nav className="lf-bottom-nav fixed bottom-0 left-0 right-0 z-50 px-4"
        style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 8px)' }}>
        <div style={{
          background: 'var(--nav-bg)',
          backdropFilter: 'var(--nav-blur, blur(20px))',
          WebkitBackdropFilter: 'var(--nav-blur, blur(20px))',
          borderRadius: 'var(--radius-xl, 28px)',
          border: '1px solid var(--border)',
          boxShadow: 'var(--shadow-md)',
          overflow: 'clip',
        }}>
          <div className="flex max-w-lg mx-auto px-2">
            {tabs.map((t) => <NavItem key={t.to} {...t} />)}
          </div>
        </div>
      </nav>

      {/* ── Desktop sidebar ── */}
      <nav className="lf-sidebar fixed left-0 top-0 bottom-0 z-50 flex-col"
        style={{
          width: 220,
          background: 'var(--nav-bg)',
          backdropFilter: 'var(--nav-blur, blur(20px))',
          WebkitBackdropFilter: 'var(--nav-blur, blur(20px))',
          borderRight: '1px solid var(--border)',
          boxShadow: 'var(--shadow-md)',
          padding: '20px 12px',
          gap: 2,
        }}>
        {/* Logo */}
        <div style={{ padding: '4px 14px 20px', borderBottom: '1px solid var(--border)', marginBottom: 8 }}>
          <p style={{ fontSize: 24, fontWeight: 900, color: 'var(--text)', letterSpacing: '-0.5px', lineHeight: 1 }}>LifeOS</p>
          <p style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 3 }}>Your life, organized</p>
        </div>
        {tabs.map((t) => <NavItem key={t.to} {...t} sidebar />)}
      </nav>
    </>
  )
}
