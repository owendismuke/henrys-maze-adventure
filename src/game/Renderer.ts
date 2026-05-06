import { gridToWorldCenter, mazePixelHeight, mazePixelWidth } from './Maze';
import { createCharacterSpriteSheets, type SpriteSheet } from './SpriteSheet';
import type { CharacterId, Maze, PlayerRenderState } from './types';

export interface RenderState {
  readonly maze: Maze;
  readonly player: PlayerRenderState;
  readonly hasWon: boolean;
}

const COLORS = {
  background: '#000000',
  wall: '#ffffff',
  goal: '#20c763',
  text: '#ffffff',
} as const;

export class Renderer {
  private readonly context: CanvasRenderingContext2D;
  private readonly playerSprites: Record<CharacterId, SpriteSheet>;
  private boardOffsetX = 0;
  private boardOffsetY = 0;

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

  render(state: RenderState): void {
    this.resizeCanvas();
    this.computeBoardOffset(state.maze);
    this.drawBackground();
    this.drawMaze(state.maze);
    this.drawGoal(state.maze);
    this.drawPlayer(state.player);

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
    this.boardOffsetX = Math.floor((this.canvas.width - mazePixelWidth(maze)) / 2);
    this.boardOffsetY = Math.floor((this.canvas.height - mazePixelHeight(maze)) / 2);
  }

  private drawBackground(): void {
    this.context.fillStyle = COLORS.background;
    this.context.fillRect(0, 0, this.canvas.width, this.canvas.height);
  }

  private drawMaze(maze: Maze): void {
    this.context.fillStyle = COLORS.wall;

    for (let y = 0; y < maze.height; y += 1) {
      for (let x = 0; x < maze.width; x += 1) {
        if (maze.tiles[y][x] === 1) {
          this.context.fillRect(
            this.boardOffsetX + x * maze.cellSize,
            this.boardOffsetY + y * maze.cellSize,
            maze.cellSize,
            maze.cellSize,
          );
        }
      }
    }
  }

  private drawGoal(maze: Maze): void {
    const center = gridToWorldCenter(maze.goal, maze.cellSize);
    this.context.fillStyle = COLORS.goal;
    this.context.beginPath();
    this.context.arc(
      this.boardOffsetX + center.x,
      this.boardOffsetY + center.y,
      maze.cellSize * 0.28,
      0,
      Math.PI * 2,
    );
    this.context.fill();
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

    const targetHeight = player.radius * getPlayerSpriteScale(player);
    const targetWidth = targetHeight * (frame.width / frame.height);

    this.context.imageSmoothingEnabled = false;
    this.context.drawImage(
      frame.image,
      this.boardOffsetX + player.x - targetWidth / 2,
      this.boardOffsetY + player.y - targetHeight * 0.72,
      targetWidth,
      targetHeight,
    );
  }

  private drawWinOverlay(maze: Maze): void {
    const boardWidth = mazePixelWidth(maze);
    const boardHeight = mazePixelHeight(maze);
    const centerX = this.boardOffsetX + boardWidth / 2;
    const centerY = this.boardOffsetY + boardHeight / 2;

    this.context.fillStyle = COLORS.text;
    this.context.textAlign = 'center';
    this.context.textBaseline = 'middle';
    this.context.font = '700 34px system-ui, sans-serif';
    this.context.fillText('You win!', centerX, centerY - 18);
    this.context.font = '500 16px system-ui, sans-serif';
    this.context.fillText('Press R or Enter to restart', centerX, centerY + 24);
  }
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
