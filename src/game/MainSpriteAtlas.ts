import mainSpriteUrl from '../../sprites/main.png';

interface Crop {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
}

export type WallSpriteKind = 'vertical' | 'horizontal' | 'corner' | 't' | 'cross' | 'solid';
export type MazeThemeId = 'grass' | 'stone' | 'brick' | 'wood' | 'ice' | 'metal' | 'lava';

interface WallThemeCrops {
  readonly solid: Crop;
  readonly vertical: Crop;
  readonly horizontal: Crop;
  readonly corner: Crop;
  readonly t: Crop;
  readonly cross: Crop;
}

interface MazeTheme {
  readonly floor: Crop;
  readonly walls: WallThemeCrops;
}

const DARK_BACKGROUND_THRESHOLD = 44;
const BLUE_BACKGROUND_MARGIN = 24;

const CROPS = {
  dirtFloor: { x: 665, y: 446, width: 76, height: 73 },
  grassFloor: { x: 665, y: 520, width: 76, height: 73 },
  stoneFloor: { x: 923, y: 446, width: 76, height: 73 },
  woodFloor: { x: 837, y: 594, width: 76, height: 73 },
  iceFloor: { x: 923, y: 520, width: 76, height: 73 },
  metalFloor: { x: 923, y: 594, width: 76, height: 73 },
  lavaFloor: { x: 837, y: 668, width: 76, height: 73 },
  door: { x: 668, y: 1392, width: 50, height: 48 },
  timerPanel: { x: 678, y: 1446, width: 112, height: 42 },
} as const satisfies Record<string, Crop>;

export const MAZE_THEME_SEQUENCE: readonly MazeThemeId[] = [
  'grass',
  'stone',
  'brick',
  'wood',
  'ice',
  'metal',
  'lava',
];

const THEMES: Record<MazeThemeId, MazeTheme> = {
  grass: {
    floor: CROPS.dirtFloor,
    walls: createWallTheme(486),
  },
  stone: {
    floor: CROPS.stoneFloor,
    walls: createWallTheme(310),
  },
  brick: {
    floor: CROPS.dirtFloor,
    walls: createWallTheme(398),
  },
  wood: {
    floor: CROPS.woodFloor,
    walls: createWallTheme(574),
  },
  ice: {
    floor: CROPS.iceFloor,
    walls: createWallTheme(662),
  },
  metal: {
    floor: CROPS.metalFloor,
    walls: createWallTheme(750),
  },
  lava: {
    floor: CROPS.lavaFloor,
    walls: createWallTheme(838),
  },
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

  drawFloor(
    context: CanvasRenderingContext2D,
    themeId: MazeThemeId | undefined,
    x: number,
    y: number,
    size: number,
  ): void {
    const theme = getTheme(themeId);
    this.drawRaw(context, `floor-${theme.id}`, theme.floor, x, y, size, size);
  }

  drawWall(
    context: CanvasRenderingContext2D,
    kind: WallSpriteKind,
    themeId: MazeThemeId | undefined,
    rotationRadians: number,
    x: number,
    y: number,
    size: number,
  ): void {
    const theme = getTheme(themeId);
    const crop = getWallCrop(theme.walls, kind);
    this.drawCutout(context, `wall-${theme.id}-${kind}`, crop, x, y, size, size, rotationRadians);
  }

  drawDoor(context: CanvasRenderingContext2D, centerX: number, topY: number, size: number): void {
    this.drawCutout(
      context,
      'door',
      CROPS.door,
      centerX - size / 2,
      topY,
      size,
      size,
    );
  }

  drawTimerPanel(context: CanvasRenderingContext2D, x: number, y: number, text: string): void {
    const panelWidth = 146;
    const panelHeight = 54;
    this.drawRaw(context, 'timerPanel', CROPS.timerPanel, x, y, panelWidth, panelHeight);
    context.fillStyle = '#0f2657';
    context.fillRect(x + 29, y + 8, 88, 35);
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.fillStyle = '#d9f230';
    context.font = '700 10px ui-monospace, SFMono-Regular, Menlo, Consolas, monospace';
    context.fillText('TIME', x + panelWidth / 2, y + 15);
    context.fillStyle = '#ffd21d';
    context.strokeStyle = '#17305d';
    context.lineWidth = 3;
    context.font = '800 20px ui-monospace, SFMono-Regular, Menlo, Consolas, monospace';
    context.strokeText(text, x + panelWidth / 2, y + 32);
    context.fillText(text, x + panelWidth / 2, y + 32);
  }

  drawWinText(context: CanvasRenderingContext2D, centerX: number, centerY: number): void {
    const bannerWidth = 270;
    const bannerHeight = 86;
    context.fillStyle = 'rgba(0, 0, 0, 0.82)';
    context.fillRect(centerX - bannerWidth / 2, centerY - bannerHeight / 2, bannerWidth, bannerHeight);
    context.strokeStyle = '#ffffff';
    context.lineWidth = 3;
    context.strokeRect(
      centerX - bannerWidth / 2,
      centerY - bannerHeight / 2,
      bannerWidth,
      bannerHeight,
    );
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.strokeStyle = '#17305d';
    context.lineWidth = 4;
    context.fillStyle = '#ffd21d';
    context.font = '800 32px ui-monospace, SFMono-Regular, Menlo, Consolas, monospace';
    context.strokeText('YOU WIN!', centerX, centerY - 16);
    context.fillText('YOU WIN!', centerX, centerY - 16);
    context.lineWidth = 3;
    context.font = '800 15px ui-monospace, SFMono-Regular, Menlo, Consolas, monospace';
    context.strokeText('PRESS R OR ENTER', centerX, centerY + 22);
    context.fillText('PRESS R OR ENTER', centerX, centerY + 22);
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

function getTheme(themeId: MazeThemeId | undefined): MazeTheme & { readonly id: MazeThemeId } {
  const id = themeId && THEMES[themeId] ? themeId : 'grass';
  return { id, ...THEMES[id] };
}

function createWallTheme(rowY: number): WallThemeCrops {
  return {
    solid: { x: 62, y: rowY, width: 24, height: 74 },
    vertical: { x: 62, y: rowY, width: 24, height: 74 },
    horizontal: { x: 164, y: rowY + 1, width: 124, height: 30 },
    corner: { x: 304, y: rowY, width: 54, height: 70 },
    t: { x: 466, y: rowY, width: 50, height: 70 },
    cross: { x: 592, y: rowY, width: 54, height: 70 },
  };
}

function getWallCrop(theme: WallThemeCrops, kind: WallSpriteKind): Crop {
  if (kind === 'horizontal') {
    return theme.horizontal;
  }
  if (kind === 'corner') {
    return theme.corner;
  }
  if (kind === 't') {
    return theme.t;
  }
  if (kind === 'cross') {
    return theme.cross;
  }
  if (kind === 'solid') {
    return theme.solid;
  }

  return theme.vertical;
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
