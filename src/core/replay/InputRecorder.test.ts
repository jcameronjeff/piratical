/**
 * Input Recorder Tests
 */

import { InputRecorder } from './InputRecorder';

describe('InputRecorder', () => {
  let recorder: InputRecorder;

  beforeEach(() => {
    recorder = new InputRecorder();
  });

  describe('Recording', () => {
    it('should start and stop recording', () => {
      expect(recorder.getIsRecording()).toBe(false);
      
      recorder.startRecording();
      expect(recorder.getIsRecording()).toBe(true);
      
      recorder.stopRecording();
      expect(recorder.getIsRecording()).toBe(false);
    });

    it('should record inputs with frame numbers', () => {
      recorder.startRecording();
      
      recorder.recordInput({ left: true, right: false, jump: false, attack: false });
      recorder.nextFrame();
      
      recorder.recordInput({ left: false, right: true, jump: true, attack: false });
      recorder.nextFrame();
      
      const recording = recorder.getRecording();
      expect(recording).toHaveLength(2);
      expect(recording[0].frame).toBe(0);
      expect(recording[0].left).toBe(true);
      expect(recording[1].frame).toBe(1);
      expect(recording[1].right).toBe(true);
    });

    it('should not record when not recording', () => {
      recorder.recordInput({ left: true, right: false, jump: false, attack: false });
      expect(recorder.getRecording()).toHaveLength(0);
    });
  });

  describe('Replay', () => {
    it('should replay recorded inputs', () => {
      recorder.startRecording();
      
      recorder.recordInput({ left: true, right: false, jump: false, attack: false });
      recorder.nextFrame();
      
      recorder.recordInput({ left: false, right: true, jump: true, attack: false });
      recorder.nextFrame();
      
      recorder.stopRecording();
      recorder.startReplay();
      
      const input1 = recorder.getReplayInput();
      recorder.nextFrame();
      
      const input2 = recorder.getReplayInput();
      
      expect(input1?.left).toBe(true);
      expect(input2?.right).toBe(true);
    });

    it('should detect when replay is finished', () => {
      recorder.startRecording();
      recorder.recordInput({ left: true, right: false, jump: false, attack: false });
      recorder.nextFrame();
      recorder.stopRecording();
      
      recorder.startReplay();
      expect(recorder.isReplayFinished()).toBe(false);
      
      recorder.getReplayInput();
      recorder.nextFrame();
      
      expect(recorder.isReplayFinished()).toBe(true);
    });

    it('should return null when no input for current frame', () => {
      recorder.startRecording();
      recorder.recordInput({ left: true, right: false, jump: false, attack: false });
      recorder.nextFrame();
      recorder.nextFrame(); // Skip a frame
      recorder.recordInput({ left: false, right: true, jump: false, attack: false });
      recorder.stopRecording();
      
      recorder.startReplay();
      recorder.getReplayInput();
      recorder.nextFrame();
      
      const noInput = recorder.getReplayInput();
      expect(noInput).toBeNull();
    });
  });

  describe('Import/Export', () => {
    it('should export to JSON', () => {
      recorder.startRecording();
      recorder.recordInput({ left: true, right: false, jump: false, attack: false });
      recorder.nextFrame();
      
      const json = recorder.exportJSON();
      const data = JSON.parse(json);
      
      expect(data.version).toBe(1);
      expect(data.inputs).toHaveLength(1);
      expect(data.inputs[0].left).toBe(true);
    });

    it('should import from JSON', () => {
      const json = JSON.stringify({
        version: 1,
        frameCount: 1,
        inputs: [
          { frame: 0, left: true, right: false, jump: false, attack: false, timestamp: 0 }
        ]
      });
      
      recorder.importJSON(json);
      const recording = recorder.getRecording();
      
      expect(recording).toHaveLength(1);
      expect(recording[0].left).toBe(true);
    });

    it('should round-trip through JSON', () => {
      recorder.startRecording();
      recorder.recordInput({ left: true, right: false, jump: false, attack: false });
      recorder.nextFrame();
      recorder.recordInput({ left: false, right: true, jump: true, attack: false });
      recorder.stopRecording();
      
      const json = recorder.exportJSON();
      
      const newRecorder = new InputRecorder();
      newRecorder.importJSON(json);
      
      const original = recorder.getRecording();
      const imported = newRecorder.getRecording();
      
      expect(imported.length).toBe(original.length);
      expect(imported[0].left).toBe(original[0].left);
      expect(imported[1].jump).toBe(original[1].jump);
    });
  });

  describe('Statistics', () => {
    it('should provide recording statistics', () => {
      recorder.startRecording();
      
      for (let i = 0; i < 100; i++) {
        recorder.recordInput({ left: true, right: false, jump: false, attack: false });
        recorder.nextFrame();
      }
      
      const stats = recorder.getStats();
      expect(stats.totalFrames).toBe(100);
      expect(stats.inputCount).toBe(100);
    });

    it('should handle empty recording statistics', () => {
      const stats = recorder.getStats();
      expect(stats.totalFrames).toBe(0);
      expect(stats.inputCount).toBe(0);
      expect(stats.duration).toBe(0);
    });
  });

  describe('Clear', () => {
    it('should clear the recording', () => {
      recorder.startRecording();
      recorder.recordInput({ left: true, right: false, jump: false, attack: false });
      recorder.nextFrame();
      
      recorder.clear();
      
      expect(recorder.getRecording()).toHaveLength(0);
      expect(recorder.getCurrentFrame()).toBe(0);
    });
  });
});
