import { describe, expect, it } from 'vitest';
import { Stopwatch } from './Stopwatch';

describe('Stopwatch', () => {
  it('starts idle at zero', () => {
    const stopwatch = new Stopwatch();

    expect(stopwatch.getState()).toBe('idle');
    expect(stopwatch.getElapsedSeconds()).toBe(0);
    expect(stopwatch.format()).toBe('00:00');
  });

  it('does not advance before first movement starts it', () => {
    const stopwatch = new Stopwatch();

    stopwatch.update(12);

    expect(stopwatch.getState()).toBe('idle');
    expect(stopwatch.getElapsedSeconds()).toBe(0);
  });

  it('advances while running', () => {
    const stopwatch = new Stopwatch();

    stopwatch.start();
    stopwatch.update(62.7);

    expect(stopwatch.getState()).toBe('running');
    expect(stopwatch.format()).toBe('01:02');
  });

  it('freezes after stopping', () => {
    const stopwatch = new Stopwatch();

    stopwatch.start();
    stopwatch.update(5);
    stopwatch.stop();
    stopwatch.update(20);

    expect(stopwatch.getState()).toBe('stopped');
    expect(stopwatch.format()).toBe('00:05');
  });

  it('resets to idle zero', () => {
    const stopwatch = new Stopwatch();

    stopwatch.start();
    stopwatch.update(9);
    stopwatch.stop();
    stopwatch.reset();

    expect(stopwatch.getState()).toBe('idle');
    expect(stopwatch.getElapsedSeconds()).toBe(0);
    expect(stopwatch.format()).toBe('00:00');
  });
});
