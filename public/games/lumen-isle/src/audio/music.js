import { audio, bell, midiToHz, pentatonic } from './audio-engine.js';

/** Warm overlapping pad chords with an occasional bell melody drifting over the top. */

const CHORDS = [
  [50, 57, 61, 64, 66], // Dmaj9
  [47, 54, 57, 62, 66], // Bm9
  [43, 50, 54, 59, 62], // Gmaj7
  [45, 52, 57, 59, 64], // Asus add9
];
const CHORD_SECONDS = 10;

let chordIndex = 0;
let musicOn = true;

function padNote(midi, start, duration, volume) {
  const ctx = audio.ctx;
  const envelope = ctx.createGain();
  envelope.gain.setValueAtTime(0, start);
  envelope.gain.setTargetAtTime(volume, start, 1.4);
  envelope.gain.setTargetAtTime(0, start + duration, 1.8);
  const filter = ctx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.value = 1100;
  filter.Q.value = 0.3;
  filter.connect(envelope).connect(audio.music);
  for (const [type, detune, level] of [['sine', 0, 1], ['triangle', 6, 0.5], ['sine', -7, 0.8]]) {
    const osc = ctx.createOscillator();
    osc.type = type;
    osc.frequency.value = midiToHz(midi);
    osc.detune.value = detune;
    const oscGain = ctx.createGain();
    oscGain.gain.value = level;
    osc.connect(oscGain).connect(filter);
    osc.start(start);
    osc.stop(start + duration + 10);
  }
}

function playNextChord() {
  const start = audio.ctx.currentTime + 0.05;
  const chord = CHORDS[chordIndex++ % CHORDS.length];
  chord.forEach((note) => padNote(note, start, CHORD_SECONDS, 0.028));
  padNote(chord[0] - 12, start, CHORD_SECONDS, 0.05);
  setTimeout(playNextChord, CHORD_SECONDS * 1000);
}

function melodyTick() {
  if (Math.random() < 0.65) {
    const step = 5 + Math.floor(Math.random() * 8);
    bell(pentatonic(step), { volume: 0.045, decay: 4.5, destination: audio.music });
    if (Math.random() < 0.3) {
      bell(pentatonic(step + 2), { volume: 0.03, decay: 4, destination: audio.music, when: audio.ctx.currentTime + 0.45 });
    }
  }
  setTimeout(melodyTick, 1800 + Math.random() * 3600);
}

export function startMusic() {
  playNextChord();
  setTimeout(melodyTick, 4000);
}

/** @returns {boolean} whether music is now on */
export function toggleMusic() {
  musicOn = !musicOn;
  audio.music.gain.setTargetAtTime(musicOn ? 0.5 : 0, audio.ctx.currentTime, 1.2);
  return musicOn;
}
