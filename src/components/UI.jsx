// Card
export function Card({ children, className = '' }) {
  return (
    <div className={`bg-white dark:bg-zinc-900 rounded-2xl shadow-sm dark:shadow-none ring-1 ring-zinc-200/60 dark:ring-white/[0.06] ${className}`}>
      {children}
    </div>
  )
}

// Button
export function Btn({ children, onClick, variant = 'primary', size = 'md', className = '', disabled = false, type = 'button' }) {
  const base = 'inline-flex items-center justify-center gap-2 font-semibold rounded-xl transition-all active:scale-[0.97] disabled:opacity-40 select-none'
  const sizes = { sm: 'px-3 py-1.5 text-xs', md: 'px-4 py-2.5 text-sm', lg: 'w-full py-3.5 text-[15px]' }
  const variants = {
    primary:  'bg-blue-500 text-white hover:bg-blue-600 shadow-sm shadow-blue-500/25',
    ghost:    'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200 hover:bg-zinc-200 dark:hover:bg-zinc-700',
    danger:   'bg-rose-500 text-white hover:bg-rose-600 shadow-sm shadow-rose-500/25',
    success:  'bg-emerald-500 text-white hover:bg-emerald-600 shadow-sm shadow-emerald-500/25',
  }
  return (
    <button type={type} onClick={onClick} disabled={disabled} className={`${base} ${sizes[size]} ${variants[variant]} ${className}`}>
      {children}
    </button>
  )
}

// Input
export function Input({ label, ...props }) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && <label className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">{label}</label>}
      <input
        {...props}
        className="w-full rounded-xl bg-zinc-100 dark:bg-zinc-800 border-0 px-4 py-3 text-sm text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-blue-500/70"
      />
    </div>
  )
}

// Select
export function Select({ label, children, ...props }) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && <label className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">{label}</label>}
      <select
        {...props}
        className="w-full rounded-xl bg-zinc-100 dark:bg-zinc-800 border-0 px-4 py-3 text-sm text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/70 appearance-none"
      >
        {children}
      </select>
    </div>
  )
}

// Badge
export function Badge({ children, color = 'blue' }) {
  const colors = {
    blue:   'bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300',
    red:    'bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300',
    green:  'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300',
    amber:  'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300',
    purple: 'bg-violet-100 text-violet-700 dark:bg-violet-500/15 dark:text-violet-300',
    zinc:   'bg-zinc-100 text-zinc-600 dark:bg-zinc-700 dark:text-zinc-300',
  }
  return <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold ${colors[color]}`}>{children}</span>
}

// Section header
export function SectionHeader({ children }) {
  return <p className="text-[11px] font-bold uppercase tracking-widest text-zinc-400 dark:text-zinc-500 mb-2 mt-1">{children}</p>
}

// Empty state
export function EmptyState({ icon: Icon, text }) {
  return (
    <div className="flex flex-col items-center gap-3 py-12 text-zinc-300 dark:text-zinc-700">
      <Icon size={40} strokeWidth={1} />
      <p className="text-sm text-zinc-400 dark:text-zinc-600">{text}</p>
    </div>
  )
}

// Stat card (used in dashboards)
export function StatCard({ label, value, sub, color = 'blue' }) {
  const colors = {
    blue:   'from-blue-500 to-blue-600',
    green:  'from-emerald-500 to-emerald-600',
    red:    'from-rose-500 to-rose-600',
    amber:  'from-amber-500 to-amber-600',
    purple: 'from-violet-500 to-violet-600',
  }
  return (
    <div className={`bg-gradient-to-br ${colors[color]} rounded-2xl p-4 text-white`}>
      <p className="text-[11px] font-bold uppercase tracking-wide opacity-80">{label}</p>
      <p className="text-2xl font-bold mt-1 leading-none">{value}</p>
      {sub && <p className="text-xs opacity-70 mt-1">{sub}</p>}
    </div>
  )
}

// Tab bar (reusable)
export function TabBar({ tabs, active, onChange }) {
  return (
    <div className="flex bg-zinc-100 dark:bg-zinc-800/80 rounded-2xl p-1 gap-1">
      {tabs.map(({ key, label }) => (
        <button
          key={key}
          onClick={() => onChange(key)}
          className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
            active === key
              ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white shadow-sm'
              : 'text-zinc-400 dark:text-zinc-500'
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  )
}
