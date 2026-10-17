/**
 * The frame loop. Systems register an `update(dt, time)` and are called in order every frame.
 * dt is clamped so a backgrounded tab never makes the world jump.
 */
export function createLoop() {
  const systems = [];
  let time = 0, last = performance.now();

  function frame(now) {
    const dt = Math.min(0.05, Math.max(0, (now - last) / 1000));
    last = now;
    time += dt;
    for (const system of systems) system(dt, time);
    requestAnimationFrame(frame);
  }

  return {
    add(update) { systems.push(update); },
    start() { last = performance.now(); requestAnimationFrame(frame); },
    get time() { return time; },
  };
}
