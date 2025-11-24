/**
 * Command Pattern for State Management
 * 
 * All state changes must go through commands for deterministic replay
 * and network synchronization.
 */

export interface Command {
  readonly type: string;
  readonly frame: number;
  readonly playerId?: number;
  readonly timestamp?: number;
}

export interface MoveCommand extends Command {
  readonly type: 'move';
  readonly dx: number; // Fixed-point
  readonly dy: number; // Fixed-point
}

export interface JumpCommand extends Command {
  readonly type: 'jump';
  readonly force: number; // Fixed-point
}

export interface AttackCommand extends Command {
  readonly type: 'attack';
  readonly targetX: number; // Fixed-point
  readonly targetY: number; // Fixed-point
}

export interface SpawnCommand extends Command {
  readonly type: 'spawn';
  readonly entityType: string;
  readonly x: number; // Fixed-point
  readonly y: number; // Fixed-point
  readonly seed?: number;
}

export type GameCommand = MoveCommand | JumpCommand | AttackCommand | SpawnCommand;

/**
 * Command Queue for buffering and ordering commands
 */
export class CommandQueue {
  private commands: Map<number, GameCommand[]>;
  private currentFrame: number = 0;

  constructor() {
    this.commands = new Map();
  }

  /**
   * Add a command for a specific frame
   */
  enqueue(command: GameCommand): void {
    const frame = command.frame;
    
    if (!this.commands.has(frame)) {
      this.commands.set(frame, []);
    }
    
    this.commands.get(frame)!.push(command);
  }

  /**
   * Get all commands for a specific frame
   */
  getCommandsForFrame(frame: number): GameCommand[] {
    return this.commands.get(frame) || [];
  }

  /**
   * Get and remove commands for the current frame
   */
  dequeue(): GameCommand[] {
    const commands = this.commands.get(this.currentFrame) || [];
    this.commands.delete(this.currentFrame);
    return commands;
  }

  /**
   * Advance to the next frame
   */
  nextFrame(): void {
    this.currentFrame++;
  }

  /**
   * Get current frame number
   */
  getCurrentFrame(): number {
    return this.currentFrame;
  }

  /**
   * Set current frame (for replay/rollback)
   */
  setCurrentFrame(frame: number): void {
    this.currentFrame = frame;
  }

  /**
   * Clear all commands
   */
  clear(): void {
    this.commands.clear();
  }

  /**
   * Clear commands before a specific frame (for memory management)
   */
  clearBefore(frame: number): void {
    for (const [f] of this.commands) {
      if (f < frame) {
        this.commands.delete(f);
      }
    }
  }

  /**
   * Get the number of pending commands
   */
  size(): number {
    let count = 0;
    for (const commands of this.commands.values()) {
      count += commands.length;
    }
    return count;
  }

  /**
   * Check if there are commands for a specific frame
   */
  hasCommandsForFrame(frame: number): boolean {
    return this.commands.has(frame) && this.commands.get(frame)!.length > 0;
  }
}
