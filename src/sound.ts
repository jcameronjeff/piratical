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
  private droneOscillator: OscillatorNode | null = null;
  private droneGain: GainNode | null = null;
  private generatedMusicPlaying: boolean = false;

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
   * Generate epic pirate music inspired by Pirates of the Caribbean
   * Features driving 6/8 rhythm, D minor key, and swashbuckling orchestral feel
   */
  private startGeneratedMusic() {
    // Prevent duplicate music instances
    if (this.generatedMusicPlaying) return;
    
    if (!this.audioContext) {
      this.initializeAudio();
      if (!this.audioContext) return;
    }

    if (!this.musicEnabled) return;
    
    this.generatedMusicPlaying = true;

    const ctx = this.audioContext;
    this.ensureAudioContext();

    // Tempo: Fast 6/8 feel (like He's a Pirate)
    const tempo = 160; // BPM
    const beatDuration = 60 / tempo;
    const eighthNote = beatDuration / 2;

    // D minor scale frequencies
    const D3 = 147, F3 = 175, G3 = 196, A3 = 220, Bb3 = 233, C4 = 262;
    const D4 = 294, E4 = 330, F4 = 349, G4 = 392, A4 = 440, Bb4 = 466, C5 = 523, D5 = 587;

    // Epic melodic phrases inspired by the swashbuckling theme
    const epicPhrases = [
      // Phrase 1: The iconic opening-style motif (driving, repetitive)
      [
        { note: D4, duration: eighthNote },
        { note: D4, duration: eighthNote },
        { note: D4, duration: eighthNote },
        { note: D4, duration: eighthNote },
        { note: D4, duration: eighthNote },
        { note: E4, duration: eighthNote },
        { note: F4, duration: eighthNote * 2 },
        { note: F4, duration: eighthNote },
        { note: F4, duration: eighthNote },
        { note: F4, duration: eighthNote },
        { note: G4, duration: eighthNote },
        { note: E4, duration: eighthNote * 2 },
      ],
      // Phrase 2: Continuation with dramatic leap
      [
        { note: E4, duration: eighthNote },
        { note: E4, duration: eighthNote },
        { note: E4, duration: eighthNote },
        { note: E4, duration: eighthNote },
        { note: F4, duration: eighthNote },
        { note: D4, duration: eighthNote },
        { note: D4, duration: eighthNote * 3 },
        { note: A4, duration: eighthNote },
        { note: A4, duration: eighthNote },
        { note: A4, duration: eighthNote * 2 },
      ],
      // Phrase 3: Soaring high section
      [
        { note: A4, duration: eighthNote },
        { note: A4, duration: eighthNote },
        { note: A4, duration: eighthNote },
        { note: A4, duration: eighthNote },
        { note: A4, duration: eighthNote },
        { note: Bb4, duration: eighthNote },
        { note: C5, duration: eighthNote * 2 },
        { note: C5, duration: eighthNote },
        { note: C5, duration: eighthNote },
        { note: C5, duration: eighthNote },
        { note: D5, duration: eighthNote },
        { note: Bb4, duration: eighthNote * 2 },
      ],
      // Phrase 4: Resolution with power
      [
        { note: Bb4, duration: eighthNote },
        { note: Bb4, duration: eighthNote },
        { note: A4, duration: eighthNote },
        { note: A4, duration: eighthNote },
        { note: G4, duration: eighthNote },
        { note: G4, duration: eighthNote },
        { note: F4, duration: eighthNote },
        { note: E4, duration: eighthNote },
        { note: F4, duration: eighthNote },
        { note: D4, duration: eighthNote * 4 },
      ],
    ];

    // Bass line patterns (driving ostinato)
    const bassPatterns = [
      [D3, D3, D3, A3, A3, A3], // i chord
      [D3, D3, D3, A3, A3, A3], // i chord
      [F3, F3, F3, C4, C4, C4], // III chord
      [Bb3, Bb3, A3, A3, D3, D3], // Resolution
    ];

    // Create master gain for overall volume control
    const masterGain = ctx.createGain();
    masterGain.connect(ctx.destination);
    masterGain.gain.value = this.musicVolume;

    // Create subtle reverb-like effect with delay
    const delayNode = ctx.createDelay();
    const delayGain = ctx.createGain();
    delayNode.delayTime.value = 0.1;
    delayGain.gain.value = 0.2;
    delayNode.connect(delayGain);
    delayGain.connect(masterGain);

    // Drone for epic sustained feel (strings simulation)
    this.droneOscillator = ctx.createOscillator();
    this.droneGain = ctx.createGain();
    this.droneOscillator.type = 'sawtooth';
    this.droneOscillator.frequency.value = D3;
    
    // Add slight vibrato to drone
    const vibratoOsc = ctx.createOscillator();
    const vibratoGain = ctx.createGain();
    vibratoOsc.frequency.value = 5; // 5Hz vibrato
    vibratoGain.gain.value = 3; // Subtle pitch variation
    vibratoOsc.connect(vibratoGain);
    vibratoGain.connect(this.droneOscillator.frequency);
    vibratoOsc.start();
    
    this.droneGain.connect(masterGain);
    this.droneGain.gain.value = 0.06;
    this.droneOscillator.connect(this.droneGain);
    this.droneOscillator.start();

    // Play driving percussion (6/8 feel)
    const playPercussion = (startTime: number, duration: number) => {
      const numBeats = Math.floor(duration / (eighthNote * 3)); // Groups of 3 eighth notes
      
      for (let i = 0; i < numBeats * 3; i++) {
        const time = startTime + i * eighthNote;
        const isDownbeat = i % 3 === 0;
        const isStrong = i % 6 === 0;
        
        // Kick-like sound on downbeats
        if (isDownbeat) {
          const kick = ctx.createOscillator();
          const kickGain = ctx.createGain();
          kick.type = 'sine';
          kick.frequency.setValueAtTime(isStrong ? 100 : 80, time);
          kick.frequency.exponentialRampToValueAtTime(40, time + 0.08);
          kickGain.connect(masterGain);
          kickGain.gain.setValueAtTime(isStrong ? 0.15 : 0.1, time);
          kickGain.gain.exponentialRampToValueAtTime(0.01, time + 0.1);
          kick.connect(kickGain);
          kick.start(time);
          kick.stop(time + 0.1);
        }
        
        // Hi-hat like sound for rhythm
        const noise = ctx.createOscillator();
        const noiseGain = ctx.createGain();
        noise.type = 'square';
        noise.frequency.value = 800 + Math.random() * 400;
        noiseGain.connect(masterGain);
        noiseGain.gain.setValueAtTime(isDownbeat ? 0.03 : 0.015, time);
        noiseGain.gain.exponentialRampToValueAtTime(0.001, time + 0.03);
        noise.connect(noiseGain);
        noise.start(time);
        noise.stop(time + 0.03);
      }
    };

    // Play bass line
    const playBass = (startTime: number, pattern: number[]) => {
      pattern.forEach((freq, i) => {
        const time = startTime + i * eighthNote;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        
        osc.type = 'sawtooth';
        osc.frequency.value = freq;
        
        gain.connect(masterGain);
        gain.gain.setValueAtTime(0.08, time);
        gain.gain.exponentialRampToValueAtTime(0.02, time + eighthNote * 0.9);
        
        osc.connect(gain);
        osc.start(time);
        osc.stop(time + eighthNote);
      });
    };

    // Play melody with strings-like sound
    const playMelody = (startTime: number, phrase: typeof epicPhrases[0]) => {
      let currentTime = startTime;
      
      phrase.forEach(({ note, duration }, i) => {
        // Main voice
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        
        osc.type = 'sawtooth';
        osc.frequency.value = note;
        
        // Add slight detune for richness
        const osc2 = ctx.createOscillator();
        const gain2 = ctx.createGain();
        osc2.type = 'sawtooth';
        osc2.frequency.value = note * 1.003; // Slight detune
        osc2.detune.value = 5;
        
        gain.connect(masterGain);
        gain.connect(delayNode); // Send to delay for reverb effect
        gain2.connect(masterGain);
        
        // Dynamic envelope - attack and sustain
        const attack = 0.02;
        gain.gain.setValueAtTime(0.001, currentTime);
        gain.gain.exponentialRampToValueAtTime(0.12, currentTime + attack);
        gain.gain.setValueAtTime(0.1, currentTime + attack);
        gain.gain.exponentialRampToValueAtTime(0.01, currentTime + duration);
        
        gain2.gain.setValueAtTime(0.001, currentTime);
        gain2.gain.exponentialRampToValueAtTime(0.05, currentTime + attack);
        gain2.gain.exponentialRampToValueAtTime(0.01, currentTime + duration);
        
        osc.connect(gain);
        osc2.connect(gain2);
        osc.start(currentTime);
        osc.stop(currentTime + duration + 0.05);
        osc2.start(currentTime);
        osc2.stop(currentTime + duration + 0.05);
        
        currentTime += duration;
      });
      
      return currentTime - startTime; // Return total duration
    };

    let phraseIndex = 0;

    const playSection = () => {
      if (!this.musicEnabled || !ctx) return;

      const now = ctx.currentTime;
      const phrase = epicPhrases[phraseIndex];
      const bassPattern = bassPatterns[phraseIndex];
      
      // Calculate duration
      const phraseDuration = phrase.reduce((sum, note) => sum + note.duration, 0);
      
      // Play all elements together
      playPercussion(now, phraseDuration);
      playBass(now, bassPattern);
      playMelody(now, phrase);
      
      // Update drone pitch based on phrase (for harmonic movement)
      if (this.droneOscillator) {
        const droneNote = phraseIndex === 2 ? F3 : D3;
        this.droneOscillator.frequency.setValueAtTime(droneNote, now);
      }

      // Move to next phrase
      phraseIndex = (phraseIndex + 1) % epicPhrases.length;

      // Schedule next phrase
      setTimeout(() => {
        if (this.musicEnabled) {
          playSection();
        } else {
          if (this.droneOscillator) {
            this.droneOscillator.stop();
            this.droneOscillator = null;
            this.droneGain = null;
          }
        }
      }, phraseDuration * 1000);
    };

    // Start playing!
    playSection();
  }

  private stopGeneratedMusic() {
    // Stop the drone oscillator
    if (this.droneOscillator) {
      this.droneOscillator.stop();
      this.droneOscillator = null;
      this.droneGain = null;
    }
    // Reset the playing flag so music can be restarted
    this.generatedMusicPlaying = false;
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

