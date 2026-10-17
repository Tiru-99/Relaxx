import * as THREE from 'three';
import { CAMERA } from '../config.js';
import { clamp } from '../core/math.js';
import { groundAt } from '../world/ground.js';

/**
 * Third-person camera that orbits the spirit. It glides closer when a tree crown would block
 * the view, using the canopy grid instead of raycasting thousands of triangles.
 */
export function createCameraRig(camera, canopy) {
  const rig = { yaw: 0, pitch: CAMERA.startPitch, distance: CAMERA.startDistance, targetYaw: 0, targetPitch: CAMERA.startPitch, targetDistance: CAMERA.startDistance };
  const desired = new THREE.Vector3(), look = new THREE.Vector3(), focus = new THREE.Vector3();

  function clearDistance(fx, fy, fz, dx, dy, dz, max) {
    for (let d = 1.5; d < max; d += 0.75) {
      const x = fx + dx * d, y = fy + dy * d, z = fz + dz * d;
      let blocked = false;
      canopy.forEachNear(x, z, 2, (c) => {
        if (!blocked && y > c.bottom && y < c.top && Math.hypot(x - c.x, z - c.z) < c.r) blocked = true;
      });
      if (blocked) return Math.max(1.8, d - 0.6);
    }
    return max;
  }

  return {
    rig,
    /** Snap the camera to its resting spot (on load) so it doesn't swoop in from the origin. */
    snap(target) {
      focus.set(target.x, target.y + 0.9, target.z);
      look.copy(focus);
      camera.position.set(target.x, target.y + 6, target.z + 10);
      camera.lookAt(look);
    },
    update(dt, target, input, idle) {
      rig.targetYaw -= input.look.dx * 0.005;
      rig.targetPitch = clamp(rig.targetPitch + input.look.dy * 0.004, 0.08, 1.25);
      rig.targetDistance = clamp(rig.targetDistance + input.look.zoom * 0.01, CAMERA.minDistance, CAMERA.maxDistance);
      input.look.dx = input.look.dy = input.look.zoom = 0;
      if (idle) rig.targetYaw += dt * 0.05; // slow drift on the title screen

      const k = 1 - Math.exp(-dt * 5);
      rig.yaw += (rig.targetYaw - rig.yaw) * k;
      rig.pitch += (rig.targetPitch - rig.pitch) * k;
      rig.distance += (rig.targetDistance - rig.distance) * k;

      focus.set(target.x, target.y + 0.9, target.z);
      const dx = Math.sin(rig.yaw) * Math.cos(rig.pitch), dy = Math.sin(rig.pitch), dz = Math.cos(rig.yaw) * Math.cos(rig.pitch);
      const distance = clearDistance(focus.x, focus.y, focus.z, dx, dy, dz, rig.distance);
      const cx = focus.x + dx * distance, cz = focus.z + dz * distance;
      desired.set(cx, Math.max(focus.y + dy * distance, groundAt(cx, cz) + 0.8, 0.9), cz);
      camera.position.lerp(desired, 1 - Math.exp(-dt * 8));
      look.lerp(focus, 1 - Math.exp(-dt * 10));
      camera.lookAt(look);
    },
  };
}
