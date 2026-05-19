import { useEffect, useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

const WMO_EMOJI = {
  0: '☀️', 1: '🌤️', 2: '⛅', 3: '☁️',
  45: '🌫️', 48: '🌫️',
  51: '🌦️', 53: '🌦️', 55: '🌧️',
  61: '🌧️', 63: '🌧️', 65: '🌧️',
  71: '🌨️', 73: '🌨️', 75: '❄️',
  80: '🌦️', 81: '🌧️', 82: '⛈️',
  95: '⛈️', 96: '⛈️', 99: '⛈️',
}

const WMO_DESC = {
  0: 'Clear sky', 1: 'Mainly clear', 2: 'Partly cloudy', 3: 'Overcast',
  45: 'Foggy', 48: 'Icy fog', 51: 'Light drizzle', 53: 'Drizzle', 55: 'Heavy drizzle',
  61: 'Light rain', 63: 'Rain', 65: 'Heavy rain',
  71: 'Light snow', 73: 'Snow', 75: 'Heavy snow',
  80: 'Showers', 81: 'Heavy showers', 82: 'Violent showers',
  95: 'Thunderstorm', 96: 'Thunderstorm', 99: 'Thunderstorm',
}

const CACHE_KEY = 'lifeos_weather'
const TTL = 60 * 60 * 1000 // 1 hour

function getEmojiAnimation(code) {
  if (code === 0 || code === 1) return 'sun'
  if (code === 2 || code === 3) return 'cloud'
  if ([51,53,55,61,63,65,80,81,82].includes(code)) return 'rain'
  if ([71,73,75].includes(code)) return 'snow'
  return 'none'
}

function AnimatedNumber({ value, duration = 800 }) {
  const [display, setDisplay] = useState(0)
  const mountRef = useRef(false)
  useEffect(() => {
    if (!mountRef.current) { mountRef.current = true }
    const start = Date.now()
    const from = 0
    const timer = setInterval(() => {
      const elapsed = Date.now() - start
      const progress = Math.min(elapsed / duration, 1)
      setDisplay(Math.round(from + (value - from) * progress))
      if (progress >= 1) clearInterval(timer)
    }, 16)
    return () => clearInterval(timer)
  }, [value, duration])
  return <span>{display}</span>
}

export default function WeatherWidget() {
  const [state, setState] = useState('idle') // idle | loading | denied | ready | error
  const [weather, setWeather] = useState(null)

  useEffect(() => {
    // Check cache first
    try {
      const cached = JSON.parse(localStorage.getItem(CACHE_KEY) || 'null')
      if (cached && Date.now() - cached.ts < TTL) {
        setWeather(cached.data)
        setState('ready')
        return
      }
    } catch {}

    setState('loading')

    if (!navigator.geolocation) {
      setState('denied')
      return
    }

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude: lat, longitude: lon } = pos.coords
        try {
          const res = await fetch(
            `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code&timezone=auto`
          )
          const json = await res.json()
          const data = {
            temp: Math.round(json.current.temperature_2m),
            code: json.current.weather_code,
            timezone: json.timezone_abbreviation || 'Local',
          }
          localStorage.setItem(CACHE_KEY, JSON.stringify({ data, ts: Date.now() }))
          setWeather(data)
          setState('ready')
        } catch {
          setState('error')
        }
      },
      () => setState('denied')
    )
  }, [])

  if (state === 'idle') return null

  // Shimmer skeleton
  if (state === 'loading') {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--card-radius)',
          padding: '10px 14px',
          height: 48,
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <motion.div
          animate={{ x: ['-100%', '200%'] }}
          transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut' }}
          style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.08), transparent)',
          }}
        />
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, height: '100%' }}>
          <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--border)' }} />
          <div style={{ width: 80, height: 14, borderRadius: 6, background: 'var(--border)' }} />
          <div style={{ width: 60, height: 10, borderRadius: 6, background: 'var(--border)', marginLeft: 4 }} />
        </div>
      </motion.div>
    )
  }

  if (state === 'denied') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--card-radius)',
          padding: '10px 14px',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          height: 48,
        }}
      >
        <span style={{ fontSize: 18 }}>📍</span>
        <span style={{ color: 'var(--text-muted)', fontSize: 12, fontWeight: 500 }}>Allow location for weather</span>
      </motion.div>
    )
  }

  if (state === 'error' || !weather) return null

  const emoji = WMO_EMOJI[weather.code] ?? '🌡️'
  const desc = WMO_DESC[weather.code] ?? 'Weather'
  const anim = getEmojiAnimation(weather.code)

  const emojiVariants = {
    sun: { rotate: [0, 15, 0, -15, 0], transition: { duration: 6, repeat: Infinity, ease: 'easeInOut' } },
    cloud: { y: [0, -3, 0, 3, 0], transition: { duration: 4, repeat: Infinity, ease: 'easeInOut' } },
    rain: { y: [0, 2, 0], transition: { duration: 1, repeat: Infinity, ease: 'easeInOut' } },
    snow: { y: [0, 3, 0], x: [0, 2, 0, -2, 0], transition: { duration: 3, repeat: Infinity, ease: 'easeInOut' } },
    none: {},
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--card-radius)',
        padding: '10px 14px',
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        height: 48,
      }}
    >
      {/* Animated weather emoji */}
      <motion.span
        animate={anim !== 'none' ? emojiVariants[anim] : {}}
        style={{ fontSize: 22, lineHeight: 1, display: 'inline-block' }}
      >
        {emoji}
      </motion.span>

      {/* Temperature */}
      <span style={{ color: 'var(--text)', fontSize: 18, fontWeight: 900, fontFamily: 'var(--font-sans)', lineHeight: 1 }}>
        <AnimatedNumber value={weather.temp} />°C
      </span>

      {/* Description */}
      <span style={{ color: 'var(--text-muted)', fontSize: 12, fontWeight: 500, flex: 1 }}>
        {desc}
      </span>

      {/* Location timezone abbreviation */}
      <span style={{ color: 'var(--text-muted)', fontSize: 11, fontWeight: 600, letterSpacing: '0.04em' }}>
        {weather.timezone}
      </span>
    </motion.div>
  )
}
