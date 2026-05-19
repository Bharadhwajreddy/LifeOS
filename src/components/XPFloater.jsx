import { useEffect, useRef, useState, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useStore } from '../store'

// ─── XPFloater ────────────────────────────────────────────────────────────────
// Mounts once in App.jsx. Shows "+N XP ⚡" floating text whenever xp increases.
// Up to 3 simultaneous floaters, staggered 200ms apart.

let _floatListeners = []

export function useXPFloat() {
  const trigger = useCallback((delta) => {
    _floatListeners.forEach((fn) => fn(delta))
  }, [])
  return trigger
}

export default function XPFloater() {
  const xp = useStore((s) => s.xp ?? 0)
  const prevXP = useRef(xp)
  const [floaters, setFloaters] = useState([]) // [{ id, delta, x, delay }]

  // Register internal listener
  useEffect(() => {
    const add = (delta) => {
      const id = crypto.randomUUID()
      // Random horizontal spread so multiple don't overlap
      const x = (Math.random() - 0.5) * 80
      setFloaters((prev) => {
        const next = [...prev, { id, delta, x }].slice(-3)
        return next
      })
      setTimeout(() => {
        setFloaters((prev) => prev.filter((f) => f.id !== id))
      }, 2000)
    }
    _floatListeners.push(add)
    return () => { _floatListeners = _floatListeners.filter((f) => f !== add) }
  }, [])

  // Watch store xp and fire floater on increase
  useEffect(() => {
    if (xp > prevXP.current) {
      const delta = xp - prevXP.current
      // stagger when multiple arrive
      const trigger = (d) => {
        const id = crypto.randomUUID()
        const x = (Math.random() - 0.5) * 80
        setFloaters((prev) => {
          const next = [...prev, { id, delta: d, x }].slice(-3)
          return next
        })
        setTimeout(() => {
          setFloaters((prev) => prev.filter((f) => f.id !== id))
        }, 2000)
      }
      trigger(delta)
    }
    prevXP.current = xp
  }, [xp])

  return createPortal(
    <div
      style={{
        position: 'fixed',
        bottom: 120,
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 10000,
        pointerEvents: 'none',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
      }}
    >
      <AnimatePresence>
        {floaters.map((f, i) => (
          <motion.div
            key={f.id}
            initial={{ opacity: 0, y: 0, scale: 0, x: f.x }}
            animate={{
              opacity: [0, 1, 1, 0],
              y: -120,
              scale: [0, 1.3, 1, 0.8],
              x: f.x,
            }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.8, ease: [0.22, 1, 0.36, 1] }}
            style={{
              position: 'absolute',
              bottom: i * 8,
              whiteSpace: 'nowrap',
              fontSize: 20,
              fontWeight: 900,
              color: '#fff',
              textShadow: `0 0 12px var(--accent), 0 0 24px var(--accent), 0 2px 4px rgba(0,0,0,0.5)`,
              letterSpacing: '-0.02em',
              fontFamily: 'var(--font-sans)',
              userSelect: 'none',
            }}
          >
            +{f.delta} XP ⚡
          </motion.div>
        ))}
      </AnimatePresence>
    </div>,
    document.body
  )
}
