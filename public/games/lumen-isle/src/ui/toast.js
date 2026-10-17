/** A gentle message that fades in near the top of the screen, with an optional smaller line. */
export function createToast(element) {
  let remaining = 0;
  return {
    show(message, seconds = 3.5, detail = '') {
      element.textContent = message;
      if (detail) {
        const small = document.createElement('small');
        small.textContent = detail;
        element.appendChild(small);
      }
      element.style.opacity = '1';
      remaining = seconds;
    },
    update(dt) {
      if (remaining <= 0) return;
      remaining -= dt;
      if (remaining <= 0) element.style.opacity = '0';
    },
  };
}
