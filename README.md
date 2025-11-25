# 🏴‍☠️ Multiplayer Pirate Platformer

A 2-player cooperative pirate platformer built with **PartyKit** for multiplayer, **Pixi.js** for rendering, and **SAT.js** for collision detection. Deployable to any static host with edge-based WebSocket multiplayer.

## ✨ Features

- **Real-time Multiplayer**: WebSocket-based multiplayer using PartyKit on Cloudflare edge
- **Deterministic Physics**: Fixed-timestep physics (60fps) with integer-based coordinates for consistency
- **Client-Side Prediction**: Smooth gameplay with 3-frame input delay and optimistic updates
- **Host/Guest Model**: First player runs authoritative physics, second player predicts
- **Room System**: Simple room codes (e.g., `SHIP-4729`) for easy matchmaking
- **Pirate Theme**: Customizable for coconuts, flintlock pistols, rum bottles, doubloons, and ship cannons

## 🛠️ Tech Stack

- **PartyKit** - WebSocket server on Cloudflare edge
- **Pixi.js** - 2D WebGL/Canvas rendering
- **SAT.js** - Collision detection
- **TypeScript** - Type-safe development
- **Vite** - Fast build tool and dev server

## 📁 Project Structure

```
├── server/
│   └── party.ts          # PartyKit server (broadcasts inputs with frame stamps)
├── src/
│   ├── game/
│   │   ├── game.ts       # Main game logic, input handling, client prediction
│   │   ├── physics.ts    # Deterministic physics engine (shared client/host)
│   │   └── renderer.ts   # Pixi.js rendering layer
│   ├── types.ts          # Shared state interfaces
│   ├── sat.d.ts          # SAT.js type definitions
│   ├── index.ts          # Entry point
│   └── style.css         # Styles
├── index.html
├── package.json
├── partykit.json         # PartyKit configuration
├── tsconfig.json
└── vite.config.ts
```

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ and npm
- PartyKit account (free tier available)

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/jcameronjeff/piratical.git
   cd piratical
   git checkout pirate-platformer-clean
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start the development server:**
   ```bash
   npm run dev
   ```

4. **Open your browser:**
   - Navigate to the URL shown in the terminal (usually `http://localhost:3000`)
   - The game will generate a room code (e.g., `SHIP-4729`)
   - Share the URL with a friend to play together!

## 🎮 Controls

- **Arrow Keys / WASD**: Move left/right
- **Space / W / Up Arrow**: Jump
- **E / Z**: Action (for future features)

## 🏗️ Architecture

### Multiplayer Implementation

The game uses a **host/guest model** with deterministic lockstep:

- **Host**: First player to join runs authoritative physics
- **Guest**: Second player predicts locally and reconciles with host state
- **Input Delay**: 3 frames for smooth online play
- **Client Prediction**: Local inputs applied immediately for responsiveness

### Physics Engine

- **Integer-based coordinates** (x100 scale) for deterministic calculations
- **Fixed timestep** at 60fps
- **SAT.js** for collision detection
- Supports platforms, gravity, friction, and jumping

### PartyKit Server

Ultra-simple server that:
- Broadcasts player inputs to all connected clients
- Assigns host role to first player
- Manages room connections/disconnections

## 📦 Building & Deployment

### Build for Production

```bash
npm run build
```

This creates a `dist/` folder with static files ready for deployment.

### Deploy Frontend

Deploy the `dist/` folder to any static host:
- **Netlify**: Drag and drop `dist/` folder
- **Vercel**: `vercel deploy dist`
- **GitHub Pages**: Push `dist/` to `gh-pages` branch

### Deploy PartyKit Server

```bash
npx partykit deploy
```

This deploys the server to Cloudflare edge. Update the `host` in `src/game/game.ts` to point to your deployed PartyKit server.

## 🔧 Configuration

### PartyKit Configuration

Edit `partykit.json` to configure your PartyKit deployment:

```json
{
  "name": "pirate-platformer",
  "main": "server/party.ts",
  "compatibilityDate": "2024-05-24"
}
```

### Game Configuration

Key constants in `src/game/game.ts`:
- `FPS = 60` - Target framerate
- `INPUT_DELAY = 3` - Frames of input delay for networking

Physics constants in `src/game/physics.ts`:
- `SCALE = 100` - Integer physics multiplier
- `GRAVITY`, `JUMP_FORCE`, `MOVE_SPEED` - Tune gameplay feel

## 🎯 Future Enhancements

- [ ] Swimming mechanics
- [ ] Coconut power-ups (size-up)
- [ ] Flintlock pistol combat
- [ ] Rum bottles (health)
- [ ] Doubloons (collectibles)
- [ ] Ship cannons for transport
- [ ] Coyote time and jump buffering
- [ ] Rollback netcode for better reconciliation

## 📝 Development Notes

- Start with local 2-player (same keyboard) to test physics
- Add networking once physics feel perfect
- The game uses deterministic simulation - all clients run the same physics
- Inputs are timestamped and applied at specific frames for synchronization

## 📄 License

ISC

## 🙏 Acknowledgments

Built following the architecture pattern for deterministic multiplayer games with PartyKit, Pixi.js, and SAT.js.
