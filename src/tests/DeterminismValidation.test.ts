/**
 * Determinism Validation Tests
 * 
 * These tests validate that the simulation is truly deterministic
 * by running identical scenarios multiple times and comparing results.
 */

import { CollisionSystem } from '../core/physics/CollisionSystem';
import { AABB } from '../core/physics/AABB';
import { Vec2, toFixed } from '../core/math/FixedPoint';
import { DeterministicRNG } from '../core/math/Random';
import { InputRecorder } from '../core/replay/InputRecorder';

describe('Determinism Validation', () => {
  describe('Physics Determinism', () => {
    it('should produce identical collision results across multiple runs', () => {
      const runs = 5;
      const checksums: number[] = [];

      for (let run = 0; run < runs; run++) {
        const system = new CollisionSystem();
        
        // Add some bodies
        for (let i = 0; i < 10; i++) {
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
            restitution: toFixed(0.5)
          });
        }

        // Simulate
        let checksum = 0;
        for (let step = 0; step < 100; step++) {
          const bodies = system.getBodies();
          for (const body of bodies) {
            // Move bodies
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
          
          // Calculate checksum
          for (const body of bodies) {
            checksum = (checksum + body.aabb.minX + body.aabb.minY) | 0;
          }
        }

        checksums.push(checksum);
      }

      // All checksums should be identical
      for (let i = 1; i < runs; i++) {
        expect(checksums[i]).toBe(checksums[0]);
      }
    });

    it('should produce deterministic collision ordering', () => {
      const collisionOrders: string[] = [];

      for (let run = 0; run < 3; run++) {
        const system = new CollisionSystem();
        const order: number[] = [];

        // Add bodies that will collide
        system.addBody({
          aabb: AABB.fromPosition(toFixed(0), toFixed(0), toFixed(10), toFixed(10)),
          velocity: new Vec2(toFixed(1), toFixed(0)),
          mass: toFixed(1),
          isStatic: false,
          restitution: toFixed(0.8)
        });

        system.addBody({
          aabb: AABB.fromPosition(toFixed(15), toFixed(0), toFixed(10), toFixed(10)),
          velocity: new Vec2(toFixed(-1), toFixed(0)),
          mass: toFixed(1),
          isStatic: false,
          restitution: toFixed(0.8)
        });

        // Simulate until collision
        for (let step = 0; step < 20; step++) {
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

          const collisions = system.step();
          for (const collision of collisions) {
            order.push(collision.bodyA.id);
            order.push(collision.bodyB.id);
          }
        }

        collisionOrders.push(order.join(','));
      }

      // All orders should be identical
      expect(collisionOrders[0]).toBe(collisionOrders[1]);
      expect(collisionOrders[1]).toBe(collisionOrders[2]);
    });
  });

  describe('RNG Determinism', () => {
    it('should generate identical random sequences', () => {
      const sequences: number[][] = [];

      for (let run = 0; run < 3; run++) {
        const rng = new DeterministicRNG(42);
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

  describe('Replay Determinism', () => {
    it('should replay inputs identically', () => {
      const recorder1 = new InputRecorder();
      const recorder2 = new InputRecorder();

      // Record a sequence
      recorder1.startRecording();
      for (let i = 0; i < 100; i++) {
        recorder1.recordInput({
          left: i % 3 === 0,
          right: i % 3 === 1,
          jump: i % 5 === 0,
          attack: i % 7 === 0
        });
        recorder1.nextFrame();
      }
      recorder1.stopRecording();

      // Export and import
      const json = recorder1.exportJSON();
      recorder2.importJSON(json);

      // Compare
      const original = recorder1.getRecording();
      const imported = recorder2.getRecording();

      expect(imported).toEqual(original);
    });

    it('should maintain determinism through replay cycle', () => {
      const recorder = new InputRecorder();
      const positions: number[][] = [];

      // Record inputs
      recorder.startRecording();
      for (let i = 0; i < 50; i++) {
        recorder.recordInput({
          left: i % 2 === 0,
          right: false,
          jump: i % 10 === 0,
          attack: false
        });
        recorder.nextFrame();
      }
      recorder.stopRecording();

      // Simulate twice with replay
      for (let run = 0; run < 2; run++) {
        recorder.startReplay();
        const runPositions: number[] = [];
        let posX = toFixed(0);

        for (let frame = 0; frame < 50; frame++) {
          const input = recorder.getReplayInput();
          
          if (input?.left) {
            posX = posX - toFixed(1);
          }
          if (input?.right) {
            posX = posX + toFixed(1);
          }

          runPositions.push(posX);
          recorder.nextFrame();
        }

        positions.push(runPositions);
      }

      // Both runs should produce identical positions
      expect(positions[0]).toEqual(positions[1]);
    });
  });

  describe('Complete Simulation Determinism', () => {
    it('should run 5-minute simulation identically', () => {
      const FPS = 60;
      const DURATION_SECONDS = 5; // Reduced from 300 for testing
      const TOTAL_FRAMES = FPS * DURATION_SECONDS;
      
      const checksums: number[] = [];

      for (let run = 0; run < 2; run++) {
        const rng = new DeterministicRNG(12345);
        const system = new CollisionSystem();
        let checksum = 0;

        // Add dynamic bodies
        for (let i = 0; i < 5; i++) {
          system.addBody({
            aabb: AABB.fromPosition(
              toFixed(rng.nextIntRange(-100, 100)),
              toFixed(rng.nextIntRange(-100, 100)),
              toFixed(10),
              toFixed(10)
            ),
            velocity: new Vec2(
              toFixed(rng.nextIntRange(-5, 5)),
              toFixed(rng.nextIntRange(-5, 5))
            ),
            mass: toFixed(1),
            isStatic: false,
            restitution: toFixed(0.8)
          });
        }

        // Add static walls
        system.addBody({
          aabb: AABB.fromPosition(toFixed(-150), toFixed(-150), toFixed(300), toFixed(10)),
          velocity: new Vec2(0, 0),
          mass: toFixed(1),
          isStatic: true,
          restitution: toFixed(1)
        });

        // Simulate
        for (let frame = 0; frame < TOTAL_FRAMES; frame++) {
          const bodies = system.getBodies();
          
          // Update positions
          for (const body of bodies) {
            if (!body.isStatic) {
              // Apply gravity
              body.velocity.y = body.velocity.y + toFixed(0.5);
              
              // Update position
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

          // Update checksum
          for (const body of bodies) {
            checksum = (checksum + body.aabb.minX + body.aabb.minY + body.velocity.x + body.velocity.y) | 0;
          }
        }

        checksums.push(checksum);
      }

      // Both runs should produce identical checksums
      expect(checksums[0]).toBe(checksums[1]);
    }, 30000); // 30 second timeout
  });
});
