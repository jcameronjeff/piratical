/**
 * Ring Buffer Tests
 */

import { RingBuffer, FrameRingBuffer } from './RingBuffer';

describe('RingBuffer', () => {
  describe('Basic Operations', () => {
    it('should push and get items', () => {
      const buffer = new RingBuffer<number>(5);
      
      buffer.push(1);
      buffer.push(2);
      buffer.push(3);

      expect(buffer.get(0)).toBe(1);
      expect(buffer.get(1)).toBe(2);
      expect(buffer.get(2)).toBe(3);
    });

    it('should return undefined for invalid indices', () => {
      const buffer = new RingBuffer<number>(5);
      buffer.push(1);

      expect(buffer.get(-1)).toBeUndefined();
      expect(buffer.get(5)).toBeUndefined();
    });

    it('should track length correctly', () => {
      const buffer = new RingBuffer<number>(5);
      
      expect(buffer.length()).toBe(0);
      buffer.push(1);
      expect(buffer.length()).toBe(1);
      buffer.push(2);
      expect(buffer.length()).toBe(2);
    });
  });

  describe('Circular Behavior', () => {
    it('should overwrite oldest items when full', () => {
      const buffer = new RingBuffer<number>(3);
      
      buffer.push(1);
      buffer.push(2);
      buffer.push(3);
      buffer.push(4); // Overwrites 1
      buffer.push(5); // Overwrites 2

      expect(buffer.length()).toBe(3);
      expect(buffer.get(0)).toBe(3);
      expect(buffer.get(1)).toBe(4);
      expect(buffer.get(2)).toBe(5);
    });

    it('should maintain correct order after wrapping', () => {
      const buffer = new RingBuffer<number>(3);
      
      for (let i = 0; i < 10; i++) {
        buffer.push(i);
      }

      expect(buffer.get(0)).toBe(7);
      expect(buffer.get(1)).toBe(8);
      expect(buffer.get(2)).toBe(9);
    });
  });

  describe('First/Last Operations', () => {
    it('should get first and last items', () => {
      const buffer = new RingBuffer<number>(5);
      
      buffer.push(1);
      buffer.push(2);
      buffer.push(3);

      expect(buffer.getFirst()).toBe(1);
      expect(buffer.getLast()).toBe(3);
    });

    it('should shift items', () => {
      const buffer = new RingBuffer<number>(5);
      
      buffer.push(1);
      buffer.push(2);
      buffer.push(3);

      expect(buffer.shift()).toBe(1);
      expect(buffer.length()).toBe(2);
      expect(buffer.getFirst()).toBe(2);
    });
  });

  describe('Status Checks', () => {
    it('should detect empty buffer', () => {
      const buffer = new RingBuffer<number>(5);
      
      expect(buffer.isEmpty()).toBe(true);
      buffer.push(1);
      expect(buffer.isEmpty()).toBe(false);
    });

    it('should detect full buffer', () => {
      const buffer = new RingBuffer<number>(3);
      
      expect(buffer.isFull()).toBe(false);
      buffer.push(1);
      buffer.push(2);
      buffer.push(3);
      expect(buffer.isFull()).toBe(true);
    });
  });

  describe('Array Conversion', () => {
    it('should convert to array', () => {
      const buffer = new RingBuffer<number>(5);
      
      buffer.push(1);
      buffer.push(2);
      buffer.push(3);

      const array = buffer.toArray();
      expect(array).toEqual([1, 2, 3]);
    });

    it('should convert correctly after wrapping', () => {
      const buffer = new RingBuffer<number>(3);
      
      for (let i = 0; i < 5; i++) {
        buffer.push(i);
      }

      const array = buffer.toArray();
      expect(array).toEqual([2, 3, 4]);
    });
  });

  describe('Clear and Resize', () => {
    it('should clear buffer', () => {
      const buffer = new RingBuffer<number>(5);
      
      buffer.push(1);
      buffer.push(2);
      buffer.clear();

      expect(buffer.isEmpty()).toBe(true);
      expect(buffer.length()).toBe(0);
    });

    it('should resize buffer', () => {
      const buffer = new RingBuffer<number>(3);
      
      buffer.push(1);
      buffer.push(2);
      buffer.push(3);
      
      buffer.resize(5);
      
      expect(buffer.capacity()).toBe(5);
      expect(buffer.toArray()).toEqual([1, 2, 3]);
    });

    it('should handle resize to smaller size', () => {
      const buffer = new RingBuffer<number>(5);
      
      buffer.push(1);
      buffer.push(2);
      buffer.push(3);
      buffer.push(4);
      buffer.push(5);
      
      buffer.resize(3);
      
      expect(buffer.capacity()).toBe(3);
      expect(buffer.toArray()).toEqual([3, 4, 5]); // Keeps most recent
    });
  });
});

describe('FrameRingBuffer', () => {
  it('should store and retrieve by frame', () => {
    const buffer = new FrameRingBuffer<string>(10);
    
    buffer.set(0, 'frame0');
    buffer.set(1, 'frame1');
    buffer.set(2, 'frame2');

    expect(buffer.get(0)).toBe('frame0');
    expect(buffer.get(1)).toBe('frame1');
    expect(buffer.get(2)).toBe('frame2');
  });

  it('should track latest and oldest frames', () => {
    const buffer = new FrameRingBuffer<string>(10);
    
    buffer.set(5, 'frame5');
    buffer.set(10, 'frame10');
    buffer.set(15, 'frame15');

    expect(buffer.getOldestFrame()).toBe(5);
    expect(buffer.getLatestFrame()).toBe(15);
  });

  it('should check frame existence', () => {
    const buffer = new FrameRingBuffer<string>(10);
    
    buffer.set(5, 'frame5');

    expect(buffer.has(5)).toBe(true);
    expect(buffer.has(6)).toBe(false);
  });

  it('should list all frames', () => {
    const buffer = new FrameRingBuffer<string>(10);
    
    buffer.set(1, 'a');
    buffer.set(3, 'b');
    buffer.set(5, 'c');

    const frames = buffer.getFrames();
    expect(frames).toEqual([1, 3, 5]);
  });
});
