import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { GameFrame } from "@/components/games/GameFrame";
import { games, getGame } from "@/lib/games";

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams(): { slug: string }[] {
  return games.map((g) => ({ slug: g.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const game = getGame((await params).slug);
  return game ? { title: game.title, description: game.description } : {};
}

export default async function GamePage({ params }: Props) {
  const game = getGame((await params).slug);
  if (!game) notFound();

  return (
    <div className="site-container pt-7 pb-16">
      <Link href="/games" className="text-sm text-ink-soft">
        ← all games
      </Link>
      <header className="mt-3.5 mb-5.5">
        <h1 className="text-[clamp(28px,5vw,44px)]">{game.title}</h1>
        <p className="mt-1 tracking-[0.08em] text-ink-soft">{game.tagline}</p>
      </header>

      <GameFrame src={game.src} title={game.title} />

      <div className="mt-7 max-w-[64ch] space-y-4">
        <p>{game.description}</p>
        {game.headphones && <p className="text-sm text-ink-soft">Headphones recommended.</p>}
        <ul className="flex flex-wrap gap-x-5.5 gap-y-2.5 text-ink-soft">
          {game.controls.map((c) => (
            <li key={c.keys}>
              <kbd>{c.keys}</kbd> {c.action}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
