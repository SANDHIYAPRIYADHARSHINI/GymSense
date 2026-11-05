# GymSense

A mobile-first fitness app built for a hackathon with Next.js App Router, TypeScript, Tailwind CSS 4, and Lucide icons. All content is mock data. No backend, database, authentication, payments, or deployment service is connected.

## Run locally

Requires Node.js 20.9+ and npm 10+.

```sh
npm install
npm run dev
```

Open http://localhost:3000. In Windows PowerShell environments that block npm.ps1, use `npm.cmd` in place of `npm`.

## Checks

```sh
npm run typecheck
npm run lint
npm run build
npm run format:check
```

`npm start` serves a production build. `npm run format` formats source and configuration.

## Workspace structure

- `src/app`: landing, login, dashboard, goal plans, exercise details, nutrition, running, friends, profile, and not-found routes.
- `src/components`: responsive shell, landing sections, and interactive demo features.
- `src/data`: sample goals, exercises, and meals.
- `src/lib`: shared utilities.
- `packages/core`: workspace package for shared domain types; ready for additional apps or packages.
- `public/animations`: reserved for future local exercise animations.

## Demo walkthrough

1. Select a goal on Home or Plans, switch between Day 1�3, and mark a session complete.
2. Open an exercise. Enable the optional camera preview and log repetitions with the + button. Camera video stays local and tracks stop when leaving the page. Automatic pose detection is not implemented.
3. Open Nutrition from the desktop sidebar or Home�s nutrition card; filter sample meals by preference.
4. Open Run, choose a simulated outdoor run or treadmill, set speed, and start/pause/reset. Distance integrates the selected speed; no GPS or device connection is used. The timer is intended for an active browser tab.
5. Join the demo friends challenge or inspect the sample profile activity graph.
6. Visit `/login` to preview the sign-in form or continue directly into the demo. Credentials are never sent or stored.

Local interaction state resets when its page unmounts. Profile statistics and challenge steps are illustrative and are not synchronized with workouts. Plans and nutrition values are sample content, not personalized AI outputs.

## Routes

`/`, `/login`, `/dashboard`, `/plan/build-muscle`, `/plan/lose-weight`, `/plan/stay-fit`, `/workout/squats`, `/workout/push-ups`, `/workout/lunges`, `/workout/plank`, `/diet`, `/run`, `/friends`, `/profile`.

Unknown goal or exercise identifiers return the app�s not-found page.
