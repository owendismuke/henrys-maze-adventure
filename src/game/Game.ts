import { Collision } from './Collision';
import { gridToWorldCenter } from './Maze';
import { Input } from './Input';
import { MazeGenerator } from './MazeGenerator';
import { Player } from './Player';
import { Renderer } from './Renderer';
import type { Maze } from './types';

const PLAYER_RADIUS_RATIO = 0.24;

export class Game {
  private readonly input = new Input();
  private readonly renderer: Renderer;
  private maze: Maze;
  private player: Player;
  private hasWon = false;
  private animationFrame = 0;
  private lastFrameTime = performance.now();

  constructor(canvas: HTMLCanvasElement) {
    this.renderer = new Renderer(canvas);
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
      },
      player: this.player.circle,
    });
  }

  render = (): void => {
    this.renderer.render({
      maze: this.maze,
      player: this.player.circle,
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
    const movement = this.input.getMovementVector();
    const delta = this.player.getMovementDelta(movement, deltaSeconds);
    this.player.setCircle(
      Collision.moveWithWalls(this.player.circle, this.maze, delta.x, delta.y),
    );
  }

  private createPlayerAtStart(): Player {
    const center = gridToWorldCenter(this.maze.start, this.maze.cellSize);
    return new Player({
      x: center.x,
      y: center.y,
      radius: this.maze.cellSize * PLAYER_RADIUS_RATIO,
    });
  }
}
