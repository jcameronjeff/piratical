/**
 * Input Recording and Replay System
 * 
 * Records all inputs with frame numbers for deterministic replay.
 * Critical for testing determinism and debugging.
 */

export interface InputState {
  frame: number;
  left: boolean;
  right: boolean;
  jump: boolean;
  attack: boolean;
  timestamp: number;
}

export class InputRecorder {
  private recording: InputState[] = [];
  private currentFrame: number = 0;
  private isRecording: boolean = false;
  private isReplaying: boolean = false;
  private replayIndex: number = 0;

  /**
   * Start recording inputs
   */
  startRecording(): void {
    this.recording = [];
    this.currentFrame = 0;
    this.isRecording = true;
    this.isReplaying = false;
  }

  /**
   * Stop recording
   */
  stopRecording(): void {
    this.isRecording = false;
  }

  /**
   * Record an input state for the current frame
   */
  recordInput(input: Omit<InputState, 'frame' | 'timestamp'>): void {
    if (!this.isRecording) return;

    const state: InputState = {
      ...input,
      frame: this.currentFrame,
      timestamp: Date.now()
    };

    this.recording.push(state);
  }

  /**
   * Advance to the next frame
   */
  nextFrame(): void {
    this.currentFrame++;
  }

  /**
   * Start replaying recorded inputs
   */
  startReplay(): void {
    this.isReplaying = true;
    this.isRecording = false;
    this.currentFrame = 0;
    this.replayIndex = 0;
  }

  /**
   * Stop replaying
   */
  stopReplay(): void {
    this.isReplaying = false;
  }

  /**
   * Get the input for the current frame during replay
   */
  getReplayInput(): InputState | null {
    if (!this.isReplaying || this.replayIndex >= this.recording.length) {
      return null;
    }

    const input = this.recording[this.replayIndex];
    if (input.frame === this.currentFrame) {
      this.replayIndex++;
      return input;
    }

    return null;
  }

  /**
   * Check if replay has finished
   */
  isReplayFinished(): boolean {
    return this.isReplaying && this.replayIndex >= this.recording.length;
  }

  /**
   * Get the recorded inputs
   */
  getRecording(): InputState[] {
    return [...this.recording];
  }

  /**
   * Load a recording
   */
  loadRecording(recording: InputState[]): void {
    this.recording = [...recording];
  }

  /**
   * Export recording as JSON
   */
  exportJSON(): string {
    return JSON.stringify({
      version: 1,
      frameCount: this.recording.length > 0 
        ? this.recording[this.recording.length - 1].frame + 1 
        : 0,
      inputs: this.recording
    }, null, 2);
  }

  /**
   * Import recording from JSON
   */
  importJSON(json: string): void {
    const data = JSON.parse(json);
    if (data.version === 1 && Array.isArray(data.inputs)) {
      this.recording = data.inputs;
    }
  }

  /**
   * Get recording statistics
   */
  getStats(): {
    totalFrames: number;
    inputCount: number;
    duration: number;
  } {
    if (this.recording.length === 0) {
      return { totalFrames: 0, inputCount: 0, duration: 0 };
    }

    const lastInput = this.recording[this.recording.length - 1];
    const firstInput = this.recording[0];
    
    return {
      totalFrames: lastInput.frame + 1,
      inputCount: this.recording.length,
      duration: lastInput.timestamp - firstInput.timestamp
    };
  }

  /**
   * Clear the recording
   */
  clear(): void {
    this.recording = [];
    this.currentFrame = 0;
    this.replayIndex = 0;
  }

  /**
   * Get current frame number
   */
  getCurrentFrame(): number {
    return this.currentFrame;
  }

  /**
   * Check if currently recording
   */
  getIsRecording(): boolean {
    return this.isRecording;
  }

  /**
   * Check if currently replaying
   */
  getIsReplaying(): boolean {
    return this.isReplaying;
  }
}
