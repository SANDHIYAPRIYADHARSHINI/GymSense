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
npm test
```

`npm start` serves a production build. `npm run format` formats source and configuration.

The test runner requires Node.js 22.18+ (native TypeScript stripping). Tests cover day locks, exercise completion gating, saved progress round-trips, custom routine editing, invalid stored data, catalog metadata, plan exercise references, and combined search filters.

## Workspace structure

- `src/app`: landing, login, dashboard, goal plans, exercise details, nutrition, running, friends, profile, and not-found routes.
- `src/components`: responsive shell, landing sections, and interactive demo features.
- `src/data`: sample goals, exercises, and meals.
- `src/lib`: shared utilities.
- `packages/core`: workspace package for shared domain types; ready for additional apps or packages.
- `public/animations`: generic animated SVG placeholder, ready for exercise-specific assets.

## Demo walkthrough

1. Select a goal on Home or Plans. Complete every exercise on Day 1, mark the day complete, and continue to the next unlocked day. Custom plans start empty; add exercises before training.
2. Open an exercise. Enable the optional camera preview and log repetitions with the + button. Camera video stays local and tracks stop when leaving the page. Automatic pose detection is not implemented.
3. Open Nutrition from the desktop sidebar or Home�s nutrition card; filter sample meals by preference.
4. Open Run, choose a simulated outdoor run or treadmill, set speed, and start/pause/reset. Distance integrates the selected speed; no GPS or device connection is used. The timer is intended for an active browser tab.
5. Join the demo friends challenge or inspect the sample profile activity graph.
6. Visit `/login` to preview the sign-in form or continue directly into the demo. Credentials are never sent or stored.

Workout plans save checked exercises, completed days, and custom routines in localStorage on this browser. Other local interaction state resets when its page unmounts. Profile statistics and challenge steps are illustrative and are not synchronized with workouts. Plans and nutrition values are sample content, not personalized AI outputs.

## Workout plans

- `/plan/weight-gain`: Push, Pull, then Legs and core.
- `/plan/weight-loss`: Full-body circuit, Cardio and core, then Lower body and conditioning.
- `/plan/custom`: three initially empty routines. Add library exercises with sets, repetitions or seconds, and rest time. Remove exercises before completing the day.

Check each exercise on the plan page, then select **Mark Day Complete**. Day 2 unlocks after Day 1, and Day 3 unlocks after Day 2. Empty days cannot be completed. Completed routines are read-only. Refreshing restores the first incomplete day and keeps earlier days checked. Old goal URLs map to these plans and share their saved progress. All library exercises link to an exercise detail and camera preview page. Completion is manually logged on the plan page; camera repetitions do not automatically complete an exercise.

If browser storage is blocked or full, a visible message explains that progress cannot persist. Data stays local to this browser and is not synced to an account.

## Routes

### Exercise catalog

Open `/exercises` from the dashboard or desktop sidebar. Search by exercise name, muscle, or equipment, then combine muscle group, equipment, and difficulty filters. Clear filters restores all 24 exercises. Empty results include a reset action.

`src/data/exercises.ts` is the canonical typed catalog used by details and the Custom editor. Existing plan exercise IDs are preserved. Every record includes instructions, common mistakes, pose landmarks, a joint angle definition, prototype counting rules, and an existing animation path. Landmark names and indices follow the [official MediaPipe Pose Landmarker reference](https://ai.google.dev/edge/mediapipe/solutions/vision/pose_landmarker). Angle ranges are mock configuration requiring exercise-specific calibration; they do not run automatic counting.

Each `/workout/[exerciseId]` detail includes the animation placeholder, camera preview, and a manual logger. Enter repetitions or seconds, select **Log set**, and remove individual sets if needed. Set totals last for the current page visit. Camera access is optional, local, and stops on navigation; automatic counting and recording are not implemented.

`/`, `/login`, `/dashboard`, `/plan/build-muscle`, `/plan/lose-weight`, `/plan/stay-fit`, `/workout/squats`, `/workout/push-ups`, `/workout/lunges`, `/workout/plank`, `/diet`, `/run`, `/friends`, `/profile`.

Unknown goal or exercise identifiers return the app�s not-found page.
