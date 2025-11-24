/**
 * Deterministic Trigonometric Functions
 * 
 * Uses lookup tables for sine/cosine to ensure deterministic behavior.
 * All angles are in fixed-point radians.
 */

import { FIXED_ONE, FIXED_PI, FIXED_TWO_PI, mul, div, abs, sub, toFixed } from './FixedPoint.js';

// Sine lookup table with 1024 entries for angles 0 to 2π
const SINE_TABLE_SIZE = 1024;
const SINE_TABLE: number[] = [];

// Initialize sine lookup table
function initSineTable(): void {
  for (let i = 0; i < SINE_TABLE_SIZE; i++) {
    const angle = (i * 2 * Math.PI) / SINE_TABLE_SIZE;
    SINE_TABLE[i] = toFixed(Math.sin(angle));
  }
}

// Initialize on module load
initSineTable();

/**
 * Normalize angle to range [0, 2π)
 */
function normalizeAngle(angle: number): number {
  // Ensure angle is positive and within [0, 2π)
  while (angle < 0) angle += FIXED_TWO_PI;
  while (angle >= FIXED_TWO_PI) angle -= FIXED_TWO_PI;
  return angle;
}

/**
 * Deterministic sine function using lookup table
 */
export function sin(angle: number): number {
  angle = normalizeAngle(angle);
  
  // Convert angle to table index
  const index = mul(angle, toFixed(SINE_TABLE_SIZE / (2 * Math.PI)));
  const idx = (index >> 16) | 0;
  
  // Clamp index to valid range
  const safeIdx = ((idx % SINE_TABLE_SIZE) + SINE_TABLE_SIZE) % SINE_TABLE_SIZE;
  
  return SINE_TABLE[safeIdx];
}

/**
 * Deterministic cosine function using lookup table
 */
export function cos(angle: number): number {
  // cos(x) = sin(x + π/2)
  return sin(angle + (FIXED_PI >> 1));
}

/**
 * Arctangent2 (atan2) approximation
 * Returns angle in fixed-point radians
 */
export function atan2(y: number, x: number): number {
  if (x === 0 && y === 0) return 0;
  
  const absY = abs(y);
  const absX = abs(x);
  
  let angle: number;
  
  if (absX > absY) {
    // Use atan approximation
    const z = div(absY, absX);
    // Approximation: atan(z) ≈ z - z³/3 + z⁵/5 (simplified to z * (1 - z²/3))
    const zSquared = mul(z, z);
    const correction = div(mul(zSquared, toFixed(0.33)), FIXED_ONE);
    angle = mul(z, sub(FIXED_ONE, correction));
  } else {
    // Use atan approximation
    const z = div(absX, absY);
    const zSquared = mul(z, z);
    const correction = div(mul(zSquared, toFixed(0.33)), FIXED_ONE);
    angle = sub(FIXED_PI >> 1, mul(z, sub(FIXED_ONE, correction)));
  }
  
  // Adjust for quadrant
  if (x < 0) {
    angle = FIXED_PI - angle;
  }
  if (y < 0) {
    angle = -angle;
  }
  
  return angle;
}

/**
 * Get angle between two vectors
 */
export function angleBetween(x1: number, y1: number, x2: number, y2: number): number {
  const dx = x2 - x1;
  const dy = y2 - y1;
  return atan2(dy, dx);
}
