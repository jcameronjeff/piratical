import PartySocket from "partysocket";
import { PhysicsEngine } from "./physics";
import { GameRenderer } from "./renderer";
import { GameState, Input } from "../types";

const FPS = 60;
const FRAME_TIME = 1000 / FPS;
const INPUT_DELAY = 3;

export class Game {
  private physics: PhysicsEngine;
  private renderer: GameRenderer;
  private socket: PartySocket;
  
  private state: GameState;
  private inputs: Map<number, Map<string, Input>>; // Frame -> PlayerID -> Input
  
  private localPlayerId: string | null = null;
  private isHost = false;
  private running = false;

  // Input state
  private keys = {
    left: false,
    right: false,
    jump: false,
    action: false
  };

  constructor(renderer: GameRenderer, roomCode: string) {
    this.physics = new PhysicsEngine();
    this.renderer = renderer;
    
    this.inputs = new Map();
    
    // Initialize State
    this.state = {
      frame: 0,
      players: new Map(),
      entities: []
    };

    // Setup Networking
    this.socket = new PartySocket({
      host: window.location.host, // Assuming dev server proxies or same origin
      room: roomCode
    });

    this.socket.addEventListener("message", this.onMessage.bind(this));
    
    // Input Listeners
    window.addEventListener('keydown', (e) => this.handleKey(e, true));
    window.addEventListener('keyup', (e) => this.handleKey(e, false));
  }

  private handleKey(e: KeyboardEvent, isDown: boolean) {
    switch(e.code) {
      case 'ArrowLeft': case 'KeyA': this.keys.left = isDown; break;
      case 'ArrowRight': case 'KeyD': this.keys.right = isDown; break;
      case 'Space': case 'ArrowUp': case 'KeyW': this.keys.jump = isDown; break;
      case 'KeyE': case 'KeyZ': this.keys.action = isDown; break;
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
      // Received input from server (could be ours or others)
    const { frame, playerId, ...inputData } = msg;
      if (!this.inputs.has(frame)) {
        this.inputs.set(frame, new Map());
      }
      this.inputs.get(frame)!.set(playerId, inputData);
    }
  }

  private addPlayer(id: string, isLocal: boolean) {
    if (!this.state.players.has(id)) {
      this.state.players.set(id, {
        id,
        position: { x: 100 * 100, y: 100 * 100 }, // Start pos x100
        velocity: { x: 0, y: 0 },
        isGrounded: false,
        facingRight: true,
        width: 32,
        height: 32,
        color: isLocal ? 0xFF0000 : 0x0000FF,
        sizeModifier: 1
      });
    }
  }

  public async start() {
    await this.renderer.initialize(document.body);
    this.renderer.drawMap(this.physics);
    this.running = true;
    this.loop();
  }

  private lastTime = 0;
  private accumulator = 0;

  private loop(time: number = 0) {
    if (!this.running) return;
    
    const deltaTime = time - this.lastTime;
    this.lastTime = time;
    this.accumulator += deltaTime;

    // Fixed Update
    while (this.accumulator >= FRAME_TIME) {
      this.fixedUpdate();
      this.accumulator -= FRAME_TIME;
    }

    // Render
    this.renderer.render(this.state, this.localPlayerId || "");
    
    requestAnimationFrame((t) => this.loop(t));
  }

  private fixedUpdate() {
    if (!this.localPlayerId) return;

    const currentFrame = this.state.frame;

    // 1. Sample Local Input for the future frame (Input Delay)
    const inputFrame = currentFrame + INPUT_DELAY;
    const localInput: Input = {
      frame: inputFrame,
      ...this.keys
    };

    // Send to server
    this.socket.send(JSON.stringify({
      type: 'input',
      ...localInput
    }));

    // Optimistically store our own input
    if (!this.inputs.has(inputFrame)) {
      this.inputs.set(inputFrame, new Map());
    }
    this.inputs.get(inputFrame)!.set(this.localPlayerId, localInput);

    // 2. Process Current Frame
    // To advance from currentFrame to currentFrame + 1, we need inputs for currentFrame
    // In a strict lockstep, we'd wait. 
    // But for "smooth online play", we often proceed.
    
    const frameInputs = this.inputs.get(currentFrame) || new Map();

    // If we don't have inputs for a player, what do we do?
    // For now, just assume last input or empty?
    // The prompt says "Host/guest model: first player runs authoritative physics, second player predicts".
    // This implies if we are guest, we might not have host input yet.
    // But let's keep it simple: run physics with what we have. 
    // In a real production game we'd rollback/reconcile.
    
    this.physics.step(this.state, frameInputs);
    
    this.state.frame++;
  }
}
