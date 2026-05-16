# LifeOS Premium Design - Implementation Checklist

## Phase 1: Core Foundation (Start Here)

### Color & Theme Setup
- [ ] Update `/src/index.css` with CSS custom properties for dark mode
- [ ] Add `dark:` prefixed color classes to all existing divs
- [ ] Update background: `bg-zinc-50 dark:bg-[#0B0F14]`
- [ ] Update card backgrounds: `bg-white dark:bg-[#161B27]`
- [ ] Test dark mode toggle in Settings.jsx

### Typography
- [ ] Verify font stack in index.css (already set to SF Pro)
- [ ] Apply 3-tier sizing scale across pages
  - [ ] Page titles: `text-[26px] font-bold`
  - [ ] Section headers: `text-lg font-semibold`
  - [ ] Body text: `text-sm`
  - [ ] Labels: `text-[11px] font-bold uppercase`

---

## Phase 2: Component Styling

### Cards & Containers
- [ ] Add border to all card divs: `border border-zinc-200/50 dark:border-zinc-800`
- [ ] Apply rounded-lg/rounded-xl: `rounded-lg` (8px default)
- [ ] Add hover effects: `hover:bg-zinc-50 dark:hover:bg-[#1F2433]`
- [ ] Add padding consistency: `p-3` or `p-4`
- [ ] Add gradient to stat cards: `bg-gradient-to-br from-white to-zinc-50 dark:from-[#161B27] dark:to-[#1A1F2E]`

### Checkboxes (All Pages)
- [ ] Find all `<input type="checkbox">` elements
- [ ] Change `rounded` to `rounded-none` (square shape)
- [ ] Update classes:
  ```jsx
  className="w-5 h-5 rounded-none border-2 border-zinc-300 dark:border-zinc-600 appearance-none cursor-pointer checked:bg-blue-500 checked:border-blue-500 transition-colors"
  ```
- [ ] Files to update:
  - [ ] `/src/pages/Tasks.jsx` - Daily task checkboxes
  - [ ] `/src/pages/Her.jsx` - Movie/gift checkboxes
  - [ ] `/src/components/Modal.jsx` - Any modal checkboxes

### Priority Pills (Tasks.jsx)
- [ ] Add priority display next to tasks
- [ ] Implement colored pill badges:
  ```jsx
  // HIGH:   bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-300
  // MEDIUM: bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300
  // LOW:    bg-green-100 dark:bg-green-500/20 text-green-700 dark:text-green-300
  ```

### Appointment Cards
- [ ] Update card styling with gradient background
- [ ] Add icon support (Clock, MapPin from lucide-react)
- [ ] Add overdue state styling (red tint if past date)
- [ ] Add "important" indicator dot (red pulse)

### Habit Rows
- [ ] Move ProgressRing from left to right side
- [ ] Adjust layout: emoji + text on left, ring on right
- [ ] Update spacing and alignment
- [ ] Add "X/target" text under habit name

### Bottom Navigation
- [ ] Style active nav item with blue pill background
- [ ] Update FAB button styling:
  ```jsx
  // w-14 h-14 rounded-full bg-blue-500 shadow-lg shadow-blue-500/50
  // hover:bg-blue-600 active:scale-[0.92]
  ```
- [ ] Center FAB in navigation bar

---

## Phase 3: Animations & Interactions

### Page Transitions
- [ ] Verify existing animation in App.jsx (already done ✓)
- [ ] Check duration: 180ms with easeOut

### Component Animations
- [ ] Wrap task items with `motion.div` + layout animation
- [ ] Wrap appointment cards with whileHover animation
- [ ] Wrap habit rows with entrance animation
- [ ] Add checkbox tap feedback: `whileTap={{ scale: 0.95 }}`

### Button Interactions
- [ ] Add tap feedback to all buttons: `active:scale-[0.98]`
- [ ] Add hover state: `whileHover={{ y: -2 }}`
- [ ] Update FAB: `whileTap={{ scale: 0.92 }}`

### Progress Rings
- [ ] Verify smooth stroke animation in Home.jsx (already done ✓)
- [ ] Check duration: 0.5s ease

---

## Phase 4: Page-by-Page Updates

### Home.jsx
- [ ] Update greeting card styling with gradient
- [ ] Update task/habit progress displays
- [ ] Update stat cards (income, expenses, saved)
- [ ] Update upcoming appointments card list
- [ ] Test responsive grid layout (2 columns)

### Tasks.jsx (High Priority)
- [ ] Import TaskItem component from COMPONENT_EXAMPLES.jsx
- [ ] Update task list styling with new colors
- [ ] Add priority pill display
- [ ] Add delete button on hover
- [ ] Update "Add Task" button styling (pill shape)
- [ ] Add task filter tabs (All, Pending, Done)

### Finance.jsx
- [ ] Update transaction list styling
- [ ] Update budget progress bars color (blue primary)
- [ ] Update category pills styling
- [ ] Update monthly summary stat cards
- [ ] Test dark mode on charts/tables

### Her.jsx
- [ ] Update movie/gift list item styling
- [ ] Update checkboxes (square, no radius)
- [ ] Update date cards with gradient background
- [ ] Update "Date Ideas" section styling

### Settings.jsx
- [ ] Update toggle switch styling (dark blue)
- [ ] Update preference cards
- [ ] Add color indicator next to dark mode toggle
- [ ] Test all settings interactions

---

## Phase 5: Polish & Refinement

### Dark Mode Testing
- [ ] Toggle dark mode in Settings
- [ ] Check every element has proper dark mode colors
- [ ] Verify text contrast (WCAG AA minimum)
- [ ] Check border visibility in dark mode
- [ ] Test animations in both modes

### Responsive Design
- [ ] Test on iPhone SE (375px width)
- [ ] Test on iPhone 12 Pro (390px)
- [ ] Test on iPhone 14 Pro Max (430px)
- [ ] Verify max-w-md container (384px)
- [ ] Check notch/safe area support

### Performance
- [ ] Check animation smoothness (60fps)
- [ ] Verify no layout shifts
- [ ] Test on low-end Android device
- [ ] Check bundle size hasn't increased

### Accessibility
- [ ] Verify button sizes >= 44px
- [ ] Check color contrast ratios
- [ ] Test keyboard navigation
- [ ] Verify icon labels/aria-labels

---

## Phase 6: Advanced Features (Optional)

### Motion Refinements
- [ ] Add page-specific transition variants
- [ ] Add stagger animation to list items
- [ ] Add collapse/expand animations to cards
- [ ] Add drag-to-delete gesture

### Micro-interactions
- [ ] Add success toast animation after task completion
- [ ] Add ripple effect on button press
- [ ] Add floating action feedback
- [ ] Add habit streak celebration animation

### Theming System
- [ ] Create custom accent color selector in Settings
- [ ] Create font size preference
- [ ] Create animation speed preference
- [ ] Persist theme choices to localStorage

---

## Testing Checklist

### Functionality
- [ ] All buttons are clickable
- [ ] All forms submit correctly
- [ ] Dark mode toggle works
- [ ] All navigation links work
- [ ] Animations play smoothly

### Visual
- [ ] Colors match design spec exactly
- [ ] Typography hierarchy is clear
- [ ] All borders are visible (both modes)
- [ ] Cards have proper shadow/depth
- [ ] FAB is centered in bottom nav

### Interaction
- [ ] Hover states work on all interactive elements
- [ ] Active/pressed states are visible
- [ ] Animations are fluid and not jarring
- [ ] Page transitions are smooth
- [ ] Tap feedback is responsive

### Dark Mode Specific
- [ ] All text is readable on dark backgrounds
- [ ] Borders are visible (not too dark)
- [ ] Borders don't vanish in dark mode
- [ ] Icons have proper contrast
- [ ] Gradients look good

---

## Files to Modify

**Priority 1** (Core styling):
- [ ] `/src/index.css` - Add color tokens
- [ ] `/src/App.jsx` - Update background colors
- [ ] `/src/components/BottomNav.jsx` - Update nav styling + FAB
- [ ] `/src/pages/Tasks.jsx` - Checkbox + priority pills

**Priority 2** (Component enhancement):
- [ ] `/src/pages/Home.jsx` - Card styling + animations
- [ ] `/src/pages/Finance.jsx` - Stat cards + progress bars
- [ ] `/src/pages/Her.jsx` - List items + checkboxes
- [ ] `/src/components/Modal.jsx` - Form styling

**Priority 3** (Polish):
- [ ] `/src/pages/Settings.jsx` - Dark mode toggle styling
- [ ] All components - Add framer-motion animations
- [ ] All pages - Test and refinements

---

## Reference Files

Created in this session:
1. **UI_DESIGN_SPEC.md** - Complete design specification
2. **COMPONENT_EXAMPLES.jsx** - Copy/paste ready components
3. **TAILWIND_CONFIG.js** - Optional Tailwind extensions
4. **DESIGN_QUICK_REFERENCE.md** - Handy color/style guide
5. **IMPLEMENTATION_CHECKLIST.md** - This file

---

## Time Estimates

- Phase 1 (Colors): ~1 hour
- Phase 2 (Components): ~3 hours
- Phase 3 (Animations): ~1.5 hours
- Phase 4 (Pages): ~4 hours
- Phase 5 (Polish): ~2 hours
- **Total**: ~11 hours for complete redesign

---

## Getting Help

**Colors look off?**
- Check light/dark mode is set correctly
- Compare with DESIGN_QUICK_REFERENCE.md color values
- Verify `dark:` prefix is applied

**Animations stuttering?**
- Check for layout shifts (use `layout` prop in motion.div)
- Reduce animation duration for testing
- Check device performance (Safari DevTools)

**Checkboxes not square?**
- Ensure `rounded-none` (no border-radius)
- Check `w-5 h-5` for size (20x20px)
- Verify `appearance-none` is set

**Dark mode not working?**
- Verify `dark` class toggling in store.js → Settings.jsx
- Check dark: prefixes are applied to ALL color props
- Test in browser dev tools (toggle .dark class manually)

**FAB misaligned?**
- Use flexbox centering: `flex items-center justify-center`
- Set size to exactly `w-14 h-14`
- Remove margin/padding from parent
