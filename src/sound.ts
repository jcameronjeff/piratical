/**
 * Sound Manager for Piratical Platformer
 * Handles background music and sound effects
 * 
 * To use actual audio files instead of generated sounds:
 * 1. Place audio files in a public folder (e.g., /public/sounds/)
 * 2. Call loadBackgroundMusic('/sounds/pirate-music.mp3') before starting the game
 * 3. Call loadSoundEffect(SoundEffect.JUMP, '/sounds/jump.mp3') for each sound effect
 * 4. The manager will automatically fall back to generated sounds if files fail to load
 */

export enum SoundEffect {
  JUMP = 'jump',
  ATTACK = 'attack',
  COLLECT_DOUBLOON = 'collect_doubloon',
  COLLECT_SWORD = 'collect_sword',
  ENEMY_DEFEAT = 'enemy_defeat',
  PLAYER_HIT = 'player_hit',
  LEVEL_COMPLETE = 'level_complete',
  CANNON_FIRE = 'cannon_fire',
  FOOTSTEP = 'footstep'
}

export class SoundManager {
  private audioContext: AudioContext | null = null;
  private backgroundMusic: HTMLAudioElement | null = null;
  private soundEffects: Map<SoundEffect, HTMLAudioElement> = new Map();
  private musicVolume: number = 0.5;
  private sfxVolume: number = 0.7;
  private musicEnabled: boolean = true;
  private sfxEnabled: boolean = true;

  constructor() {
    // Initialize audio context (will be created on first user interaction)
    this.initializeAudio();
  }

  private initializeAudio() {
    // Audio context will be created on first play to avoid autoplay restrictions
    try {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    } catch (e) {
      console.warn('Web Audio API not supported:', e);
    }
  }

  /**
   * Ensure audio context is running (required after user interaction)
   */
  private ensureAudioContext() {
    if (this.audioContext && this.audioContext.state === 'suspended') {
      this.audioContext.resume();
    }
  }

  /**
   * Load background music
   */
  public loadBackgroundMusic(url: string) {
    if (this.backgroundMusic) {
      this.backgroundMusic.pause();
      this.backgroundMusic = null;
    }

    const audio = new Audio(url);
    audio.loop = true;
    audio.volume = this.musicVolume;
    audio.preload = 'auto';
    
    // Handle loading errors gracefully
    audio.addEventListener('error', () => {
      console.warn('Failed to load background music, using generated music instead');
      this.startGeneratedMusic();
    });

    this.backgroundMusic = audio;
  }

  /**
   * Start playing background music
   */
  public playBackgroundMusic() {
    if (!this.musicEnabled) return;
    
    this.ensureAudioContext();
    
    if (this.backgroundMusic) {
      this.backgroundMusic.play().catch(e => {
        console.warn('Could not play background music:', e);
        // Fallback to generated music
        this.startGeneratedMusic();
      });
    } else {
      // No music file loaded, use generated music
      this.startGeneratedMusic();
    }
  }

  /**
   * Stop background music
   */
  public stopBackgroundMusic() {
    if (this.backgroundMusic) {
      this.backgroundMusic.pause();
      this.backgroundMusic.currentTime = 0;
    }
    this.stopGeneratedMusic();
  }

  /**
   * Pause background music (can be resumed)
   */
  public pauseBackgroundMusic() {
    if (this.backgroundMusic) {
      this.backgroundMusic.pause();
    }
  }

  /**
   * Resume background music
   */
  public resumeBackgroundMusic() {
    if (!this.musicEnabled) return;
    if (this.backgroundMusic) {
      this.backgroundMusic.play().catch(e => {
        console.warn('Could not resume background music:', e);
      });
    }
  }

  /**
   * Set music volume (0.0 to 1.0)
   */
  public setMusicVolume(volume: number) {
    this.musicVolume = Math.max(0, Math.min(1, volume));
    if (this.backgroundMusic) {
      this.backgroundMusic.volume = this.musicVolume;
    }
  }

  /**
   * Set sound effects volume (0.0 to 1.0)
   */
  public setSfxVolume(volume: number) {
    this.sfxVolume = Math.max(0, Math.min(1, volume));
  }

  /**
   * Enable/disable music
   */
  public setMusicEnabled(enabled: boolean) {
    this.musicEnabled = enabled;
    if (!enabled) {
      this.stopBackgroundMusic();
    } else {
      this.playBackgroundMusic();
    }
  }

  /**
   * Enable/disable sound effects
   */
  public setSfxEnabled(enabled: boolean) {
    this.sfxEnabled = enabled;
  }

  /**
   * Play a sound effect
   */
  public playSound(effect: SoundEffect) {
    if (!this.sfxEnabled) return;
    
    this.ensureAudioContext();

    // Check if we have a preloaded sound effect
    const audio = this.soundEffects.get(effect);
    if (audio) {
      audio.currentTime = 0;
      audio.volume = this.sfxVolume;
      audio.play().catch(e => {
        console.warn(`Could not play sound effect ${effect}:`, e);
        // Fallback to generated sound
        this.playGeneratedSound(effect);
      });
      return;
    }

    // Fallback to generated sound
    this.playGeneratedSound(effect);
  }

  /**
   * Load a sound effect from URL
   */
  public loadSoundEffect(effect: SoundEffect, url: string) {
    const audio = new Audio(url);
    audio.preload = 'auto';
    audio.volume = this.sfxVolume;
    
    audio.addEventListener('error', () => {
      console.warn(`Failed to load sound effect ${effect}, will use generated sound`);
    });

    this.soundEffects.set(effect, audio);
  }

  /**
   * Generate simple sounds using Web Audio API
   */
  private playGeneratedSound(effect: SoundEffect) {
    if (!this.audioContext) {
      this.initializeAudio();
      if (!this.audioContext) return;
    }

    const ctx = this.audioContext;
    const now = ctx.currentTime;
    const gainNode = ctx.createGain();
    gainNode.connect(ctx.destination);
    gainNode.gain.value = this.sfxVolume * 0.3; // Generated sounds are quieter

    let oscillator: OscillatorNode | null = null;

    switch (effect) {
      case SoundEffect.JUMP:
        oscillator = ctx.createOscillator();
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(400, now);
        oscillator.frequency.exponentialRampToValueAtTime(200, now + 0.1);
        gainNode.gain.setValueAtTime(0.3, now);
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
        break;

      case SoundEffect.ATTACK:
        oscillator = ctx.createOscillator();
        oscillator.type = 'sawtooth';
        oscillator.frequency.setValueAtTime(200, now);
        oscillator.frequency.exponentialRampToValueAtTime(100, now + 0.15);
        gainNode.gain.setValueAtTime(0.4, now);
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
        break;

      case SoundEffect.COLLECT_DOUBLOON:
        oscillator = ctx.createOscillator();
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(600, now);
        oscillator.frequency.exponentialRampToValueAtTime(800, now + 0.1);
        gainNode.gain.setValueAtTime(0.3, now);
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
        break;

      case SoundEffect.COLLECT_SWORD:
        // Power-up sound: ascending notes
        const notes = [440, 554, 659]; // A, C#, E (A major chord)
        notes.forEach((freq, i) => {
          const osc = ctx.createOscillator();
          osc.type = 'sine';
          osc.frequency.value = freq;
          const gain = ctx.createGain();
          gain.connect(gainNode);
          gain.gain.setValueAtTime(0.2, now + i * 0.05);
          gain.gain.exponentialRampToValueAtTime(0.01, now + i * 0.05 + 0.2);
          osc.connect(gain);
          osc.start(now + i * 0.05);
          osc.stop(now + i * 0.05 + 0.2);
        });
        return; // Early return, no single oscillator

      case SoundEffect.ENEMY_DEFEAT:
        oscillator = ctx.createOscillator();
        oscillator.type = 'square';
        oscillator.frequency.setValueAtTime(150, now);
        oscillator.frequency.exponentialRampToValueAtTime(50, now + 0.2);
        gainNode.gain.setValueAtTime(0.4, now);
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
        break;

      case SoundEffect.PLAYER_HIT:
        oscillator = ctx.createOscillator();
        oscillator.type = 'sawtooth';
        oscillator.frequency.setValueAtTime(100, now);
        oscillator.frequency.setValueAtTime(80, now + 0.3);
        gainNode.gain.setValueAtTime(0.5, now);
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
        break;

      case SoundEffect.LEVEL_COMPLETE:
        // Victory fanfare: ascending major chord
        const victoryNotes = [523, 659, 784, 1047]; // C, E, G, C (C major)
        victoryNotes.forEach((freq, i) => {
          const osc = ctx.createOscillator();
          osc.type = 'sine';
          osc.frequency.value = freq;
          const gain = ctx.createGain();
          gain.connect(gainNode);
          gain.gain.setValueAtTime(0.25, now + i * 0.1);
          gain.gain.exponentialRampToValueAtTime(0.01, now + i * 0.1 + 0.3);
          osc.connect(gain);
          osc.start(now + i * 0.1);
          osc.stop(now + i * 0.1 + 0.3);
        });
        return; // Early return

      case SoundEffect.CANNON_FIRE:
        // Deep boom sound
        oscillator = ctx.createOscillator();
        oscillator.type = 'sawtooth';
        oscillator.frequency.setValueAtTime(80, now);
        oscillator.frequency.exponentialRampToValueAtTime(40, now + 0.4);
        gainNode.gain.setValueAtTime(0.5, now);
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.4);
        break;

      case SoundEffect.FOOTSTEP:
        // Short click sound
        oscillator = ctx.createOscillator();
        oscillator.type = 'square';
        oscillator.frequency.value = 200;
        gainNode.gain.setValueAtTime(0.1, now);
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.05);
        break;
    }

    if (oscillator) {
      oscillator.connect(gainNode);
      oscillator.start(now);
      oscillator.stop(now + 0.5); // Max duration
    }
  }

  /**
   * Generate simple ambient pirate music using Web Audio API
   * Creates a looping sea shanty-like melody
   */
  private startGeneratedMusic() {
    if (!this.audioContext) {
      this.initializeAudio();
      if (!this.audioContext) return;
    }

    if (!this.musicEnabled) return;

    const ctx = this.audioContext;
    this.ensureAudioContext();

    // Create a simple sea shanty melody
    // Notes in a minor key (pirate feel): A, C, D, E, G
    const melody = [
      { note: 220, duration: 0.5 }, // A3
      { note: 262, duration: 0.5 }, // C4
      { note: 294, duration: 0.5 }, // D4
      { note: 330, duration: 0.5 }, // E4
      { note: 392, duration: 0.5 }, // G4
      { note: 330, duration: 0.5 }, // E4
      { note: 294, duration: 0.5 }, // D4
      { note: 262, duration: 0.5 }, // C4
    ];

    const playMelody = () => {
      if (!this.musicEnabled || !ctx) return;

      const now = ctx.currentTime;
      let currentTime = now;

      melody.forEach(({ note, duration }) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        
        osc.type = 'triangle'; // Softer sound
        osc.frequency.value = note;
        
        gain.connect(ctx.destination);
        gain.gain.value = this.musicVolume * 0.15; // Quiet background music
        
        osc.connect(gain);
        osc.start(currentTime);
        osc.stop(currentTime + duration);
        
        currentTime += duration;
      });

      // Loop the melody
      setTimeout(() => {
        if (this.musicEnabled) {
          playMelody();
        }
      }, currentTime * 1000 - now * 1000);
    };

    playMelody();
  }

  private stopGeneratedMusic() {
    // Generated music is handled by setTimeout, so we just stop the flag
    // The music will naturally stop when musicEnabled is false
  }

  /**
   * Clean up resources
   */
  public dispose() {
    this.stopBackgroundMusic();
    this.soundEffects.clear();
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
  }
}

// Singleton instance
let soundManagerInstance: SoundManager | null = null;

export function getSoundManager(): SoundManager {
  if (!soundManagerInstance) {
    soundManagerInstance = new SoundManager();
  }
  return soundManagerInstance;
}

