import Link from "next/link";
import { GameGrid } from "@/components/games/GameGrid";
import { AmbientSky } from "@/components/ui/AmbientSky";
import { games } from "@/lib/games";

export default function HomePage() {
  return (
    <>
      <section className="relative overflow-hidden bg-linear-to-b from-sky-a via-sky-b via-70% to-bg pt-24 pb-22">
        <AmbientSky />
        <div className="site-container relative z-1">
          <p className="mb-3.5 text-[13px] tracking-[0.22em] text-ink-soft uppercase">
            slow games · no scores · no rush
          </p>
          <h1 className="max-w-[14ch] text-[clamp(34px,6vw,64px)]">Find a quiet place to wander.</h1>
          <p className="mt-4.5 mb-8 max-w-[52ch] text-lg text-ink-soft">
            Small, gentle worlds shaped by forests, islands and sky. Put on headphones, breathe out, and play
            for as long as feels good.
          </p>
          <Link
            href="/games"
            className="inline-block rounded-full border border-accent bg-accent-soft px-7.5 py-3 tracking-[0.08em] transition duration-900 ease-calm hover:-translate-y-px hover:shadow-[0_0_36px_-6px_var(--glow)]"
          >
            Enter the grove
          </Link>
        </div>
      </section>

      <section className="site-container pb-18" aria-labelledby="featured">
        <h2 id="featured" className="mt-14 mb-5 text-[22px]">
          Worlds to explore
        </h2>
        <GameGrid games={games} />
      </section>
    </>
  );
}
