import { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useStore } from '../store'

// Level thresholds: index = level - 1
const THRESHOLDS = [0, 100, 250, 500, 1000, 2000, 4000, 8000, 16000, 32000]

function getLevelInfo(xp) {
  let level = 1
  for (let i = THRESHOLDS.length - 1; i >= 0; i--) {
    if (xp >= THRESHOLDS[i]) {
      level = i + 1
      break
    }
  }
  const currentThreshold = THRESHOLDS[level - 1] ?? 0
  const nextThreshold = THRESHOLDS[level] ?? THRESHOLDS[THRESHOLDS.length - 1] * 2
  const progress = (xp - currentThreshold) / (nextThreshold - currentThreshold)
  return { level, currentThreshold, nextThreshold, progress: Math.min(Math.max(progress, 0), 1) }
}

export default function XPBar() {
  const { xp = 0, achievements = [] } = useStore()
  const { level, currentThreshold, nextThreshold, progress } = getLevelInfo(xp)
  const [showPopover, setShowPopover] = useState(false)
  const barRef = useRef(null)

  const xpIntoLevel = xp - currentThreshold
  const xpNeeded = nextThreshold - currentThreshold

  return (
    <div style={{ position: 'relative', userSelect: 'none' }}>
      <div
        ref={barRef}
        onClick={() => setShowPopover((v) => !v)}
        style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}
      >
        {/* Level badge */}
        <div
          style={{
            background: 'var(--grad-tasks)',
            borderRadius: 999,
            padding: '2px 10px',
            flexShrink: 0,
            boxShadow: 'var(--shadow-pop)',
          }}
        >
          <span
            style={{
              color: '#fff',
              fontFamily: 'var(--font-sans)',
              fontWeight: 800,
              fontSize: 11,
              letterSpacing: '0.03em',
            }}
          >
            Lv.{level}
          </span>
        </div>

        {/* Bar track */}
        <div
          style={{
            flex: 1,
            height: 8,
            background: 'var(--surface-3)',
            borderRadius: 999,
            overflow: 'hidden',
            position: 'relative',
          }}
        >
          <motion.div
            initial={{ width: '0%' }}
            animate={{ width: `${progress * 100}%` }}
            transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1], delay: 0.1 }}
            style={{
              height: '100%',
              background: 'var(--accent)',
              borderRadius: 999,
            }}
          />
        </div>

        {/* XP label */}
        <span
          style={{
            color: 'var(--text-3)',
            fontFamily: 'var(--font-sans)',
            fontWeight: 700,
            fontSize: 11,
            flexShrink: 0,
            tabularNums: true,
            letterSpacing: '0.01em',
          }}
        >
          {xpIntoLevel} / {xpNeeded} XP
        </span>
      </div>

      {/* Popover */}
      <AnimatePresence>
        {showPopover && (
          <>
            {/* Backdrop to dismiss */}
            <div
              style={{ position: 'fixed', inset: 0, zIndex: 39 }}
              onClick={() => setShowPopover(false)}
            />
            <motion.div
              initial={{ opacity: 0, y: -6, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -6, scale: 0.95 }}
              transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              style={{
                position: 'absolute',
                top: 'calc(100% + 8px)',
                left: '50%',
                transform: 'translateX(-50%)',
                background: 'var(--card-bg)',
                border: '1px solid var(--card-border)',
                borderRadius: 'var(--card-radius)',
                boxShadow: 'var(--shadow-pop)',
                backdropFilter: 'var(--backdrop)',
                WebkitBackdropFilter: 'var(--backdrop)',
                padding: '12px 16px',
                zIndex: 40,
                minWidth: 180,
                textAlign: 'center',
              }}
            >
              {/* Arrow */}
              <div
                style={{
                  position: 'absolute',
                  top: -6,
                  left: '50%',
                  transform: 'translateX(-50%)',
                  width: 12,
                  height: 6,
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    width: 10,
                    height: 10,
                    background: 'var(--card-bg)',
                    border: '1px solid var(--card-border)',
                    transform: 'rotate(45deg)',
                    marginTop: 3,
                    marginLeft: 1,
                  }}
                />
              </div>

              <p
                style={{
                  color: 'var(--text)',
                  fontFamily: 'var(--font-sans)',
                  fontWeight: 800,
                  fontSize: 13,
                  marginBottom: 4,
                }}
              >
                Level {level}
              </p>
              <p
                style={{
                  color: 'var(--text-3)',
                  fontFamily: 'var(--font-sans)',
                  fontWeight: 600,
                  fontSize: 12,
                  marginBottom: 6,
                }}
              >
                {xp} XP total
              </p>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                  background: 'var(--surface-3)',
                  borderRadius: 8,
                  padding: '6px 10px',
                }}
              >
                <span style={{ fontSize: 14 }}>🏆</span>
                <span
                  style={{
                    color: 'var(--text-2)',
                    fontFamily: 'var(--font-sans)',
                    fontWeight: 700,
                    fontSize: 12,
                  }}
                >
                  {achievements.length} achievement{achievements.length !== 1 ? 's' : ''} unlocked
                </span>
              </div>
              {level < THRESHOLDS.length && (
                <p
                  style={{
                    color: 'var(--text-3)',
                    fontFamily: 'var(--font-sans)',
                    fontWeight: 600,
                    fontSize: 11,
                    marginTop: 8,
                  }}
                >
                  {xpNeeded - xpIntoLevel} XP to Level {level + 1}
                </p>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
