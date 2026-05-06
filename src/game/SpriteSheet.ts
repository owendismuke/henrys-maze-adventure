import henrySpriteUrl from '../../sprites/henry.png';
import tofuSpriteUrl from '../../sprites/tofu.png';
import type { CharacterId, FacingDirection } from './types';

const FRAME_COLUMNS = [0, 1, 2, 3] as const;
const DARK_BACKGROUND_THRESHOLD = 42;
const EDGE_SAMPLE_PADDING = 2;
const EDGE_BACKGROUND_TOLERANCE = 58;

const ROW_BY_DIRECTION: Record<FacingDirection | 'standing', number> = {
  standing: 0,
  up: 1,
  down: 2,
  left: 3,
  right: 4,
};

type BackgroundRemoval = 'dark' | 'edge-connected';

interface SpriteSheetConfig {
  readonly url: string;
  readonly sourceX: number;
  readonly sourceY: number;
  readonly frameWidth: number;
  readonly frameHeight: number;
  readonly frameStrideX?: number;
  readonly columnSourceXs?: readonly number[];
  readonly rowColumnSourceXs?: readonly (readonly number[] | undefined)[];
  readonly rowSourceYs?: readonly number[];
  readonly backgroundRemoval: BackgroundRemoval;
}

const CHARACTER_SHEETS: Record<CharacterId, SpriteSheetConfig> = {
  henry: {
    url: henrySpriteUrl,
    sourceX: 384,
    sourceY: 0,
    frameWidth: 224,
    frameHeight: 204,
    rowSourceYs: [0, 204, 400, 580, 760],
    backgroundRemoval: 'dark',
  },
  tofu: {
    url: tofuSpriteUrl,
    sourceX: 256,
    sourceY: 0,
    frameWidth: 224,
    frameHeight: 204,
    columnSourceXs: [256, 544, 832, 1088],
    rowColumnSourceXs: [[304, 544, 832, 1088]],
    backgroundRemoval: 'edge-connected',
  },
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

  constructor(
    private readonly config: SpriteSheetConfig,
    private readonly onLoad: () => void,
  ) {
    this.image.src = config.url;
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
    rawCanvas.width = this.config.frameWidth;
    rawCanvas.height = this.config.frameHeight;

    const context = rawCanvas.getContext('2d');
    if (!context) {
      throw new Error('Sprite frame canvas context not available.');
    }

    context.drawImage(
      this.image,
      this.getSourceX(column, row),
      this.getSourceY(row),
      this.config.frameWidth,
      this.config.frameHeight,
      0,
      0,
      this.config.frameWidth,
      this.config.frameHeight,
    );

    const imageData = context.getImageData(0, 0, this.config.frameWidth, this.config.frameHeight);
    removeBackground(imageData, this.config.backgroundRemoval);
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
      width: this.config.frameWidth,
      height: this.config.frameHeight,
    };
    this.frameCache.set(cacheKey, frame);
    return frame;
  }

  private getSourceX(column: number, row: number): number {
    return (
      this.config.rowColumnSourceXs?.[row]?.[column] ??
      this.config.columnSourceXs?.[column] ??
      this.config.sourceX + column * (this.config.frameStrideX ?? this.config.frameWidth)
    );
  }

  private getSourceY(row: number): number {
    return this.config.rowSourceYs?.[row] ?? this.config.sourceY + row * this.config.frameHeight;
  }
}

export function createCharacterSpriteSheets(onLoad: () => void): Record<CharacterId, SpriteSheet> {
  return {
    henry: new SpriteSheet(CHARACTER_SHEETS.henry, onLoad),
    tofu: new SpriteSheet(CHARACTER_SHEETS.tofu, onLoad),
  };
}

function removeBackground(imageData: ImageData, mode: BackgroundRemoval): void {
  if (mode === 'dark') {
    removeDarkBackground(imageData);
    removeSmallOpaqueComponents(imageData);
    return;
  }

  removeEdgeConnectedBackground(imageData);
  removeSmallOpaqueComponents(imageData);
}

function removeDarkBackground(imageData: ImageData): void {
  const data = imageData.data;

  for (let index = 0; index < data.length; index += 4) {
    const pixel = index / 4;
    const x = pixel % imageData.width;
    const y = Math.floor(pixel / imageData.width);
    const red = data[index];
    const green = data[index + 1];
    const blue = data[index + 2];

    if (isDarkBackground(red, green, blue) || isFrameEdge(x, y, imageData.width, imageData.height)) {
      data[index + 3] = 0;
    }
  }
}

function removeEdgeConnectedBackground(imageData: ImageData): void {
  const data = imageData.data;
  const visited = new Uint8Array(imageData.width * imageData.height);
  const queue: number[] = [];

  for (let x = 0; x < imageData.width; x += 1) {
    queue.push(x, (imageData.height - 1) * imageData.width + x);
  }

  for (let y = 1; y < imageData.height - 1; y += 1) {
    queue.push(y * imageData.width, y * imageData.width + imageData.width - 1);
  }

  for (let index = 0; index < queue.length; index += 1) {
    const pixel = queue[index];
    if (visited[pixel] === 1) {
      continue;
    }

    visited[pixel] = 1;
    const dataIndex = pixel * 4;

    if (!looksLikePaintedBackground(data, dataIndex)) {
      continue;
    }

    data[dataIndex + 3] = 0;
    const x = pixel % imageData.width;
    const y = Math.floor(pixel / imageData.width);

    if (x > 0) {
      queue.push(pixel - 1);
    }
    if (x < imageData.width - 1) {
      queue.push(pixel + 1);
    }
    if (y > 0) {
      queue.push(pixel - imageData.width);
    }
    if (y < imageData.height - 1) {
      queue.push(pixel + imageData.width);
    }
  }
}

function looksLikePaintedBackground(data: Uint8ClampedArray, index: number): boolean {
  const red = data[index];
  const green = data[index + 1];
  const blue = data[index + 2];
  const alpha = data[index + 3];
  const max = Math.max(red, green, blue);
  const min = Math.min(red, green, blue);

  return (
    alpha > 0 &&
    max < 190 &&
    max - min < EDGE_BACKGROUND_TOLERANCE &&
    red > 65 &&
    green > 55 &&
    blue > 45
  );
}

function removeSmallOpaqueComponents(imageData: ImageData): void {
  const minComponentPixels = 90;
  const rightArtifactStart = Math.floor(imageData.width * 0.62);
  const labelBottom = Math.floor(imageData.height * 0.34);
  const data = imageData.data;
  const visited = new Uint8Array(imageData.width * imageData.height);

  for (let pixel = 0; pixel < visited.length; pixel += 1) {
    if (visited[pixel] === 1 || data[pixel * 4 + 3] === 0) {
      continue;
    }

    const component = collectOpaqueComponent(imageData, visited, pixel);
    if (
      component.pixels.length < minComponentPixels ||
      component.minX > rightArtifactStart ||
      (component.maxY < labelBottom && component.height < 36) ||
      (component.height < 36 && component.averageBrightness < 90)
    ) {
      for (const componentPixel of component.pixels) {
        data[componentPixel * 4 + 3] = 0;
      }
    }
  }
}

function collectOpaqueComponent(
  imageData: ImageData,
  visited: Uint8Array,
  startPixel: number,
): {
  readonly pixels: number[];
  readonly minX: number;
  readonly maxY: number;
  readonly height: number;
  readonly averageBrightness: number;
} {
  const pixels: number[] = [];
  const queue = [startPixel];
  let minX = imageData.width;
  let minY = imageData.height;
  let maxY = -1;
  let brightness = 0;

  for (let index = 0; index < queue.length; index += 1) {
    const pixel = queue[index];
    if (visited[pixel] === 1 || imageData.data[pixel * 4 + 3] === 0) {
      continue;
    }

    visited[pixel] = 1;
    pixels.push(pixel);
    const dataIndex = pixel * 4;
    brightness += Math.max(
      imageData.data[dataIndex],
      imageData.data[dataIndex + 1],
      imageData.data[dataIndex + 2],
    );
    const x = pixel % imageData.width;
    const y = Math.floor(pixel / imageData.width);
    minX = Math.min(minX, x);
    minY = Math.min(minY, y);
    maxY = Math.max(maxY, y);

    if (x > 0) {
      queue.push(pixel - 1);
    }
    if (x < imageData.width - 1) {
      queue.push(pixel + 1);
    }
    if (y > 0) {
      queue.push(pixel - imageData.width);
    }
    if (y < imageData.height - 1) {
      queue.push(pixel + imageData.width);
    }
  }

  return {
    pixels,
    minX,
    maxY,
    height: maxY - minY + 1,
    averageBrightness: brightness / pixels.length,
  };
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
