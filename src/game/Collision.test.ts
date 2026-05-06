import { describe, expect, it } from 'vitest';
import { Collision, circleIntersectsRect } from './Collision';
import type { Circle, Maze } from './types';

const testMaze: Maze = {
  width: 5,
  height: 5,
  cellSize: 10,
  start: { x: 1, y: 1 },
  goal: { x: 3, y: 3 },
  tiles: [
    [1, 1, 1, 1, 1],
    [1, 0, 0, 0, 1],
    [1, 1, 1, 0, 1],
    [1, 0, 0, 0, 1],
    [1, 1, 1, 1, 1],
  ],
};

describe('Collision', () => {
  it('detects circle rectangle overlap', () => {
    expect(
      circleIntersectsRect({ x: 12, y: 12, radius: 5 }, { x: 15, y: 10, width: 10, height: 10 }),
    ).toBe(true);
    expect(
      circleIntersectsRect({ x: 2, y: 2, radius: 2 }, { x: 15, y: 10, width: 10, height: 10 }),
    ).toBe(false);
  });

  it('blocks movement into a wall tile', () => {
    const player: Circle = { x: 15, y: 15, radius: 3 };
    const moved = Collision.moveWithWalls(player, testMaze, 0, 10);

    expect(moved).toEqual(player);
  });

  it('allows sliding along an open axis when diagonal movement hits a wall', () => {
    const player: Circle = { x: 15, y: 15, radius: 3 };
    const moved = Collision.moveWithWalls(player, testMaze, 10, 10);

    expect(moved.x).toBe(25);
    expect(moved.y).toBe(15);
  });
});
