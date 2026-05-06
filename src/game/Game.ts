import { gridToWorldCenter } from './Maze';
import { MazeGenerator } from './MazeGenerator';
import { Renderer } from './Renderer';
import type { Circle, Maze } from './types';

const PLAYER_RADIUS_RATIO = 0.24;

export class Game {
  private readonly renderer: Renderer;
  private maze: Maze;
  private player: Circle;
  private hasWon = false;
  private animationFrame = 0;
  private lastFrameTime = performance.now();

  constructor(canvas: HTMLCanvasElement) {
    this.renderer = new Renderer(canvas);
    this.maze = new MazeGenerator().generate();
    this.player = this.createPlayerAtStart();
  }

  start(): void {
    this.render();
    this.animationFrame = window.requestAnimationFrame(this.tick);
    window.addEventListener('resize', this.render);
  }

  stop(): void {
    window.cancelAnimationFrame(this.animationFrame);
    window.removeEventListener('resize', this.render);
  }

  render = (): void => {
    this.renderer.render({
      maze: this.maze,
      player: this.player,
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

  private update(_deltaSeconds: number): void {
    // Movement and collision are added in later implementation commits.
  }

  private createPlayerAtStart(): Circle {
    const center = gridToWorldCenter(this.maze.start, this.maze.cellSize);
    return {
      x: center.x,
      y: center.y,
      radius: this.maze.cellSize * PLAYER_RADIUS_RATIO,
    };
  }
}
