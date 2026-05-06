import './styles.css';
import { Game } from './game/Game';
import type { CharacterId } from './game/types';
import type { MazeGameWindow } from './game/windowTypes';

const app = document.querySelector<HTMLDivElement>('#app');

if (!app) {
  throw new Error('App root not found.');
}

const canvas = document.createElement('canvas');
canvas.id = 'game-canvas';
canvas.setAttribute('aria-label', 'Top-down maze game canvas');
canvas.tabIndex = 0;

const restartButton = document.createElement('button');
restartButton.id = 'restart-button';
restartButton.type = 'button';
restartButton.textContent = 'Restart';
restartButton.hidden = true;

const characterSelector = document.createElement('div');
characterSelector.id = 'character-selector';
characterSelector.setAttribute('aria-label', 'Character selection');

const characterButtons: Array<{ readonly id: CharacterId; readonly label: string }> = [
  { id: 'henry', label: 'Henry' },
  { id: 'tofu', label: 'Tofu' },
];

for (const character of characterButtons) {
  const button = document.createElement('button');
  button.type = 'button';
  button.dataset.character = character.id;
  button.textContent = character.label;
  button.className = character.id === 'henry' ? 'selected' : '';
  characterSelector.append(button);
}

app.append(canvas);
app.append(characterSelector);
app.append(restartButton);

const game = new Game(canvas, ({ hasWon }) => {
  restartButton.hidden = !hasWon;
});
game.start();
canvas.focus();

restartButton.addEventListener('click', () => {
  game.restart();
  canvas.focus();
});

characterSelector.addEventListener('click', (event) => {
  const target = event.target;
  if (!(target instanceof HTMLButtonElement)) {
    return;
  }

  const character = target.dataset.character as CharacterId | undefined;
  if (character !== 'henry' && character !== 'tofu') {
    return;
  }

  game.setCharacter(character);

  for (const button of characterSelector.querySelectorAll('button')) {
    button.classList.toggle('selected', button === target);
  }

  canvas.focus();
});

const mazeWindow = window as Window & MazeGameWindow;
mazeWindow.render_game_to_text = () => game.renderGameToText();
mazeWindow.advanceTime = (milliseconds: number) => game.advanceTime(milliseconds);
