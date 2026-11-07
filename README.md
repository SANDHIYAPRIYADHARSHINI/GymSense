# GymSense

A mobile-first fitness companion with on-device AI rep counting, guided workouts, nutrition planning, and Firebase account sync.

## Problem statement

GymSense brings workout instructions, rep counting, food preferences, runs, and fitness motivation together. Camera inference stays on your device, while account data and completed activity sync across browsers.

## Key features

- Firebase email/password sign-up, login, password reset, logout, and protected application screens.
- Three-day Weight Gain and Weight Loss plans, plus editable Custom routines with persistent day unlocking.
- A typed library of 24 exercises, 24 animated demos, and camera counting for 10 exercises, including biceps curls, hammer curls, squats, push-ups, and jumping jacks.
- Tempo/form cues, optional local speech, per-set scores, and saved exercise logs.
- Dietary preferences and daily intake stored privately in Firestore; sample meals honor diet/allergy filters.
- GPS runs, estimated steps, manual treadmill sessions, optional FTMS Bluetooth telemetry, and synced run history.
- Real user profiles, username search, consent-based friend requests, weekly challenges, and activity/streak graphs; a fully local demo workspace is also available.

## Tech stack and architecture

Next.js App Router, React, TypeScript, Tailwind CSS 4, Lucide, Firebase Web SDK (Authentication and Cloud Firestore), and MediaPipe Tasks Vision. npm workspaces share domain types. ESLint, Prettier, Node tests, and Firebase emulator tests provide checks.

The repository root is the application and deployment root. No Admin SDK or server credentials are required. Static exercise/plan templates and meal recipes remain bundled sample content; personal records come from Firestore.

```text
src/app/                  Routes and GET /api/health
src/components/           UI, AuthProvider/useAuth, protected route gate
src/data/                 Exercise catalog, plan templates, meal fixtures
src/lib/firebase.ts       Lazy browser Firebase initialization and errors
src/lib/firestore/        Typed users, plans/progress, logs, diet, runs, friends, streaks
src/lib/pose/             On-device landmark detection, reps and coaching
src/lib/run/              GPS, timer and step algorithms
src/lib/bluetooth/        FTMS read-only telemetry
packages/core/            Shared domain types
public/animations/        SVG demonstrations and static posters
public/mediapipe/          Pose model and generated WASM runtime
firestore.rules           Default-deny access rules with field validation
firebase.json             Rule/index deployment and local emulator configuration
tests/firebase/           Actual SDK integration and cross-user rules tests
```

Auth state is observed before protected children render. Unauthenticated visits redirect to `/login`; signed-in users with a complete profile leave `/login` for `/dashboard`. An interrupted sign-up resumes profile setup after the next login. Client route gating is for navigation; Firestore rules enforce data authorization even when someone bypasses the UI. `/api/health` is a public, stateless liveness endpoint returning `{ "status": "ok" }`.

## Local setup

### Try the demo without Firebase

Use Node.js 24.x and npm 10+. From the repository root:

```sh
npm install
npm run dev
```

Open http://localhost:3000/dashboard. With no Firebase configuration, GymSense automatically opens **Demo mode**. Every application route works, including plans, exercises, diet, runs, friends, and profile. No API keys, account, or Firebase console setup is needed for this mode.

The demo uses Alex Johnson and synthetic activity, with Maya as an accepted friend and an incoming request from Jordan. Dates follow the current UTC day. Sample edits persist in sessionStorage for this tab across refreshes. **Reset demo** restores the sample workspace; **Firebase login** exits to real-account setup. With Firebase configured, the login/error screen also offers **Continue in demo mode**. A configured account failure never silently changes to demo mode.

Demo records are isolated from Firebase and are never uploaded, imported into a real account, or used to authenticate against Firestore. Closing the tab ends its normal demo session (browser session restoration can restore sessionStorage). If storage is blocked, the demo remains usable in memory and shows that refresh will reset it.

### Connect a real Firebase account

Use **Node.js 24.x**, npm 10+, Git, and a Firebase project. From the repository root:

```sh
npm install
```

1. In the [Firebase console](https://console.firebase.google.com/), register a Web app in your project.
2. Enable **Authentication → Sign-in method → Email/Password**. Configure your password policy and reset-email template. Add `localhost` and your deployed hostname under Authentication's authorized domains as needed.
3. Create a **Cloud Firestore Standard database in Native mode**, using the default database. Start with production rules; replace them with this repository's rules before using the app.
4. Copy `.env.example` to `.env.local` and fill the six values from the Web app's Firebase configuration. Do not commit `.env.local`.
5. Deploy the checked-in rules and indexes to your own project:

```sh
npx firebase login
npx firebase deploy --only firestore:rules,firestore:indexes --project YOUR_PROJECT_ID
npm run dev
```

Open [localhost:3000](http://localhost:3000), visit `/login`, and create an account. Sign-up requires a unique 3–24 character username (letters, numbers, underscores), a display name, email, password, and goal. Usernames normalize to lowercase and are immutable in this version. Your name, username, and goal are searchable by signed-in members. Your email is private.

On Windows, use `Copy-Item .env.example .env.local`. On macOS/Linux use `cp .env.example .env.local`. If PowerShell blocks `npm.ps1`, use `npm.cmd` and `npx.cmd`.

No real Firebase configuration is shipped. Without it, application routes open the clearly labeled local demo automatically. Restart the development server after changing environment variables.

`npm install` copies the pinned MediaPipe WASM runtime into `public/mediapipe/wasm`; the pose model is committed. If install lifecycle scripts are disabled, run `npm run prepare:pose` before starting/building. `npm ci` uses the lockfile for reproducible installs.

## Environment variables

Set all of these in ignored `.env.local` for local use and in your deployment platform for hosted use:

```dotenv
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
```

These are Web app identifiers bundled into the client, not administrative credentials. Do not put service-account JSON, private keys, or other secrets in any `NEXT_PUBLIC_` variable. Access control comes from Authentication and deployed Firestore rules, not hiding the Web configuration. See [Firebase Web setup](https://firebase.google.com/docs/web/setup) and [Next.js environment variables](https://nextjs.org/docs/app/guides/environment-variables).

## Firestore data model and security

- `users/{uid}`: private profile, email, goal, fitness level, timestamps. Only the owner can read/update it.
- `usernames/{username}`: immutable `{ uid }` reservation. Created atomically with the profile, so concurrent users cannot claim the same name.
- `publicProfiles/{uid}`: only UID, username, display name, photo URL (currently null), and goal. Authenticated searches are limited to 20 results. Email and activity are excluded.
- `workoutProgress/{uid}`: current goal, completed day IDs, exercise completion summary, per-goal progress/custom routines, dated activity, streaks, totals, timestamp.
- `workoutPlans/{uid}/plans/{goal}`: saved three-day routine snapshot, including Custom prescriptions.
- `exerciseLogs/{id}`: owner, exercise, goal/day context, sets, reps, duration, nullable form score, server completion timestamp. Immutable except owner deletion.
- `dietPreferences/{uid}` and `users/{uid}/intake/{date}`: private dietary preferences and daily nutrition/water trackers.
- `runs/{id}`: owner, type, distance in km, active seconds, seconds/km pace, steps, source, start/end timestamps. No GPS coordinates.
- `friendRequests/{senderUid}_{recipientUid}`: participants, pending/accepted/rejected status, timestamps. Only the recipient can accept or decline. Accepted requests are the canonical friendship records; either party can remove them.
- `friendActivity/{uid}`: aggregate dated activity, readable only by its owner and accepted friends. Removal immediately revokes server access; previously viewed data cannot be recalled from someone's memory or screenshots.

Firestore cannot hide selected fields inside a readable document, so public profiles are separate from private records. All unlisted paths/operations are denied. Queries for runs, logs, and requests constrain owner/participants because rules are not filters. See [Firebase field-access guidance](https://firebase.google.com/docs/firestore/security/rules-fields).

Workout mutations use transactions against the latest state. Repeated day completion does not add extra workouts. Exercise logs and runs use stable IDs so a retry does not double-count activity. Dates for streaks/challenges use UTC; daily intake uses the browser's local calendar date. Reps come from logged sets; active minutes come from logged durations and runs, not estimated workout prescriptions. Scores and progress are self-reported client data, not tamper-proof competition results.

## Migration and offline behavior

Application screens no longer read or write localStorage for personal records. Old demo records are **not automatically uploaded or assigned to the next person who signs in**. New accounts start empty. Existing anonymous demo data remains unused on the device; clear the site's browser storage yourself if you want it removed. The mock user fixture file supplies the explicitly labeled demo mode and legacy algorithm tests; real Firebase account screens use only Firestore data.

Firebase manages its own login persistence. Firestore uses memory caching only; this app does not enable persistent disk caching for private data. Logging out unmounts account screens and subscriptions. Navigation/camera state stays in memory.

An offline banner explains connectivity loss. Previously loaded data may remain visible. Saves require a connection and display pending/error states until acknowledged. Failed run saves retain their summary on the open page for retry; unsaved state is lost on reload. Configured Firebase account errors offer an explicit demo button; failed cloud data is never silently replaced with demo records.

## Checks and production run

```sh
npm run typecheck
npm run lint
npm test
npm run test:demo
npm run format:check
npm run build
npm start
```

Stop the dev server before using `npm start`. The production server defaults to port 3000. The health endpoint does not check Firebase credentials, rules, or network availability.

### Demo browser tests

```sh
npx playwright install chromium
npm run test:demo:ui
```

These launch a separate production server on port 3105 with Firebase values blank. Desktop and mobile tests cover the previously blocked routes, day completion/refresh/reset, exercise logs, diet preferences, sample friendships, run history, mode switching, and absence of Firebase requests or browser errors. To use an installed Chrome instead of downloading Chromium, set `PLAYWRIGHT_CHANNEL=chrome` (PowerShell: `$env:PLAYWRIGHT_CHANNEL="chrome"`). The five `npm run test:demo` data-layer tests run without a browser or Firebase emulator.

### Firebase emulator tests

Install **Java 21+**, make `java` available on PATH, then run:

```sh
npm run test:firebase
```

The script starts local Auth/Firestore emulators using `demo-gymsense`, downloads the emulator runtime on first use, runs the tests, and shuts down. No Firebase login or real project credentials are required. Ports 8080 and 9099 must be free. Tests use fake example.test accounts and enforce the checked-in rules. They cover actual SDK signup/login/logout/reset, atomic username claims, concurrent workout updates, second-app persistence, idempotent logs/runs, diet preferences, friends, and denied cross-user operations. Permission-denied messages for negative rule tests are expected.

## Vercel deployment

1. Import this repository/feature branch into Vercel.
2. Use **Next.js** preset, **Root Directory `./`**, **Node.js 24.x**, install command `npm install`, and build command `npm run build`.
3. Leave the output directory at the Next.js default. Do not use static export.
4. Set the six Firebase Web variables for the desired Preview/Production environments **before building**. Redeploy after changing them.
5. Deploy Firestore rules/indexes to that same Firebase project using the command above. Add the Vercel hostname to Firebase Auth authorized domains.
6. Check `/api/health`, then sign up, save a day, sign out, and sign in from another browser. Confirm no other user's private profile is accessible.
7. Review deployment protection so judges can access the app; provide a share link if necessary.

See [Vercel Next.js support](https://vercel.com/docs/frameworks/full-stack/nextjs). No Vercel project or live Firebase rules are deployed by this code change. Production setup requires your project configuration and console access.

## Demo walkthrough

### 30-second demo path

Open the demo workspace or prepare a signed-in Firebase account, using desktop Chrome on localhost or HTTPS. Position the camera side-on with your full body visible; allow extra time for the first permission prompt and model load.

1. Choose **Weight Loss** on `/dashboard`.
2. Open **Day 1 — Full-body circuit**.
3. Open **Bodyweight squats** and inspect the looping demo.
4. Click **Start Camera Rep Counter**, allow access, and stand upright.
5. Perform two controlled squat cycles; choose **Finish Set & Show Score**, copy the count into the logger, and select **Log set** to save it.
6. Open **Profile** to inspect your real activity graph. To unlock Day 2, return to the plan, check every exercise, and choose **Mark Day Complete**.

Camera reps do not automatically check plan exercises. Log a set explicitly to save it. If a camera is unavailable, use the animation/manual logger. Verify cross-browser sync by signing in to the same account in a second browser.

Explore `/exercises` for filters, `/plan/custom` for editable routines, `/diet` for meal preferences, `/run` for a hardware-free manual treadmill session, and `/friends` for a request exchange between two test accounts.

## Exercise demonstrations and YouTube

Every exercise in the 24-item library has its own lightweight looping SVG demonstration and a static poster for pause/reduced-motion support. All assets combined are under 96 KB. Use **Watch demo** for the fullscreen instructions and animation, or **YouTube** to open a matching video in a new tab. Both controls are available from exercise details and plan rows.

YouTube videos are linked rather than embedded: no YouTube player, thumbnail, or video request loads until you click. Opening a tutorial stops any active camera counter. Video metadata lives in `src/data/exerciseVideos.ts`; the checked links and creator credits are listed in [docs/EXERCISE_VIDEOS.md](docs/EXERCISE_VIDEOS.md). External videos remain under their creators' control and may change availability.

Regenerate local demos, posters, and their manifest with `node scripts/generate-demos.mjs`. SVGs use compatible pose keyframes, loop back to their starting position, and respect reduced-motion preferences. These are simplified movement guides; the written instructions and human demonstrations provide additional context.

## Known limitations

- Meal recipes and workout templates remain sample content, not personalized AI outputs. General guidance only. Consult a qualified professional for medical or clinical nutrition advice.
- Live rep counting supports 10 exercises (squats, goblet squats, push-ups, jumping jacks, biceps curls, hammer curls, triceps dips, overhead triceps extensions, shoulder press, and lateral raises). Other exercises offer camera preview and manual logging; physical camera/sensor/treadmill accuracy requires device testing. Form scores approximate landmark alignment.
- Secure context and compatible browser/device permissions are required for camera, GPS, motion, and Bluetooth. Mobile HTTP LAN URLs are not localhost. Use HTTPS.
- Tracking pauses when the page is hidden; there is no background run service. FTMS reads telemetry only and never controls a belt.
- Usernames cannot be renamed; account deletion, email-change flows, avatar uploads, email-verification enforcement, and password reauthentication flows are future work.
- The client gate does not create server-side session cookies. Private data is fetched by authenticated clients under Firestore rules.
- The prototype stores dated activity in one owner document and reads complete owner log/run collections. Larger datasets need pagination and partitioned aggregates before scaling toward Firestore document limits.
- There is no automatic import of anonymous demo data. Live-project deployment and email deliverability need verification with your configuration.
- A gRPC 1.x dependency override avoids known vulnerabilities in Firebase's pinned Node transport. Review `npm audit` and retest when upgrading dependencies; development tooling may still report advisories.

## Roadmap

Add account-management flows, optional verified-email enforcement/App Check, pagination and server-maintained activity aggregates, more validated movement detectors, browser accessibility/end-to-end coverage, and user-controlled data export/import.

## Privacy

Camera video and landmarks are processed locally and are never uploaded. Saved sets, account details, dietary preferences, and run summaries go to your configured Firebase project. Raw GPS coordinates are neither stored nor uploaded. Friends see only public profile fields and aggregate activity after acceptance. No real credentials or private user data are included in this repository.
