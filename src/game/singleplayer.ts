import { PhysicsEngine } from "./physics";
import { GameRenderer } from "./renderer";
import { GameState, Input, EntityType, EnemyType, LevelData, CampaignProgress, CharacterType, Entity } from "../types";
import { CAMPAIGN_LEVELS, getLevelById, getNextLevel } from "./levels";
import { NavalBattle } from "./navalBattle";
import { getSoundManager, SoundEffect } from "../sound";

const FPS = 60;
const FRAME_TIME = 1000 / FPS;
const SCALE = 100;

export class SinglePlayerGame {
  private physics: PhysicsEngine;
  private renderer: GameRenderer;
  private navalBattle: NavalBattle | null = null;
  
  private state: GameState;
  private progress: CampaignProgress;
  private currentLevel: LevelData | null = null;
  
  private playerId = 'player';
  private running = false;
  private paused = false;
  private levelStartTime = 0;
  private characterType: CharacterType;
  private inNavalBattle = false;

  // Input state
  private keys = {
    left: false,
    right: false,
    jump: false,
    action: false
  };
  
  private onReturnToMenu: (() => void) | null = null;
  private onLevelComplete: ((levelId: number) => void) | null = null;

  constructor(
    renderer: GameRenderer, 
    onReturnToMenu?: () => void, 
    characterType: CharacterType = CharacterType.PIRATE,
    onLevelComplete?: (levelId: number) => void
  ) {
    this.physics = new PhysicsEngine();
    this.renderer = renderer;
    this.onReturnToMenu = onReturnToMenu || null;
    this.onLevelComplete = onLevelComplete || null;
    this.characterType = characterType;
    
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

  public async start(levelId?: number) {
    await this.renderer.initialize(document.body);
    this.renderer.setPhysics(this.physics);
    
    window.addEventListener('keydown', this.handleKeyDown);
    window.addEventListener('keyup', this.handleKeyUp);
    
    // Start background music
    getSoundManager().playBackgroundMusic();
    
    // Initialize naval battle
    this.navalBattle = new NavalBattle(this.renderer.getApp());
    
    // Use provided levelId or default to current progress
    const targetLevel = levelId || this.progress.currentLevel;
    const level = getLevelById(targetLevel);
    
    await this.startNavalBattle(level?.name || 'Unknown Waters', true, async () => {
      await this.loadLevel(targetLevel);
      this.running = true;
      this.loop();
    });
  }

  private async startNavalBattle(levelName: string, isIntro: boolean, onComplete: () => void) {
    this.inNavalBattle = true;
    this.running = false;
    
    // Hide renderer effects so naval battle is visible
    this.renderer.hideEffects();
    
    // Remove key listeners temporarily (naval battle has its own)
    window.removeEventListener('keydown', this.handleKeyDown);
    window.removeEventListener('keyup', this.handleKeyUp);
    
    this.navalBattle?.start(levelName, isIntro, () => {
      this.inNavalBattle = false;
      // Re-add key listeners
      window.addEventListener('keydown', this.handleKeyDown);
      window.addEventListener('keyup', this.handleKeyUp);
      onComplete();
    });
  }

  public stop() {
    this.running = false;
    window.removeEventListener('keydown', this.handleKeyDown);
    window.removeEventListener('keyup', this.handleKeyUp);
    getSoundManager().stopBackgroundMusic();
    
    // Clean up naval battle if active
    if (this.navalBattle) {
      this.navalBattle.stop();
    }
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
      height: this.characterType === CharacterType.OCTOPUS ? 40 : 32,
      color: this.getCharacterColor(),
      sizeModifier: 1,
      health: 3,
      doubloons: 0,
      jumpHeld: false,
      isAttacking: false,
      attackFrame: 0,
      attackCooldown: 0,
      hasSword: false,  // Player starts without sword, must collect from chest
      characterType: this.characterType
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
        const enemyType = enemy.type || EnemyType.CRAB;
        
        // Determine size based on enemy type
        let width = 32;
        let height = 24;
        let velocityX = 1;
        
        switch (enemyType) {
          case EnemyType.CRAB:
            width = 32; height = 24; velocityX = 1;
            break;
          case EnemyType.SEAGULL:
            width = 36; height = 20; velocityX = 1.5; // Faster, flying
            break;
          case EnemyType.SKELETON:
            width = 28; height = 40; velocityX = 0.8; // Taller, slower base speed
            break;
          case EnemyType.CANNON_TURRET:
            width = 48; height = 36; velocityX = 0; // Stationary
            break;
          case EnemyType.JELLYFISH:
            width = 28; height = 36; velocityX = 0; // Only moves vertically
            break;
          case EnemyType.GHOST:
            width = 32; height = 36; velocityX = 0.6; // Slow, floaty
            break;
        }
        
        const newEnemy: Entity = {
          id: `enemy_${entityId++}`,
          type: EntityType.ENEMY,
          enemyType: enemyType,
          position: { x: enemy.x, y: enemy.y },
          velocity: { x: velocityX, y: 0 },
          width,
          height,
          active: true,
          // Store spawn position for patrol bounds
          spawnX: enemy.x,
          spawnY: enemy.y,
          patrolWidth: enemy.patrolWidth || 100,
          patrolHeight: enemy.patrolHeight || 0,
          patrolDirection: 1,
          facingRight: !enemy.facingLeft,
          // Type-specific properties
          stateTimer: 0,
          phase: 0,
          isVisible: true, // For ghosts
          isCharging: false, // For skeletons
          fireRate: enemy.fireRate || 120,
          lastFired: 0
        };
        
        this.state.entities.push(newEnemy);
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
    this.renderer.showEffects(); // Show visual effects when level is active
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
    const completedLevelId = this.currentLevel.id;

    // Update progress
    this.progress.totalDoubloons += doubloons;
    
    // Record best time
    if (!this.progress.bestTimes[completedLevelId] || time < this.progress.bestTimes[completedLevelId]) {
      this.progress.bestTimes[completedLevelId] = time;
    }

    // Unlock next level
    const nextLevel = getNextLevel(completedLevelId);
    if (nextLevel && !this.progress.unlockedLevels.includes(nextLevel.id)) {
      this.progress.unlockedLevels.push(nextLevel.id);
      // Update current level to next
      this.progress.currentLevel = nextLevel.id;
    }

    this.saveProgress();

    // Show completion message
    this.renderer.showMessage(`LEVEL COMPLETE!\n${doubloons} Doubloons`, 2000);

    // Wait for message to display
    await new Promise(resolve => setTimeout(resolve, 2500));

    // Stop the current game
    this.running = false;
    this.stop();

    // If we have a level complete callback (campaign map integration), use it
    if (this.onLevelComplete) {
      this.onLevelComplete(completedLevelId);
      return;
    }

    // Fallback: direct transition (for when not using campaign map)
    if (nextLevel) {
      // Clear the current level display
      this.renderer.clearWorld();
      
      // Start naval battle before next level
      await this.startNavalBattle(nextLevel.name, false, async () => {
        await this.loadLevel(nextLevel.id);
        this.running = true;
        this.loop();
      });
    } else {
      // Game complete!
      this.renderer.showMessage("🏴‍☠️ ADVENTURE COMPLETE! 🏴‍☠️\nYe be a true pirate!", 5000);
      await new Promise(resolve => setTimeout(resolve, 5000));
      if (this.onReturnToMenu) {
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
    const player = this.state.players.get(this.playerId);
    const currentFrame = this.state.frame;
    
    for (const entity of this.state.entities) {
      if (entity.type !== EntityType.ENEMY || !entity.active) continue;
      
      const enemyType = entity.enemyType || EnemyType.CRAB;
      
      switch (enemyType) {
        case EnemyType.CRAB:
          this.updateCrab(entity);
          break;
        case EnemyType.SEAGULL:
          this.updateSeagull(entity, currentFrame);
          break;
        case EnemyType.SKELETON:
          this.updateSkeleton(entity, player);
          break;
        case EnemyType.CANNON_TURRET:
          this.updateCannon(entity, currentFrame);
          break;
        case EnemyType.JELLYFISH:
          this.updateJellyfish(entity, currentFrame);
          break;
        case EnemyType.GHOST:
          this.updateGhost(entity, currentFrame, player);
          break;
      }
    }
    
    // Update cannonballs
    this.updateCannonballs();
  }
  
  // === CRAB: Simple horizontal patrol ===
  private updateCrab(entity: Entity) {
    if (!entity.velocity) return;
    
    entity.position.x += entity.velocity.x;
    
    const spawnX = entity.spawnX || entity.position.x;
    const patrolWidth = entity.patrolWidth || 100;
    const minX = spawnX - patrolWidth / 2;
    const maxX = spawnX + patrolWidth / 2;
    
    if (entity.position.x <= minX || entity.position.x >= maxX) {
      entity.velocity.x *= -1;
      entity.facingRight = entity.velocity.x > 0;
    }
  }
  
  // === SEAGULL: Flying sine wave pattern ===
  private updateSeagull(entity: Entity, _frame: number) {
    if (!entity.velocity) return;
    
    // Horizontal movement
    entity.position.x += entity.velocity.x;
    
    const spawnX = entity.spawnX || entity.position.x;
    const spawnY = entity.spawnY || entity.position.y;
    const patrolWidth = entity.patrolWidth || 150;
    const patrolHeight = entity.patrolHeight || 60;
    
    // Patrol bounds
    const minX = spawnX - patrolWidth / 2;
    const maxX = spawnX + patrolWidth / 2;
    
    if (entity.position.x <= minX || entity.position.x >= maxX) {
      entity.velocity.x *= -1;
      entity.facingRight = entity.velocity.x > 0;
    }
    
    // Sine wave vertical movement
    entity.phase = (entity.phase || 0) + 0.05;
    entity.position.y = spawnY + Math.sin(entity.phase) * patrolHeight / 2;
  }
  
  // === SKELETON: Walks and lunges at player ===
  private updateSkeleton(entity: Entity, player: { position: { x: number; y: number } } | undefined) {
    if (!entity.velocity) return;
    
    const spawnX = entity.spawnX || entity.position.x;
    const patrolWidth = entity.patrolWidth || 100;
    const minX = spawnX - patrolWidth / 2;
    const maxX = spawnX + patrolWidth / 2;
    
    // State timer for charging
    entity.stateTimer = (entity.stateTimer || 0) + 1;
    
    // Check if player is in range for a lunge
    const lungeRange = 150; // How close player needs to be to trigger lunge
    const playerInRange = player && 
      Math.abs(player.position.x / 100 - entity.position.x) < lungeRange &&
      Math.abs(player.position.y / 100 - entity.position.y) < 60;
    
    if (entity.isCharging) {
      // During charge: move faster toward player direction
      const chargeSpeed = 3;
      entity.position.x += entity.facingRight ? chargeSpeed : -chargeSpeed;
      
      // Charge lasts 30 frames
      if (entity.stateTimer > 30) {
        entity.isCharging = false;
        entity.stateTimer = 0;
        // Reset velocity after charge
        entity.velocity.x = entity.facingRight ? 0.8 : -0.8;
      }
    } else {
      // Normal patrol
      entity.position.x += entity.velocity.x;
      
      // Patrol bounds
      if (entity.position.x <= minX || entity.position.x >= maxX) {
        entity.velocity.x *= -1;
        entity.facingRight = entity.velocity.x > 0;
      }
      
      // Start a charge if player in range and cooldown passed
      if (playerInRange && entity.stateTimer > 60) {
        entity.isCharging = true;
        entity.stateTimer = 0;
        // Face the player
        if (player) {
          entity.facingRight = player.position.x / 100 > entity.position.x;
        }
      }
    }
  }
  
  // === CANNON TURRET: Stationary, fires cannonballs ===
  private updateCannon(entity: Entity, frame: number) {
    const fireRate = entity.fireRate || 120;
    const lastFired = entity.lastFired || 0;
    
    if (frame - lastFired >= fireRate) {
      entity.lastFired = frame;
      this.fireCannonball(entity);
    }
  }
  
  private fireCannonball(cannon: Entity) {
    const ballSpeed = cannon.facingRight ? 3 : -3;
    const spawnX = cannon.facingRight 
      ? cannon.position.x + cannon.width 
      : cannon.position.x - 12;
    const spawnY = cannon.position.y + cannon.height * 0.4;
    
    getSoundManager().playSound(SoundEffect.CANNON_FIRE);
    
    this.state.entities.push({
      id: `cannonball_${Date.now()}_${Math.random()}`,
      type: EntityType.CANNONBALL,
      position: { x: spawnX, y: spawnY },
      velocity: { x: ballSpeed, y: 0 },
      width: 12,
      height: 12,
      active: true
    });
  }
  
  private updateCannonballs() {
    const level = this.currentLevel;
    
    for (const entity of this.state.entities) {
      if (entity.type !== EntityType.CANNONBALL || !entity.active) continue;
      
      // Move cannonball
      if (entity.velocity) {
        entity.position.x += entity.velocity.x;
        // Add slight gravity for arc
        entity.velocity.y = (entity.velocity.y || 0) + 0.1;
        entity.position.y += entity.velocity.y;
      }
      
      // Remove if off screen
      if (level) {
        if (entity.position.x < -50 || entity.position.x > level.width + 50 ||
            entity.position.y > level.height + 50) {
          entity.active = false;
        }
      }
    }
  }
  
  // === JELLYFISH: Floats up and down ===
  private updateJellyfish(entity: Entity, _frame: number) {
    const spawnY = entity.spawnY || entity.position.y;
    const patrolHeight = entity.patrolHeight || 100;
    
    // Smooth sine wave vertical movement
    entity.phase = (entity.phase || 0) + 0.03;
    entity.position.y = spawnY + Math.sin(entity.phase) * patrolHeight / 2;
    
    // Slight horizontal drift
    entity.position.x += Math.sin(entity.phase * 0.5) * 0.3;
  }
  
  // === GHOST: Phases in/out, patrols slowly ===
  private updateGhost(entity: Entity, _frame: number, _player: { position: { x: number; y: number } } | undefined) {
    if (!entity.velocity) return;
    
    const spawnX = entity.spawnX || entity.position.x;
    const patrolWidth = entity.patrolWidth || 100;
    
    // Phase timer (controls visibility)
    entity.stateTimer = (entity.stateTimer || 0) + 1;
    
    // Visibility cycle: visible for 180 frames, invisible for 90 frames
    const cycleLength = 270;
    const visibleDuration = 180;
    const cyclePosition = entity.stateTimer % cycleLength;
    entity.isVisible = cyclePosition < visibleDuration;
    
    // Move only when visible
    if (entity.isVisible) {
      entity.position.x += entity.velocity.x;
      
      // Patrol bounds
      const minX = spawnX - patrolWidth / 2;
      const maxX = spawnX + patrolWidth / 2;
      
      if (entity.position.x <= minX || entity.position.x >= maxX) {
        entity.velocity.x *= -1;
        entity.facingRight = entity.velocity.x > 0;
      }
      
      // Slight floating effect
      entity.phase = (entity.phase || 0) + 0.05;
      const spawnY = entity.spawnY || entity.position.y;
      entity.position.y = spawnY + Math.sin(entity.phase) * 5;
    }
  }

  public getProgress(): CampaignProgress {
    return this.progress;
  }

  public getLevels(): LevelData[] {
    return CAMPAIGN_LEVELS;
  }

  private getCharacterColor(): number {
    switch (this.characterType) {
      case CharacterType.GIRL_PIRATE:
        return 0x9b59b6; // Purple
      case CharacterType.OCTOPUS:
        return 0x8e44ad; // Deep purple
      default:
        return 0xe74c3c; // Red (classic pirate)
    }
  }
}

