# GymSense

A mobile-first fitness companion with on-device AI rep counting, guided workouts, nutrition planning, and run tracking.

## Problem statement

Starting a fitness routine often means juggling workout instructions, rep tracking, meal ideas, and motivation across several apps. GymSense brings these into one approachable demo, with camera feedback that runs locally rather than uploading workout video.

## Key features

- Three-day Weight Gain and Weight Loss plans, plus editable Custom routines with persistent day unlocking.
- A searchable, typed library of 24 exercises with instructions, common mistakes, and six lightweight animated demonstrations.
- MediaPipe camera rep counting for squats, push-ups, and jumping jacks, with tempo checks, form cues, optional local speech, and per-set scores.
- Mock daily meals filtered by dietary preferences and allergies, with nutrition totals and manual protein, fiber, and water trackers.
- Outdoor GPS runs, estimated motion-based steps, manual treadmill sessions, and optional consent-based FTMS Bluetooth telemetry.
- Mock friends, weekly challenges, and 12-week contribution graphs; locally saved run history.
- Responsive dark interface, desktop sidebar, and mobile bottom navigation.

This is a hackathon prototype. Login is UI-only; there is no account service, database, payment integration, or remote AI API.

## Tech stack

Next.js App Router, React, TypeScript, Tailwind CSS 4, Lucide icons, MediaPipe Tasks Vision, browser localStorage, Geolocation, Device Motion, and Web Bluetooth. npm workspaces share a small domain-types package. ESLint, Prettier, and Node's built-in test runner provide checks.

## Architecture overview

The **repository root is both the application and deployment root**. Run all commands here, not in `src` or `packages/core`.

```text
src/app/                 Pages and the GET /api/health route
src/components/          Interactive UI and shared responsive shell
src/data/                Typed mock exercises, plans, foods, users, progress
src/lib/pose/            Landmark geometry, rep cycles, coaching and speech
src/lib/run/             GPS filtering, timer, steps and saved summaries
src/lib/bluetooth/       FTMS connection and treadmill packet parsing
src/lib/                 Diet, social and workout progression logic
packages/core/           Shared domain types (npm workspace)
public/animations/       SVG demos and reduced-motion posters
public/mediapipe/        Committed pose model and generated WASM runtime
scripts/                 Local asset preparation and SVG generation
tests/                  Domain and mocked browser-API tests
```

Next.js renders routes; client components request device permissions only after user actions. Camera inference runs in the browser with locally served assets. Plans, diet preferences, friend memberships, and run summaries use browser storage. Profile streaks and challenge progress derive from deterministic mock users, independently of locally recorded workouts. The health route is a stateless liveness check, not a database or hardware check.

## Local setup

Prerequisites: **Node.js 24.x**, npm 10 or later, Git, and internet access for the initial dependency install. `.nvmrc` and `package.json` declare Node 24. If using nvm, run `nvm install 24` and `nvm use 24`.

```sh
git clone --branch feat/gymsense-hackathon-submission https://github.com/SANDHIYAPRIYADHARSHINI/GymSense.git
cd GymSense
npm install
npm run dev
```

Open [localhost:3000](http://localhost:3000). No environment setup, registration, or credentials are needed. On Windows PowerShell, if execution policy blocks `npm.ps1`, use `npm.cmd` instead of `npm`.

Stop the development server with Ctrl+C, then build and serve production:

```sh
npm run build
npm start
```

Open `/api/health` to verify a JSON response:

```json
{ "status": "ok" }
```

`npm install` automatically copies MediaPipe WASM from the pinned npm dependency to `public/mediapipe/wasm`. The pose model is already committed; no model download or API key is needed at runtime. If your package manager disables lifecycle scripts, run `npm run prepare:pose` before starting or building. Keep the lockfile; `npm ci` is also available for reproducible installs.

### Quality checks

```sh
npm run typecheck
npm run lint
npm test
npm run format:check
npm run build
```

`npm run format` applies formatting. Tests use synthetic landmarks, mock sensor data, and pure domain functions; they do not replace live device testing. Node may print a module-type detection warning when loading TypeScript test dependencies.

## Environment variables

**None are required.** `.env.example` documents this and deliberately contains no values or secrets. You do not need to copy it to `.env.local`.

Future private configuration belongs in ignored `.env.local` files or deployment environment settings. Never commit keys or private data. `NEXT_PUBLIC_` variables are bundled into browser code and must not contain secrets. See the [Next.js environment-variable guide](https://nextjs.org/docs/app/guides/environment-variables).

## Vercel deployment instructions

No deployment has been created automatically. To deploy this branch:

1. In Vercel, add a new project and import this GitHub repository (or your fork).
2. Deploy `feat/gymsense-hackathon-submission`. If the initial import uses the default branch, select this branch for a deployment or merge the submission branch before deploying the default branch.
3. Set **Framework Preset: Next.js** and **Root Directory: `./`** (the repository root).
4. Set **Node.js: 24.x**, **Install Command: `npm install`**, and **Build Command: `npm run build`**. Leave Output Directory at the Next.js default; do not set it to `out` or enable static export.
5. Leave environment variables empty. Keep install lifecycle scripts enabled so MediaPipe WASM is copied.
6. Deploy, then visit the HTTPS URL and `/api/health`. Check `/dashboard`, `/plan/weight-loss`, `/workout/squats`, and `/profile`. Allow camera access when prompted. Check that the model and WASM assets load successfully.
7. Ensure judges can access the deployment: review Vercel deployment protection settings or provide an authorized share link.

These settings follow [Vercel's Next.js integration](https://vercel.com/docs/frameworks/full-stack/nextjs) and [build configuration documentation](https://vercel.com/docs/builds/configure-a-build). No `vercel.json` is needed. HTTPS supports device permission APIs, but browser and device compatibility still apply. Preview and production domains each have separate localStorage.

## Demo walkthrough

### 30-second demo path

Before presenting, use desktop Chrome on localhost or HTTPS, position a camera side-on with your whole body visible, and allow extra time for first model initialization and permission prompts. The 30-second path is a short feature tour, not an entire workout.

1. **Choose a goal:** open `/dashboard` and select **Weight Loss → Start Plan**.
2. **Open Day 1:** view **Full-body circuit** on `/plan/weight-loss`; Day 1 is selected by default.
3. **Start an exercise:** open **Bodyweight squats** (`/workout/squats`) and inspect the looping demo.
4. **Enable camera rep counting:** click **Start Camera Rep Counter**, allow the camera, and stand upright to establish the starting position.
5. **Complete reps:** perform two controlled squat cycles, lowering and returning upright; then select **Finish Set & Show Score**. The target is a guide, not a gate for finishing a demonstration set. Partial or rushed movement is rejected.
6. **View streak graph:** choose **Profile** in navigation to inspect the 12-week graph and a day's activity. Explain that it is sample activity, not automatically updated by the reps just performed.

If camera access is unavailable, use the animation and manual set logger; this fallback does not demonstrate live counting. On the plan page, check every exercise and select **Mark Day Complete** to unlock Day 2. Camera counts do not automatically check plan exercises.

### Explore the rest

- `/exercises`: search and combine muscle, equipment, and difficulty filters.
- `/plan/custom`: add exercises from the catalog to an empty routine.
- `/diet`: change diet/allergy preferences, generate matching meals, and log intake.
- `/run`: try Manual treadmill without hardware, start and stop a short session, then see it in `/profile` under Completed run history. Outdoor GPS and Bluetooth are optional.
- `/friends`: search a username, add a friend, inspect their own graph, and join a sample weekly challenge.
- `/login`: inspect the sign-in UI; no credentials are submitted or stored.

For a fresh demo, clear this site's browser storage. That removes local plans, preferences, friends, and saved runs on that origin. Detailed implementation notes are in [docs/FEATURES.md](docs/FEATURES.md).

## Known limitations

- Workout and nutrition recommendations are mock content, not personalized AI outputs. Only pose estimation uses an ML model. General guidance only. Consult a qualified professional for medical or clinical nutrition advice.
- Local data is not backed up or synced. Clearing browser storage removes it. Manual exercise sets and camera set scores last for the current page visit.
- Social activity ends at the fixed sample date **5 November 2026**. Real workout/run completion does not update mock streaks or challenge totals.
- Live counters support only squats, push-ups, and jumping jacks. Camera placement, lighting, visibility, and movement range affect accuracy; form scores approximate landmark alignment. Other exercises use demos/manual logging.
- Camera, GPS, motion, and Bluetooth require compatible browsers and a secure context (HTTPS or localhost). A phone opening a computer's plain HTTP LAN address does not get the localhost exception. Test mobile devices over HTTPS.
- Tracking pauses when the page is hidden. There is no background GPS, route map, native health integration, or persistent step service. Motion steps are estimates; manual corrections and distance-based estimates are available.
- Web Bluetooth is not universally available. Only FTMS-advertising treadmills are offered; devices expose different fields. GymSense reads telemetry and never controls the treadmill belt. Use manual mode when unsupported.
- Automated checks do not establish physical webcam accuracy, mobile sensor behavior, real treadmill compatibility, or all browser interactions. A live hardware demo and deployed smoke test remain necessary.
- `npm audit` may report development-tool advisories; review the current report before a production release. Do not apply breaking dependency upgrades without validation.

## Roadmap

- Connect completed workouts and runs to a unified local activity/streak model.
- Calibrate and validate more exercise detectors across devices and movement ranges.
- Add browser end-to-end accessibility tests and a physical-device test matrix.
- Improve optional offline support and user-controlled data export/import.
- Evaluate opt-in accounts, secure sync, and personalized planning after the prototype, with explicit privacy controls.

## Privacy and submission notes

No API keys, database credentials, real user profiles, camera recordings, or GPS coordinates are committed or required. Video and pose processing stay on-device; run storage contains summaries rather than coordinates. Names and social activity are mock fixtures. `.env*` files are ignored except `.env.example`. The sole API route, `/api/health`, returns only the static status object.
