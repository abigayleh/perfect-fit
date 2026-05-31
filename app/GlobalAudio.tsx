"use client";

import { useEffect, useRef } from "react";

function isInteractiveTarget(target: EventTarget | null): target is HTMLElement {
  if (!(target instanceof HTMLElement)) {
    return false;
  }

  return Boolean(
    target.closest(
      "button, a[href], input[type='button'], input[type='submit'], [role='button']",
    ),
  );
}

export default function GlobalAudio() {
  const audioContextRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    const playClick = () => {
      const context = audioContextRef.current;
      if (!context) {
        return;
      }

      const now = context.currentTime;
      const oscillator = context.createOscillator();
      const gainNode = context.createGain();

      oscillator.type = "triangle";
      oscillator.frequency.setValueAtTime(720, now);
      oscillator.frequency.exponentialRampToValueAtTime(380, now + 0.05);

      gainNode.gain.setValueAtTime(0.0001, now);
      gainNode.gain.exponentialRampToValueAtTime(0.05, now + 0.01);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, now + 0.08);

      oscillator.connect(gainNode);
      gainNode.connect(context.destination);

      oscillator.start(now);
      oscillator.stop(now + 0.09);
    };

    const handlePointerDown = (event: PointerEvent) => {
      if (!isInteractiveTarget(event.target)) {
        return;
      }

      if (!audioContextRef.current) {
        audioContextRef.current = new window.AudioContext();
      }

      const context = audioContextRef.current;
      if (context.state === "suspended") {
        void context.resume();
      }

      playClick();
    };

    window.addEventListener("pointerdown", handlePointerDown, true);

    return () => {
      window.removeEventListener("pointerdown", handlePointerDown, true);
      if (audioContextRef.current) {
        void audioContextRef.current.close();
      }
    };
  }, []);

  return null;
}
