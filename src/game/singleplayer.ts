import { PhysicsEngine } from "./physics";
import { GameRenderer } from "./renderer";
import { GameState, Input, EntityType, LevelData, CampaignProgress } from "../types";
import { CAMPAIGN_LEVELS, getLevelById, getNextLevel } from "./levels";

const FPS = 60;
const FRAME_TIME = 1000 / FPS;
const SCALE = 100;

export class SinglePlayerGame {
  private physics: PhysicsEngine;
  private renderer: GameRenderer;
  
  private state: GameState;
  private progress: CampaignProgress;
  private currentLevel: LevelData | null = null;
  
  private playerId = 'player';
  private running = false;
  private paused = false;
  private levelStartTime = 0;

  // Input state
  private keys = {
    left: false,
    right: false,
    jump: false,
    action: false
  };
  
  private onReturnToMenu: (() => void) | null = null;

  constructor(renderer: GameRenderer, onReturnToMenu?: () => void) {
    this.physics = new PhysicsEngine();
    this.renderer = renderer;
    this.onReturnToMenu = onReturnToMenu || null;
    
    // Load progress from localStorage
    this.progress = this.loadProgress();
    
    // Initialize State
    this.state = {
      frame: 0,
      players: new Map(),
      entities: []
    };
    
    // Input Listeners
    this.handleKeyDown = this.handleKeyDown.bind(this);
    this.handleKeyUp = this.handleKeyUp.bind(this);
  }

  private handleKeyDown(e: KeyboardEvent) {
    this.handleKey(e, true);
  }

  private handleKeyUp(e: KeyboardEvent) {
    this.handleKey(e, false);
  }

  private handleKey(e: KeyboardEvent, isDown: boolean) {
    switch(e.code) {
      case 'ArrowLeft': case 'KeyA': this.keys.left = isDown; break;
      case 'ArrowRight': case 'KeyD': this.keys.right = isDown; break;
      case 'Space': case 'ArrowUp': case 'KeyW': 
        this.keys.jump = isDown;
        if (isDown) e.preventDefault();
        break;
      case 'KeyE': case 'KeyZ': this.keys.action = isDown; break;
      case 'Escape': 
        if (isDown) this.togglePause(); 
        break;
      case 'KeyR':
        if (isDown && (this.state.levelFailed || this.paused)) {
          this.restartLevel();
        }
        break;
    }
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

  private saveProgress() {
    try {
      localStorage.setItem('piratical_progress', JSON.stringify(this.progress));
    } catch (e) {
      console.warn('Failed to save progress:', e);
    }
  }

  public async start() {
    await this.renderer.initialize(document.body);
    this.renderer.setPhysics(this.physics);
    
    window.addEventListener('keydown', this.handleKeyDown);
    window.addEventListener('keyup', this.handleKeyUp);
    
    // Start at first unlocked level or continue from saved
    await this.loadLevel(this.progress.currentLevel);
    
    this.running = true;
    this.loop();
  }

  public stop() {
    this.running = false;
    window.removeEventListener('keydown', this.handleKeyDown);
    window.removeEventListener('keyup', this.handleKeyUp);
  }

  public async loadLevel(levelId: number) {
    const level = getLevelById(levelId);
    if (!level) {
      console.error(`Level ${levelId} not found`);
      return;
    }

    this.currentLevel = level;
    this.progress.currentLevel = levelId;
    this.saveProgress();

    // Reset state
    this.state = {
      frame: 0,
      players: new Map(),
      entities: [],
      levelComplete: false,
      levelFailed: false
    };

    // Load physics level
    this.physics.loadLevel(level);

    // Create player
    this.state.players.set(this.playerId, {
      id: this.playerId,
      position: { x: level.spawnPoint.x * SCALE, y: level.spawnPoint.y * SCALE },
      velocity: { x: 0, y: 0 },
      isGrounded: false,
      facingRight: true,
      width: 32,
      height: 32,
      color: 0xe74c3c, // Nice red
      sizeModifier: 1,
      health: 3,
      doubloons: 0,
      jumpHeld: false,
      isAttacking: false,
      attackFrame: 0,
      attackCooldown: 0,
      hasSword: false  // Player starts without sword, must collect from chest
    });

    // Create entities from level data
    let entityId = 0;

    // Goal
    this.state.entities.push({
      id: `goal_${entityId++}`,
      type: EntityType.GOAL,
      position: { x: level.goalPosition.x, y: level.goalPosition.y },
      width: 40,
      height: 40,
      active: true
    });

    // Doubloons
    for (const pos of level.doubloons) {
      this.state.entities.push({
        id: `doubloon_${entityId++}`,
        type: EntityType.DOUBLOON,
        position: { x: pos.x, y: pos.y },
        width: 20,
        height: 20,
        active: true,
        collected: false
      });
    }

    // Enemies
    if (level.enemies) {
      for (const enemy of level.enemies) {
        this.state.entities.push({
          id: `enemy_${entityId++}`,
          type: EntityType.ENEMY,
          position: { x: enemy.x, y: enemy.y },
          velocity: { x: 1, y: 0 },
          width: 32,
          height: 24,
          active: true,
          patrolDirection: 1
        });
      }
    }

    // Spikes
    if (level.spikes) {
      for (const spike of level.spikes) {
        this.state.entities.push({
          id: `spike_${entityId++}`,
          type: EntityType.SPIKE,
          position: { x: spike.x, y: spike.y },
          width: spike.w,
          height: 20,
          active: true
        });
      }
    }

    // Sword Chest (power-up like Mario ? block)
    if (level.swordChest) {
      this.state.entities.push({
        id: `sword_chest_${entityId++}`,
        type: EntityType.SWORD_CHEST,
        position: { x: level.swordChest.x, y: level.swordChest.y },
        width: 32,
        height: 32,
        active: true,
        collected: false
      });
    }

    // Setup renderer
    this.renderer.clearWorld();
    this.renderer.drawMap(this.physics);
    this.renderer.setupUI(level.name);

    this.levelStartTime = Date.now();
    this.paused = false;
  }

  private togglePause() {
    if (this.paused) {
      // Unpause
      this.paused = false;
      this.renderer.hidePauseMenu();
    } else {
      // Pause
      this.paused = true;
      this.renderer.showPauseMenu(
        () => this.resumeGame(),
        () => this.restartLevel(),
        () => this.returnToMenu()
      );
    }
  }
  
  private resumeGame() {
    this.paused = false;
  }
  
  private returnToMenu() {
    if (this.onReturnToMenu) {
      this.stop();
      this.onReturnToMenu();
    }
  }

  private restartLevel() {
    this.renderer.hidePauseMenu();
    this.paused = false;
    if (this.currentLevel) {
      this.loadLevel(this.currentLevel.id);
    }
  }

  private async handleLevelComplete() {
    if (!this.currentLevel) return;

    const player = this.state.players.get(this.playerId);
    const doubloons = player?.doubloons || 0;
    const time = Date.now() - this.levelStartTime;

    // Update progress
    this.progress.totalDoubloons += doubloons;
    
    // Record best time
    if (!this.progress.bestTimes[this.currentLevel.id] || time < this.progress.bestTimes[this.currentLevel.id]) {
      this.progress.bestTimes[this.currentLevel.id] = time;
    }

    // Unlock next level
    const nextLevel = getNextLevel(this.currentLevel.id);
    if (nextLevel && !this.progress.unlockedLevels.includes(nextLevel.id)) {
      this.progress.unlockedLevels.push(nextLevel.id);
    }

    this.saveProgress();

    // Show completion message
    this.renderer.showMessage(`LEVEL COMPLETE!\n${doubloons} Doubloons`, 2000);

    // Wait then load next level or return to menu
    await new Promise(resolve => setTimeout(resolve, 2500));

    if (nextLevel) {
      await this.loadLevel(nextLevel.id);
    } else {
      // Game complete!
      this.renderer.showMessage("🏴‍☠️ ADVENTURE COMPLETE! 🏴‍☠️\nYe be a true pirate!", 5000);
      await new Promise(resolve => setTimeout(resolve, 5000));
      if (this.onReturnToMenu) {
        this.stop();
        this.onReturnToMenu();
      }
    }
  }

  private handleLevelFailed() {
    this.paused = true;
    this.renderer.showPauseMenu(
      () => this.restartLevel(), // Resume becomes restart on fail
      () => this.restartLevel(),
      () => this.returnToMenu()
    );
    this.renderer.showMessage("YE WALKED THE PLANK!", 999999);
  }

  private lastTime = 0;
  private accumulator = 0;

  private loop(time: number = 0) {
    if (!this.running) return;
    
    const deltaTime = time - this.lastTime;
    this.lastTime = time;
    
    if (!this.paused && !this.state.levelComplete && !this.state.levelFailed) {
      this.accumulator += deltaTime;

      // Fixed Update
      while (this.accumulator >= FRAME_TIME) {
        this.fixedUpdate();
        this.accumulator -= FRAME_TIME;
      }
    }

    // Check win/lose conditions
    if (this.state.levelComplete) {
      this.state.levelComplete = false; // Prevent re-triggering
      this.handleLevelComplete();
    } else if (this.state.levelFailed) {
      this.handleLevelFailed();
      this.state.levelFailed = false;
      this.paused = true;
    }

    // Render
    this.renderer.render(this.state, this.playerId);
    
    requestAnimationFrame((t) => this.loop(t));
  }

  private fixedUpdate() {
    const currentFrame = this.state.frame;

    // Create input for current frame
    const localInput: Input = {
      frame: currentFrame,
      left: this.keys.left,
      right: this.keys.right,
      jump: this.keys.jump,
      action: this.keys.action
    };

    const frameInputs = new Map<string, Input>();
    frameInputs.set(this.playerId, localInput);

    // Update enemy patrol
    this.updateEnemies();

    // Step physics
    this.physics.step(this.state, frameInputs);
    
    this.state.frame++;
  }

  private updateEnemies() {
    for (const entity of this.state.entities) {
      if (entity.type === EntityType.ENEMY && entity.active && entity.velocity) {
        // Move enemy
        entity.position.x += entity.velocity.x;
        
        // Simple patrol - reverse at level edges or after traveling
        const level = this.currentLevel;
        if (level) {
          // Find spawn data to get patrol width
          const velocityX = entity.velocity?.x || 0;
          const enemyData = level.enemies?.find(e => 
            Math.abs(e.x - entity.position.x) < 200 || 
            Math.abs(e.x - (entity.position.x - velocityX * 200)) < 200
          );
          
          if (enemyData) {
            const minX = enemyData.x - enemyData.patrolWidth / 2;
            const maxX = enemyData.x + enemyData.patrolWidth / 2;
            
            if (entity.velocity && (entity.position.x <= minX || entity.position.x >= maxX)) {
              entity.velocity.x *= -1;
            }
          }
        }
      }
    }
  }

  public getProgress(): CampaignProgress {
    return this.progress;
  }

  public getLevels(): LevelData[] {
    return CAMPAIGN_LEVELS;
  }
}

