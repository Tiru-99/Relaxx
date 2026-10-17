/**
 * Keyboard, mouse and touch input in one place. Systems read `input.move` / `input.drift`
 * and subscribe to actions (plant, breathe, journal …) with `onAction`.
 */

const ACTIONS = {
  KeyE: 'plant', KeyB: 'breathe', KeyM: 'music', KeyH: 'hints', KeyJ: 'journal', KeyQ: 'listen', Escape: 'close',
};

export function createInput(canvas) {
  const keys = {};
  const listeners = new Map();
  const input = {
    move: { x: 0, z: 0 },          // -1..1, x = right, z = forward
    drift: false,
    jump: false,
    look: { dx: 0, dy: 0, zoom: 0 }, // consumed by the camera each frame
    enabled: false,
    onAction(name, handler) { listeners.set(name, handler); },
  };
  const emit = (name) => input.enabled && listeners.get(name)?.();

  addEventListener('keydown', (e) => {
    keys[e.code] = true;
    if (!input.enabled) return;
    if (ACTIONS[e.code] && !e.repeat) emit(ACTIONS[e.code]);
    if (e.code === 'Space') e.preventDefault();
  });
  addEventListener('keyup', (e) => { keys[e.code] = false; });
  addEventListener('blur', () => { for (const code in keys) keys[code] = false; });

  // Mouse drag looks around; on touch, the left half of the screen is a soft joystick.
  const stick = { id: null, x: 0, y: 0, dx: 0, dy: 0 };
  let lookId = null, lastX = 0, lastY = 0;
  canvas.addEventListener('pointerdown', (e) => {
    canvas.setPointerCapture(e.pointerId);
    if (e.pointerType === 'touch' && e.clientX < innerWidth / 2 && stick.id === null) {
      Object.assign(stick, { id: e.pointerId, x: e.clientX, y: e.clientY, dx: 0, dy: 0 });
    } else if (lookId === null) {
      lookId = e.pointerId; lastX = e.clientX; lastY = e.clientY;
    }
  });
  canvas.addEventListener('pointermove', (e) => {
    if (e.pointerId === stick.id) {
      stick.dx = Math.max(-1, Math.min(1, (e.clientX - stick.x) / 50));
      stick.dy = Math.max(-1, Math.min(1, (e.clientY - stick.y) / 50));
    } else if (e.pointerId === lookId) {
      input.look.dx += e.clientX - lastX;
      input.look.dy += e.clientY - lastY;
      lastX = e.clientX; lastY = e.clientY;
    }
  });
  const release = (e) => {
    if (e.pointerId === stick.id) Object.assign(stick, { id: null, dx: 0, dy: 0 });
    if (e.pointerId === lookId) lookId = null;
  };
  canvas.addEventListener('pointerup', release);
  canvas.addEventListener('pointercancel', release);
  addEventListener('wheel', (e) => { input.look.zoom += e.deltaY; }, { passive: true });

  /** Call once per frame before the player reads input. */
  input.poll = () => {
    const x = (keys.KeyD || keys.ArrowRight ? 1 : 0) - (keys.KeyA || keys.ArrowLeft ? 1 : 0) + stick.dx;
    const z = (keys.KeyW || keys.ArrowUp ? 1 : 0) - (keys.KeyS || keys.ArrowDown ? 1 : 0) - stick.dy;
    const length = Math.max(1, Math.hypot(x, z));
    input.move.x = input.enabled ? x / length : 0;
    input.move.z = input.enabled ? z / length : 0;
    input.drift = input.enabled && (keys.ShiftLeft || keys.ShiftRight || Math.hypot(stick.dx, stick.dy) > 0.95);
    input.jump = input.enabled && !!keys.Space;
  };

  input.trigger = emit; // on-screen buttons call actions too
  return input;
}
