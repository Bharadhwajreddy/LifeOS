import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useStore } from '../store'

// ── Constants ────────────────────────────────────────────────────────────────

const DURATIONS = { work: 25 * 60, short_break: 5 * 60, long_break: 15 * 60 }

// Mode sequence: 4 work sessions separated by short breaks, ending with long break
// pattern: work, short_break, work, short_break, work, short_break, work, long_break, repeat
const MODE_SEQUENCE = [
  'work', 'short_break',
  'work', 'short_break',
  'work', 'short_break',
  'work', 'long_break',
]

const MODE_LABELS = {
  work: 'FOCUS',
  short_break: 'SHORT BREAK',
  long_break: 'LONG BREAK',
}

const MODE_COLORS = {
  work: 'var(--accent)',
  short_break: 'var(--success)',
  long_break: 'var(--accent-2)',
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function formatTime(secs) {
  const m = Math.floor(secs / 60)
  const s = secs % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

function nextMode(currentMode, totalSessions) {
  const idx = MODE_SEQUENCE.indexOf(currentMode)
  const nextIdx = (idx + 1) % MODE_SEQUENCE.length
  return MODE_SEQUENCE[nextIdx]
}

// ── SVG Ring ─────────────────────────────────────────────────────────────────

function TimerRing({ seconds, mode, size = 160 }) {
  const r = 70
  const circ = 2 * Math.PI * r
  const maxSeconds = DURATIONS[mode] ?? DURATIONS.work
  const pct = seconds / maxSeconds
  const offset = circ * (1 - pct)
  const color = MODE_COLORS[mode]

  return (
    <svg
      width={size}
      height={size}
      style={{ transform: 'rotate(-90deg)', position: 'absolute', top: 0, left: 0 }}
    >
      {/* Track */}
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke="var(--surface-3)"
        strokeWidth={8}
      />
      {/* Progress arc */}
      <motion.circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke={color}
        strokeWidth={8}
        strokeLinecap="round"
        strokeDasharray={circ}
        animate={{ strokeDashoffset: offset }}
        transition={{ duration: 0.4, ease: 'linear' }}
      />
    </svg>
  )
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function PomodoroWidget() {
  const { pomodoro = {}, setPomodoroState } = useStore()
  const {
    active = false,
    taskId = null,
    taskLabel = '',
    mode = 'work',
    seconds: storeSeconds = DURATIONS.work,
    totalSessions = 0,
  } = pomodoro

  // Local state
  const [localSeconds, setLocalSeconds] = useState(storeSeconds)
  const [paused, setPaused] = useState(false)
  const [expanded, setExpanded] = useState(false)
  const intervalRef = useRef(null)
  const localSecondsRef = useRef(localSeconds)

  // Keep ref in sync
  useEffect(() => {
    localSecondsRef.current = localSeconds
  }, [localSeconds])

  // Sync from store when mode/seconds changes externally (e.g. launcher called)
  useEffect(() => {
    setLocalSeconds(storeSeconds)
    setPaused(false)
  }, [mode, storeSeconds, active])

  // Expand widget automatically when a new session starts
  useEffect(() => {
    if (active) setExpanded(true)
  }, [active])

  // Ticker
  useEffect(() => {
    if (!active || paused) {
      clearInterval(intervalRef.current)
      return
    }

    intervalRef.current = setInterval(() => {
      setLocalSeconds((prev) => {
        if (prev <= 1) {
          // Session ended — advance mode
          const newSessions = mode === 'work' ? totalSessions + 1 : totalSessions
          const next = nextMode(mode, newSessions)
          const nextSecs = DURATIONS[next]

          // Optional bell
          try {
            const ctx = new (window.AudioContext || window.webkitAudioContext)()
            const osc = ctx.createOscillator()
            const gain = ctx.createGain()
            osc.connect(gain)
            gain.connect(ctx.destination)
            osc.frequency.value = 880
            gain.gain.setValueAtTime(0.3, ctx.currentTime)
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.8)
            osc.start(ctx.currentTime)
            osc.stop(ctx.currentTime + 0.8)
          } catch (_) { /* audio unavailable — silently skip */ }

          setPomodoroState?.({
            mode: next,
            seconds: nextSecs,
            totalSessions: newSessions,
            active: true,
          })
          return nextSecs
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(intervalRef.current)
  }, [active, paused, mode, totalSessions, setPomodoroState])

  // Sync local seconds to store every 5s (and on pause/stop)
  useEffect(() => {
    if (!active) return
    const t = setInterval(() => {
      setPomodoroState?.({ seconds: localSecondsRef.current })
    }, 5000)
    return () => clearInterval(t)
  }, [active, setPomodoroState])

  const handlePauseToggle = useCallback(() => {
    setPaused((p) => !p)
    // Flush seconds to store
    setPomodoroState?.({ seconds: localSecondsRef.current })
  }, [setPomodoroState])

  const handleSkip = useCallback(() => {
    const newSessions = mode === 'work' ? totalSessions + 1 : totalSessions
    const next = nextMode(mode, newSessions)
    const nextSecs = DURATIONS[next]
    setPomodoroState?.({ mode: next, seconds: nextSecs, totalSessions: newSessions, active: true })
    setPaused(false)
  }, [mode, totalSessions, setPomodoroState])

  const handleStop = useCallback(() => {
    clearInterval(intervalRef.current)
    setPomodoroState?.({ active: false, seconds: DURATIONS.work, mode: 'work', taskId: null, taskLabel: '' })
    setExpanded(false)
    setPaused(false)
  }, [setPomodoroState])

  if (!active) return null

  const modeColor = MODE_COLORS[mode]
  const ringSize = 200

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 88,
        right: 16,
        zIndex: 50,
      }}
    >
      <AnimatePresence mode="wait" initial={false}>
        {!expanded ? (
          /* ── Minimized pill ─────────────────────────────────────── */
          <motion.button
            key="pill"
            initial={{ scale: 0.7, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.7, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 400, damping: 28 }}
            onClick={() => setExpanded(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              background: 'var(--card-bg)',
              border: `1.5px solid ${modeColor}`,
              borderRadius: 999,
              padding: '8px 14px',
              boxShadow: `var(--shadow-pop)`,
              backdropFilter: 'var(--backdrop)',
              WebkitBackdropFilter: 'var(--backdrop)',
              cursor: 'pointer',
              outline: 'none',
            }}
            whileTap={{ scale: 0.93 }}
          >
            <span style={{ fontSize: 16 }}>🍅</span>
            <span
              style={{
                color: modeColor,
                fontFamily: 'var(--font-sans)',
                fontWeight: 800,
                fontSize: 14,
                letterSpacing: '0.02em',
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              {formatTime(localSeconds)}
            </span>
          </motion.button>
        ) : (
          /* ── Expanded circular widget ────────────────────────────── */
          <motion.div
            key="expanded"
            initial={{ scale: 0.6, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.6, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 380, damping: 28 }}
            style={{
              background: 'var(--card-bg)',
              border: '1px solid var(--card-border)',
              borderRadius: 'var(--radius-xl)',
              boxShadow: 'var(--shadow-pop)',
              backdropFilter: 'var(--backdrop)',
              WebkitBackdropFilter: 'var(--backdrop)',
              padding: 20,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 14,
              width: 240,
            }}
          >
            {/* Header row */}
            <div
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              {/* Mode label */}
              <span
                style={{
                  color: modeColor,
                  fontFamily: 'var(--font-sans)',
                  fontWeight: 800,
                  fontSize: 11,
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                }}
              >
                {MODE_LABELS[mode]}
              </span>

              {/* Minimize button */}
              <button
                onClick={() => setExpanded(false)}
                style={{
                  background: 'var(--surface-3)',
                  border: 'none',
                  borderRadius: 999,
                  width: 22,
                  height: 22,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  color: 'var(--text-3)',
                  fontSize: 14,
                  lineHeight: 1,
                  padding: 0,
                }}
              >
                –
              </button>
            </div>

            {/* SVG ring + time display */}
            <div
              style={{
                position: 'relative',
                width: ringSize,
                height: ringSize,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <TimerRing seconds={localSeconds} mode={mode} size={ringSize} />

              {/* Center content */}
              <div style={{ textAlign: 'center', zIndex: 1 }}>
                <motion.p
                  key={localSeconds}
                  style={{
                    color: 'var(--text)',
                    fontFamily: 'var(--font-sans)',
                    fontWeight: 900,
                    fontSize: 36,
                    lineHeight: 1,
                    letterSpacing: '-0.02em',
                    fontVariantNumeric: 'tabular-nums',
                  }}
                >
                  {formatTime(localSeconds)}
                </motion.p>
                {taskLabel && (
                  <p
                    style={{
                      color: 'var(--text-3)',
                      fontFamily: 'var(--font-sans)',
                      fontWeight: 600,
                      fontSize: 11,
                      marginTop: 4,
                      maxWidth: 110,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {taskLabel}
                  </p>
                )}
                {/* Session dots */}
                <div
                  style={{
                    display: 'flex',
                    gap: 4,
                    justifyContent: 'center',
                    marginTop: 6,
                  }}
                >
                  {[0, 1, 2, 3].map((i) => (
                    <div
                      key={i}
                      style={{
                        width: 6,
                        height: 6,
                        borderRadius: '50%',
                        background:
                          i < (totalSessions % 4)
                            ? modeColor
                            : 'var(--surface-3)',
                        transition: 'background 0.3s',
                      }}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Controls */}
            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
              {/* Stop */}
              <motion.button
                whileTap={{ scale: 0.88 }}
                onClick={handleStop}
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: '50%',
                  background: 'var(--surface-3)',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 14,
                }}
                title="Stop"
              >
                ■
              </motion.button>

              {/* Play / Pause */}
              <motion.button
                whileTap={{ scale: 0.88 }}
                onClick={handlePauseToggle}
                style={{
                  width: 52,
                  height: 52,
                  borderRadius: '50%',
                  background: modeColor,
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: 'var(--shadow-pop)',
                  fontSize: 20,
                  color: '#fff',
                }}
                title={paused ? 'Resume' : 'Pause'}
              >
                <AnimatePresence mode="wait" initial={false}>
                  <motion.span
                    key={paused ? 'play' : 'pause'}
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.5, opacity: 0 }}
                    transition={{ duration: 0.15 }}
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  >
                    {paused ? '▶' : '⏸'}
                  </motion.span>
                </AnimatePresence>
              </motion.button>

              {/* Skip */}
              <motion.button
                whileTap={{ scale: 0.88 }}
                onClick={handleSkip}
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: '50%',
                  background: 'var(--surface-3)',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 14,
                  color: 'var(--text-2)',
                }}
                title="Skip"
              >
                ⏭
              </motion.button>
            </div>

            {/* Sessions count */}
            <p
              style={{
                color: 'var(--text-3)',
                fontFamily: 'var(--font-sans)',
                fontWeight: 600,
                fontSize: 11,
              }}
            >
              Session {Math.floor(totalSessions % 4) + 1} of 4
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ── Public hook ───────────────────────────────────────────────────────────────

export function usePomodoroLauncher() {
  const { setPomodoroState } = useStore()
  return useCallback(
    (taskId, taskLabel) => {
      setPomodoroState?.({
        active: true,
        taskId,
        taskLabel,
        mode: 'work',
        seconds: DURATIONS.work,
      })
    },
    [setPomodoroState]
  )
}
