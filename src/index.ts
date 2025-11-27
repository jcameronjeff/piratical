import { Game } from './game/game';
import { SinglePlayerGame } from './game/singleplayer';
import { GameRenderer } from './game/renderer';
import { MainMenu } from './menu';
import { CampaignMap } from './campaignMap';
import { GameMode, CharacterType, CampaignProgress } from './types';

import './style.css';

let currentGame: Game | SinglePlayerGame | null = null;
let renderer: GameRenderer | null = null;
let menu: MainMenu | null = null;
let campaignMap: CampaignMap | null = null;
let selectedCharacterType: CharacterType = CharacterType.PIRATE;

function loadProgress(): CampaignProgress {
  try {
    const saved = localStorage.getItem('piratical_progress');
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (e) {
    console.warn('Failed to load progress:', e);
  }
  return {
    currentLevel: 1,
    totalDoubloons: 0,
    unlockedLevels: [1],
    bestTimes: {}
  };
}

function showMenu() {
  // Clean up any existing game
  if (currentGame) {
    currentGame.stop();
    currentGame = null;
  }

  // Hide campaign map if showing
  if (campaignMap) {
    campaignMap.hide();
    campaignMap = null;
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

function showCampaignMap(justCompletedLevel?: number) {
  // Hide any existing map
  if (campaignMap) {
    campaignMap.hide();
  }

  const progress = loadProgress();
  
  campaignMap = new CampaignMap(
    progress,
    (levelId: number) => startCampaignLevel(levelId),
    () => showMenu()
  );
  
  campaignMap.show(justCompletedLevel);
}

async function startCampaignLevel(levelId: number) {
  // Hide campaign map
  if (campaignMap) {
    campaignMap.hide();
    campaignMap = null;
  }

  // Stop any existing game first to prevent duplicate sounds/listeners
  if (currentGame) {
    currentGame.stop();
    currentGame = null;
  }

  // Create renderer if needed
  if (!renderer) {
    renderer = new GameRenderer();
  }

  // Create and start game
  currentGame = new SinglePlayerGame(
    renderer, 
    showMenu, 
    selectedCharacterType,
    (completedLevelId: number) => {
      // Callback when level is complete - show map
      showCampaignMap(completedLevelId);
    }
  );
  
  await currentGame.start(levelId);
}

async function handleModeSelect(mode: GameMode, levelId?: number, roomCode?: string, characterType?: CharacterType) {
  if (menu) {
    menu.hide();
  }

  selectedCharacterType = characterType || CharacterType.PIRATE;

  if (mode === 'campaign') {
    // Show campaign map instead of going directly to game
    showCampaignMap();
    return;
  } else if (mode === 'multiplayer') {
    // Create renderer for multiplayer
    if (!renderer) {
      renderer = new GameRenderer();
    }
    
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

    currentGame = new Game(renderer, code, showMenu, selectedCharacterType);
    await currentGame.start();
  }
}

// Initialize
showMenu();
