import { gridToWorldCenter, mazePixelHeight, mazePixelWidth } from './Maze';
import type { MazeThemeId } from './MainSpriteAtlas';
import {
  drawCatBowl,
  getFloorTile,
  getIceCreamTile,
  getWallOpenMask,
  getWallTile,
} from './MazeTiles';
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
  background: '#0a0e1f',
} as const;
const HUD_RESERVED_HEIGHT = 116;
const MIN_BOARD_BOTTOM_PADDING = 56;
const MIN_BOARD_SIDE_PADDING = 24;
const MAX_RESPONSIVE_SCALE = 1.65;
const DOOR_SIZE_RATIO = 1.7;
const DOOR_TOP_GAP = 4;

export class Renderer {
  private readonly context: CanvasRenderingContext2D;
  private readonly playerSprites: Record<CharacterId, SpriteSheet>;
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
  }

  getPortraitDataUrl(character: CharacterId): string | null {
    const frame = this.playerSprites[character].getFrame('down', false, 0);
    if (!frame) return null;
    return frame.image.toDataURL();
  }

  render(state: RenderState): void {
    this.resizeCanvas();
    this.computeBoardOffset(state.maze);
    this.drawBackground();
    this.drawMaze(state.maze, state.mazeTheme);
    this.drawGoal(state.maze, state.player.character);
    this.drawPlayer(state.player);
  }

  private resizeCanvas(): void {
    const cssWidth = Math.max(320, this.canvas.clientWidth || window.innerWidth);
    const cssHeight = Math.max(320, this.canvas.clientHeight || window.innerHeight);
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    const width = Math.floor(cssWidth * ratio);
    const height = Math.floor(cssHeight * ratio);

    if (this.canvas.width !== width || this.canvas.height !== height) {
      this.canvas.width = width;
      this.canvas.height = height;
    }
    this.context.setTransform(ratio, 0, 0, ratio, 0, 0);
  }

  private computeBoardOffset(maze: Maze): void {
    const mazeWidth = mazePixelWidth(maze);
    const mazeHeight = mazePixelHeight(maze);
    const doorHeight = maze.cellSize * DOOR_SIZE_RATIO;
    const visualHeight = mazeHeight + DOOR_TOP_GAP + doorHeight;
    const cssWidth = this.canvas.clientWidth || this.canvas.width;
    const cssHeight = this.canvas.clientHeight || this.canvas.height;
    const availableHeight = Math.max(
      1,
      cssHeight - HUD_RESERVED_HEIGHT - MIN_BOARD_BOTTOM_PADDING,
    );
    const availableWidth = Math.max(1, cssWidth - MIN_BOARD_SIDE_PADDING * 2);

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
    this.boardOffsetX = Math.floor((cssWidth - scaledWidth) / 2);
    this.boardOffsetY = Math.floor(
      HUD_RESERVED_HEIGHT + Math.max(0, (availableHeight - scaledHeight) / 2),
    );
  }

  private drawBackground(): void {
    const cssWidth = this.canvas.clientWidth || this.canvas.width;
    const cssHeight = this.canvas.clientHeight || this.canvas.height;
    this.context.fillStyle = COLORS.background;
    this.context.fillRect(0, 0, cssWidth, cssHeight);
  }

  private drawMaze(maze: Maze, mazeTheme: MazeThemeId): void {
    this.context.imageSmoothingEnabled = false;
    const floorTile = getFloorTile(mazeTheme);
    const tileSize = this.toCanvasSize(maze.cellSize);
    const isWall = (x: number, y: number): boolean => isWallTile(maze, x, y);

    for (let y = 0; y < maze.height; y += 1) {
      for (let x = 0; x < maze.width; x += 1) {
        if (maze.tiles[y][x] === 0) {
          this.context.drawImage(
            floorTile,
            this.toCanvasX(x * maze.cellSize),
            this.toCanvasY(y * maze.cellSize),
            tileSize,
            tileSize,
          );
        }
      }
    }

    for (let y = 0; y < maze.height; y += 1) {
      for (let x = 0; x < maze.width; x += 1) {
        if (maze.tiles[y][x] === 1) {
          const wallTile = getWallTile(mazeTheme, getWallOpenMask(isWall, x, y));
          this.context.drawImage(
            wallTile,
            this.toCanvasX(x * maze.cellSize),
            this.toCanvasY(y * maze.cellSize),
            tileSize,
            tileSize,
          );
        }
      }
    }
  }

  private drawGoal(maze: Maze, character: CharacterId): void {
    const center = gridToWorldCenter(maze.goal, maze.cellSize);
    const centerX = this.toCanvasX(center.x);
    const topY = this.toCanvasY(mazePixelHeight(maze) + DOOR_TOP_GAP);
    const size = this.toCanvasSize(maze.cellSize * DOOR_SIZE_RATIO);

    this.context.imageSmoothingEnabled = false;
    if (character === 'henry') {
      const tile = getIceCreamTile();
      const width = size;
      const height = size * (24 / 16);
      this.context.drawImage(tile, centerX - width / 2, topY, width, height);
    } else {
      drawCatBowl(this.context, centerX, topY, size);
    }
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

function isWallTile(maze: Maze, x: number, y: number): boolean {
  if (x < 0 || y < 0 || x >= maze.width || y >= maze.height) {
    return false;
  }

  return maze.tiles[y][x] === 1;
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
