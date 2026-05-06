export type TimerState = 'idle' | 'running' | 'stopped';

export class Stopwatch {
  private elapsedSeconds = 0;
  private state: TimerState = 'idle';

  start(): void {
    if (this.state === 'idle') {
      this.state = 'running';
    }
  }

  update(deltaSeconds: number): void {
    if (this.state !== 'running') {
      return;
    }

    this.elapsedSeconds += Math.max(0, deltaSeconds);
  }

  stop(): void {
    if (this.state === 'running') {
      this.state = 'stopped';
    }
  }

  reset(): void {
    this.elapsedSeconds = 0;
    this.state = 'idle';
  }

  getElapsedSeconds(): number {
    return this.elapsedSeconds;
  }

  getState(): TimerState {
    return this.state;
  }

  format(): string {
    const totalSeconds = Math.floor(this.elapsedSeconds);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;

    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }
}
