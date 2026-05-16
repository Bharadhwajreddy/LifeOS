# LifeOS Engineering Backlog
React 19 + Vite + Tailwind v4 + Zustand PWA  
**Current Date:** May 16, 2026

---

## PHASE 1: MVP Fixes (Ship Today)

### 1.1 Calendar Day → Add Task/Appointment Buttons
**File:** `/src/pages/Tasks.jsx` (CalendarTab, lines 1102-1114)  
**Issue:** Tapping calendar day 28 shows agenda but no action buttons  
**Fix:**
- Add "Add Task for May 28" and "Add Appointment for May 28" buttons after the "Nothing scheduled" state
- Integrate date context into TaskModal/AppointmentModal initialState
- Pre-populate `form.date` to selected day instead of today()

**Code Changes:**
```jsx
// In CalendarTab, after DailyAgenda or empty state:
{(!selApts.length && !selTasks.length) ? (
  <div className="space-y-3">
    <p className="text-center text-zinc-400 text-sm">Nothing scheduled</p>
    <Btn onClick={() => { setEditTask(null); setTaskModal(true) }}>
      + Add task for {format(selected, 'MMM d')}
    </Btn>
    <Btn variant="secondary" onClick={() => { setEditApt(null); setAptModal(true) }}>
      + Add appointment for {format(selected, 'MMM d')}
    </Btn>
  </div>
) : (
  <DailyAgenda date={selected} ... />
)}
```

### 1.2 Floating Action Button (FAB)
**File:** `/src/App.jsx`  
**Add:** Fixed position FAB in main layout  
**Behavior:** Visible on Tasks tab only; triggers "New Task" modal  
**Style:** Blue pill button with Plus icon, bottom-right corner, z-50  
**CSS:** `fixed bottom-20 right-4 z-50 w-14 h-14 rounded-full bg-blue-500`

### 1.3 Better TaskItem Component
**File:** `/src/pages/Tasks.jsx` (TaskItem function, ~lines 240-300)  
**Current:** Plain text with icon  
**Redesign:**
- Square checkbox (12x12px, blue-500 when checked)
- Pill-shaped priority badge (high=rose, med=amber, low=blue) always visible
- Task title with optional strikethrough when done
- Optional right-align due time in gray

**Layout:** `[checkbox] Text · Due 3pm [priority]`

### 1.4 Habits → List View with SVG Progress Rings
**File:** `/src/pages/Tasks.jsx` (HabitsTab, ~lines 1220-1280)  
**Current:** 2-col card grid  
**Redesign:**
- Full-width list items
- Left: SVG circular progress ring (60px diameter, 4px stroke)
  - Ring color = habit color
  - Center shows completion count (e.g., "2/8")
- Middle: Habit name + emoji, truncated
- Right: Color-coded dot + "Complete" button or "+1" quick-add
- Bottom: Expandable checkmark history (last 7 days)

**File Changes:**  
- Extract progress ring SVG to `<ProgressRing completed={2} target={8} color="blue" />`
- Grid → flex column wrapper with consistent spacing

---

## PHASE 2: UI Polish (Ship This Week)

### 2.1 New Color System
**File:** `/src/index.css`  
**Add Tailwind color palette:**
- Primary: `blue-500` (buttons, links, highlights)
- Success: `emerald-500` (done tasks, checkmarks)
- Warning: `amber-500` (medium priority, due soon)
- Danger: `rose-500` (high priority, overdue)
- Accent: `teal-500` (appointments, new secondary action)
- Neutral: `zinc-{50,100,200,...900}` (text, bg)

### 2.2 Card & Typography Redesign
**Files:** `/src/components/UI.jsx` (Card component) + Task.jsx  
**Changes:**
- Cards: Remove shadow, add subtle border (1px solid zinc-200 dark:zinc-800)
- Rounded corners: 16px minimum (already at 2xl)
- Typography: Increase font-weight hierarchy
  - Section headers: 14px bold + color-coded line accent
  - Task titles: 15px medium + priority pill inline
  - Appointment times: 13px mono-font (better alignment)

### 2.3 AppointmentCard Left Accent
**File:** `/src/pages/Tasks.jsx` (AppointmentCard, ~lines 300-350)  
**Add:** 4px teal-500 left border to appointment cards  
**Layout:** `[4px teal accent] [icon] Title · Time [chevron]`  
**Time Display:** Bold in teal-500

### 2.4 Home Page "At a Glance" Strip
**File:** `/src/pages/Home.jsx`  
**Add 4-stat card strip below header:**
```
[Today's Tasks: 5] [Overdue: 2] [Next Appointment: 2h] [Habit Streak: 7d]
```
- Each stat in compact pill (40px height, tight padding)
- Stat name in gray, count in bold + color code
- Tap to navigate to relevant tab

---

## PHASE 3: Advanced (Ship Next Week)

### 3.1 Recurring Tasks
**Files:** `/src/store.js` + `/src/pages/Tasks.jsx`  
**Schema Addition:**
```js
dailyTask: {
  ...existing,
  recurrence: null | 'daily' | 'weekly' | 'biweekly' | 'monthly',
  recurUntil: null | 'yyyy-MM-dd',
  recurDays: [0,1,2,3,4,5,6], // for weekly
}
```
**Implementation:**
- New `expandRecurringTasks()` helper to generate instances from template
- Run on app startup + when viewing calendar
- Soft-delete pattern (hide instances, keep template)
- UI: Toggle "Make recurring" in TaskModal with recurrence selector

### 3.2 Notification Permission Flow
**File:** `/src/pages/Tasks.jsx` (useReminders hook, ~lines 90-150)  
**UX:**
- First reminder toggle → iOS-style permission request modal
- Modal shows: "Get alerts for important appointments" + icon
- Two buttons: "Enable" | "Not now"
- Store permission state in Zustand + localStorage
- Skip modal on subsequent toggles

### 3.3 Swipe-to-Complete / Reschedule
**File:** `/src/pages/Tasks.jsx` (TaskItem)  
**Behavior:**
- Swipe left on task card: reveal 2-action overlay
  - Green "✓ Complete" button (left-aligned)
  - Teal "→ Reschedule" button (right-aligned)
- Tap action or release swipe to confirm
- Use Framer Motion `AnimatePresence` for smooth reveal

**Implementation:**
- Track mouse/touch `(startX, currentX)` delta
- If delta > 60px left: show overlay, on release call handler
- Ensure no conflict with horizontal scroll on pill tabs

---

## Technical Notes

### File Structure Summary
- `/src/pages/Tasks.jsx` — 2000+ lines, main page with all 6 tabs
- `/src/store.js` — Zustand store with persist middleware
- `/src/components/UI.jsx` — Reusable Button, Card, Input, Badge, etc.
- `/src/pages/Home.jsx` — Dashboard (needs stat strip)
- `vercel.json` — SPA routing (✓ already fixed)

### Performance Considerations
- `DailyAgenda` already uses `useMemo` for filtered lists
- Progress ring SVG should render as cheap DOM (no Canvas)
- Recurring task expansion should be cached in store (not computed per-render)

### Store Actions Needed
- Phase 1: None (existing `addDailyTask` uses date param already)
- Phase 2: None
- Phase 3: `addRecurringTask()`, `updateRecurrence()`, `expandRecurringTasks()`

---

## Success Metrics

**Phase 1:**
- [ ] Calendar day tap shows action buttons
- [ ] FAB visible on Tasks tab, creates tasks with correct date
- [ ] TaskItem priority pill visible + colored correctly
- [ ] Habits display as full-width list with progress rings

**Phase 2:**
- [ ] Cards have teal accent on appointments
- [ ] Home page shows 4-stat strip
- [ ] All fonts follow hierarchy (headers bold, body regular)
- [ ] Dark mode properly supported across new components

**Phase 3:**
- [ ] Recurring tasks expand correctly on app load
- [ ] Notification permission modal shows once per user
- [ ] Swipe left on task reveals complete/reschedule actions
