import { audio } from './audio-engine.js';

/**
 * Two looping beds: the ocean (brown noise breathing in and out) and the stream (brighter, faster).
 * Their volumes follow the spirit: closer to the shore or the water, louder.
 */

let oceanGain = null, streamGain = null;

function loopedNoise(seconds, smoothing, scale) {
  const ctx = audio.ctx, length = ctx.sampleRate * seconds;
  const buffer = ctx.createBuffer(1, length, ctx.sampleRate), data = buffer.getChannelData(0);
  let last = 0;
  for (let i = 0; i < length; i++) {
    last = (last + smoothing * (Math.random() * 2 - 1)) / (1 + smoothing);
    data[i] = last * scale;
  }
  const source = ctx.createBufferSource();
  source.buffer = buffer;
  source.loop = true;
  return source;
}

export function startAmbience() {
  const ctx = audio.ctx;

  const ocean = loopedNoise(6, 0.02, 3.5);
  const oceanFilter = ctx.createBiquadFilter();
  oceanFilter.type = 'lowpass';
  oceanFilter.frequency.value = 650;
  const swell = ctx.createGain();
  swell.gain.value = 0.7;
  const lfo = ctx.createOscillator();
  lfo.frequency.value = 0.09;
  const lfoDepth = ctx.createGain();
  lfoDepth.gain.value = 0.3;
  lfo.connect(lfoDepth).connect(swell.gain);
  lfo.start();
  oceanGain = ctx.createGain();
  oceanGain.gain.value = 0.05;
  ocean.connect(oceanFilter).connect(swell).connect(oceanGain).connect(audio.ambience);
  ocean.start();

  const stream = loopedNoise(4, 0.25, 1.2);
  const streamFilter = ctx.createBiquadFilter();
  streamFilter.type = 'bandpass';
  streamFilter.frequency.value = 1800;
  streamFilter.Q.value = 0.6;
  streamGain = ctx.createGain();
  streamGain.gain.value = 0;
  stream.connect(streamFilter).connect(streamGain).connect(audio.ambience);
  stream.start();
}

/** @param {number} shore 0..1 closeness to the sea  @param {number} stream 0..1 closeness to the stream */
export function setAmbienceMix(shore, stream) {
  if (!oceanGain) return;
  const t = audio.ctx.currentTime;
  oceanGain.gain.setTargetAtTime(0.035 + 0.14 * shore, t, 0.8);
  streamGain.gain.setTargetAtTime(0.09 * stream, t, 0.6);
}
