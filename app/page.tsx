"use client";

import Link from "next/link";
import type { CSSProperties } from "react";
import { useState } from "react";
import { getLastUncompletedLevel } from "../lib/progress";

function getWoodBlockStyle(): CSSProperties {
  return {
    backgroundColor: "#A86631",
    backgroundImage:
      "linear-gradient(160deg, rgba(255,255,255,0.26), rgba(255,255,255,0.04) 48%, rgba(0,0,0,0.1)), repeating-linear-gradient(10deg, rgba(255,255,255,0.1) 0, rgba(255,255,255,0.1) 2px, rgba(0,0,0,0.05) 2px, rgba(0,0,0,0.05) 4px)",
    border: "1px solid rgba(74, 39, 17, 0.55)",
    boxShadow:
      "inset 0 1px 0 rgba(255, 244, 219, 0.4), inset 0 -2px 3px rgba(51, 27, 12, 0.28), 0 8px 20px rgba(51, 27, 12, 0.2)",
  };
}

function getDecorativeTileStyle(tone: string): CSSProperties {
  return {
    backgroundColor: tone,
    backgroundImage:
      "linear-gradient(155deg, rgba(255,246,224,0.3), rgba(255,246,224,0.08) 42%, rgba(68,38,19,0.1) 72%, rgba(40,22,10,0.22)), repeating-linear-gradient(12deg, rgba(255,255,255,0.08) 0, rgba(255,255,255,0.08) 1px, rgba(67,37,19,0.06) 1px, rgba(67,37,19,0.06) 3px)",
    border: "1px solid rgba(74, 39, 17, 0.5)",
    boxShadow:
      "inset 0 1px 0 rgba(255, 248, 229, 0.35), inset 0 -2px 4px rgba(45, 24, 10, 0.22), 0 4px 10px rgba(45,24,10,0.18)",
    borderRadius: "0.5rem",
  };
}

function getDecorativePieceStyle(tone: string, clipPath: string): CSSProperties {
  return {
    ...getDecorativeTileStyle(tone),
    clipPath,
    borderRadius: 0,
  };
}

function getWoodTitleStyle(): CSSProperties {
  return {
    backgroundColor: "#8F5A2D",
    backgroundImage:
      "linear-gradient(165deg, rgba(255,255,255,0.24), rgba(255,255,255,0.06) 42%, rgba(0,0,0,0.14)), repeating-linear-gradient(8deg, rgba(255,255,255,0.1) 0, rgba(255,255,255,0.1) 2px, rgba(0,0,0,0.05) 2px, rgba(0,0,0,0.05) 4px)",
    border: "1px solid rgba(74, 39, 17, 0.6)",
    boxShadow:
      "inset 0 1px 0 rgba(255, 244, 219, 0.45), inset 0 -3px 4px rgba(51, 27, 12, 0.3), 0 10px 24px rgba(51, 27, 12, 0.22)",
  };
}

export default function HomePage() {
  const [playLevel] = useState(() => getLastUncompletedLevel());

  return (
    <main className="min-h-[100dvh] bg-[radial-gradient(circle_at_top,_#fff7ed,_#ffedd5_45%,_#fed7aa)] px-4 py-6 text-zinc-900 sm:px-6 sm:py-8">
      <section className="mx-auto flex min-h-[calc(100dvh-3rem)] w-full max-w-xl flex-col items-center justify-between sm:min-h-[calc(100dvh-4rem)]">
        <h1
          className="w-full rounded-2xl px-4 py-3 text-center text-4xl font-black uppercase tracking-[0.14em] text-amber-50 sm:mt-1 sm:text-5xl"
          style={getWoodTitleStyle()}
        >
          Perfect Fit
        </h1>

        <div className="relative h-60 w-full max-w-[24rem]" aria-hidden="true">
          <div
            className="absolute left-0 top-0 h-60 w-[10rem]"
            style={getDecorativePieceStyle(
              "#A86631",
              "polygon(0% 0%, 50% 0%, 50% 33.333%, 100% 33.333%, 100% 66.666%, 50% 66.666%, 50% 100%, 0% 100%)",
            )}
          />

          <div
            className="absolute right-0 top-0 h-60 w-[10rem]"
            style={getDecorativePieceStyle(
              "#B77940",
              "polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%, 0% 66.666%, 50% 66.666%, 50% 33.333%, 0% 33.333%)",
            )}
          />
        </div>

        <div className="grid w-full gap-3 pb-1">
          <Link
            href={`/play?level=${playLevel}`}
            className="rounded-xl px-4 py-3 text-center text-base font-black uppercase tracking-[0.12em] text-amber-50 transition hover:brightness-105"
            style={getWoodBlockStyle()}
          >
            Play
          </Link>
          <Link
            href="/levels"
            className="rounded-xl px-4 py-3 text-center text-base font-black uppercase tracking-[0.12em] text-amber-50 transition hover:brightness-105"
            style={getWoodBlockStyle()}
          >
            Level Selection
          </Link>
        </div>
      </section>
    </main>
  );
}
