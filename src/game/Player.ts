import type { Circle, GridPoint } from './types';

export const PLAYER_SPEED_PIXELS_PER_SECOND = 150;

export class Player {
  constructor(public circle: Circle) {}

  move(vector: GridPoint, deltaSeconds: number): void {
    this.circle = {
      ...this.circle,
      x: this.circle.x + vector.x * PLAYER_SPEED_PIXELS_PER_SECOND * deltaSeconds,
      y: this.circle.y + vector.y * PLAYER_SPEED_PIXELS_PER_SECOND * deltaSeconds,
    };
  }
}
