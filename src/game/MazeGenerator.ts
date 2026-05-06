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

    throw new Error('Unable to generate a child-friendly solvable maze.');
  }

  private generateCandidate(): Maze {
    const cellStart = { x: 0, y: 0 };
    const cellGoal = {
      x: this.config.cellColumns - 1,
      y: this.config.cellRows - 1,
    };
    const carvedCells = new Set<string>();
    const carvedEdges: EdgeSet = new Set();
    const solutionCells = this.createSolutionPath(cellStart, cellGoal);

    for (const cell of solutionCells) {
      carvedCells.add(cellKey(cell));
    }

    for (let index = 1; index < solutionCells.length; index += 1) {
      carvedEdges.add(edgeKey(solutionCells[index - 1], solutionCells[index]));
    }

    this.addSideBranches(carvedCells, carvedEdges);

    return this.toTileMaze(carvedCells, carvedEdges);
  }

  private createSolutionPath(start: GridPoint, goal: GridPoint): GridPoint[] {
    const path: GridPoint[] = [{ ...start }];
    const visited = new Set<string>([cellKey(start)]);
    let current = { ...start };

    while (current.x !== goal.x || current.y !== goal.y) {
      const options = this.progressFirstDirections(current, goal).filter((direction) => {
        const next = { x: current.x + direction.x, y: current.y + direction.y };
        return this.isCellInBounds(next) && !visited.has(cellKey(next));
      });

      if (options.length === 0) {
        throw new Error('Path-first generator reached a dead end.');
      }

      const direction = this.pick(options);
      current = { x: current.x + direction.x, y: current.y + direction.y };
      visited.add(cellKey(current));
      path.push({ ...current });
    }

    return path;
  }

  private addSideBranches(carvedCells: Set<string>, carvedEdges: EdgeSet): void {
    const branchRoots = shuffle(
      [...carvedCells].map(parseCellKey),
      this.random,
    ).slice(0, this.config.maxBranches);

    for (const root of branchRoots) {
      let current = root;
      const branchLength = 1 + Math.floor(this.random() * this.config.maxBranchLength);

      for (let step = 0; step < branchLength; step += 1) {
        const options = shuffle([...CELL_DIRECTIONS], this.random)
          .map((direction) => ({ x: current.x + direction.x, y: current.y + direction.y }))
          .filter((next) => this.isCellInBounds(next) && !carvedCells.has(cellKey(next)));

        if (options.length === 0) {
          break;
        }

        carvedEdges.add(edgeKey(current, options[0]));
        current = options[0];
        carvedCells.add(cellKey(current));
      }
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

    const start = cellToTile({ x: 0, y: 0 });
    const goal = cellToTile({
      x: this.config.cellColumns - 1,
      y: this.config.cellRows - 1,
    });

    // Only explicit carved edges become open connectors. Adjacent carved cells
    // do not automatically connect, so the maze remains a tree with exactly one
    // possible route from the entrance to the goal.
    return {
      width,
      height,
      tiles,
      start,
      goal,
      cellSize: this.config.tileSize,
    };
  }

  private progressFirstDirections(current: GridPoint, goal: GridPoint): GridPoint[] {
    const progress = CELL_DIRECTIONS.filter((direction) => {
      const next = { x: current.x + direction.x, y: current.y + direction.y };
      const currentDistance = manhattan(current, goal);
      return manhattan(next, goal) < currentDistance;
    });
    const detours = CELL_DIRECTIONS.filter((direction) => !progress.includes(direction));

    return [...shuffle(progress, this.random), ...shuffle(detours, this.random)];
  }

  private pick<T>(items: readonly T[]): T {
    return items[Math.floor(this.random() * items.length)];
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
