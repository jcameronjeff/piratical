/**
 * Ring Buffer for Input History
 * 
 * Fixed-size circular buffer for efficient input storage
 * and retrieval. Used for rollback netcode.
 */

export class RingBuffer<T> {
  private buffer: (T | undefined)[];
  private size: number;
  private head: number = 0;
  private tail: number = 0;
  private count: number = 0;

  constructor(size: number) {
    this.size = size;
    this.buffer = new Array(size);
  }

  /**
   * Add an item to the buffer
   * Overwrites oldest item if buffer is full
   */
  push(item: T): void {
    this.buffer[this.tail] = item;
    this.tail = (this.tail + 1) % this.size;

    if (this.count < this.size) {
      this.count++;
    } else {
      // Buffer is full, move head forward
      this.head = (this.head + 1) % this.size;
    }
  }

  /**
   * Get item at a specific index (0 = oldest, count-1 = newest)
   */
  get(index: number): T | undefined {
    if (index < 0 || index >= this.count) {
      return undefined;
    }

    const actualIndex = (this.head + index) % this.size;
    return this.buffer[actualIndex];
  }

  /**
   * Get the most recent item
   */
  getLast(): T | undefined {
    if (this.count === 0) return undefined;
    const lastIndex = (this.tail - 1 + this.size) % this.size;
    return this.buffer[lastIndex];
  }

  /**
   * Get the oldest item
   */
  getFirst(): T | undefined {
    if (this.count === 0) return undefined;
    return this.buffer[this.head];
  }

  /**
   * Remove and return the oldest item
   */
  shift(): T | undefined {
    if (this.count === 0) return undefined;

    const item = this.buffer[this.head];
    this.buffer[this.head] = undefined;
    this.head = (this.head + 1) % this.size;
    this.count--;

    return item;
  }

  /**
   * Get number of items in buffer
   */
  length(): number {
    return this.count;
  }

  /**
   * Check if buffer is empty
   */
  isEmpty(): boolean {
    return this.count === 0;
  }

  /**
   * Check if buffer is full
   */
  isFull(): boolean {
    return this.count === this.size;
  }

  /**
   * Clear the buffer
   */
  clear(): void {
    this.buffer = new Array(this.size);
    this.head = 0;
    this.tail = 0;
    this.count = 0;
  }

  /**
   * Get all items as an array (oldest to newest)
   */
  toArray(): T[] {
    const result: T[] = [];
    for (let i = 0; i < this.count; i++) {
      const item = this.get(i);
      if (item !== undefined) {
        result.push(item);
      }
    }
    return result;
  }

  /**
   * Get buffer capacity
   */
  capacity(): number {
    return this.size;
  }

  /**
   * Resize the buffer (may lose data if new size is smaller)
   */
  resize(newSize: number): void {
    const oldData = this.toArray();
    this.size = newSize;
    this.buffer = new Array(newSize);
    this.head = 0;
    this.tail = 0;
    this.count = 0;

    // Re-add items up to new capacity
    const itemsToAdd = Math.min(oldData.length, newSize);
    for (let i = Math.max(0, oldData.length - itemsToAdd); i < oldData.length; i++) {
      this.push(oldData[i]);
    }
  }
}

/**
 * Frame-indexed ring buffer for input history
 * Maps frame numbers to input data
 */
export class FrameRingBuffer<T> {
  private buffer: RingBuffer<{ frame: number; data: T }>;

  constructor(size: number) {
    this.buffer = new RingBuffer(size);
  }

  /**
   * Add data for a specific frame
   */
  set(frame: number, data: T): void {
    this.buffer.push({ frame, data });
  }

  /**
   * Get data for a specific frame
   */
  get(frame: number): T | undefined {
    const items = this.buffer.toArray();
    const item = items.find(i => i.frame === frame);
    return item?.data;
  }

  /**
   * Get the most recent frame number
   */
  getLatestFrame(): number {
    const last = this.buffer.getLast();
    return last?.frame ?? -1;
  }

  /**
   * Get the oldest frame number
   */
  getOldestFrame(): number {
    const first = this.buffer.getFirst();
    return first?.frame ?? -1;
  }

  /**
   * Check if data exists for a frame
   */
  has(frame: number): boolean {
    return this.get(frame) !== undefined;
  }

  /**
   * Get all frames with data
   */
  getFrames(): number[] {
    return this.buffer.toArray().map(i => i.frame);
  }

  /**
   * Clear the buffer
   */
  clear(): void {
    this.buffer.clear();
  }

  /**
   * Get buffer size
   */
  size(): number {
    return this.buffer.length();
  }

  /**
   * Get buffer capacity
   */
  capacity(): number {
    return this.buffer.capacity();
  }
}
