import type { GridPoint } from './types';

const MOVEMENT_KEYS = new Map<string, GridPoint>([
  ['KeyW', { x: 0, y: -1 }],
  ['ArrowUp', { x: 0, y: -1 }],
  ['KeyA', { x: -1, y: 0 }],
  ['ArrowLeft', { x: -1, y: 0 }],
  ['KeyS', { x: 0, y: 1 }],
  ['ArrowDown', { x: 0, y: 1 }],
  ['KeyD', { x: 1, y: 0 }],
  ['ArrowRight', { x: 1, y: 0 }],
]);

const RESTART_KEYS = new Set(['KeyR', 'Enter']);

export class Input {
  private readonly pressed = new Set<string>();
  private restartQueued = false;

  start(): void {
    window.addEventListener('keydown', this.handleKeyDown);
    window.addEventListener('keyup', this.handleKeyUp);
    window.addEventListener('blur', this.clear);
  }

  stop(): void {
    window.removeEventListener('keydown', this.handleKeyDown);
    window.removeEventListener('keyup', this.handleKeyUp);
    window.removeEventListener('blur', this.clear);
  }

  getMovementVector(): GridPoint {
    const vector = { x: 0, y: 0 };

    for (const code of this.pressed) {
      const movement = MOVEMENT_KEYS.get(code);
      if (!movement) {
        continue;
      }

      vector.x += movement.x;
      vector.y += movement.y;
    }

    const length = Math.hypot(vector.x, vector.y);
    if (length > 0) {
      vector.x /= length;
      vector.y /= length;
    }

    return vector;
  }

  consumeRestart(): boolean {
    const queued = this.restartQueued;
    this.restartQueued = false;
    return queued;
  }

  private readonly handleKeyDown = (event: KeyboardEvent): void => {
    if (MOVEMENT_KEYS.has(event.code)) {
      event.preventDefault();
      this.pressed.add(event.code);
    }

    if (RESTART_KEYS.has(event.code)) {
      this.restartQueued = true;
    }
  };

  private readonly handleKeyUp = (event: KeyboardEvent): void => {
    if (MOVEMENT_KEYS.has(event.code)) {
      event.preventDefault();
      this.pressed.delete(event.code);
    }
  };

  private readonly clear = (): void => {
    this.pressed.clear();
  };
}
