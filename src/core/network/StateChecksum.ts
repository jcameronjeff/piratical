/**
 * State Checksum System
 * 
 * Generates and validates checksums to detect desynchronization
 * in multiplayer games. Critical for ensuring all clients stay in sync.
 */

import { GameState } from '../state/GameState.js';

export interface ChecksumRecord {
  frame: number;
  checksum: number;
  timestamp: number;
}

export class StateChecksumValidator {
  private checksums: Map<number, ChecksumRecord>;
  private maxHistory: number;

  constructor(maxHistory: number = 300) {
    this.checksums = new Map();
    this.maxHistory = maxHistory;
  }

  /**
   * Record a checksum for a specific frame
   */
  recordChecksum(frame: number, checksum: number): void {
    this.checksums.set(frame, {
      frame,
      checksum,
      timestamp: Date.now()
    });

    // Clean up old checksums
    if (this.checksums.size > this.maxHistory) {
      const oldestFrame = frame - this.maxHistory;
      this.checksums.delete(oldestFrame);
    }
  }

  /**
   * Validate a checksum against the recorded value
   */
  validateChecksum(frame: number, checksum: number): boolean {
    const record = this.checksums.get(frame);
    if (!record) {
      // No record to validate against
      return true;
    }

    return record.checksum === checksum;
  }

  /**
   * Get checksum for a specific frame
   */
  getChecksum(frame: number): number | undefined {
    return this.checksums.get(frame)?.checksum;
  }

  /**
   * Get all checksums in a range
   */
  getChecksumRange(startFrame: number, endFrame: number): ChecksumRecord[] {
    const results: ChecksumRecord[] = [];
    for (let frame = startFrame; frame <= endFrame; frame++) {
      const record = this.checksums.get(frame);
      if (record) {
        results.push(record);
      }
    }
    return results;
  }

  /**
   * Find the first frame where checksums diverge
   */
  findDivergencePoint(otherChecksums: Map<number, number>): number | null {
    const frames = Array.from(this.checksums.keys()).sort((a, b) => a - b);

    for (const frame of frames) {
      const ourChecksum = this.checksums.get(frame)?.checksum;
      const theirChecksum = otherChecksums.get(frame);

      if (ourChecksum !== undefined && theirChecksum !== undefined) {
        if (ourChecksum !== theirChecksum) {
          return frame;
        }
      }
    }

    return null;
  }

  /**
   * Clear all checksums
   */
  clear(): void {
    this.checksums.clear();
  }

  /**
   * Clear checksums before a specific frame
   */
  clearBefore(frame: number): void {
    for (const f of this.checksums.keys()) {
      if (f < frame) {
        this.checksums.delete(f);
      }
    }
  }

  /**
   * Export checksums to JSON
   */
  exportJSON(): string {
    const data = Array.from(this.checksums.entries()).map(([frame, record]) => ({
      frame,
      checksum: record.checksum,
      timestamp: record.timestamp
    }));
    return JSON.stringify(data, null, 2);
  }

  /**
   * Import checksums from JSON
   */
  importJSON(json: string): void {
    const data = JSON.parse(json);
    this.checksums.clear();

    for (const item of data) {
      this.checksums.set(item.frame, {
        frame: item.frame,
        checksum: item.checksum,
        timestamp: item.timestamp
      });
    }
  }

  /**
   * Get statistics about checksums
   */
  getStats(): {
    count: number;
    oldestFrame: number;
    newestFrame: number;
    memoryUsage: number;
  } {
    const frames = Array.from(this.checksums.keys());
    return {
      count: this.checksums.size,
      oldestFrame: frames.length > 0 ? Math.min(...frames) : -1,
      newestFrame: frames.length > 0 ? Math.max(...frames) : -1,
      memoryUsage: this.checksums.size * 16 // Rough estimate: 16 bytes per entry
    };
  }
}

/**
 * Compute checksum from game state
 */
export function computeStateChecksum(state: GameState): number {
  return state.calculateChecksum();
}

/**
 * Compute checksum from arbitrary data using a simple hash
 */
export function computeDataChecksum(data: ArrayBuffer | Uint8Array): number {
  const bytes = data instanceof ArrayBuffer ? new Uint8Array(data) : data;
  let hash = 0x811c9dc5; // FNV-1a offset basis

  for (let i = 0; i < bytes.length; i++) {
    hash ^= bytes[i];
    hash = Math.imul(hash, 0x01000193); // FNV-1a prime
  }

  return hash >>> 0; // Unsigned 32-bit
}

/**
 * Compare two checksums
 */
export function compareChecksums(a: number, b: number): boolean {
  return a === b;
}
