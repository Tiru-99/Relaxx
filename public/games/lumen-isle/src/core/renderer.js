import * as THREE from 'three';
import { RENDER } from '../config.js';

/** Renderer, scene and camera, plus adaptive resolution that trades sharpness for smoothness. */
export function createStage(container) {
  const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
  let pixelRatio = Math.min(devicePixelRatio, RENDER.maxPixelRatio);
  renderer.setPixelRatio(pixelRatio);
  renderer.setSize(innerWidth, innerHeight);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  container.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog(0xffffff, RENDER.fogNear, RENDER.fogFar);
  const camera = new THREE.PerspectiveCamera(55, innerWidth / innerHeight, 0.1, RENDER.farClip);

  const onResize = () => {
    camera.aspect = innerWidth / innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(innerWidth, innerHeight);
  };
  addEventListener('resize', onResize);

  // Average frame time over ~2 s windows and nudge the pixel ratio up or down.
  let frames = 0, elapsed = 0;
  function adaptResolution(dt) {
    frames++;
    elapsed += dt;
    if (elapsed < 2) return;
    const frameMs = (elapsed / frames) * 1000;
    frames = 0;
    elapsed = 0;
    const ceiling = Math.min(devicePixelRatio, RENDER.maxPixelRatio);
    let next = pixelRatio;
    if (frameMs > RENDER.targetFrameMs) next = Math.max(RENDER.minPixelRatio, pixelRatio - 0.25);
    else if (frameMs < RENDER.targetFrameMs * 0.6) next = Math.min(ceiling, pixelRatio + 0.25);
    if (next !== pixelRatio) {
      pixelRatio = next;
      renderer.setPixelRatio(pixelRatio);
      renderer.setSize(innerWidth, innerHeight);
    }
  }

  return { renderer, scene, camera, adaptResolution };
}
