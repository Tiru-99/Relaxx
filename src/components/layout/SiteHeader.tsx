import Link from "next/link";

const navLink = "transition-colors duration-400 ease-calm hover:text-ink";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-10 border-b border-line bg-bg/75 backdrop-blur-md">
      <div className="site-container flex h-15 items-center justify-between">
        <Link href="/" className="font-semibold tracking-wider">
          <span aria-hidden className="text-accent">
            ❋
          </span>{" "}
          Still Grove
        </Link>
        <nav className="flex gap-5.5 text-ink-soft" aria-label="Main">
          <Link href="/games" className={navLink}>
            Games
          </Link>
          <Link href="/about" className={navLink}>
            About
          </Link>
        </nav>
      </div>
    </header>
  );
}
