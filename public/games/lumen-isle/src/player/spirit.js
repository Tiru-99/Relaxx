import * as THREE from 'three';
import { setAmbienceMix } from '../audio/ambience.js';
import { sfx } from '../audio/sfx.js';
import { PLAYER } from '../config.js';
import { glowMaterial } from '../core/glow.js';
import { angleDelta, clamp, jitter } from '../core/math.js';
import { canStandAt, groundAt, isOnPlatform, keepOffRails } from '../world/ground.js';
import { heightAt, nearestRiver } from '../world/heightfield.js';

/** The little glowing spirit you play as: its look, movement, collisions and footsteps. */

function buildSpiritMesh() {
  const root = new THREE.Group(), body = new THREE.Group();
  root.add(body);
  const shell = new THREE.Mesh(
    new THREE.SphereGeometry(0.42, 24, 18),
    new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xd8ecff, emissiveIntensity: 0.55, roughness: 0.4 }));
  shell.castShadow = true;
  body.add(shell);
  const eyeMaterial = new THREE.MeshBasicMaterial({ color: 0x2b2a40 });
  const cheekMaterial = new THREE.MeshBasicMaterial({ color: 0xffb8c8, transparent: true, opacity: 0.7 });
  for (const side of [-1, 1]) {
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.055, 10, 8), eyeMaterial);
    eye.position.set(side * 0.14, 0.08, 0.38);
    eye.scale.set(1, 1.3, 0.6);
    const cheek = new THREE.Mesh(new THREE.SphereGeometry(0.05, 8, 6), cheekMaterial);
    cheek.position.set(side * 0.25, -0.04, 0.33);
    cheek.scale.set(1.3, 0.7, 0.5);
    body.add(eye, cheek);
  }
  const aura = new THREE.Sprite(glowMaterial(0xcfe6ff, 0.55));
  aura.scale.setScalar(2.6);
  body.add(aura);
  // The spirit's own light is the only point light on the island (lanterns use glow sprites instead).
  const light = new THREE.PointLight(0xcfe6ff, 0, 9, 1.6);
  light.position.y = 0.3;
  root.add(light);
  return { root, body, shell, aura, light };
}

/**
 * @param {{ scene: THREE.Scene, solids: import('../core/spatial-grid.js').SpatialGrid, sparks: ReturnType<import('./sparks.js').createSparks>, env: { night: number } }} deps
 */
export function createSpirit({ scene, solids, sparks, env }, start) {
  const mesh = buildSpiritMesh();
  scene.add(mesh.root);
  const state = {
    x: start.x, z: start.z, y: groundAt(start.x, start.z) + 0.55,
    vx: 0, vz: 0, vy: 0, grounded: true, facing: Math.PI, stepDistance: 0, squash: 0, trailTimer: 0,
  };

  function collide(nx, nz) {
    solids.forEachNear(nx, nz, 2, (s) => {
      const dx = nx - s.x, dz = nz - s.z, d = Math.hypot(dx, dz), min = s.r + PLAYER.radius;
      if (d < min && d > 0.0001) { nx = s.x + (dx / d) * min; nz = s.z + (dz / d) * min; }
    });
    return [nx, nz];
  }

  function move(dt, input, cameraYaw) {
    const speed = input.drift ? PLAYER.driftSpeed : PLAYER.walkSpeed;
    const fx = -Math.sin(cameraYaw), fz = -Math.cos(cameraYaw), rx = Math.cos(cameraYaw), rz = -Math.sin(cameraYaw);
    const targetVx = (fx * input.move.z + rx * input.move.x) * speed, targetVz = (fz * input.move.z + rz * input.move.x) * speed;
    const response = 1 - Math.exp(-dt * 6);
    state.vx += (targetVx - state.vx) * response;
    state.vz += (targetVz - state.vz) * response;

    // Railings first (so the bridge's edges feel the same on both sides), then slide along the shoreline.
    let [nx, nz] = keepOffRails(state.x, state.z, state.x + state.vx * dt, state.z + state.vz * dt, PLAYER.radius);
    if (!canStandAt(nx, state.z)) { nx = state.x; state.vx *= 0.5; }
    if (!canStandAt(nx, nz)) { nz = state.z; state.vz *= 0.5; }
    [nx, nz] = collide(nx, nz);
    if (canStandAt(nx, nz)) { state.x = nx; state.z = nz; }
  }

  function fall(dt, input) {
    const ground = groundAt(state.x, state.z) + 0.55;
    if (input.jump && state.grounded) { state.vy = PLAYER.jumpVelocity; state.grounded = false; sfx.hop(); }
    state.vy -= PLAYER.gravity * dt;
    state.y += state.vy * dt;
    if (state.y <= ground) {
      if (!state.grounded && state.vy < -3) {
        sfx.land();
        state.squash = 1;
        sparks.burst(state.x, ground - 0.5, state.z, 0xffffff, 6, { size: 0.3, rise: 0.6, life: 0.8 });
      }
      // Walking downhill keeps you grounded instead of hopping off every bump.
      state.y = ground; state.vy = 0; state.grounded = true;
    } else if (state.y > ground + 0.25) state.grounded = false;
  }

  function animate(dt, time) {
    const speed = Math.hypot(state.vx, state.vz);
    if (speed > 0.3) state.facing += angleDelta(state.facing, Math.atan2(state.vx, state.vz)) * (1 - Math.exp(-dt * 10));

    const river = nearestRiver(state.x, state.z, 3);
    const inStream = !isOnPlatform(state.x, state.z) && river !== null && river.distance < river.width;
    if (state.grounded && speed > 0.8) {
      state.stepDistance += speed * dt;
      if (state.stepDistance > 1.5) {
        state.stepDistance = 0;
        if (inStream) sfx.splash();
        else sfx.step(heightAt(state.x, state.z) < 1.05);
      }
    }
    state.trailTimer -= dt;
    if (speed > 1 && state.trailTimer <= 0) {
      state.trailTimer = 0.06;
      sparks.spawn(state.x + jitter(-0.2, 0.2), state.y + jitter(-0.2, 0.1), state.z + jitter(-0.2, 0.2), 0xd8ecff, { size: 0.35, rise: 0.3, life: 1.1 });
    }

    state.squash = Math.max(0, state.squash - dt * 4);
    const bob = state.grounded ? Math.sin(time * 3) * 0.07 + (speed > 1 ? Math.abs(Math.sin(time * 9)) * 0.08 : 0) : 0;
    mesh.root.position.set(state.x, state.y, state.z);
    mesh.body.position.y = bob;
    mesh.body.rotation.set(0, state.facing, Math.sin(time * 1.7) * 0.05);
    const squash = state.squash * 0.25;
    mesh.shell.scale.set(1 + squash, 1 - squash, 1 + squash);
    mesh.aura.material.opacity = 0.35 + env.night * 0.35 + Math.sin(time * 2) * 0.05;
    mesh.light.intensity = 1 + env.night * 5;
  }

  function updateAmbience() {
    const shore = 1 - clamp((heightAt(state.x, state.z) - 0.3) / 5, 0, 1);
    const river = nearestRiver(state.x, state.z, 6);
    setAmbienceMix(shore, river ? 1 - clamp(river.distance / 12, 0, 1) : 0);
  }

  return {
    state,
    update(dt, time, input, cameraYaw) {
      move(dt, input, cameraYaw);
      fall(dt, input);
      animate(dt, time);
      updateAmbience();
    },
    /** Where a planted flower should go: just in front of the spirit. */
    frontPoint(distance = 0.6) {
      return { x: state.x + Math.sin(state.facing) * distance + jitter(-0.4, 0.4), z: state.z + Math.cos(state.facing) * distance + jitter(-0.4, 0.4) };
    },
  };
}
