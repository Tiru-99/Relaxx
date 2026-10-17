import * as THREE from 'three';
import { DAY_LENGTH_SECONDS, RENDER, START_DAY_PHASE } from '../config.js';
import { TAU } from '../core/math.js';

/**
 * Sky dome, stars, sun and the day/night cycle. Other systems read `env.night` (0 day … 1 night)
 * instead of computing their own time of day.
 */

const key = (phase, [top, bottom, light, intensity, hemi, night, water]) => ({
  phase, top: new THREE.Color(top), bottom: new THREE.Color(bottom), light: new THREE.Color(light),
  intensity, hemi, night, water: new THREE.Color(water),
});
const NIGHT = [0x0e1338, 0x3b3672, 0x8a98d8, 0.45, 0.5, 1, 0x26426e];
const DAWN = [0x6d82c4, 0xf7bcae, 0xffc8a2, 1.3, 0.75, 0.25, 0x8fb0c8];
const DAY = [0x7ec4ec, 0xdcf0f6, 0xfff4e0, 2.2, 1.0, 0, 0x6fc3d0];
const DUSK = [0x4d4b8e, 0xf8a986, 0xffa274, 1.2, 0.7, 0.35, 0x7d8fb5];
const KEYS = [key(0, NIGHT), key(0.12, NIGHT), key(0.25, DAWN), key(0.38, DAY), key(0.6, DAY), key(0.74, DUSK), key(0.87, NIGHT), key(1, NIGHT)];

const WHITE = new THREE.Color(0xffffff);

function createSkyDome(scene) {
  const uniforms = { top: { value: new THREE.Color() }, bottom: { value: new THREE.Color() } };
  const dome = new THREE.Mesh(new THREE.SphereGeometry(RENDER.farClip * 0.8, 32, 16), new THREE.ShaderMaterial({
    uniforms, side: THREE.BackSide, depthWrite: false, fog: false,
    vertexShader: 'varying vec3 vP; void main(){ vP = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
    fragmentShader: `uniform vec3 top; uniform vec3 bottom; varying vec3 vP;
      void main(){ float h = normalize(vP).y; gl_FragColor = vec4(mix(bottom, top, pow(max(h, 0.0), 0.55)), 1.0);
      #include <tonemapping_fragment>
      #include <colorspace_fragment>
      }`,
  }));
  dome.renderOrder = -1;
  scene.add(dome);
  return { dome, uniforms };
}

function createStars(scene, radius) {
  const positions = new Float32Array(1600 * 3);
  for (let i = 0; i < 1600; i++) {
    const u = Math.random() * TAU, v = Math.acos(0.05 + Math.random() * 0.95);
    positions.set([radius * Math.sin(v) * Math.cos(u), radius * Math.cos(v), radius * Math.sin(v) * Math.sin(u)], i * 3);
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  const material = new THREE.PointsMaterial({ color: 0xffffff, size: 2, sizeAttenuation: false, transparent: true, opacity: 0, fog: false, depthWrite: false });
  const stars = new THREE.Points(geometry, material);
  scene.add(stars);
  return { stars, material };
}

/**
 * @param {THREE.Scene} scene
 * @param {{ oceanMaterial: THREE.MeshStandardMaterial }} targets
 */
export function createEnvironment(scene, { oceanMaterial }) {
  const sky = createSkyDome(scene);
  const starField = createStars(scene, RENDER.farClip * 0.7);

  const hemi = new THREE.HemisphereLight(0xffffff, 0x4a5a3a, 0.8);
  const sun = new THREE.DirectionalLight(0xffffff, 2);
  sun.castShadow = true;
  sun.shadow.mapSize.set(RENDER.shadowMapSize, RENDER.shadowMapSize);
  const e = RENDER.shadowExtent;
  Object.assign(sun.shadow.camera, { left: -e, right: e, top: e, bottom: -e, near: 1, far: 200 });
  sun.shadow.bias = -0.0005;
  sun.shadow.normalBias = 0.03;
  scene.add(hemi, sun, sun.target);

  const env = { phase: START_DAY_PHASE, night: 0, sun };

  function apply() {
    let k = 0;
    while (KEYS[k + 1].phase <= env.phase) k++;
    const a = KEYS[k], b = KEYS[k + 1];
    let f = (env.phase - a.phase) / (b.phase - a.phase);
    f = f * f * (3 - 2 * f);
    sky.uniforms.top.value.copy(a.top).lerp(b.top, f);
    sky.uniforms.bottom.value.copy(a.bottom).lerp(b.bottom, f);
    scene.fog.color.copy(sky.uniforms.bottom.value);
    sun.color.copy(a.light).lerp(b.light, f);
    sun.intensity = a.intensity + (b.intensity - a.intensity) * f;
    hemi.intensity = a.hemi + (b.hemi - a.hemi) * f;
    hemi.color.copy(sky.uniforms.top.value).lerp(WHITE, 0.5);
    oceanMaterial.color.copy(a.water).lerp(b.water, f);
    env.night = a.night + (b.night - a.night) * f;
    starField.material.opacity = Math.max(0, env.night - 0.2) * 1.1;
  }

  /** Advance time and keep the sun (and its shadow box) centred on the spirit. */
  env.update = (dt, focusX, focusZ) => {
    env.phase = (env.phase + dt / DAY_LENGTH_SECONDS) % 1;
    apply();
    const angle = env.phase * TAU;
    sun.target.position.set(focusX, 0, focusZ);
    sun.position.set(focusX + Math.cos(angle) * 60, 55 + Math.sin(angle) * 15, focusZ + Math.sin(angle) * 60);
    sky.dome.position.set(focusX, 0, focusZ);
    starField.stars.position.set(focusX, 0, focusZ);
  };
  env.skyBottom = sky.uniforms.bottom.value;
  env.setPhase = (phase) => { env.phase = phase; };

  apply();
  return env;
}
