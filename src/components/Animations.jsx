import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'

// ─── AnimatedNumber ────────────────────────────────────────────────────────────
export function AnimatedNumber({ value, duration = 800, prefix = '', suffix = '' }) {
  const [displayed, setDisplayed] = useState(0)
  const startRef   = useRef(null)
  const frameRef   = useRef(null)
  const fromRef    = useRef(0)

  useEffect(() => {
    fromRef.current = displayed
    startRef.current = null
    const target = Number(value) || 0

    const tick = (ts) => {
      if (!startRef.current) startRef.current = ts
      const elapsed = ts - startRef.current
      const progress = Math.min(elapsed / duration, 1)
      // ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3)
      setDisplayed(Math.round(fromRef.current + (target - fromRef.current) * eased))
      if (progress < 1) frameRef.current = requestAnimationFrame(tick)
    }

    frameRef.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frameRef.current)
  }, [value, duration]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <span>{prefix}{displayed.toLocaleString()}{suffix}</span>
  )
}

// ─── ProgressRingAnimated ──────────────────────────────────────────────────────
export function ProgressRingAnimated({
  done,
  total,
  size = 52,
  strokeWidth = 4,
  color = 'rgba(255,255,255,0.9)',
  trackColor = 'rgba(255,255,255,0.2)',
}) {
  const r    = (size - strokeWidth) / 2
  const circ = 2 * Math.PI * r
  const pct  = total > 0 ? Math.min(done / total, 1) : 0

  return (
    <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
      {/* track */}
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke={trackColor}
        strokeWidth={strokeWidth}
      />
      {/* animated progress */}
      <motion.circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeDasharray={circ}
        initial={{ pathLength: 0 }}
        animate={{ pathLength: pct }}
        transition={{ duration: 1, ease: 'easeOut', delay: 0.3 }}
        style={{ strokeDashoffset: 0 }}
      />
    </svg>
  )
}

// ─── PulsingDot ───────────────────────────────────────────────────────────────
export function PulsingDot({ color = 'var(--accent)', size = 8 }) {
  return (
    <span style={{ position: 'relative', display: 'inline-flex', width: size, height: size }}>
      {/* outer pulse ring */}
      <motion.span
        style={{
          position: 'absolute',
          inset: 0,
          borderRadius: 9999,
          background: color,
          opacity: 1,
        }}
        animate={{ scale: [1, 1.8, 1], opacity: [1, 0, 1] }}
        transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
      />
      {/* inner solid dot */}
      <span
        style={{
          position: 'relative',
          width: size,
          height: size,
          borderRadius: 9999,
          background: color,
          display: 'inline-block',
        }}
      />
    </span>
  )
}

// ─── FlameIcon ────────────────────────────────────────────────────────────────
export function FlameIcon({ size = 24 }) {
  return (
    <motion.span
      style={{ display: 'inline-flex', fontSize: size, lineHeight: 1, userSelect: 'none' }}
      animate={{ scale: [1, 1.15, 1] }}
      transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut' }}
    >
      🔥
    </motion.span>
  )
}

// ─── SparkleIcon ──────────────────────────────────────────────────────────────
export function SparkleIcon({ size = 20 }) {
  return (
    <motion.span
      style={{ display: 'inline-flex', fontSize: size, lineHeight: 1, userSelect: 'none' }}
      animate={{ rotate: [0, 15, -15, 0], scale: [1, 1.2, 1] }}
      transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
    >
      ✨
    </motion.span>
  )
}

// ─── FloatingOrb ──────────────────────────────────────────────────────────────
export function FloatingOrb({ color, size = 120, top, left, right, bottom, opacity = 0.12 }) {
  const dur = useRef(6 + Math.random() * 4).current

  return (
    <motion.div
      style={{
        position: 'absolute',
        width: size,
        height: size,
        borderRadius: 9999,
        background: color,
        filter: 'blur(40px)',
        pointerEvents: 'none',
        opacity,
        top,
        left,
        right,
        bottom,
      }}
      animate={{ y: [0, -15, 0], x: [0, 8, 0] }}
      transition={{ duration: dur, repeat: Infinity, ease: 'easeInOut' }}
    />
  )
}

// ─── StaggerContainer ─────────────────────────────────────────────────────────
export function StaggerContainer({ children, delay = 0, stagger = 0.08, ...props }) {
  return (
    <motion.div
      variants={{
        show: {
          transition: {
            staggerChildren: stagger,
            delayChildren: delay,
          },
        },
      }}
      initial="hidden"
      animate="show"
      {...props}
    >
      {children}
    </motion.div>
  )
}

// ─── StaggerItem ──────────────────────────────────────────────────────────────
export function StaggerItem({ children, ...props }) {
  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 16 },
        show: {
          opacity: 1,
          y: 0,
          transition: { duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] },
        },
      }}
      {...props}
    >
      {children}
    </motion.div>
  )
}

// ─── CardHover ────────────────────────────────────────────────────────────────
export function CardHover({ children, style, className, onClick }) {
  return (
    <motion.div
      style={style}
      className={className}
      onClick={onClick}
      whileHover={{ y: -2, scale: 1.01 }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
    >
      {children}
    </motion.div>
  )
}
