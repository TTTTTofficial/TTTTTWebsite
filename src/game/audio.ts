// All sounds are synthesized; there are no audio files.

const MASTER_VOLUME = 0.8;

export class BasementAudio {
  private ctx = new AudioContext();
  private master = this.ctx.createGain();
  private echo = this.ctx.createDelay();
  private dripTimer = 0;

  constructor() {
    this.master.gain.value = MASTER_VOLUME;
    this.master.connect(this.ctx.destination);

    // A short slap-back echo makes everything sound like it's in a concrete room.
    const feedback = this.ctx.createGain();
    feedback.gain.value = 0.3;
    this.echo.delayTime.value = 0.16;
    this.echo.connect(feedback).connect(this.echo);
    this.echo.connect(this.master);

    this.startAmbience();
    this.scheduleDrip();
  }

  private startAmbience() {
    const { ctx } = this;

    // Brown noise: furnace rumble.
    const length = ctx.sampleRate * 4;
    const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    let last = 0;
    for (let i = 0; i < length; i++) {
      last = (last + 0.02 * (Math.random() * 2 - 1)) / 1.02;
      data[i] = last * 3.5;
    }
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;
    noise.loop = true;
    const lowpass = ctx.createBiquadFilter();
    lowpass.type = "lowpass";
    lowpass.frequency.value = 180;
    const noiseGain = ctx.createGain();
    noiseGain.gain.value = 0.25;
    noise.connect(lowpass).connect(noiseGain).connect(this.master);
    noise.start();

    // Electrical hum from the bulb.
    for (const [freq, vol] of [
      [60, 0.025],
      [120, 0.012],
    ]) {
      const osc = ctx.createOscillator();
      osc.frequency.value = freq;
      const gain = ctx.createGain();
      gain.gain.value = vol;
      osc.connect(gain).connect(this.master);
      osc.start();
    }
  }

  private scheduleDrip() {
    this.dripTimer = window.setTimeout(
      () => {
        this.drip();
        this.scheduleDrip();
      },
      4000 + Math.random() * 9000,
    );
  }

  private drip() {
    const { ctx } = this;
    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    osc.type = "sine";
    osc.frequency.setValueAtTime(1400, t);
    osc.frequency.exponentialRampToValueAtTime(380, t + 0.09);
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.12, t);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.22);
    osc.connect(gain);
    gain.connect(this.master);
    gain.connect(this.echo);
    osc.start(t);
    osc.stop(t + 0.25);
  }

  private tone(freq: number, start: number, duration: number, type: OscillatorType, volume: number) {
    const { ctx } = this;
    const osc = ctx.createOscillator();
    osc.type = type;
    osc.frequency.value = freq;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(volume, start + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
    osc.connect(gain);
    gain.connect(this.master);
    gain.connect(this.echo);
    osc.start(start);
    osc.stop(start + duration + 0.05);
  }

  /** The match-found fanfare. Hope. */
  ready() {
    const t = this.ctx.currentTime;
    const notes = [523.25, 659.25, 783.99, 1046.5];
    for (let rep = 0; rep < 2; rep++) {
      notes.forEach((f, i) => this.tone(f, t + rep * 0.7 + i * 0.11, 0.4, "triangle", 0.25));
    }
  }

  /** Hope, removed. */
  fail() {
    const t = this.ctx.currentTime;
    [392, 311.13, 233.08].forEach((f, i) => this.tone(f, t + i * 0.38, 0.6, "sawtooth", 0.08));
  }

  click() {
    this.tone(1800, this.ctx.currentTime, 0.05, "square", 0.05);
  }

  setMuted(muted: boolean) {
    this.master.gain.setTargetAtTime(muted ? 0 : MASTER_VOLUME, this.ctx.currentTime, 0.05);
  }

  dispose() {
    window.clearTimeout(this.dripTimer);
    void this.ctx.close();
  }
}
