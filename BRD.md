# LifeOS — Business Requirements Document

> Version 1.0 | Generated 2026-05-19 | Status: Living Document

---

## 1. 📋 Executive Summary

**App Name:** LifeOS
**Type:** Progressive Web App (PWA)
**Purpose:** All-in-one personal life management system covering daily productivity, habits, finances, relationship tracking, and gamified self-improvement.
**Primary User:** Bharadhwaj (solo, personal use — not a SaaS product)
**Tech Stack:** React 19 + Vite 6 + Zustand 5 + Tailwind CSS v4 + Framer Motion v12 + date-fns v4
**Data Persistence:** Zustand persisted to `localStorage` key `lifeos-v4`
**PWA:** vite-plugin-pwa v1.3 — manifest + service worker installed

### Completion Status

| Phase | Feature | Status |
|-------|---------|--------|
| Phase 0 | Architecture Reconnaissance | ✅ Done |
| Phase 2 | Efficiency Engine (lib + hook) | ✅ Done |
| Phase 3+4 | Theme System + Visual Upgrade | ✅ Done |
| Phase 5 | Efficiency Dashboard UI | ✅ Done |
| Phase 6 | Habits Analytics | ✅ Done |
| Phase 7 | Gamification (XP, levels, achievements) | ✅ Done |
| Phase 8 | Pomodoro Timer | ✅ Done |
| Phase 9 | Eisenhower Matrix | ✅ Done |
| Phase 10 | Mood Tracking | ✅ Done |
| Phase 12 | Export/Reports (CSV + JSON) | ✅ Done |
| Phase 11 | Recurring Task Intelligence | ✅ Done (in store.js + Tasks.jsx) |
| Phase 13 | Mobile Polish Pass | ❌ Not started |
| Phase 14 | QA and Integration | ❌ Not started |

**Overall:** ~85% complete. The app has a rich, layered feature set. Remaining work is polish, sync, and feature deepening rather than foundational construction.

---

## 2. 🗂️ Current Feature Inventory

### 2.1 Home Page (`/`)

- **Time-aware greeting** — "Good morning / afternoon / evening / Up late" based on hour
- **7-day calendar strip** — horizontal scrollable strip showing the current week
- **Streak cards** — task streak and habit streak displayed as gradient cards with emoji background
- **XP Bar** (`XPBar.jsx`) — animated level indicator with progress bar; 10 levels (thresholds: 0, 100, 250, 500, 1000, 2000, 4000, 8000, 16000, 32000 XP)
- **Mood check-in** (`MoodCheckIn.jsx`) — once-per-day emoji picker (1–5 mood scale), skipped after first daily log
- **Animated progress rings** — SVG rings showing task completion percentage
- **Efficiency panel** — inline section showing daily/weekly/monthly efficiency %
- **Finance snapshot** — income vs expenses bar with animated fill
- **Quick navigation arrows** — arrow cards linking to Tasks, Finance, Her pages
- **Animated number counters** — numbers count up from 0 on mount

### 2.2 Tasks Page (`/tasks`)

**Daily Tasks tab:**
- Add tasks with text, date, priority (high/med/low), notes, due time
- Toggle task done/undone (earns 10/20/30 XP by priority)
- Delete tasks
- Edit tasks inline
- Priority color coding (red/amber/blue dots)
- Overdue task detection and visual indicator
- Pomodoro launcher 🍅 on each task card

**Habits section:**
- Add/edit/delete habits with name, emoji, target (times/day), color
- Log habit completions (tap to increment count toward target)
- Reset today's habit count
- Habit streak calculation (consecutive days meeting target, looking back from yesterday)
- **Habit Analytics** (`HabitAnalytics`):
  - 7-day completion grid (weekly dot visualization)
  - Per-habit streak counter
  - 14-day completion percentage
  - "Consider adjusting" suggestion for habits with <30% completion rate

**Recurring Tasks section:**
- Add recurring task templates: daily / weekly (specific days) / monthly (specific day of month)
- Set priority, due time, notes per template
- Toggle active/inactive
- `generateDueTasks()` — spawns daily tasks from active templates, with deduplication via `recurringId`
- Edit and delete templates

**Eisenhower Matrix view:**
- Toggle between List view and Matrix view
- 2×2 grid: Do First (urgent+important) / Schedule (not urgent+important) / Delegate (urgent+not important) / Eliminate (not urgent+not important)

**Calendar tab:**
- Month calendar grid with day-of-week headers
- Navigate months (prev/next)
- Task count indicators on calendar days
- Click day to filter tasks

**Appointments tab:**
- Add appointments with title, notes, date, start/end time, location, meeting link
- Mark as important (star)
- Reminder field (value stored but no notification trigger yet)
- Display upcoming appointments in chronological order

**Kanban tab:**
- Three columns: To Do / In Progress / Done
- Drag (or move button) tasks between columns
- Add tasks to any column

**Projects tab:**
- Create projects with name, color (8 options), emoji (12 options), status (active/done)
- Per-project sub-tasks (Kanban: todo/doing/done)
- Per-project notes (free-text textarea)
- Per-project file attachments (stored as metadata in state)
- Project completion status toggle

### 2.3 Finance Page (`/finance`)

- **Month selector** — horizontal scrollable pill tabs, auto-scrolls to current month
- **Transaction list** — shows income and expense transactions for selected month
- **Add transaction** — type (income/expense), amount, category, date
- **Delete transaction**
- **Category emoji map** — visual icons per category (Rent 🏠, Groceries 🛒, etc.)
- **Donut chart** — SVG pie chart of expense breakdown by category (5 colors)
- **Budget bars** — per-category budget targets with spend vs budget bar
- **Set budget** — enter budget amount per expense category
- **Income vs expense summary bar** — animated split bar showing income % vs expense %
- **Month totals** — total income, total expenses, net for selected month
- **Income sources** — configurable list (default: Lumileds, Hexenhof, Tips, Other)
- **Expense categories** — configurable list with rename + delete (migrates existing transactions)
- **Seed transactions** — pre-loaded sample data from `src/lib/seedData.js`
- **Currency selection** — €, $, £, ₹ (persisted, shown throughout)

### 2.4 Her Page (`/her`)

- **Floating hearts animation** — ambient floating emoji hearts in page header
- **4 tabs:** Movies, Gifts, Dates, Date Ideas

**Movies tab:**
- Add movie with title, genre, year, rating (1–5 stars), notes
- Toggle watched/unwatched
- Delete movie
- Poster placeholder gradient generated from title hash
- Genre emoji map (romance, comedy, horror, sci-fi, action, drama, documentary, anime)
- Star rating component (read/write)

**Gifts tab:**
- Add gift with name, price, occasion, notes
- Toggle bought/not bought
- Delete gift

**Dates tab:**
- Add date entry with date, title, location, notes
- View past dates in list
- Delete date entry

**Date Ideas tab:**
- Add freeform date idea text
- Toggle done/pending
- Edit idea text
- Delete idea

### 2.5 Settings Page (`/settings`)

- **Theme picker** — 4 themes: aurora (light), glass (dark frosted), paper (warm earthy), neon (electric)
- **Dark mode toggle** — applied to glass and neon themes only
- **Profile name** — editable user name field
- **Currency selector** — 4 currencies with color-coded pills
- **Income sources** — add, rename, delete (EditableItem component)
- **Expense categories** — add, rename, delete (with budget key migration)
- **Export to CSV** — separate exports for tasks, habits, finance transactions
- **Export full JSON backup** — complete store snapshot
- **Import JSON backup** — file picker, deduplicates by ID on import
- **Danger zone** — (implied by Trash2 icon import, likely clear data)

---

## 3. 🔍 UX Gap Analysis

### 3.1 Home Page

**What looks great:**
- Time-aware greeting is warm and personal
- Streak cards with gradient backgrounds feel premium
- Animated number counters create a satisfying "alive" feeling
- XP bar is immediately legible

**What's missing visually:**
- No weather widget — the page feels static and disconnected from the real world
- No "today's summary" — how many tasks are due today? Any appointments? User has to navigate away to find out
- Mood history graph is not surfaced — user logs mood daily but never sees a trend
- The efficiency panel needs a clearer visual hierarchy; bare numbers lack context labels
- No "upcoming appointment" preview card on the dashboard

**Interactions that are awkward or missing:**
- No quick-add task from Home — user must navigate to Tasks page
- No quick-tap habit logger from Home — streaks are shown but can't be acted on
- Tapping a streak card does nothing — should deep-link to the relevant habit on Tasks page
- No contextual prompt after XP level-up on Home

**Mobile-specific issues:**
- The 7-day calendar strip may clip on very narrow viewports (320px)
- No pull-to-refresh gesture for regenerating recurring tasks
- Finance snapshot bar labels may be too small on small screens

### 3.2 Tasks Page

**What looks great:**
- Priority color system (red/amber/blue) is immediately scannable
- Pomodoro launcher on each card is cleverly placed
- Habit analytics 14-day grid is genuinely useful data
- Matrix view is a power-user feature done right

**What's missing visually:**
- No visual badge/indicator when a recurring task was auto-generated (vs manually added)
- Completed tasks have no satisfying animation — they just toggle; no checkmark burst
- Appointments tab reminder field stores a value but never fires a browser notification
- No "empty state" celebration when all tasks for the day are done
- Habit streaks on the analytics screen don't show the streak number prominently

**Interactions that are awkward or missing:**
- Kanban drag-and-drop may not work on mobile touch (depends on implementation — not verified as touch-enabled)
- No swipe-to-complete on task cards (mobile convention)
- Matrix view has no way to assign tasks to quadrants — it reads priority/urgency from existing fields, but user can't manually place tasks
- `generateDueTasks()` must be called manually — no auto-trigger on app load
- No "snooze" or defer task to tomorrow option
- Projects file attachments store metadata but have no actual file upload mechanism — files aren't stored anywhere

### 3.3 Finance Page

**What looks great:**
- Month selector auto-scrolls to current month — excellent UX detail
- Donut chart is clean and colorful
- Budget bars give instant spend context

**What's missing visually:**
- No running monthly balance or savings rate displayed
- No income trend chart (month-over-month)
- No "over budget" visual warning when a category exceeds its budget
- Donut chart has no legend — colors aren't labeled
- No recurring expense concept — user manually re-enters rent every month

**Interactions that are awkward or missing:**
- No edit transaction — only add/delete; fixing a typo requires delete + re-add
- No bill reminder system — rent is due every month but there's no alert
- No net worth tracker (assets vs liabilities)
- Budget amounts must be re-entered each month (not persisted per-month)
- No transfer category (moving money between accounts)

### 3.4 Her Page

**What looks great:**
- Floating hearts animation is charming and sets the emotional tone
- Poster gradient from title hash is a smart fallback for no-image state
- Star rating component is clean and touch-friendly
- Genre emoji adds personality without clutter

**What's missing visually:**
- No anniversary or important date countdown anywhere
- Gift list has no budget total — can't see "I've spent €X on gifts this year"
- Movie watchlist has no sort (by rating, date added, watched status)
- No "random date idea" button — the list exists but discovery is manual

**Interactions that are awkward or missing:**
- No sharing mechanism — can't share the movie list or gift list
- No notification for upcoming date anniversaries
- Date tab shows past dates only — no future date planning/scheduling
- No connection to calendar/appointments — a planned date in Her isn't reflected in Tasks calendar

### 3.5 Settings Page

**What looks great:**
- Theme picker is functional and the 4-theme system is comprehensive
- Income source / expense category management with rename is a rare and useful feature
- Export/Import is fully implemented (rare for personal apps)

**What's missing visually:**
- No preview of the selected theme before applying
- No data usage indicator (how much localStorage is used)
- No app version or "last backup" timestamp displayed

**Interactions that are awkward or missing:**
- No cloud sync option — data lives only on current device
- No PIN lock or biometric lock setting
- Import JSON shows no preview before applying — could accidentally overwrite good data
- No "reset to defaults" option separate from full data clear
- Danger zone action (if present) has no confirmation step shown in UI

---

## 4. 🚀 Feature Opportunities (Prioritized)

### ⚡ Quick Wins (Low Effort, High Impact — < 4 hours each)

1. **Confetti on task complete** — Fire a CSS confetti burst when a task is toggled done. Use a pure-CSS or canvas approach (no new dependencies). Instant dopamine, very achievable.

2. **"+30 XP" floating text on task complete** — A `<motion.div>` that animates y: 0 → -60, opacity: 1 → 0 over 1s, positioned above the completed task. Already have Framer Motion.

3. **All-tasks-done celebration on Home** — When `todayTasks.every(t => t.done)`, show a "🎉 All done for today!" banner with confetti. Zero dependencies, high emotional payoff.

4. **Auto-generate recurring tasks on app load** — Call `generateDueTasks()` in a `useEffect` in `App.jsx` when the app mounts. Currently this is manual/unconnected.

5. **Upcoming appointment preview on Home** — Show the next 1–2 appointments as a card on the Home dashboard. Data already exists in store.

6. **Swipe-to-delete on task cards (mobile)** — Use Framer Motion `drag="x"` with a threshold to reveal a delete action. No new library needed.

7. **Mood history sparkline** — A 7-day row of colored dots (green/yellow/red by mood value) on Home, below the mood check-in. Pure JSX, no library needed.

8. **"Consider adjusting" auto-suggestion** — Already exists in HabitAnalytics for <30% habits, but surface it on Home page too as a gentle nudge card.

9. **Over-budget warning on Finance** — Add a red badge/icon when `spent > budget` for a category. Data is already computed, just needs a conditional style.

10. **Random date idea button** on Her page — A shuffle button that picks a random undone idea from `dateIdeas` and displays it highlighted.

### 🔧 Medium Features (1–2 days each)

1. **Focus Mode** — A fullscreen overlay that hides the BottomNav and shows only today's tasks + active Pomodoro. A floating "Exit Focus" button returns to normal. Route: `/focus` or a modal overlay.

2. **Daily journal / notes section** — A per-day free-text textarea (stored as `{ date: 'YYYY-MM-DD', content: string }[]` in the store). Accessible from Home. Very high personal value, low complexity.

3. **Finance bill reminders** — A recurring expense template system (similar to recurring tasks) that shows a "due soon" banner on Home and Finance. Store: `{ id, name, amount, dayOfMonth, category }[]`.

4. **Weather widget on Home** — Use the Open-Meteo API (no API key required) to show current temperature + condition icon on the Home header. One fetch call, cached for 30 minutes in state.

5. **Edit transaction** — Add an edit modal to Finance transactions (same fields as add). Just needs an `updateTransaction` action in the store and a pencil icon on each row.

6. **Appointment → Browser notification** — When an appointment has a reminder set, register a `setTimeout` that fires `new Notification(title)` at the reminder time. Requires one-time `Notification.requestPermission()`.

7. **Habit XP level achievements** — Trigger `unlockAchievement()` at streak milestones (7-day, 30-day, 100-day). Logic goes in `logHabit()` in store.js. Achievement definitions are already supported.

8. **Finance monthly savings rate** — Show `(income - expenses) / income * 100` as a percentage with a trend arrow vs last month. Pure calculation, no new data needed.

9. **Her — anniversary countdown** — Pull the earliest date from `dates[]` and show a "💞 X days until anniversary" card (or "Y-year anniversary was Z days ago"). date-fns already imported.

10. **Task snooze/defer** — A "defer to tomorrow" button on task cards that sets `date` to tomorrow's date string. One-liner logic, high daily usability.

### 🏗️ Big Features (3+ days each)

1. **Google Drive backup sync** — OAuth2 PKCE flow (no server needed) + Google Drive API to save/load the full JSON backup to a file in the user's Drive. Free, no backend. Complex auth flow.

2. **Partner sharing (Her page)** — Share a read-only link or shared JSON token so a partner can view/contribute to the movies/gifts/date-ideas lists. Requires a free backend (JSONBin.io or similar).

3. **Finance net worth tracker** — A new Finance tab: Assets (savings, investments, property value) minus Liabilities (loans, credit card). Manual entry, line chart over time.

4. **Fitness log** — A new sub-section under Tasks or a new page: log workouts (type, duration, sets/reps), track personal records, show weekly volume chart. Needs new store slice.

5. **Sleep tracker** — Log bedtime and wake time daily. Show average sleep duration, sleep debt, and correlation with mood score. New store slice, moderate UI work.

6. **AI-powered smart insights** — Weekly summary card: "You completed 73% of tasks this week. Your best day was Tuesday. Habit 'Exercise' is at risk." Generated from existing efficiency data. Can use a local template engine without any API.

7. **Google Sheets API sync** — Read/write the store data to a Google Sheet via the Sheets API. Free tier is generous. More complex than Drive backup but enables spreadsheet-style analysis.

8. **Seasonal themes** — A 5th theme that rotates with real-world seasons or unlocks at level milestones. Requires theme CSS additions and a level-check on app load.

---

## 5. 🎮 Gamification Deepening

The current system has XP, 10 levels, and achievements with toast notifications. Here is what to build next:

### 5.1 Streak Shields 🛡️

**Concept:** A consumable item earned at streak milestones (7-day, 30-day). Using a shield allows missing one day without breaking the streak.
**Store additions:** `streakShields: { [habitId]: number }`, `useStreakShield(habitId)`
**UI:** Small shield icon next to streak count; tap to activate when streak is at risk.
**Earn trigger:** `unlockAchievement('shield_7day')` at 7-day streak → grants 1 shield.

### 5.2 Daily Challenge System 🎯

**Concept:** Every day, one bonus task is auto-generated: e.g., "Complete 5 tasks today", "Log all habits before 6pm", "Finish a high-priority task". Completing it gives 2× XP.
**Store additions:** `dailyChallenge: { date, description, type, target, completed }`
**Generation:** Deterministic based on `date + user name` hash so it's consistent per day.
**UI:** A highlighted card at the top of Tasks with a gold border and ⚡ icon.

### 5.3 Boss Battles ⚔️ (Weekly Productivity Challenge)

**Concept:** Each Monday a "Boss" appears on Home. The boss has HP = 100. Each completed task deals damage (high priority = 30, med = 20, low = 10). Defeating the boss by Sunday gives a major XP reward and unlocks a cosmetic badge.
**Store additions:** `boss: { week: 'YYYY-Www', hp: 100, defeated: bool, reward }`
**UI:** A dramatic boss card on Home with an HP bar, boss emoji, and shake animation on hit.

### 5.4 Seasonal Themes 🌸

**Concept:** Theme unlocks at level milestones or real-world calendar dates.
- Level 3 → unlock "Sakura" (pink cherry blossom light theme)
- Level 5 → unlock "Midnight" (deep navy + gold)
- Level 8 → unlock "Ember" (warm orange-red dark theme)
- Real-world: December → automatic "Winter" variant of current theme

### 5.5 Personal Leaderboard (This Week vs Last Week) 📊

**Concept:** A weekly performance card comparing:
- Tasks completed: this week vs last week (↑↓ arrow)
- Habit completion rate: this week vs last week
- XP earned: this week vs last week
- Mood average: this week vs last week

**UI:** A "Weekly Report" card on Home or Settings, surfaced every Monday.
**Data:** Computable from existing `dailyTasks`, `habitLogs`, `moodLog` in store.

### 5.6 Achievement Definitions (Currently Missing)

The `unlockAchievement()` function exists but there are no defined achievement IDs. Add a canonical list:

| ID | Name | Trigger | Emoji |
|----|------|---------|-------|
| `first_task` | First Step | Complete first task | 🎯 |
| `streak_7` | Week Warrior | 7-day task streak | 🔥 |
| `streak_30` | Month Master | 30-day task streak | 💪 |
| `level_5` | Halfway There | Reach level 5 | ⭐ |
| `level_10` | Life Master | Reach level 10 | 👑 |
| `habit_30` | Habit Hero | Any habit 30-day streak | 🏅 |
| `finance_budget` | Budget Boss | Set budgets for 5 categories | 💰 |
| `all_done` | Perfect Day | All tasks done in one day | 🌟 |
| `pomodoro_10` | Focus Force | Complete 10 Pomodoro sessions | 🍅 |
| `matrix_use` | Eisenhower Fan | Use matrix view 3 times | 🧠 |

---

## 6. ✨ UI/Animation Opportunities

### 6.1 "+XP" Floating Text on Task Complete

On `toggleDailyTask` when `wasNotDone`, render a `<motion.div>` absolutely positioned over the task card:
```
initial: { opacity: 1, y: 0 }
animate: { opacity: 0, y: -60 }
transition: { duration: 0.9, ease: 'easeOut' }
```
Content: `"+30 XP"` in gold color. Self-removes via `onAnimationComplete`.

### 6.2 Checkmark Burst on Task Complete

When a task is toggled done, show 6–8 small colored circles that explode outward from the checkbox position using `staggerChildren` + radial offset transforms. Pure Framer Motion, no canvas needed.

### 6.3 Habit Target Explosion 💥

When `count >= target` for a habit, trigger a burst animation: the habit emoji scales up to 2×, bounces, and emits 4 sparkle SVG paths in cardinal directions. Use the existing `LottieIcons.jsx` sparkle as the spark element.

### 6.4 Level-Up Full-Screen Celebration 🎊

On `level` increment detected in a `useEffect`, show a full-screen overlay:
- Background: radial gradient pulse (current theme's accent color)
- "LEVEL UP!" text with `scale: 0 → 1.2 → 1` spring
- Particle field: 30 small divs with random x/y/rotation, fade in then scatter
- Auto-dismisses after 3 seconds
- Plays a subtle CSS animation sound effect (optional, Web Audio API one-liner)

### 6.5 Weather-Responsive Home Background

After fetching weather from Open-Meteo:
- Rainy (`weathercode >= 51`): Add animated falling drop SVGs behind the header
- Sunny (`weathercode < 3`): Add radial glow / light rays behind the greeting card
- Cloudy: Soft floating cloud shapes (CSS `border-radius` blobs)
- Night: Star-field CSS animation

Implementation: A single `WeatherBackground` component positioned `absolute` behind the Home header content.

### 6.6 Confetti Shower on Streak Milestones

At 7, 14, 30, 60, 100 day streaks: trigger a confetti shower using `canvas-confetti` (3KB, no framework). Single import, single function call. Already has a CDN-compatible delivery path via npm.

### 6.7 Smooth Card Morphing Transitions

Use Framer Motion's `layoutId` prop to create seamless transitions:
- Task card expands into edit modal (shared `layoutId`)
- Habit card expands into analytics detail
- Finance transaction row expands into edit form

### 6.8 Pomodoro Pulse Animation

The circular SVG timer widget should pulse (subtle `scale: 1 → 1.02 → 1` on a 1s loop) while active, so the user knows it's running without looking at the numbers.

### 6.9 BottomNav Active Indicator Glow

Add a subtle glow/shadow behind the active tab's icon using the theme's accent color. Currently only a sliding pill exists. A `box-shadow: 0 0 12px var(--accent)` on the active icon completes the look.

---

## 7. 🔌 Backend/Sync Options (Free Only)

### 7.1 Open-Meteo Weather API ⭐ Recommend First

- **URL:** `https://api.open-meteo.com/v1/forecast?latitude={lat}&longitude={lon}&current_weather=true`
- **Cost:** Completely free, no API key, no registration
- **Setup complexity:** Trivially low — one `fetch()` call, cache result in `sessionStorage`
- **Location:** Use `navigator.geolocation.getCurrentPosition()` for lat/lon, or hard-code a city
- **Recommendation:** Implement immediately. Requires zero backend work.

### 7.2 Web Notifications API ⭐ Recommend Second

- **Cost:** Free — native browser API
- **Setup complexity:** Low — `Notification.requestPermission()` once, then `new Notification(title, { body, icon })`
- **Use case:** Appointment reminders, habit nudges at a set time, bill due reminders
- **Limitation:** Requires the PWA to be open (or installed as PWA for background delivery via Service Worker push — that requires a push server)
- **Recommendation:** Implement in-session notifications first (setTimeout-based), defer push for later.

### 7.3 IndexedDB via localForage ⭐ Recommend Third (for large data)

- **Cost:** Free — browser native, abstracted by `localForage` library
- **Storage limit:** 50MB+ (vs localStorage's ~5MB hard cap)
- **Setup complexity:** Low — `localForage.setItem(key, value)` mirrors localStorage API
- **Use case:** Storing project file attachments as actual binary blobs (currently impossible with localStorage)
- **Recommendation:** Swap Zustand's persist from localStorage to localForage for Phase 13 (Mobile Polish). Enables real file upload for project attachments.

### 7.4 Google Drive Backup via OAuth2 PKCE ⚠️ Moderate Effort

- **Cost:** Free — Google Drive API free tier, 15GB storage
- **Setup complexity:** Moderate-high — OAuth2 PKCE flow, Google API Console setup, Client ID registration (no credit card, but requires Google account)
- **Flow:** User clicks "Backup to Drive" → OAuth popup → token stored in sessionStorage → `PUT` to Drive Files API with JSON blob → Done
- **Recommendation:** Implement as Phase after core features stabilize. One-time auth setup is the main friction.

### 7.5 JSONBin.io ⚠️ Use With Caution

- **Cost:** Free tier — 10,000 requests/month, 100KB per bin
- **Setup complexity:** Low — just HTTP POST/GET with an API key header
- **Concern:** 100KB limit may be too small once habit logs and transactions accumulate (estimate: 50–200KB after 6 months of use)
- **Recommendation:** Good for MVP cloud backup, but plan for migration to Google Drive as data grows. Store the API key in the app's Settings page.

### 7.6 Google Sheets API ❌ Skip for Now

- **Cost:** Free
- **Setup complexity:** High — OAuth2 required, Sheets API v4, complex row mapping for nested JSON data structure
- **Problem:** LifeOS data model is deeply nested (habits, logs, projects, notes). Mapping to a flat spreadsheet requires significant serialization logic.
- **Recommendation:** Skip. Google Drive JSON backup covers the same need with far less complexity.

### 7.7 Recommended Implementation Order

1. **Open-Meteo** — immediate, zero setup
2. **Web Notifications API** — one session of work, high daily utility
3. **localForage** — swap in during Mobile Polish phase, enables file uploads
4. **JSONBin.io** — first cloud backup option, quick to wire up
5. **Google Drive OAuth** — when long-term data safety becomes critical

---

## 8. 📱 Mobile PWA Enhancements

### 8.1 Home Screen Shortcut Improvements

Current state: PWA manifest exists (`vite-plugin-pwa`). Verify these fields are set in `vite.config.js` manifest:
- `display: "standalone"` — removes browser chrome
- `start_url: "/"` — ensures app opens at Home
- `orientation: "portrait"` — locks orientation on install
- `shortcuts` array — add 3 shortcuts: "Add Task", "Log Habit", "Add Expense"

### 8.2 Splash Screen

Add `screenshots` array to manifest with at least one 1080×1920 screenshot for Android splash generation. Also add `background_color` matching the default theme's `--bg` CSS variable.

### 8.3 Share Target

Register as a share target in manifest:
```json
"share_target": {
  "action": "/tasks",
  "method": "GET",
  "params": { "title": "title", "text": "text", "url": "url" }
}
```
In `Tasks.jsx`, read `URLSearchParams` on mount and pre-fill the "Add Task" form. Allows sharing a webpage title directly into a task.

### 8.4 App Badges (Notification Count on Icon)

Use `navigator.setAppBadge(count)` where `count` = overdue tasks + incomplete habits for today. Call this in a `useEffect` watching `dailyTasks` and `habitLogs`. Supported on Chrome/Edge desktop and Android Chrome.

### 8.5 Biometric Lock (Device PIN/Fingerprint)

Use the Web Authentication API (`navigator.credentials.get()` with `userVerification: "required"`):
1. On first lock setup: register a credential with `navigator.credentials.create()`
2. On app open: call `navigator.credentials.get()` — OS presents fingerprint/PIN prompt
3. If rejected, show a PIN fallback input

Store a flag `biometricEnabled: bool` in Zustand. Only lock on cold open (not on tab switch). This is a legitimate PWA feature with no server requirement.

---

## 9. 🗺️ Prioritized Implementation Roadmap

The next 10 features in priority order, estimated for a solo Claude agent session:

| # | Feature | Why Now | Effort |
|---|---------|---------|--------|
| 1 | **Auto-generate recurring tasks on app load** | Critical gap — the feature exists but is never triggered. One `useEffect` in `App.jsx`. | S |
| 2 | **"+XP" floating text + task checkmark burst** | Highest dopamine-per-line-of-code ratio. Framer Motion already imported. | S |
| 3 | **Weather widget on Home (Open-Meteo)** | Zero-dependency external data. Makes the app feel live and contextual. | S |
| 4 | **Upcoming appointment preview on Home** | Data is in store; just needs a computed filter + card component on Home. | S |
| 5 | **All-tasks-done celebration (confetti + banner)** | Emotional payoff for the core productivity loop. | S |
| 6 | **Edit transaction on Finance** | Current delete-only UX is friction for daily finance logging. Store + UI. | M |
| 7 | **Daily journal section (per-day notes)** | High personal value for reflection. New store slice + simple textarea component. | M |
| 8 | **Appointment → browser notification** | Reminders are stored but never fire. `Notification` API + `setTimeout` wiring. | M |
| 9 | **Boss battle weekly challenge on Home** | Most dramatic gamification feature; high engagement driver. New store slice + UI. | M |
| 10 | **localForage swap + project file upload** | Unblocks real file storage for Projects. Enables future large data. | L |

---

*Document prepared by: LifeOS Business Analyst agent*
*Source files read: PROGRESS.md, ARCHITECTURE.md, Home.jsx, Tasks.jsx, Finance.jsx, Her.jsx, Settings.jsx, store.js*
