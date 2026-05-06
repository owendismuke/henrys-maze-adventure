import { describe, expect, it } from 'vitest';
import { DEFAULT_MAZE_CONFIG } from './Maze';
import { MazeGenerator } from './MazeGenerator';
import { MazeValidator } from './MazeValidator';

describe('MazeGenerator', () => {
  it('generates a solvable perfect maze with reference-style complexity for deterministic seeds', () => {
    const validator = new MazeValidator(DEFAULT_MAZE_CONFIG);

    for (let seed = 1; seed <= 20; seed += 1) {
      const maze = new MazeGenerator(DEFAULT_MAZE_CONFIG, seed).generate();
      const difficulty = validator.validate(maze);

      expect(difficulty).toMatchObject({
        hasPath: true,
        uniqueSolution: true,
        dimensionsValid: true,
        startGoalValid: true,
        childFriendly: true,
      });
      expect(maze.width).toBe(DEFAULT_MAZE_CONFIG.cellColumns * 2 + 1);
      expect(maze.height).toBe(DEFAULT_MAZE_CONFIG.cellRows * 2 + 1);
      expect(validator.countPathsToGoal(maze)).toBe(1);
      expect(difficulty.solutionLength).toBeGreaterThanOrEqual(
        DEFAULT_MAZE_CONFIG.minSolutionLength,
      );
      expect(difficulty.solutionLength).toBeLessThanOrEqual(
        DEFAULT_MAZE_CONFIG.maxSolutionLength,
      );
      expect(difficulty.deadEnds).toBeGreaterThanOrEqual(DEFAULT_MAZE_CONFIG.minDeadEnds);
      expect(difficulty.deadEnds).toBeLessThanOrEqual(DEFAULT_MAZE_CONFIG.maxDeadEnds);
    }
  });
});
