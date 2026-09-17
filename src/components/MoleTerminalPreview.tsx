"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import styles from "./MoleTerminalPreview.module.css";
import {
  networkNodes,
  networkEdges,
  networkCenter,
  digReveal,
  tracePath,
  burrowGroup,
  feedEvents,
  type NetworkNode,
} from "@/data/demo";

type Mode = "idle" | "dig" | "trace" | "burrows";

const STATUS_PHRASES = [
  "SCANNING UNDERGROUND...",
  "MAPPING TUNNELS...",
  "WATCHING FRESH DIRT...",
  "TRACING FUNDING PATHS...",
];

const FEED_BASELINE_AGE = [6, 24, 58, 95, 140];

function buildEdgePath(a: { x: number; y: number }, b: { x: number; y: number }, bend: number) {
  const mx = (a.x + b.x) / 2;
  const my = (a.y + b.y) / 2;
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const len = Math.hypot(dx, dy) || 1;
  const px = -dy / len;
  const py = dx / len;
  const cx = mx + px * bend;
  const cy = my + py * bend;
  return `M ${a.x} ${a.y} Q ${cx} ${cy} ${b.x} ${b.y}`;
}

function edgeKey(a: string, b: string) {
  return [a, b].sort().join("::");
}

function formatAge(seconds: number) {
  if (seconds < 60) return `${seconds}s`;
  return `${Math.floor(seconds / 60)}m`;
}

export default function MoleTerminalPreview() {
  const [mode, setMode] = useState<Mode>("idle");
  const [traceIndex, setTraceIndex] = useState(0);
  const [statusIndex, setStatusIndex] = useState(0);
  const [feedRows, setFeedRows] = useState(() =>
    feedEvents.map((e, i) => ({ ...e, age: FEED_BASELINE_AGE[i] ?? 10 + i * 20 })),
  );

  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const traceTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const feedCursorRef = useRef(feedEvents.length);

  const nodesById = useMemo(() => {
    const map = new Map<string, { x: number; y: number }>();
    networkNodes.forEach((n) => map.set(n.id, n));
    map.set("center", networkCenter);
    return map;
  }, []);

  const clearActionTimers = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (traceTimerRef.current) clearInterval(traceTimerRef.current);
    timeoutRef.current = null;
    traceTimerRef.current = null;
  };

  const runDig = () => {
    clearActionTimers();
    setMode("dig");
    timeoutRef.current = setTimeout(() => setMode("idle"), 3600);
  };

  const runTrace = () => {
    clearActionTimers();
    setMode("trace");
    setTraceIndex(0);
    let step = 0;
    traceTimerRef.current = setInterval(() => {
      step += 1;
      if (step >= tracePath.length) {
        clearActionTimers();
        setMode("idle");
        setTraceIndex(0);
        return;
      }
      setTraceIndex(step);
    }, 560);
  };

  const runBurrows = () => {
    clearActionTimers();
    setMode("burrows");
  };

  const runReset = () => {
    clearActionTimers();
    setMode("idle");
    setTraceIndex(0);
  };

  useEffect(() => clearActionTimers, []);

  // Ambient status line + feed ticking — client-only so SSR and first paint match.
  useEffect(() => {
    const statusTimer = setInterval(() => {
      setStatusIndex((i) => (i + 1) % STATUS_PHRASES.length);
    }, 4500);

    const ageTimer = setInterval(() => {
      setFeedRows((rows) => rows.map((r) => ({ ...r, age: r.age + 1 })));
    }, 1000);

    const rotateTimer = setInterval(() => {
      setFeedRows((rows) => {
        const next = feedEvents[feedCursorRef.current % feedEvents.length];
        feedCursorRef.current += 1;
        const fresh = { ...next, age: 0 };
        return [fresh, ...rows.slice(0, rows.length - 1)];
      });
    }, 9000);

    return () => {
      clearInterval(statusTimer);
      clearInterval(ageTimer);
      clearInterval(rotateTimer);
    };
  }, []);

  const activeTraceIds = new Set(mode === "trace" ? tracePath.slice(0, traceIndex + 1) : []);
  const activeTraceEdgeKeys = new Set<string>();
  if (mode === "trace") {
    for (let i = 0; i < traceIndex; i++) {
      activeTraceEdgeKeys.add(edgeKey(tracePath[i], tracePath[i + 1]));
    }
  }

  const burrowNodes: NetworkNode[] =
    mode === "burrows"
      ? networkNodes.filter((n) => burrowGroup.includes(n.id))
      : [];

  return (
    <div className={styles.terminal}>
      <div className={styles.header}>
        <div className={styles.dots}>
          <span className={styles.dot} />
          <span className={styles.dot} />
          <span className={styles.dot} />
        </div>
        <span className={styles.path}>mole@rh:~/underground</span>
        <span className={styles.online}>
          <span className={styles.onlineDot} />
          SCANNER ONLINE
        </span>
      </div>

      <div className={styles.modeRow}>
        <span className={styles.badge}>DEMO MODE</span>
        <span className={styles.badge}>RH CHAIN</span>
        <span className={styles.badge}>UNDERGROUND MAP</span>
        <span className={styles.status}>{STATUS_PHRASES[statusIndex]}</span>
      </div>

      <div className={styles.stage}>
        <svg className={styles.svg} viewBox="0 0 100 100" role="img" aria-label="Animated illustrative underground wallet network">
          {networkEdges.map((edge, i) => {
            const from = nodesById.get(edge.from);
            const to = nodesById.get(edge.to);
            if (!from || !to) return null;
            const node = networkNodes.find((n) => n.id === edge.from);
            const bend = node?.bend ?? 0;
            const d = buildEdgePath(from, to, bend);
            const flared = activeTraceEdgeKeys.has(edgeKey(edge.from, edge.to));
            return (
              <g key={`${edge.from}-${edge.to}-${i}`} className={`${styles.edgeGroup} ${flared ? styles.edgeFlare : ""}`}>
                <path className={styles.tunnel} d={d} />
                <path className={styles.tunnelPulse} d={d} />
              </g>
            );
          })}

          {mode === "dig" && (
            <g className={styles.edgeGroup}>
              <path
                className={styles.tunnel}
                d={buildEdgePath(networkCenter, digReveal, digReveal.bend)}
              />
            </g>
          )}

          {mode === "burrows" && burrowNodes.length > 0 && (
            <ellipse
              className={styles.burrowRing}
              cx={burrowNodes.reduce((s, n) => s + n.x, 0) / burrowNodes.length}
              cy={burrowNodes.reduce((s, n) => s + n.y, 0) / burrowNodes.length}
              rx={22}
              ry={18}
            />
          )}

          {networkNodes.map((node) => {
            const isActive = activeTraceIds.has(node.id) || (mode === "burrows" && burrowGroup.includes(node.id));
            const labelBelow = node.y < 50;
            return (
              <g key={node.id} className={`${styles.node} ${isActive ? styles.nodeActive : ""}`}>
                <circle cx={node.x} cy={node.y} r={2.4} />
                <text
                  x={node.x}
                  y={labelBelow ? node.y - 4.2 : node.y + 5.6}
                  textAnchor="middle"
                  className={styles.nodeLabel}
                >
                  {node.type}
                </text>
              </g>
            );
          })}

          {mode === "dig" && (
            <g className={`${styles.node} ${styles.digNode}`}>
              <circle cx={digReveal.x} cy={digReveal.y} r={2.4} />
              <text x={digReveal.x} y={digReveal.y - 4.2} textAnchor="middle" className={styles.nodeLabel}>
                {digReveal.type}
              </text>
            </g>
          )}
        </svg>

        <div className={styles.mascotWrap}>
          <Image
            src="/assets/mole-mascot.png"
            alt="MOLE mascot"
            fill
            sizes="(max-width: 640px) 120px, 180px"
            className={`${styles.mascotImg} pixelSharp`}
          />
        </div>
      </div>

      <div className={styles.actions}>
        <button
          type="button"
          className={`${styles.actionBtn} ${mode === "dig" ? styles.actionBtnActive : ""}`}
          onClick={runDig}
        >
          DIG
        </button>
        <button
          type="button"
          className={`${styles.actionBtn} ${mode === "trace" ? styles.actionBtnActive : ""}`}
          onClick={runTrace}
        >
          TRACE
        </button>
        <button
          type="button"
          className={`${styles.actionBtn} ${mode === "burrows" ? styles.actionBtnActive : ""}`}
          onClick={runBurrows}
        >
          BURROWS
        </button>
        <button type="button" className={styles.actionBtn} onClick={runReset}>
          RESET
        </button>
      </div>

      <div className={styles.feed}>
        <div className={styles.feedHeader}>
          <span className={styles.feedTitle}>ILLUSTRATIVE FEED</span>
        </div>
        <ul className={styles.feedList}>
          {feedRows.map((row, i) => (
            <li key={`${row.id}-${i}`} className={styles.feedRow}>
              <span className={styles.feedTag}>{row.tag}</span>
              <span className={styles.feedMessage}>{row.message}</span>
              <span className={styles.feedAge}>{formatAge(row.age)}</span>
            </li>
          ))}
        </ul>
        <p className={styles.feedFooter}>Preview data only. Live public-chain integration comes later.</p>
      </div>
    </div>
  );
}
