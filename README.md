# Piratical

**Architecture-First Deterministic Multiplayer Pirate Platformer**

A theme-agnostic, deterministic, high-performance multiplayer platformer built with a phase-driven architecture. This project prioritizes unbreakable simulation core, enforcing separation of physics and rendering, strict determinism, and scalable content pipelines.

## 🎯 Project Vision

Build a multiplayer platformer from the ground up with determinism as the foundation, not an afterthought. By separating physics from rendering and using fixed-point math, we ensure pixel-perfect reproducibility across all platforms and network conditions.

## ✨ Current Features (Phase 1 Complete)

### Deterministic Simulation Core ✅

- **Fixed-Point Math System** (16.16 format)
  - Integer-only arithmetic for determinism
  - ~1,848 operations per millisecond
  - Full test coverage with determinism validation

- **Deterministic Trigonometry**
  - Lookup table-based sine/cosine (1024 entries)
  - Atan2 approximation for angle calculations
  - Guaranteed identical results across platforms

- **Seedable Random Number Generator**
  - Linear Congruential Generator (LCG)
  - ~65,749 numbers per millisecond
  - Perfect reproducibility with same seed

- **AABB Collision System**
  - Spatial hashing for O(n) broad-phase
  - Swept AABB collision detection
  - Deterministic collision ordering
  - Impulse-based physics resolution

- **Replay System**
  - Input recording with frame precision
  - JSON import/export for replays
  - Validated with 5-second deterministic replay tests

### Performance Benchmarks ✅

- **200 entities** at **1.23ms** average frame time (target: 16.67ms)
- **Spatial hash queries** in **0.035ms** average
- **Memory efficient**: Only 1.64MB increase over 1000 frames
- **Zero-GC target** ready for object pooling

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

```bash
git clone https://github.com/jcameronjeff/piratical.git
cd piratical
npm install
```

### Build

```bash
npm run build
```

### Test

```bash
npm test
```

### Run Example

```bash
npx tsx examples/simple-simulation.ts
```

## 📁 Project Structure

```
piratical/
├── src/
│   ├── core/
│   │   ├── math/           # Fixed-point math, trig, RNG
│   │   ├── physics/        # Collision detection & resolution
│   │   ├── replay/         # Input recording & replay
│   │   └── network/        # (Phase 2) Network layer
│   ├── game/               # (Phase 4+) Game-specific code
│   └── tests/              # Integration & validation tests
├── examples/               # Example simulations
└── dist/                   # Compiled output
```

## 🎮 API Overview

### Fixed-Point Math

```typescript
import { toFixed, toFloat, mul, div, Vec2 } from 'piratical';

// Convert to fixed-point
const a = toFixed(3.14);
const b = toFixed(2.0);

// Arithmetic operations
const result = mul(a, b);
console.log(toFloat(result)); // ~6.28

// Vector math
const v1 = Vec2.from(1.0, 2.0);
const v2 = Vec2.from(3.0, 4.0);
const sum = v1.add(v2);
```

### Collision System

```typescript
import { CollisionSystem, AABB, Vec2, toFixed } from 'piratical';

const collision = new CollisionSystem(64); // 64px cell size

// Add a dynamic body
const playerId = collision.addBody({
  aabb: AABB.fromPosition(toFixed(0), toFixed(0), toFixed(10), toFixed(10)),
  velocity: new Vec2(toFixed(5), toFixed(0)),
  mass: toFixed(1),
  isStatic: false,
  restitution: toFixed(0.5)
});

// Update and resolve collisions
const bodies = collision.getBodies();
for (const body of bodies) {
  // Update positions...
  collision.updateBody(body.id, body.aabb);
}
collision.step(); // Resolve all collisions
```

### Replay System

```typescript
import { InputRecorder } from 'piratical';

const recorder = new InputRecorder();

// Recording
recorder.startRecording();
for (let frame = 0; frame < 300; frame++) {
  recorder.recordInput({ left: true, right: false, jump: false, attack: false });
  recorder.nextFrame();
}
recorder.stopRecording();

// Export
const json = recorder.exportJSON();

// Replay
recorder.startReplay();
while (!recorder.isReplayFinished()) {
  const input = recorder.getReplayInput();
  // Use input...
  recorder.nextFrame();
}
```

## 🧪 Testing

All core systems have comprehensive test coverage:

- **Unit Tests**: Fixed-point math, RNG, collision primitives
- **Integration Tests**: Physics simulation, replay system
- **Determinism Tests**: Validates identical results across runs
- **Performance Tests**: Benchmarks against target metrics

```bash
npm test                    # Run all tests
npm run test:watch          # Watch mode
```

## 📊 Roadmap

### ✅ Phase 1: Deterministic Simulation Core (COMPLETE)
- Fixed-point math system
- Deterministic trigonometry
- Seedable RNG
- Collision system with spatial hashing
- Input recording & replay

### 🔄 Phase 2: Network Architecture (Next)
- Command pattern state management
- Ring buffer for input history
- State checksums & delta compression
- PartyKit integration
- Client-side prediction & rollback

### 📅 Phase 3: Performance Framework
- Memory management & object pools
- Pixi.js rendering integration
- Physics/render separation
- Performance monitoring

### 📅 Phase 4: Minimal Playable Game
- Core mechanics (run, jump, attack)
- Multiplayer synchronization
- Debug visualizations

### 📅 Phase 5-8: Future Phases
- Engine robustness (reconnection, host migration)
- Content pipeline (data-driven levels, ECS)
- Game content (pirate theme, levels, polish)
- Production hardening (observability, load testing)

## 🎯 Core Principles

1. **Never compromise determinism for features**
2. **Physics and rendering always separate**
3. **All state changes via commands**
4. **Network abstracted from game logic**
5. **Performance targets: 16ms/frame, 50KB/s**

## 🤝 Contributing

This project follows architecture-first development. Before contributing:

1. Understand the phase-driven roadmap
2. Maintain determinism in all simulation code
3. Follow the testing pyramid (unit → integration → e2e → perf)
4. Validate changes don't break determinism

## 📄 License

MIT

## 🙏 Acknowledgments

Built with architecture and determinism as first-class citizens, inspired by best practices from:
- Rollback netcode patterns (GGPO)
- Deterministic physics simulation
- ECS architecture patterns
