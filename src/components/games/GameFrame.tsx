"use client";

import { useRef } from "react";

type Props = { src: string; title: string };

/**
 * Hosts a self-contained game build in an iframe so each game keeps its own
 * globals, canvas and audio context without leaking into the site.
 */
export function GameFrame({ src, title }: Props) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<HTMLIFrameElement>(null);

  const goFullscreen = () => {
    wrapRef.current?.requestFullscreen?.().catch(() => {});
    frameRef.current?.focus();
  };

  return (
    <div
      ref={wrapRef}
      className="relative aspect-3/4 max-h-[78dvh] w-full overflow-hidden rounded-card bg-frame-bg shadow-soft sm:aspect-video [&:fullscreen]:max-h-none [&:fullscreen]:rounded-none"
    >
      <iframe
        ref={frameRef}
        src={src}
        title={title}
        className="absolute inset-0 size-full border-0"
        allow="fullscreen; autoplay"
        onLoad={() => frameRef.current?.focus()}
      />
      <button
        type="button"
        onClick={goFullscreen}
        className="absolute right-3 bottom-3 cursor-pointer rounded-full border border-frame-control-line bg-frame-control px-4 py-1.5 text-[13px] text-frame-ink [:fullscreen>&]:hidden"
      >
        Fullscreen
      </button>
    </div>
  );
}
