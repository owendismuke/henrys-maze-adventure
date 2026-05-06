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

`MazeGenerator` uses randomized recursive backtracking to create a perfect orthogonal maze similar to the default rectangular style on MazeGenerator.net:

1. Start near the top-center cell.
2. Walk depth-first through unvisited neighboring cells.
3. Carve exactly one parent edge when entering each unvisited cell.
4. Bias neighbor ordering toward longer corridor flow, taking inspiration from MazeGenerator.net's river tendency setting.
5. Convert the carved cell graph into a 21 by 21 tile map for a 10 by 10 logical maze.
6. Open visual entrance and exit gaps in the top and bottom borders.
7. Validate the result and retry with a different seed when constraints fail.

Solvability and uniqueness are guaranteed by the spanning-tree property: every logical cell is carved once, every new cell is connected to exactly one parent, and no loop edges are added. That means every cell is reachable and there is exactly one route between any two cells. Validation still independently confirms that a path exists and that only one path reaches the goal.

## Validation Strategy

`MazeValidator` performs breadth-first search from start to goal and checks:

- Start and goal are present and in bounds.
- Dimensions are within the supported compact range.
- Start and goal are not adjacent.
- A path exists.
- Exactly one path reaches the goal.
- Shortest solution length is within the reference-style range.
- Solution length is measured in rendered tile steps, not carved cell count.
- Dead-end count is within the configured complexity range.

Vitest tests cover maze validity, difficulty constraints, deterministic generation, and collision blocking.
