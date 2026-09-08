import { doc, getDoc, setDoc, onSnapshot, serverTimestamp } from 'firebase/firestore'
import { db } from './firebase'

// Keys to exclude from cloud sync (device-specific or large blobs)
const SKIP_KEYS = ['theme', 'darkMode', 'pomodoro', 'pendingAchievement', 'pendingLevelUp']

export async function loadFromCloud(userId) {
  if (!db) return null
  try {
    const ref = doc(db, 'users', userId)
    const snap = await getDoc(ref)
    if (snap.exists()) return snap.data()
    return null
  } catch (e) {
    console.warn('Firestore load failed:', e)
    return null
  }
}

// Real-time subscription — fires immediately with the current cloud doc, then
// again on every remote change, so all devices signed into the same account
// stay in sync live. Returns an unsubscribe function.
export function subscribeToCloud(userId, onData, onError) {
  if (!db || !userId) { if (onError) onError(new Error('no-db')); return () => {} }
  const ref = doc(db, 'users', userId)
  return onSnapshot(
    ref,
    (snap) => onData(snap.exists() ? snap.data() : null, snap.metadata),
    (err) => { console.warn('Firestore subscribe failed:', err); if (onError) onError(err) }
  )
}

export async function saveToCloud(userId, storeState) {
  if (!db || !userId) return
  try {
    const payload = Object.fromEntries(
      Object.entries(storeState).filter(([k, v]) => {
        if (SKIP_KEYS.includes(k)) return false
        if (typeof v === 'function') return false
        return true
      })
    )
    const ref = doc(db, 'users', userId)
    await setDoc(ref, { ...payload, _updatedAt: serverTimestamp() }, { merge: true })
  } catch (e) {
    console.warn('Firestore save failed:', e)
  }
}
