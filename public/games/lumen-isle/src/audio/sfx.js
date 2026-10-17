import { audio, audioReady, bell, noiseBurst, pentatonic } from './audio-engine.js';

/** Named sound effects. Every function is safe to call before audio has started (it just stays quiet). */

let moteNote = 0;

const at = (offset) => audio.ctx.currentTime + offset;

export const sfx = {
  step(onSand) {
    if (!audioReady()) return;
    noiseBurst(onSand
      ? { frequency: 1500 + Math.random() * 300, q: 0.8, volume: 0.05, duration: 0.16 }
      : { frequency: 650 + Math.random() * 300, q: 1.4, volume: 0.07, duration: 0.1 });
  },
  splash() {
    if (audioReady()) noiseBurst({ frequency: 2400, q: 0.5, volume: 0.06, duration: 0.25 });
  },
  hop() {
    if (!audioReady()) return;
    const ctx = audio.ctx, t = ctx.currentTime;
    const source = ctx.createBufferSource();
    source.buffer = audio.noise;
    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.Q.value = 2;
    filter.frequency.setValueAtTime(300, t);
    filter.frequency.exponentialRampToValueAtTime(1400, t + 0.35);
    const envelope = ctx.createGain();
    envelope.gain.setValueAtTime(0.0001, t);
    envelope.gain.linearRampToValueAtTime(0.05, t + 0.08);
    envelope.gain.exponentialRampToValueAtTime(0.0001, t + 0.4);
    source.connect(filter).connect(envelope).connect(audio.sfx);
    source.start(t, 0, 0.5);
  },
  land() {
    if (audioReady()) noiseBurst({ frequency: 260, q: 0.7, volume: 0.09, duration: 0.18, type: 'lowpass' });
  },
  plant() {
    if (audioReady()) bell(pentatonic(10 + Math.floor(Math.random() * 5)), { volume: 0.05, decay: 1.6 });
  },
  mote() {
    if (audioReady()) bell(pentatonic(5 + (moteNote++ % 10)), { volume: 0.09 });
  },
  lantern() {
    if (!audioReady()) return;
    const base = Math.floor(Math.random() * 3);
    [0, 2, 4, 7].forEach((step, k) => bell(pentatonic(base + step + 3), { volume: 0.08, decay: 4, when: at(k * 0.18) }));
  },
  stone(index) {
    if (audioReady()) bell(pentatonic(index, 50), { volume: 0.12, decay: 5 });
  },
  discovery(index) {
    if (!audioReady()) return;
    [4, 7, 9].forEach((step, k) => bell(pentatonic(step + (index % 5)), { volume: 0.055, decay: 4.5, when: at(k * 0.28) }));
  },
  creature() {
    if (!audioReady()) return;
    [9, 7].forEach((step, k) => bell(pentatonic(step), { volume: 0.04, decay: 2.5, when: at(k * 0.2) }));
  },
  finale() {
    if (!audioReady()) return;
    for (let k = 0; k < 14; k++) bell(pentatonic(3 + k), { volume: 0.06, decay: 5, when: at(k * 0.22) });
  },
  /** A chime placed in stereo toward something: -1 is fully left, 1 fully right. */
  listen(pan, distanceFactor) {
    if (!audioReady()) return;
    const panner = audio.ctx.createStereoPanner();
    panner.pan.value = Math.max(-1, Math.min(1, pan));
    panner.connect(audio.sfx);
    const volume = 0.05 + 0.07 * (1 - distanceFactor);
    [0, 4].forEach((step, k) => bell(pentatonic(7 + step), { volume, decay: 3.5, when: at(k * 0.35), destination: panner }));
  },
};
