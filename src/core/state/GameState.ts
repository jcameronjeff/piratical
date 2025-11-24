/**
 * Game State Management
 * 
 * Manages the complete game state with support for snapshots,
 * checksums, and state serialization for network sync.
 */

import { CollisionBody } from '../physics/CollisionSystem.js';
import { Vec2 } from '../math/FixedPoint.js';

export interface Entity {
  id: number;
  type: string;
  position: Vec2;
  velocity: Vec2;
  health: number;
  active: boolean;
  data?: Record<string, unknown>;
}

export interface Player {
  id: number;
  entityId: number;
  name: string;
  score: number;
  isConnected: boolean;
}

export interface GameStateData {
  frame: number;
  entities: Map<number, Entity>;
  players: Map<number, Player>;
  bodies: Map<number, CollisionBody>;
  worldSeed: number;
}

export class GameState {
  private frame: number = 0;
  private entities: Map<number, Entity>;
  private players: Map<number, Player>;
  private bodies: Map<number, CollisionBody>;
  private worldSeed: number;
  private nextEntityId: number = 1;

  constructor(seed: number = 12345) {
    this.entities = new Map();
    this.players = new Map();
    this.bodies = new Map();
    this.worldSeed = seed;
  }

  /**
   * Get current frame number
   */
  getFrame(): number {
    return this.frame;
  }

  /**
   * Set frame number
   */
  setFrame(frame: number): void {
    this.frame = frame;
  }

  /**
   * Advance to next frame
   */
  nextFrame(): void {
    this.frame++;
  }

  /**
   * Add an entity
   */
  addEntity(entity: Omit<Entity, 'id'>): number {
    const id = this.nextEntityId++;
    this.entities.set(id, { ...entity, id });
    return id;
  }

  /**
   * Remove an entity
   */
  removeEntity(id: number): void {
    this.entities.delete(id);
    this.bodies.delete(id);
  }

  /**
   * Get an entity by ID
   */
  getEntity(id: number): Entity | undefined {
    return this.entities.get(id);
  }

  /**
   * Get all entities
   */
  getEntities(): Entity[] {
    return Array.from(this.entities.values());
  }

  /**
   * Add a player
   */
  addPlayer(player: Player): void {
    this.players.set(player.id, player);
  }

  /**
   * Remove a player
   */
  removePlayer(id: number): void {
    this.players.delete(id);
  }

  /**
   * Get a player by ID
   */
  getPlayer(id: number): Player | undefined {
    return this.players.get(id);
  }

  /**
   * Get all players
   */
  getPlayers(): Player[] {
    return Array.from(this.players.values());
  }

  /**
   * Associate a collision body with an entity
   */
  setBody(entityId: number, body: CollisionBody): void {
    this.bodies.set(entityId, body);
  }

  /**
   * Get collision body for an entity
   */
  getBody(entityId: number): CollisionBody | undefined {
    return this.bodies.get(entityId);
  }

  /**
   * Calculate checksum of current state
   * Used for detecting desync in multiplayer
   */
  calculateChecksum(): number {
    let checksum = this.frame;

    // Add entity data
    const sortedEntities = Array.from(this.entities.values()).sort((a, b) => a.id - b.id);
    for (const entity of sortedEntities) {
      checksum = (checksum + entity.id) | 0;
      checksum = (checksum + entity.position.x) | 0;
      checksum = (checksum + entity.position.y) | 0;
      checksum = (checksum + entity.velocity.x) | 0;
      checksum = (checksum + entity.velocity.y) | 0;
      checksum = (checksum + entity.health) | 0;
    }

    // Add player data
    const sortedPlayers = Array.from(this.players.values()).sort((a, b) => a.id - b.id);
    for (const player of sortedPlayers) {
      checksum = (checksum + player.id) | 0;
      checksum = (checksum + player.score) | 0;
      checksum = (checksum + player.entityId) | 0;
    }

    return checksum >>> 0; // Unsigned 32-bit
  }

  /**
   * Create a snapshot of the current state
   */
  createSnapshot(): GameStateData {
    return {
      frame: this.frame,
      entities: new Map(this.entities),
      players: new Map(this.players),
      bodies: new Map(this.bodies),
      worldSeed: this.worldSeed
    };
  }

  /**
   * Restore state from a snapshot
   */
  restoreSnapshot(snapshot: GameStateData): void {
    this.frame = snapshot.frame;
    this.entities = new Map(snapshot.entities);
    this.players = new Map(snapshot.players);
    this.bodies = new Map(snapshot.bodies);
    this.worldSeed = snapshot.worldSeed;

    // Update nextEntityId
    this.nextEntityId = 1;
    for (const id of this.entities.keys()) {
      if (id >= this.nextEntityId) {
        this.nextEntityId = id + 1;
      }
    }
  }

  /**
   * Serialize state to JSON
   */
  serialize(): string {
    const data = {
      frame: this.frame,
      worldSeed: this.worldSeed,
      entities: Array.from(this.entities.entries()),
      players: Array.from(this.players.entries()),
      // Note: bodies are complex and should be reconstructed from entities
    };
    return JSON.stringify(data);
  }

  /**
   * Deserialize state from JSON
   */
  deserialize(json: string): void {
    const data = JSON.parse(json);
    this.frame = data.frame;
    this.worldSeed = data.worldSeed;
    this.entities = new Map(data.entities);
    this.players = new Map(data.players);
    this.bodies = new Map(); // Bodies need to be reconstructed
  }

  /**
   * Get world seed
   */
  getWorldSeed(): number {
    return this.worldSeed;
  }

  /**
   * Clear all state
   */
  clear(): void {
    this.entities.clear();
    this.players.clear();
    this.bodies.clear();
    this.frame = 0;
    this.nextEntityId = 1;
  }
}
