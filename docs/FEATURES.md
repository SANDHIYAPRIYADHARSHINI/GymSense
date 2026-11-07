# GymSense feature reference

The current setup, architecture, Firebase security model, and migration behavior are documented in the [README](../README.md).

- Exercise templates and meal recipes remain bundled sample content.
- Account profiles, workout progress/custom routines, logged sets, diet preferences/intake, runs, and friend requests now use Firebase Authentication and Firestore.
- Browser camera, motion, GPS, and Bluetooth processing remain local. Only saved summaries are synced.
- Plans enforce sequential day completion. Camera reps must be explicitly logged; plan exercise checkboxes remain a separate action.
- SVG demonstrations and manual exercise logging remain available when camera counting is unsupported.
- Real account activity drives profile graphs and weekly challenges; no mock user statistics appear in the authenticated screens.

For detailed behavior, see the typed domain modules in `src/lib`, the exercise definitions in `src/data/exercises.ts`, and the domain/security test suites in `tests`.
