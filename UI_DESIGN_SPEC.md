# LifeOS Design Specification
## Premium UI System (Inspired by LifeFlow, Things 3, Fantastical)

### 1. COLOR TOKENS

**CSS Variables (add to `index.css` @layer base)**

```css
/* Light Mode */
:root {
  --bg-primary: #F8F9FA;
  --bg-secondary: #FFFFFF;
  --text-primary: #0F172A;
  --text-secondary: #64748B;
  --border: #E2E8F0;
  --blue-primary: #3B82F6;
  --blue-light: #DBEAFE;
  --teal-primary: #14B8A6;
  --teal-light: #CCFBF1;
  --purple-primary: #8B5CF6;
  --purple-light: #EDE9FE;
  --red-primary: #EF4444;
  --green-primary: #10B981;
  --amber-primary: #F59E0B;
}

/* Dark Mode */
.dark {
  --bg-primary: #0B0F14;
  --bg-secondary: #161B27;
  --text-primary: #F8FAFC;
  --text-secondary: #94A3B8;
  --border: #1E293B;
  --blue-primary: #2563EB;
  --blue-light: #1E40AF;
  --teal-primary: #14B8A6;
  --teal-light: #0D9488;
  --purple-primary: #8B5CF6;
  --purple-light: #7C3AED;
  --red-primary: #DC2626;
  --green-primary: #059669;
  --amber-primary: #D97706;
}
```

**Tailwind Class Mapping**
- Light backgrounds: `bg-white` / `bg-zinc-50`
- Dark backgrounds: `dark:bg-[#0B0F14]` / `dark:bg-[#161B27]`
- Cards: `bg-white dark:bg-[#161B27]`
- Borders: `border-zinc-200 dark:border-zinc-800`
- Text: `text-zinc-900 dark:text-white` / `text-zinc-600 dark:text-zinc-400`

---

### 2. TYPOGRAPHY SCALE

**Maximum 3 sizes (based on existing hierarchy)**

| Usage | Size | Weight | Line Height | Tailwind Class |
|-------|------|--------|-------------|---|
| Page Title | 26px | 700 | 1.2 | `text-[26px] font-bold leading-tight` |
| Section Header | 18px | 600 | 1.3 | `text-lg font-semibold` |
| Body Text | 14px | 400 | 1.5 | `text-sm` |
| Caption/Label | 11px | 600 | 1 | `text-[11px] font-bold uppercase tracking-wide` |

**Font Stack** (already set globally):
```css
font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Segoe UI', sans-serif;
```

---

### 3. COMPONENT SPECIFICATIONS

#### **TaskItem** (Checked task in Tasks.jsx)
```jsx
<div className="flex items-start gap-3 p-3 bg-white dark:bg-[#161B27] rounded-lg border border-zinc-200/50 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-[#1F2433] active:scale-[0.98] transition-all">
  {/* Checkbox: 20x20px square, no radius */}
  <input 
    type="checkbox" 
    checked={done}
    className="w-5 h-5 rounded-none border-2 border-zinc-300 dark:border-zinc-600 appearance-none cursor-pointer checked:bg-blue-500 checked:border-blue-500 transition-colors" 
  />
  {/* Text (strikethrough if done) */}
  <div className="flex-1">
    <p className={`text-sm ${done ? 'line-through text-zinc-400 dark:text-zinc-600' : 'text-zinc-900 dark:text-white'}`}>
      {task.text}
    </p>
  </div>
  {/* Priority pill */}
  <span className={`text-[10px] font-semibold px-2 py-1 rounded-full whitespace-nowrap ${
    priority === 'high' ? 'bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-300' :
    priority === 'med' ? 'bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300' :
    'bg-green-100 dark:bg-green-500/20 text-green-700 dark:text-green-300'
  }`}>
    {priority.toUpperCase()}
  </span>
</div>
```

#### **AppointmentCard** (Upcoming events)
```jsx
<div className="bg-gradient-to-br from-white to-zinc-50 dark:from-[#161B27] dark:to-[#1A1F2E] rounded-xl p-4 border border-zinc-200/60 dark:border-zinc-700/60 hover:shadow-lg dark:hover:shadow-lg dark:shadow-blue-500/10 transition-all">
  <div className="flex items-start gap-3">
    <div className="flex-1">
      <p className="text-xs text-zinc-500 dark:text-zinc-400 uppercase tracking-wide font-semibold">{day}</p>
      <h3 className="text-sm font-semibold text-zinc-900 dark:text-white mt-1">{title}</h3>
      <div className="flex items-center gap-4 mt-2 text-xs text-zinc-600 dark:text-zinc-400">
        {startTime && <span className="flex items-center gap-1"><Clock size={14} />{startTime}</span>}
        {location && <span className="flex items-center gap-1"><MapPin size={14} />{location}</span>}
      </div>
    </div>
    {important && <div className="w-2 h-2 rounded-full bg-red-500 mt-1" />}
  </div>
</div>
```

#### **HabitRow** (With progress ring)
```jsx
<div className="flex items-center justify-between p-3 bg-white dark:bg-[#161B27] rounded-lg border border-zinc-200/50 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-[#1F2433] transition-colors">
  <div className="flex items-center gap-3 flex-1">
    <span className="text-2xl">{habit.emoji}</span>
    <div>
      <p className="text-sm font-semibold text-zinc-900 dark:text-white">{habit.name}</p>
      <p className="text-xs text-zinc-500 dark:text-zinc-400">{count}/{habit.target} today</p>
    </div>
  </div>
  {/* ProgressRing component (existing) */}
  <ProgressRing done={count} total={habit.target} size={48} color={colorMap[habit.color]} />
</div>
```

#### **CalendarDayCell** (Monthly view)
```jsx
<div className="aspect-square bg-white dark:bg-[#161B27] rounded-lg border border-zinc-200/50 dark:border-zinc-800 p-2 hover:bg-blue-50 dark:hover:bg-blue-500/10 active:scale-95 transition-all cursor-pointer">
  <p className="text-xs font-semibold text-zinc-900 dark:text-white text-center">{day}</p>
  {/* Event dots (max 2) */}
  <div className="flex justify-center gap-1 mt-1">
    {events.slice(0, 2).map(e => <div key={e.id} className="w-1.5 h-1.5 rounded-full bg-blue-500" />)}
    {events.length > 2 && <p className="text-[8px] text-zinc-500">+{events.length - 2}</p>}
  </div>
</div>
```

#### **FAB** (Floating Action Button - bottom nav)
```jsx
<button className="w-14 h-14 rounded-full bg-blue-500 shadow-lg shadow-blue-500/50 hover:bg-blue-600 active:scale-95 flex items-center justify-center text-white transition-all">
  <Plus size={24} strokeWidth={2.5} />
</button>
```

#### **PillTab** (Navigation/Filter)
```jsx
<button className={`px-4 py-2 rounded-full text-sm font-semibold transition-all ${
  active 
    ? 'bg-blue-500 text-white shadow-md shadow-blue-500/30' 
    : 'bg-zinc-100 dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-800'
}`}>
  {label}
</button>
```

#### **StatCard** (Finance/Summary)
```jsx
<div className="bg-gradient-to-br from-white to-zinc-50 dark:from-[#161B27] dark:to-[#1A1F2E] rounded-xl p-4 border border-zinc-200/60 dark:border-zinc-700/60">
  <div className="flex items-start justify-between">
    <div>
      <p className="text-xs font-bold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">{label}</p>
      <p className="text-2xl font-bold text-zinc-900 dark:text-white mt-1">{value}</p>
      <p className={`text-xs mt-1 ${positive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
        {Icon && <Icon size={12} className="inline mr-1" />}
        {change}
      </p>
    </div>
  </div>
</div>
```

---

### 4. INTERACTION STATES

| State | Styling | Example |
|-------|---------|---------|
| **Default** | Base colors, border subtle | Card at rest |
| **Hover** | Lighter bg, shadow, 2px lift | `dark:hover:bg-[#1F2433] hover:shadow-md` |
| **Active/Press** | `scale-95` or `scale-[0.98]` | `active:scale-[0.98]` |
| **Done** | Line-through, opacity reduced | `line-through text-zinc-400` |
| **Overdue** | Red text/border, bold label | `text-red-600 dark:text-red-400` |
| **Selected** | Blue tint bg, blue text | `bg-blue-50 dark:bg-blue-500/10 text-blue-600` |

---

### 5. KEY ANIMATIONS

#### **Page Transition** (Already implemented)
```jsx
<motion.div
  initial={{ opacity: 0, y: 8 }}
  animate={{ opacity: 1, y: 0 }}
  exit={{ opacity: 0 }}
  transition={{ duration: 0.18, ease: 'easeOut' }}
>
```
✓ Fast (180ms), subtle up-slide, easing out

#### **Checkbox Check**
```jsx
<motion.input
  transition={{ duration: 0.3, ease: 'easeOut' }}
  // Plus CSS: checked:bg-blue-500
/>
```

#### **Card Expand** (On click to detail view)
```jsx
<motion.div
  layoutId={`card-${id}`}
  transition={{ duration: 0.25, ease: 'easeOut' }}
/>
```

#### **Habit Progress Ring** (Existing - smooth stroke)
```jsx
<circle
  style={{ transition: 'stroke-dasharray 0.5s ease' }}
/>
```

#### **FAB Pulse** (Optional - on mount)
```jsx
<motion.button
  animate={{ scale: [1, 1.05, 1] }}
  transition={{ duration: 2, repeat: Infinity, repeatDelay: 2 }}
/>
```

---

### 6. SPACING & BORDER RADIUS

**Consistent sizing:**
- Card radius: `rounded-lg` (8px) / `rounded-xl` (12px) / `rounded-2xl` (16px)
- Pill radius: `rounded-full`
- Gap between elements: `gap-3` / `gap-4` (12px / 16px)
- Padding: `p-3` / `p-4` (12px / 16px)
- Border width: 1px always (subtle depth)

---

### 7. DARK MODE IMPLEMENTATION

Use Tailwind's `dark:` prefix with explicit colors:
```jsx
className="bg-white dark:bg-[#161B27] text-zinc-900 dark:text-white border-zinc-200/50 dark:border-zinc-800"
```

**Inner glow effect (dark mode cards):**
```css
@apply dark:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.1)]
```

---

### 8. RESPONSIVE NOTES

- **Max width:** `max-w-md` container (384px) - already set in App.jsx
- **Mobile-first:** All specs designed for 375px+ screens
- **Safe area:** Use `safe-bottom` utility for notch support ✓
- **Touch targets:** Min 44x44px (buttons/checkboxes at 48px)

---

## MIGRATION CHECKLIST

- [ ] Create `tailwind.config.js` with custom color extensions
- [ ] Update card components with new border-radius + shadow tokens
- [ ] Replace action buttons with blue pill-style (active state)
- [ ] Update TaskItem checkboxes (square, no radius)
- [ ] Add priority pills to tasks (colored badges)
- [ ] Enhance AppointmentCard with gradient bg + icon support
- [ ] Add ProgressRing to HabitRow (move to right side)
- [ ] FAB styling in BottomNav (56px blue circle, centered)
- [ ] Test dark mode transitions (enable toggle in Settings.jsx)
- [ ] Add framer-motion animations to cards + checkboxes
