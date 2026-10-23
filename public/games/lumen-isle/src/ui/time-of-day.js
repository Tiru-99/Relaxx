/**
 * Dawn / day / evening / night picker. Choosing one jumps the sky there; time then keeps flowing
 * as usual, so night still turns to morning if you stay.
 */
const TIMES = {
  dawn: { phase: 0.27, message: 'the sky begins to blush' },
  day: { phase: 0.45, message: 'the sun climbs high' },
  evening: { phase: 0.72, message: 'the light turns golden' },
  night: { phase: 0.93, message: 'the stars come out' },
};

/** Which named time a day phase (0..1) currently falls in. */
function timeAt(phase) {
  if (phase >= 0.18 && phase < 0.32) return 'dawn';
  if (phase >= 0.32 && phase < 0.66) return 'day';
  if (phase >= 0.66 && phase < 0.84) return 'evening';
  return 'night';
}

export function createTimeOfDay(root, env, { toast }) {
  const buttons = [...root.querySelectorAll('button[data-time]')];
  let current = '';

  for (const button of buttons) {
    button.addEventListener('click', () => {
      const time = TIMES[button.dataset.time];
      env.setPhase(time.phase);
      toast.show(time.message, 3);
      button.blur(); // keep Space and other keys going to the game, not this button
    });
  }

  return {
    show() { root.classList.add('visible'); },
    update() {
      const now = timeAt(env.phase);
      if (now === current) return;
      current = now;
      for (const button of buttons) {
        button.classList.toggle('active', button.dataset.time === now);
        button.setAttribute('aria-pressed', String(button.dataset.time === now));
      }
    },
  };
}
