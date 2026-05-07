import { gridToWorldCenter, mazePixelHeight, mazePixelWidth } from './Maze';
import { MainSpriteAtlas, type MazeThemeId, type WallSpriteKind } from './MainSpriteAtlas';
import { createCharacterSpriteSheets, type SpriteSheet } from './SpriteSheet';
import type { TimerState } from './Stopwatch';
import type { CharacterId, Maze, PlayerRenderState } from './types';

export interface RenderState {
  readonly maze: Maze;
  readonly player: PlayerRenderState;
  readonly hasWon: boolean;
  readonly elapsedSeconds: number;
  readonly timerState: TimerState;
  readonly mazeTheme: MazeThemeId;
}

const COLORS = {
  background: '#000000',
} as const;
const UI_PADDING = 18;
const HUD_RESERVED_HEIGHT = 112;
const MIN_BOARD_BOTTOM_PADDING = 18;
const MIN_BOARD_SIDE_PADDING = 48;
const MAX_RESPONSIVE_SCALE = 1.65;
const TIMER_PANEL_WIDTH = 146;
const DOOR_SIZE_RATIO = 2.35;
const DOOR_TOP_GAP = 4;

export class Renderer {
  private readonly context: CanvasRenderingContext2D;
  private readonly playerSprites: Record<CharacterId, SpriteSheet>;
  private readonly mainAtlas: MainSpriteAtlas;
  private boardOffsetX = 0;
  private boardOffsetY = 0;
  private renderScale = 1;

  constructor(
    private readonly canvas: HTMLCanvasElement,
    onSpriteLoad: () => void,
  ) {
    const context = canvas.getContext('2d');

    if (!context) {
      throw new Error('Canvas 2D context not available.');
    }

    this.context = context;
    this.playerSprites = createCharacterSpriteSheets(onSpriteLoad);
    this.mainAtlas = new MainSpriteAtlas(onSpriteLoad);
  }

  render(state: RenderState): void {
    this.resizeCanvas();
    this.computeBoardOffset(state.maze);
    this.drawBackground();
    this.drawMaze(state.maze, state.mazeTheme);
    this.drawGoal(state.maze);
    this.drawPlayer(state.player);
    this.drawTimer(state.elapsedSeconds);

    if (state.hasWon) {
      this.drawWinOverlay(state.maze);
    }
  }

  private resizeCanvas(): void {
    const width = Math.max(320, window.innerWidth);
    const height = Math.max(320, window.innerHeight);

    if (this.canvas.width !== width || this.canvas.height !== height) {
      this.canvas.width = width;
      this.canvas.height = height;
    }
  }

  private computeBoardOffset(maze: Maze): void {
    const mazeWidth = mazePixelWidth(maze);
    const mazeHeight = mazePixelHeight(maze);
    const doorHeight = maze.cellSize * DOOR_SIZE_RATIO;
    const visualHeight = mazeHeight + DOOR_TOP_GAP + doorHeight;
    const availableHeight = Math.max(
      1,
      this.canvas.height - HUD_RESERVED_HEIGHT - MIN_BOARD_BOTTOM_PADDING,
    );
    const availableWidth = Math.max(1, this.canvas.width - MIN_BOARD_SIDE_PADDING * 2);

    // When the in-app browser is short, scale rendering down instead of letting
    // the HUD overlap the top maze row. In larger viewports, scale up only to a
    // capped point so the board is readable without consuming the whole page.
    // Gameplay and collision use unscaled maze coordinates; only presentation is scaled.
    this.renderScale = Math.min(
      MAX_RESPONSIVE_SCALE,
      availableWidth / mazeWidth,
      availableHeight / visualHeight,
    );

    const scaledWidth = mazeWidth * this.renderScale;
    const scaledHeight = visualHeight * this.renderScale;
    this.boardOffsetX = Math.floor((this.canvas.width - scaledWidth) / 2);
    this.boardOffsetY = Math.floor(
      HUD_RESERVED_HEIGHT + Math.max(0, (availableHeight - scaledHeight) / 2),
    );
  }

  private drawBackground(): void {
    this.context.fillStyle = COLORS.background;
    this.context.fillRect(0, 0, this.canvas.width, this.canvas.height);
  }

  private drawMaze(maze: Maze, mazeTheme: MazeThemeId): void {
    for (let y = 0; y < maze.height; y += 1) {
      for (let x = 0; x < maze.width; x += 1) {
        if (maze.tiles[y][x] === 0) {
          this.mainAtlas.drawFloor(
            this.context,
            mazeTheme,
            this.toCanvasX(x * maze.cellSize),
            this.toCanvasY(y * maze.cellSize),
            this.toCanvasSize(maze.cellSize),
          );
        }
      }
    }

    for (let y = 0; y < maze.height; y += 1) {
      for (let x = 0; x < maze.width; x += 1) {
        if (maze.tiles[y][x] === 1) {
          const wallSprite = getWallSprite(maze, x, y);
          this.mainAtlas.drawWall(
            this.context,
            wallSprite.kind,
            mazeTheme,
            wallSprite.rotationRadians,
            this.toCanvasX(x * maze.cellSize),
            this.toCanvasY(y * maze.cellSize),
            this.toCanvasSize(maze.cellSize),
          );
        }
      }
    }
  }

  private drawGoal(maze: Maze): void {
    const center = gridToWorldCenter(maze.goal, maze.cellSize);
    this.mainAtlas.drawDoor(
      this.context,
      this.toCanvasX(center.x),
      this.toCanvasY(mazePixelHeight(maze) + DOOR_TOP_GAP),
      this.toCanvasSize(maze.cellSize * DOOR_SIZE_RATIO),
    );
  }

  private drawPlayer(player: PlayerRenderState): void {
    const frame = this.playerSprites[player.character].getFrame(
      player.facing,
      player.isMoving,
      player.animationSeconds,
    );

    if (!frame) {
      return;
    }

    const targetHeight = this.toCanvasSize(player.radius * getPlayerSpriteScale(player));
    const targetWidth = targetHeight * (frame.width / frame.height);

    this.context.imageSmoothingEnabled = false;
    this.context.drawImage(
      frame.image,
      this.toCanvasX(player.x) - targetWidth / 2,
      this.toCanvasY(player.y) - targetHeight * 0.72,
      targetWidth,
      targetHeight,
    );
  }

  private drawTimer(elapsedSeconds: number): void {
    this.mainAtlas.drawTimerPanel(
      this.context,
      this.canvas.width - TIMER_PANEL_WIDTH - UI_PADDING,
      UI_PADDING,
      formatTimer(elapsedSeconds),
    );
  }

  private drawWinOverlay(maze: Maze): void {
    const boardWidth = mazePixelWidth(maze);
    const boardHeight = mazePixelHeight(maze);
    const centerX = this.toCanvasX(boardWidth / 2);
    const centerY = this.toCanvasY(boardHeight / 2);

    this.mainAtlas.drawWinText(this.context, centerX, centerY);
  }

  private toCanvasX(worldX: number): number {
    return this.boardOffsetX + worldX * this.renderScale;
  }

  private toCanvasY(worldY: number): number {
    return this.boardOffsetY + worldY * this.renderScale;
  }

  private toCanvasSize(worldSize: number): number {
    return worldSize * this.renderScale;
  }
}

function getWallSprite(
  maze: Maze,
  x: number,
  y: number,
): { readonly kind: WallSpriteKind; readonly rotationRadians: number } {
  const north = isWallTile(maze, x, y - 1);
  const east = isWallTile(maze, x + 1, y);
  const south = isWallTile(maze, x, y + 1);
  const west = isWallTile(maze, x - 1, y);
  const connections = [north, east, south, west].filter(Boolean).length;

  if (connections >= 4) {
    return { kind: 'cross', rotationRadians: 0 };
  }

  if (connections === 3) {
    if (!north) {
      return { kind: 't', rotationRadians: 0 };
    }
    if (!east) {
      return { kind: 't', rotationRadians: Math.PI / 2 };
    }
    if (!south) {
      return { kind: 't', rotationRadians: Math.PI };
    }
    return { kind: 't', rotationRadians: -Math.PI / 2 };
  }

  if (connections === 2) {
    if (east && west) {
      return { kind: 'horizontal', rotationRadians: 0 };
    }
    if (north && south) {
      return { kind: 'vertical', rotationRadians: 0 };
    }
    if (north && west) {
      return { kind: 'corner', rotationRadians: 0 };
    }
    if (north && east) {
      return { kind: 'corner', rotationRadians: Math.PI / 2 };
    }
    if (south && east) {
      return { kind: 'corner', rotationRadians: Math.PI };
    }
    return { kind: 'corner', rotationRadians: -Math.PI / 2 };
  }

  if (east || west) {
    return { kind: 'horizontal', rotationRadians: 0 };
  }

  if (north || south) {
    return { kind: 'vertical', rotationRadians: 0 };
  }

  return { kind: 'solid', rotationRadians: 0 };
}

function isWallTile(maze: Maze, x: number, y: number): boolean {
  if (x < 0 || y < 0 || x >= maze.width || y >= maze.height) {
    return false;
  }

  return maze.tiles[y][x] === 1;
}

function formatTimer(elapsedSeconds: number): string {
  const totalSeconds = Math.floor(elapsedSeconds);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

function getPlayerSpriteScale(player: PlayerRenderState): number {
  if (player.character === 'henry') {
    if (!player.isMoving) {
      return 5.4;
    }

    if (player.facing === 'up' || player.facing === 'down') {
      return 5.7;
    }

    return 5.25;
  }

  if (!player.isMoving) {
    return 4.6;
  }

  return player.facing === 'up' || player.facing === 'down' ? 6.4 : 4.6;
}
