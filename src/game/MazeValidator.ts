import { FLOOR, isInBounds, isWall } from './Maze';
import type { GridPoint, Maze, MazeDifficulty, MazeGenerationConfig } from './types';

const NEIGHBORS: readonly GridPoint[] = [
  { x: 1, y: 0 },
  { x: -1, y: 0 },
  { x: 0, y: 1 },
  { x: 0, y: -1 },
];

export class MazeValidator {
  constructor(private readonly config: MazeGenerationConfig) {}

  validate(maze: Maze): MazeDifficulty {
    const solutionLength = this.shortestPathLength(maze);
    const hasPath = solutionLength > 0;
    const uniqueSolution = this.countPathsToGoal(maze) === 1;
    const deadEnds = this.countDeadEnds(maze);
    const dimensionsValid =
      maze.width === this.config.cellColumns * 2 + 1 &&
      maze.height === this.config.cellRows * 2 + 1 &&
      this.config.cellColumns >= 2 &&
      this.config.cellRows >= 2 &&
      this.config.cellColumns <= 12 &&
      this.config.cellRows <= 12;
    const startGoalDistance =
      Math.abs(maze.start.x - maze.goal.x) + Math.abs(maze.start.y - maze.goal.y);
    const startGoalValid =
      isInBounds(maze, maze.start) &&
      isInBounds(maze, maze.goal) &&
      !isWall(maze, maze.start) &&
      !isWall(maze, maze.goal) &&
      startGoalDistance > 2;
    const childFriendly =
      hasPath &&
      uniqueSolution &&
      dimensionsValid &&
      startGoalValid &&
      solutionLength >= this.config.minSolutionLength &&
      solutionLength <= this.config.maxSolutionLength &&
      deadEnds >= this.config.minDeadEnds &&
      deadEnds <= this.config.maxDeadEnds;

    return {
      hasPath,
      uniqueSolution,
      solutionLength,
      deadEnds,
      dimensionsValid,
      startGoalValid,
      childFriendly,
    };
  }

  shortestPathLength(maze: Maze): number {
    if (!isInBounds(maze, maze.start) || !isInBounds(maze, maze.goal)) {
      return 0;
    }

    const visited = new Set<string>();
    const queue: Array<{ point: GridPoint; distance: number }> = [
      { point: maze.start, distance: 1 },
    ];
    visited.add(key(maze.start));

    for (let index = 0; index < queue.length; index += 1) {
      const current = queue[index];

      if (current.point.x === maze.goal.x && current.point.y === maze.goal.y) {
        return current.distance;
      }

      for (const offset of NEIGHBORS) {
        const next = {
          x: current.point.x + offset.x,
          y: current.point.y + offset.y,
        };

        if (visited.has(key(next)) || isWall(maze, next)) {
          continue;
        }

        visited.add(key(next));
        queue.push({ point: next, distance: current.distance + 1 });
      }
    }

    return 0;
  }

  countDeadEnds(maze: Maze): number {
    let deadEnds = 0;

    for (let y = 1; y < maze.height - 1; y += 1) {
      for (let x = 1; x < maze.width - 1; x += 1) {
        if (maze.tiles[y][x] !== FLOOR) {
          continue;
        }

        const openNeighbors = NEIGHBORS.filter(
          (offset) => !isWall(maze, { x: x + offset.x, y: y + offset.y }),
        ).length;

        if (openNeighbors === 1) {
          deadEnds += 1;
        }
      }
    }

    return deadEnds;
  }

  countPathsToGoal(maze: Maze): number {
    if (!isInBounds(maze, maze.start) || !isInBounds(maze, maze.goal)) {
      return 0;
    }

    return this.countPathsFrom(maze, maze.start, new Set<string>(), 0);
  }

  private countPathsFrom(
    maze: Maze,
    point: GridPoint,
    visited: Set<string>,
    foundPaths: number,
  ): number {
    if (foundPaths > 1) {
      return foundPaths;
    }

    if (point.x === maze.goal.x && point.y === maze.goal.y) {
      return foundPaths + 1;
    }

    visited.add(key(point));
    let paths = foundPaths;

    for (const offset of NEIGHBORS) {
      const next = {
        x: point.x + offset.x,
        y: point.y + offset.y,
      };

      if (visited.has(key(next)) || isWall(maze, next)) {
        continue;
      }

      paths = this.countPathsFrom(maze, next, visited, paths);
      if (paths > 1) {
        break;
      }
    }

    visited.delete(key(point));
    return paths;
  }
}

function key(point: GridPoint): string {
  return `${point.x},${point.y}`;
}
