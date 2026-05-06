import { Collision } from './Collision';
import { gridToWorldCenter } from './Maze';
import { Input } from './Input';
import { MazeGenerator } from './MazeGenerator';
import { Player } from './Player';
import { Renderer } from './Renderer';
import type { CharacterId, FacingDirection, Maze } from './types';

const PLAYER_RADIUS_RATIO = 0.24;
const GOAL_RADIUS_RATIO = 0.28;

export interface GameStateSnapshot {
  readonly hasWon: boolean;
}

export class Game {
  private readonly input = new Input();
  private readonly renderer: Renderer;
  private maze: Maze;
  private player: Player;
  private selectedCharacter: CharacterId = 'henry';
  private playerFacing: FacingDirection = 'down';
  private playerIsMoving = false;
  private animationSeconds = 0;
  private hasWon = false;
  private animationFrame = 0;
  private lastFrameTime = performance.now();

  constructor(
    canvas: HTMLCanvasElement,
    private readonly onStateChange: (snapshot: GameStateSnapshot) => void = () => undefined,
  ) {
    this.renderer = new Renderer(canvas, this.render);
    this.maze = new MazeGenerator().generate();
    this.player = this.createPlayerAtStart();
  }

  start(): void {
    this.input.start();
    this.render();
    this.animationFrame = window.requestAnimationFrame(this.tick);
    window.addEventListener('resize', this.render);
  }

  stop(): void {
    this.input.stop();
    window.cancelAnimationFrame(this.animationFrame);
    window.removeEventListener('resize', this.render);
  }

  advanceTime(milliseconds: number): void {
    const steps = Math.max(1, Math.round(milliseconds / (1000 / 60)));

    for (let step = 0; step < steps; step += 1) {
      this.update(1 / 60);
    }

    this.render();
  }

  renderGameToText(): string {
    return JSON.stringify({
      coordinateSystem: 'world pixels, origin top-left of maze, x right, y down',
      hasWon: this.hasWon,
      maze: {
        width: this.maze.width,
        height: this.maze.height,
        cellSize: this.maze.cellSize,
        start: this.maze.start,
        goal: this.maze.goal,
        tiles: this.maze.tiles,
      },
      player: {
        ...this.player.circle,
        character: this.selectedCharacter,
      },
    });
  }

  render = (): void => {
    this.renderer.render({
      maze: this.maze,
      player: {
        ...this.player.circle,
        character: this.selectedCharacter,
        facing: this.playerFacing,
        isMoving: this.playerIsMoving,
        animationSeconds: this.animationSeconds,
      },
      hasWon: this.hasWon,
    });
  };

  private readonly tick = (time: number): void => {
    const deltaSeconds = Math.min((time - this.lastFrameTime) / 1000, 0.05);
    this.lastFrameTime = time;
    this.update(deltaSeconds);
    this.render();
    this.animationFrame = window.requestAnimationFrame(this.tick);
  };

  private update(deltaSeconds: number): void {
    if (this.hasWon) {
      if (this.input.consumeRestart()) {
        this.restart();
      }
      return;
    }

    this.input.consumeRestart();
    const movement = this.input.getMovementVector();
    this.playerIsMoving = Math.hypot(movement.x, movement.y) > 0;

    if (this.playerIsMoving) {
      this.playerFacing = getFacingDirection(movement, this.playerFacing);
      this.animationSeconds += deltaSeconds;
    }

    const delta = this.player.getMovementDelta(movement, deltaSeconds);
    this.player.setCircle(
      Collision.moveWithWalls(this.player.circle, this.maze, delta.x, delta.y),
    );
    this.checkWin();
  }

  private createPlayerAtStart(): Player {
    const center = gridToWorldCenter(this.maze.start, this.maze.cellSize);
    return new Player({
      x: center.x,
      y: center.y,
      radius: this.maze.cellSize * PLAYER_RADIUS_RATIO,
    });
  }

  restart(): void {
    this.maze = new MazeGenerator().generate();
    this.player = this.createPlayerAtStart();
    this.playerFacing = 'down';
    this.playerIsMoving = false;
    this.animationSeconds = 0;
    this.setWon(false);
    this.render();
  }

  setCharacter(character: CharacterId): void {
    this.selectedCharacter = character;
    this.render();
  }

  private checkWin(): void {
    const goalCenter = gridToWorldCenter(this.maze.goal, this.maze.cellSize);
    const goalRadius = this.maze.cellSize * GOAL_RADIUS_RATIO;
    const distance = Math.hypot(
      this.player.circle.x - goalCenter.x,
      this.player.circle.y - goalCenter.y,
    );

    if (distance <= this.player.circle.radius + goalRadius) {
      this.setWon(true);
    }
  }

  private setWon(hasWon: boolean): void {
    if (this.hasWon === hasWon) {
      return;
    }

    this.hasWon = hasWon;
    this.onStateChange({ hasWon });
  }
}

function getFacingDirection(
  movement: { readonly x: number; readonly y: number },
  current: FacingDirection,
): FacingDirection {
  if (Math.abs(movement.x) > Math.abs(movement.y)) {
    return movement.x > 0 ? 'right' : 'left';
  }

  if (Math.abs(movement.y) > 0) {
    return movement.y > 0 ? 'down' : 'up';
  }

  return current;
}
