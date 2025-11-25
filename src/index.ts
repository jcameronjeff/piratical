import { Game } from './game/game';
import { GameRenderer } from './game/renderer';

import './style.css';

async function init() {
  // Room Code Logic
  const urlParams = new URLSearchParams(window.location.search);
  let roomCode = urlParams.get('room');

  if (!roomCode) {
    roomCode = `SHIP-${Math.random().toString().slice(2, 6)}`;
    window.history.replaceState(null, '', `?room=${roomCode}`);
  }

  console.log(`Joining room: ${roomCode}`);

  // UI Overlay for Room Code
  const overlay = document.createElement('div');
  overlay.id = 'ui-overlay';
  overlay.innerHTML = `
    <div style="position: absolute; top: 10px; left: 10px; color: white; font-family: monospace; background: rgba(0,0,0,0.5); padding: 10px;">
      Room: ${roomCode} <br>
      Share URL to invite friend!
    </div>
  `;
  document.body.appendChild(overlay);

  const renderer = new GameRenderer();
  const game = new Game(renderer, roomCode);
  
  await game.start();
}

init();
