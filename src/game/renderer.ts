import * as PIXI from 'pixi.js';
import { GameState, EntityType, EnemyType, LevelData, Entity, CharacterType, PlayerState } from '../types';
import { PhysicsEngine } from './physics';

const SCALE = 100;

// ===============================================
// PARTICLE SYSTEM
// ===============================================
interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  color: number;
  alpha: number;
  rotation: number;
  rotationSpeed: number;
  gravity: number;
  type: 'dust' | 'spark' | 'splash' | 'sparkle' | 'trail' | 'smoke' | 'bubble' | 'leaf' | 'star';
  scale: number;
  shrink: boolean;
}

class ParticleSystem {
  private particles: Particle[] = [];
  private graphics: PIXI.Graphics;
  private maxParticles = 500;

  constructor() {
    this.graphics = new PIXI.Graphics();
  }

  getGraphics(): PIXI.Graphics {
    return this.graphics;
  }

  // Dust particles when landing or running
  emitDust(x: number, y: number, count: number = 5, velocityX: number = 0) {
    for (let i = 0; i < count; i++) {
      this.particles.push({
        x, y,
        vx: (Math.random() - 0.5) * 3 + velocityX * 0.1,
        vy: -Math.random() * 2 - 1,
        life: 30 + Math.random() * 20,
        maxLife: 50,
        size: 3 + Math.random() * 4,
        color: 0xd4a574,
        alpha: 0.8,
        rotation: 0,
        rotationSpeed: 0,
        gravity: 0.1,
        type: 'dust',
        scale: 1,
        shrink: true
      });
    }
  }

  // Sparkle effect for collectibles
  emitSparkle(x: number, y: number, count: number = 8, color: number = 0xFFD700) {
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2;
      const speed = 2 + Math.random() * 3;
      this.particles.push({
        x, y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 40 + Math.random() * 20,
        maxLife: 60,
        size: 2 + Math.random() * 3,
        color,
        alpha: 1,
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: (Math.random() - 0.5) * 0.3,
        gravity: 0,
        type: 'sparkle',
        scale: 1,
        shrink: true
      });
    }
  }

  // Coin collection burst
  emitCoinBurst(x: number, y: number) {
    // Golden sparkles
    this.emitSparkle(x, y, 12, 0xFFD700);
    // Additional white twinkles
    for (let i = 0; i < 6; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 1 + Math.random() * 2;
      this.particles.push({
        x, y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 1,
        life: 20 + Math.random() * 15,
        maxLife: 35,
        size: 1 + Math.random() * 2,
        color: 0xFFFFFF,
        alpha: 1,
        rotation: 0,
        rotationSpeed: 0,
        gravity: -0.05,
        type: 'star',
        scale: 1,
        shrink: true
      });
    }
  }

  // Sword swing trail
  emitSwordTrail(x: number, y: number, facingRight: boolean) {
    for (let i = 0; i < 3; i++) {
      const offsetX = facingRight ? 20 + i * 10 : -20 - i * 10;
      this.particles.push({
        x: x + offsetX,
        y: y + (Math.random() - 0.5) * 20,
        vx: facingRight ? 2 : -2,
        vy: (Math.random() - 0.5) * 2,
        life: 15 + Math.random() * 10,
        maxLife: 25,
        size: 8 - i * 2,
        color: 0xE8E8FF,
        alpha: 0.7,
        rotation: Math.random() * Math.PI,
        rotationSpeed: (Math.random() - 0.5) * 0.2,
        gravity: 0,
        type: 'trail',
        scale: 1,
        shrink: true
      });
    }
  }

  // Enemy defeat explosion
  emitEnemyDefeat(x: number, y: number, color: number = 0xFF4500) {
    // Main burst
    for (let i = 0; i < 15; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 2 + Math.random() * 4;
      this.particles.push({
        x, y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 2,
        life: 40 + Math.random() * 30,
        maxLife: 70,
        size: 4 + Math.random() * 6,
        color,
        alpha: 1,
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: (Math.random() - 0.5) * 0.4,
        gravity: 0.15,
        type: 'spark',
        scale: 1,
        shrink: true
      });
    }
    // Smoke puff
    for (let i = 0; i < 5; i++) {
      this.particles.push({
        x: x + (Math.random() - 0.5) * 20,
        y: y + (Math.random() - 0.5) * 20,
        vx: (Math.random() - 0.5) * 1,
        vy: -Math.random() * 2 - 1,
        life: 50 + Math.random() * 30,
        maxLife: 80,
        size: 15 + Math.random() * 10,
        color: 0x444444,
        alpha: 0.5,
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: (Math.random() - 0.5) * 0.05,
        gravity: -0.02,
        type: 'smoke',
        scale: 1,
        shrink: false
      });
    }
  }

  // Water splash
  emitSplash(x: number, y: number) {
    for (let i = 0; i < 12; i++) {
      const angle = -Math.PI / 2 + (Math.random() - 0.5) * Math.PI * 0.8;
      const speed = 3 + Math.random() * 5;
      this.particles.push({
        x, y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 40 + Math.random() * 20,
        maxLife: 60,
        size: 3 + Math.random() * 4,
        color: 0x4FC3F7,
        alpha: 0.8,
        rotation: 0,
        rotationSpeed: 0,
        gravity: 0.2,
        type: 'splash',
        scale: 1,
        shrink: true
      });
    }
  }

  // Ambient bubbles (underwater levels)
  emitBubbles(x: number, y: number, count: number = 3) {
    for (let i = 0; i < count; i++) {
      this.particles.push({
        x: x + (Math.random() - 0.5) * 20,
        y,
        vx: (Math.random() - 0.5) * 0.5,
        vy: -1 - Math.random() * 2,
        life: 80 + Math.random() * 60,
        maxLife: 140,
        size: 3 + Math.random() * 5,
        color: 0xFFFFFF,
        alpha: 0.4,
        rotation: 0,
        rotationSpeed: 0,
        gravity: -0.01,
        type: 'bubble',
        scale: 1,
        shrink: false
      });
    }
  }

  // Floating leaves/debris
  emitLeaf(x: number, y: number) {
    this.particles.push({
      x, y,
      vx: (Math.random() - 0.5) * 2,
      vy: Math.random() * 0.5,
      life: 200 + Math.random() * 100,
      maxLife: 300,
      size: 6 + Math.random() * 4,
      color: Math.random() > 0.5 ? 0x228B22 : 0x8B4513,
      alpha: 0.7,
      rotation: Math.random() * Math.PI * 2,
      rotationSpeed: (Math.random() - 0.5) * 0.1,
      gravity: 0.02,
      type: 'leaf',
      scale: 1,
      shrink: false
    });
  }

  update() {
    // Update all particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life--;
      
      // Physics
      p.x += p.vx;
      p.y += p.vy;
      p.vy += p.gravity;
      p.rotation += p.rotationSpeed;
      
      // Friction for some types
      if (p.type === 'dust' || p.type === 'smoke') {
        p.vx *= 0.98;
        p.vy *= 0.98;
      }

      // Shrink over time
      if (p.shrink) {
        p.scale = p.life / p.maxLife;
      }

      // Fade out
      p.alpha = Math.min(p.alpha, (p.life / p.maxLife) * 1.5);

      // Remove dead particles
      if (p.life <= 0) {
        this.particles.splice(i, 1);
      }
    }

    // Limit particles
    while (this.particles.length > this.maxParticles) {
      this.particles.shift();
    }
  }

  render() {
    this.graphics.clear();
    
    for (const p of this.particles) {
      const size = p.size * p.scale;
      if (size < 0.5) continue;

      switch (p.type) {
        case 'sparkle':
        case 'star':
          // Diamond/star shape
          this.graphics.fill({ color: p.color, alpha: p.alpha });
          this.graphics.moveTo(p.x, p.y - size);
          this.graphics.lineTo(p.x + size * 0.5, p.y);
          this.graphics.lineTo(p.x, p.y + size);
          this.graphics.lineTo(p.x - size * 0.5, p.y);
          this.graphics.closePath();
          this.graphics.fill();
          break;

        case 'bubble':
          // Hollow circle with highlight
          this.graphics.stroke({ color: p.color, width: 1, alpha: p.alpha });
          this.graphics.circle(p.x, p.y, size);
          this.graphics.stroke();
          this.graphics.fill({ color: 0xFFFFFF, alpha: p.alpha * 0.5 });
          this.graphics.circle(p.x - size * 0.3, p.y - size * 0.3, size * 0.3);
          this.graphics.fill();
          break;

        case 'trail':
          // Elongated ellipse
          this.graphics.fill({ color: p.color, alpha: p.alpha });
          this.graphics.ellipse(p.x, p.y, size * 1.5, size * 0.5);
          this.graphics.fill();
          break;

        case 'smoke':
          // Soft circle
          this.graphics.fill({ color: p.color, alpha: p.alpha * 0.5 });
          this.graphics.circle(p.x, p.y, size);
          this.graphics.fill();
          break;

        case 'leaf':
          // Simple leaf shape
          this.graphics.fill({ color: p.color, alpha: p.alpha });
          this.graphics.ellipse(p.x, p.y, size, size * 0.4);
          this.graphics.fill();
          break;

        default:
          // Simple circle for dust, spark, splash
          this.graphics.fill({ color: p.color, alpha: p.alpha });
          this.graphics.circle(p.x, p.y, size);
          this.graphics.fill();
      }
    }
  }
}

// ===============================================
// SCREEN EFFECTS
// ===============================================
class ScreenEffects {
  private shakeIntensity = 0;
  private shakeDecay = 0.9;
  private vignetteGraphics: PIXI.Graphics;
  private scanlineGraphics: PIXI.Graphics;
  private glowContainer: PIXI.Container;
  
  constructor() {
    this.vignetteGraphics = new PIXI.Graphics();
    this.scanlineGraphics = new PIXI.Graphics();
    this.glowContainer = new PIXI.Container();
  }

  getVignette(): PIXI.Graphics { return this.vignetteGraphics; }
  getScanlines(): PIXI.Graphics { return this.scanlineGraphics; }
  getGlowContainer(): PIXI.Container { return this.glowContainer; }

  // Trigger screen shake
  shake(intensity: number = 8) {
    this.shakeIntensity = Math.max(this.shakeIntensity, intensity);
  }

  // Update and get shake offset
  updateShake(): { x: number; y: number } {
    if (this.shakeIntensity < 0.5) {
      this.shakeIntensity = 0;
      return { x: 0, y: 0 };
    }
    
    const offset = {
      x: (Math.random() - 0.5) * this.shakeIntensity * 2,
      y: (Math.random() - 0.5) * this.shakeIntensity * 2
    };
    
    this.shakeIntensity *= this.shakeDecay;
    return offset;
  }

  // Draw vignette overlay using corner shadows (safer approach)
  drawVignette(width: number, height: number, intensity: number = 0.4) {
    this.vignetteGraphics.clear();
    
    // Draw corner shadows instead of using cut()
    const cornerSize = 300;
    
    // Top-left corner
    for (let i = 0; i < 10; i++) {
      const alpha = intensity * (1 - i / 10) * 0.15;
      const offset = i * 30;
      this.vignetteGraphics.fill({ color: 0x000000, alpha });
      this.vignetteGraphics.moveTo(0, 0);
      this.vignetteGraphics.lineTo(cornerSize - offset, 0);
      this.vignetteGraphics.quadraticCurveTo(offset, offset, 0, cornerSize - offset);
      this.vignetteGraphics.closePath();
      this.vignetteGraphics.fill();
    }
    
    // Top-right corner
    for (let i = 0; i < 10; i++) {
      const alpha = intensity * (1 - i / 10) * 0.15;
      const offset = i * 30;
      this.vignetteGraphics.fill({ color: 0x000000, alpha });
      this.vignetteGraphics.moveTo(width, 0);
      this.vignetteGraphics.lineTo(width - cornerSize + offset, 0);
      this.vignetteGraphics.quadraticCurveTo(width - offset, offset, width, cornerSize - offset);
      this.vignetteGraphics.closePath();
      this.vignetteGraphics.fill();
    }
    
    // Bottom-left corner
    for (let i = 0; i < 10; i++) {
      const alpha = intensity * (1 - i / 10) * 0.15;
      const offset = i * 30;
      this.vignetteGraphics.fill({ color: 0x000000, alpha });
      this.vignetteGraphics.moveTo(0, height);
      this.vignetteGraphics.lineTo(cornerSize - offset, height);
      this.vignetteGraphics.quadraticCurveTo(offset, height - offset, 0, height - cornerSize + offset);
      this.vignetteGraphics.closePath();
      this.vignetteGraphics.fill();
    }
    
    // Bottom-right corner
    for (let i = 0; i < 10; i++) {
      const alpha = intensity * (1 - i / 10) * 0.15;
      const offset = i * 30;
      this.vignetteGraphics.fill({ color: 0x000000, alpha });
      this.vignetteGraphics.moveTo(width, height);
      this.vignetteGraphics.lineTo(width - cornerSize + offset, height);
      this.vignetteGraphics.quadraticCurveTo(width - offset, height - offset, width, height - cornerSize + offset);
      this.vignetteGraphics.closePath();
      this.vignetteGraphics.fill();
    }
  }

  // Subtle scanlines for retro effect (optional)
  drawScanlines(width: number, height: number, opacity: number = 0.03) {
    this.scanlineGraphics.clear();
    this.scanlineGraphics.fill({ color: 0x000000, alpha: opacity });
    
    for (let y = 0; y < height; y += 4) {
      this.scanlineGraphics.rect(0, y, width, 2);
    }
    this.scanlineGraphics.fill();
  }
}

// ===============================================
// MAIN RENDERER CLASS
// ===============================================
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
  
  // Visual Effects Systems
  private particles: ParticleSystem;
  private screenEffects: ScreenEffects;
  private effectsContainer: PIXI.Container;
  private foregroundEffects: PIXI.Container;
  
  // Animation state tracking
  private playerAnimState: Map<string, {
    wasGrounded: boolean;
    lastVelocityY: number;
    idleTime: number;
    runPhase: number;
    squashStretch: number;
    attackTrailTimer: number;
  }> = new Map();
  
  // Ambient effect timers
  private ambientTimer = 0;
  private wavePhase = 0;
  
  // Cached entity positions for particle effects
  private lastEntityPositions: Map<string, { x: number; y: number; active: boolean }> = new Map();
  
  // Track if renderer has been initialized
  private initialized = false;

  constructor() {
    this.app = new PIXI.Application();
    this.playerSprites = new Map();
    this.entitySprites = new Map();
    this.obstacleGraphics = new PIXI.Graphics();
    this.backgroundGraphics = new PIXI.Graphics();
    this.uiContainer = new PIXI.Container();
    this.worldContainer = new PIXI.Container();
    
    // Initialize effects systems
    this.particles = new ParticleSystem();
    this.screenEffects = new ScreenEffects();
    this.effectsContainer = new PIXI.Container();
    this.foregroundEffects = new PIXI.Container();
  }

  public async initialize(element: HTMLElement) {
    // Prevent double initialization which causes duplicate canvases and sounds
    if (this.initialized) {
      return;
    }
    
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
    
    // Effects layer between world and UI
    this.effectsContainer.addChild(this.particles.getGraphics());
    this.worldContainer.addChild(this.effectsContainer);
    
    this.app.stage.addChild(this.worldContainer);
    
    // Foreground effects (vignette, etc.) go on top
    this.foregroundEffects.addChild(this.screenEffects.getVignette());
    this.app.stage.addChild(this.foregroundEffects);
    
    this.app.stage.addChild(this.uiContainer);
    
    // Hide effects initially (will show when level loads)
    this.hideEffects();
    
    this.initialized = true;
  }

  // Show/hide visual effects (useful when naval battle is active)
  public showEffects() {
    this.worldContainer.visible = true;
    this.foregroundEffects.visible = true;
    this.screenEffects.drawVignette(800, 600, 0.25);
  }

  public hideEffects() {
    this.worldContainer.visible = false;
    this.foregroundEffects.visible = false;
  }

  public setPhysics(physics: PhysicsEngine) {
    this.physics = physics;
  }

  public getCanvas(): HTMLCanvasElement {
    return this.app.canvas;
  }

  public getApp(): PIXI.Application {
    return this.app;
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
    
    // Update ambient timer
    this.ambientTimer++;
    this.wavePhase += 0.02;
    
    // Update screen effects
    const shakeOffset = this.screenEffects.updateShake();
    
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
      
      // Apply camera with shake
      this.worldContainer.x = -this.camera.x + shakeOffset.x;
      this.worldContainer.y = -this.camera.y + shakeOffset.y;
    }

    // Emit ambient particles based on level
    this.emitAmbientParticles();

    // Render Players with enhanced animations
    state.players.forEach((player, id) => {
      let sprite = this.playerSprites.get(id);
      if (!sprite) {
        sprite = this.createPlayerSprite(player.color, player.characterType);
        this.playerSprites.set(id, sprite);
        this.worldContainer.addChild(sprite);
      }

      // Initialize animation state if needed
      if (!this.playerAnimState.has(id)) {
        this.playerAnimState.set(id, {
          wasGrounded: true,
          lastVelocityY: 0,
          idleTime: 0,
          runPhase: 0,
          squashStretch: 1,
          attackTrailTimer: 0
        });
      }
      const animState = this.playerAnimState.get(id)!;

      // Update position
      if (sprite.pivot.x === 0 && sprite.pivot.y === 0) {
        sprite.pivot.set(player.width / 2, player.height / 2);
      }
      
      const playerX = (player.position.x / SCALE) + (player.width / 2);
      const playerY = (player.position.y / SCALE) + (player.height / 2);
      sprite.x = playerX;
      sprite.y = playerY;
      
      // === ENHANCED ANIMATIONS ===
      
      // Landing squash effect
      if (player.isGrounded && !animState.wasGrounded && animState.lastVelocityY > 5) {
        animState.squashStretch = 0.7;
        // Emit landing dust
        this.particles.emitDust(playerX, playerY + player.height / 2, 8, player.velocity.x / SCALE);
      }
      
      // Recover from squash
      animState.squashStretch += (1 - animState.squashStretch) * 0.15;
      
      // Running dust
      if (player.isGrounded && Math.abs(player.velocity.x) > 100) {
        animState.runPhase += 0.3;
        if (animState.runPhase > Math.PI * 2) animState.runPhase -= Math.PI * 2;
        
        // Emit dust every few frames
        if (this.ambientTimer % 8 === 0) {
          this.particles.emitDust(
            playerX + (player.facingRight ? -10 : 10),
            playerY + player.height / 2 - 2,
            2,
            player.facingRight ? -1 : 1
          );
        }
      } else {
        animState.idleTime++;
      }
      
      // Apply squash/stretch
      const baseScaleX = player.facingRight ? 1 : -1;
      sprite.scale.x = baseScaleX * (2 - animState.squashStretch);
      sprite.scale.y = animState.squashStretch;
      
      // Idle breathing animation
      if (Math.abs(player.velocity.x) < 50 && player.isGrounded && !player.isAttacking) {
        const breathe = Math.sin(this.ambientTimer * 0.05) * 0.02;
        sprite.scale.y += breathe;
      }
      
      // Flip sprite based on facing direction (already applied above)
      
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
          
          // Emit sword trail particles
          animState.attackTrailTimer++;
          if (animState.attackTrailTimer % 3 === 0) {
            this.particles.emitSwordTrail(
              playerX + (player.facingRight ? 20 : -20),
              playerY,
              player.facingRight
            );
          }
        } else {
          // Rest position
          swordArm.rotation = -0.3;
          animState.attackTrailTimer = 0;
        }
      }
      
      // Update animation state for next frame
      animState.wasGrounded = player.isGrounded;
      animState.lastVelocityY = player.velocity.y / SCALE;
    });

    // Clean up disconnected players
    for (const [id, sprite] of this.playerSprites) {
      if (!state.players.has(id)) {
        this.worldContainer.removeChild(sprite);
        this.playerSprites.delete(id);
        this.playerAnimState.delete(id);
      }
    }

    // Render Entities with effects
    this.renderEntities(state);
    
    // Update and render particles
    this.particles.update();
    this.particles.render();
  }

  // Trigger screen shake (call this when player takes damage or enemy is defeated)
  public triggerShake(intensity: number = 8) {
    this.screenEffects.shake(intensity);
  }

  // Emit particle effects for collectibles and enemies
  public emitCollectEffect(x: number, y: number) {
    this.particles.emitCoinBurst(x, y);
  }

  public emitDefeatEffect(x: number, y: number, color: number = 0xFF4500) {
    this.particles.emitEnemyDefeat(x, y, color);
    this.screenEffects.shake(4);
  }

  private emitAmbientParticles() {
    if (!this.physics) return;
    const level = this.physics.getCurrentLevel();
    if (!level) return;

    // Different ambient effects based on level
    const levelId = level.id;
    
    // Spawn ambient particles occasionally
    if (this.ambientTimer % 30 === 0) {
      const spawnX = this.camera.x + Math.random() * 800;
      const spawnY = this.camera.y + Math.random() * 600;
      
      if (levelId === 4) {
        // Kraken's Lair - underwater bubbles
        this.particles.emitBubbles(spawnX, spawnY + 400, 2);
      } else if (levelId === 1) {
        // Shipwreck Shore - occasional leaves/debris
        if (Math.random() < 0.3) {
          this.particles.emitLeaf(spawnX, this.camera.y - 20);
        }
      }
    }
  }

  private renderEntities(state: GameState) {
    // Track entity state changes for particle effects
    for (const entity of state.entities) {
      const lastPos = this.lastEntityPositions.get(entity.id);
      const wasActive = lastPos?.active ?? true;
      
      // Detect enemy defeat
      if (entity.type === EntityType.ENEMY && wasActive && !entity.active) {
        const color = this.getEnemyColor(entity.enemyType);
        this.emitDefeatEffect(entity.position.x + entity.width / 2, entity.position.y + entity.height / 2, color);
      }
      
      // Detect doubloon collection
      if (entity.type === EntityType.DOUBLOON && wasActive && !entity.active) {
        this.particles.emitCoinBurst(entity.position.x + entity.width / 2, entity.position.y + entity.height / 2);
      }
      
      // Detect sword collection
      if (entity.type === EntityType.SWORD_CHEST && !lastPos && entity.collected) {
        // First frame of collection
        this.particles.emitSparkle(entity.position.x + entity.width / 2, entity.position.y, 20, 0xFFD700);
        this.screenEffects.shake(6);
      }
      
      // Update tracking
      this.lastEntityPositions.set(entity.id, {
        x: entity.position.x,
        y: entity.position.y,
        active: entity.active
      });
    }
    
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
        
        // === ENHANCED ENTITY ANIMATIONS ===
        
        // Doubloon bobbing and sparkle
        if (entity.type === EntityType.DOUBLOON) {
          sprite.y += Math.sin(this.ambientTimer * 0.08 + entity.position.x * 0.1) * 3;
          sprite.rotation = Math.sin(this.ambientTimer * 0.05) * 0.1;
          
          // Occasional sparkle
          if (this.ambientTimer % 60 === Math.floor(entity.position.x) % 60) {
            this.particles.emitSparkle(
              entity.position.x + entity.width / 2,
              entity.position.y + entity.height / 2,
              3,
              0xFFD700
            );
          }
        }
        
        // Sword chest glow pulsing
        if (entity.type === EntityType.SWORD_CHEST && !entity.collected) {
          const pulse = 0.9 + Math.sin(this.ambientTimer * 0.1) * 0.1;
          sprite.scale.set(pulse, pulse);
          
          // Golden particles around chest
          if (this.ambientTimer % 40 === 0) {
            this.particles.emitSparkle(
              entity.position.x + entity.width / 2 + (Math.random() - 0.5) * 20,
              entity.position.y + entity.height / 2,
              2,
              0xFFD700
            );
          }
        }
        
        // Goal treasure chest sparkle
        if (entity.type === EntityType.GOAL) {
          if (this.ambientTimer % 45 === 0) {
            this.particles.emitSparkle(
              entity.position.x + entity.width / 2,
              entity.position.y + entity.height / 2,
              4,
              0xFFD700
            );
          }
        }
        
        // Jellyfish pulsing
        if (entity.type === EntityType.ENEMY && entity.enemyType === EnemyType.JELLYFISH) {
          const pulse = 1 + Math.sin(this.ambientTimer * 0.15) * 0.1;
          sprite.scale.y = pulse;
        }
        
        // Cannonball trail
        if (entity.type === EntityType.CANNONBALL) {
          if (this.ambientTimer % 3 === 0) {
            this.particles.emitDust(entity.position.x + entity.width / 2, entity.position.y + entity.height / 2, 2);
          }
        }
        
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
            
            // Emit ghost phase particles
            if (!entity.isVisible) {
              this.particles.emitSparkle(
                entity.position.x + entity.width / 2,
                entity.position.y + entity.height / 2,
                6,
                0x00FFFF
              );
            }
          }
        }
      }
    }
  }

  private getEnemyColor(enemyType?: EnemyType): number {
    switch (enemyType) {
      case EnemyType.CRAB: return 0xFF4500;
      case EnemyType.SEAGULL: return 0xF5F5F5;
      case EnemyType.SKELETON: return 0xE8E8E8;
      case EnemyType.JELLYFISH: return 0xFF69B4;
      case EnemyType.GHOST: return 0x00FFFF;
      default: return 0xFF4500;
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
    
    // === CAPTAIN JACK - Classic Swashbuckler Style ===
    // Reference: Red military coat with gold epaulets, tricorn hat with skull
    
    // === BODY (Red Military Coat) ===
    const body = new PIXI.Graphics();
    // Main coat (rich red)
    body.fill(0xB22222); // Firebrick red
    body.rect(4, 14, 24, 16); // Torso
    body.fill();
    
    // Coat lapels (darker red inner)
    body.fill(0x8B0000);
    body.moveTo(8, 14);
    body.lineTo(16, 20);
    body.lineTo(24, 14);
    body.lineTo(20, 14);
    body.lineTo(16, 17);
    body.lineTo(12, 14);
    body.closePath();
    body.fill();
    
    // White shirt underneath
    body.fill(0xFFF8DC);
    body.moveTo(12, 14);
    body.lineTo(16, 18);
    body.lineTo(20, 14);
    body.closePath();
    body.fill();
    
    // Gold buttons down center
    body.fill(0xFFD700);
    body.circle(16, 20, 1.5);
    body.circle(16, 24, 1.5);
    body.circle(16, 28, 1.5);
    body.fill();
    
    // Coat trim (gold edges)
    body.stroke({ color: 0xDAA520, width: 1.5 });
    body.moveTo(4, 14);
    body.lineTo(4, 30);
    body.stroke();
    body.moveTo(28, 14);
    body.lineTo(28, 30);
    body.stroke();
    
    // === GOLD EPAULETS (Shoulder pads) ===
    const epaulets = new PIXI.Graphics();
    // Left epaulet
    epaulets.fill(0xFFD700);
    epaulets.ellipse(4, 16, 5, 3);
    epaulets.fill();
    // Gold fringe
    epaulets.stroke({ color: 0xDAA520, width: 1 });
    for (let i = 0; i < 4; i++) {
      epaulets.moveTo(1 + i * 2, 18);
      epaulets.lineTo(1 + i * 2, 22);
      epaulets.stroke();
    }
    // Right epaulet
    epaulets.fill(0xFFD700);
    epaulets.ellipse(28, 16, 5, 3);
    epaulets.fill();
    // Gold fringe
    for (let i = 0; i < 4; i++) {
      epaulets.moveTo(25 + i * 2, 18);
      epaulets.lineTo(25 + i * 2, 22);
      epaulets.stroke();
    }
    
    // === PANTS ===
    const pants = new PIXI.Graphics();
    pants.fill(0x1a1a2e); // Dark navy pants
    pants.rect(6, 28, 9, 8); // Left leg
    pants.rect(17, 28, 9, 8); // Right leg
    pants.fill();
    
    // === BOOTS ===
    const boots = new PIXI.Graphics();
    boots.fill(0x2d1810); // Dark brown leather boots
    boots.rect(4, 34, 11, 4);
    boots.rect(17, 34, 11, 4);
    boots.fill();
    // Boot cuffs (folded over)
    boots.fill(0x3d2820);
    boots.rect(5, 32, 9, 3);
    boots.rect(18, 32, 9, 3);
    boots.fill();
    // Gold buckle accents
    boots.fill(0xDAA520);
    boots.rect(8, 33, 3, 2);
    boots.rect(21, 33, 3, 2);
    boots.fill();
    
    // === HEAD ===
    const head = new PIXI.Graphics();
    head.fill(0xDEB887); // Warm skin tone
    head.circle(16, 8, 10);
    head.fill();
    
    // === FACE ===
    const face = new PIXI.Graphics();
    // Eye patch strap
    face.fill(0x1a1a1a);
    face.rect(6, 5, 20, 2);
    face.fill();
    // Eye (right eye visible) - warm brown
    face.fill(0xFFFFFF);
    face.circle(21, 7, 3);
    face.fill();
    face.fill(0x4a3728);
    face.circle(21, 7, 2);
    face.fill();
    face.fill(0x000000);
    face.circle(21.5, 7, 1);
    face.fill();
    // Eye highlight
    face.fill(0xFFFFFF);
    face.circle(20, 6, 0.8);
    face.fill();
    
    // Eye patch (left eye)
    face.fill(0x1a1a1a);
    face.circle(11, 7, 4);
    face.fill();
    
    // Thick dark beard
    face.fill(0x1a1a1a);
    face.moveTo(8, 10);
    face.quadraticCurveTo(16, 20, 24, 10);
    face.lineTo(24, 8);
    face.quadraticCurveTo(16, 14, 8, 8);
    face.closePath();
    face.fill();
    
    // Mustache
    face.fill(0x1a1a1a);
    face.ellipse(12, 10, 4, 2);
    face.ellipse(20, 10, 4, 2);
    face.fill();
    
    // Nose
    face.fill(0xD2B48C);
    face.ellipse(16, 9, 2, 1.5);
    face.fill();
    
    // Smirk line
    face.stroke({ color: 0x8B4513, width: 1 });
    face.moveTo(18, 12);
    face.quadraticCurveTo(20, 13, 22, 12);
    face.stroke();
    
    // Earring (gold hoop on visible side)
    face.fill(0xFFD700);
    face.circle(26, 10, 2);
    face.fill();
    face.fill(0xDEB887);
    face.circle(26, 10, 1);
    face.fill();
    
    // === TRICORN HAT with Skull & Crossbones ===
    const hat = new PIXI.Graphics();
    // Hat base (wide tricorn)
    hat.fill(0x1a1a1a);
    hat.moveTo(-4, 4);
    hat.lineTo(36, 4);
    hat.lineTo(32, -2);
    hat.quadraticCurveTo(16, -18, 0, -2);
    hat.closePath();
    hat.fill();
    
    // Hat brim curl-ups (tricorn style)
    hat.fill(0x2a2a2a);
    hat.moveTo(-4, 4);
    hat.quadraticCurveTo(-2, -4, 6, 0);
    hat.lineTo(4, 4);
    hat.closePath();
    hat.fill();
    hat.moveTo(36, 4);
    hat.quadraticCurveTo(34, -4, 26, 0);
    hat.lineTo(28, 4);
    hat.closePath();
    hat.fill();
    
    // Gold hat band/trim
    hat.fill(0xDAA520);
    hat.rect(4, 0, 24, 4);
    hat.fill();
    
    // === SKULL & CROSSBONES on hat ===
    // Skull
    hat.fill(0xFFFFFF);
    hat.circle(16, -4, 5);
    hat.fill();
    // Jaw
    hat.fill(0xFFFFFF);
    hat.rect(12, -2, 8, 3);
    hat.fill();
    // Eye sockets
    hat.fill(0x1a1a1a);
    hat.circle(14, -5, 1.5);
    hat.circle(18, -5, 1.5);
    hat.fill();
    // Nose
    hat.fill(0x1a1a1a);
    hat.moveTo(16, -4);
    hat.lineTo(15, -2);
    hat.lineTo(17, -2);
    hat.closePath();
    hat.fill();
    // Teeth line
    hat.stroke({ color: 0x1a1a1a, width: 0.5 });
    for (let i = 0; i < 4; i++) {
      hat.moveTo(13 + i * 2, -1);
      hat.lineTo(13 + i * 2, 1);
      hat.stroke();
    }
    // Crossbones behind skull
    hat.stroke({ color: 0xFFFFFF, width: 2 });
    hat.moveTo(8, -8);
    hat.lineTo(24, 0);
    hat.stroke();
    hat.moveTo(24, -8);
    hat.lineTo(8, 0);
    hat.stroke();
    
    // === SWORD ARM (Animated) ===
    const swordArm = new PIXI.Container();
    swordArm.label = 'swordArm';
    
    // Arm with red coat sleeve
    const arm = new PIXI.Graphics();
    arm.fill(0xDEB887); // Hand/skin
    arm.rect(8, -2, 6, 5);
    arm.fill();
    // Red coat sleeve
    arm.fill(0xB22222);
    arm.rect(-2, -3, 12, 7);
    arm.fill();
    // Gold cuff
    arm.fill(0xFFD700);
    arm.rect(6, -3, 4, 7);
    arm.fill();
    
    // Cutlass sword
    const sword = new PIXI.Graphics();
    // Guard (ornate gold)
    sword.fill(0xDAA520);
    sword.ellipse(12, 0, 3, 5);
    sword.fill();
    sword.fill(0xFFD700);
    sword.ellipse(12, 0, 2, 3);
    sword.fill();
    // Handle (wrapped leather)
    sword.fill(0x4a3728);
    sword.rect(8, -2, 5, 4);
    sword.fill();
    // Pommel
    sword.fill(0xDAA520);
    sword.circle(7, 0, 2.5);
    sword.fill();
    // Curved cutlass blade
    sword.fill(0xC0C0C0);
    sword.moveTo(14, -2);
    sword.quadraticCurveTo(28, -4, 36, 0);
    sword.lineTo(34, 2);
    sword.quadraticCurveTo(26, 0, 14, 2);
    sword.closePath();
    sword.fill();
    // Blade shine
    sword.fill({ color: 0xFFFFFF, alpha: 0.5 });
    sword.moveTo(16, -1);
    sword.quadraticCurveTo(26, -2, 33, 0);
    sword.quadraticCurveTo(26, 0, 16, 1);
    sword.closePath();
    sword.fill();
    
    swordArm.addChild(arm);
    swordArm.addChild(sword);
    swordArm.x = 26;
    swordArm.y = 18;
    swordArm.pivot.set(0, 0);
    swordArm.rotation = -0.3;
    
    // === LEFT ARM ===
    const leftArm = new PIXI.Graphics();
    leftArm.fill(0xDEB887); // Hand
    leftArm.circle(-1, 27, 3);
    leftArm.fill();
    // Arm
    leftArm.fill(0xDEB887);
    leftArm.rect(-4, 22, 5, 6);
    leftArm.fill();
    // Red sleeve
    leftArm.fill(0xB22222);
    leftArm.rect(-5, 14, 7, 10);
    leftArm.fill();
    // Gold cuff
    leftArm.fill(0xFFD700);
    leftArm.rect(-4, 20, 5, 3);
    leftArm.fill();
    
    // === BELT with Gold Buckle ===
    const belt = new PIXI.Graphics();
    belt.fill(0x2d1810); // Dark leather
    belt.rect(4, 26, 24, 4);
    belt.fill();
    // Ornate gold buckle
    belt.fill(0xFFD700);
    belt.rect(12, 25, 8, 6);
    belt.fill();
    belt.fill(0xDAA520);
    belt.rect(13, 26, 6, 4);
    belt.fill();
    belt.fill(0x2d1810);
    belt.rect(14, 27, 4, 2);
    belt.fill();

    // Add all parts in correct z-order (back to front)
    container.addChild(leftArm);
    container.addChild(pants);
    container.addChild(boots);
    container.addChild(body);
    container.addChild(epaulets);
    container.addChild(belt);
    container.addChild(head);
    container.addChild(face);
    container.addChild(hat);
    container.addChild(swordArm);

    return container;
  }

  private createGirlPirateSprite(color: number): PIXI.Container {
    const container = new PIXI.Container();
    
    // === SCARLET ROSE - Fierce Corsair Style ===
    // Reference: Red flowing hair, purple vest/corset, brown leather gloves, pistol
    
    // === BODY (Purple Vest over White Blouse) ===
    const body = new PIXI.Graphics();
    // White blouse base
    body.fill(0xFFF8F0);
    body.rect(6, 14, 20, 14);
    body.fill();
    
    // Purple vest/corset
    body.fill(0x6B2D5C); // Deep purple/magenta
    body.moveTo(6, 16);
    body.lineTo(10, 14);
    body.lineTo(22, 14);
    body.lineTo(26, 16);
    body.lineTo(26, 28);
    body.lineTo(6, 28);
    body.closePath();
    body.fill();
    
    // Vest lacing down center
    body.stroke({ color: 0xFFD700, width: 1 });
    body.moveTo(14, 16);
    body.lineTo(18, 18);
    body.moveTo(14, 20);
    body.lineTo(18, 22);
    body.moveTo(14, 24);
    body.lineTo(18, 26);
    body.stroke();
    
    // Blouse ruffles at neckline
    body.fill(0xFFFFFF);
    body.ellipse(16, 15, 6, 2);
    body.fill();
    
    // === PANTS (Fitted) ===
    const pants = new PIXI.Graphics();
    pants.fill(0x2c1810); // Dark brown leather pants
    pants.rect(6, 26, 9, 10);
    pants.rect(17, 26, 9, 10);
    pants.fill();
    
    // === BOOTS (Tall pirate boots) ===
    const boots = new PIXI.Graphics();
    boots.fill(0x4a3020); // Brown leather
    boots.rect(5, 32, 9, 6);
    boots.rect(18, 32, 9, 6);
    boots.fill();
    // Boot cuffs folded
    boots.fill(0x5a4030);
    boots.rect(5, 30, 9, 4);
    boots.rect(18, 30, 9, 4);
    boots.fill();
    // Boot buckles
    boots.fill(0xDAA520);
    boots.rect(8, 31, 3, 2);
    boots.rect(21, 31, 3, 2);
    boots.fill();
    
    // === HEAD ===
    const head = new PIXI.Graphics();
    head.fill(0xF5DEB3); // Warm skin tone
    head.circle(16, 8, 10);
    head.fill();
    
    // === FLOWING RED HAIR ===
    const hair = new PIXI.Graphics();
    hair.fill(0xCC3300); // Vibrant red-orange
    // Hair volume on top
    hair.ellipse(16, 0, 14, 10);
    hair.fill();
    
    // Flowing waves on left side
    hair.moveTo(2, 2);
    hair.quadraticCurveTo(-6, 12, -2, 24);
    hair.quadraticCurveTo(0, 30, 4, 34);
    hair.quadraticCurveTo(0, 26, 2, 20);
    hair.quadraticCurveTo(0, 14, 2, 2);
    hair.fill();
    
    // More volume on left
    hair.moveTo(4, 4);
    hair.quadraticCurveTo(-2, 16, 2, 28);
    hair.quadraticCurveTo(4, 20, 4, 4);
    hair.fill();
    
    // Flowing waves on right side
    hair.moveTo(30, 2);
    hair.quadraticCurveTo(38, 12, 34, 24);
    hair.quadraticCurveTo(32, 30, 28, 34);
    hair.quadraticCurveTo(32, 26, 30, 20);
    hair.quadraticCurveTo(32, 14, 30, 2);
    hair.fill();
    
    // More volume on right
    hair.moveTo(28, 4);
    hair.quadraticCurveTo(34, 16, 30, 28);
    hair.quadraticCurveTo(28, 20, 28, 4);
    hair.fill();
    
    // Hair highlight streaks
    hair.fill({ color: 0xFF6633, alpha: 0.6 });
    hair.ellipse(12, 2, 4, 3);
    hair.ellipse(20, 1, 3, 2);
    hair.fill();
    
    // === FACE ===
    const face = new PIXI.Graphics();
    // Eyes (fierce, determined)
    face.fill(0xFFFFFF);
    face.ellipse(11, 7, 3, 2.5);
    face.ellipse(21, 7, 3, 2.5);
    face.fill();
    // Dark green/hazel eyes
    face.fill(0x2E5D4E);
    face.circle(11, 7, 2);
    face.circle(21, 7, 2);
    face.fill();
    face.fill(0x000000);
    face.circle(11, 7, 1);
    face.circle(21, 7, 1);
    face.fill();
    // Eye highlights
    face.fill(0xFFFFFF);
    face.circle(10, 6, 0.7);
    face.circle(20, 6, 0.7);
    face.fill();
    
    // Defined eyebrows (fierce look)
    face.stroke({ color: 0x8B4513, width: 1.5 });
    face.moveTo(8, 4);
    face.lineTo(14, 4);
    face.moveTo(18, 4);
    face.lineTo(24, 4);
    face.stroke();
    
    // Eyelashes
    face.stroke({ color: 0x000000, width: 1 });
    face.moveTo(8, 5);
    face.lineTo(9, 4);
    face.moveTo(13, 5);
    face.lineTo(12, 4);
    face.moveTo(19, 5);
    face.lineTo(20, 4);
    face.moveTo(24, 5);
    face.lineTo(23, 4);
    face.stroke();
    
    // Nose
    face.fill(0xE8C8A8);
    face.ellipse(16, 10, 1.5, 1.2);
    face.fill();
    
    // Full lips
    face.fill(0xB33333);
    face.ellipse(16, 13, 3, 1.5);
    face.fill();
    // Lip highlight
    face.fill({ color: 0xFF6666, alpha: 0.5 });
    face.ellipse(15, 12.5, 1.5, 0.5);
    face.fill();
    
    // Rosy cheeks
    face.fill({ color: 0xFFB6C1, alpha: 0.4 });
    face.circle(7, 10, 2.5);
    face.circle(25, 10, 2.5);
    face.fill();
    
    // === EARRINGS ===
    const earrings = new PIXI.Graphics();
    earrings.fill(0xFFD700);
    earrings.circle(4, 12, 2.5);
    earrings.circle(28, 12, 2.5);
    earrings.fill();
    earrings.fill(0xDAA520);
    earrings.circle(4, 12, 1);
    earrings.circle(28, 12, 1);
    earrings.fill();
    
    // === LEFT ARM WITH PISTOL ===
    const leftArm = new PIXI.Graphics();
    // Brown leather glove
    leftArm.fill(0x5D4037);
    leftArm.rect(-6, 16, 7, 12);
    leftArm.fill();
    leftArm.fill(0x5D4037);
    leftArm.circle(-2, 29, 3);
    leftArm.fill();
    // Glove cuff
    leftArm.fill(0x6D5047);
    leftArm.rect(-6, 16, 7, 3);
    leftArm.fill();
    
    // Flintlock pistol
    leftArm.fill(0x4a4a4a); // Gun barrel
    leftArm.rect(-16, 20, 14, 3);
    leftArm.fill();
    // Barrel tip
    leftArm.fill(0x3a3a3a);
    leftArm.circle(-16, 21.5, 2);
    leftArm.fill();
    // Wooden grip
    leftArm.fill(0x5D4037);
    leftArm.moveTo(-4, 22);
    leftArm.lineTo(-6, 30);
    leftArm.lineTo(-2, 30);
    leftArm.lineTo(0, 22);
    leftArm.closePath();
    leftArm.fill();
    // Trigger guard
    leftArm.stroke({ color: 0xDAA520, width: 1 });
    leftArm.moveTo(-4, 24);
    leftArm.quadraticCurveTo(-6, 28, -2, 28);
    leftArm.stroke();
    // Flintlock mechanism
    leftArm.fill(0xDAA520);
    leftArm.rect(-6, 19, 3, 4);
    leftArm.fill();
    
    // === SWORD ARM (Animated) ===
    const swordArm = new PIXI.Container();
    swordArm.label = 'swordArm';
    
    const arm = new PIXI.Graphics();
    // Brown leather glove
    arm.fill(0x5D4037);
    arm.rect(6, -2, 8, 5);
    arm.fill();
    // Purple sleeve
    arm.fill(0x6B2D5C);
    arm.rect(-2, -3, 10, 7);
    arm.fill();
    // White blouse cuff
    arm.fill(0xFFFFFF);
    arm.rect(4, -3, 4, 7);
    arm.fill();
    
    // Elegant rapier
    const sword = new PIXI.Graphics();
    // Ornate guard
    sword.fill(0xDAA520);
    sword.ellipse(14, 0, 4, 5);
    sword.fill();
    sword.fill(0xFFD700);
    sword.ellipse(14, 0, 2.5, 3);
    sword.fill();
    // Handle
    sword.fill(0x4a3728);
    sword.rect(10, -2, 5, 4);
    sword.fill();
    // Pommel
    sword.fill(0xDAA520);
    sword.circle(9, 0, 2);
    sword.fill();
    // Thin elegant blade
    sword.fill(0xD0D0D0);
    sword.moveTo(16, -1.5);
    sword.lineTo(38, 0);
    sword.lineTo(16, 1.5);
    sword.closePath();
    sword.fill();
    // Blade shine
    sword.fill({ color: 0xFFFFFF, alpha: 0.6 });
    sword.moveTo(18, -0.5);
    sword.lineTo(35, 0);
    sword.lineTo(18, 0.5);
    sword.closePath();
    sword.fill();
    
    swordArm.addChild(arm);
    swordArm.addChild(sword);
    swordArm.x = 26;
    swordArm.y = 18;
    swordArm.rotation = -0.3;
    
    // === BELT ===
    const belt = new PIXI.Graphics();
    belt.fill(0x4a3020);
    belt.rect(4, 25, 24, 3);
    belt.fill();
    // Ornate belt buckle
    belt.fill(0xFFD700);
    belt.rect(13, 24, 6, 5);
    belt.fill();
    belt.fill(0xDAA520);
    belt.rect(14, 25, 4, 3);
    belt.fill();

    // Add all parts
    container.addChild(leftArm);
    container.addChild(pants);
    container.addChild(boots);
    container.addChild(body);
    container.addChild(belt);
    container.addChild(hair);
    container.addChild(head);
    container.addChild(face);
    container.addChild(earrings);
    container.addChild(swordArm);

    return container;
  }

  private createOctopusSprite(color: number): PIXI.Container {
    const container = new PIXI.Container();
    
    // === INKY PETE - Mischievous Purple Octopus ===
    // Reference: Deep purple octopus with mischievous grin, 8 curling tentacles
    
    const mainPurple = 0x7B4B94; // Rich purple
    const darkPurple = 0x5D3A6E; // Darker shade
    const lightPurple = 0x9B6BB0; // Highlight
    const suckerColor = 0xE8D4F0; // Light pink/lavender for suckers
    
    // === BACK TENTACLES (Behind body) ===
    const tentaclesBack = new PIXI.Graphics();
    tentaclesBack.fill(darkPurple);
    
    // Back left tentacle - curling outward
    tentaclesBack.moveTo(2, 20);
    tentaclesBack.quadraticCurveTo(-8, 28, -12, 38);
    tentaclesBack.quadraticCurveTo(-10, 44, -4, 42);
    tentaclesBack.quadraticCurveTo(-2, 38, 0, 32);
    tentaclesBack.quadraticCurveTo(2, 26, 6, 20);
    tentaclesBack.closePath();
    tentaclesBack.fill();
    
    // Back right tentacle - curling outward
    tentaclesBack.moveTo(30, 20);
    tentaclesBack.quadraticCurveTo(40, 28, 44, 38);
    tentaclesBack.quadraticCurveTo(42, 44, 36, 42);
    tentaclesBack.quadraticCurveTo(34, 38, 32, 32);
    tentaclesBack.quadraticCurveTo(30, 26, 26, 20);
    tentaclesBack.closePath();
    tentaclesBack.fill();
    
    // Suckers on back tentacles
    tentaclesBack.fill(suckerColor);
    tentaclesBack.circle(-6, 34, 2);
    tentaclesBack.circle(-2, 38, 1.5);
    tentaclesBack.circle(38, 34, 2);
    tentaclesBack.circle(34, 38, 1.5);
    tentaclesBack.fill();
    
    // === BODY (Round bulbous head) ===
    const body = new PIXI.Graphics();
    // Main body - larger, rounder
    body.fill(mainPurple);
    body.ellipse(16, 12, 16, 14);
    body.fill();
    
    // Body highlight (3D effect)
    body.fill({ color: lightPurple, alpha: 0.5 });
    body.ellipse(12, 6, 8, 6);
    body.fill();
    
    // Body texture - spots/bumps
    body.fill({ color: darkPurple, alpha: 0.4 });
    body.circle(8, 16, 3);
    body.circle(24, 16, 3);
    body.circle(16, 20, 2.5);
    body.circle(6, 10, 2);
    body.circle(26, 10, 2);
    body.fill();
    
    // === FRONT TENTACLES (More dynamic, curly) ===
    const tentaclesFront = new PIXI.Graphics();
    tentaclesFront.fill(mainPurple);
    
    // Front left outer tentacle - curling down and out
    tentaclesFront.moveTo(4, 22);
    tentaclesFront.quadraticCurveTo(-2, 32, 0, 42);
    tentaclesFront.quadraticCurveTo(4, 48, 8, 44);
    tentaclesFront.quadraticCurveTo(6, 38, 8, 30);
    tentaclesFront.quadraticCurveTo(8, 26, 8, 22);
    tentaclesFront.closePath();
    tentaclesFront.fill();
    
    // Front left inner tentacle
    tentaclesFront.moveTo(8, 22);
    tentaclesFront.quadraticCurveTo(6, 34, 10, 44);
    tentaclesFront.quadraticCurveTo(12, 48, 14, 44);
    tentaclesFront.quadraticCurveTo(12, 36, 12, 26);
    tentaclesFront.lineTo(12, 22);
    tentaclesFront.closePath();
    tentaclesFront.fill();
    
    // Front right inner tentacle
    tentaclesFront.moveTo(20, 22);
    tentaclesFront.quadraticCurveTo(22, 34, 18, 44);
    tentaclesFront.quadraticCurveTo(16, 48, 18, 44);
    tentaclesFront.quadraticCurveTo(20, 36, 20, 26);
    tentaclesFront.lineTo(24, 22);
    tentaclesFront.closePath();
    tentaclesFront.fill();
    
    // Front right outer tentacle - curling down and out
    tentaclesFront.moveTo(28, 22);
    tentaclesFront.quadraticCurveTo(34, 32, 32, 42);
    tentaclesFront.quadraticCurveTo(28, 48, 24, 44);
    tentaclesFront.quadraticCurveTo(26, 38, 24, 30);
    tentaclesFront.quadraticCurveTo(24, 26, 24, 22);
    tentaclesFront.closePath();
    tentaclesFront.fill();
    
    // Suckers on front tentacles
    tentaclesFront.fill(suckerColor);
    // Left outer
    tentaclesFront.circle(4, 34, 2);
    tentaclesFront.circle(6, 40, 1.5);
    // Left inner
    tentaclesFront.circle(10, 36, 1.8);
    tentaclesFront.circle(11, 42, 1.3);
    // Right inner
    tentaclesFront.circle(22, 36, 1.8);
    tentaclesFront.circle(21, 42, 1.3);
    // Right outer
    tentaclesFront.circle(28, 34, 2);
    tentaclesFront.circle(26, 40, 1.5);
    tentaclesFront.fill();
    
    // === FACE - MISCHIEVOUS EXPRESSION ===
    const face = new PIXI.Graphics();
    
    // Large expressive eyes (yellow/gold for mischief)
    face.fill(0xFFFFE0); // Cream white
    face.ellipse(10, 10, 6, 7);
    face.ellipse(22, 10, 6, 7);
    face.fill();
    
    // Yellow irises
    face.fill(0xFFD700);
    face.ellipse(11, 10, 4, 5);
    face.ellipse(23, 10, 4, 5);
    face.fill();
    
    // Pupils (looking to side for mischief)
    face.fill(0x000000);
    face.ellipse(12, 10, 2.5, 3.5);
    face.ellipse(24, 10, 2.5, 3.5);
    face.fill();
    
    // Eye shine (larger, more cartoonish)
    face.fill(0xFFFFFF);
    face.circle(9, 8, 2);
    face.circle(21, 8, 2);
    face.fill();
    face.fill(0xFFFFFF);
    face.circle(12, 12, 1);
    face.circle(24, 12, 1);
    face.fill();
    
    // Mischievous raised eyebrow effect (eyelid shadows)
    face.fill({ color: darkPurple, alpha: 0.6 });
    face.moveTo(5, 4);
    face.quadraticCurveTo(10, 2, 15, 5);
    face.lineTo(15, 6);
    face.quadraticCurveTo(10, 4, 5, 6);
    face.closePath();
    face.fill();
    
    // Right eyebrow raised higher (mischievous)
    face.moveTo(17, 3);
    face.quadraticCurveTo(22, 1, 27, 4);
    face.lineTo(27, 5);
    face.quadraticCurveTo(22, 3, 17, 5);
    face.closePath();
    face.fill();
    
    // WIDE MISCHIEVOUS GRIN
    face.fill(0x2D1B2E); // Dark mouth
    face.moveTo(8, 18);
    face.quadraticCurveTo(16, 26, 24, 18);
    face.quadraticCurveTo(16, 22, 8, 18);
    face.closePath();
    face.fill();
    
    // Teeth showing in grin
    face.fill(0xFFFFFF);
    face.rect(12, 18, 3, 2);
    face.rect(17, 18, 3, 2);
    face.fill();
    
    // Sly smile line
    face.stroke({ color: darkPurple, width: 1.5 });
    face.moveTo(24, 18);
    face.quadraticCurveTo(26, 16, 28, 17);
    face.stroke();
    
    // === PIRATE HAT (Small, tilted for swagger) ===
    const hat = new PIXI.Graphics();
    // Tilted tricorn
    hat.fill(0x1a1a1a);
    hat.moveTo(-2, 2);
    hat.lineTo(34, 4);
    hat.lineTo(30, -2);
    hat.quadraticCurveTo(16, -14, 2, -2);
    hat.closePath();
    hat.fill();
    
    // Hat band
    hat.fill(0xDAA520);
    hat.rect(4, -1, 24, 4);
    hat.fill();
    
    // Skull emblem
    hat.fill(0xFFFFFF);
    hat.circle(16, 0, 3);
    hat.fill();
    hat.fill(0x1a1a1a);
    hat.circle(14.5, -0.5, 0.8);
    hat.circle(17.5, -0.5, 0.8);
    hat.fill();
    // Crossbones
    hat.stroke({ color: 0xFFFFFF, width: 1.5 });
    hat.moveTo(11, -2);
    hat.lineTo(21, 3);
    hat.stroke();
    hat.moveTo(21, -2);
    hat.lineTo(11, 3);
    hat.stroke();
    
    // === SWORD ARM (Tentacle holding cutlass) ===
    const swordArm = new PIXI.Container();
    swordArm.label = 'swordArm';
    
    // Muscular tentacle arm
    const tentacleArm = new PIXI.Graphics();
    tentacleArm.fill(mainPurple);
    tentacleArm.moveTo(0, -3);
    tentacleArm.quadraticCurveTo(8, -5, 16, -3);
    tentacleArm.lineTo(18, 4);
    tentacleArm.quadraticCurveTo(10, 2, 0, 4);
    tentacleArm.closePath();
    tentacleArm.fill();
    
    // Tentacle curl around sword hilt
    tentacleArm.fill(mainPurple);
    tentacleArm.ellipse(14, 0, 5, 4);
    tentacleArm.fill();
    
    // Suckers on sword arm
    tentacleArm.fill(suckerColor);
    tentacleArm.circle(4, 2, 1.5);
    tentacleArm.circle(8, 3, 1.5);
    tentacleArm.circle(12, 3, 1.3);
    tentacleArm.fill();
    
    // Cutlass
    const sword = new PIXI.Graphics();
    // Guard
    sword.fill(0xDAA520);
    sword.ellipse(16, 0, 3, 5);
    sword.fill();
    sword.fill(0xFFD700);
    sword.ellipse(16, 0, 1.5, 3);
    sword.fill();
    // Blade
    sword.fill(0xC0C0C0);
    sword.moveTo(18, -2);
    sword.quadraticCurveTo(32, -3, 38, 0);
    sword.lineTo(36, 2);
    sword.quadraticCurveTo(30, 1, 18, 2);
    sword.closePath();
    sword.fill();
    // Blade shine
    sword.fill({ color: 0xFFFFFF, alpha: 0.5 });
    sword.moveTo(20, -1);
    sword.quadraticCurveTo(30, -1.5, 35, 0);
    sword.quadraticCurveTo(30, 0.5, 20, 1);
    sword.closePath();
    sword.fill();
    
    swordArm.addChild(tentacleArm);
    swordArm.addChild(sword);
    swordArm.x = 26;
    swordArm.y = 14;
    swordArm.rotation = -0.3;

    // Add all parts in z-order
    container.addChild(tentaclesBack);
    container.addChild(body);
    container.addChild(tentaclesFront);
    container.addChild(face);
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
    
    // Add animated water layer for applicable levels
    if (level.id === 1 || level.id === 4) {
      this.drawAnimatedWater(g, level);
    }
  }

  private drawAnimatedWater(g: PIXI.Graphics, level: LevelData) {
    const width = level.width;
    const height = level.height;
    const waterY = height - 50;
    
    // Animated wave effect using wavePhase
    g.fill({ color: 0x0077be, alpha: 0.4 });
    
    for (let x = 0; x < width + 40; x += 40) {
      const waveOffset = Math.sin(this.wavePhase + x * 0.02) * 8;
      g.circle(x, waterY + waveOffset, 25);
    }
    g.fill();
    
    // Foam on top of waves
    g.fill({ color: 0xFFFFFF, alpha: 0.3 });
    for (let x = 0; x < width + 40; x += 60) {
      const waveOffset = Math.sin(this.wavePhase + x * 0.02) * 8;
      g.ellipse(x + 20, waterY - 5 + waveOffset, 15, 4);
    }
    g.fill();
  }

  private drawShipwreckShoreBackground(g: PIXI.Graphics, level: LevelData) {
    const width = level.width;
    const height = level.height;

    // === PAINTERLY SUNSET PARADISE STYLE ===
    // Reference: Beautiful warm sunset with pink/purple sky, calm teal ocean, sandy beach
    
    // 1. SKY - Rich sunset gradient (bottom to top: yellow -> orange -> pink -> purple -> blue)
    const skyHeight = height * 0.55;
    
    // Bottom sky - warm golden yellow
    g.fill(0xFFD93D);
    g.rect(0, 0, width, skyHeight * 0.15);
    g.fill();
    
    // Orange band
    g.fill(0xFFB347);
    g.rect(0, skyHeight * 0.15, width, skyHeight * 0.15);
    g.fill();
    
    // Peach/coral transition
    g.fill(0xFFA07A);
    g.rect(0, skyHeight * 0.30, width, skyHeight * 0.15);
    g.fill();
    
    // Pink band
    g.fill(0xE88D9D);
    g.rect(0, skyHeight * 0.45, width, skyHeight * 0.15);
    g.fill();
    
    // Soft magenta/pink
    g.fill(0xD67BA0);
    g.rect(0, skyHeight * 0.60, width, skyHeight * 0.15);
    g.fill();
    
    // Purple transition
    g.fill(0xA56FA8);
    g.rect(0, skyHeight * 0.75, width, skyHeight * 0.15);
    g.fill();
    
    // Deeper purple/blue at top
    g.fill(0x7B68A6);
    g.rect(0, skyHeight * 0.90, width, skyHeight * 0.10 + 10);
    g.fill();
    
    // 2. SUN - Large glowing sun near horizon
    const sunX = 350;
    const sunY = skyHeight * 0.35;
    
    // Outer glow (very soft)
    g.fill({ color: 0xFFFFE0, alpha: 0.15 });
    g.circle(sunX, sunY, 150);
    g.fill();
    
    // Middle glow
    g.fill({ color: 0xFFF8DC, alpha: 0.25 });
    g.circle(sunX, sunY, 110);
    g.fill();
    
    // Inner glow
    g.fill({ color: 0xFFEFB5, alpha: 0.4 });
    g.circle(sunX, sunY, 80);
    g.fill();
    
    // Sun body (soft cream/yellow)
    g.fill(0xFFF8E7);
    g.circle(sunX, sunY, 55);
    g.fill();
    
    // Sun highlight
    g.fill({ color: 0xFFFFFF, alpha: 0.5 });
    g.circle(sunX - 15, sunY - 15, 25);
    g.fill();
    
    // 3. FLUFFY PAINTERLY CLOUDS
    const drawPuffyCloud = (cx: number, cy: number, scale: number = 1, warmth: number = 0) => {
      // Cloud colors range from white to pink/orange based on warmth
      const baseColor = warmth > 0.5 ? 0xFFE4D4 : 0xFFFFFF;
      const shadowColor = warmth > 0.5 ? 0xE8A890 : 0xD8C0D8;
      
      // Main cloud puffs
      g.fill({ color: baseColor, alpha: 0.95 });
      g.circle(cx, cy, 35 * scale);
      g.circle(cx + 30 * scale, cy - 10 * scale, 45 * scale);
      g.circle(cx + 65 * scale, cy - 5 * scale, 40 * scale);
      g.circle(cx + 95 * scale, cy + 5 * scale, 30 * scale);
      g.circle(cx + 15 * scale, cy + 10 * scale, 25 * scale);
      g.circle(cx + 50 * scale, cy + 8 * scale, 30 * scale);
      g.fill();
      
      // Cloud bottom shadow
      g.fill({ color: shadowColor, alpha: 0.5 });
      g.ellipse(cx + 45 * scale, cy + 25 * scale, 55 * scale, 15 * scale);
      g.fill();
      
      // Pink/orange highlights on sunny side
      g.fill({ color: 0xFFD4BE, alpha: 0.4 });
      g.circle(cx + 25 * scale, cy - 15 * scale, 20 * scale);
      g.circle(cx + 60 * scale, cy - 10 * scale, 18 * scale);
      g.fill();
    };
    
    // Distant small clouds (pink tinted near sun)
    drawPuffyCloud(150, skyHeight * 0.25, 0.5, 0.8);
    drawPuffyCloud(550, skyHeight * 0.15, 0.6, 0.7);
    
    // Main clouds
    for (let i = 0; i < width; i += 800) {
      const warmth = i < 800 ? 0.7 : 0.3;
      drawPuffyCloud(i + 200, skyHeight * 0.5 + (i % 50), 1.0, warmth);
    }
    
    // Clouds near horizon (more pink/orange)
    for (let i = 0; i < width; i += 600) {
      drawPuffyCloud(i + 400, skyHeight * 0.75, 0.7, 0.6);
    }
    
    // 4. OCEAN - Calm teal/turquoise water
    const oceanTop = skyHeight;
    
    // Ocean gradient (lighter at horizon, darker below)
    g.fill(0x5DADE2); // Light teal at horizon
    g.rect(0, oceanTop, width, 40);
    g.fill();
    
    g.fill(0x48A5C9);
    g.rect(0, oceanTop + 40, width, 40);
    g.fill();
    
    g.fill(0x3498B8);
    g.rect(0, oceanTop + 80, width, 50);
    g.fill();
    
    g.fill(0x2980A8);
    g.rect(0, oceanTop + 130, width, height - oceanTop - 130);
    g.fill();
    
    // Sun reflection on water
    g.fill({ color: 0xFFE4B5, alpha: 0.25 });
    g.ellipse(sunX, oceanTop + 20, 80, 15);
    g.fill();
    g.fill({ color: 0xFFD700, alpha: 0.15 });
    g.ellipse(sunX, oceanTop + 50, 60, 10);
    g.fill();
    
    // Gentle wave highlights (white foam lines)
    for (let layer = 0; layer < 4; layer++) {
      const waveY = oceanTop + 30 + layer * 35;
      g.fill({ color: 0xFFFFFF, alpha: 0.3 - layer * 0.05 });
      for (let x = 0; x < width + 80; x += 120) {
        const offset = layer * 30 + (x % 40);
        g.ellipse(x + offset, waveY, 50, 6);
      }
      g.fill();
    }
    
    // 5. DISTANT TROPICAL ISLAND with Palm Trees
    const drawTropicalIsland = (ix: number, iy: number, w: number, hasLargePalm: boolean = true) => {
      // Island base (lush green mound)
      const gradient1 = 0x3CB371; // Medium sea green
      const gradient2 = 0x228B22; // Forest green
      
      g.fill(gradient1);
      g.ellipse(ix, iy + 10, w / 2, 25);
      g.fill();
      
      g.fill(gradient2);
      g.ellipse(ix, iy, w / 2 - 10, 35);
      g.fill();
      
      // Highlight on island
      g.fill({ color: 0x90EE90, alpha: 0.5 });
      g.ellipse(ix - w / 6, iy - 15, 20, 15);
      g.fill();
      
      if (hasLargePalm) {
        // Palm tree trunk (curved)
        g.stroke({ color: 0x8B6914, width: 8 });
        g.moveTo(ix, iy - 20);
        g.quadraticCurveTo(ix + 15, iy - 50, ix + 5, iy - 80);
        g.stroke();
        
        // Trunk texture
        g.stroke({ color: 0x6B4F14, width: 2 });
        for (let t = 0; t < 5; t++) {
          const ty = iy - 25 - t * 12;
          g.moveTo(ix - 3 + t, ty);
          g.lineTo(ix + 7 + t, ty);
          g.stroke();
        }
        
        // Coconuts
        g.fill(0x8B4513);
        g.circle(ix + 3, iy - 75, 4);
        g.circle(ix + 8, iy - 73, 4);
        g.fill();
        
        // Palm fronds
        g.fill(0x228B22);
        const frondAngles = [-0.8, -0.4, 0, 0.4, 0.8, 1.2, -1.2];
        for (const angle of frondAngles) {
          const fx = ix + 5;
          const fy = iy - 80;
          g.moveTo(fx, fy);
          g.quadraticCurveTo(
            fx + Math.cos(angle - 0.3) * 25,
            fy + Math.sin(angle - 0.3) * 20 - 10,
            fx + Math.cos(angle) * 45,
            fy + Math.sin(angle) * 35
          );
          g.quadraticCurveTo(
            fx + Math.cos(angle + 0.3) * 25,
            fy + Math.sin(angle + 0.3) * 20 - 5,
            fx, fy
          );
          g.fill();
        }
        
        // Palm frond highlights
        g.fill({ color: 0x32CD32, alpha: 0.6 });
        for (let i = 0; i < 3; i++) {
          const angle = -0.4 + i * 0.4;
          const fx = ix + 5;
          const fy = iy - 80;
          g.ellipse(fx + Math.cos(angle) * 25, fy + Math.sin(angle) * 15 - 5, 10, 5);
        }
        g.fill();
      }
    };
    
    // Place islands at different distances
    drawTropicalIsland(700, oceanTop + 50, 100, true);
    drawTropicalIsland(1800, oceanTop + 60, 80, true);
    drawTropicalIsland(3200, oceanTop + 45, 120, true);
    drawTropicalIsland(4800, oceanTop + 55, 90, true);
    
    // 6. FLOATING WOODEN PLATFORMS/LOGS in water
    const drawFloatingLog = (lx: number, ly: number, logWidth: number) => {
      // Log shadow in water
      g.fill({ color: 0x1a5276, alpha: 0.4 });
      g.ellipse(lx, ly + 8, logWidth / 2 + 5, 8);
      g.fill();
      
      // Main log body
      g.fill(0x6B4423); // Rich brown
      g.roundRect(lx - logWidth / 2, ly - 6, logWidth, 14, 4);
      g.fill();
      
      // Log wood grain/texture
      g.stroke({ color: 0x5A3921, width: 1 });
      for (let i = 0; i < 3; i++) {
        g.moveTo(lx - logWidth / 2 + 10 + i * (logWidth / 4), ly - 4);
        g.lineTo(lx - logWidth / 2 + 15 + i * (logWidth / 4), ly + 5);
        g.stroke();
      }
      
      // Log highlight
      g.fill({ color: 0x8B5A2B, alpha: 0.6 });
      g.roundRect(lx - logWidth / 2 + 2, ly - 5, logWidth - 4, 5, 2);
      g.fill();
      
      // End rings
      g.fill(0x5A3921);
      g.ellipse(lx - logWidth / 2 + 2, ly, 4, 6);
      g.ellipse(lx + logWidth / 2 - 2, ly, 4, 6);
      g.fill();
    };
    
    // Scatter floating logs/platforms
    for (let i = 0; i < width; i += 400) {
      const logY = oceanTop + 100 + (i % 60);
      drawFloatingLog(i + 150, logY, 70 + (i % 30));
    }
    
    // 7. SEAGULL swimming in water
    const drawSeagull = (sx: number, sy: number) => {
      // Body reflection
      g.fill({ color: 0x2980A8, alpha: 0.3 });
      g.ellipse(sx, sy + 8, 15, 5);
      g.fill();
      
      // Body
      g.fill(0xFFFFFF);
      g.ellipse(sx, sy, 12, 7);
      g.fill();
      
      // Head
      g.fill(0xFFFFFF);
      g.circle(sx + 10, sy - 3, 5);
      g.fill();
      
      // Beak
      g.fill(0xFFA500);
      g.moveTo(sx + 15, sy - 3);
      g.lineTo(sx + 20, sy - 2);
      g.lineTo(sx + 15, sy - 1);
      g.closePath();
      g.fill();
      
      // Eye
      g.fill(0x000000);
      g.circle(sx + 11, sy - 4, 1);
      g.fill();
      
      // Wing
      g.fill(0xE8E8E8);
      g.ellipse(sx - 2, sy - 2, 8, 4);
      g.fill();
    };
    
    // Place seagulls swimming
    drawSeagull(500, oceanTop + 150);
    drawSeagull(1600, oceanTop + 130);
    drawSeagull(3000, oceanTop + 145);
    drawSeagull(4400, oceanTop + 135);
    
    // 8. SANDY BEACH - Warm tan foreground
    const sandY = height - 100;
    
    // Base sand color
    g.fill(0xDEB887); // Burlywood
    g.rect(0, sandY, width, 100);
    g.fill();
    
    // Sand dunes with gradient effect
    g.fill(0xD2B48C);
    for (let x = 0; x < width; x += 180) {
      g.ellipse(x + 90, sandY + 5, 100, 25);
    }
    g.fill();
    
    // Lighter sand highlights
    g.fill({ color: 0xF5DEB3, alpha: 0.7 });
    for (let x = 0; x < width; x += 220) {
      g.ellipse(x + 110, sandY + 15, 60, 15);
    }
    g.fill();
    
    // Darker sand shadows/wet sand near water
    g.fill({ color: 0xA0826D, alpha: 0.4 });
    g.rect(0, sandY, width, 15);
    g.fill();
    
    // Water edge foam
    g.fill({ color: 0xFFFFFF, alpha: 0.5 });
    for (let x = 0; x < width; x += 80) {
      g.ellipse(x + 40, sandY + 5, 35, 6);
    }
    g.fill();
    
    // Scattered seashells
    g.fill(0xFFF5EE);
    for (let x = 80; x < width; x += 250) {
      g.circle(x, sandY + 40 + (x % 25), 4);
      g.ellipse(x + 60, sandY + 35, 5, 3);
      g.circle(x + 120, sandY + 50, 3);
    }
    g.fill();
    
    // Small starfish
    g.fill(0xFA8072);
    for (let x = 200; x < width; x += 600) {
      const starX = x;
      const starY = sandY + 55;
      for (let i = 0; i < 5; i++) {
        const angle = (i / 5) * Math.PI * 2 - Math.PI / 2;
        g.moveTo(starX, starY);
        g.lineTo(starX + Math.cos(angle) * 8, starY + Math.sin(angle) * 8);
        g.lineTo(starX + Math.cos(angle + 0.3) * 4, starY + Math.sin(angle + 0.3) * 4);
        g.closePath();
      }
      g.fill();
    }
  }

  private drawSkullCaveBackground(g: PIXI.Graphics, level: LevelData) {
    const width = level.width;
    const height = level.height;

    // 1. Deep Cave Gradient
    const caveColors = [0x0d0d15, 0x151525, 0x1a1a30, 0x20203a];
    caveColors.forEach((color, i) => {
      g.fill(color);
      g.rect(0, (i / caveColors.length) * height, width, height / caveColors.length + 2);
      g.fill();
    });

    // 2. Rock Wall Texture with depth layers
    for (let layer = 0; layer < 3; layer++) {
      const layerAlpha = 0.2 + layer * 0.1;
      const baseColor = 0x2a2a4e + layer * 0x101010;
      
      // Cracks
      g.stroke({ color: baseColor, width: 2 - layer * 0.5, alpha: layerAlpha });
      for (let i = 0; i < 15; i++) {
        const cx = (Math.random() * width + layer * 50) % width;
        const cy = Math.random() * height;
        g.moveTo(cx, cy);
        const branches = 2 + Math.floor(Math.random() * 3);
        for (let b = 0; b < branches; b++) {
          g.lineTo(cx + (Math.random() - 0.5) * 50, cy + Math.random() * 40);
        }
        g.stroke();
      }
    }

    // 3. Stalactites with dripping water effect
    for (let i = 0; i < width; i += 80 + Math.random() * 60) {
      const h = 60 + Math.random() * 120;
      const baseWidth = 20 + Math.random() * 30;
      
      // Main stalactite
      g.fill(0x3a3a5e);
      g.moveTo(i, 0);
      g.lineTo(i + baseWidth / 2, h);
      g.lineTo(i + baseWidth, 0);
      g.closePath();
      g.fill();
      
      // Highlight edge
      g.stroke({ color: 0x4a4a6e, width: 2 });
      g.moveTo(i + baseWidth * 0.3, 0);
      g.lineTo(i + baseWidth / 2, h - 5);
      g.stroke();
      
      // Water droplet
      if (Math.random() > 0.6) {
        g.fill({ color: 0x4FC3F7, alpha: 0.6 });
        g.circle(i + baseWidth / 2, h + 5, 3);
        g.fill();
      }
    }

    // 4. Stalagmites with mineral deposits
    for (let i = 30; i < width; i += 100 + Math.random() * 60) {
      const h = 50 + Math.random() * 80;
      const baseWidth = 30 + Math.random() * 25;
      
      g.fill(0x2a2a45);
      g.moveTo(i, height);
      g.lineTo(i + baseWidth / 2, height - h);
      g.lineTo(i + baseWidth, height);
      g.closePath();
      g.fill();
      
      // Mineral streak
      g.stroke({ color: 0x8B4513, width: 2, alpha: 0.4 });
      g.moveTo(i + baseWidth * 0.4, height);
      g.lineTo(i + baseWidth * 0.5, height - h * 0.8);
      g.stroke();
    }
    
    // 5. Glowing Crystals with enhanced effects
    const crystalColors = [
      { main: 0x00ffff, glow: 0x00e5e5 },
      { main: 0xff00ff, glow: 0xe500e5 },
      { main: 0x00ff88, glow: 0x00e577 },
      { main: 0xff6600, glow: 0xe55c00 }
    ];
    
    for (let i = 0; i < 20; i++) {
      const cx = 100 + (i * (width - 200) / 20) + Math.random() * 50;
      const cy = 100 + Math.random() * (height - 200);
      const crystal = crystalColors[Math.floor(Math.random() * crystalColors.length)];
      const size = 10 + Math.random() * 15;
      
      // Outer glow
      g.fill({ color: crystal.glow, alpha: 0.15 });
      g.circle(cx, cy, size * 3);
      g.fill();
      
      // Inner glow
      g.fill({ color: crystal.main, alpha: 0.3 });
      g.circle(cx, cy, size * 1.5);
      g.fill();
      
      // Crystal shape
      g.fill({ color: crystal.main, alpha: 0.8 });
      g.moveTo(cx, cy - size);
      g.lineTo(cx + size * 0.6, cy);
      g.lineTo(cx, cy + size);
      g.lineTo(cx - size * 0.6, cy);
      g.closePath();
      g.fill();
      
      // Highlight
      g.fill({ color: 0xFFFFFF, alpha: 0.5 });
      g.moveTo(cx - size * 0.2, cy - size * 0.6);
      g.lineTo(cx + size * 0.1, cy - size * 0.2);
      g.lineTo(cx - size * 0.3, cy);
      g.closePath();
      g.fill();
    }

    // 6. Giant Skull carved into wall
    const skullX = width / 2;
    const skullY = height / 2 - 50;
    
    // Skull shadow/depth
    g.fill({ color: 0x101020, alpha: 0.4 });
    g.circle(skullX + 5, skullY + 5, 160);
    g.fill();
    
    // Skull outline
    g.fill({ color: 0x252540, alpha: 0.3 });
    g.circle(skullX, skullY, 150);
    g.fill();
    
    // Eye sockets (glowing ominously)
    g.fill({ color: 0xff0000, alpha: 0.3 });
    g.circle(skullX - 50, skullY - 20, 40);
    g.circle(skullX + 50, skullY - 20, 40);
    g.fill();
    g.fill({ color: 0xff3333, alpha: 0.15 });
    g.circle(skullX - 50, skullY - 20, 55);
    g.circle(skullX + 50, skullY - 20, 55);
    g.fill();
    
    // Nose cavity
    g.fill({ color: 0x151525, alpha: 0.5 });
    g.moveTo(skullX, skullY + 30);
    g.lineTo(skullX - 20, skullY + 60);
    g.lineTo(skullX + 20, skullY + 60);
    g.closePath();
    g.fill();
    
    // Teeth
    g.fill({ color: 0x353550, alpha: 0.4 });
    for (let t = -2; t <= 2; t++) {
      g.rect(skullX + t * 25 - 10, skullY + 80, 20, 40);
    }
    g.fill();

    // 7. Fog/mist at bottom
    for (let i = 0; i < 5; i++) {
      const fogAlpha = 0.1 - i * 0.015;
      g.fill({ color: 0x4a4a6a, alpha: fogAlpha });
      for (let x = 0; x < width; x += 80) {
        g.ellipse(x + 40, height - 30 - i * 15, 60, 25);
      }
      g.fill();
    }
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
