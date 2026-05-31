"use client";

import Link from "next/link";
import type { CSSProperties } from "react";
import { useState } from "react";
import { MAX_LEVEL, getHighestUnlockedLevel } from "../../lib/progress";

function getWoodBlockStyle(): CSSProperties {
  return {
    backgroundColor: "#A86631",
    backgroundImage:
      "linear-gradient(160deg, rgba(255,255,255,0.26), rgba(255,255,255,0.04) 48%, rgba(0,0,0,0.1)), repeating-linear-gradient(10deg, rgba(255,255,255,0.1) 0, rgba(255,255,255,0.1) 2px, rgba(0,0,0,0.05) 2px, rgba(0,0,0,0.05) 4px)",
    border: "1px solid rgba(74, 39, 17, 0.5)",
    boxShadow:
      "inset 0 1px 0 rgba(255, 244, 219, 0.4), inset 0 -2px 3px rgba(51, 27, 12, 0.28), 0 8px 20px rgba(51, 27, 12, 0.18)",
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

export default function LevelsPage() {
  const [highestUnlockedLevel] = useState(() => getHighestUnlockedLevel());

  return (
    <main className="min-h-[100dvh] bg-[radial-gradient(circle_at_top,_#fff7ed,_#ffedd5_45%,_#fed7aa)] px-4 py-5 text-zinc-900 sm:px-6 sm:py-8">
      <section className="mx-auto w-full max-w-3xl">
        <div className="mb-6">
          <h1
            className="mx-auto w-full rounded-2xl px-4 py-3 text-center text-4xl font-black uppercase tracking-[0.2em] text-amber-50 sm:text-5xl"
            style={getWoodTitleStyle()}
          >
            Levels
          </h1>
        </div>

        <div className="grid grid-cols-3 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {Array.from({ length: MAX_LEVEL }, (_, index) => {
            const level = index + 1;
            const isLocked = level > highestUnlockedLevel;

            if (isLocked) {
              return (
                <span
                  key={level}
                  className="flex aspect-square items-center justify-center rounded-xl border border-orange-300/50 bg-orange-100/65 p-3 text-3xl font-black leading-none text-orange-600/60 sm:text-4xl"
                  aria-disabled="true"
                >
                  {level}
                </span>
              );
            }

            return (
              <Link
                key={level}
                href={`/play?level=${level}`}
                className="group flex aspect-square items-center justify-center rounded-xl p-3 transition-transform hover:-translate-y-0.5"
                style={getWoodBlockStyle()}
              >
                <span className="block text-4xl font-black leading-none text-amber-50 drop-shadow-sm sm:text-5xl">
                  {level}
                </span>
              </Link>
            );
          })}
        </div>
      </section>
    </main>
  );
}
