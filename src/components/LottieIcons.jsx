import { useId } from 'react'
import { motion } from 'framer-motion'

// Animated SVG flame — fully self-contained, no external JSON needed
export function LottieFlame({ size = 48 }) {
  const uid = useId().replace(/:/g, '-')
  const grad1Id = `lottie-flame-body-${uid}`
  const grad2Id = `lottie-flame-core-${uid}`
  return (
    <motion.div
      style={{ width: size, height: size, position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      animate={{ scale: [1, 1.08, 0.96, 1.04, 1] }}
      transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
    >
      <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
        {/* Outer glow */}
        <motion.ellipse cx="24" cy="38" rx="10" ry="4"
          fill="rgba(255,100,0,0.25)"
          animate={{ rx: [10, 13, 10], opacity: [0.25, 0.4, 0.25] }}
          transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut' }}
        />
        {/* Main flame body */}
        <motion.path
          d="M24 6 C24 6 30 14 30 20 C30 24 27 26 24 26 C21 26 18 24 18 20 C18 14 24 6 24 6Z"
          fill={`url(#${grad1Id})`}
          animate={{ d: [
            "M24 6 C24 6 30 14 30 20 C30 24 27 26 24 26 C21 26 18 24 18 20 C18 14 24 6 24 6Z",
            "M24 4 C24 4 32 13 31 21 C31 25 27.5 27 24 27 C20.5 27 17 25 17 21 C16 13 24 4 24 4Z",
            "M24 6 C24 6 30 14 30 20 C30 24 27 26 24 26 C21 26 18 24 18 20 C18 14 24 6 24 6Z",
          ]}}
          transition={{ duration: 0.7, repeat: Infinity, ease: 'easeInOut' }}
        />
        {/* Inner hot core */}
        <motion.path
          d="M24 14 C24 14 27 18 27 22 C27 24 25.5 25 24 25 C22.5 25 21 24 21 22 C21 18 24 14 24 14Z"
          fill={`url(#${grad2Id})`}
          animate={{ scale: [1, 1.1, 0.95, 1] }}
          transition={{ duration: 0.9, repeat: Infinity, ease: 'easeInOut' }}
          style={{ transformOrigin: '24px 25px' }}
        />
        {/* Tip spark */}
        <motion.circle cx="24" cy="7" r="2"
          fill="#FFE066"
          animate={{ cy: [7, 5, 7], opacity: [1, 0.6, 1], r: [2, 1.5, 2] }}
          transition={{ duration: 0.8, repeat: Infinity, ease: 'easeInOut' }}
        />
        <defs>
          <linearGradient id={grad1Id} x1="24" y1="6" x2="24" y2="26" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#FF6B00" />
            <stop offset="60%" stopColor="#FF3D00" />
            <stop offset="100%" stopColor="#FF1744" />
          </linearGradient>
          <linearGradient id={grad2Id} x1="24" y1="14" x2="24" y2="25" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#FFE066" />
            <stop offset="100%" stopColor="#FF9800" />
          </linearGradient>
        </defs>
      </svg>
    </motion.div>
  )
}

// Animated checkmark — spring in
export function LottieCheck({ size = 40, color = '#5EBE85', done = true }) {
  return (
    <motion.div style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox="0 0 40 40">
        <motion.circle
          cx="20" cy="20" r="18"
          fill={done ? color : 'transparent'}
          stroke={color}
          strokeWidth="2"
          initial={{ scale: 0 }}
          animate={{ scale: done ? 1 : 0 }}
          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        />
        <motion.path
          d="M12 20 L17 25 L28 14"
          stroke="white"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: done ? 1 : 0 }}
          transition={{ duration: 0.4, ease: 'easeOut', delay: 0.1 }}
        />
      </svg>
    </motion.div>
  )
}

// Animated coin stack — bouncing
export function LottieCoin({ size = 40 }) {
  return (
    <motion.div
      style={{ width: size, height: size, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
    >
      <svg width={size} height={size} viewBox="0 0 40 40">
        <motion.ellipse cx="20" cy="30" rx="12" ry="4" fill="rgba(245,179,66,0.3)"
          animate={{ rx: [12, 14, 12] }}
          transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut' }}
        />
        {[26, 22, 18].map((cy, i) => (
          <motion.g key={i}
            animate={{ y: [0, -3 + i, 0] }}
            transition={{ duration: 1.2, delay: i * 0.15, repeat: Infinity, ease: 'easeInOut' }}
          >
            <ellipse cx="20" cy={cy} rx="10" ry="4" fill={i === 0 ? '#F5B342' : i === 1 ? '#FFD166' : '#FFE29A'} />
            <ellipse cx="20" cy={cy - 1} rx="10" ry="4" fill={i === 0 ? '#E8A020' : i === 1 ? '#F5B342' : '#FFD166'} />
          </motion.g>
        ))}
        <text x="20" y="19" textAnchor="middle" fontSize="8" fontWeight="bold" fill="white" fontFamily="system-ui">€</text>
      </svg>
    </motion.div>
  )
}

// Animated sparkle burst
export function LottieSparkle({ size = 36 }) {
  const sparks = [
    { angle: 0, delay: 0 }, { angle: 45, delay: 0.1 }, { angle: 90, delay: 0.2 },
    { angle: 135, delay: 0.3 }, { angle: 180, delay: 0.4 }, { angle: 225, delay: 0.5 },
    { angle: 270, delay: 0.6 }, { angle: 315, delay: 0.7 },
  ]
  const r = size * 0.35
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <motion.circle cx={size/2} cy={size/2} r={size*0.18}
        fill="#FFD166"
        animate={{ scale: [1, 1.2, 1], opacity: [1, 0.8, 1] }}
        transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
        style={{ transformOrigin: `${size/2}px ${size/2}px` }}
      />
      {sparks.map(({ angle, delay }) => {
        const rad = (angle * Math.PI) / 180
        const x2 = size/2 + r * Math.cos(rad)
        const y2 = size/2 + r * Math.sin(rad)
        return (
          <motion.line key={angle}
            x1={size/2} y1={size/2} x2={x2} y2={y2}
            stroke="#FFD166" strokeWidth={1.5} strokeLinecap="round"
            animate={{ opacity: [0, 1, 0], pathLength: [0, 1, 0] }}
            transition={{ duration: 1.5, delay, repeat: Infinity, ease: 'easeInOut' }}
          />
        )
      })}
    </svg>
  )
}

// Floating heart — for Her page
export function LottieHeart({ size = 32, color = '#FF6B8A' }) {
  return (
    <motion.div
      animate={{ scale: [1, 1.2, 1], y: [0, -3, 0] }}
      transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut' }}
      style={{ display: 'inline-flex' }}
    >
      <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
        <motion.path
          d="M16 28 C16 28 4 20 4 12 C4 8 7 5 11 5 C13 5 15 6.5 16 8 C17 6.5 19 5 21 5 C25 5 28 8 28 12 C28 20 16 28 16 28Z"
          fill={color}
          animate={{ scale: [1, 1.05, 1] }}
          transition={{ duration: 0.8, repeat: Infinity, ease: 'easeInOut' }}
          style={{ transformOrigin: '16px 16px' }}
        />
        <motion.path
          d="M16 28 C16 28 4 20 4 12 C4 8 7 5 11 5 C13 5 15 6.5 16 8 C17 6.5 19 5 21 5 C25 5 28 8 28 12 C28 20 16 28 16 28Z"
          fill="rgba(255,255,255,0.2)"
          clipPath="inset(0 0 50% 0)"
        />
      </svg>
    </motion.div>
  )
}

// Trophy for achievements
export function LottieTrophy({ size = 40 }) {
  const uid = useId().replace(/:/g, '-')
  const gradId = `lottie-trophy-grad-${uid}`
  return (
    <motion.div
      animate={{ rotate: [-8, 8, -8] }}
      transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
      style={{ display: 'inline-flex' }}
    >
      <svg width={size} height={size} viewBox="0 0 40 40" fill="none">
        <path d="M28 8H30C32 8 34 10 34 12C34 16 31 19 27 20L26 20.5" stroke="#F5B342" strokeWidth="2.5" strokeLinecap="round" fill="none"/>
        <path d="M12 8H10C8 8 6 10 6 12C6 16 9 19 13 20L14 20.5" stroke="#F5B342" strokeWidth="2.5" strokeLinecap="round" fill="none"/>
        <path d="M20 30V25" stroke="#F5B342" strokeWidth="2.5" strokeLinecap="round"/>
        <path d="M14 34H26" stroke="#F5B342" strokeWidth="2.5" strokeLinecap="round"/>
        <motion.path
          d="M12 8 C12 8 12 22 20 25 C28 22 28 8 28 8 Z"
          fill={`url(#${gradId})`}
          animate={{ scale: [1, 1.05, 1] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          style={{ transformOrigin: '20px 16px' }}
        />
        <motion.text x="20" y="19" textAnchor="middle" fontSize="8" fill="white" fontWeight="bold" fontFamily="system-ui"
        >★</motion.text>
        <defs>
          <linearGradient id={gradId} x1="20" y1="8" x2="20" y2="25" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#FFD166"/>
            <stop offset="100%" stopColor="#F5B342"/>
          </linearGradient>
        </defs>
      </svg>
    </motion.div>
  )
}

// Calendar icon with animated date
export function LottieCalendar({ size = 40, date }) {
  const uid = useId().replace(/:/g, '-')
  const calGradId   = `lottie-cal-body-${uid}`
  const calHeaderId = `lottie-cal-header-${uid}`
  return (
    <motion.div
      whileHover={{ scale: 1.1, rotate: -3 }}
      transition={{ type: 'spring', stiffness: 400 }}
      style={{ display: 'inline-flex' }}
    >
      <svg width={size} height={size} viewBox="0 0 40 40" fill="none">
        <rect x="4" y="8" width="32" height="28" rx="6" fill={`url(#${calGradId})`} />
        <rect x="4" y="8" width="32" height="10" rx="6" fill={`url(#${calHeaderId})`} />
        <rect x="4" y="14" width="32" height="4" fill={`url(#${calHeaderId})`} />
        <line x1="12" y1="4" x2="12" y2="12" stroke="rgba(255,255,255,0.6)" strokeWidth="2.5" strokeLinecap="round"/>
        <line x1="28" y1="4" x2="28" y2="12" stroke="rgba(255,255,255,0.6)" strokeWidth="2.5" strokeLinecap="round"/>
        <text x="20" y="30" textAnchor="middle" fontSize="12" fontWeight="800" fill="white" fontFamily="system-ui">
          {date || new Date().getDate()}
        </text>
        <defs>
          <linearGradient id={calGradId} x1="4" y1="8" x2="36" y2="36" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="var(--accent, #4F7CFF)"/>
            <stop offset="100%" stopColor="var(--accent-2, #7BC7BE)"/>
          </linearGradient>
          <linearGradient id={calHeaderId} x1="4" y1="8" x2="36" y2="18" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="rgba(0,0,0,0.2)"/>
            <stop offset="100%" stopColor="rgba(0,0,0,0.1)"/>
          </linearGradient>
        </defs>
      </svg>
    </motion.div>
  )
}
