export type Tile = 0 | 1;

export interface GridPoint {
  readonly x: number;
  readonly y: number;
}

export interface Rect {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
}

export interface Circle {
  readonly x: number;
  readonly y: number;
  readonly radius: number;
}

export interface Maze {
  readonly width: number;
  readonly height: number;
  readonly tiles: Tile[][];
  readonly start: GridPoint;
  readonly goal: GridPoint;
  readonly cellSize: number;
}

export interface MazeDifficulty {
  readonly hasPath: boolean;
  readonly solutionLength: number;
  readonly deadEnds: number;
  readonly dimensionsValid: boolean;
  readonly startGoalValid: boolean;
  readonly childFriendly: boolean;
}

export interface MazeGenerationConfig {
  readonly cellColumns: number;
  readonly cellRows: number;
  readonly tileSize: number;
  readonly minSolutionLength: number;
  readonly maxSolutionLength: number;
  readonly maxDeadEnds: number;
  readonly maxBranches: number;
  readonly maxBranchLength: number;
  readonly maxAttempts: number;
}
