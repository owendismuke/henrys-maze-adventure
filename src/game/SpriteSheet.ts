import henrySpriteUrl from '../../sprites/henry.png';
import type { FacingDirection } from './types';

const FRAME_SOURCE_X = 384;
const FRAME_SOURCE_Y = 0;
const FRAME_WIDTH = 224;
const FRAME_HEIGHT = 204;
const FRAME_COLUMNS = [0, 1, 2, 3] as const;
const DARK_BACKGROUND_THRESHOLD = 42;
const EDGE_SAMPLE_PADDING = 2;

const ROW_BY_DIRECTION: Record<FacingDirection | 'standing', number> = {
  standing: 0,
  up: 1,
  down: 2,
  left: 3,
  right: 4,
};

export interface SpriteFrame {
  readonly image: HTMLCanvasElement;
  readonly width: number;
  readonly height: number;
}

export class SpriteSheet {
  private readonly image = new Image();
  private readonly frameCache = new Map<string, SpriteFrame>();
  private isReady = false;

  constructor(private readonly onLoad: () => void) {
    this.image.src = henrySpriteUrl;
    this.image.onload = () => {
      this.isReady = true;
      this.onLoad();
    };
  }

  getFrame(
    direction: FacingDirection,
    isMoving: boolean,
    animationSeconds: number,
  ): SpriteFrame | null {
    if (!this.isReady) {
      return null;
    }

    const row = isMoving ? ROW_BY_DIRECTION[direction] : ROW_BY_DIRECTION.standing;
    const column = isMoving
      ? FRAME_COLUMNS[Math.floor(animationSeconds * 8) % FRAME_COLUMNS.length]
      : FRAME_COLUMNS[0];

    return this.extractFrame(column, row);
  }

  private extractFrame(column: number, row: number): SpriteFrame {
    const cacheKey = `${column},${row}`;
    const cached = this.frameCache.get(cacheKey);
    if (cached) {
      return cached;
    }

    const rawCanvas = document.createElement('canvas');
    rawCanvas.width = FRAME_WIDTH;
    rawCanvas.height = FRAME_HEIGHT;

    const context = rawCanvas.getContext('2d');
    if (!context) {
      throw new Error('Sprite frame canvas context not available.');
    }

    context.drawImage(
      this.image,
      FRAME_SOURCE_X + column * FRAME_WIDTH,
      FRAME_SOURCE_Y + row * FRAME_HEIGHT,
      FRAME_WIDTH,
      FRAME_HEIGHT,
      0,
      0,
      FRAME_WIDTH,
      FRAME_HEIGHT,
    );

    const imageData = context.getImageData(0, 0, FRAME_WIDTH, FRAME_HEIGHT);
    const data = imageData.data;

    for (let index = 0; index < data.length; index += 4) {
      const pixel = index / 4;
      const x = pixel % FRAME_WIDTH;
      const y = Math.floor(pixel / FRAME_WIDTH);
      const red = data[index];
      const green = data[index + 1];
      const blue = data[index + 2];

      if (
        isDarkBackground(red, green, blue) ||
        isFrameEdge(x, y, FRAME_WIDTH, FRAME_HEIGHT)
      ) {
        data[index + 3] = 0;
      }
    }

    context.putImageData(imageData, 0, 0);

    const bounds = findOpaqueBounds(imageData);
    if (bounds) {
      const trimmedCanvas = document.createElement('canvas');
      trimmedCanvas.width = bounds.width;
      trimmedCanvas.height = bounds.height;

      const trimmedContext = trimmedCanvas.getContext('2d');
      if (!trimmedContext) {
        throw new Error('Trimmed sprite frame canvas context not available.');
      }

      trimmedContext.drawImage(
        rawCanvas,
        bounds.x,
        bounds.y,
        bounds.width,
        bounds.height,
        0,
        0,
        bounds.width,
        bounds.height,
      );

      const frame = {
        image: trimmedCanvas,
        width: bounds.width,
        height: bounds.height,
      };
      this.frameCache.set(cacheKey, frame);
      return frame;
    }

    const frame = {
      image: rawCanvas,
      width: FRAME_WIDTH,
      height: FRAME_HEIGHT,
    };
    this.frameCache.set(cacheKey, frame);
    return frame;
  }
}

function isDarkBackground(red: number, green: number, blue: number): boolean {
  return (
    red < DARK_BACKGROUND_THRESHOLD &&
    green < DARK_BACKGROUND_THRESHOLD &&
    blue < DARK_BACKGROUND_THRESHOLD &&
    blue >= red
  );
}

function findOpaqueBounds(imageData: ImageData):
  | { readonly x: number; readonly y: number; readonly width: number; readonly height: number }
  | null {
  let minX = imageData.width;
  let minY = imageData.height;
  let maxX = -1;
  let maxY = -1;

  for (let index = 0; index < imageData.data.length; index += 4) {
    if (imageData.data[index + 3] === 0) {
      continue;
    }

    const pixel = index / 4;
    const x = pixel % imageData.width;
    const y = Math.floor(pixel / imageData.width);
    minX = Math.min(minX, x);
    minY = Math.min(minY, y);
    maxX = Math.max(maxX, x);
    maxY = Math.max(maxY, y);
  }

  if (maxX < minX || maxY < minY) {
    return null;
  }

  return {
    x: minX,
    y: minY,
    width: maxX - minX + 1,
    height: maxY - minY + 1,
  };
}

function isFrameEdge(x: number, y: number, width: number, height: number): boolean {
  return (
    x < EDGE_SAMPLE_PADDING ||
    y < EDGE_SAMPLE_PADDING ||
    x >= width - EDGE_SAMPLE_PADDING ||
    y >= height - EDGE_SAMPLE_PADDING
  );
}
