import { Game } from './game/game';
import { SinglePlayerGame } from './game/singleplayer';
import { GameRenderer } from './game/renderer';
import { MainMenu } from './menu';
import { GameMode, CharacterType } from './types';

import './style.css';

let currentGame: Game | SinglePlayerGame | null = null;
let renderer: GameRenderer | null = null;
let menu: MainMenu | null = null;

function showMenu() {
  // Clean up any existing game
  if (currentGame) {
    currentGame.stop();
    currentGame = null;
  }

  // Clear the canvas if it exists
  if (renderer) {
    const canvas = renderer.getCanvas();
    if (canvas && canvas.parentNode) {
      canvas.parentNode.removeChild(canvas);
    }
    renderer = null;
  }

  // Remove any existing UI overlays
  const overlay = document.getElementById('ui-overlay');
  if (overlay) overlay.remove();

  // Show menu
  if (!menu) {
    menu = new MainMenu(handleModeSelect);
  }
  menu.show();
}

async function handleModeSelect(mode: GameMode, levelId?: number, roomCode?: string, characterType?: CharacterType) {
  if (menu) {
    menu.hide();
  }

  renderer = new GameRenderer();
  const selectedCharacter = characterType || CharacterType.PIRATE;

  if (mode === 'campaign') {
    currentGame = new SinglePlayerGame(renderer, showMenu, selectedCharacter);
    await currentGame.start();
    if (levelId) {
      await currentGame.loadLevel(levelId);
    }
  } else if (mode === 'multiplayer') {
    const code = roomCode || `SHIP-${Math.random().toString().slice(2, 6)}`;
    
    // UI Overlay for Room Code
    const overlay = document.createElement('div');
    overlay.id = 'ui-overlay';
    overlay.innerHTML = `
      <div style="position: absolute; top: 10px; right: 10px; color: white; font-family: 'Georgia', serif; background: rgba(0,0,0,0.7); padding: 15px; border-radius: 8px; border: 2px solid #ffd700;">
        <div style="color: #ffd700; font-weight: bold;">Room: ${code}</div>
        <div style="font-size: 12px; margin-top: 5px; color: #87ceeb;">Share URL to invite friend!</div>
        <div style="font-size: 11px; margin-top: 5px; color: #888;">Press ESC to return to menu</div>
      </div>
    `;
    document.body.appendChild(overlay);

    currentGame = new Game(renderer, code, showMenu, selectedCharacter);
    await currentGame.start();
  }
}

// Initialize
showMenu();
