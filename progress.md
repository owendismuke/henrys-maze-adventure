Original prompt: Build a complete, running MVP of a web-based maze game from an empty folder with Vite, TypeScript, Canvas 2D, docs-first planning, validation tests, and required git commits/tags.

## Progress

- Initialized empty git repository.
- Created minimal Vite/TypeScript scaffold with scripts for dev, build, preview, and test.
- Added required docs as implementation source of truth.
- Implemented maze types, helper functions, path-first generation, and BFS difficulty validation.
- Added Canvas 2D renderer and wired initial static maze view into the app.
- Added held-key WASD/arrow input, normalized continuous player movement, and browser automation state/time hooks.
- Added circle-vs-rectangle wall collision with axis-separated movement.
- Added goal overlap win detection, win state overlay, keyboard restart, and restart button.
- Added Vitest coverage for maze generation/validation and collision, and corrected solution-length constraints to rendered tile steps.
- Added README with install, run, build, preview, test, controls, limitations, and future ideas.
- Browser client rendered screenshots and state successfully with no console errors; added tile grid to debug state for complete solve-path verification.
- Final verification passed: npm install, npm test, npm run build, npm run preview startup, browser screenshot/state client, and complete solve-flow Playwright script.
- Updated generator/validator so every generated maze has exactly one start-to-goal path, and removed the gray win overlay to preserve the black background.
- Swapped blue-dot rendering for cached frames from `sprites/henry.png`; collision remains circle-based.
- Added Tofu as a second selectable character using `sprites/tofu.png`; selection changes rendering only.
- Adjusted Tofu up/down render scale so front/back poses visually match the larger side/idle poses.
- Fixed Tofu idle scaling so releasing up/down returns to the same idle size as releasing left/right.
- Verified the updated Henry sheet still fits the current crop boundaries and increased Henry render scale above Tofu.
- Rechecked the updated Henry package and fixed Tofu sprite frame extraction for right-tail, left-face, and inconsistent down-frame artifacts.
- Fixed Henry's updated sheet extraction so side-motion heads are not clipped and movement directions render closer to the idle size.
- Removed Henry walking-frame flecks and widened Tofu's loafing idle crop so the back of the cat is visible.
- Replaced the simple path-first maze with a compact 10 by 10 recursive-backtracking perfect maze inspired by MazeGenerator.net's rectangular orthogonal style.
- Applied `sprites/main.png` as the grassy/dirt maze atlas, door goal, timer HUD, win banner backing, and movement-driven stopwatch.
- Fixed HUD layout and readability: character selector top-left, timer top-right, door below the maze exit, artifact-free timer text, and unclipped win banner.

## TODO

- No known blocking TODOs.
