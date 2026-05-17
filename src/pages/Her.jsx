import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Trash2, Heart, Film, Gift, Calendar, Lightbulb, Pencil, Star, Check, MapPin } from 'lucide-react'
import { format, parseISO, differenceInDays } from 'date-fns'
import { useStore } from '../store'
import Modal from '../components/Modal'
import { Btn, Input, EmptyState } from '../components/UI'

// ─── Floating hearts ──────────────────────────────────────────────────────────
const FLOAT_HEARTS = ['❤️', '🧡', '💛', '❤️', '🩷']

function FloatingHearts() {
  return (
    <>
      {FLOAT_HEARTS.map((emoji, i) => (
        <motion.span
          key={i}
          style={{
            position: 'absolute',
            fontSize: '1.1rem',
            left: `${15 + i * 18}%`,
            bottom: '12px',
            pointerEvents: 'none',
            userSelect: 'none',
          }}
          animate={{ y: [0, -40, -80], opacity: [1, 0.7, 0] }}
          transition={{ duration: 3 + i, repeat: Infinity, delay: i * 0.8, ease: 'easeOut' }}
        >
          {emoji}
        </motion.span>
      ))}
    </>
  )
}

// ─── Genre emoji map ──────────────────────────────────────────────────────────
const genreEmoji = (genre = '') => {
  const g = genre.toLowerCase()
  if (g.includes('romance') || g.includes('love')) return '💕'
  if (g.includes('comedy') || g.includes('fun')) return '😂'
  if (g.includes('horror') || g.includes('thriller')) return '👻'
  if (g.includes('sci') || g.includes('fantasy')) return '🚀'
  if (g.includes('action') || g.includes('adventure')) return '⚡'
  if (g.includes('drama')) return '🎭'
  if (g.includes('docu')) return '🎥'
  if (g.includes('anime')) return '🌸'
  return '🍿'
}

// ─── Title-hash gradient for poster placeholder ───────────────────────────────
const posterGradient = (title = '') => {
  let hash = 0
  for (let i = 0; i < title.length; i++) hash = title.charCodeAt(i) + ((hash << 5) - hash)
  const h1 = Math.abs(hash) % 360
  const h2 = (h1 + 60) % 360
  return `linear-gradient(135deg, hsl(${h1},70%,55%) 0%, hsl(${h2},60%,45%) 100%)`
}

// ─── Star Rating ──────────────────────────────────────────────────────────────
function StarRating({ value = 0, onChange }) {
  return (
    <div style={{ display: 'flex', gap: '2px' }}>
      {[1, 2, 3, 4, 5].map((s) => (
        <button
          key={s}
          type="button"
          onClick={() => onChange && onChange(s)}
          style={{
            background: 'none',
            border: 'none',
            cursor: onChange ? 'pointer' : 'default',
            padding: '1px',
            color: s <= value ? 'var(--gold)' : 'var(--text-3)',
            transition: 'color 0.15s',
          }}
        >
          <Star size={13} fill={s <= value ? 'currentColor' : 'none'} />
        </button>
      ))}
    </div>
  )
}

// ─── Movies ───────────────────────────────────────────────────────────────────
function MoviesTab() {
  const { movies, addMovie, updateMovie, toggleMovie, deleteMovie } = useStore()
  const [addModal, setAddModal]   = useState(false)
  const [editModal, setEditModal] = useState(null)
  const [form, setForm]           = useState({ title: '', genre: '', rating: 0 })

  const unwatched = movies.filter((m) => !m.watched)
  const watched   = movies.filter((m) => m.watched)

  const openEdit = (m) => {
    setEditModal(m)
    setForm({ title: m.title, genre: m.genre || '', rating: m.rating || 0 })
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <Btn size="lg" onClick={() => { setForm({ title: '', genre: '', rating: 0 }); setAddModal(true) }}>
        <Plus size={18} /> Add Movie / Show
      </Btn>

      {movies.length === 0 && <EmptyState icon={Film} text="Add movies and shows to watch together" />}

      {unwatched.length > 0 && (
        <>
          <p style={{ fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-3)', margin: '4px 0 0' }}>
            To Watch · {unwatched.length}
          </p>
          {unwatched.map((m, i) => (
            <motion.div
              key={m.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ delay: i * 0.04 }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                background: 'var(--card-bg)',
                border: '1px solid var(--card-border)',
                borderRadius: 'var(--card-radius)',
                padding: '10px 14px',
                backdropFilter: 'var(--backdrop)',
                WebkitBackdropFilter: 'var(--backdrop)',
              }}
            >
              {/* Poster placeholder */}
              <div style={{
                width: '42px',
                height: '58px',
                borderRadius: '8px',
                background: posterGradient(m.title),
                flexShrink: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.3rem',
              }}>
                {genreEmoji(m.genre)}
              </div>

              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text)', marginBottom: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.title}</p>
                {m.genre && <p style={{ fontSize: '0.72rem', color: 'var(--text-3)' }}>{m.genre}</p>}
              </div>

              {/* Toggle watched */}
              <motion.button
                onClick={() => toggleMovie(m.id)}
                whileHover={{ scale: 1.15 }}
                whileTap={{ scale: 0.9 }}
                style={{
                  width: '26px',
                  height: '26px',
                  borderRadius: '50%',
                  border: '2px solid var(--border-strong)',
                  background: 'transparent',
                  cursor: 'pointer',
                  flexShrink: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--text-3)',
                  transition: 'border-color 0.15s',
                }}
              />

              <button
                onClick={() => openEdit(m)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-3)', padding: '4px' }}
              >
                <Pencil size={13} />
              </button>
              <button
                onClick={() => deleteMovie(m.id)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-3)', padding: '4px' }}
              >
                <Trash2 size={14} />
              </button>
            </motion.div>
          ))}
        </>
      )}

      {watched.length > 0 && (
        <>
          <p style={{ fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-3)', margin: '8px 0 0' }}>
            Watched · {watched.length}
          </p>
          {watched.map((m) => (
            <motion.div
              key={m.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                background: 'var(--card-bg)',
                border: '1px solid var(--card-border)',
                borderRadius: 'var(--card-radius)',
                padding: '10px 14px',
                opacity: 0.55,
              }}
            >
              <div style={{
                width: '42px',
                height: '58px',
                borderRadius: '8px',
                background: posterGradient(m.title),
                flexShrink: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.3rem',
                filter: 'grayscale(0.5)',
              }}>
                {genreEmoji(m.genre)}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-2)', textDecoration: 'line-through', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.title}</p>
                {m.rating > 0 && <StarRating value={m.rating} />}
              </div>
              <motion.button
                onClick={() => toggleMovie(m.id)}
                whileTap={{ scale: 0.85 }}
                style={{
                  width: '26px',
                  height: '26px',
                  borderRadius: '50%',
                  background: 'var(--success)',
                  border: 'none',
                  cursor: 'pointer',
                  flexShrink: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#fff',
                }}
              >
                <Check size={13} />
              </motion.button>
              <button onClick={() => deleteMovie(m.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-3)', padding: '4px' }}>
                <Trash2 size={14} />
              </button>
            </motion.div>
          ))}
        </>
      )}

      <Modal open={addModal} onClose={() => setAddModal(false)} title="Add Movie / Show">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <Input label="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g. Interstellar" />
          <Input label="Genre (optional)" value={form.genre} onChange={(e) => setForm({ ...form, genre: e.target.value })} placeholder="Sci-fi, Romance..." />
          <Btn size="lg" onClick={() => { if (form.title) { addMovie(form); setAddModal(false) } }}>Add to List</Btn>
        </div>
      </Modal>

      <Modal open={!!editModal} onClose={() => setEditModal(null)} title="Edit Movie">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <Input label="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          <Input label="Genre" value={form.genre} onChange={(e) => setForm({ ...form, genre: e.target.value })} />
          <div>
            <p style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-2)', marginBottom: '6px' }}>Rating</p>
            <StarRating value={form.rating} onChange={(r) => setForm({ ...form, rating: r })} />
          </div>
          <Btn size="lg" onClick={() => { if (form.title) { updateMovie(editModal.id, form); setEditModal(null) } }}>Save Changes</Btn>
          <Btn variant="danger" size="lg" onClick={() => { deleteMovie(editModal.id); setEditModal(null) }}><Trash2 size={15} /> Delete</Btn>
        </div>
      </Modal>
    </div>
  )
}

// ─── Gifts ────────────────────────────────────────────────────────────────────
function GiftsTab() {
  const { gifts, addGift, updateGift, toggleGift, deleteGift, currency } = useStore()
  const [addModal, setAddModal]   = useState(false)
  const [editModal, setEditModal] = useState(null)
  const [form, setForm]           = useState({ name: '', note: '', price: '' })

  const pending = gifts.filter((g) => !g.bought)
  const bought  = gifts.filter((g) => g.bought)

  const openEdit = (g) => { setEditModal(g); setForm({ name: g.name, note: g.note || '', price: g.price || '' }) }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <Btn size="lg" onClick={() => { setForm({ name: '', note: '', price: '' }); setAddModal(true) }}>
        <Plus size={18} /> Add Gift Idea
      </Btn>

      {gifts.length === 0 && <EmptyState icon={Gift} text="Add gift ideas so you never forget" />}

      {pending.length > 0 && (
        <>
          <p style={{ fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-3)', margin: '4px 0 0' }}>
            Ideas · {pending.length}
          </p>
          {pending.map((g, i) => (
            <motion.div
              key={g.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                background: 'var(--card-bg)',
                border: '1px solid var(--card-border)',
                borderRadius: 'var(--card-radius)',
                padding: '12px 14px',
                backdropFilter: 'var(--backdrop)',
                WebkitBackdropFilter: 'var(--backdrop)',
              }}
            >
              {/* Gift box hover animation */}
              <motion.span
                style={{ fontSize: '1.5rem', flexShrink: 0, display: 'block' }}
                whileHover={{ rotate: [0, -12, 12, -8, 0], scale: 1.2 }}
                transition={{ duration: 0.5 }}
              >
                🎁
              </motion.span>

              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text)', marginBottom: '2px' }}>{g.name}</p>
                {g.note && <p style={{ fontSize: '0.72rem', color: 'var(--text-3)' }}>{g.note}</p>}
              </div>

              {g.price && (
                <span style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--accent-2)', flexShrink: 0 }}>
                  {currency}{g.price}
                </span>
              )}

              <motion.button
                onClick={() => toggleGift(g.id)}
                whileHover={{ scale: 1.15 }}
                whileTap={{ scale: 0.85 }}
                style={{
                  width: '26px',
                  height: '26px',
                  borderRadius: '50%',
                  border: '2px solid var(--lavender)',
                  background: 'transparent',
                  cursor: 'pointer',
                  flexShrink: 0,
                }}
              />

              <button onClick={() => openEdit(g)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-3)', padding: '4px' }}>
                <Pencil size={13} />
              </button>
              <button onClick={() => deleteGift(g.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-3)', padding: '4px' }}>
                <Trash2 size={14} />
              </button>
            </motion.div>
          ))}
        </>
      )}

      {bought.length > 0 && (
        <>
          <p style={{ fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-3)', margin: '8px 0 0' }}>
            Bought · {bought.length}
          </p>
          {bought.map((g) => (
            <div
              key={g.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                background: 'var(--card-bg)',
                border: '1px solid var(--card-border)',
                borderRadius: 'var(--card-radius)',
                padding: '12px 14px',
                opacity: 0.5,
              }}
            >
              <span style={{ fontSize: '1.5rem', flexShrink: 0 }}>🎁</span>
              <p style={{ flex: 1, fontSize: '0.875rem', color: 'var(--text-2)', textDecoration: 'line-through' }}>{g.name}</p>
              {g.price && <span style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-3)', flexShrink: 0 }}>{currency}{g.price}</span>}
              <div style={{ width: '26px', height: '26px', borderRadius: '50%', background: 'var(--lavender)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', flexShrink: 0 }}>
                <Check size={13} />
              </div>
              <button onClick={() => deleteGift(g.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-3)', padding: '4px' }}>
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </>
      )}

      <Modal open={addModal} onClose={() => setAddModal(false)} title="Gift Idea">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <Input label="Gift name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Perfume, Book..." />
          <Input label="Why she'll love it" value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} placeholder="Add a note..." />
          <Input label="Price estimate (optional)" type="number" inputMode="decimal" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} placeholder="0.00" />
          <Btn size="lg" onClick={() => { if (form.name) { addGift(form); setAddModal(false) } }}>Save Idea</Btn>
        </div>
      </Modal>

      <Modal open={!!editModal} onClose={() => setEditModal(null)} title="Edit Gift Idea">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <Input label="Gift name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <Input label="Note" value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} />
          <Input label="Price" type="number" inputMode="decimal" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} />
          <Btn size="lg" onClick={() => { if (form.name) { updateGift(editModal.id, form); setEditModal(null) } }}>Save Changes</Btn>
          <Btn variant="danger" size="lg" onClick={() => { deleteGift(editModal.id); setEditModal(null) }}><Trash2 size={15} /> Delete</Btn>
        </div>
      </Modal>
    </div>
  )
}

// ─── Dates ────────────────────────────────────────────────────────────────────
function DatesTab() {
  const { dates, addDate, updateDate, deleteDate } = useStore()
  const [addModal, setAddModal]   = useState(false)
  const [editModal, setEditModal] = useState(null)
  const [form, setForm]           = useState({ name: '', date: '', note: '' })

  const sorted = [...dates].sort((a, b) => {
    const da = Math.abs(differenceInDays(parseISO(a.date), new Date()))
    const db = Math.abs(differenceInDays(parseISO(b.date), new Date()))
    return da - db
  })

  const daysLabel = (dateStr) => {
    try {
      const diff = differenceInDays(parseISO(dateStr), new Date())
      if (diff === 0) return 'Today!'
      if (diff === 1) return 'Tomorrow'
      if (diff < 0) return `${Math.abs(diff)}d ago`
      return `in ${diff} day${diff > 1 ? 's' : ''}`
    } catch { return '' }
  }

  const openEdit = (d) => { setEditModal(d); setForm({ name: d.name, date: d.date, note: d.note || '' }) }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <Btn size="lg" onClick={() => { setForm({ name: '', date: '', note: '' }); setAddModal(true) }}>
        <Plus size={18} /> Add Important Date
      </Btn>

      {dates.length === 0 && <EmptyState icon={Calendar} text="Add birthdays, anniversaries and more" />}

      {sorted.map((d, i) => {
        const diff = differenceInDays(parseISO(d.date), new Date())
        const soon = diff >= 0 && diff <= 7
        const upcoming = diff > 0
        const past = diff < 0
        return (
          <motion.div
            key={d.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              background: 'var(--card-bg)',
              border: soon ? '2px solid var(--lavender)' : '1px solid var(--card-border)',
              borderRadius: 'var(--card-radius)',
              padding: soon ? '11px 13px' : '12px 14px',
              backdropFilter: 'var(--backdrop)',
              WebkitBackdropFilter: 'var(--backdrop)',
              boxShadow: soon ? '0 0 20px rgba(182,168,240,0.2)' : 'none',
            }}
          >
            {/* Calendar tile */}
            <div style={{
              width: '48px',
              height: '52px',
              borderRadius: '10px',
              background: soon ? 'var(--grad-habits)' : past ? 'var(--surface-3)' : 'var(--surface-2)',
              flexShrink: 0,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <span style={{
                fontSize: '1.1rem',
                fontWeight: 800,
                lineHeight: 1,
                color: soon ? '#fff' : past ? 'var(--text-3)' : 'var(--text)',
              }}>
                {format(parseISO(d.date), 'd')}
              </span>
              <span style={{
                fontSize: '0.6rem',
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                color: soon ? 'rgba(255,255,255,0.8)' : 'var(--text-3)',
              }}>
                {format(parseISO(d.date), 'MMM')}
              </span>
            </div>

            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text)', marginBottom: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{d.name}</p>
              <p style={{ fontSize: '0.72rem', fontWeight: 600, color: soon ? 'var(--lavender)' : 'var(--text-3)' }}>
                {soon && '✨ '}{daysLabel(d.date)}
              </p>
              {d.note && (
                <p style={{ fontSize: '0.72rem', color: 'var(--text-3)', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '3px' }}>
                  <MapPin size={10} /> {d.note}
                </p>
              )}
            </div>

            <button onClick={() => openEdit(d)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-3)', padding: '4px' }}>
              <Pencil size={13} />
            </button>
            <button onClick={() => deleteDate(d.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-3)', padding: '4px' }}>
              <Trash2 size={14} />
            </button>
          </motion.div>
        )
      })}

      <Modal open={addModal} onClose={() => setAddModal(false)} title="Important Date">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <Input label="Event name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Her birthday, Anniversary" />
          <Input label="Date" type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
          <Input label="Note (optional)" value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} placeholder="Plan something special..." />
          <Btn size="lg" onClick={() => { if (form.name && form.date) { addDate(form); setAddModal(false) } }}>Save Date</Btn>
        </div>
      </Modal>

      <Modal open={!!editModal} onClose={() => setEditModal(null)} title="Edit Date">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <Input label="Event name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <Input label="Date" type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
          <Input label="Note" value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} />
          <Btn size="lg" onClick={() => { if (form.name && form.date) { updateDate(editModal.id, form); setEditModal(null) } }}>Save Changes</Btn>
          <Btn variant="danger" size="lg" onClick={() => { deleteDate(editModal.id); setEditModal(null) }}><Trash2 size={15} /> Delete</Btn>
        </div>
      </Modal>
    </div>
  )
}

// ─── Ideas ────────────────────────────────────────────────────────────────────
function IdeasTab() {
  const { dateIdeas, addDateIdea, updateDateIdea, toggleDateIdea, deleteDateIdea } = useStore()
  const [text, setText]         = useState('')
  const [editId, setEditId]     = useState(null)
  const [editText, setEditText] = useState('')

  const pending = dateIdeas.filter((d) => !d.done)
  const done    = dateIdeas.filter((d) => d.done)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <form
        onSubmit={(e) => { e.preventDefault(); if (text.trim()) { addDateIdea(text.trim()); setText('') } }}
        style={{ display: 'flex', gap: '8px' }}
      >
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Add a date idea..."
          style={{
            flex: 1,
            borderRadius: 'var(--radius-lg)',
            background: 'var(--surface-2)',
            border: '1px solid var(--border)',
            padding: '12px 16px',
            fontSize: '0.875rem',
            color: 'var(--text)',
            outline: 'none',
          }}
        />
        <Btn type="submit" disabled={!text.trim()}><Plus size={18} /></Btn>
      </form>

      {dateIdeas.length === 0 && <EmptyState icon={Lightbulb} text="Brainstorm fun things to do together" />}

      {pending.length > 0 && (
        <>
          <p style={{ fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-3)', margin: '4px 0 0' }}>
            Ideas · {pending.length}
          </p>
          <AnimatePresence>
            {pending.map((d, i) => (
              <motion.div
                key={d.id}
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20, height: 0 }}
                transition={{ delay: i * 0.05 }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  background: 'var(--card-bg)',
                  border: '1px solid var(--card-border)',
                  borderRadius: 'var(--card-radius)',
                  padding: '12px 14px',
                  backdropFilter: 'var(--backdrop)',
                  WebkitBackdropFilter: 'var(--backdrop)',
                }}
              >
                <motion.button
                  onClick={() => toggleDateIdea(d.id)}
                  whileHover={{ scale: 1.2 }}
                  whileTap={{ scale: 0.85 }}
                  style={{
                    width: '24px',
                    height: '24px',
                    borderRadius: '50%',
                    border: '2px solid var(--lavender)',
                    background: 'transparent',
                    cursor: 'pointer',
                    flexShrink: 0,
                  }}
                />

                {editId === d.id ? (
                  <>
                    <input
                      autoFocus
                      value={editText}
                      onChange={(e) => setEditText(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && editText.trim()) { updateDateIdea(d.id, editText.trim()); setEditId(null) }
                        if (e.key === 'Escape') setEditId(null)
                      }}
                      style={{
                        flex: 1,
                        background: 'var(--surface-2)',
                        border: '1px solid var(--border)',
                        borderRadius: 'var(--radius-sm)',
                        padding: '6px 12px',
                        fontSize: '0.875rem',
                        color: 'var(--text)',
                        outline: 'none',
                      }}
                    />
                    <button
                      onClick={() => { if (editText.trim()) { updateDateIdea(d.id, editText.trim()); setEditId(null) } }}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--success)', padding: '4px' }}
                    >
                      <Check size={14} />
                    </button>
                    <button
                      onClick={() => setEditId(null)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-3)', padding: '4px' }}
                    >
                      <Trash2 size={13} />
                    </button>
                  </>
                ) : (
                  <>
                    <p style={{ flex: 1, fontSize: '0.875rem', color: 'var(--text)' }}>{d.idea}</p>
                    <button
                      onClick={() => { setEditId(d.id); setEditText(d.idea) }}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-3)', padding: '4px' }}
                    >
                      <Pencil size={13} />
                    </button>
                    <button
                      onClick={() => deleteDateIdea(d.id)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-3)', padding: '4px' }}
                    >
                      <Trash2 size={14} />
                    </button>
                  </>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
        </>
      )}

      {done.length > 0 && (
        <>
          <p style={{ fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-3)', margin: '8px 0 0' }}>
            Done · {done.length}
          </p>
          {done.map((d) => (
            <motion.div
              key={d.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                background: 'var(--card-bg)',
                border: '1px solid var(--card-border)',
                borderRadius: 'var(--card-radius)',
                padding: '12px 14px',
                opacity: 0.5,
              }}
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                style={{
                  width: '24px',
                  height: '24px',
                  borderRadius: '50%',
                  background: 'var(--grad-habits)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  color: '#fff',
                }}
              >
                <Check size={12} />
              </motion.div>
              <p style={{ flex: 1, fontSize: '0.875rem', color: 'var(--text-2)', textDecoration: 'line-through' }}>{d.idea}</p>
              <button
                onClick={() => deleteDateIdea(d.id)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-3)', padding: '4px' }}
              >
                <Trash2 size={14} />
              </button>
            </motion.div>
          ))}
        </>
      )}
    </div>
  )
}

// ─── Countdown to next upcoming date ─────────────────────────────────────────
function NextDateCountdown({ dates }) {
  const upcoming = [...dates]
    .filter((d) => { try { return differenceInDays(parseISO(d.date), new Date()) >= 0 } catch { return false } })
    .sort((a, b) => differenceInDays(parseISO(a.date), new Date()) - differenceInDays(parseISO(b.date), new Date()))

  if (!upcoming.length) return null

  const next = upcoming[0]
  const diff = differenceInDays(parseISO(next.date), new Date())

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      background: 'rgba(255,255,255,0.12)',
      backdropFilter: 'blur(8px)',
      border: '1px solid rgba(255,255,255,0.18)',
      borderRadius: 'var(--radius-pill)',
      padding: '6px 14px',
      fontSize: '0.8rem',
      color: 'rgba(255,255,255,0.95)',
      fontWeight: 600,
    }}>
      <Calendar size={13} />
      {diff === 0
        ? `${next.name} is today!`
        : diff === 1
        ? `${next.name} · tomorrow`
        : `${next.name} · in ${diff} days`}
    </div>
  )
}

// ─── Tab bar with sliding indicator ──────────────────────────────────────────
const TABS = [
  { key: 'movies', label: '🎬', full: 'Movies' },
  { key: 'gifts',  label: '🎁', full: 'Gifts' },
  { key: 'dates',  label: '📅', full: 'Dates' },
  { key: 'ideas',  label: '💝', full: 'Ideas' },
]

function PillTabBar({ active, onChange }) {
  return (
    <div style={{
      display: 'flex',
      gap: '4px',
      background: 'var(--surface-2)',
      border: '1px solid var(--border)',
      borderRadius: 'var(--radius-pill)',
      padding: '4px',
      position: 'relative',
    }}>
      {TABS.map((t) => (
        <button
          key={t.key}
          onClick={() => onChange(t.key)}
          style={{
            position: 'relative',
            flex: 1,
            border: 'none',
            background: 'transparent',
            cursor: 'pointer',
            padding: '8px 4px',
            borderRadius: 'var(--radius-pill)',
            fontSize: '0.8rem',
            fontWeight: 600,
            color: active === t.key ? 'var(--text-on-accent)' : 'var(--text-3)',
            transition: 'color 0.2s',
            zIndex: 1,
          }}
        >
          {active === t.key && (
            <motion.div
              layoutId="tab-indicator"
              style={{
                position: 'absolute',
                inset: 0,
                background: 'var(--grad-habits)',
                borderRadius: 'var(--radius-pill)',
                zIndex: -1,
              }}
              transition={{ type: 'spring', stiffness: 380, damping: 34 }}
            />
          )}
          <span>{t.label}</span>{' '}
          <span style={{ display: 'inline' }}>{t.full}</span>
        </button>
      ))}
    </div>
  )
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function Her() {
  const [tab, setTab] = useState('movies')
  const { dates } = useStore()

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Hero banner */}
      <div style={{
        position: 'relative',
        overflow: 'hidden',
        borderRadius: 'var(--radius-xl)',
        background: 'var(--grad-habits)',
        padding: '28px 24px 32px',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
      }}>
        <FloatingHearts />

        {/* Pulsing heart icon */}
        <motion.div
          animate={{ scale: [1, 1.12, 1] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          style={{
            width: '52px',
            height: '52px',
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '2px solid rgba(255,255,255,0.3)',
          }}
        >
          <Heart size={26} color="#fff" fill="#fff" />
        </motion.div>

        <div>
          <h1 style={{
            fontSize: '1.75rem',
            fontWeight: 800,
            color: '#fff',
            margin: 0,
            textShadow: '0 2px 12px rgba(0,0,0,0.15)',
            letterSpacing: '-0.02em',
          }}>
            For Her
          </h1>
          <p style={{
            fontSize: '0.875rem',
            color: 'rgba(255,255,255,0.8)',
            margin: '4px 0 0',
          }}>
            Movies · Gifts · Dates · Ideas
          </p>
        </div>

        <NextDateCountdown dates={dates} />
      </div>

      {/* Tab bar */}
      <PillTabBar active={tab} onChange={setTab} />

      {/* Tab content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={tab}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.18 }}
        >
          {tab === 'movies' && <MoviesTab />}
          {tab === 'gifts'  && <GiftsTab />}
          {tab === 'dates'  && <DatesTab />}
          {tab === 'ideas'  && <IdeasTab />}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
