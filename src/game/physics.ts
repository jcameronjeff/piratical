import SAT from 'sat';
import { GameState, PlayerState, Input, EntityType, EnemyType, LevelData, MovingPlatform } from '../types';
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
const COYOTE_FRAMES = 6; // frames after leaving ground where jump is still allowed
const WALL_SLIDE_SPEED = 300; // max fall speed when wall sliding (scaled)
const WALL_JUMP_VELOCITY_X = 600; // horizontal kick from wall jump (scaled)
const WALL_JUMP_VELOCITY_Y = -1000; // vertical jump from wall (scaled)
const DASH_SPEED = 1200; // horizontal dash speed (scaled)
const DASH_DURATION = 8; // frames the dash lasts
const DASH_COOLDOWN = 45; // frames before can dash again

export class PhysicsEngine {
  private obstacles: SAT.Box[];
  private levelWidth: number = 800;
  private levelHeight: number = 600;
  private currentLevel: LevelData | null = null;
  private movingPlatforms: { def: MovingPlatform; box: SAT.Box; prevX: number; prevY: number }[] = [];
  private frameCount: number = 0;

  constructor() {
    this.obstacles = [];
  }

  public loadLevel(level: LevelData) {
    this.obstacles = [];
    this.movingPlatforms = [];
    this.frameCount = 0;
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

    // Load moving platforms
    if (level.movingPlatforms) {
      for (const mp of level.movingPlatforms) {
        const box = new SAT.Box(
          new SAT.Vector(mp.x * SCALE, mp.y * SCALE),
          mp.w * SCALE,
          mp.h * SCALE
        );
        this.movingPlatforms.push({ def: mp, box, prevX: mp.x * SCALE, prevY: mp.y * SCALE });
      }
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

  public getMovingPlatforms(): { def: MovingPlatform; box: SAT.Box; prevX: number; prevY: number }[] {
    return this.movingPlatforms;
  }

  public step(state: GameState, inputs: Map<string, Input>): void {
    this.frameCount++;
    this.updateMovingPlatforms();

    state.players.forEach((player) => {
      const input = inputs.get(player.id) || { frame: 0, left: false, right: false, jump: false, action: false, dash: false };
      this.updatePlayer(player, input, state);
    });

    this.updateEntities(state);
    this.checkEntityCollisions(state);
  }

  private updateMovingPlatforms() {
    for (const mp of this.movingPlatforms) {
      mp.prevX = mp.box.pos.x;
      mp.prevY = mp.box.pos.y;

      const t = this.frameCount * mp.def.speed + (mp.def.phase || 0);
      const newX = (mp.def.x + (mp.def.moveX || 0) * Math.sin(t)) * SCALE;
      const newY = (mp.def.y + (mp.def.moveY || 0) * Math.sin(t)) * SCALE;

      mp.box.pos.x = newX;
      mp.box.pos.y = newY;
    }
  }

  private updatePlayer(player: PlayerState, input: Input, state: GameState) {
    // === ATTACK HANDLING ===
    if (player.attackCooldown > 0) {
      player.attackCooldown--;
    }

    if (input.action && player.attackCooldown === 0 && !player.isAttacking && player.hasSword) {
      player.isAttacking = true;
      player.attackFrame = ATTACK_DURATION;
      player.attackCooldown = ATTACK_COOLDOWN;
      getSoundManager().playSound(SoundEffect.ATTACK);
    }

    if (player.isAttacking) {
      player.attackFrame--;
      if (player.attackFrame <= 0) {
        player.isAttacking = false;
        player.attackFrame = 0;
      }
    }

    // === DASH HANDLING ===
    if (player.dashCooldown > 0) {
      player.dashCooldown--;
    }

    if (input.dash && player.dashCooldown === 0 && !player.isDashing) {
      player.isDashing = true;
      player.dashTimer = DASH_DURATION;
      player.dashCooldown = DASH_COOLDOWN;
      player.velocity.x = player.facingRight ? DASH_SPEED : -DASH_SPEED;
      player.velocity.y = 0;
    }

    if (player.isDashing) {
      player.dashTimer--;
      if (player.dashTimer <= 0) {
        player.isDashing = false;
        player.dashTimer = 0;
        // Reduce velocity after dash ends
        player.velocity.x *= 0.5;
      }
    }

    // === HORIZONTAL MOVEMENT (skip during dash) ===
    if (!player.isDashing) {
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
    }

    // === COYOTE TIME ===
    if (player.isGrounded) {
      player.coyoteTimer = 0;
    } else {
      player.coyoteTimer++;
    }

    const canCoyoteJump = player.coyoteTimer < COYOTE_FRAMES && player.coyoteTimer > 0;

    // === JUMPING (with coyote time and wall jump) ===
    if (input.jump && !player.jumpHeld) {
      if (player.isGrounded || canCoyoteJump) {
        // Normal jump or coyote jump
        player.velocity.y = JUMP_VELOCITY;
        player.jumpHeld = true;
        player.coyoteTimer = COYOTE_FRAMES; // Consume coyote time
        player.wallSliding = false;
        getSoundManager().playSound(SoundEffect.JUMP);
      } else if (player.wallSliding) {
        // Wall jump - kick away from wall
        player.velocity.y = WALL_JUMP_VELOCITY_Y;
        player.velocity.x = -player.wallDirection * WALL_JUMP_VELOCITY_X;
        player.facingRight = player.wallDirection < 0;
        player.jumpHeld = true;
        player.wallSliding = false;
        player.wallDirection = 0;
        getSoundManager().playSound(SoundEffect.JUMP);
      }
    }

    if (!input.jump) {
      player.jumpHeld = false;
    }

    // === GRAVITY (skip during dash) ===
    if (!player.isDashing) {
      player.velocity.y += GRAVITY;
      // Wall slide: cap fall speed when sliding
      if (player.wallSliding) {
        player.velocity.y = Math.min(player.velocity.y, WALL_SLIDE_SPEED);
      } else {
        player.velocity.y = Math.min(player.velocity.y, MAX_FALL_SPEED);
      }
    }

    // === APPLY MOVEMENT ===
    player.position.x += player.velocity.x;
    player.position.y += player.velocity.y;

    // === COLLISION DETECTION ===
    player.isGrounded = false;
    player.wallSliding = false;
    player.wallDirection = 0;

    let touchingWallDir = 0;
    let standingOnMovingPlatform: typeof this.movingPlatforms[0] | null = null;

    const playerPoly = new SAT.Box(
      new SAT.Vector(player.position.x, player.position.y),
      player.width * SCALE,
      player.height * SCALE
    ).toPolygon();

    // Check static obstacles
    for (const obstacle of this.obstacles) {
      const response = new SAT.Response();
      const obstaclePoly = obstacle.toPolygon();

      if (SAT.testPolygonPolygon(playerPoly, obstaclePoly, response)) {
        player.position.x -= response.overlapV.x;
        player.position.y -= response.overlapV.y;
        playerPoly.pos.x = player.position.x;
        playerPoly.pos.y = player.position.y;

        if (response.overlapN.y > 0.7) {
          player.isGrounded = true;
          player.velocity.y = 0;
        } else if (response.overlapN.y < -0.7) {
          player.velocity.y = Math.max(0, player.velocity.y);
        }

        if (Math.abs(response.overlapN.x) > 0.7) {
          touchingWallDir = response.overlapN.x > 0 ? 1 : -1;
          player.velocity.x = 0;
        }
      }
    }

    // Check moving platforms
    for (const mp of this.movingPlatforms) {
      const response = new SAT.Response();
      const obstaclePoly = mp.box.toPolygon();

      if (SAT.testPolygonPolygon(playerPoly, obstaclePoly, response)) {
        player.position.x -= response.overlapV.x;
        player.position.y -= response.overlapV.y;
        playerPoly.pos.x = player.position.x;
        playerPoly.pos.y = player.position.y;

        if (response.overlapN.y > 0.7) {
          player.isGrounded = true;
          player.velocity.y = 0;
          standingOnMovingPlatform = mp;
        } else if (response.overlapN.y < -0.7) {
          player.velocity.y = Math.max(0, player.velocity.y);
        }

        if (Math.abs(response.overlapN.x) > 0.7) {
          touchingWallDir = response.overlapN.x > 0 ? 1 : -1;
          player.velocity.x = 0;
        }
      }
    }

    // Carry player with moving platform
    if (standingOnMovingPlatform) {
      const deltaX = standingOnMovingPlatform.box.pos.x - standingOnMovingPlatform.prevX;
      const deltaY = standingOnMovingPlatform.box.pos.y - standingOnMovingPlatform.prevY;
      player.position.x += deltaX;
      player.position.y += deltaY;
    }

    // === WALL SLIDE DETECTION ===
    // Wall slide if: touching wall, not grounded, falling, and holding toward wall
    if (touchingWallDir !== 0 && !player.isGrounded && player.velocity.y > 0 && !player.isDashing) {
      const holdingTowardWall = (touchingWallDir > 0 && input.right) || (touchingWallDir < 0 && input.left);
      if (holdingTowardWall) {
        player.wallSliding = true;
        player.wallDirection = touchingWallDir;
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
              if (!player.isDashing) {
                state.levelFailed = true;
                getSoundManager().playSound(SoundEffect.PLAYER_HIT);
              }
              break;

            case EntityType.ENEMY:
              // Dashing grants invulnerability
              if (player.isDashing) break;

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
              // Dashing through cannonballs
              if (player.isDashing) break;
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
