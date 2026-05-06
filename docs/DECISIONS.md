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
- Preserve a single correct path by tracking explicit carved edges. Adjacent carved cells stay separated by walls unless the generator carved that exact edge, which prevents side branches from forming loops or alternate routes.
- Remove the gray win overlay. The page and canvas should remain fully black except for white maze walls and required game elements/text.
- Use `sprites/henry.png` for the player model. Collision remains circle-based, while rendering crops the sprite sheet and keys out the dark source background so the character appears directly on the maze.
- Cache processed sprite frames in memory. Chroma-keying the source frame every render would be wasteful, while cached frames keep the render loop simple.
- Add Tofu as a selectable character using the same collision body and renderer path as Henry. Tofu's sheet uses a different source layout and background, so the sprite config supports per-character crop and background-removal strategy.
- Scale Tofu's up/down frames larger than side/idle frames. The source art has much narrower front/back poses, so equal target height made them look like a smaller cat.
- Keep Tofu idle scale independent of the last facing direction. Up/down movement needs a larger active walking scale, but idle should always return to the same size as side/idle poses.
- Render Henry larger than Tofu. The updated Henry sheet still uses the same frame boundaries, but the human child sprite should read taller than the cat while sharing the same collision circle.
- Track Tofu frame x positions explicitly instead of deriving every frame from a uniform stride. The source sheet has labels, props, and uneven spacing; explicit origins plus component filtering prevent tail/face clipping and avoid adjacent-frame artifacts.
- Track Henry row y positions explicitly and scale Henry by movement direction. The updated sheet no longer aligns cleanly to uniform row starts; left/right need taller source crops to preserve the head, while up/down need a modest render boost and side poses need a slight reduction to match the current idle size.
- Apply detached-component cleanup to Henry after dark-background removal, and use a Tofu-specific idle source x origin. Henry's JPEG sheet can leave isolated flecks above walking frames, while Tofu's loaf pose is wider than the walking columns and needs extra right-side crop room.
