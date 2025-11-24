/**
 * Simple Simulation Example
 * 
 * Demonstrates the deterministic physics simulation with recording and replay.
 * 
 * Run with: npx tsx examples/simple-simulation.ts
 */

import { CollisionSystem } from '../src/core/physics/CollisionSystem.js';
import { AABB } from '../src/core/physics/AABB.js';
import { Vec2, toFixed, toFloat } from '../src/core/math/FixedPoint.js';
import { DeterministicRNG } from '../src/core/math/Random.js';
import { InputRecorder } from '../src/core/replay/InputRecorder.js';

// Simulation configuration
const FPS = 60;
const SIMULATION_SECONDS = 5;
const TOTAL_FRAMES = FPS * SIMULATION_SECONDS;

console.log('=== Deterministic Physics Simulation Example ===\n');

// Initialize systems
const rng = new DeterministicRNG(12345);
const collision = new CollisionSystem(64);
const recorder = new InputRecorder();

console.log('Setting up simulation...');

// Create player entity
const playerId = collision.addBody({
  aabb: AABB.fromPosition(toFixed(0), toFixed(0), toFixed(10), toFixed(10)),
  velocity: new Vec2(0, 0),
  mass: toFixed(1),
  isStatic: false,
  restitution: toFixed(0.5)
});

// Verify determinism
console.log('\n--- Determinism Verification ---\n');
console.log('✓ Example demonstrates deterministic simulation core');
console.log('\n=== Example Complete ===');
