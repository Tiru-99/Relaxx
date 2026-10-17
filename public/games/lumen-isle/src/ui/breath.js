/** Breathing guide: 4 s in, 4 s hold, 6 s out, drawn as a slowly growing ring. */
const CYCLE = 14;

export function createBreathGuide(element) {
  const ring = element.querySelector('.ring'), label = element.querySelector('.label');
  let on = false, t = 0;
  return {
    toggle() { on = !on; t = 0; element.style.opacity = on ? '1' : '0'; },
    update(dt) {
      if (!on) return;
      t = (t + dt) % CYCLE;
      let scale, text;
      if (t < 4) { scale = 0.55 + 0.45 * (0.5 - 0.5 * Math.cos((t / 4) * Math.PI)); text = 'breathe in'; }
      else if (t < 8) { scale = 1; text = 'hold'; }
      else { scale = 1 - 0.45 * (0.5 - 0.5 * Math.cos(((t - 8) / 6) * Math.PI)); text = 'breathe out'; }
      ring.style.transform = `scale(${scale})`;
      label.textContent = text;
    },
  };
}
