import './styles/main.css';
import { GameManager } from './core/GameManager.js';

const canvas = document.getElementById('game-canvas');
let game;

try {
  game = new GameManager(canvas);
  game.start();
} catch (error) {
  const panel = document.getElementById('error-panel');
  panel.hidden = false;
  panel.textContent = 'Snowbound could not start. Please use a browser with WebGL 2 and hardware acceleration enabled, then reload.';
  console.error(error);
}

window.addEventListener('pagehide', () => game?.stop());
window.addEventListener('pageshow', () => game?.start());

if (import.meta.hot) {
  import.meta.hot.dispose(() => game?.dispose());
}
