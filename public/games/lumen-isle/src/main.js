/**
 * Lumen Isle: entry point. Builds the world, wires systems together and runs the frame loop.
 * Each system lives in its own module; this file should only read as a table of contents.
 */
import { initAudio } from './audio/audio-engine.js';
import { startAmbience } from './audio/ambience.js';
import { startMusic, toggleMusic } from './audio/music.js';
import { sfx } from './audio/sfx.js';
import { createLoop } from './core/loop.js';
import { createStage } from './core/renderer.js';
import { SpatialGrid } from './core/spatial-grid.js';
import { sharedUniforms } from './core/wind.js';
import { createCreatures } from './creatures/index.js';
import { createDiscoveries } from './gameplay/discoveries.js';
import { createJournalState } from './gameplay/journal-state.js';
import { createLanterns } from './gameplay/lanterns.js';
import { createListen } from './gameplay/listen.js';
import { createMotes } from './gameplay/motes.js';
import { createSkyLanterns } from './gameplay/sky-lanterns.js';
import { LANDMARKS } from './landmarks/index.js';
import { createCameraRig } from './player/camera-rig.js';
import { createInput } from './player/input.js';
import { createSparks } from './player/sparks.js';
import { createSpirit } from './player/spirit.js';
import { createBreathGuide } from './ui/breath.js';
import { createHints } from './ui/hints.js';
import { createHud } from './ui/hud.js';
import { createJournal } from './ui/journal.js';
import { createTimeOfDay } from './ui/time-of-day.js';
import { createToast } from './ui/toast.js';
import { createClouds } from './world/clouds.js';
import { createEnvironment } from './world/environment.js';
import { createFireflies } from './world/fireflies.js';
import { createFlowers } from './world/flowers.js';
import { START } from './world/layout.js';
import { createOcean } from './world/ocean.js';
import { createRiver } from './world/river.js';
import { createTerrain } from './world/terrain.js';
import { createVegetation } from './world/vegetation.js';

const $ = (selector) => document.querySelector(selector);

// ---- world
const { renderer, scene, camera, adaptResolution } = createStage(document.body);
const ocean = createOcean(scene);
const env = createEnvironment(scene, { oceanMaterial: ocean.material });
createTerrain(scene);
const updateRiver = createRiver(scene, env);
const updateClouds = createClouds(scene, env);
const solids = new SpatialGrid(8), canopy = new SpatialGrid(8);
const flowers = createFlowers(scene);
const updateFireflies = createFireflies(scene, env);

// ---- the spirit
const sparks = createSparks(scene);
const input = createInput(renderer.domElement);
const player = createSpirit({ scene, solids, sparks, env }, START);
const cameraRig = createCameraRig(camera, canopy);

// ---- what you've found
const journal = createJournalState();
const toast = createToast($('#toast'));
const context = { scene, solids, env, sparks, player, flowers };
const discoveries = createDiscoveries(LANDMARKS, context, { journal, toast });
createVegetation(scene, solids, canopy); // after landmarks, so trees grow around them
const skyLanterns = createSkyLanterns(scene, player);
const updateLanterns = createLanterns(context, {
  journal, toast,
  onAllLit: () => setTimeout(() => {
    sfx.finale();
    skyLanterns.release();
    toast.show('the whole island glows', 8, 'stay as long as you like');
  }, 1500),
});
const updateMotes = createMotes(context, { journal });
const updateCreatures = createCreatures(scene, context, { journal, toast });
const listen = createListen(scene, { player, cameraRig, discoveries, toast });

// ---- interface
const hud = createHud($('#hud'), journal, LANDMARKS.length);
const breath = createBreathGuide($('#breath'));
const journalPanel = createJournal($('#journal'), journal, { places: discoveries.places, getSpirit: () => player.state });
const hints = createHints($('#hints'));
const timeOfDay = createTimeOfDay($('#sky-time'), env, { toast });

input.onAction('plant', () => {
  if (!player.state.grounded) return;
  const spot = player.frontPoint();
  if (flowers.plant(spot.x, spot.z)) { sfx.plant(); journal.addFlower(); }
});
input.onAction('breathe', () => breath.toggle());
input.onAction('music', () => toast.show(toggleMusic() ? 'music on' : 'music off'));
input.onAction('hints', () => hints.toggle());
input.onAction('journal', () => journalPanel.toggle());
input.onAction('close', () => journalPanel.toggle(false));
input.onAction('listen', () => listen.listen());
document.querySelectorAll('[data-action]').forEach((button) => {
  button.addEventListener('pointerdown', (e) => { e.preventDefault(); input.trigger(button.dataset.action); });
});

// ---- frame loop (order matters: input → player → camera → world → render)
const loop = createLoop();
loop.add((dt, time) => {
  sharedUniforms.uTime.value = time;
  input.poll();
  if (input.enabled) player.update(dt, time, input, cameraRig.rig.yaw);
  cameraRig.update(dt, player.state, input, !input.enabled);
  env.update(dt, player.state.x, player.state.z);
  updateRiver(dt, time);
  updateClouds(dt, time);
  updateFireflies(dt, time, player.state);
  flowers.update(dt);
  sparks.update(dt);
  discoveries.update(dt, time);
  updateLanterns(dt, time);
  updateMotes(dt, time);
  updateCreatures(dt, time);
  skyLanterns.update(dt, time);
  listen.update(dt);
  breath.update(dt);
  toast.update(dt);
  hints.update(dt);
  timeOfDay.update();
  journalPanel.update(dt);
  sharedUniforms.uCameraPos.value.copy(camera.position);
  renderer.render(scene, camera);
  adaptResolution(dt);
});
cameraRig.snap(player.state);
loop.start();

// ---- title screen
const begin = $('#begin');
begin.disabled = false;
begin.textContent = 'BEGIN';
begin.addEventListener('click', () => {
  initAudio();
  startAmbience();
  startMusic();
  input.enabled = true;
  const start = $('#start');
  start.style.opacity = '0';
  start.style.pointerEvents = 'none';
  setTimeout(() => start.remove(), 2600);
  hud.show();
  hints.showFull();
  timeOfDay.show();
  const returning = journal.progress.places.length > 0;
  setTimeout(() => toast.show(
    returning ? 'welcome back' : 'gather motes of light and wake the nine lanterns',
    6, returning ? 'the island kept your place' : 'press J for your journal, Q to listen'), 2500);
}, { once: true });

// Handy for testing from the console: __isle.give(9), __isle.time(0.9), __isle.goto(52, 74), __isle.look(Math.PI)
window.__isle = {
  player, journal,
  give: (n) => journal.addMotes(n),
  time: (phase) => env.setPhase(phase),
  goto: (x, z) => Object.assign(player.state, { x, z }),
  look: (yaw) => { cameraRig.rig.targetYaw = yaw; },
  info: () => renderer.info,
};
