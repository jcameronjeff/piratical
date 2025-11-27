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
        return `
          <svg viewBox="0 0 64 64" class="character-svg">
            <!-- Pirate Captain -->
            <rect x="12" y="28" width="40" height="28" fill="#e74c3c"/>
            <rect x="20" y="32" width="6" height="20" fill="#fff"/>
            <rect x="38" y="32" width="6" height="20" fill="#fff"/>
            <rect x="12" y="52" width="18" height="8" fill="#2c1810"/>
            <rect x="34" y="52" width="18" height="8" fill="#2c1810"/>
            <circle cx="32" cy="16" r="14" fill="#DEB887"/>
            <rect x="12" y="8" width="40" height="4" fill="#1a1a1a"/>
            <circle cx="22" cy="14" r="5" fill="#1a1a1a"/>
            <circle cx="42" cy="14" r="4" fill="#fff"/>
            <circle cx="43" cy="14" r="2" fill="#000"/>
            <rect x="20" y="24" width="24" height="6" fill="#3d2314"/>
            <path d="M4,4 L60,4 L56,-8 L32,-20 L8,-8 Z" fill="#1a1a1a"/>
            <rect x="16" y="-4" width="32" height="6" fill="#DAA520"/>
            <circle cx="32" cy="-1" r="5" fill="#fff"/>
          </svg>
        `;
      case CharacterType.GIRL_PIRATE:
        return `
          <svg viewBox="0 0 64 64" class="character-svg">
            <!-- Girl Pirate -->
            <rect x="14" y="28" width="36" height="26" fill="#9b59b6"/>
            <rect x="20" y="32" width="4" height="18" fill="#fff"/>
            <rect x="40" y="32" width="4" height="18" fill="#fff"/>
            <rect x="14" y="50" width="14" height="10" fill="#2c1810"/>
            <rect x="36" y="50" width="14" height="10" fill="#2c1810"/>
            <circle cx="32" cy="16" r="14" fill="#DEB887"/>
            <ellipse cx="32" cy="4" rx="16" ry="8" fill="#c0392b"/>
            <path d="M16,8 Q8,-6 20,-4 Q32,-2 32,6" fill="#c0392b"/>
            <path d="M48,8 Q56,-6 44,-4 Q32,-2 32,6" fill="#c0392b"/>
            <circle cx="24" cy="14" r="4" fill="#fff"/>
            <circle cx="25" cy="14" r="2" fill="#2ecc71"/>
            <circle cx="40" cy="14" r="4" fill="#fff"/>
            <circle cx="41" cy="14" r="2" fill="#2ecc71"/>
            <ellipse cx="32" cy="18" rx="2" ry="1" fill="#ffb6c1"/>
            <path d="M26,22 Q32,26 38,22" stroke="#c0392b" stroke-width="2" fill="none"/>
            <circle cx="46" cy="16" r="5" fill="#DAA520"/>
            <circle cx="18" cy="16" r="5" fill="#DAA520"/>
          </svg>
        `;
      case CharacterType.OCTOPUS:
        return `
          <svg viewBox="0 0 64 72" class="character-svg octopus-svg">
            <!-- Pirate Octopus -->
            <ellipse cx="32" cy="20" rx="24" ry="18" fill="#8e44ad"/>
            <!-- Tentacles -->
            <path d="M8,32 Q4,48 12,56 Q16,62 20,56" stroke="#8e44ad" stroke-width="8" fill="none" stroke-linecap="round"/>
            <path d="M20,36 Q16,52 22,60 Q26,66 30,58" stroke="#8e44ad" stroke-width="8" fill="none" stroke-linecap="round"/>
            <path d="M32,38 Q32,54 32,62 Q32,68 36,62" stroke="#8e44ad" stroke-width="8" fill="none" stroke-linecap="round"/>
            <path d="M44,36 Q48,52 42,60 Q38,66 34,58" stroke="#8e44ad" stroke-width="8" fill="none" stroke-linecap="round"/>
            <path d="M56,32 Q60,48 52,56 Q48,62 44,56" stroke="#8e44ad" stroke-width="8" fill="none" stroke-linecap="round"/>
            <!-- Suction cups -->
            <circle cx="12" cy="48" r="2" fill="#9b59b6"/>
            <circle cx="20" cy="52" r="2" fill="#9b59b6"/>
            <circle cx="32" cy="54" r="2" fill="#9b59b6"/>
            <circle cx="44" cy="52" r="2" fill="#9b59b6"/>
            <circle cx="52" cy="48" r="2" fill="#9b59b6"/>
            <!-- Eyes -->
            <circle cx="22" cy="18" r="7" fill="#fff"/>
            <circle cx="23" cy="18" r="4" fill="#000"/>
            <circle cx="42" cy="18" r="7" fill="#fff"/>
            <circle cx="43" cy="18" r="4" fill="#000"/>
            <circle cx="42" cy="16" r="6" fill="#1a1a1a"/>
            <!-- Pirate Hat -->
            <path d="M8,8 L56,8 L52,0 L32,-12 L12,0 Z" fill="#1a1a1a"/>
            <rect x="16" y="2" width="32" height="5" fill="#DAA520"/>
            <circle cx="32" cy="4" r="4" fill="#fff"/>
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
