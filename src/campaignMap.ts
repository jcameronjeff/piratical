import { CampaignProgress, LevelData } from './types';
import { CAMPAIGN_LEVELS } from './game/levels';

interface IslandTheme {
  name: string;
  emoji: string;
  primaryColor: string;
  secondaryColor: string;
  description: string;
  iconSvg: string;
}

const ISLAND_THEMES: { [key: number]: IslandTheme } = {
  1: {
    name: "Shipwreck Shore",
    emoji: "🏝️",
    primaryColor: "#c2b280",
    secondaryColor: "#8b7355",
    description: "Where yer journey begins",
    iconSvg: `<svg viewBox="0 0 100 80" class="island-svg">
      <!-- Sandy beach island -->
      <ellipse cx="50" cy="55" rx="42" ry="22" fill="#c2b280"/>
      <ellipse cx="50" cy="52" rx="38" ry="18" fill="#d4c39a"/>
      <!-- Palm trees -->
      <rect x="30" y="25" width="4" height="30" fill="#8b4513"/>
      <ellipse cx="32" cy="22" rx="12" ry="6" fill="#228b22"/>
      <ellipse cx="28" cy="28" rx="10" ry="5" fill="#2d8b2d"/>
      <ellipse cx="38" cy="26" rx="8" ry="4" fill="#1e7b1e"/>
      <!-- Shipwreck -->
      <path d="M55,45 L75,45 L78,55 L52,55 Z" fill="#5c4033"/>
      <rect x="62" y="32" width="3" height="13" fill="#5c4033"/>
      <path d="M65,32 L65,40 L75,36 Z" fill="#8b7355" opacity="0.7"/>
      <!-- Waves -->
      <path d="M5,65 Q15,60 25,65 Q35,70 45,65 Q55,60 65,65 Q75,70 85,65 Q95,60 100,65" stroke="#4a90a4" stroke-width="3" fill="none" opacity="0.6"/>
    </svg>`
  },
  2: {
    name: "Skull Cave",
    emoji: "💀",
    primaryColor: "#2d2d3d",
    secondaryColor: "#1a1a2e",
    description: "Beware the cursed depths",
    iconSvg: `<svg viewBox="0 0 100 80" class="island-svg">
      <!-- Rocky skull-shaped island -->
      <ellipse cx="50" cy="58" rx="40" ry="18" fill="#3d3d4d"/>
      <!-- Skull shape in mountain -->
      <path d="M20,50 Q25,15 50,10 Q75,15 80,50 Q75,55 50,58 Q25,55 20,50" fill="#4a4a5a"/>
      <!-- Eye sockets -->
      <ellipse cx="35" cy="35" rx="8" ry="10" fill="#1a1a2e"/>
      <ellipse cx="65" cy="35" rx="8" ry="10" fill="#1a1a2e"/>
      <!-- Glowing eyes -->
      <ellipse cx="35" cy="37" rx="3" ry="4" fill="#ff4444" opacity="0.8"/>
      <ellipse cx="65" cy="37" rx="3" ry="4" fill="#ff4444" opacity="0.8"/>
      <!-- Nose hole -->
      <path d="M45,45 L55,45 L50,52 Z" fill="#1a1a2e"/>
      <!-- Cave entrance / mouth -->
      <ellipse cx="50" cy="55" rx="12" ry="6" fill="#0a0a15"/>
      <!-- Stalactites -->
      <path d="M40,49 L42,55 L44,49" fill="#2a2a3a"/>
      <path d="M50,48 L52,56 L54,48" fill="#2a2a3a"/>
      <path d="M58,49 L60,54 L62,49" fill="#2a2a3a"/>
      <!-- Mist -->
      <ellipse cx="30" cy="62" rx="15" ry="4" fill="#6a6a8a" opacity="0.3"/>
      <ellipse cx="70" cy="60" rx="12" ry="3" fill="#6a6a8a" opacity="0.3"/>
    </svg>`
  },
  3: {
    name: "Treasure Galleon",
    emoji: "⛵",
    primaryColor: "#5c3a21",
    secondaryColor: "#8b4513",
    description: "The legendary ghost ship",
    iconSvg: `<svg viewBox="0 0 100 80" class="island-svg">
      <!-- Water base -->
      <ellipse cx="50" cy="65" rx="45" ry="12" fill="#1a5f7a" opacity="0.5"/>
      <!-- Ship hull -->
      <path d="M10,55 Q15,70 50,72 Q85,70 90,55 L85,45 Q50,40 15,45 Z" fill="#5c3a21"/>
      <path d="M15,50 Q50,45 85,50" stroke="#3d2512" stroke-width="2" fill="none"/>
      <!-- Ship deck -->
      <rect x="20" y="38" width="60" height="8" fill="#8b4513"/>
      <rect x="25" y="32" width="50" height="8" fill="#6b3410"/>
      <!-- Mast -->
      <rect x="48" y="5" width="4" height="40" fill="#3d2512"/>
      <!-- Sail -->
      <path d="M52,8 Q75,20 52,38" fill="#f5f5dc"/>
      <path d="M52,8 Q30,20 52,38" fill="#e8e8d0"/>
      <!-- Jolly roger on sail -->
      <circle cx="48" cy="22" r="6" fill="#1a1a1a"/>
      <circle cx="46" cy="20" r="1.5" fill="#fff"/>
      <circle cx="50" cy="20" r="1.5" fill="#fff"/>
      <rect x="44" y="24" width="8" height="2" fill="#fff"/>
      <!-- Crow's nest -->
      <rect x="44" y="3" width="12" height="4" fill="#5c3a21"/>
      <!-- Treasure glow -->
      <ellipse cx="50" cy="50" rx="8" ry="4" fill="#ffd700" opacity="0.4"/>
      <!-- Cannons -->
      <rect x="22" y="48" width="6" height="3" fill="#2a2a2a"/>
      <rect x="72" y="48" width="6" height="3" fill="#2a2a2a"/>
    </svg>`
  },
  4: {
    name: "Kraken's Lair",
    emoji: "🐙",
    primaryColor: "#0d1b2a",
    secondaryColor: "#1b3a4b",
    description: "Face the beast of the deep",
    iconSvg: `<svg viewBox="0 0 100 80" class="island-svg">
      <!-- Deep water swirl -->
      <ellipse cx="50" cy="50" rx="45" ry="35" fill="#0d1b2a"/>
      <ellipse cx="50" cy="50" rx="38" ry="28" fill="#132744"/>
      <ellipse cx="50" cy="50" rx="28" ry="20" fill="#1b3a4b"/>
      <!-- Whirlpool lines -->
      <path d="M20,50 Q35,35 50,40 Q65,45 75,35" stroke="#2a5a7b" stroke-width="2" fill="none" opacity="0.5"/>
      <path d="M25,60 Q40,50 50,55 Q60,60 70,50" stroke="#2a5a7b" stroke-width="2" fill="none" opacity="0.5"/>
      <!-- Tentacles emerging -->
      <path d="M15,65 Q10,45 20,35 Q25,30 22,25" stroke="#8e44ad" stroke-width="6" fill="none" stroke-linecap="round"/>
      <path d="M85,65 Q90,45 80,35 Q75,30 78,25" stroke="#8e44ad" stroke-width="6" fill="none" stroke-linecap="round"/>
      <path d="M30,70 Q25,55 35,45" stroke="#7d3c98" stroke-width="5" fill="none" stroke-linecap="round"/>
      <path d="M70,70 Q75,55 65,45" stroke="#7d3c98" stroke-width="5" fill="none" stroke-linecap="round"/>
      <!-- Kraken eye -->
      <ellipse cx="50" cy="45" rx="12" ry="8" fill="#0a0a15"/>
      <ellipse cx="50" cy="45" rx="8" ry="5" fill="#1a0a20"/>
      <ellipse cx="50" cy="44" rx="4" ry="3" fill="#ff4444"/>
      <ellipse cx="52" cy="43" rx="1.5" ry="1" fill="#fff"/>
      <!-- Bubbles -->
      <circle cx="35" cy="55" r="2" fill="#4a90a4" opacity="0.5"/>
      <circle cx="62" cy="48" r="1.5" fill="#4a90a4" opacity="0.5"/>
      <circle cx="45" cy="60" r="2.5" fill="#4a90a4" opacity="0.4"/>
      <circle cx="58" cy="58" r="1.8" fill="#4a90a4" opacity="0.5"/>
    </svg>`
  }
};

export class CampaignMap {
  private container: HTMLDivElement | null = null;
  private progress: CampaignProgress;
  private onLevelSelect: (levelId: number) => void;
  private onBack: () => void;
  private justCompletedLevel: number | null = null;

  constructor(
    progress: CampaignProgress,
    onLevelSelect: (levelId: number) => void,
    onBack: () => void
  ) {
    this.progress = progress;
    this.onLevelSelect = onLevelSelect;
    this.onBack = onBack;
  }

  public show(justCompletedLevel?: number) {
    this.justCompletedLevel = justCompletedLevel || null;
    this.attachStyles();
    this.render();
  }

  public hide() {
    if (this.container && this.container.parentNode) {
      this.container.parentNode.removeChild(this.container);
      this.container = null;
    }
  }

  public updateProgress(progress: CampaignProgress) {
    this.progress = progress;
  }

  private attachStyles() {
    if (document.getElementById('campaign-map-styles')) return;

    const style = document.createElement('style');
    style.id = 'campaign-map-styles';
    style.textContent = `
      @import url('https://fonts.googleapis.com/css2?family=Pirata+One&family=IM+Fell+English:ital@0;1&display=swap');

      #campaign-map {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        z-index: 1000;
      }

      .map-backdrop {
        width: 100%;
        height: 100%;
        background: 
          radial-gradient(ellipse at center, #d4b896 0%, #c4a882 40%, #a08060 100%);
        display: flex;
        justify-content: center;
        align-items: center;
        overflow: hidden;
        position: relative;
      }

      /* Parchment texture overlay */
      .map-backdrop::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-image: 
          url("data:image/svg+xml,%3Csvg viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.08'/%3E%3C/svg%3E");
        pointer-events: none;
      }

      /* Burnt edges effect */
      .map-backdrop::after {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        box-shadow: 
          inset 0 0 100px rgba(101, 67, 33, 0.6),
          inset 0 0 200px rgba(101, 67, 33, 0.4);
        pointer-events: none;
      }

      .map-content {
        position: relative;
        z-index: 10;
        width: 95%;
        max-width: 1200px;
        height: 85%;
        display: flex;
        flex-direction: column;
      }

      .map-header {
        text-align: center;
        margin-bottom: 20px;
      }

      .map-title {
        font-family: 'Pirata One', cursive;
        font-size: 3.5rem;
        color: #3d2314;
        text-shadow: 
          2px 2px 0 #d4b896,
          3px 3px 6px rgba(0, 0, 0, 0.3);
        margin: 0;
        letter-spacing: 4px;
      }

      .map-subtitle {
        font-family: 'IM Fell English', serif;
        font-style: italic;
        font-size: 1.3rem;
        color: #5c4033;
        margin-top: 5px;
      }

      .map-area {
        flex: 1;
        position: relative;
        border: 8px solid #5c3a21;
        border-radius: 8px;
        background: 
          linear-gradient(135deg, 
            rgba(74, 144, 164, 0.3) 0%, 
            rgba(26, 95, 122, 0.4) 50%,
            rgba(13, 71, 96, 0.5) 100%);
        box-shadow: 
          inset 0 0 50px rgba(0, 0, 0, 0.3),
          0 8px 32px rgba(0, 0, 0, 0.4);
        overflow: hidden;
      }

      /* Water animation */
      .map-water {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: 
          radial-gradient(ellipse at 20% 30%, rgba(74, 144, 164, 0.2) 0%, transparent 50%),
          radial-gradient(ellipse at 80% 70%, rgba(74, 144, 164, 0.2) 0%, transparent 50%);
        animation: waterShimmer 8s ease-in-out infinite;
      }

      @keyframes waterShimmer {
        0%, 100% { opacity: 0.6; }
        50% { opacity: 1; }
      }

      /* Compass rose */
      .compass-rose {
        position: absolute;
        bottom: 20px;
        right: 20px;
        width: 80px;
        height: 80px;
        opacity: 0.7;
      }

      /* Sea monsters decoration */
      .sea-decoration {
        position: absolute;
        font-size: 2rem;
        opacity: 0.3;
        animation: float 6s ease-in-out infinite;
      }

      @keyframes float {
        0%, 100% { transform: translateY(0) rotate(-5deg); }
        50% { transform: translateY(-10px) rotate(5deg); }
      }

      /* Route path between islands */
      .route-path {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        pointer-events: none;
        z-index: 5;
      }

      .route-line {
        stroke: #3d2314;
        stroke-width: 3;
        stroke-dasharray: 15, 10;
        fill: none;
        opacity: 0.6;
      }

      .route-line.completed {
        stroke: #ffd700;
        opacity: 0.9;
        stroke-dasharray: none;
        stroke-width: 4;
        filter: drop-shadow(0 0 3px rgba(255, 215, 0, 0.5));
      }

      /* Island nodes */
      .island-container {
        position: absolute;
        transform: translate(-50%, -50%);
        z-index: 10;
        cursor: pointer;
        transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
      }

      .island-container:hover {
        transform: translate(-50%, -50%) scale(1.08);
        z-index: 20;
      }

      .island-container.locked {
        cursor: not-allowed;
        filter: grayscale(0.7) brightness(0.6);
      }

      .island-container.locked:hover {
        transform: translate(-50%, -50%) scale(1.02);
      }

      .island-node {
        position: relative;
        width: 140px;
        height: 120px;
      }

      .island-svg {
        width: 100%;
        height: 100%;
        filter: drop-shadow(3px 5px 8px rgba(0, 0, 0, 0.4));
      }

      /* Glow effect for unlocked/active islands */
      .island-container.unlocked .island-node::after {
        content: '';
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        width: 100px;
        height: 80px;
        background: radial-gradient(ellipse, rgba(255, 215, 0, 0.3) 0%, transparent 70%);
        animation: islandGlow 2s ease-in-out infinite;
        z-index: -1;
      }

      @keyframes islandGlow {
        0%, 100% { opacity: 0.5; transform: translate(-50%, -50%) scale(1); }
        50% { opacity: 1; transform: translate(-50%, -50%) scale(1.1); }
      }

      /* Current level indicator */
      .island-container.current .island-node::before {
        content: '⚓';
        position: absolute;
        top: -25px;
        left: 50%;
        transform: translateX(-50%);
        font-size: 1.8rem;
        animation: anchorBounce 1s ease-in-out infinite;
        z-index: 30;
        filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.5));
      }

      @keyframes anchorBounce {
        0%, 100% { transform: translateX(-50%) translateY(0); }
        50% { transform: translateX(-50%) translateY(-8px); }
      }

      .island-label {
        position: absolute;
        bottom: -45px;
        left: 50%;
        transform: translateX(-50%);
        text-align: center;
        width: 160px;
      }

      .island-name {
        font-family: 'Pirata One', cursive;
        font-size: 1.1rem;
        color: #3d2314;
        text-shadow: 1px 1px 0 #d4b896;
        white-space: nowrap;
      }

      .island-status {
        font-family: 'IM Fell English', serif;
        font-size: 0.85rem;
        color: #5c4033;
        margin-top: 2px;
      }

      .island-status.completed {
        color: #2e7d32;
      }

      .island-status.locked {
        color: #8b4513;
      }

      /* Level number badge */
      .level-badge {
        position: absolute;
        top: 5px;
        left: 5px;
        width: 28px;
        height: 28px;
        background: #5c3a21;
        border: 2px solid #d4a574;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-family: 'Pirata One', cursive;
        font-size: 1rem;
        color: #ffd700;
        box-shadow: 0 2px 6px rgba(0, 0, 0, 0.4);
        z-index: 15;
      }

      /* Lock icon for locked islands */
      .lock-icon {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        font-size: 2.5rem;
        z-index: 20;
        filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.6));
        animation: lockPulse 2s ease-in-out infinite;
      }

      @keyframes lockPulse {
        0%, 100% { transform: translate(-50%, -50%) scale(1); }
        50% { transform: translate(-50%, -50%) scale(1.1); }
      }

      /* Completed checkmark */
      .complete-mark {
        position: absolute;
        top: 0;
        right: 0;
        font-size: 1.8rem;
        z-index: 15;
        filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.4));
      }

      /* Footer with stats and back button */
      .map-footer {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-top: 20px;
        padding: 0 10px;
      }

      .map-stats {
        display: flex;
        gap: 30px;
      }

      .map-stat {
        display: flex;
        align-items: center;
        gap: 8px;
        font-family: 'IM Fell English', serif;
        font-size: 1.1rem;
        color: #3d2314;
      }

      .map-stat-icon {
        font-size: 1.5rem;
      }

      .map-stat-value {
        font-family: 'Pirata One', cursive;
        font-size: 1.3rem;
        color: #5c3a21;
      }

      .back-btn {
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 12px 24px;
        background: linear-gradient(135deg, #5c3a21 0%, #3d2512 100%);
        border: 3px solid #d4a574;
        border-radius: 8px;
        cursor: pointer;
        font-family: 'Pirata One', cursive;
        font-size: 1.1rem;
        color: #ffd700;
        transition: all 0.3s ease;
        box-shadow: 
          0 4px 0 #2a1a0a,
          0 6px 12px rgba(0, 0, 0, 0.3);
      }

      .back-btn:hover {
        transform: translateY(-2px);
        background: linear-gradient(135deg, #6b4a2e 0%, #4d3520 100%);
        box-shadow: 
          0 6px 0 #2a1a0a,
          0 8px 16px rgba(0, 0, 0, 0.4);
      }

      .back-btn:active {
        transform: translateY(2px);
        box-shadow: 
          0 2px 0 #2a1a0a,
          0 4px 8px rgba(0, 0, 0, 0.3);
      }

      /* Just completed animation */
      .island-container.just-completed {
        animation: justCompleted 2s ease-out;
      }

      @keyframes justCompleted {
        0% { transform: translate(-50%, -50%) scale(1); }
        25% { transform: translate(-50%, -50%) scale(1.2); }
        50% { transform: translate(-50%, -50%) scale(1.1); }
        100% { transform: translate(-50%, -50%) scale(1); }
      }

      .island-container.just-completed::after {
        content: '✨';
        position: absolute;
        top: -40px;
        left: 50%;
        transform: translateX(-50%);
        font-size: 2rem;
        animation: sparkle 1s ease-out forwards;
      }

      @keyframes sparkle {
        0% { opacity: 1; transform: translateX(-50%) translateY(0) scale(1); }
        100% { opacity: 0; transform: translateX(-50%) translateY(-30px) scale(1.5); }
      }

      /* Responsive adjustments */
      @media (max-width: 900px) {
        .map-title {
          font-size: 2.5rem;
        }
        
        .island-node {
          width: 100px;
          height: 85px;
        }
        
        .island-name {
          font-size: 0.9rem;
        }
        
        .level-badge {
          width: 22px;
          height: 22px;
          font-size: 0.85rem;
        }
      }
    `;
    document.head.appendChild(style);
  }

  private getIslandPosition(levelId: number, totalLevels: number): { x: number; y: number } {
    // Create a winding path across the map
    const positions: { [key: number]: { x: number; y: number } } = {
      1: { x: 15, y: 70 },  // Bottom left - starting beach
      2: { x: 40, y: 35 },  // Upper middle-left - cave
      3: { x: 65, y: 65 },  // Bottom right - galleon
      4: { x: 85, y: 25 },  // Top right - kraken lair
    };
    
    return positions[levelId] || { x: 50, y: 50 };
  }

  private render() {
    this.hide();

    this.container = document.createElement('div');
    this.container.id = 'campaign-map';

    const levels = CAMPAIGN_LEVELS;
    const islandPositions = levels.map(level => this.getIslandPosition(level.id, levels.length));

    // Generate route path SVG
    const routePathSvg = this.generateRoutePath(levels, islandPositions);

    // Generate islands HTML
    const islandsHtml = levels.map((level, index) => {
      const theme = ISLAND_THEMES[level.id];
      const pos = islandPositions[index];
      const isUnlocked = this.progress.unlockedLevels.includes(level.id);
      const isCompleted = this.progress.unlockedLevels.includes(level.id + 1) || 
                          (level.id === levels.length && this.progress.currentLevel > level.id);
      const isCurrent = this.progress.currentLevel === level.id;
      const isJustCompleted = this.justCompletedLevel === level.id;

      let statusClass = isUnlocked ? 'unlocked' : 'locked';
      if (isCurrent) statusClass += ' current';
      if (isJustCompleted) statusClass += ' just-completed';

      let statusText = 'Locked';
      let statusTextClass = 'locked';
      if (isCompleted) {
        statusText = '✓ Conquered';
        statusTextClass = 'completed';
      } else if (isUnlocked) {
        statusText = 'Set Sail!';
        statusTextClass = '';
      }

      return `
        <div class="island-container ${statusClass}" 
             style="left: ${pos.x}%; top: ${pos.y}%;"
             data-level-id="${level.id}"
             ${isUnlocked ? '' : 'data-locked="true"'}>
          <div class="island-node">
            <div class="level-badge">${level.id}</div>
            ${theme.iconSvg}
            ${!isUnlocked ? '<div class="lock-icon">🔒</div>' : ''}
            ${isCompleted ? '<div class="complete-mark">⭐</div>' : ''}
          </div>
          <div class="island-label">
            <div class="island-name">${theme.name}</div>
            <div class="island-status ${statusTextClass}">${statusText}</div>
          </div>
        </div>
      `;
    }).join('');

    this.container.innerHTML = `
      <div class="map-backdrop">
        <div class="map-content">
          <div class="map-header">
            <h1 class="map-title">🗺️ Treasure Map 🗺️</h1>
            <p class="map-subtitle">${this.justCompletedLevel ? 'Victory! Choose yer next destination...' : 'Choose yer destination, Captain!'}</p>
          </div>

          <div class="map-area">
            <div class="map-water"></div>
            
            <!-- Sea decorations -->
            <div class="sea-decoration" style="top: 15%; left: 8%;">🦈</div>
            <div class="sea-decoration" style="top: 75%; left: 55%; animation-delay: -2s;">🐋</div>
            <div class="sea-decoration" style="top: 45%; left: 92%; animation-delay: -4s;">🦑</div>
            
            <!-- Route paths -->
            ${routePathSvg}
            
            <!-- Islands -->
            ${islandsHtml}
            
            <!-- Compass rose -->
            <svg class="compass-rose" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="45" fill="none" stroke="#5c3a21" stroke-width="2"/>
              <polygon points="50,10 55,45 50,50 45,45" fill="#c41e3a"/>
              <polygon points="50,90 55,55 50,50 45,55" fill="#3d2314"/>
              <polygon points="10,50 45,55 50,50 45,45" fill="#3d2314"/>
              <polygon points="90,50 55,55 50,50 55,45" fill="#3d2314"/>
              <text x="50" y="8" text-anchor="middle" font-size="8" fill="#3d2314" font-family="serif">N</text>
              <text x="50" y="98" text-anchor="middle" font-size="8" fill="#3d2314" font-family="serif">S</text>
              <text x="5" y="53" text-anchor="middle" font-size="8" fill="#3d2314" font-family="serif">W</text>
              <text x="95" y="53" text-anchor="middle" font-size="8" fill="#3d2314" font-family="serif">E</text>
              <circle cx="50" cy="50" r="5" fill="#5c3a21"/>
            </svg>
          </div>

          <div class="map-footer">
            <div class="map-stats">
              <div class="map-stat">
                <span class="map-stat-icon">💰</span>
                <span>Doubloons:</span>
                <span class="map-stat-value">${this.progress.totalDoubloons}</span>
              </div>
              <div class="map-stat">
                <span class="map-stat-icon">🏝️</span>
                <span>Islands Conquered:</span>
                <span class="map-stat-value">${Math.max(0, this.progress.unlockedLevels.length - 1)}/${levels.length}</span>
              </div>
            </div>
            <button class="back-btn" id="map-back-btn">
              <span>↩️</span>
              <span>Return to Port</span>
            </button>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(this.container);
    this.attachEventListeners();
  }

  private generateRoutePath(levels: LevelData[], positions: { x: number; y: number }[]): string {
    if (positions.length < 2) return '';

    let paths = '';
    
    for (let i = 0; i < positions.length - 1; i++) {
      const from = positions[i];
      const to = positions[i + 1];
      const isCompleted = this.progress.unlockedLevels.includes(levels[i + 1].id);
      
      // Create curved path between islands
      const midX = (from.x + to.x) / 2;
      const midY = (from.y + to.y) / 2;
      const curveOffset = (i % 2 === 0 ? -15 : 15);
      
      const pathClass = isCompleted ? 'route-line completed' : 'route-line';
      
      paths += `
        <path class="${pathClass}" 
              d="M ${from.x}% ${from.y}% 
                 Q ${midX + curveOffset}% ${midY}% 
                   ${to.x}% ${to.y}%"/>
      `;
    }

    return `
      <svg class="route-path" viewBox="0 0 100 100" preserveAspectRatio="none">
        ${paths}
      </svg>
    `;
  }

  private attachEventListeners() {
    // Back button
    const backBtn = document.getElementById('map-back-btn');
    if (backBtn) {
      backBtn.onclick = () => this.onBack();
    }

    // Island click handlers
    const islands = document.querySelectorAll('.island-container:not([data-locked])');
    islands.forEach((island) => {
      island.addEventListener('click', () => {
        const levelId = parseInt(island.getAttribute('data-level-id') || '1');
        this.onLevelSelect(levelId);
      });
    });
  }
}

