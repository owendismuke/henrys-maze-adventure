# Product Spec

## MVP Scope

Build a single-player, browser-playable top-down maze game. The player controls a simple blue dot, starts at the maze entrance, navigates white walls on a black background, reaches a visible green goal, wins, and can restart.

## Non-Goals

- Multiplayer
- Accounts, persistence, leaderboards, analytics, or network play
- Mobile touch controls
- Sound, animation polish, complex art, external assets, or level editor
- Procedurally difficult or adult puzzle mazes
- React or a UI framework

## Player Experience

The game should be immediately understandable. A child can see the maze, the player dot, and the goal without menus or instructions blocking the board. Movement is continuous and responsive. The maze is intentionally small and simple so the player can solve by inspection and trial.

## First-Grader Difficulty Assumptions

- Grid size stays small: 7 by 7 walkable cells.
- The start and goal are not adjacent, but the solution path is short for a 7 by 7 cell maze.
- Side branches are limited and short.
- Dead ends are capped to avoid frustration.
- Difficulty length is measured in rendered tile steps, so the accepted shortest path range is 19 to 31 tile steps.
- The generator validates every maze and retries if difficulty constraints are not met.
- There is exactly one correct path from the start to the goal.

## Win Condition

The player wins when the blue dot overlaps the green goal at the exit. On win, the game displays "You win!" and supports restart by pressing `R`, `Enter`, or clicking the restart button.

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
- Blue circular player
- Green circular goal
- Minimal white text for win/restart state
