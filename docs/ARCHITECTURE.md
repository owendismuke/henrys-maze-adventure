# Architecture

## Tech Stack Decision

- Vite for lightweight local development and production builds.
- TypeScript for clear game state contracts.
- Plain Canvas 2D for rendering.
- Vitest for deterministic unit tests.
- No React because the MVP has one canvas, minimal DOM, and no component state that warrants a UI framework.

## File Structure

```text
/
  package.json
  index.html
  tsconfig.json
  vite.config.ts
  src/
    main.ts
    game/
      Collision.ts
      Game.ts
      Input.ts
      Maze.ts
      MazeGenerator.ts
      MazeValidator.ts
      Player.ts
      Renderer.ts
      types.ts
    styles.css
  docs/
    PRODUCT_SPEC.md
    ARCHITECTURE.md
    TASK_PLAN.md
    DECISIONS.md
  README.md
```

## Game Loop Design

`Game` owns the current maze, player, input, win state, and requestAnimationFrame loop. Each frame computes elapsed seconds, updates held-key movement, applies collision, checks the goal, and renders. A deterministic `window.advanceTime(ms)` hook advances fixed 60 FPS steps for browser automation.

## Rendering Strategy

`Renderer` draws the full game to one canvas. It computes a fixed logical board from maze dimensions and tile size, centers the board in the viewport, fills the canvas black, draws wall tiles white, draws the goal green, draws the selected character sprite, and overlays a simple win message.

`SpriteSheet` loads Henry and Tofu sprite sheets, crops the standing and walking frames using per-character sheet config, removes each sheet's source background, caches processed frames, and returns direction-aware frames for the renderer.

## Input Handling

`Input` tracks keydown/keyup for WASD and arrow keys. It supports held movement, normalizes diagonal movement, prevents default arrow-key scrolling, and exposes restart intent for the win state.

## Collision Approach

The selected character is rendered as a sprite but still collides as a circle, and walls are axis-aligned rectangles. Movement is continuous. The player moves one axis at a time so blocked diagonal movement can still slide along open walls. Collision uses circle-vs-rectangle checks against nearby wall tiles, including corners, to prevent clipping.

## Maze Generation Strategy

`MazeGenerator` uses a path-first generator:

1. Start at the entrance cell.
2. Carve a guaranteed connected path to the exit using a biased random walk that always makes progress toward the goal often enough to stay short.
3. Add a small number of short side branches from existing path cells.
4. Track explicit carved edges between cells instead of connecting every adjacent carved cell.
5. Convert walkable cells into a tile map with wall borders and open floor.
6. Validate the result and retry with a different seed when constraints fail.

Solvability is guaranteed by preserving the carved start-to-goal path. The explicit edge set keeps the maze graph tree-shaped, so side branches cannot create alternate routes. Validation still independently confirms that a path exists and that only one path reaches the goal.

## Validation Strategy

`MazeValidator` performs breadth-first search from start to goal and checks:

- Start and goal are present and in bounds.
- Dimensions are small.
- Start and goal are not adjacent.
- A path exists.
- Exactly one path reaches the goal.
- Shortest solution length is within the child-friendly range.
- Solution length is measured in rendered tile steps, not carved cell count.
- Dead-end count is below the configured cap.

Vitest tests cover maze validity, difficulty constraints, deterministic generation, and collision blocking.
