# LifeOS Architecture

> Auto-generated during Phase 0. Update this file after each phase.

## Stack

| Layer | Technology |
|-------|-----------|
| Framework | React 19 |
| Build | Vite 6 |
| Styling | Tailwind CSS v4 + CSS custom properties |
| State | Zustand v5 (persist → localStorage key `lifeos-v4`) |
| Routing | React Router v7 (BrowserRouter, 5 routes) |
| Animation | Framer Motion v12 |
| Icons | Lucide React v1 |
| Dates | date-fns v4 |
| PWA | vite-plugin-pwa v1.3 |
| Lottie | lottie-react + @lottiefiles/react-lottie-player (installed, SVG fallbacks used) |

## Folder Structure (current)

```
src/
  App.jsx                     — Root router + theme effect
  main.jsx                    — React entry point
  store.js                    — Single Zustand store (all state)
  index.css                   — Tailwind import + global utilities
  styles/
    themes.css                — 4-theme CSS variable blocks + keyframes
  lib/
    seedData.js               — Seed transactions for Finance
    themes.js                 — Legacy JS theme object (mostly unused)
  pages/
    Home.jsx                  — Dashboard (826 lines)
    Tasks.jsx                 — Tasks + Calendar + Appointments + Projects (2191 lines)
    Finance.jsx               — Transactions + Budget + Chart (750 lines)
    Her.jsx                   — Movies + Gifts + Dates + Ideas (915 lines)
    Settings.jsx              — Theme picker + Profile + Export stubs (559 lines)
  components/
    BottomNav.jsx             — Fixed tab bar (99 lines)
    Modal.jsx                 — Bottom-sheet modal (72 lines)
    UI.jsx                    — Card, Btn, Input, Select, Badge, SectionHeader, EmptyState
    Animations.jsx            — AnimatedNumber, ProgressRingAnimated, StaggerContainer, etc.
    LottieIcons.jsx           — Custom SVG animated icons (flame, check, coin, sparkle, heart, trophy)
```

## Routes

| Path | Component | Description |
|------|-----------|-------------|
| `/` | Home | Dashboard with streaks, calendar strip, stats |
| `/tasks` | Tasks | Daily tasks, Kanban, Calendar view, Appointments, Projects |
| `/finance` | Finance | Transactions, Donut chart, Budget bars |
| `/her` | Her | Movies, Gifts, Dates, Date Ideas |
| `/settings` | Settings | Theme picker, Profile, Currency, Export/Import |

## Data Model (Zustand store, persisted to `lifeos-v4`)

### Daily Tasks
```js
{ id, text, date (YYYY-MM-DD), priority ('high'|'med'|'low'),
  notes, dueTime, done (bool), createdAt }
```

### Kanban Tasks
```js
{ id, status ('todo'|'doing'|'done'), title?, priority?, dueDate?, ... }
```

### Appointments
```js
{ id, title, notes, date, startTime, endTime, location,
  meetingLink, important (bool), reminder, createdAt }
```

### Habits
```js
{ id, name, target (int — times/day), emoji, color }
```

### Habit Logs
```js
{ habitId, date (YYYY-MM-DD), count (int) }
```

### Projects
```js
{ id, status ('active'|'done'), createdAt, name?, ... }
```
+ `projectTasks`, `projectNotes`, `projectFiles`

### Finance
```js
// Transaction
{ id, date, type ('income'|'expense'), amount (number), category (string) }
// Budget
{ [category]: amount }
```

### Her
- `movies`: { id, watched, addedAt, title?, genre?, ... }
- `gifts`: { id, bought, name?, price?, ... }
- `dates`: { id, date, title?, location?, notes?, ... }
- `dateIdeas`: { id, idea, done }

### Profile
- `name`, `theme` ('aurora'|'glass'|'paper'|'neon'), `currency`, `darkMode`

## Theme System

- `data-theme` attribute on `.lf-app` root div
- 4 themes: `aurora` (light), `glass` (dark frosted), `paper` (warm earthy), `neon` (electric)
- All component colors via CSS custom properties (never Tailwind color classes)
- Dark class applied for `glass` and `neon` themes only
- Persisted in Zustand store

## What Already Exists

- ✅ 4-theme CSS variable system
- ✅ Framer Motion page transitions + card animations
- ✅ Custom animated SVG icon library (LottieIcons.jsx)
- ✅ 7-day calendar strip on Home
- ✅ Habit streak + task streak on Home
- ✅ Animated progress rings
- ✅ Finance donut chart (SVG)
- ✅ Her page with tabs + floating animations
- ✅ BottomNav with sliding pill indicator
- ✅ PWA manifest + service worker
- ✅ Export/Import stub buttons in Settings

## What Is Missing (Upgrade Plan Phases)

| Phase | Feature | Status |
|-------|---------|--------|
| 2 | Efficiency Engine (daily/weekly/monthly %) | ❌ Not started |
| 5 | Efficiency Dashboard UI | ❌ Not started |
| 6 | Habits Analytics page | ❌ Not started |
| 7 | Gamification (XP, levels, achievements) | ❌ Not started |
| 8 | Pomodoro Timer | ❌ Not started |
| 9 | Eisenhower Matrix + drag-and-drop | ❌ Not started |
| 10 | Mood / Energy Tracking | ❌ Not started |
| 11 | Recurring Task Intelligence | ❌ Not started |
| 12 | Export (CSV + PDF) | ❌ Not started |

## Risks Before Refactor

1. **Tasks.jsx is 2191 lines** — monolith, should be split before Phase 9 adds matrix view
2. **No recurring task concept in data model** — adding it needs careful store migration
3. **`src/lib/themes.js` legacy file** — still exists, import may confuse future agents; can be deleted
4. **Store version** `lifeos-v4` — any schema additions must be additive (never remove existing keys)
5. **Lottie players installed but only SVG used** — actual `.json` Lottie files would need to be sourced or self-hosted

## Recommended Phase Order

Given current state (Phases 3+4 largely complete):

1. Phase 2 — Efficiency Engine (`src/lib/efficiency.js`, `src/hooks/useEfficiency.js`)
2. Phase 7 — Gamification store additions + XP/achievement logic
3. Phase 5 — Efficiency Dashboard UI (surface in Home + Tasks)
4. Phase 8 — Pomodoro Timer (floating widget)
5. Phase 6 — Habits Analytics (expand Home habits section)
6. Phase 10 — Mood Tracking (once-per-day check-in)
7. Phase 9 — Eisenhower Matrix view in Tasks
8. Phase 12 — Export/Reports (CSV working, PDF optional)
9. Phase 13 — Mobile Polish
10. Phase 14 — QA
