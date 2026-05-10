export function Card({ children, className = '' }) {
  return (
    <div className={`bg-white dark:bg-zinc-800/60 rounded-2xl shadow-sm border border-zinc-100 dark:border-zinc-700/50 ${className}`}>
      {children}
    </div>
  )
}

export function Btn({ children, onClick, variant = 'primary', size = 'md', className = '', disabled = false, type = 'button' }) {
  const base = 'inline-flex items-center justify-center gap-2 font-semibold rounded-xl transition-all active:scale-95 disabled:opacity-40'
  const sizes = { sm: 'px-3 py-1.5 text-sm', md: 'px-4 py-2.5 text-sm', lg: 'w-full py-3.5 text-base' }
  const variants = {
    primary: 'bg-blue-500 text-white hover:bg-blue-600',
    ghost: 'bg-zinc-100 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-200 hover:bg-zinc-200 dark:hover:bg-zinc-600',
    danger: 'bg-red-500 text-white hover:bg-red-600',
    success: 'bg-green-500 text-white hover:bg-green-600',
  }
  return (
    <button type={type} onClick={onClick} disabled={disabled} className={`${base} ${sizes[size]} ${variants[variant]} ${className}`}>
      {children}
    </button>
  )
}

export function Input({ label, ...props }) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && <label className="text-sm font-medium text-zinc-600 dark:text-zinc-400">{label}</label>}
      <input
        {...props}
        className="w-full rounded-xl bg-zinc-100 dark:bg-zinc-700/60 border-0 px-4 py-3 text-sm text-zinc-900 dark:text-white placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
    </div>
  )
}

export function Select({ label, children, ...props }) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && <label className="text-sm font-medium text-zinc-600 dark:text-zinc-400">{label}</label>}
      <select
        {...props}
        className="w-full rounded-xl bg-zinc-100 dark:bg-zinc-700/60 border-0 px-4 py-3 text-sm text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none"
      >
        {children}
      </select>
    </div>
  )
}

export function Badge({ children, color = 'blue' }) {
  const colors = {
    blue: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
    red: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
    green: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300',
    amber: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
    purple: 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300',
    zinc: 'bg-zinc-100 text-zinc-600 dark:bg-zinc-700 dark:text-zinc-300',
  }
  return <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${colors[color]}`}>{children}</span>
}

export function SectionHeader({ children }) {
  return <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 mb-2 mt-1">{children}</p>
}

export function EmptyState({ icon: Icon, text }) {
  return (
    <div className="flex flex-col items-center gap-2 py-10 text-zinc-400 dark:text-zinc-600">
      <Icon size={36} strokeWidth={1.2} />
      <p className="text-sm">{text}</p>
    </div>
  )
}
