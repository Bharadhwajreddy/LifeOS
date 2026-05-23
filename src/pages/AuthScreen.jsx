import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { signInWithPopup } from 'firebase/auth'
import { auth, provider } from '../lib/firebase'
import { useStore } from '../store'

const CURRENCIES = ['€', '$', '£', '₹', '¥', '₩', 'CHF', 'AED']

export default function AuthScreen() {
  const { setUser, setIsOnboarded, setName, setCurrency, addIncomeSource } = useStore()
  const [step, setStep] = useState('login')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  // onboard form
  const [displayName, setDisplayName] = useState('')
  const [currency, setCurrencyLocal] = useState('€')
  const [newSource, setNewSource] = useState('')
  const [sources, setSources] = useState(['Salary', 'Freelance'])

  const handleGoogleLogin = async () => {
    if (!auth) { setError('Firebase not configured yet'); return }
    setLoading(true)
    setError('')
    try {
      const result = await signInWithPopup(auth, provider)
      const user = result.user
      setUser({
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL,
      })
      // Check if user already has a name set (returning user)
      const { name: existingName } = useStore.getState()
      if (existingName && existingName !== 'Bharadhwaj') {
        setIsOnboarded(true)
        // Don't show onboarding — they already set up
      } else {
        setDisplayName(user.displayName?.split(' ')[0] || '')
        setStep('onboard')
      }
    } catch (e) {
      setError('Sign-in failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleFinishOnboarding = () => {
    if (!displayName.trim()) return
    setName(displayName.trim())
    setCurrency(currency)
    // Replace default income sources with user's
    sources.forEach(s => addIncomeSource(s))
    setIsOnboarded(true)
  }

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      background: 'var(--bg)', padding: '24px',
    }}>
      {/* Animated background orbs */}
      <motion.div animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
        style={{ position: 'fixed', top: '10%', left: '20%', width: 200, height: 200,
          borderRadius: '50%', background: 'var(--accent)', filter: 'blur(80px)', opacity: 0.3, pointerEvents: 'none' }}
      />
      <motion.div animate={{ scale: [1.2, 1, 1.2], opacity: [0.2, 0.4, 0.2] }}
        transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
        style={{ position: 'fixed', bottom: '20%', right: '15%', width: 160, height: 160,
          borderRadius: '50%', background: 'var(--accent-2)', filter: 'blur(60px)', opacity: 0.25, pointerEvents: 'none' }}
      />

      <AnimatePresence mode="wait">
        {step === 'login' ? (
          <motion.div key="login"
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
            style={{ width: '100%', maxWidth: 380, textAlign: 'center', position: 'relative', zIndex: 1 }}
          >
            {/* Logo / App icon */}
            <motion.div
              animate={{ rotate: [0, 5, -5, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
              style={{ fontSize: 64, marginBottom: 16 }}
            >🌟</motion.div>

            <h1 style={{ fontSize: 32, fontWeight: 800, color: 'var(--text)', margin: '0 0 8px',
              fontFamily: 'var(--font-display)', letterSpacing: '-0.02em' }}>
              LifeOS
            </h1>
            <p style={{ fontSize: 15, color: 'var(--text-muted, var(--text-3))', margin: '0 0 40px', lineHeight: 1.5 }}>
              Your personal life operating system.<br/>Sign in to sync across all your devices.
            </p>

            {/* Google Sign-In button */}
            <motion.button
              whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
              onClick={handleGoogleLogin}
              disabled={loading}
              style={{
                width: '100%', padding: '14px 20px', borderRadius: 16,
                background: 'var(--surface)', border: '1px solid var(--border)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12,
                cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1,
                fontSize: 15, fontWeight: 600, color: 'var(--text)',
                boxShadow: '0 2px 12px rgba(0,0,0,0.12)',
              }}
            >
              {/* Google "G" logo SVG */}
              <svg width="20" height="20" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              {loading ? 'Signing in…' : 'Continue with Google'}
            </motion.button>

            {error && (
              <p style={{ marginTop: 12, fontSize: 13, color: 'var(--danger)' }}>{error}</p>
            )}

            <p style={{ marginTop: 24, fontSize: 12, color: 'var(--text-muted, var(--text-3))', lineHeight: 1.6 }}>
              Your data is stored in your own Firebase account.<br/>We never see or share your information.
            </p>
          </motion.div>

        ) : (
          <motion.div key="onboard"
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
            style={{ width: '100%', maxWidth: 380, position: 'relative', zIndex: 1 }}
          >
            <div style={{ textAlign: 'center', marginBottom: 28 }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>👋</div>
              <h2 style={{ fontSize: 24, fontWeight: 800, color: 'var(--text)', margin: '0 0 8px',
                fontFamily: 'var(--font-display)' }}>Quick setup</h2>
              <p style={{ fontSize: 14, color: 'var(--text-muted, var(--text-3))', margin: 0 }}>
                Just a few things to personalise your LifeOS
              </p>
            </div>

            {/* Name */}
            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 700, letterSpacing: '0.07em',
                textTransform: 'uppercase', color: 'var(--text-muted, var(--text-3))', marginBottom: 6 }}>
                Your first name
              </label>
              <input value={displayName} onChange={e => setDisplayName(e.target.value)}
                placeholder="e.g. Bharadhwaj"
                style={{ width: '100%', padding: '12px 14px', borderRadius: 12,
                  background: 'var(--surface-3, var(--surface))', border: '1px solid var(--border)',
                  color: 'var(--text)', fontSize: 15, outline: 'none', boxSizing: 'border-box',
                  fontFamily: 'var(--font-sans)' }}
              />
            </div>

            {/* Currency */}
            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 700, letterSpacing: '0.07em',
                textTransform: 'uppercase', color: 'var(--text-muted, var(--text-3))', marginBottom: 6 }}>
                Currency
              </label>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {CURRENCIES.map(c => (
                  <motion.button key={c} whileTap={{ scale: 0.9 }}
                    onClick={() => setCurrencyLocal(c)}
                    style={{ padding: '8px 14px', borderRadius: 10, border: '1px solid var(--border)',
                      background: currency === c ? 'var(--accent)' : 'var(--surface)',
                      color: currency === c ? 'white' : 'var(--text)',
                      fontSize: 14, fontWeight: 600, cursor: 'pointer' }}
                  >{c}</motion.button>
                ))}
              </div>
            </div>

            {/* Income sources */}
            <div style={{ marginBottom: 28 }}>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 700, letterSpacing: '0.07em',
                textTransform: 'uppercase', color: 'var(--text-muted, var(--text-3))', marginBottom: 6 }}>
                Income sources (add your companies / jobs)
              </label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
                {sources.map(s => (
                  <span key={s} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '5px 10px',
                    borderRadius: 8, background: 'var(--accent-soft, var(--surface))',
                    border: '1px solid var(--border)', fontSize: 13, color: 'var(--text)' }}>
                    {s}
                    <button onClick={() => setSources(prev => prev.filter(x => x !== s))}
                      style={{ background: 'none', border: 'none', cursor: 'pointer',
                        color: 'var(--text-muted, var(--text-3))', padding: '0 2px', fontSize: 14, lineHeight: 1 }}>×</button>
                  </span>
                ))}
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <input value={newSource} onChange={e => setNewSource(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && newSource.trim()) { setSources(p => [...p, newSource.trim()]); setNewSource('') }}}
                  placeholder="Add company / source…"
                  style={{ flex: 1, padding: '9px 12px', borderRadius: 10,
                    background: 'var(--surface-3, var(--surface))', border: '1px solid var(--border)',
                    color: 'var(--text)', fontSize: 13, outline: 'none', fontFamily: 'var(--font-sans)' }}
                />
                <motion.button whileTap={{ scale: 0.95 }}
                  onClick={() => { if (newSource.trim()) { setSources(p => [...p, newSource.trim()]); setNewSource('') }}}
                  style={{ padding: '9px 14px', borderRadius: 10, background: 'var(--accent)',
                    color: 'white', border: 'none', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}
                >Add</motion.button>
              </div>
            </div>

            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
              onClick={handleFinishOnboarding}
              disabled={!displayName.trim()}
              style={{ width: '100%', padding: '15px 0', borderRadius: 16,
                background: displayName.trim() ? 'var(--accent)' : 'var(--border)',
                color: 'white', border: 'none', fontSize: 16, fontWeight: 700, cursor: displayName.trim() ? 'pointer' : 'not-allowed',
                fontFamily: 'var(--font-sans)' }}
            >
              Let's go →
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
