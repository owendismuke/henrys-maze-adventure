# Maze Game MVP

A browser-playable top-down maze game built with Vite, TypeScript, and plain Canvas 2D.

The player can choose Henry or Tofu, the maze walls are white, the background is black, and the goal is green. Mazes are generated as compact 10 by 10 orthogonal perfect mazes with exactly one correct route, then validated with BFS and complexity constraints.

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

Tests cover deterministic maze validity, unique solution validation, reference-style complexity validation, circle-vs-rectangle collision, wall blocking, and sliding along walls.

## Controls

- `W` or `ArrowUp`: move up
- `A` or `ArrowLeft`: move left
- `S` or `ArrowDown`: move down
- `D` or `ArrowRight`: move right
- `R` or `Enter`: restart after winning
- Restart button: restart after winning
- Henry / Tofu buttons: switch player character

## MVP Limitations

- Single-player only.
- Desktop keyboard controls only.
- No sound, level selection, scoring, timer, persistence, or art beyond the local character sprite sheets.
- Maze size and difficulty are fixed to a 10 by 10 logical perfect maze for the MVP.

## Future Improvements

- Add optional easier/tutorial and slightly harder modes.
- Add touch controls if mobile support becomes a goal.
- Add a timer or star rating without making the MVP stressful.
- Add a small level-selection screen backed by the same validator.
- Add more browser-level tests for complete solve paths.
