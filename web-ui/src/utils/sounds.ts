/**
 * Sound effects for Ludo game
 * Uses Web Audio API for clean, lightweight sounds
 */

class SoundManager {
  private audioContext: AudioContext | null = null;
  private initialized = false;

  // Initialize audio context on user interaction (required by browsers)
  init() {
    if (this.initialized) return;

    try {
      this.audioContext = new (
        window.AudioContext || (window as any).webkitAudioContext
      )();
      this.initialized = true;
    } catch (error) {
      console.warn("Web Audio API not supported", error);
    }
  }

  // Resume audio context (needed after user interaction)
  resume() {
    if (this.audioContext && this.audioContext.state === "suspended") {
      this.audioContext.resume();
    }
  }

  // Play a simple beep/tone
  private playTone(frequency: number, duration: number, volume: number = 0.3) {
    if (!this.audioContext) return;

    this.resume();

    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(this.audioContext.destination);

    oscillator.frequency.value = frequency;
    gainNode.gain.value = volume;

    oscillator.start();
    gainNode.gain.exponentialRampToValueAtTime(
      0.00001,
      this.audioContext.currentTime + duration,
    );
    oscillator.stop(this.audioContext.currentTime + duration);
  }

  // Dice roll sound
  rollDice() {
    if (!this.audioContext) return;

    this.resume();

    // Quick ascending tones for rolling effect
    const frequencies = [440, 554, 659, 880];
    frequencies.forEach((freq, i) => {
      setTimeout(() => {
        const oscillator = this.audioContext!.createOscillator();
        const gainNode = this.audioContext!.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext!.destination);

        oscillator.frequency.value = freq;
        gainNode.gain.value = 0.15;

        oscillator.start();
        gainNode.gain.exponentialRampToValueAtTime(
          0.00001,
          this.audioContext!.currentTime + 0.15,
        );
        oscillator.stop(this.audioContext!.currentTime + 0.15);
      }, i * 50);
    });
  }

  // Token move sound (short pluck)
  tokenMove() {
    this.playTone(523.25, 0.1, 0.2); // C5 note
  }

  // Token capture sound (lower, satisfying thud)
  tokenCapture() {
    this.playTone(196, 0.2, 0.25); // G3 note
  }

  // Token spawn (leaving home) - bright sound
  tokenSpawn() {
    this.playTone(659.25, 0.15, 0.2); // E5 note
  }

  // Token finish (reaching center) - triumphant sound
  tokenFinish() {
    if (!this.audioContext) return;

    this.resume();

    // Two notes: C5 → E5
    [523.25, 659.25].forEach((freq, i) => {
      setTimeout(() => {
        const oscillator = this.audioContext!.createOscillator();
        const gainNode = this.audioContext!.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext!.destination);

        oscillator.frequency.value = freq;
        gainNode.gain.value = 0.25;

        oscillator.start();
        gainNode.gain.exponentialRampToValueAtTime(
          0.00001,
          this.audioContext!.currentTime + 0.3,
        );
        oscillator.stop(this.audioContext!.currentTime + 0.3);
      }, i * 150);
    });
  }

  // Win sound - triumphant fanfare
  win() {
    if (!this.audioContext) return;

    this.resume();

    const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
    notes.forEach((freq, i) => {
      setTimeout(() => {
        const oscillator = this.audioContext!.createOscillator();
        const gainNode = this.audioContext!.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext!.destination);

        oscillator.frequency.value = freq;
        gainNode.gain.value = 0.3;

        oscillator.start();
        gainNode.gain.exponentialRampToValueAtTime(
          0.00001,
          this.audioContext!.currentTime + 0.5,
        );
        oscillator.stop(this.audioContext!.currentTime + 0.5);
      }, i * 200);
    });
  }

  // Turn start sound (subtle notification)
  turnStart() {
    this.playTone(440, 0.08, 0.15); // A4 note
  }
}

export const sounds = new SoundManager();
