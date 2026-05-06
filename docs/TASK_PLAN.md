# Task Plan

## Ordered Implementation Tasks

1. Scaffold Vite, TypeScript, Vitest, base HTML/CSS, and git repository.
2. Create product, architecture, task plan, and decision docs.
3. Implement maze data structures, perfect-maze generator, and validator.
4. Implement canvas renderer for black background, textured maze, player sprite, door goal, and timer HUD.
5. Implement keyboard input and continuous player movement.
6. Implement circle-vs-rectangle collision and wall blocking.
7. Implement win detection, message, restart key, and restart button.
8. Add automated validation and collision tests.
9. Write README, clean docs, run final build/test/manual QA.

## Commit Points

- `v0.1.0-scaffold`: Initial project scaffold.
- `v0.2.0-docs`: Planning docs.
- `v0.3.0-maze-generation`: Maze generation and validation code.
- `v0.4.0-rendering`: Canvas rendering.
- `v0.5.0-player-movement`: Input and continuous movement.
- `v0.6.0-collision`: Wall collision.
- `v0.7.0-win-restart`: Win state and restart.
- `v0.8.0-validation-tests`: Automated tests.
- `v1.0.0-mvp`: README, cleanup, and verified MVP.

## Testing/Verification Checklist

- `npm install`
- `npm run build`
- `npm test`
- `npm run dev`
- Browser automation verifies canvas renders.
- Browser automation verifies WASD movement changes player position.
- Browser automation verifies arrow-key movement changes player position.
- Browser automation verifies wall collision blocks traversal.
- Browser automation verifies win and restart flow.
- Browser automation verifies timer starts on movement and stops on win.

## Manual QA Checklist

- Maze appears on a black background.
- Walls use grassy spritesheet textures and paths use dirt texture.
- Player is rendered from the selected Henry or Tofu sprite sheet.
- Door goal is visible.
- Player starts at the entrance.
- Player cannot pass through walls or clip through corners.
- Maze has a visibly more complex 10 by 10 orthogonal layout with one correct solution.
- Spritesheet win text appears on goal reach.
- `R`, `Enter`, and the restart button restart after winning.
