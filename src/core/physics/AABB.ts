/**
 * Axis-Aligned Bounding Box (AABB)
 * 
 * All coordinates are in fixed-point.
 */

import { Vec2, min, max, add, sub } from '../math/FixedPoint.js';

export class AABB {
  constructor(
    public minX: number,
    public minY: number,
    public maxX: number,
    public maxY: number
  ) {}

  static fromCenter(center: Vec2, halfWidth: number, halfHeight: number): AABB {
    return new AABB(
      sub(center.x, halfWidth),
      sub(center.y, halfHeight),
      add(center.x, halfWidth),
      add(center.y, halfHeight)
    );
  }

  static fromPosition(x: number, y: number, width: number, height: number): AABB {
    return new AABB(x, y, add(x, width), add(y, height));
  }

  get width(): number {
    return sub(this.maxX, this.minX);
  }

  get height(): number {
    return sub(this.maxY, this.minY);
  }

  get centerX(): number {
    return (this.minX + this.maxX) >> 1;
  }

  get centerY(): number {
    return (this.minY + this.maxY) >> 1;
  }

  get center(): Vec2 {
    return new Vec2(this.centerX, this.centerY);
  }

  /**
   * Check if this AABB intersects with another
   */
  intersects(other: AABB): boolean {
    return (
      this.minX < other.maxX &&
      this.maxX > other.minX &&
      this.minY < other.maxY &&
      this.maxY > other.minY
    );
  }

  /**
   * Check if this AABB contains a point
   */
  containsPoint(x: number, y: number): boolean {
    return (
      x >= this.minX &&
      x <= this.maxX &&
      y >= this.minY &&
      y <= this.maxY
    );
  }

  /**
   * Get the union of this AABB with another
   */
  union(other: AABB): AABB {
    return new AABB(
      min(this.minX, other.minX),
      min(this.minY, other.minY),
      max(this.maxX, other.maxX),
      max(this.maxY, other.maxY)
    );
  }

  /**
   * Get the intersection of this AABB with another
   */
  intersection(other: AABB): AABB | null {
    if (!this.intersects(other)) return null;
    
    return new AABB(
      max(this.minX, other.minX),
      max(this.minY, other.minY),
      min(this.maxX, other.maxX),
      min(this.maxY, other.maxY)
    );
  }

  /**
   * Expand this AABB by a fixed amount in all directions
   */
  expand(amount: number): AABB {
    return new AABB(
      sub(this.minX, amount),
      sub(this.minY, amount),
      add(this.maxX, amount),
      add(this.maxY, amount)
    );
  }

  /**
   * Clone this AABB
   */
  clone(): AABB {
    return new AABB(this.minX, this.minY, this.maxX, this.maxY);
  }
}
