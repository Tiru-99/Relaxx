import * as THREE from 'three';
import { glowMaterial } from '../core/glow.js';
import { jitter, TAU } from '../core/math.js';
import { heightAt } from '../world/heightfield.js';

/** The finale: once every lantern is awake, paper lanterns drift up from all over the island. */
export function createSkyLanterns(scene, player) {
  const lanterns = [];

  function release() {
    for (let i = 0; i < 80; i++) {
      const a = jitter(0, TAU), r = jitter(3, 60);
      const x = player.state.x + Math.cos(a) * r, z = player.state.z + Math.sin(a) * r;
      const sprite = new THREE.Sprite(glowMaterial(new THREE.Color().setHSL(jitter(0.05, 0.11), 1, 0.6), 0));
      sprite.scale.setScalar(jitter(1.2, 2));
      sprite.position.set(x, Math.max(0.5, heightAt(x, z)) + 1, z);
      scene.add(sprite);
      lanterns.push({ sprite, delay: i * 0.18, speed: jitter(0.8, 1.6), phase: jitter(0, TAU) });
    }
  }

  function update(dt, time) {
    for (const lantern of lanterns) {
      if (lantern.delay > 0) { lantern.delay -= dt; continue; }
      const { sprite } = lantern;
      sprite.position.y += lantern.speed * dt;
      sprite.position.x += Math.sin(time * 0.5 + lantern.phase) * dt * 0.3;
      sprite.material.opacity = Math.min(0.9, sprite.material.opacity + dt * 0.5);
      if (sprite.position.y > 95) {
        sprite.position.y = Math.max(0.5, heightAt(sprite.position.x, sprite.position.z)) + 1;
        sprite.material.opacity = 0;
      }
    }
  }

  return { release, update };
}
