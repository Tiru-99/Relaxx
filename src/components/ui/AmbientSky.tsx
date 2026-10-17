// Deterministic positions so server and client render the same markup.
const motes = Array.from({ length: 18 }, (_, i) => ({
  left: (i * 37) % 100,
  top: 20 + ((i * 53) % 70),
  delay: (i * 0.7) % 8,
  size: 3 + (i % 4),
}));

/** Decorative drifting fireflies. Pure CSS, no JS, hidden from assistive tech. */
export function AmbientSky() {
  return (
    <div className="pointer-events-none absolute inset-0" aria-hidden>
      {motes.map((m, i) => (
        <span
          key={i}
          className="absolute animate-drift rounded-full bg-glow opacity-0 shadow-[0_0_12px_3px_var(--glow)]"
          style={{ left: `${m.left}%`, top: `${m.top}%`, width: m.size, height: m.size, animationDelay: `${m.delay}s` }}
        />
      ))}
    </div>
  );
}
