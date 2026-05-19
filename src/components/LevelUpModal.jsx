import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useStore } from '../store'

// Random positions for particles
const PARTICLES = Array.from({ length: 20 }, (_, i) => {
  const angle = (i / 20) * 2 * Math.PI + (Math.random() - 0.5) * 0.5
  const dist = 100 + Math.random() * 120
  return {
    id: i,
    x: Math.cos(angle) * dist,
    y: Math.sin(angle) * dist,
    delay: Math.random() * 0.5,
    color: ['var(--accent)', 'var(--gold, #F5B342)', 'var(--success)', '#fff'][i % 4],
    size: 6 + Math.random() * 8,
  }
})

export default function LevelUpModal() {
  const level = useStore((s) => s.level ?? 1)
  const prevLevel = useRef(level)
  const [show, setShow] = useState(false)
  const [displayLevel, setDisplayLevel] = useState(level)

  useEffect(() => {
    if (level > prevLevel.current) {
      setDisplayLevel(level)
      setShow(true)
      const t = setTimeout(() => setShow(false), 4000)
      prevLevel.current = level
      return () => clearTimeout(t)
    }
    prevLevel.current = level
  }, [level])

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          key="levelup-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          onClick={() => setShow(false)}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            background: 'rgba(0,0,0,0.82)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            overflow: 'hidden',
          }}
        >
          {/* Screen edge flash glow */}
          <motion.div
            initial={{ opacity: 1 }}
            animate={{ opacity: 0 }}
            transition={{ duration: 0.8, delay: 0.1 }}
            style={{
              position: 'absolute',
              inset: 0,
              border: '6px solid var(--accent)',
              borderRadius: 0,
              boxShadow: '0 0 60px var(--accent), inset 0 0 60px var(--accent)',
              pointerEvents: 'none',
            }}
          />

          {/* Shimmer sweep */}
          <motion.div
            initial={{ x: '-100%', opacity: 0.5 }}
            animate={{ x: '200%', opacity: 0 }}
            transition={{ duration: 1.2, delay: 0.2, ease: 'easeInOut' }}
            style={{
              position: 'absolute',
              top: 0,
              bottom: 0,
              width: '60%',
              background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.12), transparent)',
              pointerEvents: 'none',
              zIndex: 1,
            }}
          />

          {/* Center content */}
          <div
            style={{
              position: 'relative',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 12,
              zIndex: 2,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Particles burst */}
            {PARTICLES.map((p) => (
              <motion.div
                key={p.id}
                initial={{ x: 0, y: 0, opacity: 1, scale: 0 }}
                animate={{ x: p.x, y: p.y, opacity: 0, scale: 1 }}
                transition={{ duration: 1.2, delay: p.delay, ease: [0.2, 0.8, 0.4, 1] }}
                style={{
                  position: 'absolute',
                  width: p.size,
                  height: p.size,
                  borderRadius: '50%',
                  background: p.color,
                  boxShadow: `0 0 8px ${p.color}`,
                  pointerEvents: 'none',
                }}
              />
            ))}

            {/* Pulsing glow rings behind level number */}
            {[1, 0.6, 0.3].map((opacity, i) => (
              <motion.div
                key={i}
                animate={{ scale: [1, 1.4 + i * 0.3, 1], opacity: [opacity, 0, opacity] }}
                transition={{ duration: 2, repeat: Infinity, delay: i * 0.3, ease: 'easeInOut' }}
                style={{
                  position: 'absolute',
                  width: 180 + i * 40,
                  height: 180 + i * 40,
                  borderRadius: '50%',
                  border: `2px solid var(--accent)`,
                  opacity,
                  pointerEvents: 'none',
                }}
              />
            ))}

            {/* SVG animated ring */}
            <svg
              width={160}
              height={160}
              style={{ position: 'absolute', transform: 'rotate(-90deg)', zIndex: 3 }}
            >
              <motion.circle
                cx={80}
                cy={80}
                r={74}
                fill="none"
                stroke="var(--accent)"
                strokeWidth={4}
                strokeLinecap="round"
                strokeDasharray={2 * Math.PI * 74}
                initial={{ strokeDashoffset: 2 * Math.PI * 74 }}
                animate={{ strokeDashoffset: 0 }}
                transition={{ duration: 1, ease: 'easeOut', delay: 0.3 }}
              />
            </svg>

            {/* Trophy emoji */}
            <motion.div
              initial={{ scale: 0, rotate: -20 }}
              animate={{ scale: [0, 1.4, 1], rotate: [0, 10, -5, 0] }}
              transition={{ duration: 0.8, delay: 0.15, ease: [0.34, 1.56, 0.64, 1] }}
              style={{ fontSize: 48, lineHeight: 1, zIndex: 4, position: 'relative' }}
            >
              🏆
            </motion.div>

            {/* LEVEL UP! text */}
            <motion.div
              initial={{ opacity: 0, y: -20, scale: 0.7 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.4, ease: [0.22, 1, 0.36, 1] }}
              style={{
                fontSize: 14,
                fontWeight: 900,
                letterSpacing: '0.25em',
                textTransform: 'uppercase',
                background: 'linear-gradient(90deg, var(--accent), var(--gold, #F5B342), var(--accent))',
                backgroundSize: '200% 100%',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                zIndex: 4,
                position: 'relative',
              }}
            >
              Level Up!
            </motion.div>

            {/* Level number */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: [0, 1.2, 1] }}
              transition={{ type: 'spring', stiffness: 300, damping: 20, delay: 0.55 }}
              style={{
                fontSize: 80,
                fontWeight: 900,
                lineHeight: 1,
                color: '#fff',
                textShadow: '0 0 40px var(--accent), 0 0 80px var(--accent)',
                fontFamily: 'var(--font-sans)',
                zIndex: 4,
                position: 'relative',
              }}
            >
              {displayLevel}
            </motion.div>

            {/* Subtitle */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.9 }}
              style={{
                color: 'rgba(255,255,255,0.6)',
                fontSize: 13,
                fontWeight: 600,
                letterSpacing: '0.05em',
                zIndex: 4,
                position: 'relative',
              }}
            >
              Tap anywhere to continue
            </motion.p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
