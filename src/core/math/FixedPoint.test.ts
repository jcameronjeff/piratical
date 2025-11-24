/**
 * Fixed-Point Math Tests
 * 
 * Tests for determinism and correctness of fixed-point operations.
 */

import {
  toFixed,
  toFloat,
  mul,
  div,
  add,
  sub,
  abs,
  min,
  max,
  sqrt,
  Vec2,
} from './FixedPoint';

describe('FixedPoint Math', () => {
  describe('Conversion', () => {
    it('should convert to and from fixed-point', () => {
      expect(toFloat(toFixed(1.0))).toBeCloseTo(1.0, 5);
      expect(toFloat(toFixed(0.5))).toBeCloseTo(0.5, 5);
      expect(toFloat(toFixed(-1.5))).toBeCloseTo(-1.5, 5);
    });

    it('should be deterministic', () => {
      const value = 3.14159;
      const fixed1 = toFixed(value);
      const fixed2 = toFixed(value);
      expect(fixed1).toBe(fixed2);
    });
  });

  describe('Basic Operations', () => {
    it('should add correctly', () => {
      const a = toFixed(2.5);
      const b = toFixed(1.5);
      const result = add(a, b);
      expect(toFloat(result)).toBeCloseTo(4.0, 5);
    });

    it('should subtract correctly', () => {
      const a = toFixed(5.0);
      const b = toFixed(2.0);
      const result = sub(a, b);
      expect(toFloat(result)).toBeCloseTo(3.0, 5);
    });

    it('should multiply correctly', () => {
      const a = toFixed(3.0);
      const b = toFixed(2.0);
      const result = mul(a, b);
      expect(toFloat(result)).toBeCloseTo(6.0, 5);
    });

    it('should divide correctly', () => {
      const a = toFixed(6.0);
      const b = toFixed(2.0);
      const result = div(a, b);
      expect(toFloat(result)).toBeCloseTo(3.0, 5);
    });

    it('should handle division by zero', () => {
      const a = toFixed(5.0);
      const result = div(a, 0);
      expect(result).toBe(0);
    });
  });

  describe('Advanced Operations', () => {
    it('should calculate absolute value', () => {
      expect(abs(toFixed(-5.0))).toBe(toFixed(5.0));
      expect(abs(toFixed(5.0))).toBe(toFixed(5.0));
    });

    it('should calculate minimum', () => {
      const a = toFixed(3.0);
      const b = toFixed(5.0);
      expect(min(a, b)).toBe(a);
    });

    it('should calculate maximum', () => {
      const a = toFixed(3.0);
      const b = toFixed(5.0);
      expect(max(a, b)).toBe(b);
    });

    it('should calculate square root', () => {
      const result = sqrt(toFixed(9.0));
      expect(toFloat(result)).toBeCloseTo(3.0, 2);
    });

    it('should handle square root of zero', () => {
      expect(sqrt(0)).toBe(0);
    });
  });

  describe('Vec2', () => {
    it('should create vectors', () => {
      const v = Vec2.from(1.0, 2.0);
      expect(toFloat(v.x)).toBeCloseTo(1.0, 5);
      expect(toFloat(v.y)).toBeCloseTo(2.0, 5);
    });

    it('should add vectors', () => {
      const a = Vec2.from(1.0, 2.0);
      const b = Vec2.from(3.0, 4.0);
      const result = a.add(b);
      expect(toFloat(result.x)).toBeCloseTo(4.0, 5);
      expect(toFloat(result.y)).toBeCloseTo(6.0, 5);
    });

    it('should subtract vectors', () => {
      const a = Vec2.from(5.0, 6.0);
      const b = Vec2.from(2.0, 3.0);
      const result = a.sub(b);
      expect(toFloat(result.x)).toBeCloseTo(3.0, 5);
      expect(toFloat(result.y)).toBeCloseTo(3.0, 5);
    });

    it('should calculate dot product', () => {
      const a = Vec2.from(1.0, 2.0);
      const b = Vec2.from(3.0, 4.0);
      const result = a.dot(b);
      expect(toFloat(result)).toBeCloseTo(11.0, 5);
    });

    it('should calculate length', () => {
      const v = Vec2.from(3.0, 4.0);
      const length = v.length();
      expect(toFloat(length)).toBeCloseTo(5.0, 2);
    });

    it('should normalize vectors', () => {
      const v = Vec2.from(3.0, 4.0);
      const normalized = v.normalize();
      const length = normalized.length();
      expect(toFloat(length)).toBeCloseTo(1.0, 2);
    });
  });

  describe('Determinism', () => {
    it('should produce identical results across multiple runs', () => {
      const runs = 10;
      const results: number[] = [];

      for (let i = 0; i < runs; i++) {
        const a = toFixed(1.5);
        const b = toFixed(2.7);
        const result = mul(add(a, b), sub(b, a));
        results.push(result);
      }

      // All results should be identical
      const first = results[0];
      for (const result of results) {
        expect(result).toBe(first);
      }
    });

    it('should handle complex calculations deterministically', () => {
      const iterations = 100;
      const checksums: number[] = [];

      for (let run = 0; run < 3; run++) {
        let checksum = 0;
        let value = toFixed(1.0);

        for (let i = 0; i < iterations; i++) {
          value = add(value, toFixed(0.1));
          value = mul(value, toFixed(0.99));
          checksum = add(checksum, value);
        }

        checksums.push(checksum);
      }

      // All checksums should be identical
      expect(checksums[0]).toBe(checksums[1]);
      expect(checksums[1]).toBe(checksums[2]);
    });
  });
});
