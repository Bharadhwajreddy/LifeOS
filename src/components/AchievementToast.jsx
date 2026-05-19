import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

const DISMISS_DELAY = 4000

// Confetti dots configuration
const CONFETTI = Array.from({ length: 10 }, (_, i) => {
  const angle = (i / 10) * 2 * Math.PI
  const dist = 40 + Math.random() * 30
  return {
    id: i,
    x: Math.cos(angle) * dist,
    y: Math.sin(angle) * dist,
    color: ['var(--accent)', 'var(--gold, #F5B342)', 'var(--success)', '#fff', 'var(--danger)'][i % 5],
    size: 4 + Math.random() * 4,
    delay: Math.random() * 0.3,
  }
})

// Animated XP count-up
function AnimatedXP({ value }) {
  const [display, setDisplay] = useState(0)
  useEffect(() => {
    const start = Date.now()
    const dur = 600
    const timer = setInterval(() => {
      const progress = Math.min((Date.now() - start) / dur, 1)
      setDisplay(Math.round(value * progress))
      if (progress >= 1) clearInterval(timer)
    }, 16)
    return () => clearInterval(timer)
  }, [value])
  return <span>+{display}</span>
}

/**
 * AchievementToast
 * Props: achievement: { id, name, description, xp, emoji } | null
 *        onDismiss: () => void
 */
export default function AchievementToast({ achievement, onDismiss }) {
  useEffect(() => {
    if (!achievement) return
    const t = setTimeout(onDismiss, DISMISS_DELAY)
    return () => clearTimeout(t)
  }, [achievement, onDismiss])

  const prefersReducedMotion =
    typeof window !== 'undefined' &&
    window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

  const variants = prefersReducedMotion
    ? { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 } }
    : { initial: { y: 80, opacity: 0, scale: 0.9 }, animate: { y: 0, opacity: 1, scale: 1 }, exit: { y: 80, opacity: 0, scale: 0.9 } }

  const transition = prefersReducedMotion
    ? { duration: 0.15 }
    : { type: 'spring', stiffness: 400, damping: 28 }

  return (
    <AnimatePresence>
      {achievement && (
        <motion.div
          key={achievement.id}
          variants={variants}
          initial="initial"
          animate="animate"
          exit="exit"
          transition={transition}
          onClick={onDismiss}
          style={{
            position: 'fixed',
            bottom: 90,
            left: '50%',
            transform: 'translateX(-50%)',
            maxWidth: 340,
            width: 'calc(100vw - 32px)',
            zIndex: 60,
            cursor: 'pointer',
          }}
        >
          {/* Confetti burst (behind the card) */}
          {!prefersReducedMotion && CONFETTI.map((c) => (
            <motion.div
              key={c.id}
              initial={{ x: 0, y: 0, opacity: 1, scale: 0 }}
              animate={{ x: c.x, y: c.y, opacity: 0, scale: 1 }}
              transition={{ duration: 0.8, delay: c.delay, ease: [0.2, 0.8, 0.4, 1] }}
              style={{
                position: 'absolute',
                top: '50%',
                left: '20%',
                width: c.size,
                height: c.size,
                borderRadius: '50%',
                background: c.color,
                pointerEvents: 'none',
                zIndex: -1,
              }}
            />
          ))}

          {/* Card */}
          <div
            style={{
              background: 'var(--card-bg)',
              border: '1px solid var(--card-border)',
              borderRadius: 'var(--card-radius)',
              boxShadow: 'var(--shadow-pop), 0 0 30px var(--accent)',
              backdropFilter: 'var(--backdrop)',
              WebkitBackdropFilter: 'var(--backdrop)',
              padding: '14px 16px',
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            {/* Shimmer sweep */}
            {!prefersReducedMotion && (
              <motion.div
                initial={{ x: '-100%' }}
                animate={{ x: '300%' }}
                transition={{ duration: 1, delay: 0.3, ease: 'easeInOut' }}
                style={{
                  position: 'absolute',
                  inset: 0,
                  background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent)',
                  pointerEvents: 'none',
                  zIndex: 0,
                }}
              />
            )}

            {/* Trophy + emoji with glow ring */}
            <div style={{ position: 'relative', flexShrink: 0, zIndex: 1 }}>
              {/* Golden ring glow */}
              <motion.div
                animate={{ scale: [1, 1.3, 1], opacity: [0.5, 0.8, 0.5] }}
                transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                style={{
                  position: 'absolute',
                  inset: -4,
                  borderRadius: 18,
                  background: 'var(--gold, #F5B342)',
                  opacity: 0.3,
                  filter: 'blur(6px)',
                }}
              />
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: [0, 1.4, 1] }}
                transition={{ type: 'spring', stiffness: 350, damping: 18, delay: 0.1 }}
                style={{
                  width: 52,
                  height: 52,
                  borderRadius: 16,
                  background: 'var(--grad-tasks)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 26,
                  boxShadow: 'var(--shadow-md)',
                  position: 'relative',
                }}
              >
                {achievement.emoji ?? '🏆'}
              </motion.div>
            </div>

            {/* Text */}
            <div style={{ flex: 1, minWidth: 0, zIndex: 1 }}>
              <p style={{
                color: 'var(--text-3)',
                fontFamily: 'var(--font-sans)',
                fontWeight: 700,
                fontSize: 10,
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                marginBottom: 2,
              }}>
                Achievement Unlocked
              </p>
              <p style={{
                color: 'var(--text)',
                fontFamily: 'var(--font-sans)',
                fontWeight: 800,
                fontSize: 14,
                lineHeight: 1.2,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}>
                {achievement.name}
              </p>
              {achievement.description && (
                <p style={{
                  color: 'var(--text-2)',
                  fontFamily: 'var(--font-sans)',
                  fontWeight: 500,
                  fontSize: 12,
                  marginTop: 2,
                  lineHeight: 1.3,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}>
                  {achievement.description}
                </p>
              )}
            </div>

            {/* XP reward with count-up */}
            {achievement.xp != null && (
              <motion.div
                initial={{ scale: 0, rotate: -10 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: 'spring', stiffness: 300, damping: 20, delay: 0.3 }}
                style={{
                  flexShrink: 0,
                  background: 'var(--accent-soft)',
                  border: '1px solid var(--accent)',
                  borderRadius: 8,
                  padding: '4px 8px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  zIndex: 1,
                }}
              >
                <span style={{
                  color: 'var(--accent)',
                  fontFamily: 'var(--font-sans)',
                  fontWeight: 900,
                  fontSize: 15,
                  lineHeight: 1,
                }}>
                  <AnimatedXP value={achievement.xp} />
                </span>
                <span style={{
                  color: 'var(--accent)',
                  fontFamily: 'var(--font-sans)',
                  fontWeight: 700,
                  fontSize: 9,
                  letterSpacing: '0.05em',
                  textTransform: 'uppercase',
                }}>
                  XP
                </span>
              </motion.div>
            )}

            {/* Progress bar at bottom */}
            <motion.div
              style={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                height: 3,
                background: 'linear-gradient(90deg, var(--accent), var(--gold, #F5B342))',
                borderRadius: '0 0 var(--card-radius) var(--card-radius)',
              }}
              initial={{ width: '100%' }}
              animate={{ width: '0%' }}
              transition={{ duration: DISMISS_DELAY / 1000, ease: 'linear' }}
            />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
