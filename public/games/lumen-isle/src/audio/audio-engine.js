/**
 * Everything you hear is synthesized live with the Web Audio API: no audio files to download.
 * This module owns the AudioContext and the mixing buses; music.js and sfx.js play through it.
 */

const PENTATONIC = [0, 2, 4, 7, 9]; // D major pentatonic

export const midiToHz = (midi) => 440 * Math.pow(2, (midi - 69) / 12);

/** Note `step` of the pentatonic scale, counting up from `base`. */
export const pentatonic = (step, base = 62) =>
  base + PENTATONIC[((step % 5) + 5) % 5] + 12 * Math.floor(step / 5);

export const audio = {
  /** @type {AudioContext | null} */ ctx: null,
  master: null,
  music: null,
  sfx: null,
  reverb: null,
  noise: null,
  ambience: null,
};

function makeImpulse(ctx, seconds, decay) {
  const length = ctx.sampleRate * seconds, buffer = ctx.createBuffer(2, length, ctx.sampleRate);
  for (let channel = 0; channel < 2; channel++) {
    const data = buffer.getChannelData(channel);
    for (let i = 0; i < length; i++) data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, decay);
  }
  return buffer;
}

function gain(ctx, value, destination) {
  const node = ctx.createGain();
  node.gain.value = value;
  if (destination) node.connect(destination);
  return node;
}

/** Must be called from a user gesture (browsers block audio until then). */
export function initAudio() {
  const ctx = new (window.AudioContext || window.webkitAudioContext)();
  const compressor = ctx.createDynamicsCompressor();
  compressor.threshold.value = -18;
  compressor.ratio.value = 3;
  compressor.connect(ctx.destination);

  audio.ctx = ctx;
  audio.master = gain(ctx, 0.85, compressor);
  audio.reverb = ctx.createConvolver();
  audio.reverb.buffer = makeImpulse(ctx, 5, 2.8);
  audio.reverb.connect(gain(ctx, 0.7, audio.master));

  audio.music = gain(ctx, 0, audio.master);
  audio.music.gain.setTargetAtTime(0.5, ctx.currentTime, 3);
  audio.music.connect(gain(ctx, 0.9, audio.reverb));

  audio.sfx = gain(ctx, 0.7, audio.master);
  audio.sfx.connect(gain(ctx, 0.45, audio.reverb));

  audio.ambience = gain(ctx, 1, audio.master);

  audio.noise = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
  const data = audio.noise.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
}

/** A soft kalimba-like bell. `destination` defaults to the effects bus. */
export function bell(midi, { volume = 0.08, when = audio.ctx.currentTime, decay = 3.2, destination = audio.sfx } = {}) {
  const ctx = audio.ctx, hz = midiToHz(midi);
  const body = ctx.createGain();
  body.gain.setValueAtTime(0.0001, when);
  body.gain.linearRampToValueAtTime(volume, when + 0.012);
  body.gain.exponentialRampToValueAtTime(0.0001, when + decay);
  const fundamental = ctx.createOscillator();
  fundamental.frequency.value = hz;
  fundamental.connect(body).connect(destination);
  fundamental.start(when);
  fundamental.stop(when + decay + 0.1);

  const shimmer = ctx.createGain();
  shimmer.gain.setValueAtTime(volume * 0.25, when);
  shimmer.gain.exponentialRampToValueAtTime(0.0001, when + decay * 0.3);
  const overtone = ctx.createOscillator();
  overtone.frequency.value = hz * 3.01;
  overtone.connect(shimmer).connect(destination);
  overtone.start(when);
  overtone.stop(when + decay);
}

/** A short filtered burst of noise: footsteps, splashes, rustles. */
export function noiseBurst({ frequency = 700, q = 1.2, volume = 0.08, duration = 0.12, type = 'bandpass' }) {
  const ctx = audio.ctx, t = ctx.currentTime;
  const source = ctx.createBufferSource();
  source.buffer = audio.noise;
  const filter = ctx.createBiquadFilter();
  filter.type = type;
  filter.frequency.value = frequency;
  filter.Q.value = q;
  const envelope = ctx.createGain();
  envelope.gain.setValueAtTime(0.0001, t);
  envelope.gain.linearRampToValueAtTime(volume, t + 0.01);
  envelope.gain.exponentialRampToValueAtTime(0.0001, t + duration);
  source.connect(filter).connect(envelope).connect(audio.sfx);
  source.start(t, Math.random() * 1.5, duration + 0.05);
}

export const audioReady = () => audio.ctx !== null;
