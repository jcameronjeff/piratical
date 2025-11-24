# Piratical Architecture Documentation

## Overview

Piratical is built with an architecture-first approach, prioritizing determinism, performance, and clean separation of concerns. This document explains the architectural decisions and design patterns used throughout the codebase.

## Core Principles

1. **Determinism Above All**: Same inputs always produce same outputs
2. **Physics/Rendering Separation**: Simulation runs independently of display
3. **Command-Driven State**: All changes go through command pattern
4. **Network Agnostic Logic**: Game logic knows nothing about network layer
5. **Performance Targets**: 16ms/frame, 50KB/s network bandwidth

## System Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Presentation Layer                    │
│  (Future: Pixi.js, UI, Particles, Audio, Visual FX)    │
└────────────────────┬────────────────────────────────────┘
                     │ Render Commands
                     ▼
┌─────────────────────────────────────────────────────────┐
│                     Game Logic Layer                     │
│  (Entity Management, Game Rules, Scoring, Spawning)     │
└────────────────────┬────────────────────────────────────┘
                     │ Game Commands
                     ▼
┌─────────────────────────────────────────────────────────┐
│                   Simulation Layer                       │
│  ┌─────────────┐  ┌──────────────┐  ┌───────────────┐  │
│  │   Physics   │  │    State     │  │    Replay     │  │
│  │  Collision  │  │  Management  │  │   Recording   │  │
│  └─────────────┘  └──────────────┘  └───────────────┘  │
└────────────────────┬────────────────────────────────────┘
                     │ Deterministic Operations
                     ▼
┌─────────────────────────────────────────────────────────┐
│                    Foundation Layer                      │
│  ┌─────────────┐  ┌──────────────┐  ┌───────────────┐  │
│  │ Fixed-Point │  │  Trig Tables │  │      RNG      │  │
│  │    Math     │  │   (Sin/Cos)  │  │   (Seeded)    │  │
│  └─────────────┘  └──────────────┘  └───────────────┘  │
└─────────────────────────────────────────────────────────┘
```

## Phase 1: Deterministic Simulation Core

### Fixed-Point Mathematics

**Purpose**: Ensure identical calculations across all platforms and architectures.

**Implementation**:
- 16.16 fixed-point format (16 bits integer, 16 bits fractional)
- All arithmetic operations on integers only
- ~1,700 operations per millisecond

**Key Files**:
- `src/core/math/FixedPoint.ts` - Core math operations
- `src/core/math/Trig.ts` - Lookup table trigonometry
- `src/core/math/Random.ts` - Deterministic RNG

**Design Decisions**:
- Using 16.16 instead of floating-point eliminates rounding errors
- Lookup tables for trig (1024 entries) trade memory for speed and determinism
- LCG for RNG ensures reproducibility with same seed

### Collision System

**Purpose**: Fast, deterministic collision detection and resolution.

**Implementation**:
- Spatial hashing for O(n) broad-phase detection
- AABB collision with swept tests
- Impulse-based physics resolution
- Deterministic collision ordering (sorted by entity ID)

**Key Files**:
- `src/core/physics/AABB.ts` - Bounding box primitives
- `src/core/physics/SpatialHash.ts` - Spatial partitioning
- `src/core/physics/CollisionSystem.ts` - Detection and resolution

**Design Decisions**:
- Spatial hash over quadtree for predictable performance
- Cell size of 64px balances memory and query speed
- Deterministic ordering prevents different results based on iteration order

### Replay System

**Purpose**: Record and replay inputs for debugging and validation.

**Implementation**:
- Frame-indexed input recording
- JSON serialization for sharing replays
- Validation through checksum comparison

**Key Files**:
- `src/core/replay/InputRecorder.ts`

**Design Decisions**:
- Frame-based rather than time-based for exact replay
- Lightweight input-only recording (not full state snapshots)
- JSON format for human-readable debugging

## Phase 2: Network Architecture

### Command Pattern

**Purpose**: All state changes must be observable, reversible, and networkable.

**Implementation**:
- Commands carry type, frame number, and parameters
- Command queue buffers commands by frame
- Deterministic execution order within a frame

**Key Files**:
- `src/core/state/Command.ts`

**Design Decisions**:
- Commands are immutable (readonly properties)
- Frame-indexed storage enables rollback
- Support for multiple commands per frame

### State Management

**Purpose**: Complete game state that can be snapshot, restored, and verified.

**Implementation**:
- Entity-Component model (without full ECS yet)
- Snapshot creation and restoration
- Checksum calculation for desync detection
- JSON serialization for network sync

**Key Files**:
- `src/core/state/GameState.ts`

**Design Decisions**:
- Separate maps for entities, players, and bodies
- Immutable snapshots enable time-travel
- Checksums use sorted iteration for determinism

### Ring Buffers

**Purpose**: Efficient storage of input history for rollback netcode.

**Implementation**:
- Fixed-size circular buffer
- O(1) access to recent frames
- Frame-indexed variant for sparse data

**Key Files**:
- `src/core/network/RingBuffer.ts`

**Design Decisions**:
- Fixed size prevents unbounded memory growth
- Circular structure avoids array shifting
- Generic implementation supports any data type

### Checksum Validation

**Purpose**: Detect when clients diverge in multiplayer.

**Implementation**:
- FNV-1a hash for data checksums
- State-based checksums from sorted entity data
- History tracking for divergence point detection

**Key Files**:
- `src/core/network/StateChecksum.ts`

**Design Decisions**:
- Frame-indexed checksums enable bisection search
- Limited history (300 frames) for memory management
- Export/import for debugging desync issues

## Data Flow

### Simulation Tick

```
1. Read inputs from network/local
2. Add inputs to command queue
3. Execute commands for current frame
4. Update physics (gravity, movement)
5. Detect and resolve collisions
6. Calculate state checksum
7. Advance to next frame
8. Send checksum to peers (multiplayer)
```

### Rollback Flow (Future)

```
1. Detect checksum mismatch at frame N
2. Load snapshot from frame N-K
3. Replay commands from N-K to N
4. Compare checksums
5. If match: continue from frame N
6. If mismatch: repeat with earlier snapshot
```

## Performance Characteristics

### Computational Complexity

- **Fixed-point operations**: O(1)
- **Collision broad-phase**: O(n) with spatial hash
- **Collision narrow-phase**: O(n²) worst case, O(n) typical
- **Command execution**: O(c) where c = commands per frame
- **State checksum**: O(e) where e = entity count

### Memory Usage

- **Fixed-point math**: Zero allocations
- **Spatial hash**: O(n) for entities + O(c) for cells
- **Ring buffer**: O(k) fixed size
- **Command queue**: O(f × c) where f = future frames buffered

### Benchmarks (Current)

- 200 entities: 1.23ms average frame time
- Spatial queries: 0.035ms average
- Fixed-point ops: 1,700/ms
- RNG generation: 67,000/ms
- Memory growth: 1.63MB per 1000 frames

## Testing Strategy

### Test Pyramid

```
        ┌─────────┐
        │   E2E   │  Multiplayer integration (future)
        └─────────┘
      ┌─────────────┐
      │ Integration │  Physics simulation, replay
      └─────────────┘
    ┌─────────────────┐
    │      Unit       │  Math, collision primitives, RNG
    └─────────────────┘
  ┌───────────────────────┐
  │     Validation        │  Determinism, performance
  └───────────────────────┘
```

### Determinism Validation

- Run simulation twice with same seed
- Compare checksums at every frame
- Verify identical entity positions
- Current: 5-second validation passing

### Performance Validation

- Benchmark against target frame time (16.67ms)
- Memory leak detection over extended runs
- Stress testing with high entity counts

## Future Architecture

### Phase 3: Performance Framework

- Object pooling for zero-GC operation
- Typed arrays for cache-friendly data
- Pixi.js integration with batch rendering
- Frame time monitoring and quality scaling

### Phase 4: Minimal Playable Game

- ECS architecture for game entities
- Input handling and player controller
- Basic game mechanics (run, jump, attack)
- Multiplayer synchronization

### Phase 5+: Production Features

- Host migration and reconnection
- Spectator mode
- Level editor and data-driven content
- Asset pipeline with CDN integration

## Code Organization

```
src/
├── core/              # Core engine systems
│   ├── math/          # Fixed-point, trig, RNG
│   ├── physics/       # Collision detection/resolution
│   ├── replay/        # Input recording
│   ├── state/         # Game state management
│   └── network/       # Network infrastructure
├── game/              # Game-specific logic (future)
├── tests/             # Integration tests
└── index.ts           # Public API

examples/              # Example applications
dist/                  # Compiled output
```

## Key Design Patterns

1. **Command Pattern**: All state changes
2. **Snapshot/Memento**: State rollback
3. **Object Pool**: Memory management (future)
4. **Spatial Hash**: Collision optimization
5. **Ring Buffer**: Fixed-size history
6. **Observer**: Event system (future)

## Contributing Guidelines

When adding new features:

1. **Maintain Determinism**: Use fixed-point math, no floats in simulation
2. **Command Pattern**: State changes via commands only
3. **Test Coverage**: Unit + integration + determinism validation
4. **Performance**: Profile against 16ms frame budget
5. **Documentation**: Update this file for architectural changes

## References

- Rollback Netcode: GGPO architecture
- Fixed-Point Math: Q16.16 format standard
- Spatial Hashing: Grid-based broad-phase collision
- Command Pattern: Gang of Four
- Deterministic Simulation: Lockstep and client-side prediction
