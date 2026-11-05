# Exercise demonstrations

Six optimized, self-contained SVG animations cover squats, push-ups, jumping jacks, lunges, plank (a steady hold with subtle breathing), and biceps curls. Each has a `.poster.svg` static pose for the pause control.

The animations use matching start/end poses, compatible path commands, spline interpolation, and indefinite loops. Reduced-motion preferences hide movement and show a static pose. No external images, fonts, scripts, or animation runtime are loaded.

Regenerate with `node scripts/generate-demos.mjs`. Asset mappings live in `src/data/animationAssets.ts`.

The generic `stickman-placeholder.svg` remains a catalog fallback path. The UI shows a clean written-guide placeholder for exercises without a mapped demo and handles image load failures without rendering a broken image.
