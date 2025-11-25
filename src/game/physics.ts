import SAT from 'sat';
import { GameState, PlayerState, Input, Entity } from '../types';

// Constants for integer-based physics (x100)
const SCALE = 100;
const GRAVITY = 0.5 * SCALE;
const JUMP_FORCE = -12 * SCALE;
const MOVE_SPEED = 5 * SCALE;
const MAX_FALL_SPEED = 15 * SCALE;
const FRICTION = 0.8;
// const AIR_RESISTANCE = 0.9;

// Swimming constants
// const WATER_GRAVITY = 0.1 * SCALE;
// const SWIM_FORCE = -3 * SCALE;
// const WATER_DRAG = 0.9;

// Jump mechanics
// const COYOTE_TIME = 5; // frames
// const JUMP_BUFFER = 5; // frames

export class PhysicsEngine {
  private obstacles: SAT.Box[];

  constructor() {
    this.obstacles = [];
    // Initialize some static map obstacles for now
    this.createMap();
  }

  private createMap() {
    // Create a floor
    this.obstacles.push(new SAT.Box(new SAT.Vector(0, 500 * SCALE), 800 * SCALE, 100 * SCALE));
    
    // Create some platforms
    this.obstacles.push(new SAT.Box(new SAT.Vector(200 * SCALE, 400 * SCALE), 200 * SCALE, 20 * SCALE));
    this.obstacles.push(new SAT.Box(new SAT.Vector(500 * SCALE, 300 * SCALE), 200 * SCALE, 20 * SCALE));
  }

  public getObstacles(): SAT.Box[] {
    return this.obstacles;
  }

  public step(state: GameState, inputs: Map<string, Input>) {
    state.players.forEach((player) => {
      const input = inputs.get(player.id);
      if (input) {
        this.updatePlayer(player, input, state.entities);
      }
    });
    
    // Update entities/projectiles if any
  }

  private updatePlayer(player: PlayerState, input: Input, _entities: Entity[]) {
    // Apply inputs
    if (input.left) {
      player.velocity.x -= MOVE_SPEED * 0.2;
      player.facingRight = false;
    }
    if (input.right) {
      player.velocity.x += MOVE_SPEED * 0.2;
      player.facingRight = true;
    }

    // Clamp horizontal speed
    if (Math.abs(player.velocity.x) > MOVE_SPEED) {
      player.velocity.x = Math.sign(player.velocity.x) * MOVE_SPEED;
    }

    // Friction / Drag
    player.velocity.x *= FRICTION;
    if (Math.abs(player.velocity.x) < 10) player.velocity.x = 0; // Threshold

    // Gravity
    player.velocity.y += GRAVITY;
    if (player.velocity.y > MAX_FALL_SPEED) player.velocity.y = MAX_FALL_SPEED;

    // Jumping
    if (input.jump && player.isGrounded) {
      player.velocity.y = JUMP_FORCE;
      player.isGrounded = false;
    }

    // Apply Velocity
    player.position.x += player.velocity.x;
    player.position.y += player.velocity.y;

    // Collision Detection
    player.isGrounded = false;
    
    const playerBox = new SAT.Box(
      new SAT.Vector(player.position.x, player.position.y),
      player.width * SCALE,
      player.height * SCALE
    );

    // Check Map Obstacles
    for (const obstacle of this.obstacles) {
      const response = new SAT.Response();
      if (SAT.testPolygonPolygon(playerBox.toPolygon(), obstacle.toPolygon(), response)) {
        // Resolve collision
        player.position.x -= response.overlapV.x;
        player.position.y -= response.overlapV.y;

        if (response.overlapN.y < 0) {
          player.isGrounded = true;
          player.velocity.y = 0;
        } else if (response.overlapN.y > 0) {
          player.velocity.y = 0; // Hit head
        }
      }
    }

    // Boundaries (simple world bounds)
    if (player.position.x < 0) player.position.x = 0;
    if (player.position.x > 800 * SCALE) player.position.x = 800 * SCALE;
  }
}
