/**
 * Fixed-Point Math System
 * 
 * Provides deterministic math operations using integer arithmetic.
 * Uses 16.16 fixed-point representation (16 bits integer, 16 bits fractional).
 * This ensures identical results across all platforms and architectures.
 */

export const FIXED_SHIFT = 16;
export const FIXED_ONE = 1 << FIXED_SHIFT; // 65536
export const FIXED_HALF = FIXED_ONE >> 1;
export const FIXED_PI = 205887; // π * 65536 ≈ 205887.4
export const FIXED_TWO_PI = 411775; // 2π * 65536

/**
 * Convert a floating-point number to fixed-point
 */
export function toFixed(value: number): number {
  return Math.round(value * FIXED_ONE) | 0;
}

/**
 * Convert a fixed-point number to floating-point
 */
export function toFloat(fixed: number): number {
  return fixed / FIXED_ONE;
}

/**
 * Multiply two fixed-point numbers
 */
export function mul(a: number, b: number): number {
  // Perform multiplication and shift back, handling overflow
  const result = (a * b) / FIXED_ONE;
  return Math.round(result) | 0;
}

/**
 * Divide two fixed-point numbers
 */
export function div(a: number, b: number): number {
  if (b === 0) return 0;
  const result = (a * FIXED_ONE) / b;
  return Math.round(result) | 0;
}

/**
 * Add two fixed-point numbers
 */
export function add(a: number, b: number): number {
  return (a + b) | 0;
}

/**
 * Subtract two fixed-point numbers
 */
export function sub(a: number, b: number): number {
  return (a - b) | 0;
}

/**
 * Get absolute value
 */
export function abs(a: number): number {
  return a < 0 ? -a : a;
}

/**
 * Get minimum of two values
 */
export function min(a: number, b: number): number {
  return a < b ? a : b;
}

/**
 * Get maximum of two values
 */
export function max(a: number, b: number): number {
  return a > b ? a : b;
}

/**
 * Clamp a value between min and max
 */
export function clamp(value: number, minVal: number, maxVal: number): number {
  return max(minVal, min(maxVal, value));
}

/**
 * Floor function
 */
export function floor(a: number): number {
  return (a >> FIXED_SHIFT) << FIXED_SHIFT;
}

/**
 * Ceiling function
 */
export function ceil(a: number): number {
  const frac = a & (FIXED_ONE - 1);
  return frac === 0 ? a : ((a >> FIXED_SHIFT) + 1) << FIXED_SHIFT;
}

/**
 * Square root using Newton's method (deterministic)
 */
export function sqrt(a: number): number {
  if (a <= 0) return 0;
  
  let x = a;
  let y = (a + FIXED_ONE) >> 1;
  
  // Newton's method iterations
  for (let i = 0; i < 16; i++) {
    if (y >= x) break;
    x = y;
    y = (div(a, y) + y) >> 1;
  }
  
  return x;
}

/**
 * Fixed-point vector 2D
 */
export class Vec2 {
  constructor(
    public x: number = 0,
    public y: number = 0
  ) {}

  static from(x: number, y: number): Vec2 {
    return new Vec2(toFixed(x), toFixed(y));
  }

  static fromFixed(x: number, y: number): Vec2 {
    return new Vec2(x, y);
  }

  add(other: Vec2): Vec2 {
    return new Vec2(add(this.x, other.x), add(this.y, other.y));
  }

  sub(other: Vec2): Vec2 {
    return new Vec2(sub(this.x, other.x), sub(this.y, other.y));
  }

  mul(scalar: number): Vec2 {
    return new Vec2(mul(this.x, scalar), mul(this.y, scalar));
  }

  dot(other: Vec2): number {
    return add(mul(this.x, other.x), mul(this.y, other.y));
  }

  lengthSquared(): number {
    return this.dot(this);
  }

  length(): number {
    return sqrt(this.lengthSquared());
  }

  normalize(): Vec2 {
    const len = this.length();
    if (len === 0) return new Vec2(0, 0);
    return new Vec2(div(this.x, len), div(this.y, len));
  }

  clone(): Vec2 {
    return new Vec2(this.x, this.y);
  }

  toFloat(): { x: number; y: number } {
    return { x: toFloat(this.x), y: toFloat(this.y) };
  }
}
