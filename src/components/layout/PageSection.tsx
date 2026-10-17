type Props = {
  title: string;
  lede?: React.ReactNode;
  /** Narrow reading width for text-heavy pages. */
  narrow?: boolean;
  centered?: boolean;
  children?: React.ReactNode;
};

/** Standard wrapper for simple content pages: heading, optional lede, then content. */
export function PageSection({ title, lede, narrow, centered, children }: Props) {
  return (
    <section className={`site-container pb-18 ${centered ? "pt-24 text-center" : "pt-12"}`}>
      <div className={narrow ? "max-w-170" : undefined}>
        <h1 className="text-[clamp(28px,5vw,34px)]">{title}</h1>
        {lede && <p className="mt-2 text-ink-soft">{lede}</p>}
        {children}
      </div>
    </section>
  );
}
