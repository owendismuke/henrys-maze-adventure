# Product Spec

## MVP Scope

Build a single-player, browser-playable top-down maze game. The player selects Henry or Tofu, starts at the maze entrance, navigates white walls on a black background, reaches a visible green goal, wins, and can restart.

## Non-Goals

- Multiplayer
- Accounts, persistence, leaderboards, analytics, or network play
- Mobile touch controls
- Sound, complex art beyond the provided character sprite sheets, external assets, or level editor
- Procedurally difficult or adult puzzle mazes
- React or a UI framework

## Player Experience

The game should be immediately understandable. A child can see the maze, selected character, and goal without menus or instructions blocking the board. Movement is continuous and responsive. The maze is still compact, but now has enough corridor structure to feel closer to a classic printed 10 by 10 orthogonal maze.

## First-Grader Difficulty Assumptions

- Grid size is 10 by 10 logical orthogonal cells, rendered as a 21 by 21 wall/floor tile map.
- The start is near the top center and the goal is near the bottom center, matching the common top-to-bottom printed-maze layout.
- The generated maze is a perfect maze: all cells are connected and there is exactly one correct route from start to goal.
- Dead ends are required for complexity but capped to avoid extreme frustration.
- Difficulty length is measured in rendered tile steps, so the accepted shortest path range is 45 to 150 tile steps.
- The generator validates every maze and retries if difficulty constraints are not met.
- There is exactly one correct path from the start to the goal.

## Win Condition

The player wins when the selected character overlaps the green goal at the exit. On win, the game displays "You win!" and supports restart by pressing `R`, `Enter`, or clicking the restart button.

## Controls

- Move up: `W` or `ArrowUp`
- Move left: `A` or `ArrowLeft`
- Move down: `S` or `ArrowDown`
- Move right: `D` or `ArrowRight`
- Restart after win: `R` or `Enter`

Holding movement keys continuously moves the player. Arrow key browser scrolling is prevented while the game page is focused.

## Visual Design

- Full black canvas/page background
- White maze walls only, with the maze board centered smaller than the page
- Character selector for Henry or Tofu
- Henry sprite from `sprites/henry.png`
- Tofu sprite from `sprites/tofu.png`
- Green circular goal
- Minimal white text for win/restart state
