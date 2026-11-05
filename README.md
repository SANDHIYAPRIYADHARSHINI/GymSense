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
- `public/animations`: six stickman demonstrations, static posters, and a fallback asset.

## Demo walkthrough

1. Select a goal on Home or Plans. Complete every exercise on Day 1, mark the day complete, and continue to the next unlocked day. Custom plans start empty; add exercises before training.
2. Open an exercise. Enable the optional camera preview and log repetitions with the + button. Camera video stays local and tracks stop when leaving the page. Live counting is available for squats, push-ups, and jumping jacks.
3. Open Nutrition from the desktop sidebar or Home�s nutrition card; filter sample meals by preference.
4. Open Run and choose Outdoor GPS, Manual treadmill, or Bluetooth treadmill. Start/Pause/Resume manage active tracking; Stop saves a completed run in local profile history.
5. Join the demo friends challenge or inspect the sample profile activity graph.
6. Visit `/login` to preview the sign-in form or continue directly into the demo. Credentials are never sent or stored.

Workout plans save checked exercises, completed days, and custom routines in localStorage on this browser. Diet preferences and dated daily intake trackers also persist locally. Other local interaction state resets when its page unmounts. Profile statistics and challenge steps are illustrative and are not synchronized with workouts. Plans and nutrition values are sample content, not personalized AI outputs.

## Workout plans

- `/plan/weight-gain`: Push, Pull, then Legs and core.
- `/plan/weight-loss`: Full-body circuit, Cardio and core, then Lower body and conditioning.
- `/plan/custom`: three initially empty routines. Add library exercises with sets, repetitions or seconds, and rest time. Remove exercises before completing the day.

Check each exercise on the plan page, then select **Mark Day Complete**. Day 2 unlocks after Day 1, and Day 3 unlocks after Day 2. Empty days cannot be completed. Completed routines are read-only. Refreshing restores the first incomplete day and keeps earlier days checked. Old goal URLs map to these plans and share their saved progress. All library exercises link to an exercise detail and camera preview page. Completion is manually logged on the plan page; camera repetitions do not automatically complete an exercise.

If browser storage is blocked or full, a visible message explains that progress cannot persist. Data stays local to this browser and is not synced to an account.

## Routes

### Exercise catalog

Open `/exercises` from the dashboard or desktop sidebar. Search by exercise name, muscle, or equipment, then combine muscle group, equipment, and difficulty filters. Clear filters restores all 24 exercises. Empty results include a reset action.

`src/data/exercises.ts` is the canonical typed catalog used by details and the Custom editor. Existing plan exercise IDs are preserved. Every record includes instructions, common mistakes, pose landmarks, a joint angle definition, prototype counting rules, and an existing animation path. Landmark names and indices follow the [official MediaPipe Pose Landmarker reference](https://ai.google.dev/edge/mediapipe/solutions/vision/pose_landmarker). `liveCounter` holds the thresholds and target reps used by squats, push-ups, and jumping jacks. Other exercises retain prototype metadata and manual logging.

Each `/workout/[exerciseId]` detail includes a movement demo (or a clean written-guide placeholder), camera preview, and a manual logger. Enter repetitions or seconds, select **Log set**, and remove individual sets if needed. Set totals last for the current page visit. Camera access is optional, local, and stops on navigation or when the tab is hidden. Camera footage is never recorded or uploaded.

`/`, `/login`, `/dashboard`, `/plan/build-muscle`, `/plan/lose-weight`, `/plan/stay-fit`, `/workout/squats`, `/workout/push-ups`, `/workout/lunges`, `/workout/plank`, `/diet`, `/run`, `/friends`, `/profile`.

Unknown goal or exercise identifiers return the app�s not-found page.

## Local camera rep counting

On desktop Chrome, open `/workout/squats`, `/workout/push-ups`, or `/workout/jumping-jacks` on localhost or HTTPS and click **Start Camera Rep Counter**. Allow camera access. The mirrored skeleton overlay follows the video, and the card shows count, target, current angle, and Ready / Down / Up state. **Reset Count** clears both the count and any partial movement. Use the camera count in the manual logger when a set is finished.

For squats and push-ups, position the camera side-on with your entire body visible. First reach Up (knees/elbows extended), then cross the Down threshold and return to Up. For jumping jacks, face forward: Up means arms down and feet together; Down means both wrists raised above the shoulders and ankles apart relative to shoulder width. Returning to closed Up completes a rep. Detection requires stable frames and rejects partial, very fast, timed-out, or interrupted cycles.

Low visibility, joints outside the frame, and very dark video pause counting and discard partial cycles while retaining completed reps. Move into view or improve lighting, then return to the starting position. The camera stops on navigation, startup cancellation, detection errors, disconnection, or tab hiding. Permission, device, and model errors appear in the counter card. Other catalog exercises offer camera preview and manual logging only.

MediaPipe Tasks Vision is lazy-loaded after the click. The official lite model is committed in `public/mediapipe/`; `npm install` copies WASM runtime files from the pinned npm package into `public/mediapipe/wasm/`. These generated vendor files are ignored by Git, lint, and formatting. If install scripts are disabled, run `npm run prepare:pose`. The app serves all model/runtime files locally; video, landmarks, brightness samples, and counts never leave the browser. See [MediaPipe?s browser guide](https://developers.google.com/edge/mediapipe/solutions/vision/pose_landmarker/web_js) for the inference API.

Tests use synthetic landmark sequences for geometry, complete cycles, initial-position arming, jitter, tracking loss, side changes, reset, and combined arm/leg conditions. Physical webcam accuracy and Chrome console behavior still require a live browser check; browser control was unavailable during implementation. Thresholds are initial defaults and may need calibration for camera placement and movement range.

## Form and tempo coaching

Each catalog record has a typed `coaching` definition: minimum/maximum rep duration, a bottom-pause target, and phase-aware joint-angle or landmark-position rules. Live coaching runs on the three supported counters (squats, push-ups, jumping jacks); other exercises retain their rules for future detectors. Existing camera consent and on-device processing remain unchanged.

One non-blocking cue appears at a time. Form conditions must persist for 400 ms before appearing, message switches have a 1.4-second minimum interval, and corrected warnings clear after a short grace period. Low visibility or lighting loss clears feedback immediately. Cues cover fast/slow movement, body alignment, raised hips, a missing bottom pause, and good reps. Upright squat alignment checks are suppressed during descent. These landmark-based checks approximate body alignment, not spinal curvature.

Rep duration starts when movement leaves the starting position; waiting at the top cannot make a fast rep count. Too-fast, timed-out, interrupted, and partial attempts are rejected. **Finish Set & Show Score** closes the current attempt and displays a score with three components: 40% counted attempts / total attempts, 30% that fraction multiplied by tempo consistency (1 minus the coefficient of variation of valid rep durations), and 30% active visible frames without form warnings. Scores stay between 0 and 100. No attempts produces no score; a set with only rejected attempts scores 0. Idle standing does not improve the form component. Each finished set has its own score and can copy valid reps into the manual logger. **Reset Count** discards the current set, while finished set scores remain for the page visit.

Spoken coaching is off by default. Enable the checkbox for browser speech synthesis using an available on-device English voice. It throttles repeated cues and cancels speech on stop, reset, navigation, and tracking loss. If speech or a local voice is unavailable, visual feedback continues. The [browser SpeechSynthesis API](https://developer.mozilla.org/en-US/docs/Web/API/SpeechSynthesis) supplies voices and utterance playback; no microphone access is requested.

Tests cover movement timing, rejected reps, correct phase gating, form-rule visibility checks, cue debounce, scoring calculations, event deduplication, set resets, and mocked speech behavior. Live webcam/voice behavior and the browser console remain unverified because browser access was unavailable.

## Stickman demonstrations

Six lightweight SVGs demonstrate squats, push-ups, jumping jacks, lunges, plank, and biceps curls. Plank shows a steady hold with subtle breathing rather than a repeated exercise. Demos loop using spline interpolation and matching endpoints. Static posters support **Pause animation**, and reduced-motion preferences automatically show a static pose. All twelve assets together are under 24 KB, require no animation library, and are served locally. Generate them with `node scripts/generate-demos.mjs`.

The exercise detail page shows its demo before the camera counter. **Watch demo** opens a fullscreen native dialog with numbered instructions, common mistakes, pause/play, and a close button. Escape closes it; native dialog focus trapping and focus restoration support keyboard users, and body scrolling is locked while open. Workout-plan exercise rows also provide **Watch demo**, so learners can review form without navigating away. Opening a demo stops an active camera session; restarting it still requires an explicit click. The inline demo pauses while its fullscreen counterpart plays.

Exercises without a mapped asset display a written-guide placeholder without requesting an unknown file. Unexpected image load failures also fall back to the placeholder. Tests validate assets, size budget, loop endpoints, morph-compatible commands, reduced-motion fallback, and missing-path resolution. SVG XML and rendered start/end poses were inspected locally. Browser animation timing and modal interactions remain unverified because browser access was unavailable.

## Diet preferences and daily meals

Open `/diet` from Nutrition or Home. Set a goal, diet type, allergies, cuisine, meal count, budget, and cooking-time preference. Changes save automatically to `gymsense:diet:preferences:v1` and immediately update the plan, so changing an allergy never leaves stale meal suggestions visible. **Generate daily plan** cycles through available matching recipes. Three-meal mode omits the snack; three meals plus snacks includes one snack slot. The selected recipe variation is not persisted.

`src/data/foods.ts` defines typed mock foods, per-100g nutrition, ingredient allergens, and recipes. `src/lib/diet.ts` filters recipes using every preference, adjusts sample portion sizes by goal, computes each meal from ingredient weights, and sums the displayed meal values for daily calories, protein, carbs, fat, and fiber. Vegetarian excludes eggs and animal flesh; vegan allows plant foods only; eggetarian adds eggs and dairy; pescatarian allows fish, shellfish, eggs, and dairy but excludes meat. Selected allergens always exclude matching tagged ingredients. Budget and normal tiers permit less expensive recipes; premium permits every tier. Under-15 and under-30 options are strict time limits, while meal prep requires batch-friendly recipes. Cooking times assume ready-cooked grains, legumes, and proteins where listed.

No matching recipe produces a clear empty slot; the planner never relaxes dietary or allergen restrictions to fill it. Nutrition is illustrative mock data, not a clinical database or personalized calorie prescription. Product labels and preparation still determine actual allergens.

Protein, fiber, and water have independent manual intake trackers, quick add/remove buttons, and editable example targets. Generating meals does not log intake. Daily entries persist under a local-date storage key and start fresh on the next calendar date. The page checks rollover every minute and when returning to the tab; input handlers also check the date before changing a tracker. Invalid saved data restores safe defaults, and storage failures produce a visible notice.

The page includes: **General guidance only. Consult a qualified professional for medical or clinical nutrition advice.**

Diet tests cover 11,520 preference combinations, all 64 allergen combinations, dietary categories, absent recipe matches, ingredient references, nutrient arithmetic, optional snacks, preference serialization, and daily tracker restoration. Browser interaction and refresh behavior remain unverified because browser access was unavailable.

## Friends, profiles, and streaks

`src/data/users.ts` defines six mock users with distinct 24-week activity histories. The deterministic snapshot ends **5 November 2026**; profiles label this date explicitly. `/profile` shows Alex?s avatar, username, goal, current/longest streak, weekly workouts, total reps, and total active minutes. The dashboard uses the same derived weekly progress.

Each profile?s contribution graph shows exactly 84 daily squares (12 columns of seven consecutive days), including rest days. Hover, tap, focus, or use arrow keys to inspect the date and activity summary. A roving tab stop keeps keyboard traversal manageable; Home/End move within a column, and Ctrl+Home/End reach the window endpoints. Colors represent none, light, moderate, or strong activity. One workout, 60 reps, or 20 active minutes is moderate; two workouts, 150 reps, or 45 active minutes is strong. Remaining positive activity is light.

Streaks are calculated from dated activity. Missing/rest days break a streak, and an unfinished today preserves yesterday?s streak until the day ends. Duplicate daily records are aggregated, and future activity is excluded from profile totals. Weekly metrics begin on Monday. The mock user has completed 3 workouts, run 3.5 km, and completed 400 reps this week, powering the 3-workout, 5-km, and 500-rep challenge cards.

On `/friends`, search usernames (case-insensitive, optional @), add/remove friends, inspect your list, and open a profile preview with that person?s own graph and stats. Friend and challenge memberships persist locally under `gymsense:social:v1`; no invitations, messages, or notifications are sent. Joining a challenge does not change its mock progress. Social and profile activity are not synchronized with workout, camera, or run logs.

Tests cover all mock streaks, 84-cell date windows, intensity bands, duplicate/missing/future records, weekly totals, username search, self-add prevention, friend/challenge toggles, and saved-state validation. Browser tapping, hovering, and refresh interactions remain unverified because browser access was unavailable.

## Running, steps, and FTMS treadmills

`/run` offers three sources: Outdoor GPS, Manual treadmill, and Bluetooth treadmill. Start/Pause/Resume/Stop manage the local tracking session. Active elapsed time uses a monotonic clock, pauses are excluded, and pace is shown as minutes per kilometer. Stop saves a summary (up to the latest 100 runs) under `gymsense:runs:v1`, visible on `/profile` in **Completed run history**. Failed storage writes retain the completed summary on the page with a retry button. These real local sessions remain separate from mock social streaks and challenge data.

Outdoor runs request [Geolocation watchPosition](https://developer.mozilla.org/en-US/docs/Web/API/Geolocation/watchPosition) access only after starting/resuming. High-accuracy, recent fixes drive Haversine distance; inaccurate points, impossible jumps, and small position drift are filtered. Resuming starts a new position anchor, so paused travel is excluded. Coordinates are processed in memory and are never persisted or uploaded. GPS needs HTTPS on a phone (localhost is suitable on the development computer). Keep the page visible: hiding it pauses tracking because mobile browsers can suspend sensors and timers in the background.

Step estimation is separately opt-in through a button using [DeviceMotionEvent.requestPermission](https://developer.mozilla.org/en-US/docs/Web/API/DeviceMotionEvent/requestPermission_static) where required. An orientation-independent acceleration peak detector provides approximate steps while tracking is active. Unsupported sensors, denied permission, or missing motion events leave manual step entry and a distance/step-length estimate available. Motion-based and distance-based counts are labeled as estimates.

Bluetooth requires a supporting secure-context browser/device and explicit in-app consent, followed by the browser device picker. The picker [filters by FTMS service](https://developer.mozilla.org/en-US/docs/Web/API/Bluetooth/requestDevice) `0x1826` only. Read-only access to Treadmill Data `0x2ACD` decodes optional speed, signed incline, cumulative distance, and device elapsed time using the [Bluetooth SIG GATT Specification Supplement](https://btprodspecificationrefs.blob.core.windows.net/gatt-specification-supplement/GATT_Specification_Supplement.pdf). All optional fields are skipped in their specified order; malformed packets are rejected. Notifications are preferred, with read polling for readable-only devices. No belt-control commands are sent.

FTMS cumulative distance is baselined at the start and again after pauses, so earlier device totals are excluded. If distance is not supplied, fresh speed samples provide an explicitly labeled estimate. Speed estimates expire after three seconds without updates; the session pauses after five seconds without telemetry. Connection states include Disconnected, Connecting, Connected, and Unsupported browser/device. The chooser can be cancelled, and disconnections pause an active FTMS session. Use the treadmill?s own physical controls for the belt.

Manual treadmill mode requires no Bluetooth or GPS. Enter speed/incline, update speed during the run, and optionally correct the session distance. Speed integration accounts for when settings change. Completed summaries store duration, distance, pace, steps, source labels, and timestamps, without location traces or persistent device identifiers.

Automated tests cover timer/pause accounting, pace, GPS filters, FTMS field parsing (including full optional packets and truncation), cumulative counter resets, stale telemetry, step peaks, saved histories, mocked notifications, the exact FTMS-only chooser filter, unsupported Bluetooth, and connection cancellation. Live mobile GPS/motion and physical treadmill interoperability remain unverified because browser/device access was unavailable.
