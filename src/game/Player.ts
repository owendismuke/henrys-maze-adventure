import type { Circle, GridPoint } from './types';

export const PLAYER_SPEED_PIXELS_PER_SECOND = 150;

export class Player {
  constructor(public circle: Circle) {}

  getMovementDelta(vector: GridPoint, deltaSeconds: number): GridPoint {
    return {
      x: vector.x * PLAYER_SPEED_PIXELS_PER_SECOND * deltaSeconds,
      y: vector.y * PLAYER_SPEED_PIXELS_PER_SECOND * deltaSeconds,
    };
  }

  moveBy(delta: GridPoint): void {
    this.circle = {
      ...this.circle,
      x: this.circle.x + delta.x,
      y: this.circle.y + delta.y,
    };
  }

  setCircle(circle: Circle): void {
    this.circle = circle;
  }
}
