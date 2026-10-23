/**
 * The controls list at the bottom of the screen. It shows on arrival, then shrinks to a small
 * "H · show controls" reminder. Pressing H brings the full list back, just like the first time.
 */
const SHOW_SECONDS = 40;

export function createHints(element) {
  let remaining = 0;

  const showFull = () => {
    element.classList.remove('compact');
    element.style.opacity = '1';
    remaining = SHOW_SECONDS;
  };
  const showCompact = () => {
    element.classList.add('compact');
    remaining = 0;
  };

  return {
    showFull,
    toggle() {
      if (element.classList.contains('compact')) showFull();
      else showCompact();
    },
    update(dt) {
      if (remaining <= 0) return;
      remaining -= dt;
      if (remaining <= 0) showCompact();
    },
  };
}
