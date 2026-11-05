# Local pose assets

`pose_landmarker_lite.task` is the official MediaPipe Pose Landmarker lite float16 model, version 1.

Source: https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task

SHA-256: `59929e1d1ee95287735ddd833b19cf4ac46d29bc7afddbbf6753c459690d574a`

Documentation: https://developers.google.com/edge/mediapipe/solutions/vision/pose_landmarker

`wasm/` is copied from the pinned `@mediapipe/tasks-vision` dependency by `npm run prepare:pose` during installation. Generated runtime files are not tracked. Model and runtime files are loaded from this app's own origin; no third-party inference endpoint is used.
