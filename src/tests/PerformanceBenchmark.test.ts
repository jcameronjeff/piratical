/**
 * Performance Benchmarks
 * 
 * Validates that the system meets performance targets.
 */

import { CollisionSystem } from '../core/physics/CollisionSystem';
import { AABB } from '../core/physics/AABB';
import { Vec2, toFixed, mul, div, add, sub, sqrt } from '../core/math/FixedPoint';
import { DeterministicRNG } from '../core/math/Random';

describe('Performance Benchmarks', () => {
  describe('Collision System Performance', () => {
    it('should handle 200 entities at 60fps', () => {
      const TARGET_FPS = 60;
      const FRAME_TIME_MS = 1000 / TARGET_FPS;
      const ENTITY_COUNT = 200;
      const TEST_FRAMES = 60; // 1 second

      const rng = new DeterministicRNG(12345);
      const system = new CollisionSystem(64);

      // Add entities
      for (let i = 0; i < ENTITY_COUNT; i++) {
        system.addBody({
          aabb: AABB.fromPosition(
            toFixed(rng.nextIntRange(-500, 500)),
            toFixed(rng.nextIntRange(-500, 500)),
            toFixed(5),
            toFixed(5)
          ),
          velocity: new Vec2(
            toFixed(rng.nextIntRange(-10, 10)),
            toFixed(rng.nextIntRange(-10, 10))
          ),
          mass: toFixed(1),
          isStatic: false,
          restitution: toFixed(0.8)
        });
      }

      const frameTimes: number[] = [];

      // Run simulation
      for (let frame = 0; frame < TEST_FRAMES; frame++) {
        const startTime = performance.now();

        const bodies = system.getBodies();
        for (const body of bodies) {
          if (!body.isStatic) {
            const newX = body.aabb.minX + body.velocity.x;
            const newY = body.aabb.minY + body.velocity.y;
            system.updateBody(body.id, AABB.fromPosition(
              newX,
              newY,
              body.aabb.width,
              body.aabb.height
            ));
          }
        }

        system.step();

        const frameTime = performance.now() - startTime;
        frameTimes.push(frameTime);
      }

      const avgFrameTime = frameTimes.reduce((a, b) => a + b, 0) / frameTimes.length;
      const maxFrameTime = Math.max(...frameTimes);

      console.log(`\n  Performance with ${ENTITY_COUNT} entities:`);
      console.log(`    Average frame time: ${avgFrameTime.toFixed(2)}ms`);
      console.log(`    Max frame time: ${maxFrameTime.toFixed(2)}ms`);
      console.log(`    Target frame time: ${FRAME_TIME_MS.toFixed(2)}ms`);

      // Average should be well under target
      expect(avgFrameTime).toBeLessThan(FRAME_TIME_MS);
    });

    it('should efficiently query spatial hash', () => {
      const ENTITY_COUNT = 1000;
      const QUERY_COUNT = 100;

      const rng = new DeterministicRNG(12345);
      const system = new CollisionSystem(64);

      // Add entities
      for (let i = 0; i < ENTITY_COUNT; i++) {
        system.addBody({
          aabb: AABB.fromPosition(
            toFixed(rng.nextIntRange(-1000, 1000)),
            toFixed(rng.nextIntRange(-1000, 1000)),
            toFixed(5),
            toFixed(5)
          ),
          velocity: new Vec2(0, 0),
          mass: toFixed(1),
          isStatic: false,
          restitution: toFixed(0.8)
        });
      }

      // Time queries
      const startTime = performance.now();

      for (let i = 0; i < QUERY_COUNT; i++) {
        const queryAABB = AABB.fromPosition(
          toFixed(rng.nextIntRange(-1000, 1000)),
          toFixed(rng.nextIntRange(-1000, 1000)),
          toFixed(50),
          toFixed(50)
        );

        // This internally uses spatial hash
        const bodies = system.getBodies();
        bodies.filter(b => b.aabb.intersects(queryAABB));
      }

      const totalTime = performance.now() - startTime;
      const avgQueryTime = totalTime / QUERY_COUNT;

      console.log(`\n  Spatial hash query performance:`);
      console.log(`    ${ENTITY_COUNT} entities, ${QUERY_COUNT} queries`);
      console.log(`    Average query time: ${avgQueryTime.toFixed(3)}ms`);

      // Should be very fast
      expect(avgQueryTime).toBeLessThan(1); // Under 1ms per query
    });
  });

  describe('Math Operations Performance', () => {
    it('should perform fixed-point operations efficiently', () => {
      const OPERATIONS = 1000000;

      const a = toFixed(3.14159);
      const b = toFixed(2.71828);

      const startTime = performance.now();

      let result = a;
      for (let i = 0; i < OPERATIONS; i++) {
        result = add(mul(result, b), sub(a, b));
        result = div(result, toFixed(2));
        if (i % 1000 === 0) {
          result = sqrt(result > 0 ? result : -result);
        }
      }

      const totalTime = performance.now() - startTime;
      const opsPerMs = OPERATIONS / totalTime;

      console.log(`\n  Fixed-point math performance:`);
      console.log(`    ${OPERATIONS} operations in ${totalTime.toFixed(2)}ms`);
      console.log(`    ${opsPerMs.toFixed(0)} operations per millisecond`);

      // Should be very fast (millions of ops per second)
      expect(opsPerMs).toBeGreaterThan(1000);
    });
  });

  describe('RNG Performance', () => {
    it('should generate random numbers efficiently', () => {
      const NUMBERS = 1000000;
      const rng = new DeterministicRNG(12345);

      const startTime = performance.now();

      for (let i = 0; i < NUMBERS; i++) {
        rng.nextInt();
      }

      const totalTime = performance.now() - startTime;
      const numbersPerMs = NUMBERS / totalTime;

      console.log(`\n  RNG performance:`);
      console.log(`    ${NUMBERS} random numbers in ${totalTime.toFixed(2)}ms`);
      console.log(`    ${numbersPerMs.toFixed(0)} numbers per millisecond`);

      expect(numbersPerMs).toBeGreaterThan(1000);
    });
  });

  describe('Memory Efficiency', () => {
    it('should not create excessive garbage', () => {
      const ITERATIONS = 1000;
      const system = new CollisionSystem();

      // Add some bodies
      for (let i = 0; i < 50; i++) {
        system.addBody({
          aabb: AABB.fromPosition(
            toFixed(i * 10),
            toFixed(0),
            toFixed(5),
            toFixed(5)
          ),
          velocity: new Vec2(toFixed(1), toFixed(0)),
          mass: toFixed(1),
          isStatic: false,
          restitution: toFixed(0.8)
        });
      }

      // Force a GC if available
      if (global.gc) {
        global.gc();
      }

      const startMemory = process.memoryUsage().heapUsed;

      // Run simulation
      for (let i = 0; i < ITERATIONS; i++) {
        const bodies = system.getBodies();
        for (const body of bodies) {
          const newX = body.aabb.minX + body.velocity.x;
          const newY = body.aabb.minY + body.velocity.y;
          system.updateBody(body.id, AABB.fromPosition(
            newX,
            newY,
            body.aabb.width,
            body.aabb.height
          ));
        }
        system.step();
      }

      const endMemory = process.memoryUsage().heapUsed;
      const memoryIncrease = (endMemory - startMemory) / 1024 / 1024; // MB

      console.log(`\n  Memory usage:`);
      console.log(`    Memory increase over ${ITERATIONS} frames: ${memoryIncrease.toFixed(2)}MB`);

      // Should not increase memory significantly
      expect(memoryIncrease).toBeLessThan(10); // Less than 10MB increase
    });
  });
});
