import './styles.css';
import { Game } from './game/Game';
import type { CharacterId } from './game/types';
import type { MazeGameWindow } from './game/windowTypes';

const app = document.querySelector<HTMLDivElement>('#app');

if (!app) {
  throw new Error('App root not found.');
}

app.innerHTML = `
  <div class="stage">
    <div class="title-plate"><span class="star">★</span> HENRY'S MAZE ADVENTURE <span class="star">★</span></div>
    <div class="cabinet">
      <span class="stud-tr"></span><span class="stud-br"></span>
      <div class="screen">
        <canvas id="game-canvas" tabindex="0" aria-label="Top-down maze game"></canvas>
        <canvas id="fx-canvas" aria-hidden="true"></canvas>
        <div class="hud">
          <div class="player-select">
            <div class="player-label">PLAYER</div>
            <div class="character-row" id="character-row">
              <button type="button" class="char-btn selected" data-character="henry" aria-label="Henry">
                <span class="portrait" data-portrait="henry"></span>
                <span class="name">HENRY</span>
              </button>
              <button type="button" class="char-btn" data-character="tofu" aria-label="Tofu">
                <span class="portrait" data-portrait="tofu"></span>
                <span class="name">TOFU</span>
              </button>
            </div>
          </div>
          <div class="timer-panel idle" id="timer-panel">
            <div class="lbl">TIME</div>
            <div class="digits" id="timer-digits">00:00</div>
          </div>
          <div class="hint-bar">
            MOVE
            <kbd>◀</kbd><kbd>▲</kbd><kbd>▼</kbd><kbd>▶</kbd>
            OR
            <kbd>W</kbd><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd>
          </div>
          <div class="win-overlay" id="win-overlay" hidden>
            <div class="win-banner">
              <div class="title">YOU WIN!</div>
              <div class="subtitle" id="win-subtitle">Henry made it home</div>
              <div class="time-line">TIME <span id="win-time">00:00</span></div>
            </div>
            <button type="button" class="play-again" id="play-again">PLAY AGAIN</button>
            <div class="key-hint">OR PRESS R / ENTER</div>
          </div>
        </div>
      </div>
    </div>
  </div>
`;

const canvas = app.querySelector<HTMLCanvasElement>('#game-canvas')!;
const fxCanvas = app.querySelector<HTMLCanvasElement>('#fx-canvas')!;
const characterRow = app.querySelector<HTMLDivElement>('#character-row')!;
const timerPanel = app.querySelector<HTMLDivElement>('#timer-panel')!;
const timerDigits = app.querySelector<HTMLDivElement>('#timer-digits')!;
const winOverlay = app.querySelector<HTMLDivElement>('#win-overlay')!;
const winSubtitle = app.querySelector<HTMLDivElement>('#win-subtitle')!;
const winTime = app.querySelector<HTMLSpanElement>('#win-time')!;
const playAgain = app.querySelector<HTMLButtonElement>('#play-again')!;

const game = new Game(canvas);
game.start();
canvas.focus();

const fireworks = createFireworks(fxCanvas);

playAgain.addEventListener('click', () => {
  game.restart();
  canvas.focus();
});

characterRow.addEventListener('click', (event) => {
  const target = event.target;
  if (!(target instanceof HTMLElement)) return;
  const button = target.closest<HTMLButtonElement>('button[data-character]');
  if (!button) return;
  const character = button.dataset.character as CharacterId | undefined;
  if (character !== 'henry' && character !== 'tofu') return;

  game.setCharacter(character);
  for (const btn of characterRow.querySelectorAll<HTMLButtonElement>('button[data-character]')) {
    btn.classList.toggle('selected', btn === button);
  }
  canvas.focus();
});

let wasWon = false;

function updateHud(): void {
  tryLoadPortraits();
  const display = game.getTimerDisplay();
  if (timerDigits.textContent !== display) {
    timerDigits.textContent = display;
  }
  const state = game.getTimerState();
  timerPanel.classList.toggle('running', state === 'running');
  timerPanel.classList.toggle('stopped', state === 'stopped');
  timerPanel.classList.toggle('idle', state === 'idle');

  const isWon = game.isWon();
  if (isWon !== wasWon) {
    wasWon = isWon;
    winOverlay.hidden = !isWon;
    if (isWon) {
      const character = game.getCharacter();
      winSubtitle.textContent =
        character === 'henry' ? 'Henry made it home' : 'Tofu found dinner';
      winTime.textContent = display;
      fireworks.start();
    } else {
      fireworks.stop();
    }
  }

  requestAnimationFrame(updateHud);
}

requestAnimationFrame(updateHud);

window.addEventListener('resize', () => game.render());

const mazeWindow = window as Window & MazeGameWindow;
mazeWindow.render_game_to_text = () => game.renderGameToText();
mazeWindow.advanceTime = (milliseconds: number) => game.advanceTime(milliseconds);

function applyPortrait(character: CharacterId, dataUrl: string): void {
  const portrait = app!.querySelector<HTMLSpanElement>(`[data-portrait="${character}"]`);
  if (!portrait) return;
  portrait.style.backgroundImage = `url(${dataUrl})`;
  portrait.style.backgroundSize = 'auto 110%';
  portrait.style.backgroundPosition = 'center 54%';
  portrait.style.backgroundColor = character === 'henry' ? '#1a2956' : '#f5e3c8';
  portrait.style.imageRendering = 'pixelated';
}

const portraitsLoaded: Record<CharacterId, boolean> = { henry: false, tofu: false };
function tryLoadPortraits(): void {
  for (const character of ['henry', 'tofu'] as const) {
    if (portraitsLoaded[character]) continue;
    const url = game.getPortraitDataUrl(character);
    if (url) {
      applyPortrait(character, url);
      portraitsLoaded[character] = true;
    }
  }
}

interface Fireworks {
  start(): void;
  stop(): void;
}

function createFireworks(canvas: HTMLCanvasElement): Fireworks {
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    return { start: () => undefined, stop: () => undefined };
  }

  interface Particle {
    x: number;
    y: number;
    vx: number;
    vy: number;
    life: number;
    maxLife: number;
    color: string;
    size: number;
  }

  const particles: Particle[] = [];
  let running = false;
  let raf = 0;
  let lastBurst = 0;
  const colors = ['#ffd21d', '#ff7b3a', '#4ec24a', '#5cc8ff', '#ff4eaa', '#fff6d8'];

  function resize(): void {
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.floor(canvas.clientWidth * ratio);
    canvas.height = Math.floor(canvas.clientHeight * ratio);
    ctx!.setTransform(ratio, 0, 0, ratio, 0, 0);
  }

  function burst(): void {
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    const cx = w * (0.2 + Math.random() * 0.6);
    const cy = h * (0.2 + Math.random() * 0.45);
    const color = colors[Math.floor(Math.random() * colors.length)];
    const count = 28 + Math.floor(Math.random() * 12);
    for (let i = 0; i < count; i += 1) {
      const angle = (Math.PI * 2 * i) / count + Math.random() * 0.2;
      const speed = 80 + Math.random() * 120;
      particles.push({
        x: cx,
        y: cy,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 0,
        maxLife: 0.9 + Math.random() * 0.5,
        color,
        size: 3 + Math.random() * 2,
      });
    }
  }

  let lastTime = performance.now();
  function tick(now: number): void {
    if (!running) return;
    const dt = Math.min((now - lastTime) / 1000, 0.05);
    lastTime = now;

    if (now - lastBurst > 380) {
      burst();
      lastBurst = now;
    }

    ctx!.clearRect(0, 0, canvas.clientWidth, canvas.clientHeight);

    for (let i = particles.length - 1; i >= 0; i -= 1) {
      const p = particles[i];
      p.life += dt;
      if (p.life >= p.maxLife) {
        particles.splice(i, 1);
        continue;
      }
      p.vy += 140 * dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      const alpha = 1 - p.life / p.maxLife;
      ctx!.globalAlpha = alpha;
      ctx!.fillStyle = p.color;
      ctx!.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
    }
    ctx!.globalAlpha = 1;

    raf = requestAnimationFrame(tick);
  }

  return {
    start() {
      if (running) return;
      resize();
      running = true;
      lastTime = performance.now();
      lastBurst = 0;
      raf = requestAnimationFrame(tick);
    },
    stop() {
      running = false;
      cancelAnimationFrame(raf);
      particles.length = 0;
      ctx!.clearRect(0, 0, canvas.clientWidth, canvas.clientHeight);
    },
  };
}
