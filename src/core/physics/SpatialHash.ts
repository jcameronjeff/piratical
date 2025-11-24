/**
 * Spatial Hash for Broad-Phase Collision Detection
 * 
 * Divides space into a grid and hashes entities into cells.
 * Much faster than naive O(n²) collision detection.
 */

import { AABB } from './AABB.js';
import { toFloat } from '../math/FixedPoint.js';

export interface Collidable {
  id: number;
  aabb: AABB;
}

export class SpatialHash {
  private cellSize: number;
  private grid: Map<string, Set<number>>;
  private entities: Map<number, Collidable>;

  constructor(cellSize: number = 64) {
    this.cellSize = cellSize;
    this.grid = new Map();
    this.entities = new Map();
  }

  /**
   * Get all cell keys that an AABB overlaps
   */
  private getCellKeys(aabb: AABB): string[] {
    const minCellX = Math.floor(toFloat(aabb.minX) / this.cellSize);
    const minCellY = Math.floor(toFloat(aabb.minY) / this.cellSize);
    const maxCellX = Math.floor(toFloat(aabb.maxX) / this.cellSize);
    const maxCellY = Math.floor(toFloat(aabb.maxY) / this.cellSize);

    const keys: string[] = [];
    for (let x = minCellX; x <= maxCellX; x++) {
      for (let y = minCellY; y <= maxCellY; y++) {
        keys.push(`${x},${y}`);
      }
    }
    return keys;
  }

  /**
   * Insert an entity into the spatial hash
   */
  insert(entity: Collidable): void {
    this.entities.set(entity.id, entity);
    
    const keys = this.getCellKeys(entity.aabb);
    for (const key of keys) {
      if (!this.grid.has(key)) {
        this.grid.set(key, new Set());
      }
      this.grid.get(key)!.add(entity.id);
    }
  }

  /**
   * Remove an entity from the spatial hash
   */
  remove(id: number): void {
    const entity = this.entities.get(id);
    if (!entity) return;

    const keys = this.getCellKeys(entity.aabb);
    for (const key of keys) {
      const cell = this.grid.get(key);
      if (cell) {
        cell.delete(id);
        if (cell.size === 0) {
          this.grid.delete(key);
        }
      }
    }

    this.entities.delete(id);
  }

  /**
   * Update an entity's position
   */
  update(entity: Collidable): void {
    this.remove(entity.id);
    this.insert(entity);
  }

  /**
   * Query for entities that could collide with the given AABB
   */
  query(aabb: AABB): Collidable[] {
    const candidates = new Set<number>();
    const keys = this.getCellKeys(aabb);

    for (const key of keys) {
      const cell = this.grid.get(key);
      if (cell) {
        for (const id of cell) {
          candidates.add(id);
        }
      }
    }

    const results: Collidable[] = [];
    for (const id of candidates) {
      const entity = this.entities.get(id);
      if (entity && entity.aabb.intersects(aabb)) {
        results.push(entity);
      }
    }

    return results;
  }

  /**
   * Query for a specific entity by ID
   */
  get(id: number): Collidable | undefined {
    return this.entities.get(id);
  }

  /**
   * Get all entities
   */
  getAll(): Collidable[] {
    return Array.from(this.entities.values());
  }

  /**
   * Clear all entities
   */
  clear(): void {
    this.grid.clear();
    this.entities.clear();
  }

  /**
   * Get statistics about the spatial hash
   */
  getStats(): { entityCount: number; cellCount: number; avgEntitiesPerCell: number } {
    const entityCount = this.entities.size;
    const cellCount = this.grid.size;
    
    let totalEntities = 0;
    for (const cell of this.grid.values()) {
      totalEntities += cell.size;
    }
    
    return {
      entityCount,
      cellCount,
      avgEntitiesPerCell: cellCount > 0 ? totalEntities / cellCount : 0
    };
  }
}
