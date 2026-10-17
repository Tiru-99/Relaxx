import * as THREE from 'three';
import { bell, pentatonic, audioReady } from '../audio/audio-engine.js';
import { jitter } from '../core/math.js';
import { PLACES } from '../world/layout.js';
import { addMesh, addSolid, anchorAt, flat } from './shared.js';

/** The Listening Overlook: wind chimes on the eastern bluff that ring softly when you're near. */
export const overlook = {
  id: 'overlook',
  name: 'the listening overlook',
  message: 'the breeze carries a silver answer',
  build({ scene, solids, player }) {
    const group = anchorAt(scene, 'overlook', { rotation: 0.6 });
    const wood = flat(0x73543d, { roughness: 0.95 });
    const metal = new THREE.MeshStandardMaterial({ color: 0xd9d2b4, metalness: 0.45, roughness: 0.35, emissive: 0x8f875f, emissiveIntensity: 0.05 });
    addMesh(group, new THREE.CylinderGeometry(0.1, 0.14, 3.1, 7), wood, { position: [0, 1.55, 0] });
    addMesh(group, new THREE.BoxGeometry(2.2, 0.12, 0.12), wood, { position: [-0.9, 2.95, 0] });
    addSolid(solids, group, 0, 0, 0.3);

    const chimes = [];
    for (let i = 0; i < 4; i++) {
      const chime = new THREE.Group();
      chime.position.set(-0.55 - i * 0.38, 2.72 - (i % 2) * 0.12, 0);
      addMesh(chime, new THREE.CylinderGeometry(0.045, 0.055, 0.72 + i * 0.08, 10, 1, true), metal, { position: [0, -0.4, 0] });
      group.add(chime);
      chimes.push(chime);
    }

    let nextRing = 2;
    return (dt, time) => {
      chimes.forEach((chime, i) => { chime.rotation.z = Math.sin(time * 0.75 + i * 1.4) * 0.055; });
      // Only chime while the spirit is close, so the sound is something you walk into.
      const near = Math.hypot(player.state.x - PLACES.overlook.x, player.state.z - PLACES.overlook.z) < 14;
      nextRing -= dt;
      if (near && nextRing <= 0 && audioReady()) {
        nextRing = jitter(2.5, 6);
        bell(pentatonic(8 + Math.floor(jitter(0, 6))), { volume: 0.035, decay: 5 });
      }
    };
  },
};
