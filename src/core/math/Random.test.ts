/**
 * Deterministic RNG Tests
 */

import { DeterministicRNG, setGlobalSeed, getGlobalRNG } from './Random';

describe('DeterministicRNG', () => {
  describe('Basic Functionality', () => {
    it('should generate the same sequence with the same seed', () => {
      const rng1 = new DeterministicRNG(12345);
      const rng2 = new DeterministicRNG(12345);

      const sequence1 = Array.from({ length: 10 }, () => rng1.nextInt());
      const sequence2 = Array.from({ length: 10 }, () => rng2.nextInt());

      expect(sequence1).toEqual(sequence2);
    });

    it('should generate different sequences with different seeds', () => {
      const rng1 = new DeterministicRNG(12345);
      const rng2 = new DeterministicRNG(54321);

      const sequence1 = Array.from({ length: 10 }, () => rng1.nextInt());
      const sequence2 = Array.from({ length: 10 }, () => rng2.nextInt());

      expect(sequence1).not.toEqual(sequence2);
    });

    it('should allow resetting the seed', () => {
      const rng = new DeterministicRNG(12345);
      const value1 = rng.nextInt();
      
      rng.setSeed(12345);
      const value2 = rng.nextInt();

      expect(value1).toBe(value2);
    });
  });

  describe('Range Generation', () => {
    it('should generate integers in range', () => {
      const rng = new DeterministicRNG(12345);
      
      for (let i = 0; i < 100; i++) {
        const value = rng.nextIntRange(0, 10);
        expect(value).toBeGreaterThanOrEqual(0);
        expect(value).toBeLessThan(10);
      }
    });

    it('should generate floats in range [0, 1)', () => {
      const rng = new DeterministicRNG(12345);
      
      for (let i = 0; i < 100; i++) {
        const value = rng.nextFloat();
        expect(value).toBeGreaterThanOrEqual(0);
        expect(value).toBeLessThan(1);
      }
    });

    it('should generate boolean values', () => {
      const rng = new DeterministicRNG(12345);
      const values = Array.from({ length: 100 }, () => rng.nextBool());
      
      // Should have both true and false
      expect(values.some(v => v)).toBe(true);
      expect(values.some(v => !v)).toBe(true);
    });
  });

  describe('Shuffle', () => {
    it('should shuffle arrays deterministically', () => {
      const array = [1, 2, 3, 4, 5];
      
      const rng1 = new DeterministicRNG(12345);
      const rng2 = new DeterministicRNG(12345);
      
      const shuffled1 = rng1.shuffle(array);
      const shuffled2 = rng2.shuffle(array);

      expect(shuffled1).toEqual(shuffled2);
    });

    it('should contain all original elements', () => {
      const array = [1, 2, 3, 4, 5];
      const rng = new DeterministicRNG(12345);
      const shuffled = rng.shuffle(array);

      expect(shuffled.sort()).toEqual(array.sort());
    });
  });

  describe('Clone', () => {
    it('should clone RNG with same state', () => {
      const rng1 = new DeterministicRNG(12345);
      rng1.nextInt(); // Advance state
      
      const rng2 = rng1.clone();
      
      expect(rng1.nextInt()).toBe(rng2.nextInt());
    });
  });

  describe('Determinism Over Time', () => {
    it('should produce identical sequences over multiple runs', () => {
      const sequences: number[][] = [];

      for (let run = 0; run < 3; run++) {
        const rng = new DeterministicRNG(99999);
        const sequence: number[] = [];
        
        for (let i = 0; i < 1000; i++) {
          sequence.push(rng.nextInt());
        }
        
        sequences.push(sequence);
      }

      // All sequences should be identical
      expect(sequences[0]).toEqual(sequences[1]);
      expect(sequences[1]).toEqual(sequences[2]);
    });
  });

  describe('Global RNG', () => {
    it('should allow setting global seed', () => {
      setGlobalSeed(12345);
      const rng = getGlobalRNG();
      const value1 = rng.nextInt();

      setGlobalSeed(12345);
      const value2 = rng.nextInt();

      expect(value1).toBe(value2);
    });
  });
});
