import * as PIXI from 'pixi.js';
import { getSoundManager, SoundEffect } from '../sound';

export interface NavalBattleState {
  playerShip: Ship;
  enemyShip: Ship;
  playerCannonballs: Cannonball[];
  enemyCannonballs: Cannonball[];
  waves: Wave[];
  clouds: Cloud[];
  explosions: Explosion[];
  frame: number;
  battleComplete: boolean;
  victory: boolean;
  levelName: string;
  isIntro: boolean;
}

interface Ship {
  x: number;
  y: number;
  health: number;
  maxHealth: number;
  velocity: { x: number; y: number };
  bobPhase: number;
  fireCooldown: number;
  sinking: boolean;
  sinkProgress: number;
}

interface Cannonball {
  x: number;
  y: number;
  vx: number;
  vy: number;
  active: boolean;
}

interface Wave {
  x: number;
  y: number;
  width: number;
  phase: number;
  speed: number;
}

interface Cloud {
  x: number;
  y: number;
  scale: number;
  speed: number;
}

interface Explosion {
  x: number;
  y: number;
  frame: number;
  maxFrames: number;
}

const SCREEN_WIDTH = 800;
const SCREEN_HEIGHT = 600;
const WATER_LINE = 380;
const PLAYER_SHIP_X = 150;
const ENEMY_SHIP_X = 650;

export class NavalBattle {
  private app: PIXI.Application;
  private container: PIXI.Container;
  private backgroundContainer: PIXI.Container;
  private shipsContainer: PIXI.Container;
  private projectilesContainer: PIXI.Container;
  private uiContainer: PIXI.Container;
  private effectsContainer: PIXI.Container;
  
  private state: NavalBattleState;
  private running = false;
  private onComplete: (() => void) | null = null;
  
  private keys = {
    up: false,
    down: false,
    fire: false
  };
  
  private handleKeyDown: (e: KeyboardEvent) => void;
  private handleKeyUp: (e: KeyboardEvent) => void;

  constructor(app: PIXI.Application) {
    this.app = app;
    this.container = new PIXI.Container();
    this.backgroundContainer = new PIXI.Container();
    this.shipsContainer = new PIXI.Container();
    this.projectilesContainer = new PIXI.Container();
    this.effectsContainer = new PIXI.Container();
    this.uiContainer = new PIXI.Container();
    
    this.container.addChild(this.backgroundContainer);
    this.container.addChild(this.shipsContainer);
    this.container.addChild(this.projectilesContainer);
    this.container.addChild(this.effectsContainer);
    this.container.addChild(this.uiContainer);
    
    this.state = this.createInitialState('', false);
    
    this.handleKeyDown = (e: KeyboardEvent) => this.onKeyDown(e);
    this.handleKeyUp = (e: KeyboardEvent) => this.onKeyUp(e);
  }

  private createInitialState(levelName: string, isIntro: boolean): NavalBattleState {
    return {
      playerShip: {
        x: PLAYER_SHIP_X,
        y: WATER_LINE,
        health: 5,
        maxHealth: 5,
        velocity: { x: 0, y: 0 },
        bobPhase: 0,
        fireCooldown: 0,
        sinking: false,
        sinkProgress: 0
      },
      enemyShip: {
        x: ENEMY_SHIP_X,
        y: WATER_LINE,
        health: 3,
        maxHealth: 3,
        velocity: { x: 0, y: 0 },
        bobPhase: Math.PI,
        fireCooldown: 60,
        sinking: false,
        sinkProgress: 0
      },
      playerCannonballs: [],
      enemyCannonballs: [],
      waves: this.createWaves(),
      clouds: this.createClouds(),
      explosions: [],
      frame: 0,
      battleComplete: false,
      victory: false,
      levelName,
      isIntro
    };
  }

  private createWaves(): Wave[] {
    const waves: Wave[] = [];
    for (let i = 0; i < 8; i++) {
      waves.push({
        x: i * 120 - 50,
        y: WATER_LINE + 20 + (i % 3) * 15,
        width: 140 + Math.random() * 40,
        phase: Math.random() * Math.PI * 2,
        speed: 0.02 + Math.random() * 0.02
      });
    }
    return waves;
  }

  private createClouds(): Cloud[] {
    const clouds: Cloud[] = [];
    for (let i = 0; i < 5; i++) {
      clouds.push({
        x: i * 200 + Math.random() * 100,
        y: 50 + Math.random() * 80,
        scale: 0.6 + Math.random() * 0.6,
        speed: 0.2 + Math.random() * 0.3
      });
    }
    return clouds;
  }

  public async start(levelName: string, isIntro: boolean, onComplete: () => void) {
    this.state = this.createInitialState(levelName, isIntro);
    this.onComplete = onComplete;
    this.running = true;
    
    // Add to stage
    this.app.stage.addChild(this.container);
    
    // Set up input
    window.addEventListener('keydown', this.handleKeyDown);
    window.addEventListener('keyup', this.handleKeyUp);
    
    // Draw initial scene
    this.drawBackground();
    this.drawUI();
    
    // Start game loop
    this.loop();
  }

  public stop() {
    this.running = false;
    window.removeEventListener('keydown', this.handleKeyDown);
    window.removeEventListener('keyup', this.handleKeyUp);
    
    // Clean up - only remove children from child containers, NOT from main container
    // Removing children from main container would disconnect the child containers entirely
    this.backgroundContainer.removeChildren();
    this.shipsContainer.removeChildren();
    this.projectilesContainer.removeChildren();
    this.effectsContainer.removeChildren();
    this.uiContainer.removeChildren();
    
    if (this.container.parent) {
      this.container.parent.removeChild(this.container);
    }
  }

  private onKeyDown(e: KeyboardEvent) {
    switch (e.code) {
      case 'ArrowUp': case 'KeyW': this.keys.up = true; e.preventDefault(); break;
      case 'ArrowDown': case 'KeyS': this.keys.down = true; break;
      case 'Space': case 'KeyZ': case 'KeyE': 
        this.keys.fire = true; 
        e.preventDefault(); 
        break;
    }
  }

  private onKeyUp(e: KeyboardEvent) {
    switch (e.code) {
      case 'ArrowUp': case 'KeyW': this.keys.up = false; break;
      case 'ArrowDown': case 'KeyS': this.keys.down = false; break;
      case 'Space': case 'KeyZ': case 'KeyE': this.keys.fire = false; break;
    }
  }

  private loop() {
    if (!this.running) return;
    
    this.update();
    this.render();
    
    requestAnimationFrame(() => this.loop());
  }

  private update() {
    this.state.frame++;
    
    // Update player movement
    if (!this.state.playerShip.sinking) {
      if (this.keys.up) {
        this.state.playerShip.velocity.y = Math.max(this.state.playerShip.velocity.y - 0.5, -4);
      } else if (this.keys.down) {
        this.state.playerShip.velocity.y = Math.min(this.state.playerShip.velocity.y + 0.5, 4);
      } else {
        this.state.playerShip.velocity.y *= 0.9;
      }
      
      this.state.playerShip.y += this.state.playerShip.velocity.y;
      this.state.playerShip.y = Math.max(WATER_LINE - 60, Math.min(WATER_LINE + 60, this.state.playerShip.y));
      
      // Player firing - broadside takes time to reload
      if (this.keys.fire && this.state.playerShip.fireCooldown <= 0) {
        this.firePlayerCannon();
        this.state.playerShip.fireCooldown = 60;  // Longer cooldown for broadside
      }
    }
    
    // Update cooldowns
    if (this.state.playerShip.fireCooldown > 0) this.state.playerShip.fireCooldown--;
    if (this.state.enemyShip.fireCooldown > 0) this.state.enemyShip.fireCooldown--;
    
    // Update ship bobbing
    this.state.playerShip.bobPhase += 0.03;
    this.state.enemyShip.bobPhase += 0.025;
    
    // Enemy AI
    if (!this.state.enemyShip.sinking) {
      this.updateEnemyAI();
    }
    
    // Update cannonballs
    this.updateCannonballs();
    
    // Update waves
    this.updateWaves();
    
    // Update clouds
    this.updateClouds();
    
    // Update explosions
    this.updateExplosions();
    
    // Update sinking ships
    this.updateSinking();
    
    // Check battle completion
    this.checkBattleEnd();
  }

  private firePlayerCannon() {
    const ship = this.state.playerShip;
    const bobY = Math.sin(ship.bobPhase) * 4;
    
    // Play cannon fire sound
    getSoundManager().playSound(SoundEffect.CANNON_FIRE);
    
    // Fire a broadside from the cannon positions on the ship's side
    const cannonOffsets = [-40, -18, 4, 26];  // Match cannon port positions
    for (const offset of cannonOffsets) {
      this.state.playerCannonballs.push({
        x: ship.x + offset,
        y: ship.y + bobY - 3,
        vx: 8 + Math.random() * 2,  // Fire toward enemy (right)
        vy: -1 - Math.random() * 0.5,
        active: true
      });
    }
    
    // Add smoke effect (stored as explosion with special handling)
    this.addCannonSmoke(ship.x - 10, ship.y + bobY - 5);
  }

  private addCannonSmoke(x: number, y: number) {
    // Multiple smoke puffs
    for (let i = 0; i < 3; i++) {
      this.state.explosions.push({
        x: x + Math.random() * 40,
        y: y + Math.random() * 10 - 5,
        frame: 0,
        maxFrames: 25
      });
    }
  }

  private updateEnemyAI() {
    const enemy = this.state.enemyShip;
    
    // Independent patrol pattern - sine wave movement, NOT tracking player
    // This creates natural opportunities to hit each other
    const patrolSpeed = 0.015;
    const patrolRange = 50;
    
    // Use frame count for smooth, predictable movement
    const targetY = WATER_LINE + Math.sin(this.state.frame * patrolSpeed) * patrolRange;
    
    // Smooth movement toward target
    const diff = targetY - enemy.y;
    enemy.velocity.y = diff * 0.05;
    enemy.y += enemy.velocity.y;
    enemy.y = Math.max(WATER_LINE - 60, Math.min(WATER_LINE + 60, enemy.y));
    
    // Fire at player - more aggressive firing
    if (enemy.fireCooldown <= 0) {
      this.fireEnemyCannon();
      enemy.fireCooldown = 70 + Math.random() * 50;  // Faster firing
    }
  }

  private fireEnemyCannon() {
    const ship = this.state.enemyShip;
    const bobY = Math.sin(ship.bobPhase) * 4;
    
    // Play cannon fire sound
    getSoundManager().playSound(SoundEffect.CANNON_FIRE);
    
    // Enemy fires from their port side (facing player)
    const cannonOffsets = [40, 18, -4, -26];  // Mirrored positions
    // Fire 2-3 cannons at a time
    const numCannons = 2 + Math.floor(Math.random() * 2);
    const shuffled = cannonOffsets.sort(() => Math.random() - 0.5).slice(0, numCannons);
    
    for (const offset of shuffled) {
      this.state.enemyCannonballs.push({
        x: ship.x + offset,
        y: ship.y + bobY - 3,
        vx: -7 - Math.random() * 2,  // Fire toward player (left)
        vy: -0.8 - Math.random() * 0.5,
        active: true
      });
    }
    
    // Add smoke
    this.addCannonSmoke(ship.x + 10, ship.y + bobY - 5);
  }

  private updateCannonballs() {
    const gravity = 0.15;
    
    // Update player cannonballs
    for (const ball of this.state.playerCannonballs) {
      if (!ball.active) continue;
      
      ball.x += ball.vx;
      ball.vy += gravity;
      ball.y += ball.vy;
      
      // Check hit on enemy ship
      if (!this.state.enemyShip.sinking && this.checkShipHit(ball, this.state.enemyShip)) {
        ball.active = false;
        this.state.enemyShip.health--;
        this.addExplosion(ball.x, ball.y);
        
        if (this.state.enemyShip.health <= 0) {
          this.state.enemyShip.sinking = true;
        }
      }
      
      // Off screen or in water
      if (ball.x > SCREEN_WIDTH + 50 || ball.y > WATER_LINE + 50) {
        ball.active = false;
        if (ball.y > WATER_LINE) {
          this.addSplash(ball.x, WATER_LINE + 20);
        }
      }
    }
    
    // Update enemy cannonballs
    for (const ball of this.state.enemyCannonballs) {
      if (!ball.active) continue;
      
      ball.x += ball.vx;
      ball.vy += gravity;
      ball.y += ball.vy;
      
      // Check hit on player ship
      if (!this.state.playerShip.sinking && this.checkShipHit(ball, this.state.playerShip)) {
        ball.active = false;
        this.state.playerShip.health--;
        this.addExplosion(ball.x, ball.y);
        
        if (this.state.playerShip.health <= 0) {
          this.state.playerShip.sinking = true;
        }
      }
      
      // Off screen or in water
      if (ball.x < -50 || ball.y > WATER_LINE + 50) {
        ball.active = false;
        if (ball.y > WATER_LINE) {
          this.addSplash(ball.x, WATER_LINE + 20);
        }
      }
    }
    
    // Clean up inactive cannonballs
    this.state.playerCannonballs = this.state.playerCannonballs.filter(b => b.active);
    this.state.enemyCannonballs = this.state.enemyCannonballs.filter(b => b.active);
  }

  private checkShipHit(ball: Cannonball, ship: Ship): boolean {
    // Ship hitbox - hull and lower sails area
    const shipWidth = 160;
    const shipHeight = 100;
    const shipY = ship.y + Math.sin(ship.bobPhase) * 4;
    
    return ball.x > ship.x - shipWidth/2 && 
           ball.x < ship.x + shipWidth/2 &&
           ball.y > shipY - shipHeight && 
           ball.y < shipY + 25;
  }

  private addExplosion(x: number, y: number) {
    this.state.explosions.push({
      x,
      y,
      frame: 0,
      maxFrames: 30
    });
  }

  private addSplash(x: number, y: number) {
    this.state.explosions.push({
      x,
      y,
      frame: 0,
      maxFrames: 20
    });
  }

  private updateWaves() {
    for (const wave of this.state.waves) {
      wave.phase += wave.speed;
      wave.x -= 0.5;
      if (wave.x + wave.width < 0) {
        wave.x = SCREEN_WIDTH;
      }
    }
  }

  private updateClouds() {
    for (const cloud of this.state.clouds) {
      cloud.x -= cloud.speed;
      if (cloud.x + 100 < 0) {
        cloud.x = SCREEN_WIDTH + 50;
        cloud.y = 50 + Math.random() * 80;
      }
    }
  }

  private updateExplosions() {
    for (const exp of this.state.explosions) {
      exp.frame++;
    }
    this.state.explosions = this.state.explosions.filter(e => e.frame < e.maxFrames);
  }

  private updateSinking() {
    if (this.state.playerShip.sinking) {
      this.state.playerShip.sinkProgress += 0.01;
      this.state.playerShip.y += 0.5;
    }
    if (this.state.enemyShip.sinking) {
      this.state.enemyShip.sinkProgress += 0.01;
      this.state.enemyShip.y += 0.5;
    }
  }

  private checkBattleEnd() {
    if (this.state.battleComplete) return;
    
    // Victory - enemy sunk
    if (this.state.enemyShip.sinking && this.state.enemyShip.sinkProgress > 0.5) {
      this.state.battleComplete = true;
      this.state.victory = true;
      this.showVictory();
    }
    
    // Defeat - player sunk
    if (this.state.playerShip.sinking && this.state.playerShip.sinkProgress > 0.5) {
      this.state.battleComplete = true;
      this.state.victory = false;
      // For the game, we'll still proceed but maybe show a different message
      this.showDefeat();
    }
  }

  private showVictory() {
    setTimeout(() => {
      if (this.onComplete) {
        this.stop();
        this.onComplete();
      }
    }, 2000);
  }

  private showDefeat() {
    // Even on defeat, proceed to the level (player can retry)
    setTimeout(() => {
      if (this.onComplete) {
        this.stop();
        this.onComplete();
      }
    }, 2000);
  }

  private drawBackground() {
    this.backgroundContainer.removeChildren();
    const g = new PIXI.Graphics();
    
    // Sky gradient (simulated)
    g.fill(0x1a3a52);
    g.rect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);
    g.fill();
    
    // Gradient overlay
    g.fill(0x87CEEB);
    g.rect(0, 0, SCREEN_WIDTH, 200);
    g.fill();
    
    g.fill({ color: 0x4a7a9a, alpha: 0.5 });
    g.rect(0, 150, SCREEN_WIDTH, 100);
    g.fill();
    
    // Sun
    g.fill(0xFFD700);
    g.circle(650, 80, 40);
    g.fill();
    g.fill({ color: 0xFFD700, alpha: 0.3 });
    g.circle(650, 80, 60);
    g.fill();
    
    // Ocean
    g.fill(0x1a5276);
    g.rect(0, WATER_LINE, SCREEN_WIDTH, SCREEN_HEIGHT - WATER_LINE);
    g.fill();
    
    // Darker water at bottom
    g.fill(0x0d3d56);
    g.rect(0, WATER_LINE + 80, SCREEN_WIDTH, SCREEN_HEIGHT - WATER_LINE - 80);
    g.fill();
    
    this.backgroundContainer.addChild(g);
  }

  private drawUI() {
    this.uiContainer.removeChildren();
    
    // Title / Level name
    const titleText = new PIXI.Text({
      text: this.state.isIntro ? '⚔️ NAVAL BATTLE ⚔️' : `Approaching: ${this.state.levelName}`,
      style: {
        fontFamily: 'Arial',
        fontSize: 28,
        fill: 0xFFD700,
        stroke: { color: 0x000000, width: 4 },
        align: 'center'
      }
    });
    titleText.anchor.set(0.5, 0);
    titleText.x = SCREEN_WIDTH / 2;
    titleText.y = 15;
    this.uiContainer.addChild(titleText);
    
    // Instructions
    const instructText = new PIXI.Text({
      text: '↑↓ Move Ship  •  SPACE Fire Cannons',
      style: {
        fontFamily: 'Arial',
        fontSize: 16,
        fill: 0x87CEEB,
        stroke: { color: 0x000000, width: 2 }
      }
    });
    instructText.anchor.set(0.5, 0);
    instructText.x = SCREEN_WIDTH / 2;
    instructText.y = SCREEN_HEIGHT - 30;
    this.uiContainer.addChild(instructText);
  }

  private render() {
    // Clear dynamic containers
    this.shipsContainer.removeChildren();
    this.projectilesContainer.removeChildren();
    this.effectsContainer.removeChildren();
    
    // Draw clouds
    this.drawClouds();
    
    // Draw waves (behind ships)
    this.drawWaves(true);
    
    // Draw ships
    this.drawShip(this.state.playerShip, true);
    this.drawShip(this.state.enemyShip, false);
    
    // Draw waves (in front of ships)
    this.drawWaves(false);
    
    // Draw cannonballs
    this.drawCannonballs();
    
    // Draw explosions
    this.drawExplosions();
    
    // Draw health bars
    this.drawHealthBars();
    
    // Draw victory/defeat text
    if (this.state.battleComplete) {
      this.drawEndText();
    }
  }

  private drawClouds() {
    for (const cloud of this.state.clouds) {
      const g = new PIXI.Graphics();
      g.fill({ color: 0xFFFFFF, alpha: 0.8 });
      g.circle(cloud.x, cloud.y, 25 * cloud.scale);
      g.circle(cloud.x + 20 * cloud.scale, cloud.y - 10 * cloud.scale, 30 * cloud.scale);
      g.circle(cloud.x + 45 * cloud.scale, cloud.y, 25 * cloud.scale);
      g.fill();
      this.backgroundContainer.addChild(g);
    }
  }

  private drawWaves(behind: boolean) {
    const targetY = behind ? WATER_LINE + 30 : WATER_LINE + 10;
    for (const wave of this.state.waves) {
      if ((behind && wave.y > WATER_LINE + 25) || (!behind && wave.y <= WATER_LINE + 25)) {
        const g = new PIXI.Graphics();
        const waveY = wave.y + Math.sin(wave.phase) * 5;
        
        g.fill({ color: behind ? 0x1a5276 : 0x2980b9, alpha: behind ? 0.6 : 0.8 });
        g.ellipse(wave.x + wave.width/2, waveY, wave.width/2, 15);
        g.fill();
        
        // White cap
        g.fill({ color: 0xFFFFFF, alpha: 0.4 });
        g.ellipse(wave.x + wave.width/2 + 10, waveY - 8, wave.width/4, 6);
        g.fill();
        
        if (behind) {
          this.backgroundContainer.addChild(g);
        } else {
          this.effectsContainer.addChild(g);
        }
      }
    }
  }

  private drawShip(ship: Ship, isPlayer: boolean) {
    const g = new PIXI.Graphics();
    const bobY = Math.sin(ship.bobPhase) * 4;
    const tilt = Math.sin(ship.bobPhase) * 0.02;
    const sinkOffset = ship.sinking ? ship.sinkProgress * 120 : 0;
    
    g.x = ship.x;
    g.y = ship.y + bobY + sinkOffset;
    g.rotation = tilt + (ship.sinking ? ship.sinkProgress * 0.3 * (isPlayer ? 1 : -1) : 0);
    g.alpha = ship.sinking ? 1 - ship.sinkProgress * 0.6 : 1;
    
    // Flip enemy ship to face the player
    const dir = isPlayer ? 1 : -1;
    
    const hullColor = isPlayer ? 0x8B4513 : 0x3d1f1f;
    const hullLight = isPlayer ? 0xa0522d : 0x5a2a2a;
    const trimColor = isPlayer ? 0xDAA520 : 0x8B0000;
    
    // === HULL - Classic galleon side profile ===
    g.fill(hullColor);
    // Main hull shape
    g.moveTo(-70 * dir, 0);           // Stern at waterline
    g.lineTo(-75 * dir, -15);         // Stern rise
    g.lineTo(-65 * dir, -25);         // Stern cabin bottom
    g.lineTo(-55 * dir, -30);         // Stern cabin top
    g.lineTo(40 * dir, -25);          // Deck line to bow
    g.lineTo(70 * dir, -15);          // Bow rise
    g.lineTo(85 * dir, 5);            // Bowsprit area
    g.lineTo(75 * dir, 15);           // Bow bottom
    g.lineTo(-60 * dir, 20);          // Keel
    g.lineTo(-70 * dir, 10);          // Stern bottom
    g.closePath();
    g.fill();
    
    // Hull highlight (upper section)
    g.fill(hullLight);
    g.moveTo(-65 * dir, -20);
    g.lineTo(-55 * dir, -28);
    g.lineTo(45 * dir, -23);
    g.lineTo(65 * dir, -12);
    g.lineTo(40 * dir, -8);
    g.lineTo(-60 * dir, -8);
    g.closePath();
    g.fill();
    
    // Gun deck band
    g.fill(trimColor);
    g.rect(-55 * dir, -8, 100 * dir, 6);
    g.fill();
    
    // Cannon ports
    g.fill(0x1a1a1a);
    for (let i = 0; i < 4; i++) {
      const portX = (-40 + i * 22) * dir;
      g.rect(portX - 4, -6, 8, 5);
    }
    g.fill();
    
    // Cannons poking out (pointing at enemy)
    g.fill(0x2a2a2a);
    for (let i = 0; i < 4; i++) {
      const cannonX = (-40 + i * 22) * dir;
      // Draw cannon barrel extending outward from the ship
      g.circle(cannonX, -3, 3);
    }
    g.fill();
    
    // Waterline stripe
    g.fill(isPlayer ? 0x654321 : 0x2a1515);
    g.moveTo(-65 * dir, 8);
    g.lineTo(70 * dir, 8);
    g.lineTo(75 * dir, 15);
    g.lineTo(-60 * dir, 18);
    g.closePath();
    g.fill();
    
    // === STERN CABIN ===
    g.fill(hullLight);
    g.rect(-65 * dir, -45, 20 * dir, 20);
    g.fill();
    // Windows
    g.fill(0x87CEEB);
    g.rect(-60 * dir, -40, 5 * dir, 6);
    g.rect(-52 * dir, -40, 5 * dir, 6);
    g.fill();
    // Stern decoration
    g.fill(trimColor);
    g.rect(-66 * dir, -46, 22 * dir, 3);
    g.fill();
    
    // === MASTS ===
    g.fill(0x5d4037);
    // Main mast
    g.rect(-3, -120, 6, 100);
    // Fore mast
    g.rect(30 * dir - 2, -90, 5, 75);
    // Mizzen mast (rear)
    g.rect(-40 * dir - 2, -80, 4, 55);
    g.fill();
    
    // === SAILS ===
    const sailColor = isPlayer ? 0xFFF8DC : 0x1a1a1a;
    const sailShade = isPlayer ? 0xF5DEB3 : 0x0d0d0d;
    
    // Main sail (large square sail)
    g.fill(sailColor);
    g.moveTo(-25, -115);
    g.quadraticCurveTo(0, -100, 25, -115);
    g.lineTo(28, -45);
    g.quadraticCurveTo(0, -35, -28, -45);
    g.closePath();
    g.fill();
    // Sail shading
    g.fill(sailShade);
    g.moveTo(-25, -115);
    g.quadraticCurveTo(-10, -100, -10, -45);
    g.lineTo(-28, -45);
    g.quadraticCurveTo(-15, -50, -25, -115);
    g.fill();
    
    // Fore sail
    g.fill(sailColor);
    g.moveTo(15 * dir, -85);
    g.quadraticCurveTo(35 * dir, -75, 50 * dir, -85);
    g.lineTo(52 * dir, -30);
    g.quadraticCurveTo(35 * dir, -22, 13 * dir, -30);
    g.closePath();
    g.fill();
    
    // Mizzen sail (rear, smaller)
    g.fill(sailColor);
    g.moveTo(-30 * dir, -75);
    g.quadraticCurveTo(-42 * dir, -68, -52 * dir, -75);
    g.lineTo(-52 * dir, -35);
    g.quadraticCurveTo(-42 * dir, -30, -30 * dir, -35);
    g.closePath();
    g.fill();
    
    // Sail emblems
    if (isPlayer) {
      // Crown/anchor on main sail
      g.fill(0x1a3a52);
      g.circle(0, -75, 12);
      g.fill();
      g.fill(trimColor);
      g.circle(0, -75, 8);
      g.fill();
    } else {
      // Skull on black sail
      g.fill(0xFFFFFF);
      g.circle(0, -75, 10);
      g.fill();
      g.fill(0x1a1a1a);
      g.circle(-3, -77, 2.5);
      g.circle(3, -77, 2.5);
      g.fill();
      g.stroke({ color: 0xFFFFFF, width: 2 });
      g.moveTo(-10, -65);
      g.lineTo(10, -85);
      g.moveTo(10, -65);
      g.lineTo(-10, -85);
      g.stroke();
    }
    
    // Sail rigging lines
    g.stroke({ color: 0x3d3d3d, width: 1 });
    g.moveTo(-25, -115);
    g.lineTo(0, -120);
    g.lineTo(25, -115);
    g.moveTo(-28, -45);
    g.lineTo(0, -20);
    g.lineTo(28, -45);
    g.stroke();
    
    // === FLAGS ===
    const flagColor = isPlayer ? 0x2e86de : 0x000000;
    g.fill(flagColor);
    // Main mast flag
    g.moveTo(3, -120);
    g.lineTo(25 * dir, -115);
    g.lineTo(3, -108);
    g.closePath();
    g.fill();
    
    // Jolly Roger on enemy flag
    if (!isPlayer) {
      g.fill(0xFFFFFF);
      g.circle(14 * dir, -114, 3);
      g.fill();
    }
    
    // === BOWSPRIT ===
    g.fill(0x5d4037);
    g.moveTo(65 * dir, -12);
    g.lineTo(95 * dir, -25);
    g.lineTo(97 * dir, -22);
    g.lineTo(68 * dir, -8);
    g.closePath();
    g.fill();
    
    // Jib sail (triangular sail at front)
    g.fill({ color: sailColor, alpha: 0.9 });
    g.moveTo(32 * dir, -88);
    g.lineTo(90 * dir, -22);
    g.lineTo(32 * dir, -25);
    g.closePath();
    g.fill();
    
    // === CROW'S NEST ===
    g.fill(0x4a3728);
    g.rect(-6, -105, 12, 6);
    g.fill();
    
    // Railing
    g.stroke({ color: 0x5d4037, width: 1 });
    g.moveTo(-55 * dir, -25);
    g.lineTo(55 * dir, -20);
    g.stroke();
    
    this.shipsContainer.addChild(g);
  }

  private drawCannonballs() {
    // Player cannonballs
    for (const ball of this.state.playerCannonballs) {
      if (!ball.active) continue;
      const g = new PIXI.Graphics();
      g.fill(0x1a1a1a);
      g.circle(ball.x, ball.y, 6);
      g.fill();
      // Trail
      g.fill({ color: 0x666666, alpha: 0.5 });
      g.circle(ball.x - 8, ball.y + 2, 4);
      g.circle(ball.x - 14, ball.y + 4, 3);
      g.fill();
      this.projectilesContainer.addChild(g);
    }
    
    // Enemy cannonballs
    for (const ball of this.state.enemyCannonballs) {
      if (!ball.active) continue;
      const g = new PIXI.Graphics();
      g.fill(0x8B0000);
      g.circle(ball.x, ball.y, 6);
      g.fill();
      // Trail
      g.fill({ color: 0x660000, alpha: 0.5 });
      g.circle(ball.x + 8, ball.y + 2, 4);
      g.circle(ball.x + 14, ball.y + 4, 3);
      g.fill();
      this.projectilesContainer.addChild(g);
    }
  }

  private drawExplosions() {
    for (const exp of this.state.explosions) {
      const progress = exp.frame / exp.maxFrames;
      const g = new PIXI.Graphics();
      
      if (exp.y < WATER_LINE - 50) {
        // Cannon smoke (high up, near ship)
        const size = 12 + progress * 25;
        g.fill({ color: 0xC0C0C0, alpha: (1 - progress) * 0.6 });
        g.circle(exp.x - progress * 20, exp.y - progress * 15, size);
        g.fill();
        g.fill({ color: 0xE0E0E0, alpha: (1 - progress) * 0.4 });
        g.circle(exp.x - progress * 15, exp.y - progress * 20, size * 0.7);
        g.fill();
      } else if (exp.y < WATER_LINE + 10) {
        // Fire explosion (ship hit)
        const size = 25 + progress * 35;
        g.fill({ color: 0xFF4500, alpha: 1 - progress });
        g.circle(exp.x, exp.y, size);
        g.fill();
        g.fill({ color: 0xFFD700, alpha: (1 - progress) * 0.8 });
        g.circle(exp.x, exp.y, size * 0.6);
        g.fill();
        g.fill({ color: 0xFFFFFF, alpha: (1 - progress) * 0.6 });
        g.circle(exp.x, exp.y, size * 0.3);
        g.fill();
        // Sparks
        g.fill({ color: 0xFF6600, alpha: (1 - progress) * 0.8 });
        for (let i = 0; i < 5; i++) {
          const angle = (i / 5) * Math.PI * 2 + progress * 2;
          const dist = size * 0.8 + progress * 20;
          g.circle(exp.x + Math.cos(angle) * dist, exp.y + Math.sin(angle) * dist, 3);
        }
        g.fill();
      } else {
        // Water splash
        const splashHeight = 35 * (1 - progress);
        g.fill({ color: 0x87CEEB, alpha: 1 - progress });
        for (let i = -2; i <= 2; i++) {
          g.ellipse(exp.x + i * 10, exp.y - splashHeight * (1 - Math.abs(i) * 0.2), 7, splashHeight * 0.5);
        }
        g.fill();
        // White foam
        g.fill({ color: 0xFFFFFF, alpha: (1 - progress) * 0.6 });
        g.ellipse(exp.x, exp.y - splashHeight * 0.3, 15, 5);
        g.fill();
      }
      
      this.effectsContainer.addChild(g);
    }
  }

  private drawHealthBars() {
    // Player health
    const playerHealth = new PIXI.Graphics();
    playerHealth.fill(0x333333);
    playerHealth.rect(20, 50, 104, 14);
    playerHealth.fill();
    playerHealth.fill(0x27ae60);
    const playerHealthWidth = (this.state.playerShip.health / this.state.playerShip.maxHealth) * 100;
    playerHealth.rect(22, 52, playerHealthWidth, 10);
    playerHealth.fill();
    this.uiContainer.addChild(playerHealth);
    
    const playerLabel = new PIXI.Text({
      text: 'YOUR SHIP',
      style: { fontFamily: 'Arial', fontSize: 12, fill: 0xFFFFFF }
    });
    playerLabel.x = 22;
    playerLabel.y = 66;
    this.uiContainer.addChild(playerLabel);
    
    // Enemy health
    const enemyHealth = new PIXI.Graphics();
    enemyHealth.fill(0x333333);
    enemyHealth.rect(SCREEN_WIDTH - 124, 50, 104, 14);
    enemyHealth.fill();
    enemyHealth.fill(0xc0392b);
    const enemyHealthWidth = (this.state.enemyShip.health / this.state.enemyShip.maxHealth) * 100;
    enemyHealth.rect(SCREEN_WIDTH - 122, 52, enemyHealthWidth, 10);
    enemyHealth.fill();
    this.uiContainer.addChild(enemyHealth);
    
    const enemyLabel = new PIXI.Text({
      text: 'ENEMY SHIP',
      style: { fontFamily: 'Arial', fontSize: 12, fill: 0xFFFFFF }
    });
    enemyLabel.x = SCREEN_WIDTH - 122;
    enemyLabel.y = 66;
    this.uiContainer.addChild(enemyLabel);
  }

  private drawEndText() {
    const text = this.state.victory ? '⚔️ VICTORY! ⚔️' : '💀 SHIP SUNK! 💀';
    const color = this.state.victory ? 0xFFD700 : 0xFF4500;
    
    const endText = new PIXI.Text({
      text,
      style: {
        fontFamily: 'Arial',
        fontSize: 48,
        fill: color,
        stroke: { color: 0x000000, width: 6 },
        align: 'center'
      }
    });
    endText.anchor.set(0.5);
    endText.x = SCREEN_WIDTH / 2;
    endText.y = SCREEN_HEIGHT / 2;
    this.uiContainer.addChild(endText);
    
    const subText = new PIXI.Text({
      text: 'Proceeding to level...',
      style: {
        fontFamily: 'Arial',
        fontSize: 20,
        fill: 0xFFFFFF,
        stroke: { color: 0x000000, width: 3 }
      }
    });
    subText.anchor.set(0.5);
    subText.x = SCREEN_WIDTH / 2;
    subText.y = SCREEN_HEIGHT / 2 + 50;
    this.uiContainer.addChild(subText);
  }
}
