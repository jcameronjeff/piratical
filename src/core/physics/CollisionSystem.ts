/**
 * Collision Detection and Resolution System
 * 
 * Deterministic collision handling with spatial hashing for performance.
 */

import { AABB } from './AABB.js';
import { SpatialHash, Collidable } from './SpatialHash.js';
import { Vec2, sub, add, mul, div, min, max } from '../math/FixedPoint.js';

export interface CollisionBody extends Collidable {
  velocity: Vec2;
  mass: number;
  isStatic: boolean;
  restitution: number; // Bounciness (0-1)
}

export interface CollisionInfo {
  bodyA: CollisionBody;
  bodyB: CollisionBody;
  normal: Vec2;
  penetration: number;
  point: Vec2;
}

export class CollisionSystem {
  private spatialHash: SpatialHash;
  private bodies: Map<number, CollisionBody>;
  private nextId: number = 1;

  constructor(cellSize: number = 64) {
    this.spatialHash = new SpatialHash(cellSize);
    this.bodies = new Map();
  }

  /**
   * Add a body to the collision system
   */
  addBody(body: Omit<CollisionBody, 'id'>): number {
    const id = this.nextId++;
    const fullBody: CollisionBody = { ...body, id };
    this.bodies.set(id, fullBody);
    this.spatialHash.insert(fullBody);
    return id;
  }

  /**
   * Remove a body from the collision system
   */
  removeBody(id: number): void {
    this.bodies.delete(id);
    this.spatialHash.remove(id);
  }

  /**
   * Update a body's AABB (call after moving)
   */
  updateBody(id: number, aabb: AABB): void {
    const body = this.bodies.get(id);
    if (!body) return;
    
    body.aabb = aabb;
    this.spatialHash.update(body);
  }

  /**
   * Get a body by ID
   */
  getBody(id: number): CollisionBody | undefined {
    return this.bodies.get(id);
  }

  /**
   * Check if two AABBs intersect and get collision info
   */
  private checkAABBCollision(a: AABB, b: AABB): {
    colliding: boolean;
    normal: Vec2;
    penetration: number;
  } {
    if (!a.intersects(b)) {
      return { colliding: false, normal: new Vec2(0, 0), penetration: 0 };
    }

    // Calculate overlap on each axis
    const overlapX = min(a.maxX, b.maxX) - max(a.minX, b.minX);
    const overlapY = min(a.maxY, b.maxY) - max(a.minY, b.minY);

    // Determine separation axis (minimum overlap)
    let normal: Vec2;
    let penetration: number;

    if (overlapX < overlapY) {
      penetration = overlapX;
      normal = a.centerX < b.centerX 
        ? new Vec2(-1 << 16, 0) // Push left
        : new Vec2(1 << 16, 0);  // Push right
    } else {
      penetration = overlapY;
      normal = a.centerY < b.centerY
        ? new Vec2(0, -1 << 16) // Push up
        : new Vec2(0, 1 << 16);  // Push down
    }

    return { colliding: true, normal, penetration };
  }

  /**
   * Resolve collision between two bodies using impulse resolution
   */
  private resolveCollision(collision: CollisionInfo): void {
    const { bodyA, bodyB, normal, penetration } = collision;

    // Don't resolve if both are static
    if (bodyA.isStatic && bodyB.isStatic) return;

    // Separate bodies
    if (!bodyA.isStatic && !bodyB.isStatic) {
      const totalMass = bodyA.mass + bodyB.mass;
      const ratioA = div(bodyB.mass << 16, totalMass);
      const ratioB = div(bodyA.mass << 16, totalMass);
      
      const separationA = mul(penetration, ratioA);
      const separationB = mul(penetration, ratioB);
      
      bodyA.aabb = new AABB(
        sub(bodyA.aabb.minX, mul(normal.x, separationA)),
        sub(bodyA.aabb.minY, mul(normal.y, separationA)),
        sub(bodyA.aabb.maxX, mul(normal.x, separationA)),
        sub(bodyA.aabb.maxY, mul(normal.y, separationA))
      );
      
      bodyB.aabb = new AABB(
        add(bodyB.aabb.minX, mul(normal.x, separationB)),
        add(bodyB.aabb.minY, mul(normal.y, separationB)),
        add(bodyB.aabb.maxX, mul(normal.x, separationB)),
        add(bodyB.aabb.maxY, mul(normal.y, separationB))
      );
    } else if (!bodyA.isStatic) {
      bodyA.aabb = new AABB(
        sub(bodyA.aabb.minX, mul(normal.x, penetration)),
        sub(bodyA.aabb.minY, mul(normal.y, penetration)),
        sub(bodyA.aabb.maxX, mul(normal.x, penetration)),
        sub(bodyA.aabb.maxY, mul(normal.y, penetration))
      );
    } else {
      bodyB.aabb = new AABB(
        add(bodyB.aabb.minX, mul(normal.x, penetration)),
        add(bodyB.aabb.minY, mul(normal.y, penetration)),
        add(bodyB.aabb.maxX, mul(normal.x, penetration)),
        add(bodyB.aabb.maxY, mul(normal.y, penetration))
      );
    }

    // Calculate relative velocity
    const relVel = bodyA.velocity.sub(bodyB.velocity);
    const velAlongNormal = relVel.dot(normal);

    // Don't resolve if velocities are separating
    if (velAlongNormal > 0) return;

    // Calculate restitution (bounciness)
    const e = min(bodyA.restitution, bodyB.restitution);

    // Calculate impulse scalar
    let j = mul(-(1 << 16) + e, velAlongNormal);
    
    if (!bodyA.isStatic && !bodyB.isStatic) {
      j = div(j, (bodyA.mass + bodyB.mass) << 16);
    }

    // Apply impulse
    const impulse = normal.mul(j);
    
    if (!bodyA.isStatic) {
      bodyA.velocity = bodyA.velocity.sub(impulse.mul(div(1 << 16, bodyA.mass << 16)));
    }
    if (!bodyB.isStatic) {
      bodyB.velocity = bodyB.velocity.add(impulse.mul(div(1 << 16, bodyB.mass << 16)));
    }
  }

  /**
   * Detect and resolve all collisions
   */
  step(): CollisionInfo[] {
    const collisions: CollisionInfo[] = [];
    const checked = new Set<string>();

    // Sort bodies by ID for deterministic collision ordering
    const sortedBodies = Array.from(this.bodies.values()).sort((a, b) => a.id - b.id);

    for (const bodyA of sortedBodies) {
      const candidates = this.spatialHash.query(bodyA.aabb);

      for (const candidate of candidates) {
        const bodyB = this.bodies.get(candidate.id);
        if (!bodyB || bodyA.id === bodyB.id) continue;

        // Ensure deterministic ordering
        const pairKey = bodyA.id < bodyB.id 
          ? `${bodyA.id}-${bodyB.id}`
          : `${bodyB.id}-${bodyA.id}`;
        
        if (checked.has(pairKey)) continue;
        checked.add(pairKey);

        const result = this.checkAABBCollision(bodyA.aabb, bodyB.aabb);
        if (result.colliding) {
          const collision: CollisionInfo = {
            bodyA,
            bodyB,
            normal: result.normal,
            penetration: result.penetration,
            point: bodyA.aabb.center
          };

          collisions.push(collision);
          this.resolveCollision(collision);
        }
      }
    }

    return collisions;
  }

  /**
   * Clear all bodies
   */
  clear(): void {
    this.bodies.clear();
    this.spatialHash.clear();
    this.nextId = 1;
  }

  /**
   * Get all bodies
   */
  getBodies(): CollisionBody[] {
    return Array.from(this.bodies.values());
  }
}
