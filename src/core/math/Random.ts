/**
 * Deterministic Random Number Generator
 * 
 * Uses a Linear Congruential Generator (LCG) for deterministic pseudo-random numbers.
 * Same seed always produces the same sequence.
 */

import { toFixed } from './FixedPoint.js';

export class DeterministicRNG {
  private state: number;

  constructor(seed: number = 12345) {
    this.state = seed >>> 0; // Ensure unsigned 32-bit integer
  }

  /**
   * Set a new seed
   */
  setSeed(seed: number): void {
    this.state = seed >>> 0;
  }

  /**
   * Get current seed/state
   */
  getSeed(): number {
    return this.state;
  }

  /**
   * Generate next random integer (0 to 2^31-1)
   * Uses LCG: next = (a * state + c) mod m
   * Parameters from Numerical Recipes
   */
  nextInt(): number {
    // LCG parameters
    const a = 1664525;
    const c = 1013904223;
    
    this.state = ((a * this.state + c) >>> 0);
    return this.state >>> 1; // Return positive integer
  }

  /**
   * Generate random fixed-point number in range [0, 1)
   */
  nextFixed(): number {
    return toFixed(this.nextInt() / 0x7fffffff);
  }

  /**
   * Generate random floating-point number in range [0, 1)
   */
  nextFloat(): number {
    return this.nextInt() / 0x7fffffff;
  }

  /**
   * Generate random integer in range [min, max)
   */
  nextIntRange(min: number, max: number): number {
    const range = max - min;
    return min + (this.nextInt() % range);
  }

  /**
   * Generate random fixed-point number in range [min, max)
   */
  nextFixedRange(min: number, max: number): number {
    const range = max - min;
    const t = this.nextFixed();
    return min + ((t * range) >> 16);
  }

  /**
   * Generate random boolean
   */
  nextBool(): boolean {
    return (this.nextInt() & 1) === 1;
  }

  /**
   * Shuffle an array deterministically (Fisher-Yates)
   */
  shuffle<T>(array: T[]): T[] {
    const result = [...array];
    for (let i = result.length - 1; i > 0; i--) {
      const j = this.nextIntRange(0, i + 1);
      [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
  }

  /**
   * Clone the RNG with current state
   */
  clone(): DeterministicRNG {
    const rng = new DeterministicRNG();
    rng.state = this.state;
    return rng;
  }
}

// Global RNG instance
let globalRNG = new DeterministicRNG();

/**
 * Set global RNG seed
 */
export function setGlobalSeed(seed: number): void {
  globalRNG.setSeed(seed);
}

/**
 * Get global RNG instance
 */
export function getGlobalRNG(): DeterministicRNG {
  return globalRNG;
}

/**
 * Create a new RNG instance
 */
export function createRNG(seed?: number): DeterministicRNG {
  return new DeterministicRNG(seed);
}
