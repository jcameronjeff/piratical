import { GameMode, CampaignProgress } from './types';
import { CAMPAIGN_LEVELS } from './game/levels';

export class MainMenu {
  private container: HTMLDivElement | null = null;
  private onModeSelect: (mode: GameMode, levelId?: number, roomCode?: string) => void;
  private progress: CampaignProgress;

  constructor(onModeSelect: (mode: GameMode, levelId?: number, roomCode?: string) => void) {
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
    `;
    document.head.appendChild(style);
  }

  private attachEventListeners(roomFromUrl: string | null) {
    // Campaign button - start directly at level 1
    const campaignBtn = document.getElementById('campaign-btn');
    if (campaignBtn) {
      campaignBtn.onclick = () => {
        console.log('Campaign clicked!');
        this.onModeSelect('campaign', 1);
      };
    }

    // Multiplayer button
    const multiplayerBtn = document.getElementById('multiplayer-btn');
    if (multiplayerBtn) {
      multiplayerBtn.onclick = () => {
        const roomCode = `SHIP-${Math.random().toString().slice(2, 6)}`;
        window.history.replaceState(null, '', `?room=${roomCode}`);
        this.onModeSelect('multiplayer', undefined, roomCode);
      };
    }

    // Join room from URL
    if (roomFromUrl) {
      const joinBtn = document.getElementById('join-room-btn');
      if (joinBtn) {
        joinBtn.onclick = () => {
          this.onModeSelect('multiplayer', undefined, roomFromUrl);
        };
      }
    }
  }
}
