import * as PIXI from 'pixi.js';
import { GameState } from '../types';
import { PhysicsEngine } from './physics';

const SCALE = 100;

export class GameRenderer {
  private app: PIXI.Application;
  private playerSprites: Map<string, PIXI.Container>;
  // private entitySprites: Map<string, PIXI.Graphics>;
  private obstacleGraphics: PIXI.Graphics;

  constructor() {
    this.app = new PIXI.Application();
    this.playerSprites = new Map();
    // this.entitySprites = new Map();
    this.obstacleGraphics = new PIXI.Graphics();
  }

  public async initialize(element: HTMLElement) {
    await this.app.init({ 
        width: 800, 
        height: 600, 
        backgroundColor: 0x1099bb 
    });
    element.appendChild(this.app.canvas);
    
    this.app.stage.addChild(this.obstacleGraphics);
  }

  public drawMap(physics: PhysicsEngine) {
    this.obstacleGraphics.clear();
    this.obstacleGraphics.fill(0x654321); // Brown for ground/platforms
    
    const obstacles = physics.getObstacles();
    obstacles.forEach(obs => {
      this.obstacleGraphics.drawRect(
        obs.pos.x / SCALE,
        obs.pos.y / SCALE,
        obs.w / SCALE,
        obs.h / SCALE
      );
    });
    this.obstacleGraphics.endFill();
  }

  public render(state: GameState, _localPlayerId: string) {
    // Render Players
    state.players.forEach((player, id) => {
      let sprite = this.playerSprites.get(id);
      if (!sprite) {
        sprite = this.createPlayerSprite(player.color);
        this.playerSprites.set(id, sprite);
        this.app.stage.addChild(sprite);
      }

      // Update position (convert back from integer physics coords)
      // Set pivot to center for proper flipping
      if (sprite.pivot.x === 0 && sprite.pivot.y === 0) {
        sprite.pivot.set(player.width / 2, player.height / 2);
      }
      
      sprite.x = (player.position.x / SCALE) + (player.width / 2);
      sprite.y = (player.position.y / SCALE) + (player.height / 2);
      
      // Flip sprite based on facing direction
      sprite.scale.x = player.facingRight ? 1 : -1;
    });

    // Clean up disconnected players
    for (const [id, sprite] of this.playerSprites) {
      if (!state.players.has(id)) {
        this.app.stage.removeChild(sprite);
        this.playerSprites.delete(id);
      }
    }

    // Render Entities (future)
  }

  private createPlayerSprite(color: number): PIXI.Container {
    const container = new PIXI.Container();
    
    const body = new PIXI.Graphics();
    body.fill(color);
    body.drawRect(0, 0, 32, 32); // Standard size
    body.endFill();
    
    // Pirate Hat
    const hat = new PIXI.Graphics();
    hat.fill(0x000000);
    hat.moveTo(-5, 0);
    hat.lineTo(37, 0);
    hat.lineTo(16, -15);
    hat.lineTo(-5, 0);
    hat.endFill();
    hat.y = -5;

    container.addChild(body);
    container.addChild(hat);

    return container;
  }
}
