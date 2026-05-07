# Maze Game MVP

A browser-playable top-down maze game built with Vite, TypeScript, and plain Canvas 2D.

The player can choose Henry or Tofu, the maze uses cycling wall/floor themes from `sprites/main.png`, the background is black, and the goal is a door. Mazes are generated as compact 10 by 10 orthogonal perfect mazes with exactly one correct route, then validated with BFS and complexity constraints.

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

Tests cover deterministic maze validity, unique solution validation, reference-style complexity validation, stopwatch behavior, circle-vs-rectangle collision, wall blocking, and sliding along walls.

## Controls

- `W` or `ArrowUp`: move up
- `A` or `ArrowLeft`: move left
- `S` or `ArrowDown`: move down
- `D` or `ArrowRight`: move right
- `R` or `Enter`: restart after winning
- Restart button: restart after winning
- Henry / Tofu buttons: switch player character

The stopwatch starts on first movement and stops when the player reaches the door.
The maze board scales responsively within a capped range: it shrinks to stay clear of the top-left selector and top-right timer, and grows on larger windows while preserving black page margins.
Each newly generated maze advances to the next visual theme: grass, stone, brick, wood, ice, metal, then lava.

## MVP Limitations

- Single-player only.
- Desktop keyboard controls only.
- No sound, level selection, scoring beyond the stopwatch, persistence, or art beyond the local sprite sheets.
- Maze size and difficulty are fixed to a 10 by 10 logical perfect maze for the MVP.

## Future Improvements

- Add optional easier/tutorial and slightly harder modes.
- Add touch controls if mobile support becomes a goal.
- Add star ratings or best-time persistence without making the MVP stressful.
- Add a small level-selection screen backed by the same validator.
- Add more browser-level tests for complete solve paths.
