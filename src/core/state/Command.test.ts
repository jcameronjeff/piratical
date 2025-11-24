/**
 * Command System Tests
 */

import { CommandQueue, MoveCommand, JumpCommand } from './Command';

describe('CommandQueue', () => {
  let queue: CommandQueue;

  beforeEach(() => {
    queue = new CommandQueue();
  });

  describe('Basic Operations', () => {
    it('should enqueue and dequeue commands', () => {
      const cmd: MoveCommand = {
        type: 'move',
        frame: 0,
        playerId: 1,
        dx: 100,
        dy: 0
      };

      queue.enqueue(cmd);
      const commands = queue.dequeue();

      expect(commands).toHaveLength(1);
      expect(commands[0]).toEqual(cmd);
    });

    it('should handle multiple commands per frame', () => {
      const cmd1: MoveCommand = {
        type: 'move',
        frame: 0,
        playerId: 1,
        dx: 100,
        dy: 0
      };

      const cmd2: JumpCommand = {
        type: 'jump',
        frame: 0,
        playerId: 1,
        force: 1000
      };

      queue.enqueue(cmd1);
      queue.enqueue(cmd2);

      const commands = queue.dequeue();
      expect(commands).toHaveLength(2);
    });

    it('should handle commands for different frames', () => {
      const cmd1: MoveCommand = {
        type: 'move',
        frame: 0,
        playerId: 1,
        dx: 100,
        dy: 0
      };

      const cmd2: MoveCommand = {
        type: 'move',
        frame: 1,
        playerId: 1,
        dx: 200,
        dy: 0
      };

      queue.enqueue(cmd1);
      queue.enqueue(cmd2);

      const frame0Commands = queue.dequeue();
      expect(frame0Commands).toHaveLength(1);
      expect(frame0Commands[0].frame).toBe(0);

      queue.nextFrame();
      const frame1Commands = queue.dequeue();
      expect(frame1Commands).toHaveLength(1);
      expect(frame1Commands[0].frame).toBe(1);
    });
  });

  describe('Frame Management', () => {
    it('should track current frame', () => {
      expect(queue.getCurrentFrame()).toBe(0);
      queue.nextFrame();
      expect(queue.getCurrentFrame()).toBe(1);
    });

    it('should allow setting frame', () => {
      queue.setCurrentFrame(10);
      expect(queue.getCurrentFrame()).toBe(10);
    });
  });

  describe('Query Operations', () => {
    it('should check if commands exist for a frame', () => {
      const cmd: MoveCommand = {
        type: 'move',
        frame: 5,
        playerId: 1,
        dx: 100,
        dy: 0
      };

      queue.enqueue(cmd);

      expect(queue.hasCommandsForFrame(5)).toBe(true);
      expect(queue.hasCommandsForFrame(6)).toBe(false);
    });

    it('should get commands for specific frame', () => {
      const cmd: MoveCommand = {
        type: 'move',
        frame: 5,
        playerId: 1,
        dx: 100,
        dy: 0
      };

      queue.enqueue(cmd);

      const commands = queue.getCommandsForFrame(5);
      expect(commands).toHaveLength(1);
      expect(commands[0]).toEqual(cmd);
    });

    it('should return size', () => {
      expect(queue.size()).toBe(0);

      queue.enqueue({
        type: 'move',
        frame: 0,
        playerId: 1,
        dx: 100,
        dy: 0
      });

      expect(queue.size()).toBe(1);
    });
  });

  describe('Cleanup', () => {
    it('should clear all commands', () => {
      queue.enqueue({
        type: 'move',
        frame: 0,
        playerId: 1,
        dx: 100,
        dy: 0
      });

      queue.clear();
      expect(queue.size()).toBe(0);
    });

    it('should clear commands before a frame', () => {
      for (let i = 0; i < 10; i++) {
        queue.enqueue({
          type: 'move',
          frame: i,
          playerId: 1,
          dx: 100,
          dy: 0
        });
      }

      queue.clearBefore(5);

      expect(queue.hasCommandsForFrame(3)).toBe(false);
      expect(queue.hasCommandsForFrame(5)).toBe(true);
      expect(queue.hasCommandsForFrame(7)).toBe(true);
    });
  });
});
