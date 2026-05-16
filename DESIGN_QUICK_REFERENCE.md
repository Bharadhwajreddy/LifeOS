# LifeOS Design - Quick Reference Guide

## Color Palette

### Light Mode
- **Background**: `#F8F9FA` (zinc-50)
- **Cards**: `#FFFFFF` (white)
- **Text**: `#0F172A` (slate-950)
- **Accent**: `#3B82F6` (blue-500)
- **Success**: `#10B981` (emerald-500)
- **Warning**: `#F59E0B` (amber-500)
- **Danger**: `#EF4444` (red-500)

### Dark Mode
- **Background**: `#0B0F14` (custom navy)
- **Cards**: `#161B27` (custom dark gray)
- **Text**: `#F8FAFC` (slate-50)
- **Accent**: `#2563EB` (blue-600)
- **Borders**: `#1E293B` (slate-800)

**Tailwind Classes**: Use `dark:` prefix for all dark mode overrides

---

## Typography

| Element | Size | Weight | Example |
|---------|------|--------|---------|
| Page Title | 26px | Bold | `text-[26px] font-bold` |
| Section Header | 18px | Semibold | `text-lg font-semibold` |
| Body | 14px | Regular | `text-sm` |
| Label | 11px | Bold | `text-[11px] font-bold uppercase` |

**Font**: System default (SF Pro / Segoe UI)

---

## Component Quick Styles

### Cards
```
Base:     bg-white dark:bg-[#161B27]
Border:   border border-zinc-200/50 dark:border-zinc-800
Rounded:  rounded-lg (8px) / rounded-xl (12px)
Hover:    hover:bg-zinc-50 dark:hover:bg-[#1F2433]
Padding:  p-3 (12px) / p-4 (16px)
```

### Buttons
```
Primary:    bg-blue-500 text-white rounded-full px-4 py-2
Secondary:  bg-zinc-100 dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300
Active:     scale-95 active:scale-95 transition-transform
```

### Checkboxes
```
Unchecked:  border-2 border-zinc-300 dark:border-zinc-600
Checked:    bg-blue-500 checked:bg-blue-500 checked:border-blue-500
Square:     rounded-none (no border-radius)
Size:       w-5 h-5 (20x20px)
```

### Priority Pills
```
High:   bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-300
Medium: bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300
Low:    bg-green-100 dark:bg-green-500/20 text-green-700 dark:text-green-300
```

### FAB
```
Size:       w-14 h-14 (56x56px)
Style:      bg-blue-500 rounded-full shadow-lg shadow-blue-500/50
Active:     active:scale-[0.92]
Hover:      hover:bg-blue-600
```

---

## Animation Transitions

| Action | Duration | Easing | Effect |
|--------|----------|--------|--------|
| Page Change | 180ms | easeOut | `opacity: 0→1, y: 8→0` |
| Checkbox | 300ms | easeOut | `scale: 1→0.95→1` |
| Card Hover | 200ms | easeOut | `y: 0→-2` |
| FAB Press | 100ms | easeOut | `scale: 1→0.92` |
| Progress Ring | 500ms | easeOut | `stroke-dasharray` animate |

**Framer Motion Setup**:
```jsx
// Page transition (already in App.jsx)
<motion.div
  initial={{ opacity: 0, y: 8 }}
  animate={{ opacity: 1, y: 0 }}
  exit={{ opacity: 0 }}
  transition={{ duration: 0.18, ease: 'easeOut' }}
/>

// Tap feedback
<motion.button whileTap={{ scale: 0.95 }} />

// Hover effect
<motion.div whileHover={{ y: -2 }} />
```

---

## Responsive Grid

- **Max Width**: 384px (md breakpoint, mobile-optimized)
- **Padding**: 16px on sides
- **Gap**: 12px (gap-3) between list items, 16px (gap-4) between sections
- **Grid Cols**: 2 columns for stat cards (flex-basis 50%)

**Safe Area**: Use `safe-bottom` for bottom nav on notch devices

---

## Dark Mode Implementation

1. Check dark mode toggle in Settings
2. Toggle applies `dark` class to `<html>`
3. All colors use `dark:` Tailwind prefix
4. No custom CSS needed (uses Tailwind defaults + custom colors)

**Example**:
```jsx
<div className="bg-white dark:bg-[#161B27] text-zinc-900 dark:text-white" />
```

---

## State Styles

### Default
- Base card/button appearance
- Full opacity
- Normal color

### Hover
- `hover:bg-zinc-50 dark:hover:bg-[#1F2433]`
- `hover:shadow-md`
- Icon/text may lighten

### Active/Pressed
- `active:scale-[0.98]` or `active:scale-95`
- Slightly reduced shadow
- No bg change needed (scale effect)

### Done/Completed
- `line-through`
- `text-zinc-400 dark:text-zinc-600`
- Reduced opacity (looks "archived")

### Overdue/Error
- `text-red-600 dark:text-red-400`
- `border-red-200/50 dark:border-red-900/30`
- Red accent ring or highlight

### Selected/Active Tab
- `bg-blue-50 dark:bg-blue-500/10`
- `text-blue-600 dark:text-blue-400`
- Pill tabs: `bg-blue-500 text-white`

---

## Common Patterns

### List Item (Task/Habit)
```jsx
<div className="flex items-center gap-3 p-3 bg-white dark:bg-[#161B27] rounded-lg border border-zinc-200/50 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-[#1F2433]">
  <input type="checkbox" className="w-5 h-5 rounded-none" />
  <div className="flex-1">Title & meta</div>
  <span className="text-xs font-bold px-2 py-1 rounded-full bg-blue-100 dark:bg-blue-500/20">LABEL</span>
</div>
```

### Card with Gradient
```jsx
<div className="bg-gradient-to-br from-white to-zinc-50 dark:from-[#161B27] dark:to-[#1A1F2E] rounded-xl p-4 border border-zinc-200/60 dark:border-zinc-700/60">
  Content
</div>
```

### Stat/Summary Card
```jsx
<div className="bg-gradient-to-br from-white to-zinc-50 dark:from-[#161B27] dark:to-[#1A1F2E] rounded-xl p-4">
  <p className="text-xs font-bold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">LABEL</p>
  <p className="text-2xl font-bold text-zinc-900 dark:text-white mt-2">Value</p>
  <p className="text-xs text-green-600 dark:text-green-400 mt-2">+12% vs last month</p>
</div>
```

### Icon Button Group (Bottom Nav)
```jsx
<div className={`flex flex-col items-center gap-0.5 py-2 px-2 rounded-xl transition-all ${
  isActive ? 'text-blue-500 bg-blue-50 dark:bg-blue-500/10' : 'text-zinc-400 dark:text-zinc-600'
}`}>
  <Icon size={20} />
  <span className="text-[10px] font-bold">{label}</span>
</div>
```

---

## Migration Steps (Priority Order)

1. **Update Colors** - Add `dark:` classes to existing divs
2. **Fix Checkboxes** - Change `rounded` to `rounded-none` in all checkboxes
3. **Enhance Cards** - Add gradient + border styling
4. **Priority Pills** - Add colored badge to task items
5. **Habit Rows** - Move progress ring to right side
6. **FAB** - Style bottom nav add button (blue circle)
7. **Animations** - Wrap components with `motion.div`
8. **Test Dark Mode** - Toggle in Settings, verify all elements

---

## Files Reference

- **Design Spec**: `/UI_DESIGN_SPEC.md` (full specs)
- **Components**: `/COMPONENT_EXAMPLES.jsx` (copy/paste ready)
- **Tailwind Config**: `/TAILWIND_CONFIG.js` (optional enhancements)
- **Current CSS**: `/src/index.css` (base styles)

---

## Key Premium Features

✓ **Gradient Cards** - Subtle gradient background  
✓ **Priority Pills** - Colored badges instead of dots  
✓ **Square Checkboxes** - Modern flat design  
✓ **Progress Rings** - Circular SVG indicators  
✓ **Smooth Animations** - 180ms page transitions  
✓ **Dark Mode** - Full night mode with custom colors  
✓ **Hover States** - Subtle lift + shadow effects  
✓ **FAB Styling** - Large blue circle (Things 3 style)  
✓ **Typography Hierarchy** - Clear size/weight scale  
✓ **Safe Area Support** - Notch device compatibility  

---

## Debugging

**Border not showing?** - Add `border` + `border-color` together
**Text not visible in dark mode?** - Use `dark:text-white` or lighter shade
**Animation stuttering?** - Check for layout shifts, use `layout` prop
**Checkbox not square?** - Ensure `rounded-none` (no border-radius)
**FAB too small?** - Must be `w-14 h-14` (56px)
