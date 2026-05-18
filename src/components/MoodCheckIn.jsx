import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useStore } from '../store'

const MOODS = [
  { value: 1, emoji: '😴', label: 'Exhausted' },
  { value: 2, emoji: '😓', label: 'Stressed' },
  { value: 3, emoji: '😐', label: 'Neutral' },
  { value: 4, emoji: '😊', label: 'Good' },
  { value: 5, emoji: '🤩', label: 'Amazing' },
]

function todayKey() {
  return new Date().toISOString().slice(0, 10) // 'YYYY-MM-DD'
}

export default function MoodCheckIn() {
  const { moodLog = [], logMood } = useStore()
  const [justLogged, setJustLogged] = useState(false)

  const todayEntry = moodLog.find?.((m) => m.date === todayKey())
  const logged = !!todayEntry || justLogged

  // Get the selected mood entry if we just logged
  const selectedMood = justLogged
    ? moodLog.find?.((m) => m.date === todayKey())
    : todayEntry

  const handleSelect = (value) => {
    if (logged) return
    logMood?.({ date: todayKey(), mood: value })
    setJustLogged(true)
  }

  return (
    <div
      style={{
        background: 'var(--card-bg)',
        border: '1px solid var(--card-border)',
        borderRadius: 'var(--card-radius)',
        boxShadow: 'var(--shadow-md)',
        backdropFilter: 'var(--backdrop)',
        WebkitBackdropFilter: 'var(--backdrop)',
        padding: '12px 16px',
      }}
    >
      <AnimatePresence mode="wait" initial={false}>
        {!logged ? (
          /* ── Picker ─────────────────────────────────────────────── */
          <motion.div
            key="picker"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
          >
            <p
              style={{
                color: 'var(--text-3)',
                fontFamily: 'var(--font-sans)',
                fontWeight: 700,
                fontSize: 11,
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                marginBottom: 10,
              }}
            >
              How are you feeling?
            </p>
            <div
              style={{
                display: 'flex',
                gap: 6,
                justifyContent: 'space-between',
              }}
            >
              {MOODS.map(({ value, emoji, label }) => (
                <motion.button
                  key={value}
                  onClick={() => handleSelect(value)}
                  whileTap={{ scale: 0.85 }}
                  whileHover={{ scale: 1.12 }}
                  title={label}
                  style={{
                    flex: 1,
                    background: 'var(--surface-3)',
                    border: '1.5px solid transparent',
                    borderRadius: 12,
                    padding: '10px 4px',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 4,
                    outline: 'none',
                  }}
                >
                  <span style={{ fontSize: 22, lineHeight: 1 }}>{emoji}</span>
                  <span
                    style={{
                      color: 'var(--text-3)',
                      fontFamily: 'var(--font-sans)',
                      fontWeight: 600,
                      fontSize: 9,
                      textTransform: 'uppercase',
                      letterSpacing: '0.04em',
                    }}
                  >
                    {label}
                  </span>
                </motion.button>
              ))}
            </div>
          </motion.div>
        ) : (
          /* ── Logged state ───────────────────────────────────────── */
          <motion.div
            key="logged"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ type: 'spring', stiffness: 400, damping: 28 }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
            }}
          >
            {/* Big emoji */}
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 500, damping: 22, delay: 0.05 }}
              style={{ fontSize: 32, lineHeight: 1, flexShrink: 0 }}
            >
              {MOODS.find((m) => m.value === (selectedMood?.mood ?? justLogged))?.emoji ?? '😊'}
            </motion.span>

            <div>
              <p
                style={{
                  color: 'var(--text)',
                  fontFamily: 'var(--font-sans)',
                  fontWeight: 800,
                  fontSize: 14,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                Mood logged
                {/* Animated checkmark */}
                <motion.span
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 20, delay: 0.15 }}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: 18,
                    height: 18,
                    borderRadius: '50%',
                    background: 'var(--success)',
                    flexShrink: 0,
                  }}
                >
                  <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                    <path
                      d="M1 4l3 3 5-6"
                      stroke="#fff"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </motion.span>
              </p>
              <p
                style={{
                  color: 'var(--text-3)',
                  fontFamily: 'var(--font-sans)',
                  fontWeight: 600,
                  fontSize: 12,
                  marginTop: 2,
                }}
              >
                {MOODS.find((m) => m.value === selectedMood?.mood)?.label ?? 'Feeling good'} today
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
