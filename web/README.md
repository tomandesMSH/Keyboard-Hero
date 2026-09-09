# Keyboard Hero — web app

React + TypeScript + Vite + Tailwind (v4) + Supabase. Built from the product spec described in
`HUDEBN~1.docx` — see the repo's plan history for why this stack was chosen over the spec's
React Native + Expo recommendation. This is now the only app in the repo (the original vanilla
prototype it was ported from has been removed).

## Setup

```bash
npm install
cp .env.example .env.local   # fill in your Supabase project URL + anon key
```

## Scripts

```bash
npm run dev       # start the dev server
npm run build     # type-check (tsc -b) + production build
npm test          # run the Vitest suite
npm run preview   # preview the production build locally
```

## Structure

```
src/
├── design/tokens/     # colors, typography, spacing — "Alternativní paleta 4" theme
├── components/
│   ├── ui/             # Button, Card, Input, Avatar, Badge, Progress, Modal, Toast
│   ├── audio/           # AudioPlayer, RecordingUI, Waveform (placeholder shells)
│   └── gamification/    # Streak, XPDisplay, Confetti, LevelProgress
├── screens/
│   ├── student/          # Dashboard, Lessons, Recording, Profile
│   └── teacher/          # Dashboard, Students, LessonLibrary, Grading
├── lib/
│   ├── supabase.ts       # Supabase client (env-driven)
│   └── game-logic.ts     # gamification logic (levels, badges, streaks), with tests in game-logic.test.ts
```

Routing is handled by `react-router-dom` (see `src/router.tsx`). Screens are currently placeholders —
no auth, data fetching, or the spec's GDPR/pairing/moderation flows yet; that's the next phase.
