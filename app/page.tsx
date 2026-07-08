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

const PIECE_BG = [
  "linear-gradient(155deg, rgba(255,248,225,0.28) 0%, rgba(255,244,210,0.06) 45%, rgba(40,22,10,0.2) 100%)",
  "repeating-linear-gradient(12deg, rgba(255,255,255,0.07) 0px, rgba(255,255,255,0.07) 2px, rgba(67,37,19,0.05) 2px, rgba(67,37,19,0.05) 5px)",
  "repeating-linear-gradient(0deg, transparent 0px, transparent 39px, rgba(0,0,0,0.1) 39px, rgba(0,0,0,0.1) 40px)",
  "repeating-linear-gradient(90deg, transparent 0px, transparent 39px, rgba(0,0,0,0.1) 39px, rgba(0,0,0,0.1) 40px)",
].join(", ");

function woodPiece(color: string, clip: string, left: number, top: number, width: number, height: number): CSSProperties {
  return {
    position: "absolute",
    left,
    top,
    width,
    height,
    backgroundColor: color,
    backgroundImage: PIECE_BG,
    clipPath: clip,
    filter: "drop-shadow(0px 0px 1.5px rgba(51,27,12,0.5)) drop-shadow(3px 5px 8px rgba(51,27,12,0.28))",
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

        {/* 4 interlocking tetromino pieces that form a perfect 4×4 square */}
        <div className="flex h-60 w-full max-w-[24rem] items-center justify-center" aria-hidden="true">
          <div style={{ position: "relative", width: 200, height: 200 }}>
            {/* L-shape: top-left, pulled up-left */}
            <div style={woodPiece("#8F5A2D", "polygon(0px 0px, 80px 0px, 80px 40px, 40px 40px, 40px 120px, 0px 120px)", 12, 12, 80, 120)} />
            {/* S-shape: top-right, pulled up-right */}
            <div style={woodPiece("#B77940", "polygon(40px 0px, 120px 0px, 120px 40px, 80px 40px, 80px 80px, 0px 80px, 0px 40px, 40px 40px)", 68, 12, 120, 80)} />
            {/* J-shape: bottom-right, pulled down-right */}
            <div style={woodPiece("#A86631", "polygon(40px 0px, 80px 0px, 80px 120px, 40px 120px, 40px 80px, 0px 80px, 0px 40px, 40px 40px)", 108, 68, 80, 120)} />
            {/* T-shape: bottom-left, pulled down-left */}
            <div style={woodPiece("#C09050", "polygon(40px 0px, 80px 0px, 80px 40px, 120px 40px, 120px 80px, 0px 80px, 0px 40px, 40px 40px)", 12, 108, 120, 80)} />
          </div>
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
