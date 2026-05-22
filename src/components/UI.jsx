// Card
export function Card({ children, className = '' }) {
  return (
    <div
      style={{
        background: 'var(--surface)',
        border: '1px solid var(--card-border)',
        borderRadius: 'var(--card-radius)',
        boxShadow: 'var(--shadow-sm)',
        backdropFilter: 'var(--backdrop)',
        WebkitBackdropFilter: 'var(--backdrop)',
      }}
      className={className}
    >
      {children}
    </div>
  )
}

// Button
export function Btn({ children, onClick, variant = 'primary', size = 'md', className = '', disabled = false, type = 'button', style = {} }) {
  const base = 'inline-flex items-center justify-center gap-2 font-semibold rounded-xl transition-all active:scale-[0.97] disabled:opacity-40 select-none focus:outline-none'
  const sizes = { sm: 'px-3 py-1.5 text-xs', md: 'px-4 py-2.5 text-sm', lg: 'w-full py-3.5 text-[15px]' }
  const variantClass = {
    primary: 'text-white',
    ghost:   'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200 hover:bg-zinc-200 dark:hover:bg-zinc-700',
    danger:  'bg-rose-500 text-white hover:bg-rose-600',
    success: 'bg-emerald-500 text-white hover:bg-emerald-600',
  }
  const variantStyle = {
    primary: { background: 'var(--accent)', ...style },
    ghost:   style,
    danger:  style,
    success: style,
  }
  return (
    <button type={type} onClick={onClick} disabled={disabled}
      className={`${base} ${sizes[size]} ${variantClass[variant]} ${className}`}
      style={variantStyle[variant]}
    >
      {children}
    </button>
  )
}

// Input
export function Input({ label, ...props }) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && <label className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest">{label}</label>}
      <input
        {...props}
        style={{ background: 'var(--surface-3, var(--surface))', color: 'var(--text)', borderColor: 'var(--border)' }}
        className="w-full rounded-xl border px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
      />
    </div>
  )
}

// Select
export function Select({ label, children, ...props }) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && <label className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest">{label}</label>}
      <select
        {...props}
        className="w-full rounded-xl border px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent)] appearance-none"
        style={{ background: 'var(--surface-3, var(--surface))', color: 'var(--text)', borderColor: 'var(--border)' }}
      >
        {children}
      </select>
    </div>
  )
}

// Badge
export function Badge({ children, color = 'blue' }) {
  const colors = {
    blue:   'bg-blue-100 text-blue-700 dark:bg-blue-500/25 dark:text-blue-300',
    red:    'bg-rose-100 text-rose-700 dark:bg-rose-500/25 dark:text-rose-300',
    green:  'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/25 dark:text-emerald-300',
    amber:  'bg-amber-100 text-amber-700 dark:bg-amber-500/25 dark:text-amber-300',
    purple: 'bg-violet-100 text-violet-700 dark:bg-violet-500/25 dark:text-violet-300',
    zinc:   'bg-zinc-100 text-zinc-600 dark:bg-zinc-700 dark:text-zinc-300',
  }
  return <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold ${colors[color]}`}>{children}</span>
}

// Section header
export function SectionHeader({ children }) {
  return <p style={{ color: 'var(--text-3)', fontFamily: 'var(--font-sans)' }} className="text-[11px] font-bold uppercase tracking-widest mb-2 mt-1">{children}</p>
}

// Empty state
export function EmptyState({ icon: Icon, text }) {
  return (
    <div className="flex flex-col items-center gap-3 py-14 text-zinc-300 dark:text-zinc-700">
      <Icon size={48} strokeWidth={1} />
      <p className="text-sm text-zinc-400 dark:text-zinc-600">{text}</p>
    </div>
  )
}

// Stat card with gradient
export function StatCard({ label, value, sub, color = 'blue' }) {
  const colors = {
    blue:   'from-blue-400 to-blue-500',
    green:  'from-emerald-400 to-emerald-500',
    red:    'from-rose-400 to-rose-500',
    amber:  'from-amber-400 to-amber-500',
    purple: 'from-violet-400 to-violet-500',
  }
  return (
    <div className={`bg-gradient-to-br ${colors[color]} rounded-2xl p-4 text-white shadow-lg`}>
      <p className="text-[11px] font-bold uppercase tracking-wide opacity-80">{label}</p>
      <p className="text-2xl font-bold mt-1 leading-none">{value}</p>
      {sub && <p className="text-xs opacity-70 mt-1">{sub}</p>}
    </div>
  )
}

// Tab bar
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
