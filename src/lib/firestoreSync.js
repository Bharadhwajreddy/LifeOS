import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore'
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
