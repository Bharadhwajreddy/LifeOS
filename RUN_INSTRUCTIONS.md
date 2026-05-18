# Run Instructions — LifeOS Claude Code Sessions

## On every session start

1. Read `LifeOS Master Upgrade Plan` (the full upgrade spec)
2. Read `ARCHITECTURE.md` (current codebase state)
3. Read `PROGRESS.md` if it exists (phase completion log)
4. Run `git log --oneline -10` to see recent commits
5. Run `git status` to check for uncommitted work
6. Identify the highest completed phase
7. Continue from the next incomplete phase

## Rules

1. Do not start coding before summarizing the current architecture.
2. Work in phases — complete one phase before starting the next.
3. At the end of each session, update `PROGRESS.md` with what was done.
4. If token limits interrupt, stop at a clean commit boundary.
5. Never remove existing localStorage keys — only add new ones.
6. Prefer additive store changes; version migrations must be safe.
7. Lazy-load Lottie animations; limit simultaneous instances.
8. Every new component must work on mobile (max-w-md, safe touch targets).
9. All colors via CSS variables only — no Tailwind color classes.
10. Always run `npm run build` before committing.
11. Always push to branch `claude/build-lifeos-pwa-KHlHh`.
12. Always deploy with: `npx vercel --prod --token="$VERCEL_TOKEN" --yes` (token stored in session env, never commit it)

## Agent roles (simulate even in single sessions)

- **Agent A** — Architecture & Recon (reading, planning)
- **Agent B** — Data / Efficiency / Persistence (store.js, lib/, hooks/)
- **Agent C** — UI / Themes / Motion (pages/, components/, styles/)
- **Agent D** — Features / Gamification / Pomodoro / Matrix / Export
- **Agent E** — QA / Responsiveness / Integration (build check, mobile review)

## localStorage keys in use

| Key | Purpose |
|-----|---------|
| `lifeos-v4` | Main Zustand store (all user data) |
| `lifeos_gamification` | XP, level, achievements (Phase 7) |
| `lifeos_efficiency_log` | Daily efficiency cache (Phase 2) |
| `lifeos_mood_log` | Daily mood entries (Phase 10) |
| `lifeos_pomodoro` | Pomodoro timer state (Phase 8) |

## Phase completion checklist

- [x] Phase 0 — Architecture Recon
- [x] Phase 3 — Theme System (4 themes, CSS variables)
- [x] Phase 4 — Visual Upgrade / Framer Motion / SVG Animations
- [ ] Phase 2 — Efficiency Engine
- [ ] Phase 7 — Gamification
- [ ] Phase 5 — Efficiency Dashboard UI
- [ ] Phase 8 — Pomodoro Timer
- [ ] Phase 6 — Habits Analytics
- [ ] Phase 10 — Mood Tracking
- [ ] Phase 9 — Eisenhower Matrix
- [ ] Phase 12 — Export / Reports
- [ ] Phase 13 — Mobile Polish
- [ ] Phase 14 — QA
