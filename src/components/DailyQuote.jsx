import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

const QUOTES = [
  { text: "The secret of getting ahead is getting started.", author: "Mark Twain" },
  { text: "It always seems impossible until it's done.", author: "Nelson Mandela" },
  { text: "Don't watch the clock; do what it does. Keep going.", author: "Sam Levenson" },
  { text: "The future depends on what you do today.", author: "Mahatma Gandhi" },
  { text: "Success is not final, failure is not fatal.", author: "Winston Churchill" },
  { text: "Hard work beats talent when talent doesn't work hard.", author: "Tim Notke" },
  { text: "You are never too old to set another goal.", author: "C.S. Lewis" },
  { text: "Quality is not an act, it is a habit.", author: "Aristotle" },
  { text: "The only way to do great work is to love what you do.", author: "Steve Jobs" },
  { text: "Believe you can and you're halfway there.", author: "Theodore Roosevelt" },
  { text: "Your limitation—it's only your imagination.", author: "Unknown" },
  { text: "Push yourself, because no one else is going to do it for you.", author: "Unknown" },
  { text: "Great things never come from comfort zones.", author: "Unknown" },
  { text: "Dream it. Wish it. Do it.", author: "Unknown" },
  { text: "Success doesn't just find you. You have to go out and get it.", author: "Unknown" },
  { text: "The harder you work for something, the greater you'll feel when you achieve it.", author: "Unknown" },
  { text: "Dream bigger. Do bigger.", author: "Unknown" },
  { text: "Don't stop when you're tired. Stop when you're done.", author: "Unknown" },
  { text: "Wake up with determination. Go to bed with satisfaction.", author: "Unknown" },
  { text: "Do something today that your future self will thank you for.", author: "Unknown" },
  { text: "Little things make big days.", author: "Unknown" },
  { text: "It's going to be hard, but hard is not impossible.", author: "Unknown" },
  { text: "Don't wait for opportunity. Create it.", author: "Unknown" },
  { text: "Stay foolish to stay sane.", author: "Maxime Lagacé" },
  { text: "When you feel like quitting, think about why you started.", author: "Unknown" },
  { text: "The key to success is to focus on goals, not obstacles.", author: "Unknown" },
  { text: "Strive for progress, not perfection.", author: "Unknown" },
  { text: "It's not about how bad you want it. It's about how hard you're willing to work for it.", author: "Unknown" },
  { text: "You didn't come this far to only come this far.", author: "Unknown" },
  { text: "Every day is a second chance.", author: "Unknown" },
  { text: "The secret to getting ahead is getting started.", author: "Agatha Christie" },
  { text: "Keep going. Everything you need will come to you at the perfect time.", author: "Unknown" },
  { text: "Difficult roads often lead to beautiful destinations.", author: "Unknown" },
  { text: "The best time to plant a tree was 20 years ago. The second best time is now.", author: "Chinese Proverb" },
  { text: "Discipline is choosing between what you want now and what you want most.", author: "Abraham Lincoln" },
]

export default function DailyQuote() {
  const dayIndex = Math.floor(Date.now() / 86400000) % QUOTES.length
  const quote = QUOTES[dayIndex]
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    navigator.clipboard?.writeText(`"${quote.text}" — ${quote.author}`).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 1800)
    })
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      style={{
        background: 'var(--surface)',
        borderRadius: 'var(--card-radius)',
        borderLeft: '3px solid var(--accent)',
        border: '1px solid var(--border)',
        borderLeftWidth: 3,
        borderLeftColor: 'var(--accent)',
        padding: '12px 14px',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Subtle background pattern */}
      <div style={{
        position: 'absolute', top: -8, right: -8,
        fontSize: 48, opacity: 0.04, lineHeight: 1,
        pointerEvents: 'none', userSelect: 'none',
      }}>
        "
      </div>

      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{
            color: 'var(--text)',
            fontSize: 13,
            fontStyle: 'italic',
            fontWeight: 500,
            lineHeight: 1.5,
            marginBottom: 6,
          }}>
            "{quote.text}"
          </p>
          <p style={{
            color: 'var(--text-muted)',
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
          }}>
            — {quote.author}
          </p>
        </div>

        {/* Share / copy button */}
        <button
          onClick={handleCopy}
          style={{
            flexShrink: 0,
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: '4px 6px',
            borderRadius: 6,
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            color: 'var(--text-muted)',
            fontSize: 11,
            fontWeight: 600,
            transition: 'color 0.2s',
          }}
          title="Copy quote"
        >
          <AnimatePresence mode="wait">
            {copied ? (
              <motion.span
                key="copied"
                initial={{ opacity: 0, scale: 0.7 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.7 }}
                style={{ color: 'var(--success)', fontSize: 12 }}
              >
                ✓ Copied!
              </motion.span>
            ) : (
              <motion.span
                key="copy"
                initial={{ opacity: 0, scale: 0.7 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.7 }}
                style={{ fontSize: 14 }}
              >
                📋
              </motion.span>
            )}
          </AnimatePresence>
        </button>
      </div>
    </motion.div>
  )
}
