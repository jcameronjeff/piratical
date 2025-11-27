import PartySocket from "partysocket";
import { PhysicsEngine } from "./physics";
import { GameRenderer } from "./renderer";
import { GameState, Input, SerializedGameState, PlayerState } from "../types";

const FPS = 60;
const FRAME_TIME = 1000 / FPS;
const INPUT_DELAY = 3;
const SYNC_INTERVAL = 60;
const SCALE = 100;

export class Game {
  private physics: PhysicsEngine;
  private renderer: GameRenderer;
  private socket: PartySocket;
  
  private state: GameState;
  private inputs: Map<number, Map<string, Input>>;
  
  private localPlayerId: string | null = null;
  private isHost = false;
  private running = false;
  
  private onReturnToMenu: (() => void) | null = null;

  private keys = {
    left: false,
    right: false,
    jump: false,
    action: false
  };

  constructor(renderer: GameRenderer, roomCode: string, onReturnToMenu?: () => void) {
    this.physics = new PhysicsEngine();
    this.renderer = renderer;
    this.onReturnToMenu = onReturnToMenu || null;
    
    this.inputs = new Map();
    
    this.state = {
      frame: 0,
      players: new Map(),
      entities: []
    };

    this.socket = new PartySocket({
      host: window.location.host,
      room: roomCode
    });

    this.socket.addEventListener("message", this.onMessage.bind(this));
    
    this.handleKeyDown = this.handleKeyDown.bind(this);
    this.handleKeyUp = this.handleKeyUp.bind(this);
  }

  private handleKeyDown(e: KeyboardEvent) {
    this.handleKey(e, true);
  }

  private handleKeyUp(e: KeyboardEvent) {
    this.handleKey(e, false);
  }

  private handleKey(e: KeyboardEvent, isDown: boolean) {
    switch(e.code) {
      case 'ArrowLeft': case 'KeyA': this.keys.left = isDown; break;
      case 'ArrowRight': case 'KeyD': this.keys.right = isDown; break;
      case 'Space': case 'ArrowUp': case 'KeyW': 
        this.keys.jump = isDown; 
        if (isDown) e.preventDefault();
        break;
      case 'KeyE': case 'KeyZ': this.keys.action = isDown; break;
      case 'Escape':
        if (isDown && this.onReturnToMenu) {
          this.stop();
          this.onReturnToMenu();
        }
        break;
    }
  }

  private onMessage(event: MessageEvent) {
    const msg = JSON.parse(event.data);
    
    if (msg.type === 'init') {
      this.localPlayerId = msg.playerId;
      this.isHost = msg.isHost;
      console.log(`Joined as ${this.localPlayerId}, Host: ${this.isHost}`);
      this.addPlayer(this.localPlayerId!, true);
    } else if (msg.type === 'join') {
      this.addPlayer(msg.playerId, false);
    } else if (msg.type === 'leave') {
      this.state.players.delete(msg.playerId);
    } else if (msg.type === 'input') {
      const { frame, playerId, ...inputData } = msg;
      if (!this.inputs.has(frame)) {
        this.inputs.set(frame, new Map());
      }
      this.inputs.get(frame)!.set(playerId, inputData);
    } else if (msg.type === 'state') {
      this.applyState(msg.state);
    }
  }

  private serializeState(): SerializedGameState {
    const playersObj: { [key: string]: PlayerState } = {};
    this.state.players.forEach((p, id) => {
      playersObj[id] = p;
    });

    return {
      frame: this.state.frame,
      players: playersObj,
      entities: this.state.entities
    };
  }

  private applyState(serialized: SerializedGameState) {
    this.state.frame = serialized.frame;
    this.state.entities = serialized.entities;
    
    const newPlayerIds = new Set(Object.keys(serialized.players));
    
    for (const id of this.state.players.keys()) {
      if (!newPlayerIds.has(id)) {
        this.state.players.delete(id);
      }
    }

    for (const id in serialized.players) {
      const serializedPlayer = serialized.players[id];
      
      if (this.state.players.has(id)) {
        const existing = this.state.players.get(id)!;
        Object.assign(existing, serializedPlayer);
      } else {
        this.state.players.set(id, serializedPlayer);
      }
    }
  }

  private addPlayer(id: string, isLocal: boolean) {
    if (!this.state.players.has(id)) {
      // Spawn at different positions based on player count
      const playerIndex = this.state.players.size;
      const spawnX = 100 + playerIndex * 100;
      
      this.state.players.set(id, {
        id,
        position: { x: spawnX * SCALE, y: 100 * SCALE },
        velocity: { x: 0, y: 0 },
        isGrounded: false,
        facingRight: true,
        width: 32,
        height: 32,
        color: isLocal ? 0xe74c3c : 0x3498db,
        sizeModifier: 1,
        health: 3,
        doubloons: 0,
        jumpHeld: false,
        isAttacking: false,
        attackFrame: 0,
        attackCooldown: 0,
        hasSword: true  // Multiplayer players start with sword
      });
    }
  }

  public async start() {
    await this.renderer.initialize(document.body);
    
    // Create default multiplayer map
    this.physics.createDefaultMap();
    this.renderer.setPhysics(this.physics);
    this.renderer.drawMap(this.physics);
    this.renderer.setupUI("Multiplayer Arena");
    
    window.addEventListener('keydown', this.handleKeyDown);
    window.addEventListener('keyup', this.handleKeyUp);
    
    this.running = true;
    this.loop();
  }

  public stop() {
    this.running = false;
    this.socket.close();
    window.removeEventListener('keydown', this.handleKeyDown);
    window.removeEventListener('keyup', this.handleKeyUp);
  }

  private lastTime = 0;
  private accumulator = 0;

  private loop(time: number = 0) {
    if (!this.running) return;
    
    const deltaTime = time - this.lastTime;
    this.lastTime = time;
    this.accumulator += deltaTime;

    while (this.accumulator >= FRAME_TIME) {
      this.fixedUpdate();
      this.accumulator -= FRAME_TIME;
    }

    this.renderer.render(this.state, this.localPlayerId || "");
    
    requestAnimationFrame((t) => this.loop(t));
  }

  private fixedUpdate() {
    if (!this.localPlayerId) return;

    const currentFrame = this.state.frame;

    const inputFrame = currentFrame + INPUT_DELAY;
    const localInput: Input = {
      frame: inputFrame,
      ...this.keys
    };

    this.socket.send(JSON.stringify({
      type: 'input',
      ...localInput
    }));

    if (!this.inputs.has(inputFrame)) {
      this.inputs.set(inputFrame, new Map());
    }
    this.inputs.get(inputFrame)!.set(this.localPlayerId, localInput);

    const frameInputs = this.inputs.get(currentFrame) || new Map();
    
    this.physics.step(this.state, frameInputs);
    
    if (this.isHost && currentFrame % SYNC_INTERVAL === 0) {
      const serialized = this.serializeState();
      this.socket.send(JSON.stringify({
        type: 'state',
        state: serialized
      }));
    }
    
    this.state.frame++;
  }
}
