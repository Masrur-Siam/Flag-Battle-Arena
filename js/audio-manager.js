/**
 * FLAG BATTLE ARENA - Procedural Audio Manager
 * 100% Offline Web Audio API Synthesizer
 * No external sound files or network requests required!
 */

class AudioManager {
  constructor() {
    this.ctx = null;
    this.isMuted = false;
    this.masterVolume = 0.7;
    this.masterGain = null;
    this.initialized = false;

    // Load user settings if saved
    try {
      const savedMute = localStorage.getItem('fba_muted');
      if (savedMute !== null) this.isMuted = savedMute === 'true';
      const savedVol = localStorage.getItem('fba_volume');
      if (savedVol !== null) this.masterVolume = parseFloat(savedVol);
    } catch (_) {}

    this.setupUnlock();
  }

  setupUnlock() {
    const unlock = () => {
      this.init();
      window.removeEventListener('pointerdown', unlock);
      window.removeEventListener('keydown', unlock);
    };
    window.addEventListener('pointerdown', unlock, { once: true });
    window.addEventListener('keydown', unlock, { once: true });
  }

  init() {
    if (this.initialized) return;
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      this.ctx = new AudioCtx();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : this.masterVolume, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);
      this.initialized = true;
    } catch (e) {
      console.warn('AudioContext init failed:', e);
    }
  }

  ensureRunning() {
    if (!this.initialized) this.init();
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  setMuted(muted) {
    this.isMuted = !!muted;
    try { localStorage.setItem('fba_muted', String(this.isMuted)); } catch (_) {}
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setTargetAtTime(this.isMuted ? 0 : this.masterVolume, this.ctx.currentTime, 0.05);
    }
    return this.isMuted;
  }

  toggleMute() {
    return this.setMuted(!this.isMuted);
  }

  setVolume(vol) {
    this.masterVolume = Math.max(0, Math.min(1, vol));
    try { localStorage.setItem('fba_volume', String(this.masterVolume)); } catch (_) {}
    if (this.masterGain && this.ctx && !this.isMuted) {
      this.masterGain.gain.setTargetAtTime(this.masterVolume, this.ctx.currentTime, 0.05);
    }
  }

  // --- Procedural Sound Effects ---

  /** Referee match whistle */
  playWhistle() {
    if (this.isMuted || !this.ctx) return;
    this.ensureRunning();

    const t = this.ctx.currentTime;
    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    // High pitch whistle with rapid flutter
    osc1.type = 'triangle';
    osc1.frequency.setValueAtTime(2600, t);
    osc1.frequency.exponentialRampToValueAtTime(2800, t + 0.1);
    osc1.frequency.exponentialRampToValueAtTime(2550, t + 0.35);

    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(2850, t);
    osc2.frequency.exponentialRampToValueAtTime(3050, t + 0.1);
    osc2.frequency.exponentialRampToValueAtTime(2800, t + 0.35);

    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(0.35, t + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.38);

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(this.masterGain);

    osc1.start(t);
    osc2.start(t);
    osc1.stop(t + 0.4);
    osc2.stop(t + 0.4);
  }

  /** Physics body collision thump */
  playBounce(impulse = 5) {
    if (this.isMuted || !this.ctx) return;
    this.ensureRunning();

    const clampedImpulse = Math.min(Math.max(impulse, 1), 30);
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    const startFreq = 140 + clampedImpulse * 6;
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(startFreq, t);
    osc.frequency.exponentialRampToValueAtTime(45, t + 0.12);

    const vol = Math.min(0.4, 0.1 + (clampedImpulse / 30) * 0.3);
    gain.gain.setValueAtTime(vol, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.14);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(t);
    osc.stop(t + 0.15);
  }

  /** Spring jump boing */
  playBoing() {
    if (this.isMuted || !this.ctx) return;
    this.ensureRunning();

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(180, t);
    osc.frequency.exponentialRampToValueAtTime(540, t + 0.18);

    gain.gain.setValueAtTime(0.3, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.22);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(t);
    osc.stop(t + 0.25);
  }

  /** Out-of-bounds splash / drop */
  playElimination() {
    if (this.isMuted || !this.ctx) return;
    this.ensureRunning();

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(400, t);
    osc.frequency.exponentialRampToValueAtTime(70, t + 0.35);

    gain.gain.setValueAtTime(0.3, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.38);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(t);
    osc.stop(t + 0.4);
  }

  /** 3-2-1 Countdown and GO beep */
  playCountdown(isGo = false) {
    if (this.isMuted || !this.ctx) return;
    this.ensureRunning();

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    const freq = isGo ? 880 : 440;
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, t);

    const dur = isGo ? 0.35 : 0.15;
    gain.gain.setValueAtTime(0.25, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + dur);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(t);
    osc.stop(t + dur + 0.05);
  }

  /** Victory fanfare brass chords */
  playFanfare() {
    if (this.isMuted || !this.ctx) return;
    this.ensureRunning();

    const t = this.ctx.currentTime;
    const notes = [261.63, 329.63, 392.00, 523.25, 659.25]; // C4, E4, G4, C5, E5

    notes.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const startTime = t + idx * 0.12;

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, startTime);

      const dur = idx === notes.length - 1 ? 0.8 : 0.25;
      gain.gain.setValueAtTime(0, startTime);
      gain.gain.linearRampToValueAtTime(0.3, startTime + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + dur);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(startTime);
      osc.stop(startTime + dur + 0.05);
    });
  }

  /** Bowling pins crash */
  playPinCrash() {
    if (this.isMuted || !this.ctx) return;
    this.ensureRunning();

    const t = this.ctx.currentTime;
    // Layered noise & metallic resonant tones
    [320, 580, 890, 1200].forEach(freq => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, t);
      osc.frequency.exponentialRampToValueAtTime(freq * 0.6, t + 0.2);

      gain.gain.setValueAtTime(0.2, t);
      gain.gain.exponentialRampToValueAtTime(0.01, t + 0.22);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(t);
      osc.stop(t + 0.25);
    });
  }

  /** Soccer goal explosion / airhorn */
  playGoal() {
    if (this.isMuted || !this.ctx) return;
    this.ensureRunning();

    const t = this.ctx.currentTime;
    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc1.type = 'sawtooth';
    osc1.frequency.setValueAtTime(370, t);
    osc2.type = 'sawtooth';
    osc2.frequency.setValueAtTime(466, t);

    gain.gain.setValueAtTime(0.35, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.6);

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(this.masterGain);

    osc1.start(t);
    osc2.start(t);
    osc1.stop(t + 0.65);
    osc2.stop(t + 0.65);
  }

  /** UI click */
  playClick() {
    if (this.isMuted || !this.ctx) return;
    this.ensureRunning();

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(600, t);
    osc.frequency.exponentialRampToValueAtTime(300, t + 0.05);

    gain.gain.setValueAtTime(0.15, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.06);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(t);
    osc.stop(t + 0.07);
  }
}

export const audio = new AudioManager();
