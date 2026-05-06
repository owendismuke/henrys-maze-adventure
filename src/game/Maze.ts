import type { GridPoint, Maze, Tile } from './types';

export const WALL: Tile = 1;
export const FLOOR: Tile = 0;

export const DEFAULT_MAZE_CONFIG = {
  cellColumns: 10,
  cellRows: 10,
  tileSize: 18,
  minSolutionLength: 45,
  maxSolutionLength: 150,
  minDeadEnds: 8,
  maxDeadEnds: 35,
  maxAttempts: 500,
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
