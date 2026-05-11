import { useState } from 'react'
import { Plus, Trash2, Heart, Film, Gift, Calendar, Lightbulb, Pencil } from 'lucide-react'
import { format, parseISO, differenceInDays } from 'date-fns'
import { useStore } from '../store'
import Modal from '../components/Modal'
import { Card, Btn, Input, SectionHeader, EmptyState, TabBar } from '../components/UI'

// ─── Movies ───────────────────────────────────────────────────────────────────
function MoviesTab() {
  const { movies, addMovie, updateMovie, toggleMovie, deleteMovie } = useStore()
  const [addModal, setAddModal]   = useState(false)
  const [editModal, setEditModal] = useState(null)
  const [form, setForm]           = useState({ title: '', genre: '' })

  const unwatched = movies.filter((m) => !m.watched)
  const watched   = movies.filter((m) => m.watched)

  const openEdit = (m) => { setEditModal(m); setForm({ title: m.title, genre: m.genre || '' }) }

  return (
    <div className="space-y-4">
      <Btn size="lg" onClick={() => { setForm({ title: '', genre: '' }); setAddModal(true) }}><Plus size={18} /> Add Movie / Show</Btn>
      {movies.length === 0 && <EmptyState icon={Film} text="Add movies and shows to watch together" />}

      {unwatched.length > 0 && (
        <>
          <SectionHeader>To Watch · {unwatched.length}</SectionHeader>
          {unwatched.map((m) => (
            <Card key={m.id} className="flex items-center gap-3 px-4 py-3.5 mb-2">
              <button onClick={() => toggleMovie(m.id)} className="w-6 h-6 rounded-full border-2 border-zinc-300 dark:border-zinc-600 shrink-0 hover:border-emerald-400 transition-colors" />
              <div className="flex-1">
                <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-100">{m.title}</p>
                {m.genre && <p className="text-xs text-zinc-400 mt-0.5">{m.genre}</p>}
              </div>
              <button onClick={() => openEdit(m)} className="p-1.5 text-zinc-300 hover:text-blue-400 transition-colors"><Pencil size={13} /></button>
              <button onClick={() => deleteMovie(m.id)} className="p-1.5 text-zinc-300 hover:text-rose-400 transition-colors"><Trash2 size={14} /></button>
            </Card>
          ))}
        </>
      )}

      {watched.length > 0 && (
        <>
          <SectionHeader>Watched · {watched.length}</SectionHeader>
          {watched.map((m) => (
            <Card key={m.id} className="flex items-center gap-3 px-4 py-3.5 mb-2 opacity-50">
              <button onClick={() => toggleMovie(m.id)} className="w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center shrink-0 text-white text-xs">✓</button>
              <p className="flex-1 text-sm line-through text-zinc-400">{m.title}</p>
              <button onClick={() => deleteMovie(m.id)} className="p-1.5 text-zinc-300 hover:text-rose-400 transition-colors"><Trash2 size={14} /></button>
            </Card>
          ))}
        </>
      )}

      <Modal open={addModal} onClose={() => setAddModal(false)} title="Add Movie / Show">
        <div className="space-y-4">
          <Input label="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g. Interstellar" />
          <Input label="Genre (optional)" value={form.genre} onChange={(e) => setForm({ ...form, genre: e.target.value })} placeholder="Sci-fi, Romance..." />
          <Btn size="lg" onClick={() => { if (form.title) { addMovie(form); setAddModal(false) } }}>Add to List</Btn>
        </div>
      </Modal>

      <Modal open={!!editModal} onClose={() => setEditModal(null)} title="Edit Movie">
        <div className="space-y-4">
          <Input label="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          <Input label="Genre" value={form.genre} onChange={(e) => setForm({ ...form, genre: e.target.value })} />
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
    <div className="space-y-4">
      <Btn size="lg" onClick={() => { setForm({ name: '', note: '', price: '' }); setAddModal(true) }}><Plus size={18} /> Add Gift Idea</Btn>
      {gifts.length === 0 && <EmptyState icon={Gift} text="Add gift ideas so you never forget" />}

      {pending.length > 0 && (
        <>
          <SectionHeader>Ideas · {pending.length}</SectionHeader>
          {pending.map((g) => (
            <Card key={g.id} className="flex items-center gap-3 px-4 py-3.5 mb-2">
              <button onClick={() => toggleGift(g.id)} className="w-6 h-6 rounded-full border-2 border-pink-300 dark:border-pink-700 shrink-0 hover:border-pink-500 transition-colors" />
              <div className="flex-1">
                <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-100">{g.name}</p>
                {g.note && <p className="text-xs text-zinc-400 mt-0.5">{g.note}</p>}
              </div>
              {g.price && <span className="text-sm font-bold text-zinc-400 shrink-0">{currency}{g.price}</span>}
              <button onClick={() => openEdit(g)} className="p-1.5 text-zinc-300 hover:text-blue-400 transition-colors"><Pencil size={13} /></button>
              <button onClick={() => deleteGift(g.id)} className="p-1.5 text-zinc-300 hover:text-rose-400 transition-colors"><Trash2 size={14} /></button>
            </Card>
          ))}
        </>
      )}

      {bought.length > 0 && (
        <>
          <SectionHeader>Bought · {bought.length}</SectionHeader>
          {bought.map((g) => (
            <Card key={g.id} className="flex items-center gap-3 px-4 py-3.5 mb-2 opacity-50">
              <div className="w-6 h-6 rounded-full bg-pink-500 flex items-center justify-center text-white text-xs shrink-0">✓</div>
              <p className="flex-1 text-sm line-through text-zinc-400">{g.name}</p>
              <button onClick={() => deleteGift(g.id)} className="p-1.5 text-zinc-300 hover:text-rose-400 transition-colors"><Trash2 size={14} /></button>
            </Card>
          ))}
        </>
      )}

      <Modal open={addModal} onClose={() => setAddModal(false)} title="Gift Idea">
        <div className="space-y-4">
          <Input label="Gift name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Perfume, Book..." />
          <Input label="Why she'll love it" value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} placeholder="Add a note..." />
          <Input label="Price estimate (optional)" type="number" inputMode="decimal" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} placeholder="0.00" />
          <Btn size="lg" onClick={() => { if (form.name) { addGift(form); setAddModal(false) } }}>Save Idea</Btn>
        </div>
      </Modal>

      <Modal open={!!editModal} onClose={() => setEditModal(null)} title="Edit Gift Idea">
        <div className="space-y-4">
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
      if (diff === 0) return 'Today! 🎉'
      if (diff === 1) return 'Tomorrow ✨'
      if (diff < 0) return `${Math.abs(diff)}d ago`
      return `in ${diff} day${diff > 1 ? 's' : ''}`
    } catch { return '' }
  }

  const openEdit = (d) => { setEditModal(d); setForm({ name: d.name, date: d.date, note: d.note || '' }) }

  return (
    <div className="space-y-4">
      <Btn size="lg" onClick={() => { setForm({ name: '', date: '', note: '' }); setAddModal(true) }}><Plus size={18} /> Add Important Date</Btn>
      {dates.length === 0 && <EmptyState icon={Calendar} text="Add birthdays, anniversaries and more" />}

      {sorted.map((d) => {
        const diff = differenceInDays(parseISO(d.date), new Date())
        const soon = diff >= 0 && diff <= 7
        const past = diff < 0
        return (
          <Card key={d.id} className={`flex items-center gap-3 px-4 py-3.5 mb-2 ${soon ? 'ring-2 ring-pink-300 dark:ring-pink-500/40' : ''}`}>
            <div className={`w-12 h-12 rounded-2xl flex flex-col items-center justify-center shrink-0 ${soon ? 'bg-pink-500' : past ? 'bg-zinc-200 dark:bg-zinc-800' : 'bg-zinc-100 dark:bg-zinc-800'}`}>
              <span className={`text-base font-bold leading-none ${soon ? 'text-white' : past ? 'text-zinc-400' : 'text-zinc-600 dark:text-zinc-300'}`}>{format(parseISO(d.date), 'd')}</span>
              <span className={`text-[9px] uppercase tracking-wide ${soon ? 'text-pink-100' : 'text-zinc-400'}`}>{format(parseISO(d.date), 'MMM')}</span>
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-100">{d.name}</p>
              <p className={`text-xs mt-0.5 font-medium ${soon ? 'text-pink-500' : 'text-zinc-400'}`}>{daysLabel(d.date)}</p>
              {d.note && <p className="text-xs text-zinc-400 mt-0.5">{d.note}</p>}
            </div>
            <button onClick={() => openEdit(d)} className="p-1.5 text-zinc-300 hover:text-blue-400 transition-colors"><Pencil size={13} /></button>
            <button onClick={() => deleteDate(d.id)} className="p-1.5 text-zinc-300 hover:text-rose-400 transition-colors"><Trash2 size={14} /></button>
          </Card>
        )
      })}

      <Modal open={addModal} onClose={() => setAddModal(false)} title="Important Date">
        <div className="space-y-4">
          <Input label="Event name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Her birthday, Anniversary" />
          <Input label="Date" type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
          <Input label="Note (optional)" value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} placeholder="Plan something special..." />
          <Btn size="lg" onClick={() => { if (form.name && form.date) { addDate(form); setAddModal(false) } }}>Save Date</Btn>
        </div>
      </Modal>

      <Modal open={!!editModal} onClose={() => setEditModal(null)} title="Edit Date">
        <div className="space-y-4">
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
  const [text, setText]           = useState('')
  const [editId, setEditId]       = useState(null)
  const [editText, setEditText]   = useState('')

  const pending = dateIdeas.filter((d) => !d.done)
  const done    = dateIdeas.filter((d) => d.done)

  return (
    <div className="space-y-4">
      <form onSubmit={(e) => { e.preventDefault(); if (text.trim()) { addDateIdea(text.trim()); setText('') } }} className="flex gap-2">
        <input value={text} onChange={(e) => setText(e.target.value)} placeholder="Add a date idea..."
          className="flex-1 rounded-xl bg-zinc-100 dark:bg-zinc-800 border-0 px-4 py-3 text-sm text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-pink-400/70" />
        <Btn type="submit" disabled={!text.trim()}><Plus size={18} /></Btn>
      </form>

      {dateIdeas.length === 0 && <EmptyState icon={Lightbulb} text="Brainstorm fun things to do together" />}

      {pending.length > 0 && (
        <>
          <SectionHeader>Ideas · {pending.length}</SectionHeader>
          {pending.map((d) => (
            <Card key={d.id} className="flex items-center gap-3 px-4 py-3.5 mb-2">
              <button onClick={() => toggleDateIdea(d.id)} className="w-6 h-6 rounded-full border-2 border-pink-300 dark:border-pink-600 shrink-0 hover:border-pink-500 transition-colors" />
              {editId === d.id ? (
                <>
                  <input autoFocus value={editText} onChange={(e) => setEditText(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter' && editText.trim()) { updateDateIdea(d.id, editText.trim()); setEditId(null) } if (e.key === 'Escape') setEditId(null) }}
                    className="flex-1 bg-zinc-100 dark:bg-zinc-800 rounded-lg px-3 py-1.5 text-sm text-zinc-900 dark:text-white outline-none focus:ring-2 focus:ring-pink-400/70" />
                  <button onClick={() => { if (editText.trim()) { updateDateIdea(d.id, editText.trim()); setEditId(null) } }} className="p-1 text-emerald-500"><Plus size={14} className="rotate-45" /></button>
                  <button onClick={() => setEditId(null)} className="p-1 text-zinc-400"><Trash2 size={13} className="rotate-0" /></button>
                </>
              ) : (
                <>
                  <p className="flex-1 text-sm text-zinc-800 dark:text-zinc-100">{d.idea}</p>
                  <button onClick={() => { setEditId(d.id); setEditText(d.idea) }} className="p-1.5 text-zinc-300 hover:text-blue-400 transition-colors"><Pencil size={13} /></button>
                  <button onClick={() => deleteDateIdea(d.id)} className="p-1.5 text-zinc-300 hover:text-rose-400 transition-colors"><Trash2 size={14} /></button>
                </>
              )}
            </Card>
          ))}
        </>
      )}

      {done.length > 0 && (
        <>
          <SectionHeader>Done · {done.length}</SectionHeader>
          {done.map((d) => (
            <Card key={d.id} className="flex items-center gap-3 px-4 py-3.5 mb-2 opacity-50">
              <div className="w-6 h-6 rounded-full bg-pink-400 flex items-center justify-center text-white text-xs shrink-0">♥</div>
              <p className="flex-1 text-sm line-through text-zinc-400">{d.idea}</p>
              <button onClick={() => deleteDateIdea(d.id)} className="p-1.5 text-zinc-300 hover:text-rose-400 transition-colors"><Trash2 size={14} /></button>
            </Card>
          ))}
        </>
      )}
    </div>
  )
}

// ─── Main ─────────────────────────────────────────────────────────────────────
const TABS = [
  { key: 'movies', label: '🎬 Watch' },
  { key: 'gifts',  label: '🎁 Gifts' },
  { key: 'dates',  label: '📅 Dates' },
  { key: 'ideas',  label: '💝 Ideas' },
]

export default function Her() {
  const [tab, setTab] = useState('movies')
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2.5">
        <div className="w-9 h-9 rounded-2xl bg-pink-500 flex items-center justify-center shadow-lg shadow-pink-500/30">
          <Heart size={18} className="text-white" fill="white" />
        </div>
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">For Her</h1>
      </div>
      <TabBar tabs={TABS} active={tab} onChange={setTab} />
      {tab === 'movies' && <MoviesTab />}
      {tab === 'gifts'  && <GiftsTab />}
      {tab === 'dates'  && <DatesTab />}
      {tab === 'ideas'  && <IdeasTab />}
    </div>
  )
}
