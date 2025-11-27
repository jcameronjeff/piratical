import { GameMode, CampaignProgress, CharacterType, CharacterInfo } from './types';
import { CAMPAIGN_LEVELS } from './game/levels';

const CHARACTERS: CharacterInfo[] = [
  { type: CharacterType.PIRATE, name: 'Captain Jack', description: 'A classic swashbuckler', unlocked: true },
  { type: CharacterType.GIRL_PIRATE, name: 'Scarlet Rose', description: 'The fiercest corsair of the seven seas', unlocked: true },
  { type: CharacterType.OCTOPUS, name: 'Inky Pete', description: 'Eight arms of pirate fury', unlocked: true },
  { type: CharacterType.LOCKED, name: '???', description: 'Complete 5 levels to unlock', unlocked: false },
  { type: CharacterType.LOCKED, name: '???', description: 'Find all doubloons to unlock', unlocked: false },
  { type: CharacterType.LOCKED, name: '???', description: 'Defeat the Kraken to unlock', unlocked: false },
];

export class MainMenu {
  private container: HTMLDivElement | null = null;
  private onModeSelect: (mode: GameMode, levelId?: number, roomCode?: string, characterType?: CharacterType) => void;
  private progress: CampaignProgress;
  private pendingMode: GameMode | null = null;
  private pendingRoomCode: string | null = null;

  constructor(onModeSelect: (mode: GameMode, levelId?: number, roomCode?: string, characterType?: CharacterType) => void) {
    this.onModeSelect = onModeSelect;
    this.progress = this.loadProgress();
  }

  private loadProgress(): CampaignProgress {
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

  public show() {
    this.progress = this.loadProgress();
    this.render();
  }

  public hide() {
    if (this.container && this.container.parentNode) {
      this.container.parentNode.removeChild(this.container);
      this.container = null;
    }
  }

  private render() {
    // Remove any existing menu
    this.hide();
    
    const urlParams = new URLSearchParams(window.location.search);
    const roomFromUrl = urlParams.get('room');

    // Add styles first
    this.attachStyles();

    // Create container
    this.container = document.createElement('div');
    this.container.id = 'main-menu';
    this.container.innerHTML = `
      <div class="menu-backdrop">
        <div class="menu-content">
          <div class="menu-header">
            <h1 class="menu-title">
              <span class="skull">☠️</span>
              PIRATICAL
              <span class="skull">☠️</span>
            </h1>
            <p class="menu-subtitle">A Pirate Platformer Adventure</p>
          </div>

          <div class="menu-buttons">
            <button class="menu-btn campaign-btn" id="campaign-btn">
              <span class="btn-icon">⚔️</span>
              <span class="btn-text">
                <span class="btn-title">Campaign</span>
                <span class="btn-desc">Single Player Adventure</span>
              </span>
            </button>

            <button class="menu-btn multiplayer-btn" id="multiplayer-btn">
              <span class="btn-icon">🏴‍☠️</span>
              <span class="btn-text">
                <span class="btn-title">Multiplayer</span>
                <span class="btn-desc">Play with Friends</span>
              </span>
            </button>
          </div>

          ${roomFromUrl ? `
            <div class="room-invite">
              <p>You've been invited to room: <strong>${roomFromUrl}</strong></p>
              <button class="menu-btn join-btn" id="join-room-btn">
                <span class="btn-icon">🚢</span>
                <span class="btn-text">
                  <span class="btn-title">Join Room</span>
                </span>
              </button>
            </div>
          ` : ''}

          <div class="menu-stats">
            <div class="stat">
              <span class="stat-icon">💰</span>
              <span class="stat-value">${this.progress.totalDoubloons}</span>
              <span class="stat-label">Total Doubloons</span>
            </div>
            <div class="stat">
              <span class="stat-icon">🗺️</span>
              <span class="stat-value">${this.progress.unlockedLevels.length}/${CAMPAIGN_LEVELS.length}</span>
              <span class="stat-label">Levels Unlocked</span>
            </div>
          </div>

          <div class="menu-controls">
            <h3>Controls</h3>
            <div class="controls-grid">
              <div class="control"><kbd>←</kbd><kbd>→</kbd> or <kbd>A</kbd><kbd>D</kbd> Move</div>
              <div class="control"><kbd>Space</kbd> or <kbd>W</kbd> Jump</div>
              <div class="control"><kbd>Esc</kbd> Pause / Menu</div>
              <div class="control"><kbd>R</kbd> Restart Level</div>
            </div>
          </div>
        </div>

        <div class="menu-waves">
          <div class="wave wave1"></div>
          <div class="wave wave2"></div>
          <div class="wave wave3"></div>
        </div>
      </div>
    `;
    
    document.body.appendChild(this.container);
    
    // Now attach event listeners after DOM is ready
    this.attachEventListeners(roomFromUrl);
  }

  private attachStyles() {
    if (document.getElementById('menu-styles')) return;

    const style = document.createElement('style');
    style.id = 'menu-styles';
    style.textContent = `
      @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@700;900&family=Satisfy&display=swap');

      #main-menu {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        z-index: 1000;
      }

      .menu-backdrop {
        width: 100%;
        height: 100%;
        background: linear-gradient(180deg, 
          #0a1628 0%, 
          #132744 30%, 
          #1a3a52 60%,
          #1d4e6a 100%
        );
        display: flex;
        justify-content: center;
        align-items: center;
        overflow: hidden;
        position: relative;
      }

      .menu-content {
        text-align: center;
        z-index: 10;
        padding: 40px;
        max-width: 600px;
      }

      .menu-header {
        margin-bottom: 40px;
      }

      .menu-title {
        font-family: 'Cinzel', serif;
        font-size: 4rem;
        font-weight: 900;
        color: #ffd700;
        text-shadow: 
          0 0 10px rgba(255, 215, 0, 0.5),
          0 4px 0 #b8860b,
          0 6px 0 #8b6914,
          0 8px 20px rgba(0, 0, 0, 0.5);
        margin: 0;
        letter-spacing: 8px;
        animation: titleFloat 3s ease-in-out infinite;
      }

      .skull {
        display: inline-block;
        animation: skullBounce 2s ease-in-out infinite;
      }

      .skull:last-child {
        animation-delay: 0.3s;
      }

      @keyframes titleFloat {
        0%, 100% { transform: translateY(0); }
        50% { transform: translateY(-5px); }
      }

      @keyframes skullBounce {
        0%, 100% { transform: rotate(-5deg); }
        50% { transform: rotate(5deg); }
      }

      .menu-subtitle {
        font-family: 'Satisfy', cursive;
        font-size: 1.5rem;
        color: #87ceeb;
        margin-top: 10px;
        text-shadow: 0 2px 10px rgba(0, 0, 0, 0.5);
      }

      .menu-buttons {
        display: flex;
        flex-direction: column;
        gap: 20px;
        margin-bottom: 30px;
      }

      .menu-btn {
        display: flex;
        align-items: center;
        gap: 15px;
        padding: 20px 30px;
        background: linear-gradient(135deg, #8b4513 0%, #5d3a1a 100%);
        border: 3px solid #d4a574;
        border-radius: 12px;
        cursor: pointer;
        transition: all 0.3s ease;
        font-family: 'Cinzel', serif;
        color: #fff;
        text-align: left;
        box-shadow: 
          0 4px 0 #3d2512,
          0 6px 20px rgba(0, 0, 0, 0.4),
          inset 0 1px 0 rgba(255, 255, 255, 0.2);
      }

      .menu-btn:hover {
        transform: translateY(-2px);
        box-shadow: 
          0 6px 0 #3d2512,
          0 8px 30px rgba(0, 0, 0, 0.5),
          inset 0 1px 0 rgba(255, 255, 255, 0.2);
        background: linear-gradient(135deg, #a05a2c 0%, #6b4423 100%);
      }

      .menu-btn:active {
        transform: translateY(2px);
        box-shadow: 
          0 2px 0 #3d2512,
          0 4px 10px rgba(0, 0, 0, 0.4),
          inset 0 1px 0 rgba(255, 255, 255, 0.2);
      }

      .btn-icon {
        font-size: 2rem;
      }

      .btn-text {
        display: flex;
        flex-direction: column;
      }

      .btn-title {
        font-size: 1.3rem;
        font-weight: 700;
      }

      .btn-desc {
        font-size: 0.9rem;
        opacity: 0.8;
        font-family: sans-serif;
      }

      .room-invite {
        background: rgba(255, 215, 0, 0.1);
        border: 2px solid #ffd700;
        border-radius: 12px;
        padding: 20px;
        margin-bottom: 30px;
      }

      .room-invite p {
        color: #ffd700;
        margin: 0 0 15px 0;
        font-family: 'Cinzel', serif;
      }

      .join-btn {
        width: 100%;
        justify-content: center;
        background: linear-gradient(135deg, #2e7d32 0%, #1b5e20 100%);
        border-color: #81c784;
      }

      .join-btn:hover {
        background: linear-gradient(135deg, #388e3c 0%, #2e7d32 100%);
      }

      .menu-stats {
        display: flex;
        justify-content: center;
        gap: 40px;
        margin-bottom: 30px;
      }

      .stat {
        display: flex;
        flex-direction: column;
        align-items: center;
        background: rgba(0, 0, 0, 0.3);
        padding: 15px 25px;
        border-radius: 10px;
        border: 2px solid rgba(255, 255, 255, 0.1);
      }

      .stat-icon {
        font-size: 1.5rem;
        margin-bottom: 5px;
      }

      .stat-value {
        font-family: 'Cinzel', serif;
        font-size: 1.5rem;
        color: #ffd700;
        font-weight: 700;
      }

      .stat-label {
        font-size: 0.8rem;
        color: #87ceeb;
        text-transform: uppercase;
        letter-spacing: 1px;
      }

      .menu-controls {
        background: rgba(0, 0, 0, 0.3);
        padding: 20px;
        border-radius: 10px;
        border: 2px solid rgba(255, 255, 255, 0.1);
      }

      .menu-controls h3 {
        color: #ffd700;
        font-family: 'Cinzel', serif;
        margin: 0 0 15px 0;
      }

      .controls-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 10px;
      }

      .control {
        color: #87ceeb;
        font-size: 0.9rem;
      }

      kbd {
        background: #1a3a52;
        padding: 4px 8px;
        border-radius: 4px;
        border: 1px solid #2d5a7b;
        font-family: monospace;
        color: #fff;
        margin: 0 2px;
      }

      /* Waves Animation */
      .menu-waves {
        position: absolute;
        bottom: 0;
        left: 0;
        width: 100%;
        height: 150px;
        overflow: hidden;
      }

      .wave {
        position: absolute;
        bottom: 0;
        left: 0;
        width: 200%;
        height: 100%;
        background: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1200 120' preserveAspectRatio='none'%3E%3Cpath d='M0,0 C150,100 350,0 500,50 C650,100 800,20 1000,80 C1100,100 1200,50 1200,50 L1200,120 L0,120 Z' fill='%23234e6f'/%3E%3C/svg%3E");
        background-size: 50% 100%;
        animation: wave 8s linear infinite;
      }

      .wave2 {
        opacity: 0.5;
        animation-duration: 10s;
        animation-delay: -2s;
      }

      .wave3 {
        opacity: 0.3;
        animation-duration: 12s;
        animation-delay: -4s;
      }

      @keyframes wave {
        0% { transform: translateX(0); }
        100% { transform: translateX(-50%); }
      }

      /* Character Selection Styles */
      .character-select-content {
        text-align: center;
        z-index: 10;
        padding: 30px;
        max-width: 900px;
      }

      .character-title {
        font-family: 'Cinzel', serif;
        font-size: 2.8rem;
        font-weight: 900;
        color: #ffd700;
        text-shadow: 
          0 0 10px rgba(255, 215, 0, 0.5),
          0 4px 0 #b8860b,
          0 6px 0 #8b6914,
          0 8px 20px rgba(0, 0, 0, 0.5);
        margin: 0;
        letter-spacing: 4px;
        animation: titleFloat 3s ease-in-out infinite;
      }

      .anchor {
        display: inline-block;
        animation: anchorSwing 3s ease-in-out infinite;
      }

      .anchor:last-child {
        animation-delay: 0.5s;
      }

      @keyframes anchorSwing {
        0%, 100% { transform: rotate(-10deg); }
        50% { transform: rotate(10deg); }
      }

      .character-grid {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 20px;
        margin: 30px 0;
      }

      .character-card {
        position: relative;
        background: linear-gradient(145deg, #2a4a5a 0%, #1a3040 100%);
        border: 3px solid #4a7a8a;
        border-radius: 16px;
        padding: 20px 15px;
        cursor: pointer;
        transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        overflow: hidden;
      }

      .character-card.unlocked:hover {
        transform: translateY(-8px) scale(1.02);
        border-color: #ffd700;
        box-shadow: 
          0 15px 40px rgba(0, 0, 0, 0.4),
          0 0 30px rgba(255, 215, 0, 0.3),
          inset 0 1px 0 rgba(255, 255, 255, 0.2);
      }

      .character-card.unlocked:active {
        transform: translateY(-2px) scale(0.98);
      }

      .character-card.locked {
        cursor: not-allowed;
        filter: grayscale(0.8);
        opacity: 0.7;
      }

      .character-avatar {
        width: 100%;
        height: 120px;
        display: flex;
        align-items: center;
        justify-content: center;
        margin-bottom: 12px;
        position: relative;
      }

      .character-svg {
        width: 90px;
        height: 90px;
        filter: drop-shadow(0 4px 8px rgba(0,0,0,0.4));
      }

      .octopus-svg {
        height: 100px;
      }

      .character-card.unlocked:hover .character-svg {
        animation: characterBounce 0.5s ease-in-out;
      }

      @keyframes characterBounce {
        0%, 100% { transform: scale(1); }
        50% { transform: scale(1.1); }
      }

      .locked-avatar {
        background: linear-gradient(145deg, #1a1a1a 0%, #0a0a0a 100%);
        border-radius: 50%;
        width: 100px;
        height: 100px;
        margin: 0 auto;
      }

      .locked-silhouette {
        font-size: 48px;
        color: #333;
        text-shadow: 0 0 10px rgba(0,0,0,0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        width: 100px;
        height: 100px;
        background: radial-gradient(circle, #2a2a2a 0%, #0a0a0a 100%);
        border-radius: 50%;
        border: 3px dashed #444;
      }

      .lock-overlay {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        font-size: 48px;
        text-shadow: 0 4px 10px rgba(0,0,0,0.8);
        z-index: 10;
        animation: lockPulse 2s ease-in-out infinite;
      }

      @keyframes lockPulse {
        0%, 100% { transform: translate(-50%, -50%) scale(1); }
        50% { transform: translate(-50%, -50%) scale(1.1); }
      }

      .character-info {
        text-align: center;
      }

      .character-name {
        font-family: 'Cinzel', serif;
        font-size: 1.2rem;
        color: #ffd700;
        margin: 0 0 6px 0;
        text-shadow: 0 2px 4px rgba(0,0,0,0.5);
      }

      .character-desc {
        font-family: 'Satisfy', cursive;
        font-size: 0.95rem;
        color: #87ceeb;
        margin: 0;
        line-height: 1.3;
      }

      .back-btn {
        margin-top: 10px;
        justify-content: center;
        background: linear-gradient(135deg, #4a4a4a 0%, #2a2a2a 100%) !important;
        border-color: #6a6a6a !important;
      }

      .back-btn:hover {
        background: linear-gradient(135deg, #5a5a5a 0%, #3a3a3a 100%) !important;
      }

      /* Responsive adjustments */
      @media (max-width: 800px) {
        .character-grid {
          grid-template-columns: repeat(2, 1fr);
          gap: 15px;
        }
        
        .character-title {
          font-size: 2rem;
        }
        
        .character-svg {
          width: 70px;
          height: 70px;
        }
      }
    `;
    document.head.appendChild(style);
  }

  private attachEventListeners(roomFromUrl: string | null) {
    // Campaign button - show character selection
    const campaignBtn = document.getElementById('campaign-btn');
    if (campaignBtn) {
      campaignBtn.onclick = () => {
        console.log('Campaign clicked!');
        this.pendingMode = 'campaign';
        this.pendingRoomCode = null;
        this.showCharacterSelection();
      };
    }

    // Multiplayer button - show character selection
    const multiplayerBtn = document.getElementById('multiplayer-btn');
    if (multiplayerBtn) {
      multiplayerBtn.onclick = () => {
        const roomCode = `SHIP-${Math.random().toString().slice(2, 6)}`;
        window.history.replaceState(null, '', `?room=${roomCode}`);
        this.pendingMode = 'multiplayer';
        this.pendingRoomCode = roomCode;
        this.showCharacterSelection();
      };
    }

    // Join room from URL - show character selection
    if (roomFromUrl) {
      const joinBtn = document.getElementById('join-room-btn');
      if (joinBtn) {
        joinBtn.onclick = () => {
          this.pendingMode = 'multiplayer';
          this.pendingRoomCode = roomFromUrl;
          this.showCharacterSelection();
        };
      }
    }
  }

  private showCharacterSelection() {
    // Remove any existing menu
    this.hide();
    
    this.container = document.createElement('div');
    this.container.id = 'main-menu';
    this.container.innerHTML = `
      <div class="menu-backdrop">
        <div class="character-select-content">
          <div class="menu-header">
            <h1 class="character-title">
              <span class="anchor">⚓</span>
              Choose Yer Pirate
              <span class="anchor">⚓</span>
            </h1>
            <p class="menu-subtitle">Select a character to begin</p>
          </div>

          <div class="character-grid">
            ${CHARACTERS.map((char, index) => `
              <div class="character-card ${char.unlocked ? 'unlocked' : 'locked'}" data-character="${char.type}" data-index="${index}">
                <div class="character-avatar ${char.unlocked ? '' : 'locked-avatar'}">
                  ${this.getCharacterPreview(char)}
                </div>
                <div class="character-info">
                  <h3 class="character-name">${char.name}</h3>
                  <p class="character-desc">${char.description}</p>
                </div>
                ${!char.unlocked ? '<div class="lock-overlay">🔒</div>' : ''}
              </div>
            `).join('')}
          </div>

          <button class="menu-btn back-btn" id="back-btn">
            <span class="btn-icon">↩️</span>
            <span class="btn-text">
              <span class="btn-title">Back to Menu</span>
            </span>
          </button>
        </div>

        <div class="menu-waves">
          <div class="wave wave1"></div>
          <div class="wave wave2"></div>
          <div class="wave wave3"></div>
        </div>
      </div>
    `;
    
    document.body.appendChild(this.container);
    this.attachCharacterSelectListeners();
  }

  private getCharacterPreview(char: CharacterInfo): string {
    if (!char.unlocked) {
      return `<div class="locked-silhouette">?</div>`;
    }
    
    switch(char.type) {
      case CharacterType.PIRATE:
        // Captain Jack - Classic Swashbuckler with red coat, gold epaulets, tricorn hat
        return `
          <svg viewBox="0 0 64 80" class="character-svg">
            <!-- CAPTAIN JACK - Classic Swashbuckler -->
            <!-- Red Military Coat -->
            <rect x="10" y="32" width="44" height="28" fill="#B22222"/>
            <!-- Coat lapels -->
            <path d="M16,32 L32,42 L48,32 L44,32 L32,39 L20,32 Z" fill="#8B0000"/>
            <!-- White shirt underneath -->
            <path d="M22,32 L32,38 L42,32 Z" fill="#FFF8DC"/>
            <!-- Gold buttons -->
            <circle cx="32" cy="42" r="2" fill="#FFD700"/>
            <circle cx="32" cy="50" r="2" fill="#FFD700"/>
            <!-- Gold coat trim -->
            <rect x="10" y="32" width="2" height="28" fill="#DAA520"/>
            <rect x="52" y="32" width="2" height="28" fill="#DAA520"/>
            <!-- Gold Epaulets -->
            <ellipse cx="10" cy="35" rx="6" ry="4" fill="#FFD700"/>
            <ellipse cx="54" cy="35" rx="6" ry="4" fill="#FFD700"/>
            <!-- Epaulet fringe -->
            <line x1="6" y1="38" x2="6" y2="44" stroke="#DAA520" stroke-width="1.5"/>
            <line x1="9" y1="38" x2="9" y2="44" stroke="#DAA520" stroke-width="1.5"/>
            <line x1="12" y1="38" x2="12" y2="44" stroke="#DAA520" stroke-width="1.5"/>
            <line x1="52" y1="38" x2="52" y2="44" stroke="#DAA520" stroke-width="1.5"/>
            <line x1="55" y1="38" x2="55" y2="44" stroke="#DAA520" stroke-width="1.5"/>
            <line x1="58" y1="38" x2="58" y2="44" stroke="#DAA520" stroke-width="1.5"/>
            <!-- Dark pants -->
            <rect x="14" y="58" width="14" height="14" fill="#1a1a2e"/>
            <rect x="36" y="58" width="14" height="14" fill="#1a1a2e"/>
            <!-- Boots -->
            <rect x="12" y="68" width="16" height="8" fill="#2d1810"/>
            <rect x="36" y="68" width="16" height="8" fill="#2d1810"/>
            <rect x="16" y="70" width="6" height="3" fill="#DAA520"/>
            <rect x="42" y="70" width="6" height="3" fill="#DAA520"/>
            <!-- Head -->
            <circle cx="32" cy="18" r="14" fill="#DEB887"/>
            <!-- Eye patch strap -->
            <rect x="14" y="12" width="36" height="3" fill="#1a1a1a"/>
            <!-- Eye patch -->
            <circle cx="22" cy="16" r="5" fill="#1a1a1a"/>
            <!-- Visible eye -->
            <circle cx="42" cy="16" r="4" fill="#fff"/>
            <circle cx="42" cy="16" r="2.5" fill="#4a3728"/>
            <circle cx="43" cy="16" r="1.2" fill="#000"/>
            <circle cx="41" cy="15" r="1" fill="#fff"/>
            <!-- Thick dark beard -->
            <path d="M18,22 Q32,36 46,22 L46,18 Q32,28 18,18 Z" fill="#1a1a1a"/>
            <!-- Mustache -->
            <ellipse cx="26" cy="22" rx="5" ry="2.5" fill="#1a1a1a"/>
            <ellipse cx="38" cy="22" rx="5" ry="2.5" fill="#1a1a1a"/>
            <!-- Gold earring -->
            <circle cx="50" cy="20" r="3" fill="#FFD700"/>
            <circle cx="50" cy="20" r="1.5" fill="#DEB887"/>
            <!-- Tricorn Hat with skull & crossbones -->
            <path d="M2,8 L62,8 L56,0 Q32,-16 8,0 Z" fill="#1a1a1a"/>
            <!-- Hat curls -->
            <path d="M2,8 Q0,0 10,4" fill="#2a2a2a"/>
            <path d="M62,8 Q64,0 54,4" fill="#2a2a2a"/>
            <!-- Gold hat band -->
            <rect x="10" y="4" width="44" height="5" fill="#DAA520"/>
            <!-- Skull -->
            <circle cx="32" cy="0" r="6" fill="#fff"/>
            <rect x="26" y="2" width="12" height="4" fill="#fff"/>
            <!-- Skull eyes -->
            <circle cx="29" cy="-1" r="2" fill="#1a1a1a"/>
            <circle cx="35" cy="-1" r="2" fill="#1a1a1a"/>
            <!-- Skull nose -->
            <path d="M32,1 L30,4 L34,4 Z" fill="#1a1a1a"/>
            <!-- Crossbones -->
            <line x1="20" y1="-6" x2="44" y2="6" stroke="#fff" stroke-width="3" stroke-linecap="round"/>
            <line x1="44" y1="-6" x2="20" y2="6" stroke="#fff" stroke-width="3" stroke-linecap="round"/>
            <!-- Belt -->
            <rect x="10" y="56" width="44" height="5" fill="#2d1810"/>
            <rect x="26" y="55" width="12" height="7" fill="#FFD700"/>
            <rect x="28" y="57" width="8" height="4" fill="#2d1810"/>
          </svg>
        `;
      case CharacterType.GIRL_PIRATE:
        // Scarlet Rose - Fierce corsair with red hair, purple vest, pistol
        return `
          <svg viewBox="0 0 64 80" class="character-svg">
            <!-- SCARLET ROSE - Fierce Corsair -->
            <!-- White blouse base -->
            <rect x="14" y="32" width="36" height="24" fill="#FFF8F0"/>
            <!-- Purple vest/corset -->
            <path d="M14,36 L18,32 L46,32 L50,36 L50,54 L14,54 Z" fill="#6B2D5C"/>
            <!-- Vest lacing -->
            <line x1="28" y1="36" x2="36" y2="40" stroke="#FFD700" stroke-width="1"/>
            <line x1="28" y1="44" x2="36" y2="48" stroke="#FFD700" stroke-width="1"/>
            <!-- Blouse ruffles -->
            <ellipse cx="32" cy="33" rx="8" ry="3" fill="#fff"/>
            <!-- Dark leather pants -->
            <rect x="14" y="54" width="14" height="16" fill="#2c1810"/>
            <rect x="36" y="54" width="14" height="16" fill="#2c1810"/>
            <!-- Tall boots -->
            <rect x="12" y="64" width="16" height="12" fill="#4a3020"/>
            <rect x="36" y="64" width="16" height="12" fill="#4a3020"/>
            <rect x="12" y="62" width="16" height="5" fill="#5a4030"/>
            <rect x="36" y="62" width="16" height="5" fill="#5a4030"/>
            <rect x="18" y="64" width="5" height="3" fill="#DAA520"/>
            <rect x="42" y="64" width="5" height="3" fill="#DAA520"/>
            <!-- Head -->
            <circle cx="32" cy="18" r="14" fill="#F5DEB3"/>
            <!-- Flowing red hair - main volume -->
            <ellipse cx="32" cy="6" rx="18" ry="12" fill="#CC3300"/>
            <!-- Left hair waves -->
            <path d="M10,8 Q0,20 6,36 Q10,44 16,50 Q10,38 12,28 Q8,18 10,8" fill="#CC3300"/>
            <path d="M14,10 Q6,24 10,40 Q12,32 14,10" fill="#CC3300"/>
            <!-- Right hair waves -->
            <path d="M54,8 Q64,20 58,36 Q54,44 48,50 Q54,38 52,28 Q56,18 54,8" fill="#CC3300"/>
            <path d="M50,10 Q58,24 54,40 Q52,32 50,10" fill="#CC3300"/>
            <!-- Hair highlights -->
            <ellipse cx="26" cy="6" rx="5" ry="4" fill="#FF6633" fill-opacity="0.6"/>
            <ellipse cx="38" cy="5" rx="4" ry="3" fill="#FF6633" fill-opacity="0.6"/>
            <!-- Eyes - fierce and determined -->
            <ellipse cx="24" cy="16" rx="4" ry="3.5" fill="#fff"/>
            <ellipse cx="40" cy="16" rx="4" ry="3.5" fill="#fff"/>
            <!-- Dark green eyes -->
            <circle cx="24" cy="16" r="2.5" fill="#2E5D4E"/>
            <circle cx="40" cy="16" r="2.5" fill="#2E5D4E"/>
            <circle cx="24" cy="16" r="1.2" fill="#000"/>
            <circle cx="40" cy="16" r="1.2" fill="#000"/>
            <!-- Eye highlights -->
            <circle cx="23" cy="15" r="0.8" fill="#fff"/>
            <circle cx="39" cy="15" r="0.8" fill="#fff"/>
            <!-- Defined eyebrows -->
            <line x1="18" y1="11" x2="28" y2="11" stroke="#8B4513" stroke-width="2"/>
            <line x1="36" y1="11" x2="46" y2="11" stroke="#8B4513" stroke-width="2"/>
            <!-- Nose -->
            <ellipse cx="32" cy="21" rx="2" ry="1.5" fill="#E8C8A8"/>
            <!-- Full red lips -->
            <ellipse cx="32" cy="26" rx="4" ry="2" fill="#B33333"/>
            <ellipse cx="30" cy="25" rx="2" ry="0.8" fill="#FF6666" fill-opacity="0.5"/>
            <!-- Rosy cheeks -->
            <circle cx="16" cy="22" r="3" fill="#FFB6C1" fill-opacity="0.4"/>
            <circle cx="48" cy="22" r="3" fill="#FFB6C1" fill-opacity="0.4"/>
            <!-- Gold earrings -->
            <circle cx="10" cy="24" r="3" fill="#FFD700"/>
            <circle cx="54" cy="24" r="3" fill="#FFD700"/>
            <!-- Pistol in hand (left side) -->
            <rect x="-4" y="42" width="18" height="4" fill="#4a4a4a"/>
            <circle cx="-4" cy="44" r="2.5" fill="#3a3a3a"/>
            <path d="M8,44 L12,52 L16,52 L14,44" fill="#5D4037"/>
            <rect x="4" y="40" width="4" height="5" fill="#DAA520"/>
            <!-- Brown leather glove -->
            <rect x="2" y="38" width="10" height="16" fill="#5D4037"/>
            <circle cx="8" cy="55" r="4" fill="#5D4037"/>
            <!-- Belt -->
            <rect x="10" y="52" width="44" height="4" fill="#4a3020"/>
            <circle cx="32" cy="54" r="4" fill="#FFD700"/>
            <circle cx="32" cy="54" r="2" fill="#DAA520"/>
          </svg>
        `;
      case CharacterType.OCTOPUS:
        // Inky Pete - Mischievous purple octopus
        return `
          <svg viewBox="0 0 64 80" class="character-svg octopus-svg">
            <!-- INKY PETE - Mischievous Purple Octopus -->
            <!-- Back tentacles -->
            <path d="M6,36 Q-4,52 4,64 Q10,72 16,66 Q12,56 14,46 Q10,40 10,36" fill="#5D3A6E"/>
            <path d="M58,36 Q68,52 60,64 Q54,72 48,66 Q52,56 50,46 Q54,40 54,36" fill="#5D3A6E"/>
            <!-- Back tentacle suckers -->
            <circle cx="6" cy="56" r="2.5" fill="#E8D4F0"/>
            <circle cx="58" cy="56" r="2.5" fill="#E8D4F0"/>
            <!-- Main bulbous body -->
            <ellipse cx="32" cy="24" rx="24" ry="20" fill="#7B4B94"/>
            <!-- Body highlight -->
            <ellipse cx="24" cy="16" rx="12" ry="8" fill="#9B6BB0" fill-opacity="0.5"/>
            <!-- Body spots -->
            <circle cx="18" cy="30" r="4" fill="#5D3A6E" fill-opacity="0.4"/>
            <circle cx="46" cy="30" r="4" fill="#5D3A6E" fill-opacity="0.4"/>
            <circle cx="32" cy="36" r="3" fill="#5D3A6E" fill-opacity="0.4"/>
            <!-- Front tentacles -->
            <path d="M12,40 Q4,56 12,68 Q18,76 22,70 Q18,60 20,50 Q16,44 16,40" fill="#7B4B94"/>
            <path d="M20,42 Q14,58 22,70 Q28,78 32,72 Q28,62 28,52 Q24,46 24,42" fill="#7B4B94"/>
            <path d="M40,42 Q46,58 40,70 Q34,78 30,72 Q34,62 34,52 Q38,46 38,42" fill="#7B4B94"/>
            <path d="M52,40 Q60,56 52,68 Q46,76 42,70 Q46,60 44,50 Q48,44 48,40" fill="#7B4B94"/>
            <!-- Front tentacle suckers -->
            <circle cx="14" cy="58" r="2.5" fill="#E8D4F0"/>
            <circle cx="18" cy="66" r="2" fill="#E8D4F0"/>
            <circle cx="24" cy="60" r="2" fill="#E8D4F0"/>
            <circle cx="26" cy="68" r="1.8" fill="#E8D4F0"/>
            <circle cx="38" cy="60" r="2" fill="#E8D4F0"/>
            <circle cx="36" cy="68" r="1.8" fill="#E8D4F0"/>
            <circle cx="50" cy="58" r="2.5" fill="#E8D4F0"/>
            <circle cx="46" cy="66" r="2" fill="#E8D4F0"/>
            <!-- Large expressive eyes (yellow for mischief) -->
            <ellipse cx="22" cy="22" rx="8" ry="10" fill="#FFFFE0"/>
            <ellipse cx="42" cy="22" rx="8" ry="10" fill="#FFFFE0"/>
            <!-- Yellow irises -->
            <ellipse cx="24" cy="22" rx="5" ry="7" fill="#FFD700"/>
            <ellipse cx="44" cy="22" rx="5" ry="7" fill="#FFD700"/>
            <!-- Pupils -->
            <ellipse cx="25" cy="22" rx="3" ry="5" fill="#000"/>
            <ellipse cx="45" cy="22" rx="3" ry="5" fill="#000"/>
            <!-- Eye shine -->
            <circle cx="21" cy="18" r="2.5" fill="#fff"/>
            <circle cx="41" cy="18" r="2.5" fill="#fff"/>
            <circle cx="26" cy="26" r="1.5" fill="#fff"/>
            <circle cx="46" cy="26" r="1.5" fill="#fff"/>
            <!-- Mischievous eyelid shadows -->
            <path d="M14,14 Q22,10 30,16 L30,18 Q22,14 14,18 Z" fill="#5D3A6E" fill-opacity="0.6"/>
            <path d="M34,14 Q42,10 50,16 L50,18 Q42,14 34,18 Z" fill="#5D3A6E" fill-opacity="0.5"/>
            <!-- Wide mischievous grin -->
            <path d="M20,36 Q32,48 44,36 Q32,42 20,36" fill="#2D1B2E"/>
            <!-- Teeth showing -->
            <rect x="26" y="36" width="4" height="3" fill="#fff"/>
            <rect x="34" y="36" width="4" height="3" fill="#fff"/>
            <!-- Sly smile line -->
            <path d="M44,36 Q48,34 52,35" stroke="#5D3A6E" stroke-width="2" fill="none"/>
            <!-- Tilted pirate hat -->
            <path d="M6,6 L58,10 L52,2 Q32,-12 12,0 Z" fill="#1a1a1a"/>
            <!-- Gold hat band -->
            <rect x="14" y="2" width="36" height="5" fill="#DAA520"/>
            <!-- Skull emblem -->
            <circle cx="32" cy="4" r="4" fill="#fff"/>
            <circle cx="30" cy="3" r="1" fill="#1a1a1a"/>
            <circle cx="34" cy="3" r="1" fill="#1a1a1a"/>
            <!-- Small crossbones -->
            <line x1="24" y1="0" x2="40" y2="8" stroke="#fff" stroke-width="2" stroke-linecap="round"/>
            <line x1="40" y1="0" x2="24" y2="8" stroke="#fff" stroke-width="2" stroke-linecap="round"/>
          </svg>
        `;
      default:
        return `<div class="locked-silhouette">?</div>`;
    }
  }

  private attachCharacterSelectListeners() {
    // Back button
    const backBtn = document.getElementById('back-btn');
    if (backBtn) {
      backBtn.onclick = () => {
        this.pendingMode = null;
        this.pendingRoomCode = null;
        this.render();
      };
    }

    // Character cards
    const cards = document.querySelectorAll('.character-card.unlocked');
    cards.forEach((card) => {
      card.addEventListener('click', () => {
        const characterType = card.getAttribute('data-character') as CharacterType;
        if (characterType && this.pendingMode) {
          if (this.pendingMode === 'campaign') {
            this.onModeSelect('campaign', 1, undefined, characterType);
          } else if (this.pendingMode === 'multiplayer') {
            this.onModeSelect('multiplayer', undefined, this.pendingRoomCode || undefined, characterType);
          }
          this.pendingMode = null;
          this.pendingRoomCode = null;
        }
      });
    });
  }
}
