import SAT from 'sat';
import { GameState, PlayerState, Input, EntityType, EnemyType, LevelData } from '../types';
import { getSoundManager, SoundEffect } from '../sound';

// Constants for integer-based physics (x100)
const SCALE = 100;
const GRAVITY = 50; // pixels per frame^2 (scaled)
const JUMP_VELOCITY = -1100; // initial jump velocity (scaled)
const MOVE_SPEED = 400; // max horizontal speed (scaled)
const MOVE_ACCEL = 80; // horizontal acceleration (scaled)
const FRICTION = 0.85;
const AIR_FRICTION = 0.95;
const MAX_FALL_SPEED = 1200;
const ATTACK_DURATION = 25; // frames the attack animation lasts
const ATTACK_COOLDOWN = 20; // frames before can attack again
const ATTACK_RANGE = 50; // pixels in front of player (sword reach)

export class PhysicsEngine {
  private obstacles: SAT.Box[];
  private levelWidth: number = 800;
  private levelHeight: number = 600;
  private currentLevel: LevelData | null = null;

  constructor() {
    this.obstacles = [];
  }

  public loadLevel(level: LevelData) {
    this.obstacles = [];
    this.currentLevel = level;
    this.levelWidth = level.width;
    this.levelHeight = level.height;

    for (const platform of level.platforms) {
      this.obstacles.push(
        new SAT.Box(
          new SAT.Vector(platform.x * SCALE, platform.y * SCALE),
          platform.w * SCALE,
          platform.h * SCALE
        )
      );
    }
  }

  public createDefaultMap() {
    this.obstacles = [];
    this.levelWidth = 800;
    this.levelHeight = 600;
    
    this.obstacles.push(new SAT.Box(new SAT.Vector(0, 500 * SCALE), 800 * SCALE, 100 * SCALE));
    this.obstacles.push(new SAT.Box(new SAT.Vector(200 * SCALE, 400 * SCALE), 200 * SCALE, 20 * SCALE));
    this.obstacles.push(new SAT.Box(new SAT.Vector(500 * SCALE, 300 * SCALE), 200 * SCALE, 20 * SCALE));
  }

  public getObstacles(): SAT.Box[] {
    return this.obstacles;
  }

  public getLevelWidth(): number {
    return this.levelWidth;
  }

  public getLevelHeight(): number {
    return this.levelHeight;
  }

  public getCurrentLevel(): LevelData | null {
    return this.currentLevel;
  }

  public step(state: GameState, inputs: Map<string, Input>): void {
    state.players.forEach((player) => {
      const input = inputs.get(player.id) || { frame: 0, left: false, right: false, jump: false, action: false };
      this.updatePlayer(player, input, state);
    });
    
    this.updateEntities(state);
    this.checkEntityCollisions(state);
  }

  private updatePlayer(player: PlayerState, input: Input, state: GameState) {
    // === ATTACK HANDLING ===
    // Decrement cooldown
    if (player.attackCooldown > 0) {
      player.attackCooldown--;
    }
    
    // Handle attack input - only if player has the sword!
    if (input.action && player.attackCooldown === 0 && !player.isAttacking && player.hasSword) {
      player.isAttacking = true;
      player.attackFrame = ATTACK_DURATION;
      player.attackCooldown = ATTACK_COOLDOWN;
      getSoundManager().playSound(SoundEffect.ATTACK);
    }
    
    // Update attack animation
    if (player.isAttacking) {
      player.attackFrame--;
      if (player.attackFrame <= 0) {
        player.isAttacking = false;
        player.attackFrame = 0;
      }
    }

    // === HORIZONTAL MOVEMENT ===
    if (input.left) {
      player.velocity.x -= MOVE_ACCEL;
      player.facingRight = false;
    }
    if (input.right) {
      player.velocity.x += MOVE_ACCEL;
      player.facingRight = true;
    }

    // Clamp horizontal speed
    player.velocity.x = Math.max(-MOVE_SPEED, Math.min(MOVE_SPEED, player.velocity.x));

    // Apply friction
    player.velocity.x *= player.isGrounded ? FRICTION : AIR_FRICTION;
    if (Math.abs(player.velocity.x) < 10) player.velocity.x = 0;

    // === JUMPING ===
    // Allow jump if: on ground AND pressing jump AND wasn't pressing jump last frame
    if (input.jump && player.isGrounded && !player.jumpHeld) {
      player.velocity.y = JUMP_VELOCITY;
      player.jumpHeld = true;
      getSoundManager().playSound(SoundEffect.JUMP);
    }
    
    // Track if jump key is held (to prevent repeated jumps while holding)
    if (!input.jump) {
      player.jumpHeld = false;
    }

    // === GRAVITY ===
    player.velocity.y += GRAVITY;
    player.velocity.y = Math.min(player.velocity.y, MAX_FALL_SPEED);

    // === APPLY MOVEMENT ===
    player.position.x += player.velocity.x;
    player.position.y += player.velocity.y;

    // === COLLISION DETECTION ===
    // Assume not grounded until proven otherwise
    player.isGrounded = false;
    
    const playerPoly = new SAT.Box(
      new SAT.Vector(player.position.x, player.position.y),
      player.width * SCALE,
      player.height * SCALE
    ).toPolygon();

    for (const obstacle of this.obstacles) {
      const response = new SAT.Response();
      const obstaclePoly = obstacle.toPolygon();
      
      if (SAT.testPolygonPolygon(playerPoly, obstaclePoly, response)) {
        // Push player out of obstacle
        player.position.x -= response.overlapV.x;
        player.position.y -= response.overlapV.y;
        
        // Update polygon position for next check
        playerPoly.pos.x = player.position.x;
        playerPoly.pos.y = player.position.y;

        // Check collision direction
        // overlapN points from player to obstacle
        if (response.overlapN.y > 0.7) {
          // Hit ground (obstacle is below player)
          player.isGrounded = true;
          player.velocity.y = 0;
        } else if (response.overlapN.y < -0.7) {
          // Hit ceiling (obstacle is above player)
          player.velocity.y = Math.max(0, player.velocity.y);
        }
        
        if (Math.abs(response.overlapN.x) > 0.7) {
          // Hit wall
          player.velocity.x = 0;
        }
      }
    }

    // === WORLD BOUNDARIES ===
    if (player.position.x < 0) {
      player.position.x = 0;
      player.velocity.x = 0;
    }
    if (player.position.x > (this.levelWidth - player.width) * SCALE) {
      player.position.x = (this.levelWidth - player.width) * SCALE;
      player.velocity.x = 0;
    }

    // Fall off bottom = death
    if (player.position.y > this.levelHeight * SCALE) {
      state.levelFailed = true;
    }
  }

  private updateEntities(state: GameState) {
    for (const entity of state.entities) {
      if (!entity.active) continue;

      if (entity.type === EntityType.ENEMY && entity.velocity) {
        entity.position.x += entity.velocity.x;
      }
    }
  }

  private checkEntityCollisions(state: GameState) {
    state.players.forEach((player) => {
      const playerBox = new SAT.Box(
        new SAT.Vector(player.position.x, player.position.y),
        player.width * SCALE,
        player.height * SCALE
      );

      // First, check sword attacks (extended range) - this happens BEFORE body collision
      if (player.isAttacking && player.attackFrame > ATTACK_DURATION - 15) {
        // Create sword hitbox extending in front of player
        const swordWidth = ATTACK_RANGE * SCALE;  // Use ATTACK_RANGE for sword reach
        const swordHeight = 20 * SCALE;
        
        const swordX = player.facingRight 
          ? player.position.x + (player.width * SCALE)
          : player.position.x - swordWidth;
        const swordY = player.position.y + (player.height * SCALE / 2) - (swordHeight / 2);
        
        const swordBox = new SAT.Box(
          new SAT.Vector(swordX, swordY),
          swordWidth,
          swordHeight
        );

        for (const entity of state.entities) {
          if (!entity.active || entity.type !== EntityType.ENEMY) continue;
          
          // Cannon turrets cannot be killed with sword
          if (entity.enemyType === EnemyType.CANNON_TURRET) continue;
          
          // Ghosts can only be killed when visible
          if (entity.enemyType === EnemyType.GHOST && !entity.isVisible) continue;

          const entityBox = new SAT.Box(
            new SAT.Vector(entity.position.x * SCALE, entity.position.y * SCALE),
            entity.width * SCALE,
            entity.height * SCALE
          );

          if (SAT.testPolygonPolygon(swordBox.toPolygon(), entityBox.toPolygon())) {
            // Enemy defeated by sword!
            entity.active = false;
            getSoundManager().playSound(SoundEffect.ENEMY_DEFEAT);
          }
        }
      }

      // Then check body collisions for other interactions
      for (const entity of state.entities) {
        if (!entity.active) continue;

        const entityBox = new SAT.Box(
          new SAT.Vector(entity.position.x * SCALE, entity.position.y * SCALE),
          entity.width * SCALE,
          entity.height * SCALE
        );

        if (SAT.testPolygonPolygon(playerBox.toPolygon(), entityBox.toPolygon())) {
          switch (entity.type) {
            case EntityType.DOUBLOON:
              if (!entity.collected) {
                entity.collected = true;
                entity.active = false;
                player.doubloons++;
                getSoundManager().playSound(SoundEffect.COLLECT_DOUBLOON);
              }
              break;

            case EntityType.SPIKE:
              state.levelFailed = true;
              getSoundManager().playSound(SoundEffect.PLAYER_HIT);
              break;

            case EntityType.ENEMY:
              // Handle different enemy types
              const enemyType = entity.enemyType || EnemyType.CRAB;
              
              // Ghost-specific logic - can only be killed with sword when visible
              if (enemyType === EnemyType.GHOST) {
                if (!entity.isVisible) {
                  // Ghost is phased out - player passes through harmlessly
                  break;
                }
                // When visible, can only be killed with sword (not stomp)
                if (!player.isAttacking) {
                  state.levelFailed = true;
                  getSoundManager().playSound(SoundEffect.PLAYER_HIT);
                }
                // Sword kills handled above in the sword attack section
                break;
              }
              
              // Cannon turrets can't be killed, just avoided
              if (enemyType === EnemyType.CANNON_TURRET) {
                // Cannons are indestructible - touching hurts player
                state.levelFailed = true;
                getSoundManager().playSound(SoundEffect.PLAYER_HIT);
                break;
              }
              
              // Jellyfish - can be killed but hurt on any contact
              if (enemyType === EnemyType.JELLYFISH) {
                if (player.isAttacking || (player.velocity.y > 0 && player.position.y < entity.position.y * SCALE)) {
                  // Can stomp or sword jellyfish
                  entity.active = false;
                  getSoundManager().playSound(SoundEffect.ENEMY_DEFEAT);
                  if (player.velocity.y > 0) {
                    player.velocity.y = JUMP_VELOCITY * 0.6;
                  }
                } else {
                  state.levelFailed = true;
                  getSoundManager().playSound(SoundEffect.PLAYER_HIT);
                }
                break;
              }
              
              // Standard enemies (CRAB, SEAGULL, SKELETON)
              // Sword attack already handled above with extended range
              // Check for stomp attack
              if (player.velocity.y > 0 && player.position.y < entity.position.y * SCALE) {
                // Stomp attack (like Mario)
                entity.active = false;
                getSoundManager().playSound(SoundEffect.ENEMY_DEFEAT);
                player.velocity.y = JUMP_VELOCITY * 0.6;
              } else if (!player.isAttacking) {
                // Player hit by enemy (not attacking = vulnerable)
                state.levelFailed = true;
                getSoundManager().playSound(SoundEffect.PLAYER_HIT);
              }
              // If attacking but didn't hit with sword, player is protected but doesn't kill enemy
              break;
              
            case EntityType.CANNONBALL:
              // Cannonballs always hurt the player
              state.levelFailed = true;
              getSoundManager().playSound(SoundEffect.PLAYER_HIT);
              break;

            case EntityType.GOAL:
              state.levelComplete = true;
              getSoundManager().playSound(SoundEffect.LEVEL_COMPLETE);
              break;

            case EntityType.RUM:
              if (!entity.collected) {
                entity.collected = true;
                entity.active = false;
                player.health = Math.min(player.health + 1, 3);
              }
              break;

            case EntityType.COCONUT:
              if (!entity.collected) {
                entity.collected = true;
                entity.active = false;
                player.sizeModifier = Math.min(player.sizeModifier + 0.25, 2);
              }
              break;

            case EntityType.SWORD_CHEST:
              // Player must hit from below (like Mario hitting a ? block)
              // Check if player is below the chest and moving upward
              if (!entity.collected && player.velocity.y < 0) {
                const playerTop = player.position.y;
                const chestBottom = (entity.position.y + entity.height) * SCALE;
                
                // Player's head is hitting the bottom of the chest
                if (playerTop <= chestBottom && playerTop > chestBottom - 20 * SCALE) {
                  entity.collected = true;
                  player.hasSword = true;
                  getSoundManager().playSound(SoundEffect.COLLECT_SWORD);
                  // Bounce player back down slightly
                  player.velocity.y = Math.abs(player.velocity.y) * 0.3;
                }
              }
              break;
          }
        }
      }
    });
  }
}
