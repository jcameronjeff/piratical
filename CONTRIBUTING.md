# Contributing to Piratical

Thank you for your interest in contributing to Piratical! This document provides guidelines and best practices for contributing to this architecture-first, deterministic multiplayer platformer.

## Core Principles

Before contributing, please understand these non-negotiable principles:

1. **Never compromise determinism for features**
2. **Physics and rendering must remain separate**
3. **All state changes must go through commands**
4. **Network layer must be abstracted from game logic**
5. **Performance targets: 16ms/frame, 50KB/s bandwidth**

## Getting Started

### Prerequisites

- Node.js 18 or higher
- npm or yarn
- TypeScript knowledge
- Understanding of game physics and netcode (helpful)

### Setup

```bash
git clone https://github.com/jcameronjeff/piratical.git
cd piratical
npm install
npm run build
npm test
```

### Project Structure

```
src/
├── core/              # Core engine (deterministic, network-agnostic)
│   ├── math/          # Fixed-point math, trig, RNG
│   ├── physics/       # Collision detection and resolution
│   ├── replay/        # Input recording and replay
│   ├── state/         # State management and commands
│   └── network/       # Network infrastructure
├── game/              # Game-specific logic (future)
├── tests/             # Integration and validation tests
└── index.ts           # Public API
```

## Development Workflow

### Making Changes

1. **Create a branch** from `main`:
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes** following the guidelines below

3. **Write tests** for your changes:
   ```bash
   npm test              # Run all tests
   npm run test:watch    # Watch mode
   ```

4. **Build and lint**:
   ```bash
   npm run build
   npm run lint
   ```

5. **Commit with clear messages**:
   ```bash
   git commit -m "Add feature: your feature description"
   ```

6. **Push and create a pull request**

### Code Style

- **TypeScript Strict Mode**: All code must compile with strict settings
- **ESLint**: Follow the project's ESLint configuration
- **Naming**:
  - `camelCase` for variables and functions
  - `PascalCase` for classes and types
  - `UPPER_SNAKE_CASE` for constants
- **Comments**: Use JSDoc for public APIs

### Testing Requirements

All contributions must include appropriate tests:

#### Unit Tests
For isolated functions and classes:

```typescript
describe('YourFeature', () => {
  it('should do something specific', () => {
    const result = yourFunction(input);
    expect(result).toBe(expected);
  });
});
```

#### Determinism Tests
For simulation code, verify determinism:

```typescript
it('should produce identical results across runs', () => {
  const results = [];
  for (let run = 0; run < 3; run++) {
    const rng = new DeterministicRNG(12345);
    // ... run simulation
    results.push(checksum);
  }
  
  expect(results[0]).toBe(results[1]);
  expect(results[1]).toBe(results[2]);
});
```

#### Performance Tests
For performance-critical code:

```typescript
it('should meet performance target', () => {
  const start = performance.now();
  // ... run operation many times
  const avgTime = (performance.now() - start) / iterations;
  
  expect(avgTime).toBeLessThan(targetTime);
});
```

## Determinism Guidelines

### DO ✅

- Use fixed-point math for all simulation calculations
- Use lookup tables for trigonometry
- Use seeded RNG for randomness
- Sort collections before iterating (for deterministic order)
- Use integer timestamps (frame numbers) not wall-clock time
- Write determinism validation tests

### DON'T ❌

- Use floating-point math in simulation code
- Use `Math.random()` or `Date.now()` in simulation
- Use `Map` or `Set` iteration without sorting
- Use asynchronous operations in simulation
- Use platform-specific features
- Assume deterministic timing

### Example: Converting Float to Fixed-Point

**Bad** (non-deterministic):
```typescript
const velocity = 5.5; // floating point
entity.x += velocity * deltaTime;
```

**Good** (deterministic):
```typescript
import { toFixed, add, mul } from './core/math/FixedPoint';

const velocity = toFixed(5.5); // convert to fixed-point
const newX = add(entity.x, mul(velocity, deltaTime));
```

## Command Pattern Guidelines

All state changes must go through commands:

### Creating a New Command

```typescript
// 1. Define the command interface
export interface YourCommand extends Command {
  readonly type: 'your_command';
  readonly param1: number; // Use fixed-point
  readonly param2: number;
}

// 2. Update GameCommand union type
export type GameCommand = 
  | MoveCommand 
  | JumpCommand 
  | YourCommand; // Add here

// 3. Implement command handler
function executeYourCommand(state: GameState, cmd: YourCommand): void {
  // Apply state changes
  const entity = state.getEntity(cmd.entityId);
  if (entity) {
    // ... modify entity
  }
}
```

### Why Commands?

- **Replay**: Commands can be recorded and replayed
- **Network**: Commands are small and easy to send
- **Rollback**: Commands can be re-executed after rollback
- **Testing**: Commands make state changes explicit

## Performance Guidelines

### Target Metrics

- **Frame Time**: < 16.67ms (60 FPS)
- **Memory Growth**: < 5MB per 1000 frames
- **Network**: < 50KB/s per client

### Optimization Tips

1. **Avoid Allocations**:
   ```typescript
   // Bad
   function update() {
     const temp = new Vec2(x, y); // Allocation every frame
   }
   
   // Good
   const reusableVec = new Vec2(0, 0); // Reuse
   function update() {
     reusableVec.x = x;
     reusableVec.y = y;
   }
   ```

2. **Use Spatial Structures**:
   ```typescript
   // Bad: O(n²) collision check
   for (const a of entities) {
     for (const b of entities) {
       checkCollision(a, b);
     }
   }
   
   // Good: O(n) with spatial hash
   for (const a of entities) {
     const nearby = spatialHash.query(a.bounds);
     for (const b of nearby) {
       checkCollision(a, b);
     }
   }
   ```

3. **Profile Before Optimizing**:
   ```typescript
   it('should profile performance', () => {
     const start = performance.now();
     // ... your code
     const duration = performance.now() - start;
     console.log(`Operation took ${duration}ms`);
   });
   ```

## Documentation

### Code Comments

Use JSDoc for public APIs:

```typescript
/**
 * Calculate the sum of two fixed-point numbers
 * 
 * @param a - First fixed-point number
 * @param b - Second fixed-point number
 * @returns The sum as a fixed-point number
 * 
 * @example
 * ```typescript
 * const result = add(toFixed(1.5), toFixed(2.5));
 * console.log(toFloat(result)); // 4.0
 * ```
 */
export function add(a: number, b: number): number {
  return (a + b) | 0;
}
```

### README Updates

Update README.md when:
- Adding major features
- Changing API
- Updating performance characteristics
- Modifying project structure

### Architecture Updates

Update ARCHITECTURE.md when:
- Adding new systems
- Changing core design patterns
- Modifying data flow
- Updating performance targets

## Pull Request Process

1. **Title**: Clear, descriptive title (e.g., "Add spatial hashing to collision system")

2. **Description**: Include:
   - What changes were made
   - Why they were made
   - Performance impact (if applicable)
   - Test coverage

3. **Checklist**:
   - [ ] All tests pass
   - [ ] No linting errors
   - [ ] Determinism validated (if applicable)
   - [ ] Performance benchmarked (if applicable)
   - [ ] Documentation updated
   - [ ] Examples updated (if API changed)

4. **Review**: Wait for review and address feedback

## Common Pitfalls

### 1. Floating-Point Creep

```typescript
// Wrong - introduces floating point
const speed = entity.maxSpeed * 0.8;

// Right - keep everything fixed-point
const speed = mul(entity.maxSpeed, toFixed(0.8));
```

### 2. Non-Deterministic Iteration

```typescript
// Wrong - Map iteration order is not guaranteed
for (const [id, entity] of entities) {
  processEntity(entity);
}

// Right - sort before iterating
const sorted = Array.from(entities.values())
  .sort((a, b) => a.id - b.id);
for (const entity of sorted) {
  processEntity(entity);
}
```

### 3. Async in Simulation

```typescript
// Wrong - async makes simulation non-deterministic
async function update() {
  const data = await fetchData();
  entity.health = data.health;
}

// Right - load async, apply synchronously
function update(preloadedData) {
  entity.health = preloadedData.health;
}
```

## Getting Help

- **Questions**: Open a GitHub Discussion
- **Bugs**: Open a GitHub Issue with reproduction steps
- **Chat**: Join our Discord (future)
- **Documentation**: Check ARCHITECTURE.md and README.md

## Code of Conduct

- Be respectful and constructive
- Focus on what's best for the project
- Accept feedback gracefully
- Help others learn

## License

By contributing, you agree that your contributions will be licensed under the project's MIT License.

---

Thank you for contributing to Piratical! Your efforts help build a robust, deterministic multiplayer platformer that serves as a reference for others.
