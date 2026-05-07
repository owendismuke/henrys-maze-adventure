// Procedural 16-bit pixel tile generator. Ported from the design's
// tile-generator.js. Floor + wall tiles per theme, drawn at 16x16 px and
// upscaled with image-rendering: pixelated. Goal tiles: ice-cream cone for
// Henry, painted cat-food bowl for Tofu.

import type { MazeThemeId } from './MainSpriteAtlas';

const TILE_PX = 16;

interface Palette {
  readonly floor: readonly [string, string, string, string];
  readonly wall: readonly [string, string, string, string, string];
  readonly decor: string;
}

const PALETTES: Record<MazeThemeId, Palette> = {
  grass: {
    floor: ['#f5d8b8', '#e8c498', '#b8895a', '#7a5530'],
    wall: ['#5fa83a', '#3f8024', '#285c14', '#163a08', '#7bc454'],
    decor: '#fff7b8',
  },
  stone: {
    floor: ['#e4e0d2', '#cac6b6', '#9a958a', '#6e6a5e'],
    wall: ['#a89e82', '#7e7560', '#544c3c', '#322c20', '#c8bea2'],
    decor: '#5b5238',
  },
  brick: {
    floor: ['#fbe8d4', '#efd0b0', '#c2a080', '#8e6e50'],
    wall: ['#c75a3a', '#9b3e22', '#6e2810', '#4a1606', '#f0d28a'],
    decor: '#3a1505',
  },
  wood: {
    floor: ['#d4e6c2', '#bcd4a4', '#94ad7c', '#6a8454'],
    wall: ['#b8814a', '#8a5828', '#5e3712', '#3a1f08', '#d8a868'],
    decor: '#2e1604',
  },
  ice: {
    floor: ['#dff2ff', '#b8dcf2', '#8cb7d8', '#5e89ad'],
    wall: ['#a8d4ee', '#7eb1d4', '#5683a8', '#345b78', '#e8f6ff'],
    decor: '#ffffff',
  },
  metal: {
    floor: ['#9ea4b0', '#828896', '#646a78', '#444a58'],
    wall: ['#5a5e68', '#42464e', '#2c2f36', '#1a1c22', '#7e828a'],
    decor: '#1a1b22',
  },
  lava: {
    floor: ['#8c5a44', '#6a3e2a', '#48261a', '#2a140c'],
    wall: ['#ff8a3a', '#e25618', '#a02a06', '#5a1402', '#ffd06a'],
    decor: '#ffe27a',
  },
};

const cache = new Map<string, HTMLCanvasElement>();

function makeCanvas(width: number, height: number): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  return canvas;
}

function ctxOf(canvas: HTMLCanvasElement): CanvasRenderingContext2D {
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('MazeTiles canvas 2D context not available.');
  }
  return ctx;
}

function hash(x: number, y: number, salt: number): number {
  let h = (x * 374761393 + y * 668265263 + salt * 1442695040) | 0;
  h = (h ^ (h >>> 13)) * 1274126177;
  return ((h ^ (h >>> 16)) >>> 0) / 0xffffffff;
}

function drawFloor(ctx: CanvasRenderingContext2D, theme: MazeThemeId): void {
  const p = PALETTES[theme].floor;
  ctx.fillStyle = p[1];
  ctx.fillRect(0, 0, TILE_PX, TILE_PX);

  for (let y = 0; y < TILE_PX; y += 1) {
    for (let x = 0; x < TILE_PX; x += 1) {
      const r = hash(x, y, theme.charCodeAt(0));
      if (theme === 'grass') {
        if (r < 0.18) ctx.fillStyle = p[0];
        else if (r < 0.32) ctx.fillStyle = p[2];
        else continue;
        ctx.fillRect(x, y, 1, 1);
      } else if (theme === 'stone') {
        if ((x === 0 || y === 0 || x === 8) && y < 8) ctx.fillStyle = p[3];
        else if ((x === 0 || y === 8 || x === 8) && y >= 8) ctx.fillStyle = p[3];
        else if (r < 0.15) ctx.fillStyle = p[0];
        else if (r < 0.3) ctx.fillStyle = p[2];
        else continue;
        ctx.fillRect(x, y, 1, 1);
      } else if (theme === 'brick') {
        if (r < 0.2) ctx.fillStyle = p[0];
        else if (r < 0.38) ctx.fillStyle = p[2];
        else continue;
        ctx.fillRect(x, y, 1, 1);
      } else if (theme === 'wood') {
        const strand = hash(0, y, 7);
        if (y === 5 || y === 11) ctx.fillStyle = p[3];
        else if (strand < 0.35 && r < 0.5) ctx.fillStyle = p[2];
        else if (r < 0.18) ctx.fillStyle = p[0];
        else continue;
        ctx.fillRect(x, y, 1, 1);
      } else if (theme === 'ice') {
        if (r < 0.1) ctx.fillStyle = p[0];
        else if (r < 0.16) ctx.fillStyle = p[2];
        else continue;
        ctx.fillRect(x, y, 1, 1);
        if ((x + y) % 7 === 0 && r < 0.3) {
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(x, y, 1, 1);
        }
      } else if (theme === 'metal') {
        if (
          (x === 1 && y === 1) ||
          (x === 14 && y === 1) ||
          (x === 1 && y === 14) ||
          (x === 14 && y === 14)
        ) {
          ctx.fillStyle = p[3];
          ctx.fillRect(x, y, 2, 2);
        } else if (r < 0.1) ctx.fillStyle = p[0];
        else if (r < 0.2) ctx.fillStyle = p[2];
        else continue;
        ctx.fillRect(x, y, 1, 1);
      } else if (theme === 'lava') {
        if (r < 0.12) ctx.fillStyle = p[0];
        else if (r < 0.3) ctx.fillStyle = p[2];
        else continue;
        ctx.fillRect(x, y, 1, 1);
      }
    }
  }
}

function drawWallBase(ctx: CanvasRenderingContext2D, theme: MazeThemeId): void {
  const p = PALETTES[theme].wall;
  ctx.fillStyle = p[1];
  ctx.fillRect(0, 0, TILE_PX, TILE_PX);

  for (let y = 0; y < TILE_PX; y += 1) {
    for (let x = 0; x < TILE_PX; x += 1) {
      const salt = theme.charCodeAt(1) || 11;
      const r = hash(x, y, salt);
      if (theme === 'brick') {
        const row = Math.floor(y / 4);
        const offset = (row % 2) * 4;
        const bx = (x + offset) % 8;
        if (y % 4 === 3) {
          ctx.fillStyle = p[4];
          ctx.fillRect(x, y, 1, 1);
          continue;
        }
        if (bx === 7) {
          ctx.fillStyle = p[4];
          ctx.fillRect(x, y, 1, 1);
          continue;
        }
        if (y % 4 === 0) ctx.fillStyle = p[0];
        else if (y % 4 === 2) ctx.fillStyle = p[2];
        else if (r < 0.2) ctx.fillStyle = p[2];
        else continue;
        ctx.fillRect(x, y, 1, 1);
      } else if (theme === 'stone') {
        const cx = x % 8;
        const cy = y % 8;
        if (cx === 0 || cy === 0) {
          ctx.fillStyle = p[3];
          ctx.fillRect(x, y, 1, 1);
          continue;
        }
        if (cx === 1 || cy === 1) {
          ctx.fillStyle = p[0];
          ctx.fillRect(x, y, 1, 1);
          continue;
        }
        if (cx === 7 || cy === 7) {
          ctx.fillStyle = p[2];
          ctx.fillRect(x, y, 1, 1);
          continue;
        }
        if (r < 0.18) {
          ctx.fillStyle = p[0];
          ctx.fillRect(x, y, 1, 1);
        } else if (r < 0.34) {
          ctx.fillStyle = p[2];
          ctx.fillRect(x, y, 1, 1);
        }
      } else if (theme === 'grass') {
        const r2 = hash(x, y, 31);
        if (r2 < 0.26) ctx.fillStyle = p[0];
        else if (r2 < 0.55) continue;
        else if (r2 < 0.8) ctx.fillStyle = p[2];
        else ctx.fillStyle = p[3];
        ctx.fillRect(x, y, 1, 1);
      } else if (theme === 'wood') {
        if (y === 0 || y === 7 || y === 15) ctx.fillStyle = p[3];
        else if (y === 1 || y === 8) ctx.fillStyle = p[0];
        else if (r < 0.18) ctx.fillStyle = p[2];
        else continue;
        ctx.fillRect(x, y, 1, 1);
      } else if (theme === 'ice') {
        const cx = x % 8;
        const cy = y % 8;
        if (cx === 0 || cy === 0) {
          ctx.fillStyle = p[3];
          ctx.fillRect(x, y, 1, 1);
          continue;
        }
        if (cx === 1 || cy === 1) {
          ctx.fillStyle = p[4];
          ctx.fillRect(x, y, 1, 1);
          continue;
        }
        if (cx === 7 || cy === 7) {
          ctx.fillStyle = p[2];
          ctx.fillRect(x, y, 1, 1);
          continue;
        }
        if (r < 0.1) {
          ctx.fillStyle = p[4];
          ctx.fillRect(x, y, 1, 1);
        }
      } else if (theme === 'metal') {
        if (
          (x === 2 && y === 2) ||
          (x === 13 && y === 2) ||
          (x === 2 && y === 13) ||
          (x === 13 && y === 13)
        ) {
          ctx.fillStyle = p[0];
          ctx.fillRect(x, y, 2, 2);
          ctx.fillStyle = p[3];
          ctx.fillRect(x + 1, y + 1, 1, 1);
        } else if (x === 0 || y === 0) {
          ctx.fillStyle = p[0];
          ctx.fillRect(x, y, 1, 1);
        } else if (x === 15 || y === 15) {
          ctx.fillStyle = p[2];
          ctx.fillRect(x, y, 1, 1);
        } else if (r < 0.1) {
          ctx.fillStyle = p[2];
          ctx.fillRect(x, y, 1, 1);
        }
      } else if (theme === 'lava') {
        if (r < 0.2) ctx.fillStyle = p[0];
        else if (r < 0.45) ctx.fillStyle = p[2];
        else if (r < 0.55) ctx.fillStyle = p[3];
        else continue;
        ctx.fillRect(x, y, 1, 1);
        if ((x + y * 3) % 13 === 0) {
          ctx.fillStyle = PALETTES.lava.decor;
          ctx.fillRect(x, y, 1, 1);
        }
      }
    }
  }
}

interface Sides {
  readonly N: boolean;
  readonly E: boolean;
  readonly S: boolean;
  readonly W: boolean;
}

function drawWallEdges(
  ctx: CanvasRenderingContext2D,
  theme: MazeThemeId,
  sides: Sides,
): void {
  const p = PALETTES[theme].wall;
  const hi = p[0];
  const dark = p[3];
  if (sides.N) {
    ctx.fillStyle = hi;
    ctx.fillRect(0, 0, TILE_PX, 1);
    ctx.fillStyle = p[2];
    ctx.fillRect(0, 1, TILE_PX, 1);
  }
  if (sides.S) {
    ctx.fillStyle = dark;
    ctx.fillRect(0, TILE_PX - 1, TILE_PX, 1);
    ctx.fillStyle = p[2];
    ctx.fillRect(0, TILE_PX - 2, TILE_PX, 1);
  }
  if (sides.W) {
    ctx.fillStyle = hi;
    ctx.fillRect(0, 0, 1, TILE_PX);
  }
  if (sides.E) {
    ctx.fillStyle = dark;
    ctx.fillRect(TILE_PX - 1, 0, 1, TILE_PX);
  }
}

export function getFloorTile(theme: MazeThemeId): HTMLCanvasElement {
  const key = `${theme}:floor`;
  const cached = cache.get(key);
  if (cached) return cached;
  const canvas = makeCanvas(TILE_PX, TILE_PX);
  drawFloor(ctxOf(canvas), theme);
  cache.set(key, canvas);
  return canvas;
}

// openMask bits: 1=N open, 2=E, 4=S, 8=W
export function getWallTile(theme: MazeThemeId, openMask: number): HTMLCanvasElement {
  const key = `${theme}:wall:${openMask}`;
  const cached = cache.get(key);
  if (cached) return cached;
  const canvas = makeCanvas(TILE_PX, TILE_PX);
  const ctx = ctxOf(canvas);
  drawWallBase(ctx, theme);
  drawWallEdges(ctx, theme, {
    N: (openMask & 1) !== 0,
    E: (openMask & 2) !== 0,
    S: (openMask & 4) !== 0,
    W: (openMask & 8) !== 0,
  });
  cache.set(key, canvas);
  return canvas;
}

// Henry's goal: vanilla ice cream cone (16x24)
export function getIceCreamTile(): HTMLCanvasElement {
  const cached = cache.get('icecream');
  if (cached) return cached;
  const canvas = makeCanvas(16, 24);
  const ctx = ctxOf(canvas);

  const CREAM_HI = '#fffaea';
  const CREAM = '#fbecc4';
  const CREAM_MID = '#f0d690';
  const CREAM_SHAD = '#c9a85a';
  const CONE_HI = '#f0c280';
  const CONE = '#c98a3e';
  const CONE_MID = '#9a6322';
  const CONE_DK = '#5e3a10';

  function px(x: number, y: number, color: string): void {
    ctx.fillStyle = color;
    ctx.fillRect(x, y, 1, 1);
  }

  const scoops = [
    '......CCCC......',
    '....CCHHHHCC....',
    '..CCHHHHHHHHCC..',
    '.CHHHHHHHHHHHHC.',
    'CHHHHHHHHHHHHHHC',
    'CHHHHHHHHHHHHHHC',
    'CHHHHHHHHHHHHHHC',
    '.CCHHHHHHHHHHCC.',
  ];
  for (let y = 0; y < scoops.length; y += 1) {
    const row = scoops[y];
    for (let x = 0; x < row.length; x += 1) {
      const ch = row[x];
      if (ch === '.') continue;
      if (ch === 'C') px(x, y, CREAM_SHAD);
      else if (ch === 'H') px(x, y, CREAM);
    }
  }
  // Highlights on the upper-left of the dome
  px(5, 1, CREAM_HI); px(6, 1, CREAM_HI);
  px(3, 2, CREAM_HI); px(4, 2, CREAM_HI); px(5, 2, CREAM_HI);
  px(2, 3, CREAM_HI); px(3, 3, CREAM_HI);
  px(1, 4, CREAM_HI); px(2, 4, CREAM_HI);
  // Soft mid-shadow on the lower-right
  px(11, 5, CREAM_MID); px(12, 5, CREAM_MID);
  px(11, 6, CREAM_MID); px(12, 6, CREAM_MID); px(13, 6, CREAM_MID);
  px(11, 7, CREAM_MID); px(12, 7, CREAM_MID);

  // Waffle cone — tall tapering triangle from y=8 (rim) to y=23 (tip)
  const coneRows = [
    { y: 8, l: 0, r: 15 },
    { y: 9, l: 1, r: 14 },
    { y: 10, l: 1, r: 14 },
    { y: 11, l: 2, r: 13 },
    { y: 12, l: 2, r: 13 },
    { y: 13, l: 3, r: 12 },
    { y: 14, l: 3, r: 12 },
    { y: 15, l: 4, r: 11 },
    { y: 16, l: 4, r: 11 },
    { y: 17, l: 5, r: 10 },
    { y: 18, l: 5, r: 10 },
    { y: 19, l: 6, r: 9 },
    { y: 20, l: 6, r: 9 },
    { y: 21, l: 7, r: 8 },
    { y: 22, l: 7, r: 8 },
    { y: 23, l: 7, r: 8 },
  ];
  for (const r of coneRows) {
    for (let x = r.l; x <= r.r; x += 1) px(x, r.y, CONE);
    px(r.l, r.y, CONE_DK);
    px(r.r, r.y, CONE_DK);
  }
  // Top rim band: dark line across the top + light highlight just below
  for (let x = 0; x <= 15; x += 1) px(x, 8, CONE_DK);
  for (let x = 2; x <= 13; x += 1) px(x, 9, CONE_HI);

  // Waffle crosshatch — two sets of diagonals across the cone interior
  const hatchDownRight: ReadonlyArray<readonly [number, number]> = [
    [4, 10], [5, 11], [6, 12], [7, 13], [8, 14], [9, 15], [10, 16], [11, 17],
    [3, 13], [4, 14], [5, 15], [6, 16], [7, 17], [8, 18], [9, 19],
  ];
  const hatchDownLeft: ReadonlyArray<readonly [number, number]> = [
    [11, 10], [10, 11], [9, 12], [8, 13], [7, 14], [6, 15], [5, 16], [4, 17],
    [12, 13], [11, 14], [10, 15], [9, 16], [8, 17], [7, 18], [6, 19],
  ];
  for (const [x, y] of [...hatchDownRight, ...hatchDownLeft]) {
    const r = coneRows.find((rr) => rr.y === y);
    if (!r) continue;
    if (x > r.l && x < r.r) px(x, y, CONE_MID);
  }
  // Darken the tip
  px(7, 23, CONE_DK);
  px(8, 23, CONE_DK);

  cache.set('icecream', canvas);
  return canvas;
}

// Tofu's goal: painted cat-food bowl (rendered at draw time, no caching needed
// since size depends on cell size)
export function drawCatBowl(
  ctx: CanvasRenderingContext2D,
  centerX: number,
  topY: number,
  size: number,
): void {
  const w = size * 0.92;
  const h = size * 0.55;
  const y = topY + size * 0.3;

  ctx.fillStyle = 'rgba(0,0,0,0.35)';
  ctx.beginPath();
  ctx.ellipse(centerX, y + h * 0.92, w * 0.46, h * 0.16, 0, 0, Math.PI * 2);
  ctx.fill();

  const grad = ctx.createLinearGradient(0, y, 0, y + h);
  grad.addColorStop(0, '#dd7a55');
  grad.addColorStop(1, '#7e3318');
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.ellipse(centerX, y + h * 0.55, w * 0.46, h * 0.5, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#f0a07a';
  ctx.beginPath();
  ctx.ellipse(centerX, y + h * 0.18, w * 0.46, h * 0.18, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#5a2110';
  ctx.beginPath();
  ctx.ellipse(centerX, y + h * 0.18, w * 0.4, h * 0.14, 0, 0, Math.PI * 2);
  ctx.fill();

  const kibbleColors = ['#a26134', '#7c4324', '#c2774a'];
  for (let i = 0; i < 7; i += 1) {
    const kx = centerX + Math.cos(i * 1.7) * w * 0.28;
    const ky = y + h * 0.13 + Math.sin(i * 2.1) * h * 0.05;
    ctx.fillStyle = kibbleColors[i % kibbleColors.length];
    ctx.beginPath();
    ctx.arc(kx, ky, w * 0.06, 0, Math.PI * 2);
    ctx.fill();
  }
}

export function getWallOpenMask(
  isWall: (x: number, y: number) => boolean,
  x: number,
  y: number,
): number {
  let mask = 0;
  if (!isWall(x, y - 1)) mask |= 1;
  if (!isWall(x + 1, y)) mask |= 2;
  if (!isWall(x, y + 1)) mask |= 4;
  if (!isWall(x - 1, y)) mask |= 8;
  return mask;
}
