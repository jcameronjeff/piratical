import * as PIXI from 'pixi.js';
import { GameState, EntityType, EnemyType, LevelData, Entity, CharacterType } from '../types';
import { PhysicsEngine } from './physics';

const SCALE = 100;

export class GameRenderer {
  private app: PIXI.Application;
  private playerSprites: Map<string, PIXI.Container>;
  private entitySprites: Map<string, PIXI.Graphics>;
  private obstacleGraphics: PIXI.Graphics;
  private backgroundGraphics: PIXI.Graphics;
  private uiContainer: PIXI.Container;
  private pauseMenu: PIXI.Container | null = null;
  private messageText: PIXI.Text | null = null;
  private physics: PhysicsEngine | null = null;
  private camera: { x: number; y: number } = { x: 0, y: 0 };
  private worldContainer: PIXI.Container;

  constructor() {
    this.app = new PIXI.Application();
    this.playerSprites = new Map();
    this.entitySprites = new Map();
    this.obstacleGraphics = new PIXI.Graphics();
    this.backgroundGraphics = new PIXI.Graphics();
    this.uiContainer = new PIXI.Container();
    this.worldContainer = new PIXI.Container();
  }

  public async initialize(element: HTMLElement) {
    await this.app.init({ 
      width: 800, 
      height: 600, 
      backgroundColor: 0x1a3a52,
      antialias: true
    });
    element.appendChild(this.app.canvas);
    
    // Add containers in order (back to front)
    this.worldContainer.addChild(this.backgroundGraphics);
    this.worldContainer.addChild(this.obstacleGraphics);
    this.app.stage.addChild(this.worldContainer);
    this.app.stage.addChild(this.uiContainer);
  }

  public setPhysics(physics: PhysicsEngine) {
    this.physics = physics;
  }

  public getCanvas(): HTMLCanvasElement {
    return this.app.canvas;
  }

  public clearWorld() {
    // Clear all sprites
    this.playerSprites.forEach((sprite) => {
      this.worldContainer.removeChild(sprite);
    });
    this.playerSprites.clear();
    
    this.entitySprites.forEach((sprite) => {
      this.worldContainer.removeChild(sprite);
    });
    this.entitySprites.clear();
    
    this.obstacleGraphics.clear();
    this.backgroundGraphics.clear();
  }

  public drawMap(physics: PhysicsEngine) {
    this.obstacleGraphics.clear();
    
    const level = physics.getCurrentLevel();
    
    // Draw background first
    if (level) {
      this.drawLevelBackground(this.backgroundGraphics, level);
    }
    
    // Draw platforms
    const obstacles = physics.getObstacles();
    obstacles.forEach(obs => {
      // Platform styling
      this.obstacleGraphics.fill(0x8B4513); // Brown wood color
      this.obstacleGraphics.rect(
        obs.pos.x / SCALE,
        obs.pos.y / SCALE,
        obs.w / SCALE,
        obs.h / SCALE
      );
      this.obstacleGraphics.fill();
      
      // Top edge highlight
      this.obstacleGraphics.fill(0x654321);
      this.obstacleGraphics.rect(
        obs.pos.x / SCALE,
        obs.pos.y / SCALE,
        obs.w / SCALE,
        4
      );
      this.obstacleGraphics.fill();
    });
  }

  public setupUI(levelName: string) {
    // Clear existing UI
    this.uiContainer.removeChildren();
    
    // Level name text
    const nameText = new PIXI.Text({
      text: levelName,
      style: {
        fontFamily: 'Arial',
        fontSize: 24,
        fill: 0xFFFFFF,
        stroke: { color: 0x000000, width: 3 }
      }
    });
    nameText.x = 10;
    nameText.y = 10;
    this.uiContainer.addChild(nameText);
  }

  public showPauseMenu(onResume: () => void, onRestart: () => void, onReturnToMenu: () => void) {
    if (this.pauseMenu) return;
    
    this.pauseMenu = new PIXI.Container();
    
    // Semi-transparent background
    const bg = new PIXI.Graphics();
    bg.fill({ color: 0x000000, alpha: 0.7 });
    bg.rect(0, 0, 800, 600);
    bg.fill();
    this.pauseMenu.addChild(bg);
    
    // Pause text
    const pauseText = new PIXI.Text({
      text: 'PAUSED',
      style: {
        fontFamily: 'Arial',
        fontSize: 48,
        fill: 0xFFD700,
        stroke: { color: 0x000000, width: 4 }
      }
    });
    pauseText.anchor.set(0.5);
    pauseText.x = 400;
    pauseText.y = 150;
    this.pauseMenu.addChild(pauseText);
    
    // Create buttons
    const buttonStyle = {
      fontFamily: 'Arial',
      fontSize: 28,
      fill: 0xFFFFFF
    };
    
    const resumeBtn = this.createButton('Resume (ESC)', 400, 250, buttonStyle, onResume);
    const restartBtn = this.createButton('Restart (R)', 400, 320, buttonStyle, onRestart);
    const menuBtn = this.createButton('Main Menu', 400, 390, buttonStyle, onReturnToMenu);
    
    this.pauseMenu.addChild(resumeBtn);
    this.pauseMenu.addChild(restartBtn);
    this.pauseMenu.addChild(menuBtn);
    
    this.app.stage.addChild(this.pauseMenu);
  }

  private createButton(text: string, x: number, y: number, style: object, onClick: () => void): PIXI.Container {
    const container = new PIXI.Container();
    
    const bg = new PIXI.Graphics();
    bg.fill({ color: 0x4a4a4a, alpha: 0.8 });
    bg.roundRect(-120, -25, 240, 50, 10);
    bg.fill();
    
    const label = new PIXI.Text({ text, style });
    label.anchor.set(0.5);
    
    container.addChild(bg);
    container.addChild(label);
    container.x = x;
    container.y = y;
    container.eventMode = 'static';
    container.cursor = 'pointer';
    
    container.on('pointerdown', () => {
      this.hidePauseMenu();
      onClick();
    });
    
    container.on('pointerover', () => {
      bg.tint = 0x666666;
    });
    
    container.on('pointerout', () => {
      bg.tint = 0xFFFFFF;
    });
    
    return container;
  }

  public hidePauseMenu() {
    if (this.pauseMenu) {
      this.app.stage.removeChild(this.pauseMenu);
      this.pauseMenu = null;
    }
    this.hideMessage();
  }

  public showMessage(message: string, duration: number) {
    this.hideMessage();
    
    this.messageText = new PIXI.Text({
      text: message,
      style: {
        fontFamily: 'Arial',
        fontSize: 36,
        fill: 0xFFD700,
        stroke: { color: 0x000000, width: 4 },
        align: 'center'
      }
    });
    this.messageText.anchor.set(0.5);
    this.messageText.x = 400;
    this.messageText.y = 300;
    this.uiContainer.addChild(this.messageText);
    
    if (duration < 999999) {
      setTimeout(() => this.hideMessage(), duration);
    }
  }

  private hideMessage() {
    if (this.messageText) {
      this.uiContainer.removeChild(this.messageText);
      this.messageText = null;
    }
  }

  public render(state: GameState, localPlayerId: string) {
    const localPlayer = state.players.get(localPlayerId);
    
    // Update camera to follow local player
    if (localPlayer && this.physics) {
      const level = this.physics.getCurrentLevel();
      const targetX = (localPlayer.position.x / SCALE) - 400;
      const targetY = (localPlayer.position.y / SCALE) - 300;
      
      // Clamp camera to level bounds
      if (level) {
        this.camera.x = Math.max(0, Math.min(targetX, level.width - 800));
        this.camera.y = Math.max(0, Math.min(targetY, level.height - 600));
      } else {
        this.camera.x = Math.max(0, targetX);
        this.camera.y = Math.max(0, targetY);
      }
      
      this.worldContainer.x = -this.camera.x;
      this.worldContainer.y = -this.camera.y;
    }

    // Render Players
    state.players.forEach((player, id) => {
      let sprite = this.playerSprites.get(id);
      if (!sprite) {
        sprite = this.createPlayerSprite(player.color, player.characterType);
        this.playerSprites.set(id, sprite);
        this.worldContainer.addChild(sprite);
      }

      // Update position
      if (sprite.pivot.x === 0 && sprite.pivot.y === 0) {
        sprite.pivot.set(player.width / 2, player.height / 2);
      }
      
      sprite.x = (player.position.x / SCALE) + (player.width / 2);
      sprite.y = (player.position.y / SCALE) + (player.height / 2);
      
      // Flip sprite based on facing direction
      sprite.scale.x = player.facingRight ? 1 : -1;
      
      // Show/hide and animate sword based on hasSword
      const swordArm = sprite.getChildByName('swordArm') as PIXI.Container;
      if (swordArm) {
        // Only show sword arm if player has collected the sword
        swordArm.visible = player.hasSword;
        
        if (player.hasSword && player.isAttacking) {
          // Swing animation based on attack frame (25 frames total)
          const swingProgress = 1 - (player.attackFrame / 25);
          // Swing from -30 degrees to +60 degrees
          swordArm.rotation = (-0.5 + swingProgress * 1.8);
        } else {
          // Rest position
          swordArm.rotation = -0.3;
        }
      }
    });

    // Clean up disconnected players
    for (const [id, sprite] of this.playerSprites) {
      if (!state.players.has(id)) {
        this.worldContainer.removeChild(sprite);
        this.playerSprites.delete(id);
      }
    }

    // Render Entities
    this.renderEntities(state);
  }

  private renderEntities(state: GameState) {
    // Clean up old entity sprites
    for (const [id, sprite] of this.entitySprites) {
      const entity = state.entities.find(e => e.id === id);
      if (!entity || !entity.active || entity.collected) {
        this.worldContainer.removeChild(sprite);
        this.entitySprites.delete(id);
      }
    }

    // Render active entities
    for (const entity of state.entities) {
      // Skip inactive entities, but allow collected SWORD_CHEST to show opened state
      if (!entity.active) continue;
      if (entity.collected && entity.type !== EntityType.SWORD_CHEST) continue;

      let sprite = this.entitySprites.get(entity.id);
      const spriteKey = entity.collected ? `${entity.id}_opened` : entity.id;
      
      // For sword chest, check if we need to swap to opened sprite
      if (entity.type === EntityType.SWORD_CHEST && entity.collected) {
        // Remove old closed chest sprite if exists
        const oldSprite = this.entitySprites.get(entity.id);
        if (oldSprite) {
          this.worldContainer.removeChild(oldSprite);
          this.entitySprites.delete(entity.id);
        }
        
        // Create opened chest sprite if not exists
        if (!this.entitySprites.has(spriteKey)) {
          const openedSprite = this.createOpenedChestSprite(entity.width, entity.height);
          this.entitySprites.set(spriteKey, openedSprite);
          this.worldContainer.addChild(openedSprite);
        }
        sprite = this.entitySprites.get(spriteKey);
      } else if (!sprite) {
        sprite = this.createEntitySprite(entity.type, entity.width, entity.height, entity);
        this.entitySprites.set(entity.id, sprite);
        this.worldContainer.addChild(sprite);
      }

      if (sprite) {
        sprite.x = entity.position.x;
        sprite.y = entity.position.y;
        
        // Flip sprite based on facing direction for enemies
        if (entity.type === EntityType.ENEMY && entity.facingRight !== undefined) {
          sprite.scale.x = entity.facingRight ? 1 : -1;
          // Adjust pivot for proper flipping
          if (sprite.scale.x === -1) {
            sprite.pivot.x = entity.width;
            sprite.x = entity.position.x + entity.width;
          } else {
            sprite.pivot.x = 0;
          }
        }
        
        // Update ghost visibility (recreate sprite if visibility changed)
        if (entity.type === EntityType.ENEMY && entity.enemyType === EnemyType.GHOST) {
          // For ghosts, we need to recreate the sprite when visibility changes
          // Check by comparing alpha - this is a simple approach
          if (Math.abs((sprite.alpha || 1) - 1) > 0.01 !== !entity.isVisible) {
            // Visibility state changed, recreate sprite
            this.worldContainer.removeChild(sprite);
            this.entitySprites.delete(entity.id);
            sprite = this.createEntitySprite(entity.type, entity.width, entity.height, entity);
            this.entitySprites.set(entity.id, sprite);
            this.worldContainer.addChild(sprite);
            sprite.x = entity.position.x;
            sprite.y = entity.position.y;
          }
        }
      }
    }
  }

  private createOpenedChestSprite(width: number, height: number): PIXI.Graphics {
    const g = new PIXI.Graphics();
    
    // Opened chest body
    g.fill(0x8B4513);
    g.rect(2, height * 0.5, width - 4, height * 0.5);
    g.fill();
    
    // Open lid (tilted back)
    g.fill(0x654321);
    g.rect(0, height * 0.1, width, height * 0.15);
    g.fill();
    
    // Inside of chest (darker)
    g.fill(0x3d2314);
    g.rect(4, height * 0.5, width - 8, height * 0.2);
    g.fill();
    
    // Gold trim
    g.fill(0xDAA520);
    g.rect(width * 0.35, height * 0.55, width * 0.3, height * 0.25);
    g.fill();
    
    // Empty inside indicator
    g.fill({ color: 0x1a1a1a, alpha: 0.5 });
    g.rect(6, height * 0.52, width - 12, height * 0.15);
    g.fill();
    
    return g;
  }

  private createEntitySprite(type: EntityType, width: number, height: number, entity?: Entity): PIXI.Graphics {
    const g = new PIXI.Graphics();

    switch (type) {
      case EntityType.DOUBLOON:
        // Gold coin
        g.fill(0xFFD700);
        g.circle(width / 2, height / 2, width / 2);
        g.fill();
        g.fill(0xDAA520);
        g.circle(width / 2, height / 2, width / 3);
        g.fill();
        break;

      case EntityType.GOAL:
        // Treasure chest
        g.fill(0x8B4513);
        g.rect(0, height / 3, width, height * 2 / 3);
        g.fill();
        g.fill(0xDAA520);
        g.rect(width / 3, height / 2, width / 3, height / 4);
        g.fill();
        // Lid
        g.fill(0x654321);
        g.rect(0, 0, width, height / 3);
        g.fill();
        break;

      case EntityType.ENEMY:
        // Draw based on enemy type
        this.drawEnemySprite(g, width, height, entity?.enemyType || EnemyType.CRAB, entity);
        break;

      case EntityType.CANNONBALL:
        // Black cannonball
        g.fill(0x1a1a1a);
        g.circle(width / 2, height / 2, width / 2);
        g.fill();
        // Shine
        g.fill({ color: 0xffffff, alpha: 0.3 });
        g.circle(width / 3, height / 3, width / 5);
        g.fill();
        break;

      case EntityType.SPIKE:
        // Spikes
        g.fill(0x808080);
        const spikeCount = Math.floor(width / 15);
        for (let i = 0; i < spikeCount; i++) {
          const x = i * 15 + 7.5;
          g.moveTo(x - 7, height);
          g.lineTo(x, 0);
          g.lineTo(x + 7, height);
          g.closePath();
        }
        g.fill();
        break;

      case EntityType.SWORD_CHEST:
        // Floating treasure chest with sword (like Mario ? block)
        // Chest body
        g.fill(0x8B4513); // Brown wood
        g.rect(2, height * 0.4, width - 4, height * 0.6);
        g.fill();
        
        // Chest lid (slightly open, showing glow)
        g.fill(0x654321);
        g.rect(0, height * 0.25, width, height * 0.2);
        g.fill();
        
        // Gold trim on chest
        g.fill(0xDAA520);
        g.rect(width * 0.35, height * 0.5, width * 0.3, height * 0.35);
        g.fill();
        
        // Keyhole
        g.fill(0x1a1a1a);
        g.circle(width / 2, height * 0.65, 4);
        g.rect(width / 2 - 2, height * 0.65, 4, 8);
        g.fill();
        
        // Golden glow effect around chest
        g.fill({ color: 0xFFD700, alpha: 0.3 });
        g.circle(width / 2, height / 2, width * 0.7);
        g.fill();
        
        // Question mark or sword icon on front
        g.fill(0xFFD700);
        // Sword silhouette
        g.rect(width / 2 - 1, height * 0.1, 2, height * 0.2);  // Blade
        g.rect(width / 2 - 4, height * 0.25, 8, 3);  // Guard
        g.fill();
        break;

      default:
        g.fill(0xFF00FF);
        g.rect(0, 0, width, height);
        g.fill();
    }

    return g;
  }

  private drawEnemySprite(g: PIXI.Graphics, width: number, height: number, enemyType: EnemyType, entity?: Entity): void {
    switch (enemyType) {
      case EnemyType.CRAB:
        this.drawCrabSprite(g, width, height);
        break;
      case EnemyType.SEAGULL:
        this.drawSeagullSprite(g, width, height);
        break;
      case EnemyType.SKELETON:
        this.drawSkeletonSprite(g, width, height, entity);
        break;
      case EnemyType.CANNON_TURRET:
        this.drawCannonSprite(g, width, height, entity);
        break;
      case EnemyType.JELLYFISH:
        this.drawJellyfishSprite(g, width, height);
        break;
      case EnemyType.GHOST:
        this.drawGhostSprite(g, width, height, entity);
        break;
      default:
        this.drawCrabSprite(g, width, height);
    }
  }

  // === CRAB SPRITE (Original enemy) ===
  private drawCrabSprite(g: PIXI.Graphics, width: number, height: number): void {
    // Body
    g.fill(0xFF4500);
    g.ellipse(width / 2, height / 2, width / 2, height / 3);
    g.fill();
    // Eyes
    g.fill(0xFFFFFF);
    g.circle(width / 3, height / 3, 4);
    g.circle(width * 2 / 3, height / 3, 4);
    g.fill();
    g.fill(0x000000);
    g.circle(width / 3, height / 3, 2);
    g.circle(width * 2 / 3, height / 3, 2);
    g.fill();
    // Claws
    g.fill(0xFF6347);
    g.circle(0, height / 2, 6);
    g.circle(width, height / 2, 6);
    g.fill();
  }

  // === SEAGULL SPRITE (Flying enemy) ===
  private drawSeagullSprite(g: PIXI.Graphics, width: number, height: number): void {
    // Body (white/gray)
    g.fill(0xF5F5F5);
    g.ellipse(width / 2, height / 2 + 2, width / 3, height / 4);
    g.fill();
    
    // Head
    g.fill(0xFFFFFF);
    g.circle(width * 0.7, height / 3, 6);
    g.fill();
    
    // Beak (orange)
    g.fill(0xFF8C00);
    g.moveTo(width * 0.85, height / 3);
    g.lineTo(width + 2, height / 3 + 2);
    g.lineTo(width * 0.85, height / 3 + 4);
    g.closePath();
    g.fill();
    
    // Eye
    g.fill(0x000000);
    g.circle(width * 0.72, height / 3 - 1, 2);
    g.fill();
    
    // Wings (animated via scale)
    g.fill(0xD3D3D3);
    // Left wing
    g.moveTo(width / 3, height / 2);
    g.lineTo(-5, height / 4);
    g.lineTo(width / 4, height / 2 + 4);
    g.closePath();
    g.fill();
    // Right wing
    g.moveTo(width * 2 / 3, height / 2);
    g.lineTo(width + 5, height / 4);
    g.lineTo(width * 3 / 4, height / 2 + 4);
    g.closePath();
    g.fill();
    
    // Tail
    g.fill(0xC0C0C0);
    g.moveTo(width / 6, height / 2);
    g.lineTo(-8, height / 2 + 4);
    g.lineTo(width / 6, height / 2 + 6);
    g.closePath();
    g.fill();
  }

  // === SKELETON SPRITE (Lunging enemy) ===
  private drawSkeletonSprite(g: PIXI.Graphics, width: number, height: number, entity?: Entity): void {
    const isCharging = entity?.isCharging || false;
    const boneColor = 0xE8E8E8;
    const darkBone = 0xC0C0C0;
    
    // Skull
    g.fill(boneColor);
    g.ellipse(width / 2, height * 0.2, width / 3, height / 5);
    g.fill();
    
    // Eye sockets (empty, menacing)
    g.fill(0x1a1a1a);
    g.ellipse(width / 3, height * 0.18, 4, 5);
    g.ellipse(width * 2 / 3, height * 0.18, 4, 5);
    g.fill();
    
    // Glowing red eyes when charging
    if (isCharging) {
      g.fill(0xFF0000);
      g.circle(width / 3, height * 0.18, 2);
      g.circle(width * 2 / 3, height * 0.18, 2);
      g.fill();
    }
    
    // Nose hole
    g.fill(0x1a1a1a);
    g.moveTo(width / 2, height * 0.22);
    g.lineTo(width / 2 - 2, height * 0.28);
    g.lineTo(width / 2 + 2, height * 0.28);
    g.closePath();
    g.fill();
    
    // Teeth/jaw
    g.fill(boneColor);
    g.rect(width / 3, height * 0.28, width / 3, 6);
    g.fill();
    g.stroke({ color: 0x1a1a1a, width: 1 });
    for (let i = 0; i < 4; i++) {
      const x = width / 3 + i * (width / 12);
      g.moveTo(x, height * 0.28);
      g.lineTo(x, height * 0.28 + 6);
      g.stroke();
    }
    
    // Ribcage
    g.fill(darkBone);
    g.ellipse(width / 2, height * 0.5, width / 4, height / 5);
    g.fill();
    g.stroke({ color: boneColor, width: 2 });
    for (let i = 0; i < 3; i++) {
      const y = height * 0.42 + i * 8;
      g.moveTo(width / 3, y);
      g.quadraticCurveTo(width / 2, y + 4, width * 2 / 3, y);
      g.stroke();
    }
    
    // Spine
    g.stroke({ color: boneColor, width: 3 });
    g.moveTo(width / 2, height * 0.32);
    g.lineTo(width / 2, height * 0.7);
    g.stroke();
    
    // Arms (bones)
    g.stroke({ color: boneColor, width: 3 });
    // Left arm
    g.moveTo(width / 3, height * 0.42);
    g.lineTo(width / 6 - (isCharging ? 5 : 0), height * 0.55);
    g.stroke();
    // Right arm (holding cutlass if charging)
    g.moveTo(width * 2 / 3, height * 0.42);
    g.lineTo(width * 5 / 6 + (isCharging ? 10 : 0), height * 0.5);
    g.stroke();
    
    // Cutlass (always visible, more prominent when charging)
    if (isCharging) {
      // Extended sword
      g.fill(0xC0C0C0);
      g.moveTo(width * 5 / 6 + 10, height * 0.45);
      g.lineTo(width + 15, height * 0.35);
      g.lineTo(width + 18, height * 0.38);
      g.lineTo(width * 5 / 6 + 12, height * 0.5);
      g.closePath();
      g.fill();
      // Guard
      g.fill(0xDAA520);
      g.circle(width * 5 / 6 + 8, height * 0.48, 3);
      g.fill();
    } else {
      // Lowered sword
      g.fill(0xA0A0A0);
      g.rect(width * 5 / 6 - 2, height * 0.52, 3, 15);
      g.fill();
    }
    
    // Legs (bones)
    g.stroke({ color: boneColor, width: 3 });
    g.moveTo(width / 2, height * 0.7);
    g.lineTo(width / 3, height);
    g.stroke();
    g.moveTo(width / 2, height * 0.7);
    g.lineTo(width * 2 / 3, height);
    g.stroke();
    
    // Pirate bandana on skull
    g.fill(0x8B0000);
    g.moveTo(width / 4, height * 0.1);
    g.quadraticCurveTo(width / 2, height * 0.02, width * 3 / 4, height * 0.1);
    g.lineTo(width * 3 / 4, height * 0.15);
    g.quadraticCurveTo(width / 2, height * 0.08, width / 4, height * 0.15);
    g.closePath();
    g.fill();
    // Bandana knot
    g.fill(0x8B0000);
    g.circle(width * 0.8, height * 0.12, 4);
    g.rect(width * 0.8, height * 0.12, 8, 10);
    g.fill();
  }

  // === CANNON SPRITE (Stationary shooter) ===
  private drawCannonSprite(g: PIXI.Graphics, width: number, height: number, entity?: Entity): void {
    const facingLeft = entity?.facingRight === false;
    
    // Cannon base/wheels
    g.fill(0x4a3728);
    g.rect(width * 0.15, height * 0.7, width * 0.7, height * 0.3);
    g.fill();
    
    // Wheels
    g.fill(0x2d1b0e);
    g.circle(width * 0.25, height * 0.85, height * 0.15);
    g.circle(width * 0.75, height * 0.85, height * 0.15);
    g.fill();
    // Wheel spokes
    g.stroke({ color: 0x4a3728, width: 2 });
    g.moveTo(width * 0.25, height * 0.75);
    g.lineTo(width * 0.25, height * 0.95);
    g.stroke();
    g.moveTo(width * 0.75, height * 0.75);
    g.lineTo(width * 0.75, height * 0.95);
    g.stroke();
    
    // Cannon barrel
    g.fill(0x3a3a3a);
    const barrelX = facingLeft ? width * 0.1 : width * 0.35;
    g.rect(barrelX, height * 0.25, width * 0.55, height * 0.35);
    g.fill();
    
    // Barrel opening (flared)
    g.fill(0x2a2a2a);
    if (facingLeft) {
      g.ellipse(width * 0.08, height * 0.42, 8, height * 0.22);
    } else {
      g.ellipse(width * 0.92, height * 0.42, 8, height * 0.22);
    }
    g.fill();
    
    // Barrel rings (decorative)
    g.fill(0xDAA520);
    g.rect(barrelX + 8, height * 0.25, 4, height * 0.35);
    g.rect(barrelX + width * 0.25, height * 0.25, 4, height * 0.35);
    g.fill();
    
    // Fuse hole
    g.fill(0x1a1a1a);
    g.circle(width / 2, height * 0.2, 3);
    g.fill();
    
    // Fuse (lit, sparking)
    g.stroke({ color: 0xFFD700, width: 2 });
    g.moveTo(width / 2, height * 0.2);
    g.lineTo(width / 2 + 5, height * 0.05);
    g.stroke();
    // Spark
    g.fill({ color: 0xFF4500, alpha: 0.8 });
    g.circle(width / 2 + 5, height * 0.05, 4);
    g.fill();
    g.fill({ color: 0xFFFF00, alpha: 0.6 });
    g.circle(width / 2 + 5, height * 0.05, 2);
    g.fill();
  }

  // === JELLYFISH SPRITE (Floating enemy) ===
  private drawJellyfishSprite(g: PIXI.Graphics, width: number, height: number): void {
    // Translucent dome/bell
    g.fill({ color: 0xFF69B4, alpha: 0.7 }); // Hot pink, semi-transparent
    g.ellipse(width / 2, height * 0.3, width / 2, height * 0.3);
    g.fill();
    
    // Inner glow
    g.fill({ color: 0xFFB6C1, alpha: 0.5 });
    g.ellipse(width / 2, height * 0.28, width / 3, height * 0.2);
    g.fill();
    
    // Patterns on bell
    g.stroke({ color: 0xFF1493, width: 1, alpha: 0.8 });
    g.moveTo(width * 0.3, height * 0.25);
    g.quadraticCurveTo(width / 2, height * 0.15, width * 0.7, height * 0.25);
    g.stroke();
    g.moveTo(width * 0.35, height * 0.35);
    g.quadraticCurveTo(width / 2, height * 0.28, width * 0.65, height * 0.35);
    g.stroke();
    
    // Tentacles (wavy)
    const tentacleColors = [0xFF69B4, 0xFF1493, 0xDB7093, 0xFF69B4];
    for (let i = 0; i < 4; i++) {
      g.stroke({ color: tentacleColors[i], width: 2, alpha: 0.8 });
      const startX = width * 0.2 + i * (width * 0.2);
      g.moveTo(startX, height * 0.5);
      g.quadraticCurveTo(startX + (i % 2 === 0 ? 5 : -5), height * 0.65, startX, height * 0.8);
      g.quadraticCurveTo(startX + (i % 2 === 0 ? -5 : 5), height * 0.95, startX + (i % 2 === 0 ? 3 : -3), height);
      g.stroke();
    }
    
    // Central frills
    g.stroke({ color: 0xFFB6C1, width: 3, alpha: 0.6 });
    g.moveTo(width / 2, height * 0.5);
    g.lineTo(width / 2, height * 0.75);
    g.stroke();
    
    // Highlight/shine on bell
    g.fill({ color: 0xFFFFFF, alpha: 0.4 });
    g.ellipse(width * 0.35, height * 0.2, 4, 6);
    g.fill();
  }

  // === GHOST SPRITE (Phasing enemy) ===
  private drawGhostSprite(g: PIXI.Graphics, width: number, height: number, entity?: Entity): void {
    const isVisible = entity?.isVisible ?? true;
    const alpha = isVisible ? 0.85 : 0.25;
    
    // Ghost body (flowing shape)
    g.fill({ color: 0xE8E8FF, alpha });
    g.moveTo(width / 2, 0);
    g.quadraticCurveTo(width, 0, width, height * 0.4);
    g.quadraticCurveTo(width, height * 0.7, width * 0.85, height * 0.85);
    g.quadraticCurveTo(width * 0.7, height, width * 0.6, height * 0.9);
    g.quadraticCurveTo(width / 2, height, width * 0.4, height * 0.9);
    g.quadraticCurveTo(width * 0.3, height, width * 0.15, height * 0.85);
    g.quadraticCurveTo(0, height * 0.7, 0, height * 0.4);
    g.quadraticCurveTo(0, 0, width / 2, 0);
    g.closePath();
    g.fill();
    
    // Inner glow
    g.fill({ color: 0xFFFFFF, alpha: alpha * 0.5 });
    g.ellipse(width / 2, height * 0.35, width / 3, height / 4);
    g.fill();
    
    // Eyes (menacing, follow player feel)
    g.fill({ color: 0x000000, alpha });
    g.ellipse(width * 0.35, height * 0.3, 5, 7);
    g.ellipse(width * 0.65, height * 0.3, 5, 7);
    g.fill();
    
    // Glowing pupils
    g.fill({ color: 0x00FFFF, alpha: isVisible ? 1 : 0.4 });
    g.circle(width * 0.35, height * 0.32, 2);
    g.circle(width * 0.65, height * 0.32, 2);
    g.fill();
    
    // Mouth (ghostly moan)
    g.fill({ color: 0x000000, alpha: alpha * 0.8 });
    g.ellipse(width / 2, height * 0.52, 6, 4);
    g.fill();
    
    // Pirate hat (ghostly)
    g.fill({ color: 0x2a2a4a, alpha: alpha * 0.9 });
    g.moveTo(width * 0.1, height * 0.1);
    g.lineTo(width * 0.9, height * 0.1);
    g.lineTo(width * 0.75, height * -0.05);
    g.lineTo(width / 2, height * -0.15);
    g.lineTo(width * 0.25, height * -0.05);
    g.closePath();
    g.fill();
    
    // Hat band
    g.fill({ color: 0xDAA520, alpha: alpha * 0.7 });
    g.rect(width * 0.2, height * 0.05, width * 0.6, 4);
    g.fill();
    
    // Spectral aura (when visible)
    if (isVisible) {
      g.fill({ color: 0x00FFFF, alpha: 0.15 });
      g.circle(width / 2, height / 2, width * 0.7);
      g.fill();
    }
  }

  private createPlayerSprite(color: number, characterType: CharacterType = CharacterType.PIRATE): PIXI.Container {
    switch (characterType) {
      case CharacterType.GIRL_PIRATE:
        return this.createGirlPirateSprite(color);
      case CharacterType.OCTOPUS:
        return this.createOctopusSprite(color);
      default:
        return this.createClassicPirateSprite(color);
    }
  }

  private createClassicPirateSprite(color: number): PIXI.Container {
    const container = new PIXI.Container();
    
    // === BODY (Shirt/Torso) ===
    const body = new PIXI.Graphics();
    body.fill(color);
    body.rect(6, 14, 20, 14); // Torso
    body.fill();
    // Shirt details - white stripes for classic pirate look
    body.fill(0xFFFFFF);
    body.rect(10, 16, 3, 10);
    body.rect(19, 16, 3, 10);
    body.fill();
    
    // === PANTS ===
    const pants = new PIXI.Graphics();
    pants.fill(0x2c1810); // Dark brown pants
    pants.rect(6, 26, 9, 8); // Left leg
    pants.rect(17, 26, 9, 8); // Right leg
    pants.fill();
    
    // === BOOTS ===
    const boots = new PIXI.Graphics();
    boots.fill(0x1a1a1a); // Black boots
    boots.rect(4, 32, 11, 4);
    boots.rect(17, 32, 11, 4);
    boots.fill();
    // Boot tops
    boots.fill(0x8B4513);
    boots.rect(5, 30, 9, 3);
    boots.rect(18, 30, 9, 3);
    boots.fill();
    
    // === HEAD ===
    const head = new PIXI.Graphics();
    head.fill(0xDEB887); // Skin tone
    head.circle(16, 8, 10); // Head
    head.fill();
    
    // === FACE ===
    const face = new PIXI.Graphics();
    // Eye patch strap
    face.fill(0x1a1a1a);
    face.rect(6, 4, 20, 2);
    face.fill();
    // Eye (right eye visible)
    face.fill(0xFFFFFF);
    face.circle(21, 7, 3);
    face.fill();
    face.fill(0x000000);
    face.circle(22, 7, 1.5);
    face.fill();
    // Eye patch (left eye)
    face.fill(0x1a1a1a);
    face.circle(11, 7, 4);
    face.fill();
    // Beard/stubble
    face.fill(0x3d2314);
    face.rect(10, 12, 12, 4);
    face.fill();
    // Smile/mouth
    face.stroke({ color: 0x8B0000, width: 1 });
    face.moveTo(13, 14);
    face.quadraticCurveTo(16, 17, 19, 14);
    face.stroke();
    
    // === PIRATE HAT ===
    const hat = new PIXI.Graphics();
    // Hat base (tricorn style)
    hat.fill(0x1a1a1a);
    hat.moveTo(-2, 2);
    hat.lineTo(34, 2);
    hat.lineTo(30, -4);
    hat.lineTo(16, -14);
    hat.lineTo(2, -4);
    hat.closePath();
    hat.fill();
    // Hat band
    hat.fill(0xDAA520);
    hat.rect(4, -2, 24, 4);
    hat.fill();
    // Skull emblem on hat
    hat.fill(0xFFFFFF);
    hat.circle(16, -1, 3);
    hat.fill();
    hat.fill(0x1a1a1a);
    hat.circle(14.5, -1.5, 0.8);
    hat.circle(17.5, -1.5, 0.8);
    hat.fill();
    
    // === SWORD ARM (Animated) ===
    const swordArm = new PIXI.Container();
    swordArm.label = 'swordArm';
    
    // Arm
    const arm = new PIXI.Graphics();
    arm.fill(0xDEB887); // Skin
    arm.rect(0, -2, 12, 5);
    arm.fill();
    // Sleeve
    arm.fill(color);
    arm.rect(-2, -3, 6, 7);
    arm.fill();
    
    // Sword handle
    const sword = new PIXI.Graphics();
    // Guard (crossguard)
    sword.fill(0xDAA520); // Gold
    sword.rect(8, -4, 3, 9);
    sword.fill();
    // Handle/grip
    sword.fill(0x4a3728); // Brown leather
    sword.rect(6, -1, 4, 3);
    sword.fill();
    // Pommel
    sword.fill(0xDAA520);
    sword.circle(5, 0.5, 2);
    sword.fill();
    // Blade
    sword.fill(0xC0C0C0); // Silver
    sword.moveTo(11, -2);
    sword.lineTo(32, -1);
    sword.lineTo(34, 0.5);
    sword.lineTo(32, 2);
    sword.lineTo(11, 3);
    sword.closePath();
    sword.fill();
    // Blade shine
    sword.fill({ color: 0xFFFFFF, alpha: 0.4 });
    sword.rect(12, -1, 18, 1.5);
    sword.fill();
    // Blade edge highlight
    sword.stroke({ color: 0xE8E8E8, width: 1 });
    sword.moveTo(11, -2);
    sword.lineTo(34, 0.5);
    sword.stroke();
    
    swordArm.addChild(arm);
    swordArm.addChild(sword);
    swordArm.x = 26;
    swordArm.y = 18;
    swordArm.pivot.set(0, 0);
    swordArm.rotation = -0.3; // Rest position
    
    // === LEFT ARM ===
    const leftArm = new PIXI.Graphics();
    leftArm.fill(0xDEB887); // Skin
    leftArm.rect(-4, 16, 5, 10);
    leftArm.fill();
    // Sleeve
    leftArm.fill(color);
    leftArm.rect(-3, 14, 4, 5);
    leftArm.fill();
    // Hand/fist
    leftArm.fill(0xDEB887);
    leftArm.circle(-1, 27, 3);
    leftArm.fill();
    
    // === BELT ===
    const belt = new PIXI.Graphics();
    belt.fill(0x3d2314); // Dark brown
    belt.rect(4, 24, 24, 4);
    belt.fill();
    // Belt buckle
    belt.fill(0xDAA520); // Gold
    belt.rect(13, 23, 6, 5);
    belt.fill();
    belt.fill(0x3d2314);
    belt.rect(14, 24, 4, 3);
    belt.fill();

    // Add all parts in correct z-order (back to front)
    container.addChild(leftArm);
    container.addChild(pants);
    container.addChild(boots);
    container.addChild(body);
    container.addChild(belt);
    container.addChild(head);
    container.addChild(face);
    container.addChild(hat);
    container.addChild(swordArm);

    return container;
  }

  private createGirlPirateSprite(color: number): PIXI.Container {
    const container = new PIXI.Container();
    
    // === BODY (Corset/Blouse) ===
    const body = new PIXI.Graphics();
    body.fill(color);
    body.rect(6, 14, 20, 14); // Torso
    body.fill();
    // Blouse details - lace trim
    body.fill(0xFFFFFF);
    body.rect(6, 14, 20, 3);
    body.fill();
    // Corset lacing
    body.stroke({ color: 0xFFFFFF, width: 1 });
    body.moveTo(16, 17);
    body.lineTo(12, 20);
    body.lineTo(16, 23);
    body.lineTo(12, 26);
    body.stroke();
    body.moveTo(16, 17);
    body.lineTo(20, 20);
    body.lineTo(16, 23);
    body.lineTo(20, 26);
    body.stroke();
    
    // === SKIRT ===
    const skirt = new PIXI.Graphics();
    skirt.fill(0x2c1810); // Dark brown
    skirt.moveTo(4, 26);
    skirt.lineTo(28, 26);
    skirt.lineTo(30, 36);
    skirt.lineTo(2, 36);
    skirt.closePath();
    skirt.fill();
    // Skirt ruffle
    skirt.fill(0x3d2314);
    skirt.rect(2, 34, 28, 2);
    skirt.fill();
    
    // === BOOTS (Taller, more elegant) ===
    const boots = new PIXI.Graphics();
    boots.fill(0x1a1a1a);
    boots.rect(6, 32, 8, 6);
    boots.rect(18, 32, 8, 6);
    boots.fill();
    // Boot heels
    boots.fill(0x8B4513);
    boots.rect(8, 36, 4, 2);
    boots.rect(20, 36, 4, 2);
    boots.fill();
    
    // === HEAD ===
    const head = new PIXI.Graphics();
    head.fill(0xDEB887); // Skin tone
    head.circle(16, 8, 10);
    head.fill();
    
    // === HAIR ===
    const hair = new PIXI.Graphics();
    hair.fill(0xc0392b); // Red hair
    // Hair volume on top
    hair.ellipse(16, 2, 12, 8);
    hair.fill();
    // Long flowing hair on sides
    hair.moveTo(4, 4);
    hair.quadraticCurveTo(-2, 15, 6, 24);
    hair.quadraticCurveTo(2, 15, 4, 4);
    hair.fill();
    hair.moveTo(28, 4);
    hair.quadraticCurveTo(34, 15, 26, 24);
    hair.quadraticCurveTo(30, 15, 28, 4);
    hair.fill();
    
    // === FACE ===
    const face = new PIXI.Graphics();
    // Eyes (both visible, with makeup)
    face.fill(0xFFFFFF);
    face.circle(11, 7, 3);
    face.circle(21, 7, 3);
    face.fill();
    // Green/emerald eyes
    face.fill(0x2ecc71);
    face.circle(12, 7, 2);
    face.circle(22, 7, 2);
    face.fill();
    face.fill(0x000000);
    face.circle(12, 7, 1);
    face.circle(22, 7, 1);
    face.fill();
    // Eyelashes
    face.stroke({ color: 0x000000, width: 1 });
    face.moveTo(8, 5);
    face.lineTo(10, 4);
    face.moveTo(14, 4);
    face.lineTo(12, 3);
    face.moveTo(24, 5);
    face.lineTo(22, 4);
    face.moveTo(18, 4);
    face.lineTo(20, 3);
    face.stroke();
    // Nose
    face.fill(0xD2B48C);
    face.ellipse(16, 10, 1.5, 1);
    face.fill();
    // Lips
    face.fill(0xc0392b);
    face.ellipse(16, 13, 3, 1.5);
    face.fill();
    // Rosy cheeks
    face.fill({ color: 0xffb6c1, alpha: 0.5 });
    face.circle(8, 10, 2);
    face.circle(24, 10, 2);
    face.fill();
    
    // === BANDANA ===
    const bandana = new PIXI.Graphics();
    bandana.fill(0xc0392b); // Matching red
    bandana.rect(4, -2, 24, 5);
    bandana.fill();
    // Bandana knot tail
    bandana.moveTo(28, 0);
    bandana.quadraticCurveTo(36, 4, 32, 12);
    bandana.quadraticCurveTo(30, 6, 28, 0);
    bandana.fill();
    
    // === EARRINGS ===
    const earrings = new PIXI.Graphics();
    earrings.fill(0xDAA520); // Gold
    earrings.circle(5, 12, 3);
    earrings.circle(27, 12, 3);
    earrings.fill();
    earrings.fill(0xFFD700);
    earrings.circle(5, 12, 1.5);
    earrings.circle(27, 12, 1.5);
    earrings.fill();
    
    // === SWORD ARM ===
    const swordArm = new PIXI.Container();
    swordArm.label = 'swordArm';
    
    const arm = new PIXI.Graphics();
    arm.fill(0xDEB887);
    arm.rect(0, -2, 12, 4);
    arm.fill();
    arm.fill(color);
    arm.rect(-2, -3, 6, 6);
    arm.fill();
    
    const sword = new PIXI.Graphics();
    // Elegant cutlass
    sword.fill(0xDAA520);
    sword.rect(8, -3, 2, 7);
    sword.fill();
    sword.fill(0x4a3728);
    sword.rect(6, -1, 4, 3);
    sword.fill();
    sword.fill(0xDAA520);
    sword.circle(5, 0.5, 2);
    sword.fill();
    // Curved blade
    sword.fill(0xC0C0C0);
    sword.moveTo(10, -2);
    sword.quadraticCurveTo(28, -6, 32, 0);
    sword.lineTo(30, 2);
    sword.quadraticCurveTo(26, -2, 10, 2);
    sword.closePath();
    sword.fill();
    sword.fill({ color: 0xFFFFFF, alpha: 0.4 });
    sword.moveTo(12, -1);
    sword.quadraticCurveTo(26, -4, 30, 0);
    sword.lineTo(28, 1);
    sword.quadraticCurveTo(24, -2, 12, 0);
    sword.closePath();
    sword.fill();
    
    swordArm.addChild(arm);
    swordArm.addChild(sword);
    swordArm.x = 26;
    swordArm.y = 18;
    swordArm.rotation = -0.3;
    
    // === LEFT ARM ===
    const leftArm = new PIXI.Graphics();
    leftArm.fill(0xDEB887);
    leftArm.rect(-4, 16, 5, 8);
    leftArm.fill();
    leftArm.fill(color);
    leftArm.rect(-3, 14, 4, 4);
    leftArm.fill();
    leftArm.fill(0xDEB887);
    leftArm.circle(-1, 25, 2.5);
    leftArm.fill();
    
    // === BELT ===
    const belt = new PIXI.Graphics();
    belt.fill(0x8B4513);
    belt.rect(4, 24, 24, 3);
    belt.fill();
    belt.fill(0xDAA520);
    belt.circle(16, 25.5, 2.5);
    belt.fill();

    // Add all parts
    container.addChild(leftArm);
    container.addChild(skirt);
    container.addChild(boots);
    container.addChild(body);
    container.addChild(belt);
    container.addChild(hair);
    container.addChild(head);
    container.addChild(face);
    container.addChild(bandana);
    container.addChild(earrings);
    container.addChild(swordArm);

    return container;
  }

  private createOctopusSprite(color: number): PIXI.Container {
    const container = new PIXI.Container();
    
    // === TENTACLES (Back layer) ===
    const tentaclesBack = new PIXI.Graphics();
    tentaclesBack.fill(color);
    
    // Back tentacles (will be behind body)
    // Left back tentacle
    tentaclesBack.moveTo(4, 22);
    tentaclesBack.quadraticCurveTo(-4, 32, 0, 40);
    tentaclesBack.quadraticCurveTo(-2, 36, 4, 32);
    tentaclesBack.lineTo(8, 22);
    tentaclesBack.closePath();
    tentaclesBack.fill();
    
    // Right back tentacle
    tentaclesBack.moveTo(28, 22);
    tentaclesBack.quadraticCurveTo(36, 32, 32, 40);
    tentaclesBack.quadraticCurveTo(34, 36, 28, 32);
    tentaclesBack.lineTo(24, 22);
    tentaclesBack.closePath();
    tentaclesBack.fill();
    
    // Suction cups on back tentacles
    tentaclesBack.fill(0x9b59b6);
    tentaclesBack.circle(2, 34, 2);
    tentaclesBack.circle(30, 34, 2);
    tentaclesBack.fill();
    
    // === BODY (Head/Mantle) ===
    const body = new PIXI.Graphics();
    body.fill(color);
    body.ellipse(16, 14, 14, 12);
    body.fill();
    // Body texture spots
    body.fill({ color: 0x9b59b6, alpha: 0.5 });
    body.circle(10, 18, 3);
    body.circle(22, 18, 3);
    body.circle(16, 22, 2);
    body.fill();
    
    // === TENTACLES (Front layer) ===
    const tentaclesFront = new PIXI.Graphics();
    tentaclesFront.fill(color);
    
    // Front left tentacle
    tentaclesFront.moveTo(6, 24);
    tentaclesFront.quadraticCurveTo(2, 36, 8, 44);
    tentaclesFront.quadraticCurveTo(6, 38, 10, 28);
    tentaclesFront.lineTo(10, 24);
    tentaclesFront.closePath();
    tentaclesFront.fill();
    
    // Front center-left tentacle
    tentaclesFront.moveTo(10, 24);
    tentaclesFront.quadraticCurveTo(10, 38, 14, 46);
    tentaclesFront.quadraticCurveTo(12, 40, 14, 28);
    tentaclesFront.lineTo(14, 24);
    tentaclesFront.closePath();
    tentaclesFront.fill();
    
    // Front center-right tentacle
    tentaclesFront.moveTo(18, 24);
    tentaclesFront.quadraticCurveTo(22, 38, 18, 46);
    tentaclesFront.quadraticCurveTo(20, 40, 18, 28);
    tentaclesFront.lineTo(22, 24);
    tentaclesFront.closePath();
    tentaclesFront.fill();
    
    // Front right tentacle
    tentaclesFront.moveTo(22, 24);
    tentaclesFront.quadraticCurveTo(30, 36, 24, 44);
    tentaclesFront.quadraticCurveTo(26, 38, 22, 28);
    tentaclesFront.lineTo(26, 24);
    tentaclesFront.closePath();
    tentaclesFront.fill();
    
    // Suction cups on front tentacles
    tentaclesFront.fill(0x9b59b6);
    tentaclesFront.circle(8, 36, 2);
    tentaclesFront.circle(12, 40, 2);
    tentaclesFront.circle(20, 40, 2);
    tentaclesFront.circle(24, 36, 2);
    tentaclesFront.fill();
    
    // === EYES ===
    const eyes = new PIXI.Graphics();
    // Large octopus eyes
    eyes.fill(0xFFFFFF);
    eyes.ellipse(10, 12, 5, 6);
    eyes.ellipse(22, 12, 5, 6);
    eyes.fill();
    // Pupils
    eyes.fill(0x000000);
    eyes.ellipse(11, 12, 3, 4);
    eyes.ellipse(23, 12, 3, 4);
    eyes.fill();
    // Eye shine
    eyes.fill(0xFFFFFF);
    eyes.circle(9, 10, 1.5);
    eyes.circle(21, 10, 1.5);
    eyes.fill();
    
    // === PIRATE HAT ===
    const hat = new PIXI.Graphics();
    hat.fill(0x1a1a1a);
    hat.moveTo(0, 6);
    hat.lineTo(32, 6);
    hat.lineTo(28, 0);
    hat.lineTo(16, -10);
    hat.lineTo(4, 0);
    hat.closePath();
    hat.fill();
    // Hat band
    hat.fill(0xDAA520);
    hat.rect(6, 2, 20, 4);
    hat.fill();
    // Skull on hat
    hat.fill(0xFFFFFF);
    hat.circle(16, 3, 3);
    hat.fill();
    hat.fill(0x1a1a1a);
    hat.circle(14.5, 2.5, 0.8);
    hat.circle(17.5, 2.5, 0.8);
    hat.fill();
    
    // === SWORD ARM (Using a tentacle) ===
    const swordArm = new PIXI.Container();
    swordArm.label = 'swordArm';
    
    // Tentacle arm
    const tentacleArm = new PIXI.Graphics();
    tentacleArm.fill(color);
    tentacleArm.moveTo(0, -2);
    tentacleArm.quadraticCurveTo(8, -4, 14, -2);
    tentacleArm.lineTo(14, 3);
    tentacleArm.quadraticCurveTo(8, 1, 0, 3);
    tentacleArm.closePath();
    tentacleArm.fill();
    // Suction cups on arm
    tentacleArm.fill(0x9b59b6);
    tentacleArm.circle(4, 2, 1.5);
    tentacleArm.circle(8, 2, 1.5);
    tentacleArm.fill();
    
    // Cutlass
    const sword = new PIXI.Graphics();
    sword.fill(0xDAA520);
    sword.rect(12, -3, 2, 7);
    sword.fill();
    sword.fill(0x4a3728);
    sword.rect(10, -1, 4, 3);
    sword.fill();
    sword.fill(0xC0C0C0);
    sword.moveTo(14, -2);
    sword.lineTo(32, -1);
    sword.lineTo(34, 0.5);
    sword.lineTo(32, 2);
    sword.lineTo(14, 3);
    sword.closePath();
    sword.fill();
    sword.fill({ color: 0xFFFFFF, alpha: 0.4 });
    sword.rect(15, -1, 16, 1.5);
    sword.fill();
    
    swordArm.addChild(tentacleArm);
    swordArm.addChild(sword);
    swordArm.x = 26;
    swordArm.y = 16;
    swordArm.rotation = -0.3;
    
    // === EYE PATCH ===
    const eyePatch = new PIXI.Graphics();
    // Strap
    eyePatch.fill(0x1a1a1a);
    eyePatch.rect(4, 8, 24, 2);
    eyePatch.fill();
    // Patch over left eye
    eyePatch.fill(0x1a1a1a);
    eyePatch.ellipse(10, 12, 5, 6);
    eyePatch.fill();

    // Add all parts in z-order
    container.addChild(tentaclesBack);
    container.addChild(body);
    container.addChild(tentaclesFront);
    container.addChild(eyes);
    container.addChild(eyePatch);
    container.addChild(hat);
    container.addChild(swordArm);

    return container;
  }

  private drawLevelBackground(g: PIXI.Graphics, level: LevelData) {
    g.clear();
    
    // Set base background color
    if (level.background) {
      this.app.renderer.background.color = level.background;
    }

    // Draw specific background elements based on level ID
    switch (level.id) {
      case 1: // Shipwreck Shore
        this.drawShipwreckShoreBackground(g, level);
        break;
      case 2: // Skull Cave
        this.drawSkullCaveBackground(g, level);
        break;
      case 3: // Treasure Galleon
        this.drawTreasureGalleonBackground(g, level);
        break;
      case 4: // Kraken's Lair
        this.drawKrakensLairBackground(g, level);
        break;
    }
  }

  private drawShipwreckShoreBackground(g: PIXI.Graphics, level: LevelData) {
    const width = level.width;
    const height = level.height;

    // 1. Sky Gradient (simulated with rects)
    g.fill(0x87CEEB); // Sky blue
    g.rect(0, 0, width, height);
    g.fill();

    // 2. Sun
    g.fill(0xFFD700);
    g.circle(200, 100, 40);
    g.fill();
    // Sun rays
    g.fill({ color: 0xFFD700, alpha: 0.3 });
    g.circle(200, 100, 60);
    g.fill();

    // 3. Clouds
    g.fill({ color: 0xFFFFFF, alpha: 0.8 });
    const drawCloud = (cx: number, cy: number, scale: number = 1) => {
      g.circle(cx, cy, 30 * scale);
      g.circle(cx + 25 * scale, cy - 10 * scale, 35 * scale);
      g.circle(cx + 50 * scale, cy, 30 * scale);
    };
    
    for (let i = 0; i < width; i += 400) {
      drawCloud(i + 50, 100 + Math.random() * 50, 0.8 + Math.random() * 0.4);
    }

    // 4. Ocean in background (horizon)
    g.fill(0x006994);
    g.rect(0, height - 200, width, 200);
    g.fill();
    
    // Waves on horizon
    g.fill({ color: 0x0077be });
    for (let i = 0; i < width; i += 40) {
      g.circle(i, height - 200, 20);
    }
    g.fill();

    // 5. Distant Islands
    g.fill(0x2E8B57); // Sea Green
    g.moveTo(500, height - 200);
    g.quadraticCurveTo(600, height - 350, 700, height - 200);
    g.fill();
    
    g.fill(0x2E8B57);
    g.moveTo(1200, height - 200);
    g.quadraticCurveTo(1350, height - 300, 1500, height - 200);
    g.fill();

    // 6. Palm Trees in background
    const drawPalm = (px: number, py: number) => {
      // Trunk
      g.stroke({ color: 0x8B4513, width: 4 });
      g.moveTo(px, py);
      g.quadraticCurveTo(px + 10, py - 50, px - 5, py - 100);
      g.stroke();
      
      // Leaves
      g.stroke({ color: 0x228B22, width: 3 });
      const topX = px - 5;
      const topY = py - 100;
      g.moveTo(topX, topY); g.quadraticCurveTo(topX - 20, topY - 20, topX - 30, topY + 10); g.stroke();
      g.moveTo(topX, topY); g.quadraticCurveTo(topX + 20, topY - 20, topX + 30, topY + 10); g.stroke();
      g.moveTo(topX, topY); g.quadraticCurveTo(topX, topY - 30, topX + 10, topY - 10); g.stroke();
    };

    drawPalm(600, height - 220);
    drawPalm(1350, height - 230);
  }

  private drawSkullCaveBackground(g: PIXI.Graphics, level: LevelData) {
    const width = level.width;
    const height = level.height;

    // 1. Dark Cave Background
    g.fill(0x1a1a2e);
    g.rect(0, 0, width, height);
    g.fill();

    // 2. Rock Texture / Cracks
    g.stroke({ color: 0x2a2a4e, width: 2 });
    for (let i = 0; i < 20; i++) {
      const cx = Math.random() * width;
      const cy = Math.random() * height;
      g.moveTo(cx, cy);
      g.lineTo(cx + 20 + Math.random() * 30, cy + Math.random() * 20 - 10);
      g.stroke();
    }

    // 3. Stalactites (Hanging)
    g.fill(0x2e2e4e);
    for (let i = 0; i < width; i += 100 + Math.random() * 100) {
      const h = 50 + Math.random() * 150;
      g.moveTo(i, 0);
      g.lineTo(i + 30, h);
      g.lineTo(i + 60, 0);
      g.closePath();
      g.fill();
    }

    // 4. Stalagmites (Ground) - Background layer
    g.fill(0x252545);
    for (let i = 50; i < width; i += 120 + Math.random() * 80) {
      const h = 40 + Math.random() * 100;
      g.moveTo(i, height);
      g.lineTo(i + 25, height - h);
      g.lineTo(i + 50, height);
      g.closePath();
      g.fill();
    }
    
    // 5. Glowing Crystals
    const colors = [0x00ffff, 0xff00ff, 0x00ff00];
    for (let i = 0; i < 15; i++) {
      const cx = Math.random() * width;
      const cy = Math.random() * height;
      const color = colors[Math.floor(Math.random() * colors.length)];
      
      g.fill({ color: color, alpha: 0.6 });
      g.moveTo(cx, cy);
      g.lineTo(cx + 10, cy - 20);
      g.lineTo(cx + 20, cy);
      g.lineTo(cx + 10, cy + 20);
      g.closePath();
      g.fill();
      
      // Glow
      g.fill({ color: color, alpha: 0.2 });
      g.circle(cx + 10, cy, 30);
      g.fill();
    }

    // 6. Skull Outline in background (subtle)
    g.stroke({ color: 0x333355, width: 10, alpha: 0.3 });
    const skullX = width / 2;
    const skullY = height / 2;
    g.circle(skullX, skullY, 150); // Head
    g.stroke();
    g.rect(skullX - 50, skullY + 100, 25, 40); // Teeth
    g.rect(skullX, skullY + 100, 25, 40);
    g.rect(skullX + 50, skullY + 100, 25, 40);
    g.stroke();
  }

  private drawTreasureGalleonBackground(g: PIXI.Graphics, level: LevelData) {
    const width = level.width;
    const height = level.height;

    // 1. Night Sky
    g.fill(0x0d1b2a); // Dark blue night
    g.rect(0, 0, width, height);
    g.fill();

    // 2. Stars
    g.fill(0xffffff);
    for (let i = 0; i < 100; i++) {
      const sx = Math.random() * width;
      const sy = Math.random() * height / 2;
      const size = Math.random() * 2 + 1;
      g.circle(sx, sy, size);
      g.fill();
    }

    // 3. Moon
    g.fill(0xf0f0f0);
    g.circle(width - 150, 100, 50);
    g.fill();
    // Craters
    g.fill(0xd0d0d0);
    g.circle(width - 160, 90, 10);
    g.circle(width - 140, 110, 15);
    g.fill();

    // 4. Sea Horizon
    g.fill(0x1b2631);
    g.rect(0, height - 100, width, 100);
    g.fill();

    // 5. Ship Masts (Background)
    g.fill(0x3e2723); // Dark wood
    // Mast 1
    g.rect(400, 100, 20, height - 100);
    g.fill();
    // Crossbeam 1
    g.rect(250, 250, 320, 15);
    g.fill();
    
    // Mast 2
    g.rect(900, 50, 25, height - 50);
    g.fill();
    // Crossbeam 2
    g.rect(700, 200, 420, 18);
    g.fill();
    
    // Mast 3
    g.rect(1300, 150, 18, height - 150);
    g.fill();
    // Crossbeam 3
    g.rect(1200, 300, 220, 12);
    g.fill();

    // 6. Ropes / Rigging
    g.stroke({ color: 0x1a1a1a, width: 1, alpha: 0.5 });
    // Mast 1 rigging
    g.moveTo(410, 100); g.lineTo(250, 500); g.stroke();
    g.moveTo(410, 100); g.lineTo(570, 500); g.stroke();
    // Mast 2 rigging
    g.moveTo(912, 50); g.lineTo(700, 500); g.stroke();
    g.moveTo(912, 50); g.lineTo(1120, 500); g.stroke();
  }

  private drawKrakensLairBackground(g: PIXI.Graphics, level: LevelData) {
    const width = level.width;
    const height = level.height;

    // 1. Deep Ocean Gradient (Layered Rects)
    const colors = [0x001f3f, 0x003366, 0x004080, 0x0059b3];
    const sectionHeight = height / colors.length;
    
    colors.forEach((color, i) => {
      g.fill(color);
      g.rect(0, i * sectionHeight, width, sectionHeight + 2); // +2 to cover gaps
      g.fill();
    });

    // 2. Sun Shafts (Light beams from top)
    g.fill({ color: 0xffffff, alpha: 0.05 });
    for (let i = 0; i < 5; i++) {
      const x = 200 + i * 300;
      g.moveTo(x, 0);
      g.lineTo(x + 100, height);
      g.lineTo(x - 50, height);
      g.lineTo(x - 150, 0);
      g.closePath();
      g.fill();
    }

    // 3. Bubbles
    g.fill({ color: 0xffffff, alpha: 0.3 });
    for (let i = 0; i < 50; i++) {
      const bx = Math.random() * width;
      const by = Math.random() * height;
      const size = Math.random() * 5 + 2;
      g.circle(bx, by, size);
      g.fill();
      // Highlight
      g.fill({ color: 0xffffff, alpha: 0.5 });
      g.circle(bx - size/3, by - size/3, size/4);
      g.fill();
    }

    // 4. Seaweed (Background)
    const drawSeaweed = (sx: number, sy: number, h: number) => {
      g.stroke({ color: 0x006400, width: 8, alpha: 0.8 }); // Dark Green
      g.moveTo(sx, sy);
      let cx = sx;
      let cy = sy;
      for (let i = 0; i < 4; i++) {
        const nextY = cy - h/4;
        const offset = (i % 2 === 0) ? 20 : -20;
        g.quadraticCurveTo(cx + offset, cy - h/8, cx, nextY);
        cy = nextY;
      }
      g.stroke();
    };

    for (let i = 0; i < width; i += 150) {
      drawSeaweed(i, height, 200 + Math.random() * 100);
    }

    // 5. Kraken Silhouette (Distant)
    g.fill({ color: 0x000000, alpha: 0.2 });
    const kx = width / 2;
    const ky = height / 2 + 100;
    g.ellipse(kx, ky, 100, 60); // Head
    g.fill();
    // Tentacles
    g.stroke({ color: 0x000000, width: 20, alpha: 0.2 });
    g.moveTo(kx - 80, ky);
    g.quadraticCurveTo(kx - 150, ky - 100, kx - 200, ky + 50);
    g.stroke();
    g.moveTo(kx + 80, ky);
    g.quadraticCurveTo(kx + 150, ky - 100, kx + 200, ky + 50);
    g.stroke();
  }
}
