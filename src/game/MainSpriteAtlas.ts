import mainSpriteUrl from '../../sprites/main.png';

interface Crop {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
}

export type WallSpriteKind = 'vertical' | 'horizontal' | 'corner' | 't' | 'cross' | 'solid';

const DARK_BACKGROUND_THRESHOLD = 44;
const BLUE_BACKGROUND_MARGIN = 24;

const CROPS = {
  dirtFloor: { x: 665, y: 446, width: 76, height: 73 },
  grassWallSolid: { x: 62, y: 486, width: 24, height: 74 },
  grassWallVertical: { x: 62, y: 486, width: 24, height: 74 },
  grassWallHorizontal: { x: 164, y: 487, width: 124, height: 30 },
  grassWallCorner: { x: 304, y: 486, width: 54, height: 70 },
  grassWallT: { x: 466, y: 486, width: 50, height: 70 },
  grassWallCross: { x: 592, y: 486, width: 54, height: 70 },
  door: { x: 668, y: 1392, width: 50, height: 48 },
  timerPanel: { x: 678, y: 1446, width: 112, height: 42 },
} as const satisfies Record<string, Crop>;

const DIGIT_CROPS: Record<string, Crop> = {
  '0': { x: 18, y: 100, width: 38, height: 55 },
  '1': { x: 70, y: 100, width: 34, height: 55 },
  '2': { x: 118, y: 100, width: 38, height: 55 },
  '3': { x: 170, y: 100, width: 38, height: 55 },
  '4': { x: 218, y: 100, width: 38, height: 55 },
  '5': { x: 18, y: 171, width: 38, height: 55 },
  '6': { x: 70, y: 171, width: 38, height: 55 },
  '7': { x: 118, y: 171, width: 38, height: 55 },
  '8': { x: 170, y: 171, width: 38, height: 55 },
  '9': { x: 218, y: 171, width: 38, height: 55 },
  ':': { x: 258, y: 133, width: 24, height: 24 },
};

const LETTER_CROPS: Record<string, Crop> = {
  A: { x: 318, y: 98, width: 34, height: 44 },
  B: { x: 357, y: 98, width: 34, height: 44 },
  C: { x: 396, y: 98, width: 34, height: 44 },
  D: { x: 435, y: 98, width: 34, height: 44 },
  E: { x: 474, y: 98, width: 34, height: 44 },
  F: { x: 513, y: 98, width: 34, height: 44 },
  G: { x: 552, y: 98, width: 34, height: 44 },
  H: { x: 591, y: 98, width: 34, height: 44 },
  I: { x: 630, y: 98, width: 28, height: 44 },
  J: { x: 318, y: 151, width: 34, height: 44 },
  K: { x: 357, y: 151, width: 34, height: 44 },
  L: { x: 396, y: 151, width: 34, height: 44 },
  M: { x: 435, y: 151, width: 34, height: 44 },
  N: { x: 474, y: 151, width: 34, height: 44 },
  O: { x: 513, y: 151, width: 34, height: 44 },
  P: { x: 552, y: 151, width: 34, height: 44 },
  Q: { x: 591, y: 151, width: 34, height: 44 },
  R: { x: 630, y: 151, width: 34, height: 44 },
  S: { x: 318, y: 204, width: 34, height: 44 },
  T: { x: 357, y: 204, width: 34, height: 44 },
  U: { x: 396, y: 204, width: 34, height: 44 },
  V: { x: 435, y: 204, width: 34, height: 44 },
  W: { x: 474, y: 204, width: 34, height: 44 },
  X: { x: 513, y: 204, width: 34, height: 44 },
  Y: { x: 552, y: 204, width: 34, height: 44 },
  Z: { x: 591, y: 204, width: 34, height: 44 },
};

export class MainSpriteAtlas {
  private readonly image = new Image();
  private readonly cache = new Map<string, HTMLCanvasElement>();
  private isReady = false;

  constructor(private readonly onLoad: () => void) {
    this.image.src = mainSpriteUrl;
    this.image.onload = () => {
      this.isReady = true;
      this.onLoad();
    };
  }

  drawFloor(context: CanvasRenderingContext2D, x: number, y: number, size: number): void {
    this.drawRaw(context, 'dirtFloor', CROPS.dirtFloor, x, y, size, size);
  }

  drawWall(
    context: CanvasRenderingContext2D,
    kind: WallSpriteKind,
    rotationRadians: number,
    x: number,
    y: number,
    size: number,
  ): void {
    const crop = getWallCrop(kind);
    this.drawCutout(context, `wall-${kind}`, crop, x, y, size, size, rotationRadians);
  }

  drawDoor(context: CanvasRenderingContext2D, centerX: number, centerY: number, size: number): void {
    this.drawCutout(
      context,
      'door',
      CROPS.door,
      centerX - size / 2,
      centerY - size * 0.78,
      size,
      size,
    );
  }

  drawTimerPanel(context: CanvasRenderingContext2D, centerX: number, y: number, text: string): void {
    const panelWidth = 128;
    const panelHeight = 48;
    const x = centerX - panelWidth / 2;
    this.drawRaw(context, 'timerPanel', CROPS.timerPanel, x, y, panelWidth, panelHeight);
    context.fillStyle = '#0f2657';
    context.fillRect(x + 37, y + 20, 56, 18);
    this.drawDigits(context, text, centerX, y + 22, 0.36);
  }

  drawWinText(context: CanvasRenderingContext2D, centerX: number, centerY: number): void {
    context.fillStyle = 'rgba(0, 0, 0, 0.68)';
    context.fillRect(centerX - 146, centerY - 46, 292, 86);
    this.drawText(context, 'YOU WIN', centerX, centerY - 34, 0.9);
    this.drawText(context, 'PRESS R ENTER', centerX, centerY + 12, 0.54);
  }

  private drawDigits(
    context: CanvasRenderingContext2D,
    text: string,
    centerX: number,
    y: number,
    scale: number,
  ): void {
    const widths = [...text].map((character) => {
      const crop = DIGIT_CROPS[character];
      return character === ':' ? 16 * scale : crop ? crop.width * scale : 10 * scale;
    });
    const totalWidth = widths.reduce((total, width) => total + width, 0);
    let x = centerX - totalWidth / 2;

    [...text].forEach((character, index) => {
      const crop = DIGIT_CROPS[character];
      if (crop) {
        if (character === ':') {
          const dotSize = Math.max(2, 7 * scale);
          context.fillStyle = '#ffd21d';
          context.fillRect(x + 5 * scale, y + 10 * scale, dotSize, dotSize);
          context.fillRect(x + 5 * scale, y + 27 * scale, dotSize, dotSize);
        } else {
          this.drawCutout(
            context,
            `digit-${character}`,
            crop,
            x,
            y,
            crop.width * scale,
            crop.height * scale,
          );
        }
      }
      x += widths[index];
    });
  }

  private drawText(
    context: CanvasRenderingContext2D,
    text: string,
    centerX: number,
    y: number,
    scale: number,
  ): void {
    const spacing = 7 * scale;
    const spaceWidth = 18 * scale;
    const glyphs = [...text].map((character) => LETTER_CROPS[character] ?? null);
    const totalWidth = glyphs.reduce((total, crop) => {
      return total + (crop ? crop.width * scale + spacing : spaceWidth);
    }, 0);
    let x = centerX - totalWidth / 2;

    [...text].forEach((character, index) => {
      const crop = glyphs[index];
      if (!crop) {
        x += spaceWidth;
        return;
      }

      this.drawCutout(
        context,
        `letter-${character}`,
        crop,
        x,
        y,
        crop.width * scale,
        crop.height * scale,
      );
      x += crop.width * scale + spacing;
    });
  }

  private drawRaw(
    context: CanvasRenderingContext2D,
    cacheKey: string,
    crop: Crop,
    x: number,
    y: number,
    width: number,
    height: number,
  ): void {
    if (!this.isReady) {
      return;
    }

    const frame = this.getFrame(cacheKey, crop, false);
    context.drawImage(frame, x, y, width, height);
  }

  private drawCutout(
    context: CanvasRenderingContext2D,
    cacheKey: string,
    crop: Crop,
    x: number,
    y: number,
    width: number,
    height: number,
    rotationRadians = 0,
  ): void {
    if (!this.isReady) {
      return;
    }

    const frame = this.getFrame(cacheKey, crop, true);

    if (rotationRadians === 0) {
      context.drawImage(frame, x, y, width, height);
      return;
    }

    context.save();
    context.translate(x + width / 2, y + height / 2);
    context.rotate(rotationRadians);
    context.drawImage(frame, -width / 2, -height / 2, width, height);
    context.restore();
  }

  private getFrame(cacheKey: string, crop: Crop, removeBackground: boolean): HTMLCanvasElement {
    const fullKey = `${cacheKey}:${removeBackground ? 'cutout' : 'raw'}`;
    const cached = this.cache.get(fullKey);
    if (cached) {
      return cached;
    }

    const canvas = document.createElement('canvas');
    canvas.width = crop.width;
    canvas.height = crop.height;
    const context = canvas.getContext('2d');
    if (!context) {
      throw new Error('Main sprite atlas canvas context not available.');
    }

    context.drawImage(
      this.image,
      crop.x,
      crop.y,
      crop.width,
      crop.height,
      0,
      0,
      crop.width,
      crop.height,
    );

    if (removeBackground) {
      const imageData = context.getImageData(0, 0, crop.width, crop.height);
      removeDarkBlueBackground(imageData);
      removeSmallComponents(imageData);
      context.putImageData(imageData, 0, 0);
    }

    this.cache.set(fullKey, canvas);
    return canvas;
  }
}

function getWallCrop(kind: WallSpriteKind): Crop {
  if (kind === 'horizontal') {
    return CROPS.grassWallHorizontal;
  }
  if (kind === 'corner') {
    return CROPS.grassWallCorner;
  }
  if (kind === 't') {
    return CROPS.grassWallT;
  }
  if (kind === 'cross') {
    return CROPS.grassWallCross;
  }
  if (kind === 'solid') {
    return CROPS.grassWallSolid;
  }

  return CROPS.grassWallVertical;
}

function removeDarkBlueBackground(imageData: ImageData): void {
  const data = imageData.data;

  for (let index = 0; index < data.length; index += 4) {
    const red = data[index];
    const green = data[index + 1];
    const blue = data[index + 2];

    if (
      Math.max(red, green, blue) < DARK_BACKGROUND_THRESHOLD ||
      (blue < 100 &&
        blue > red + BLUE_BACKGROUND_MARGIN &&
        blue > green + BLUE_BACKGROUND_MARGIN &&
        red < 38)
    ) {
      data[index + 3] = 0;
    }
  }
}

function removeSmallComponents(imageData: ImageData): void {
  const data = imageData.data;
  const visited = new Uint8Array(imageData.width * imageData.height);
  const components: number[][] = [];

  for (let pixel = 0; pixel < visited.length; pixel += 1) {
    if (visited[pixel] === 1 || data[pixel * 4 + 3] === 0) {
      continue;
    }

    components.push(collectComponent(imageData, visited, pixel));
  }

  const largest = Math.max(0, ...components.map((component) => component.length));

  for (const component of components) {
    if (component.length < Math.max(35, largest * 0.2)) {
      for (const pixel of component) {
        data[pixel * 4 + 3] = 0;
      }
    }
  }
}

function collectComponent(
  imageData: ImageData,
  visited: Uint8Array,
  startPixel: number,
): number[] {
  const pixels: number[] = [];
  const queue = [startPixel];

  for (let index = 0; index < queue.length; index += 1) {
    const pixel = queue[index];
    if (visited[pixel] === 1 || imageData.data[pixel * 4 + 3] === 0) {
      continue;
    }

    visited[pixel] = 1;
    pixels.push(pixel);
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

  return pixels;
}
