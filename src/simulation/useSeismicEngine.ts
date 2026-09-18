"use client";

import { useEffect, useState, useSyncExternalStore, type RefObject } from "react";
import { SeismicEngine } from "./SeismicEngine";
import type { EngineOptions } from "./types";

/**
 * Owns one engine instance and its animation loop. URL flags (read on the
 * client only): ?speed=0.5|1|1.5|2 tunes intensity for recordings.
 * The loop idles while the terminal is scrolled off-screen.
 */
export function useSeismicEngine(options: EngineOptions, rootRef: RefObject<HTMLElement | null>) {
  const [engine] = useState(() => new SeismicEngine(options));

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const speed = Number(params.get("speed"));
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    engine.configure({ speed: speed || 1, reduced: motion.matches });
    engine.start();

    const onMotion = () => engine.configure({ reduced: motion.matches });
    motion.addEventListener("change", onMotion);

    let observer: IntersectionObserver | null = null;
    if (rootRef.current) {
      observer = new IntersectionObserver(([entry]) => {
        engine.visible = entry.isIntersecting;
      });
      observer.observe(rootRef.current);
    }

    let raf = 0;
    const loop = (now: number) => {
      engine.tick(now);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf);
      observer?.disconnect();
      motion.removeEventListener("change", onMotion);
    };
  }, [engine, rootRef]);

  return engine;
}

export function useEngineSnapshot(engine: SeismicEngine) {
  return useSyncExternalStore(engine.subscribe, engine.getSnapshot, engine.getSnapshot);
}
