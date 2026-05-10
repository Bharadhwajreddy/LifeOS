import { useState } from 'react'
import { Plus, Trash2, Heart, Film, Gift, Calendar } from 'lucide-react'
import { format, parseISO, differenceInDays } from 'date-fns'
import { useStore } from '../store'
import Modal from '../components/Modal'
import { Card, Btn, Input, SectionHeader, EmptyState } from '../components/UI'

// ─── Movies ───────────────────────────────────────────────────────────────────
function MoviesTab() {
  const { movies, addMovie, toggleMovie, deleteMovie } = useStore()
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState({ title: '', genre: '' })

  const unwatched = movies.filter((m) => !m.watched)
  const watched = movies.filter((m) => m.watched)

  return (
    <div className="space-y-4">
      <Btn size="lg" onClick={() => setModal(true)}><Plus size={18} /> Add Movie / Show</Btn>
      {movies.length === 0 && <EmptyState icon={Film} text="Add movies to watch together" />}
      {unwatched.length > 0 && (
        <>
          <SectionHeader>To Watch · {unwatched.length}</SectionHeader>
          {unwatched.map((m) => (
            <Card key={m.id} className="flex items-center gap-3 px-4 py-3 mb-2">
              <button
                onClick={() => toggleMovie(m.id)}
                className="w-6 h-6 rounded-full border-2 border-zinc-300 dark:border-zinc-600 shrink-0 hover:border-green-400 transition-colors"
              />
              <div className="flex-1">
                <p className="text-sm font-medium text-zinc-800 dark:text-zinc-100">{m.title}</p>
                {m.genre && <p className="text-xs text-zinc-400">{m.genre}</p>}
              </div>
              <button onClick={() => deleteMovie(m.id)} className="p-1 text-zinc-300 hover:text-red-400">
                <Trash2 size={14} />
              </button>
            </Card>
          ))}
        </>
      )}
      {watched.length > 0 && (
        <>
          <SectionHeader>Watched · {watched.length}</SectionHeader>
          {watched.map((m) => (
            <Card key={m.id} className="flex items-center gap-3 px-4 py-3 mb-2 opacity-55">
              <button onClick={() => toggleMovie(m.id)} className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center shrink-0 text-white text-xs">✓</button>
              <p className="flex-1 text-sm line-through text-zinc-400">{m.title}</p>
              <button onClick={() => deleteMovie(m.id)} className="p-1 text-zinc-300 hover:text-red-400"><Trash2 size={14} /></button>
            </Card>
          ))}
        </>
      )}
      <Modal open={modal} onClose={() => setModal(false)} title="Add Movie / Show">
        <div className="space-y-4">
          <Input label="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g. Interstellar" />
          <Input label="Genre (optional)" value={form.genre} onChange={(e) => setForm({ ...form, genre: e.target.value })} placeholder="Sci-fi, Romance..." />
          <Btn size="lg" onClick={() => { if (form.title) { addMovie(form); setForm({ title: '', genre: '' }); setModal(false) } }}>Add</Btn>
        </div>
      </Modal>
    </div>
  )
}

// ─── Gifts ────────────────────────────────────────────────────────────────────
function GiftsTab() {
  const { gifts, addGift, toggleGift, deleteGift, currency } = useStore()
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState({ name: '', note: '', price: '' })

  const pending = gifts.filter((g) => !g.bought)
  const bought = gifts.filter((g) => g.bought)

  return (
    <div className="space-y-4">
      <Btn size="lg" onClick={() => setModal(true)}><Plus size={18} /> Add Gift Idea</Btn>
      {gifts.length === 0 && <EmptyState icon={Gift} text="Add gift ideas for her" />}
      {pending.length > 0 && (
        <>
          <SectionHeader>Ideas · {pending.length}</SectionHeader>
          {pending.map((g) => (
            <Card key={g.id} className="flex items-center gap-3 px-4 py-3 mb-2">
              <button onClick={() => toggleGift(g.id)} className="w-6 h-6 rounded-full border-2 border-pink-300 dark:border-pink-700 shrink-0 hover:border-pink-500 transition-colors" />
              <div className="flex-1">
                <p className="text-sm font-medium text-zinc-800 dark:text-zinc-100">{g.name}</p>
                {g.note && <p className="text-xs text-zinc-400">{g.note}</p>}
              </div>
              {g.price && <span className="text-xs font-semibold text-zinc-400 shrink-0">{currency}{g.price}</span>}
              <button onClick={() => deleteGift(g.id)} className="p-1 text-zinc-300 hover:text-red-400"><Trash2 size={14} /></button>
            </Card>
          ))}
        </>
      )}
      {bought.length > 0 && (
        <>
          <SectionHeader>Bought · {bought.length}</SectionHeader>
          {bought.map((g) => (
            <Card key={g.id} className="flex items-center gap-3 px-4 py-3 mb-2 opacity-55">
              <div className="w-6 h-6 rounded-full bg-pink-500 flex items-center justify-center text-white text-xs shrink-0">✓</div>
              <p className="flex-1 text-sm line-through text-zinc-400">{g.name}</p>
              <button onClick={() => deleteGift(g.id)} className="p-1 text-zinc-300 hover:text-red-400"><Trash2 size={14} /></button>
            </Card>
          ))}
        </>
      )}
      <Modal open={modal} onClose={() => setModal(false)} title="Gift Idea">
        <div className="space-y-4">
          <Input label="Gift name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Perfume, Book..." />
          <Input label="Note" value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} placeholder="Why she'll love it..." />
          <Input label="Estimated price (optional)" type="number" inputMode="decimal" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} />
          <Btn size="lg" onClick={() => { if (form.name) { addGift(form); setForm({ name: '', note: '', price: '' }); setModal(false) } }}>Save Idea</Btn>
        </div>
      </Modal>
    </div>
  )
}

// ─── Important Dates ──────────────────────────────────────────────────────────
function DatesTab() {
  const { dates, addDate, deleteDate } = useStore()
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState({ name: '', date: '', note: '' })

  const sorted = [...dates].sort((a, b) => {
    const da = Math.abs(differenceInDays(parseISO(a.date), new Date()))
    const db = Math.abs(differenceInDays(parseISO(b.date), new Date()))
    return da - db
  })

  const daysLabel = (dateStr) => {
    try {
      const diff = differenceInDays(parseISO(dateStr), new Date())
      if (diff === 0) return 'Today! 🎉'
      if (diff === 1) return 'Tomorrow'
      if (diff < 0) return `${Math.abs(diff)}d ago`
      return `in ${diff} day${diff > 1 ? 's' : ''}`
    } catch { return '' }
  }

  return (
    <div className="space-y-4">
      <Btn size="lg" onClick={() => setModal(true)}><Plus size={18} /> Add Important Date</Btn>
      {dates.length === 0 && <EmptyState icon={Calendar} text="Add birthdays, anniversaries..." />}
      {sorted.map((d) => {
        const diff = differenceInDays(parseISO(d.date), new Date())
        const soon = diff >= 0 && diff <= 7
        return (
          <Card key={d.id} className={`flex items-center gap-3 px-4 py-3 mb-2 ${soon ? 'ring-1 ring-pink-300 dark:ring-pink-800' : ''}`}>
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${soon ? 'bg-pink-100 dark:bg-pink-900/30' : 'bg-zinc-100 dark:bg-zinc-700'}`}>
              <Calendar size={18} className={soon ? 'text-pink-500' : 'text-zinc-400'} />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-100">{d.name}</p>
              <p className="text-xs text-zinc-400">{format(parseISO(d.date), 'MMM d, yyyy')} · <span className={soon ? 'text-pink-500 font-medium' : ''}>{daysLabel(d.date)}</span></p>
              {d.note && <p className="text-xs text-zinc-400 mt-0.5">{d.note}</p>}
            </div>
            <button onClick={() => deleteDate(d.id)} className="p-1 text-zinc-300 hover:text-red-400"><Trash2 size={14} /></button>
          </Card>
        )
      })}
      <Modal open={modal} onClose={() => setModal(false)} title="Important Date">
        <div className="space-y-4">
          <Input label="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Her birthday, Anniversary" />
          <Input label="Date" type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
          <Input label="Note (optional)" value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} />
          <Btn size="lg" onClick={() => { if (form.name && form.date) { addDate(form); setForm({ name: '', date: '', note: '' }); setModal(false) } }}>Save</Btn>
        </div>
      </Modal>
    </div>
  )
}

// ─── Date Ideas ───────────────────────────────────────────────────────────────
function IdeasTab() {
  const { dateIdeas, addDateIdea, toggleDateIdea, deleteDateIdea } = useStore()
  const [text, setText] = useState('')

  const pending = dateIdeas.filter((d) => !d.done)
  const done = dateIdeas.filter((d) => d.done)

  return (
    <div className="space-y-4">
      <form
        onSubmit={(e) => { e.preventDefault(); if (text.trim()) { addDateIdea(text.trim()); setText('') } }}
        className="flex gap-2"
      >
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Add a date idea..."
          className="flex-1 rounded-xl bg-zinc-100 dark:bg-zinc-700/60 border-0 px-4 py-3 text-sm text-zinc-900 dark:text-white placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-pink-400"
        />
        <Btn type="submit" disabled={!text.trim()}><Plus size={18} /></Btn>
      </form>
      {dateIdeas.length === 0 && <EmptyState icon={Heart} text="Ideas for things to do together" />}
      {pending.length > 0 && (
        <>
          <SectionHeader>Ideas · {pending.length}</SectionHeader>
          {pending.map((d) => (
            <Card key={d.id} className="flex items-center gap-3 px-4 py-3 mb-2">
              <button onClick={() => toggleDateIdea(d.id)} className="w-6 h-6 rounded-full border-2 border-pink-300 dark:border-pink-700 shrink-0" />
              <p className="flex-1 text-sm text-zinc-800 dark:text-zinc-100">{d.idea}</p>
              <button onClick={() => deleteDateIdea(d.id)} className="p-1 text-zinc-300 hover:text-red-400"><Trash2 size={14} /></button>
            </Card>
          ))}
        </>
      )}
      {done.length > 0 && (
        <>
          <SectionHeader>Done · {done.length}</SectionHeader>
          {done.map((d) => (
            <Card key={d.id} className="flex items-center gap-3 px-4 py-3 mb-2 opacity-55">
              <div className="w-6 h-6 rounded-full bg-pink-400 flex items-center justify-center text-white text-xs shrink-0">♥</div>
              <p className="flex-1 text-sm line-through text-zinc-400">{d.idea}</p>
              <button onClick={() => deleteDateIdea(d.id)} className="p-1 text-zinc-300 hover:text-red-400"><Trash2 size={14} /></button>
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
  { key: 'gifts', label: '🎁 Gifts' },
  { key: 'dates', label: '📅 Dates' },
  { key: 'ideas', label: '💝 Ideas' },
]

export default function Her() {
  const [tab, setTab] = useState('movies')
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Heart size={22} className="text-pink-500" fill="currentColor" />
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">For Her</h1>
      </div>
      <div className="flex bg-zinc-100 dark:bg-zinc-800 rounded-2xl p-1 gap-1 overflow-x-auto scrollbar-hide">
        {TABS.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`flex-1 min-w-[5rem] py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              tab === key ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white shadow-sm' : 'text-zinc-400'
            }`}
          >
            {label}
          </button>
        ))}
      </div>
      {tab === 'movies' && <MoviesTab />}
      {tab === 'gifts' && <GiftsTab />}
      {tab === 'dates' && <DatesTab />}
      {tab === 'ideas' && <IdeasTab />}
    </div>
  )
}
