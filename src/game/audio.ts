// Web Audio API Retro 8-bit Synthesizer for Contra Sound Effects & BGM

class RetroAudioEngine {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;
  private sfxVolume: number = 0.5;
  private bgmVolume: number = 0.35;
  private isBgmPlaying: boolean = false;
  private bgmInterval: number | null = null;
  private currentBgmTrack: 'stage' | 'boss' | null = null;

  constructor() {
    // Lazy initialize on first interaction
  }

  public init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    if (this.isMuted) {
      this.stopBgm();
    } else if (this.currentBgmTrack) {
      this.playBgm(this.currentBgmTrack);
    }
    return this.isMuted;
  }

  public getIsMuted(): boolean {
    return this.isMuted;
  }

  public setSfxVolume(vol: number) {
    this.sfxVolume = Math.max(0, Math.min(1, vol));
  }

  public setBgmVolume(vol: number) {
    this.bgmVolume = Math.max(0, Math.min(1, vol));
  }

  // SOUND EFFECTS
  public shootNormal() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'square';
    osc.frequency.setValueAtTime(480, t);
    osc.frequency.exponentialRampToValueAtTime(140, t + 0.08);

    gain.gain.setValueAtTime(this.sfxVolume * 0.4, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.08);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(t);
    osc.stop(t + 0.09);
  }

  public shootMachine() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'square';
    osc.frequency.setValueAtTime(600, t);
    osc.frequency.exponentialRampToValueAtTime(220, t + 0.06);

    gain.gain.setValueAtTime(this.sfxVolume * 0.45, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.06);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(t);
    osc.stop(t + 0.065);
  }

  public shootSpread() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    [380, 520, 680].forEach((freq, i) => {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, t + i * 0.01);
      osc.frequency.exponentialRampToValueAtTime(120, t + 0.12);

      gain.gain.setValueAtTime(this.sfxVolume * 0.35, t + i * 0.01);
      gain.gain.exponentialRampToValueAtTime(0.01, t + 0.12);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(t + i * 0.01);
      osc.stop(t + 0.13);
    });
  }

  public shootLaser() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(1400, t);
    osc.frequency.exponentialRampToValueAtTime(300, t + 0.16);

    gain.gain.setValueAtTime(this.sfxVolume * 0.5, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.16);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(t);
    osc.stop(t + 0.17);
  }

  public shootFire() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(260, t);
    osc.frequency.linearRampToValueAtTime(450, t + 0.06);
    osc.frequency.linearRampToValueAtTime(160, t + 0.14);

    gain.gain.setValueAtTime(this.sfxVolume * 0.5, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.15);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(t);
    osc.stop(t + 0.16);
  }

  public jump() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'square';
    osc.frequency.setValueAtTime(150, t);
    osc.frequency.exponentialRampToValueAtTime(600, t + 0.15);

    gain.gain.setValueAtTime(this.sfxVolume * 0.35, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.15);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(t);
    osc.stop(t + 0.16);
  }

  public explode(large: boolean = false) {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;

    const duration = large ? 0.45 : 0.22;
    const bufferSize = this.ctx.sampleRate * duration;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(large ? 400 : 800, this.ctx.currentTime);
    filter.frequency.linearRampToValueAtTime(50, this.ctx.currentTime + duration);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(this.sfxVolume * (large ? 0.7 : 0.45), this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + duration);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);

    noise.start();
  }

  public powerup() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;

    const notes = [330, 440, 554, 659, 880];
    const t = this.ctx.currentTime;

    notes.forEach((freq, i) => {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'square';
      osc.frequency.setValueAtTime(freq, t + i * 0.05);

      gain.gain.setValueAtTime(this.sfxVolume * 0.4, t + i * 0.05);
      gain.gain.exponentialRampToValueAtTime(0.01, t + i * 0.05 + 0.08);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(t + i * 0.05);
      osc.stop(t + i * 0.05 + 0.09);
    });
  }

  public playerDeath() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(450, t);
    osc.frequency.exponentialRampToValueAtTime(60, t + 0.35);

    gain.gain.setValueAtTime(this.sfxVolume * 0.5, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.35);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(t);
    osc.stop(t + 0.36);
  }

  public bossWarning() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    for (let i = 0; i < 4; i++) {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'square';
      const freq = i % 2 === 0 ? 880 : 660;
      osc.frequency.setValueAtTime(freq, t + i * 0.18);

      gain.gain.setValueAtTime(this.sfxVolume * 0.45, t + i * 0.18);
      gain.gain.exponentialRampToValueAtTime(0.01, t + i * 0.18 + 0.15);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(t + i * 0.18);
      osc.stop(t + i * 0.18 + 0.16);
    }
  }

  public victoryFanfare() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;

    const notes = [261.63, 329.63, 392.0, 523.25, 659.25, 783.99, 1046.5];
    const t = this.ctx.currentTime;

    notes.forEach((freq, idx) => {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'square';
      osc.frequency.setValueAtTime(freq, t + idx * 0.1);

      gain.gain.setValueAtTime(this.sfxVolume * 0.45, t + idx * 0.1);
      gain.gain.exponentialRampToValueAtTime(0.01, t + idx * 0.1 + (idx === notes.length - 1 ? 0.6 : 0.15));

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(t + idx * 0.1);
      osc.stop(t + idx * 0.1 + (idx === notes.length - 1 ? 0.65 : 0.16));
    });
  }

  // 8-BIT PROCEDURAL CHIPTUNE BACKGROUND MUSIC
  public playBgm(track: 'stage' | 'boss') {
    this.currentBgmTrack = track;
    if (this.isMuted) return;
    this.init();
    if (this.isBgmPlaying) this.stopBgm();

    this.isBgmPlaying = true;

    // Stage 1 Jungle Contra-inspired Bassline & Arpeggios
    const stageBassNotes = [110, 110, 130.81, 146.83, 110, 110, 98.0, 123.47];
    const stageMelodyNotes = [
      440, 0, 523.25, 587.33, 659.25, 587.33, 523.25, 440,
      392, 0, 440, 523.25, 440, 392, 349.23, 392
    ];

    // Boss Ominous Fast Drive
    const bossBassNotes = [82.41, 82.41, 92.5, 82.41, 110, 98, 87.31, 82.41];
    const bossMelodyNotes = [
      329.63, 349.23, 329.63, 293.66, 329.63, 392, 369.99, 329.63
    ];

    const bassNotes = track === 'stage' ? stageBassNotes : bossBassNotes;
    const melodyNotes = track === 'stage' ? stageMelodyNotes : bossMelodyNotes;
    const stepDuration = track === 'stage' ? 140 : 110; // ms per 16th note

    let step = 0;

    this.bgmInterval = window.setInterval(() => {
      if (!this.ctx || this.isMuted || !this.isBgmPlaying) return;

      const t = this.ctx.currentTime;

      // 1. Bassline channel (Triangle/Square wave)
      const bassFreq = bassNotes[step % bassNotes.length];
      if (bassFreq > 0) {
        const bassOsc = this.ctx.createOscillator();
        const bassGain = this.ctx.createGain();

        bassOsc.type = 'triangle';
        bassOsc.frequency.setValueAtTime(bassFreq, t);

        bassGain.gain.setValueAtTime(this.bgmVolume * 0.5, t);
        bassGain.gain.exponentialRampToValueAtTime(0.01, t + 0.12);

        bassOsc.connect(bassGain);
        bassGain.connect(this.ctx.destination);

        bassOsc.start(t);
        bassOsc.stop(t + 0.13);
      }

      // 2. Melody Lead channel (Pulse/Square wave)
      const melodyFreq = melodyNotes[step % melodyNotes.length];
      if (melodyFreq > 0) {
        const melOsc = this.ctx.createOscillator();
        const melGain = this.ctx.createGain();

        melOsc.type = 'square';
        melOsc.frequency.setValueAtTime(melodyFreq, t);

        melGain.gain.setValueAtTime(this.bgmVolume * 0.3, t);
        melGain.gain.exponentialRampToValueAtTime(0.01, t + 0.14);

        melOsc.connect(melGain);
        melGain.connect(this.ctx.destination);

        melOsc.start(t);
        melOsc.stop(t + 0.15);
      }

      // 3. Noise Percussion channel (snare on beats 2 & 4, hihat on offbeats)
      if (step % 4 === 2) {
        // Snare
        this.playSnare(t);
      } else if (step % 2 === 0) {
        // Hi-hat
        this.playHiHat(t);
      }

      step++;
    }, stepDuration);
  }

  private playSnare(t: number) {
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(180, t);
    osc.frequency.exponentialRampToValueAtTime(40, t + 0.05);

    gain.gain.setValueAtTime(this.bgmVolume * 0.25, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.05);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(t);
    osc.stop(t + 0.055);
  }

  private playHiHat(t: number) {
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(8000, t);

    gain.gain.setValueAtTime(this.bgmVolume * 0.1, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.02);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(t);
    osc.stop(t + 0.025);
  }

  public stopBgm() {
    this.isBgmPlaying = false;
    if (this.bgmInterval !== null) {
      clearInterval(this.bgmInterval);
      this.bgmInterval = null;
    }
  }
}

export const retroAudio = new RetroAudioEngine();
