import { useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

const DISMISS_DELAY = 4000

/**
 * AchievementToast
 *
 * Props:
 *   achievement: { id, name, description, xp, emoji } | null
 *   onDismiss: () => void
 */
export default function AchievementToast({ achievement, onDismiss }) {
  // Auto-dismiss after 4 seconds
  useEffect(() => {
    if (!achievement) return
    const t = setTimeout(onDismiss, DISMISS_DELAY)
    return () => clearTimeout(t)
  }, [achievement, onDismiss])

  // Respect reduced motion
  const prefersReducedMotion =
    typeof window !== 'undefined' &&
    window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

  const variants = prefersReducedMotion
    ? {
        initial: { opacity: 0 },
        animate: { opacity: 1 },
        exit: { opacity: 0 },
      }
    : {
        initial: { y: 80, opacity: 0 },
        animate: { y: 0, opacity: 1 },
        exit: { y: 80, opacity: 0 },
      }

  const transition = prefersReducedMotion
    ? { duration: 0.15 }
    : { type: 'spring', stiffness: 400, damping: 30 }

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
            maxWidth: 320,
            width: 'calc(100vw - 32px)',
            zIndex: 60,
            cursor: 'pointer',
            background: 'var(--card-bg)',
            border: '1px solid var(--card-border)',
            borderRadius: 'var(--card-radius)',
            boxShadow: 'var(--shadow-pop)',
            backdropFilter: 'var(--backdrop)',
            WebkitBackdropFilter: 'var(--backdrop)',
            padding: '14px 16px',
            display: 'flex',
            alignItems: 'center',
            gap: 12,
          }}
        >
          {/* Trophy + emoji stack */}
          <div
            style={{
              width: 48,
              height: 48,
              flexShrink: 0,
              borderRadius: 14,
              background: 'var(--grad-tasks)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 24,
              boxShadow: 'var(--shadow-md)',
            }}
          >
            {achievement.emoji ?? '🏆'}
          </div>

          {/* Text */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <p
              style={{
                color: 'var(--text-3)',
                fontFamily: 'var(--font-sans)',
                fontWeight: 700,
                fontSize: 10,
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                marginBottom: 2,
              }}
            >
              Achievement Unlocked
            </p>
            <p
              style={{
                color: 'var(--text)',
                fontFamily: 'var(--font-sans)',
                fontWeight: 800,
                fontSize: 14,
                lineHeight: 1.2,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {achievement.name}
            </p>
            {achievement.description && (
              <p
                style={{
                  color: 'var(--text-2)',
                  fontFamily: 'var(--font-sans)',
                  fontWeight: 500,
                  fontSize: 12,
                  marginTop: 2,
                  lineHeight: 1.3,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {achievement.description}
              </p>
            )}
          </div>

          {/* XP reward */}
          {achievement.xp != null && (
            <div
              style={{
                flexShrink: 0,
                background: 'var(--accent-soft)',
                borderRadius: 8,
                padding: '4px 8px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
              }}
            >
              <span
                style={{
                  color: 'var(--accent)',
                  fontFamily: 'var(--font-sans)',
                  fontWeight: 900,
                  fontSize: 15,
                  lineHeight: 1,
                }}
              >
                +{achievement.xp}
              </span>
              <span
                style={{
                  color: 'var(--accent)',
                  fontFamily: 'var(--font-sans)',
                  fontWeight: 700,
                  fontSize: 9,
                  letterSpacing: '0.05em',
                  textTransform: 'uppercase',
                }}
              >
                XP
              </span>
            </div>
          )}

          {/* Progress bar at bottom */}
          <motion.div
            style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              height: 3,
              background: 'var(--accent)',
              borderRadius: '0 0 var(--card-radius) var(--card-radius)',
            }}
            initial={{ width: '100%' }}
            animate={{ width: '0%' }}
            transition={{ duration: DISMISS_DELAY / 1000, ease: 'linear' }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  )
}
