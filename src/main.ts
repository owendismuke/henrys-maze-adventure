import './styles.css';
import { Game } from './game/Game';
import type { MazeGameWindow } from './game/windowTypes';

const app = document.querySelector<HTMLDivElement>('#app');

if (!app) {
  throw new Error('App root not found.');
}

const canvas = document.createElement('canvas');
canvas.id = 'game-canvas';
canvas.setAttribute('aria-label', 'Top-down maze game canvas');
canvas.tabIndex = 0;

app.append(canvas);

const game = new Game(canvas);
game.start();
canvas.focus();

const mazeWindow = window as Window & MazeGameWindow;
mazeWindow.render_game_to_text = () => game.renderGameToText();
mazeWindow.advanceTime = (milliseconds: number) => game.advanceTime(milliseconds);
