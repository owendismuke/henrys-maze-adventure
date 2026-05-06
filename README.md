# Maze Game MVP

A browser-playable top-down maze game built with Vite, TypeScript, and plain Canvas 2D.

The player is a blue dot, the maze walls are white, the background is black, and the goal is green. Mazes are generated from a guaranteed start-to-goal path, kept to exactly one correct route, then validated with BFS and child-friendly difficulty constraints.

## Install

```bash
npm install
```

## Run Locally

```bash
npm run dev
```

Open the local Vite URL printed by the command.

## Build

```bash
npm run build
```

## Preview

```bash
npm run preview
```

## Test

```bash
npm test
```

Tests cover deterministic maze validity, unique solution validation, child-friendly difficulty validation, circle-vs-rectangle collision, wall blocking, and sliding along walls.

## Controls

- `W` or `ArrowUp`: move up
- `A` or `ArrowLeft`: move left
- `S` or `ArrowDown`: move down
- `D` or `ArrowRight`: move right
- `R` or `Enter`: restart after winning
- Restart button: restart after winning

## MVP Limitations

- Single-player only.
- Desktop keyboard controls only.
- No sound, level selection, scoring, timer, persistence, or external art.
- Maze size and difficulty are fixed for the MVP.

## Future Improvements

- Add optional easier/tutorial and slightly harder modes.
- Add touch controls if mobile support becomes a goal.
- Add a timer or star rating without making the MVP stressful.
- Add a small level-selection screen backed by the same validator.
- Add more browser-level tests for complete solve paths.
