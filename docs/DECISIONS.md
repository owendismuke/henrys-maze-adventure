# Decisions

## 2026-05-06

- Use Vite, TypeScript, Canvas 2D, and Vitest. This matches the requested lightweight default and keeps the MVP dependency surface small.
- Do not use React. The game has one canvas and minimal DOM controls, so React would add complexity without MVP value.
- Use a 7 by 7 walkable-cell maze. This keeps the maze appropriate for an average first grader.
- Use path-first maze generation instead of a perfect recursive-backtracking maze. Perfect mazes often create too many dead ends for this age target.
- Add only short side branches after carving the solution path. This gives the maze some exploration while keeping frustration low.
- Validate every generated maze with BFS and difficulty constraints even though the generator preserves a known solution path. This prevents accidental regressions.
- Use continuous movement with axis-separated collision resolution. It feels responsive and naturally supports sliding along walls.
- Use a fixed logical tile size with responsive canvas centering. This avoids resizing bugs while still fitting common desktop windows.
- Add Vitest because maze validity and collision behavior are deterministic and practical to test.
- Measure solution length in rendered tile steps. A 7 by 7 cell maze has connector tiles between cells, so the child-friendly accepted range is 19 to 31 rendered tile steps.
