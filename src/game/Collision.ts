import { WALL } from './Maze';
import type { Circle, Maze, Rect } from './types';

export class Collision {
  static moveWithWalls(circle: Circle, maze: Maze, deltaX: number, deltaY: number): Circle {
    const afterX = this.moveSingleAxis(circle, maze, deltaX, 0);
    return this.moveSingleAxis(afterX, maze, 0, deltaY);
  }

  static collidesWithWalls(circle: Circle, maze: Maze): boolean {
    if (
      circle.x - circle.radius < 0 ||
      circle.y - circle.radius < 0 ||
      circle.x + circle.radius > maze.width * maze.cellSize ||
      circle.y + circle.radius > maze.height * maze.cellSize
    ) {
      return true;
    }

    for (const rect of this.nearbyWallRects(circle, maze)) {
      if (circleIntersectsRect(circle, rect)) {
        return true;
      }
    }

    return false;
  }

  private static moveSingleAxis(
    circle: Circle,
    maze: Maze,
    deltaX: number,
    deltaY: number,
  ): Circle {
    if (deltaX === 0 && deltaY === 0) {
      return circle;
    }

    const moved = {
      ...circle,
      x: circle.x + deltaX,
      y: circle.y + deltaY,
    };

    // Axis-separated movement lets a blocked diagonal attempt keep the open
    // component, which produces simple wall sliding without extra physics.
    return this.collidesWithWalls(moved, maze) ? circle : moved;
  }

  private static nearbyWallRects(circle: Circle, maze: Maze): Rect[] {
    const minX = Math.max(0, Math.floor((circle.x - circle.radius) / maze.cellSize) - 1);
    const maxX = Math.min(
      maze.width - 1,
      Math.floor((circle.x + circle.radius) / maze.cellSize) + 1,
    );
    const minY = Math.max(0, Math.floor((circle.y - circle.radius) / maze.cellSize) - 1);
    const maxY = Math.min(
      maze.height - 1,
      Math.floor((circle.y + circle.radius) / maze.cellSize) + 1,
    );
    const rects: Rect[] = [];

    for (let y = minY; y <= maxY; y += 1) {
      for (let x = minX; x <= maxX; x += 1) {
        if (maze.tiles[y][x] === WALL) {
          rects.push({
            x: x * maze.cellSize,
            y: y * maze.cellSize,
            width: maze.cellSize,
            height: maze.cellSize,
          });
        }
      }
    }

    return rects;
  }
}

export function circleIntersectsRect(circle: Circle, rect: Rect): boolean {
  const closestX = clamp(circle.x, rect.x, rect.x + rect.width);
  const closestY = clamp(circle.y, rect.y, rect.y + rect.height);
  const distanceX = circle.x - closestX;
  const distanceY = circle.y - closestY;

  return distanceX * distanceX + distanceY * distanceY < circle.radius * circle.radius;
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}
