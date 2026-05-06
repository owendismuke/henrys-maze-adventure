import { DEFAULT_MAZE_CONFIG, FLOOR, createFilledTiles } from './Maze';
import { MazeValidator } from './MazeValidator';
import type { GridPoint, Maze, MazeGenerationConfig } from './types';

type Random = () => number;
type EdgeSet = Set<string>;

const CELL_DIRECTIONS: readonly GridPoint[] = [
  { x: 1, y: 0 },
  { x: -1, y: 0 },
  { x: 0, y: 1 },
  { x: 0, y: -1 },
];

export class MazeGenerator {
  private readonly validator: MazeValidator;
  private random: Random;

  constructor(
    private readonly config: MazeGenerationConfig = DEFAULT_MAZE_CONFIG,
    seed = Date.now(),
  ) {
    this.validator = new MazeValidator(config);
    this.random = createSeededRandom(seed);
  }

  generate(): Maze {
    for (let attempt = 0; attempt < this.config.maxAttempts; attempt += 1) {
      let maze: Maze;

      try {
        maze = this.generateCandidate();
      } catch {
        continue;
      }

      const difficulty = this.validator.validate(maze);

      if (difficulty.childFriendly) {
        return maze;
      }
    }

    throw new Error('Unable to generate a valid perfect maze with the configured complexity.');
  }

  private generateCandidate(): Maze {
    const cellStart = this.getStartCell();
    const carvedCells = new Set<string>();
    const carvedEdges: EdgeSet = new Set();

    this.carvePerfectMaze(cellStart, carvedCells, carvedEdges);

    return this.toTileMaze(carvedCells, carvedEdges);
  }

  private carvePerfectMaze(
    start: GridPoint,
    carvedCells: Set<string>,
    carvedEdges: EdgeSet,
  ): void {
    const stack: GridPoint[] = [{ ...start }];
    carvedCells.add(cellKey(start));

    while (stack.length > 0) {
      const current = stack[stack.length - 1];
      const unvisitedNeighbors = this.riverBiasedDirections(current)
        .map((direction) => ({ x: current.x + direction.x, y: current.y + direction.y }))
        .filter((next) => this.isCellInBounds(next) && !carvedCells.has(cellKey(next)));

      if (unvisitedNeighbors.length === 0) {
        stack.pop();
        continue;
      }

      const next = unvisitedNeighbors[0];
      carvedEdges.add(edgeKey(current, next));
      carvedCells.add(cellKey(next));
      stack.push(next);
    }
  }

  private toTileMaze(carvedCells: Set<string>, carvedEdges: EdgeSet): Maze {
    const width = this.config.cellColumns * 2 + 1;
    const height = this.config.cellRows * 2 + 1;
    const tiles = createFilledTiles(width, height, 1);

    for (const key of carvedCells) {
      const cell = parseCellKey(key);
      const tile = cellToTile(cell);
      tiles[tile.y][tile.x] = FLOOR;

      for (const direction of CELL_DIRECTIONS) {
        const neighbor = { x: cell.x + direction.x, y: cell.y + direction.y };
        if (carvedEdges.has(edgeKey(cell, neighbor))) {
          tiles[tile.y + direction.y][tile.x + direction.x] = FLOOR;
        }
      }
    }

    const startCell = this.getStartCell();
    const goalCell = this.getGoalCell();
    const start = cellToTile(startCell);
    const goal = cellToTile(goalCell);
    tiles[0][start.x] = FLOOR;
    tiles[height - 1][goal.x] = FLOOR;

    // Recursive backtracking carves each cell exactly once and only opens the
    // connector to its parent cell. That produces a spanning tree: every cell is
    // reachable, no isolated sections exist, and there is exactly one route
    // between any two cells, including start and goal.
    return {
      width,
      height,
      tiles,
      start,
      goal,
      cellSize: this.config.tileSize,
    };
  }

  private riverBiasedDirections(current: GridPoint): readonly GridPoint[] {
    const goal = this.getGoalCell();
    const shuffled = shuffle(CELL_DIRECTIONS, this.random);
    const progress = shuffled.filter((direction) => {
      const next = { x: current.x + direction.x, y: current.y + direction.y };
      return manhattan(next, goal) < manhattan(current, goal);
    });
    const sideways = shuffled.filter((direction) => {
      const next = { x: current.x + direction.x, y: current.y + direction.y };
      return manhattan(next, goal) === manhattan(current, goal);
    });
    const retreat = shuffled.filter((direction) => {
      const next = { x: current.x + direction.x, y: current.y + direction.y };
      return manhattan(next, goal) > manhattan(current, goal);
    });

    // MazeGenerator.net exposes a river setting for fewer, longer branches. A
    // light directional bias keeps recursive backtracking corridor-like without
    // making the solution as direct as the old path-first generator.
    return this.random() < 0.58
      ? [...progress, ...sideways, ...retreat]
      : [...sideways, ...retreat, ...progress];
  }

  private getStartCell(): GridPoint {
    return { x: Math.floor((this.config.cellColumns - 1) / 2), y: 0 };
  }

  private getGoalCell(): GridPoint {
    return { x: Math.floor(this.config.cellColumns / 2), y: this.config.cellRows - 1 };
  }

  private isCellInBounds(cell: GridPoint): boolean {
    return (
      cell.x >= 0 &&
      cell.y >= 0 &&
      cell.x < this.config.cellColumns &&
      cell.y < this.config.cellRows
    );
  }
}

function cellToTile(cell: GridPoint): GridPoint {
  return { x: cell.x * 2 + 1, y: cell.y * 2 + 1 };
}

function cellKey(cell: GridPoint): string {
  return `${cell.x},${cell.y}`;
}

function edgeKey(a: GridPoint, b: GridPoint): string {
  return [cellKey(a), cellKey(b)].sort().join('|');
}

function parseCellKey(key: string): GridPoint {
  const [x, y] = key.split(',').map(Number);
  return { x, y };
}

function manhattan(a: GridPoint, b: GridPoint): number {
  return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
}

function shuffle<T>(items: readonly T[], random: Random): T[] {
  const copy = [...items];

  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1));
    [copy[index], copy[swapIndex]] = [copy[swapIndex], copy[index]];
  }

  return copy;
}

function createSeededRandom(seed: number): Random {
  let value = seed >>> 0;
  return () => {
    value = (value * 1664525 + 1013904223) >>> 0;
    return value / 0x100000000;
  };
}
