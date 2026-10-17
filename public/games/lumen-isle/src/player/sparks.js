import { BUDGET } from '../config.js';
import { glowSprite } from '../core/glow.js';
import { jitter } from '../core/math.js';

/** A fixed pool of little glowing sparks for trails, pickups and celebrations. Never allocates after start. */
export function createSparks(scene) {
  const pool = Array.from({ length: BUDGET.sparks }, () => {
    const sprite = glowSprite(0xffffff, 0, 0.3);
    sprite.visible = false;
    scene.add(sprite);
    return { sprite, life: 0, max: 1, size: 0.3, vx: 0, vy: 0, vz: 0 };
  });
  let next = 0;

  function spawn(x, y, z, color, { size = 0.35, rise = 0.4, life = 1.2 } = {}) {
    const spark = pool[next++ % pool.length];
    spark.sprite.position.set(x, y, z);
    spark.sprite.material.color.set(color);
    spark.sprite.visible = true;
    Object.assign(spark, { life, max: life, size, vy: rise, vx: jitter(-0.4, 0.4), vz: jitter(-0.4, 0.4) });
  }

  function burst(x, y, z, color, count, options) {
    for (let i = 0; i < count; i++) spawn(x + jitter(-0.5, 0.5), y + jitter(0, 1), z + jitter(-0.5, 0.5), color, options);
  }

  function update(dt) {
    for (const spark of pool) {
      if (spark.life <= 0) continue;
      spark.life -= dt;
      if (spark.life <= 0) { spark.sprite.visible = false; continue; }
      const f = spark.life / spark.max;
      spark.sprite.position.x += spark.vx * dt;
      spark.sprite.position.y += spark.vy * dt;
      spark.sprite.position.z += spark.vz * dt;
      spark.sprite.material.opacity = f * 0.8;
      spark.sprite.scale.setScalar(spark.size * (0.4 + f));
    }
  }

  return { spawn, burst, update };
}
