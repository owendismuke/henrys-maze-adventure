import type { GridPoint, Maze, Tile } from './types';

export const WALL: Tile = 1;
export const FLOOR: Tile = 0;

export const DEFAULT_MAZE_CONFIG = {
  cellColumns: 7,
  cellRows: 7,
  tileSize: 36,
  minSolutionLength: 19,
  maxSolutionLength: 31,
  maxDeadEnds: 7,
  maxBranches: 5,
  maxBranchLength: 2,
  maxAttempts: 250,
} as const;

export function createFilledTiles(width: number, height: number, tile: Tile): Tile[][] {
  return Array.from({ length: height }, () => Array<Tile>(width).fill(tile));
}

export function isInBounds(maze: Maze, point: GridPoint): boolean {
  return point.x >= 0 && point.y >= 0 && point.x < maze.width && point.y < maze.height;
}

export function isWall(maze: Maze, point: GridPoint): boolean {
  if (!isInBounds(maze, point)) {
    return true;
  }

  return maze.tiles[point.y][point.x] === WALL;
}

export function gridToWorldCenter(point: GridPoint, cellSize: number): GridPoint {
  return {
    x: point.x * cellSize + cellSize / 2,
    y: point.y * cellSize + cellSize / 2,
  };
}

export function mazePixelWidth(maze: Maze): number {
  return maze.width * maze.cellSize;
}

export function mazePixelHeight(maze: Maze): number {
  return maze.height * maze.cellSize;
}
