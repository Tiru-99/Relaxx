import * as THREE from 'three';
import { glowSprite } from '../core/glow.js';
import { addMesh, addSolid, anchorAt, flat } from './shared.js';

/** The Old Lighthouse: on the southern cape. At night its lamp wakes and a soft beam turns. */
export const lighthouse = {
  id: 'lighthouse',
  name: 'the old lighthouse',
  message: 'it still keeps watch, mostly for the birds',
  build({ scene, solids, env }) {
    const group = anchorAt(scene, 'lighthouse', { yOffset: -0.2 });
    const white = flat(0xf1ece1), band = flat(0xc98a7a), roof = flat(0x3e3550);
    addMesh(group, new THREE.CylinderGeometry(1.4, 1.9, 2, 10), white, { position: [0, 1, 0] });
    addMesh(group, new THREE.CylinderGeometry(1.1, 1.4, 2.4, 10), band, { position: [0, 3.2, 0] });
    addMesh(group, new THREE.CylinderGeometry(0.9, 1.1, 2.4, 10), white, { position: [0, 5.6, 0] });
    addMesh(group, new THREE.CylinderGeometry(1.25, 1.25, 0.15, 10), roof, { position: [0, 6.85, 0] });
    const lampMaterial = new THREE.MeshStandardMaterial({ color: 0xfff1d0, emissive: 0xffc27a, emissiveIntensity: 0.1 });
    addMesh(group, new THREE.CylinderGeometry(0.6, 0.6, 0.9, 8), lampMaterial, { position: [0, 7.4, 0] });
    addMesh(group, new THREE.ConeGeometry(0.85, 0.8, 8), roof, { position: [0, 8.25, 0] });
    addSolid(solids, group, 0, 0, 2);

    const halo = glowSprite(0xffd69a, 0, 6);
    halo.position.y = 7.4;
    group.add(halo);

    // A long, faint cone of light that sweeps slowly over the sea.
    const beamMaterial = new THREE.MeshBasicMaterial({ color: 0xffe2b0, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide });
    const beamGeometry = new THREE.ConeGeometry(3, 34, 16, 1, true).translate(0, -17, 0).rotateZ(Math.PI / 2);
    const beam = new THREE.Mesh(beamGeometry, beamMaterial);
    beam.position.y = 7.4;
    group.add(beam);

    return (dt, time) => {
      const glow = Math.max(0, env.night - 0.15);
      lampMaterial.emissiveIntensity = 0.1 + glow * 2;
      halo.material.opacity = glow * 0.8;
      beamMaterial.opacity = glow * 0.07;
      beam.visible = glow > 0.01;
      beam.rotation.y = time * 0.25;
    };
  },
};
