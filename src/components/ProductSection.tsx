"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import styles from "./ProductSection.module.css";
import {
  networkNodes,
  networkEdges,
  networkCenter,
  freshDirtRows,
  publicChainLog,
  moleAuditLog,
} from "@/data/demo";

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

function useTicking<T extends { id: string; message: string }>(pool: T[], intervalMs: number) {
  const [rows, setRows] = useState(() => pool.map((e) => ({ ...e, age: 0 })));
  useEffect(() => {
    let cursor = pool.length;
    const timer = setInterval(() => {
      setRows((prev) => {
        const next = pool[cursor % pool.length];
        cursor += 1;
        return [{ ...next, age: 0 }, ...prev.slice(0, prev.length - 1)];
      });
    }, intervalMs);
    const ageTimer = setInterval(() => {
      setRows((prev) => prev.map((r) => ({ ...r, age: r.age + 1 })));
    }, 1000);
    return () => {
      clearInterval(timer);
      clearInterval(ageTimer);
    };
  }, [pool, intervalMs]);
  return rows;
}

function formatAge(seconds: number) {
  if (seconds < 60) return `${seconds}s`;
  return `${Math.floor(seconds / 60)}m`;
}

const surfaceCategories = ["PRICE", "VOLUME", "TRENDING", "HOLDERS"];

export default function ProductSection() {
  const dossier = freshDirtRows[2];
  const chainLog = useTicking(publicChainLog, 6500);
  const auditLog = useTicking(moleAuditLog, 8000);

  const nodesById = useMemo(() => {
    const map = new Map<string, { x: number; y: number }>();
    networkNodes.forEach((n) => map.set(n.id, n));
    map.set("center", networkCenter);
    return map;
  }, []);

  return (
    <section id="terminal" className={styles.section}>
      <div className="container">
        <div className={styles.head}>
          <span className={styles.eyebrow}>THE UNDERGROUND MAP</span>
          <h2 className={styles.headline}>THE TERMINAL IS WHERE EVERYTHING CONNECTS.</h2>
          <p className={styles.sub}>
            A preview of the full Underground Terminal layout. Every panel below is illustrative —
            the real product connects these views to live public Robinhood Chain data.
          </p>
        </div>

        <div className={styles.frame}>
          <div className={styles.frameHeader}>
            <div className={styles.frameHeaderLeft}>
              <span className={styles.dots}>
                <span className={styles.dot} />
                <span className={styles.dot} />
                <span className={styles.dot} />
              </span>
              <span className={styles.frameTitle}>mole@rh:~/terminal-preview</span>
            </div>
            <span className={styles.demoBadge}>DEMO / ILLUSTRATIVE</span>
          </div>

          <div className={styles.topGrid}>
            <div className={styles.panel}>
              <span className={styles.panelLabel}>DOSSIER</span>
              <div>
                <div className={styles.dossierRow}>
                  <span className={styles.dossierKey}>ENTITY</span>
                  <span className={styles.dossierValue}>{dossier.entity}</span>
                </div>
                <div className={styles.dossierRow}>
                  <span className={styles.dossierKey}>TYPE</span>
                  <span className={styles.dossierValue}>{dossier.type}</span>
                </div>
                <div className={styles.dossierRow}>
                  <span className={styles.dossierKey}>FIRST SEEN</span>
                  <span className={styles.dossierValue}>{dossier.age} ago</span>
                </div>
                <div className={styles.dossierRow}>
                  <span className={styles.dossierKey}>CONNECTIONS</span>
                  <span className={styles.dossierValue}>{dossier.connections}</span>
                </div>
                <div className={styles.dossierRow}>
                  <span className={styles.dossierKey}>DEPTH</span>
                  <span className={styles.dossierValue}>{dossier.depth}</span>
                </div>
                <div className={styles.dossierRow}>
                  <span className={styles.dossierKey}>MOLE SCORE</span>
                  <span className={styles.dossierValue}>{dossier.score}</span>
                </div>
              </div>
            </div>

            <div className={`${styles.panel} ${styles.networkPanel}`}>
              <div className={styles.networkStage}>
                <svg
                  className={styles.networkSvg}
                  viewBox="0 0 100 100"
                  role="img"
                  aria-label="Illustrative underground wallet network preview"
                >
                  {networkEdges.map((edge, i) => {
                    const from = nodesById.get(edge.from);
                    const to = nodesById.get(edge.to);
                    if (!from || !to) return null;
                    const node = networkNodes.find((n) => n.id === edge.from);
                    const d = buildEdgePath(from, to, node?.bend ?? 0);
                    return (
                      <g key={`${edge.from}-${edge.to}-${i}`}>
                        <path className={styles.tunnel} d={d} />
                        <path
                          className={styles.tunnelPulse}
                          d={d}
                          style={{ animationDelay: `${(i % 5) * -0.7}s` }}
                        />
                      </g>
                    );
                  })}
                  {networkNodes.map((node, i) => (
                    <g
                      key={node.id}
                      className={styles.node}
                      style={{ animationDelay: `${(i % 4) * -0.6}s` }}
                    >
                      <circle cx={node.x} cy={node.y} r={2.2} />
                      <text
                        x={node.x}
                        y={node.y < 50 ? node.y - 4 : node.y + 5.4}
                        textAnchor="middle"
                        className={styles.nodeLabel}
                      >
                        {node.type}
                      </text>
                    </g>
                  ))}
                </svg>
                <div className={styles.mascotWrap}>
                  <Image
                    src="/assets/mole-mascot.png"
                    alt=""
                    fill
                    sizes="120px"
                    className="pixelSharp"
                    aria-hidden
                  />
                </div>
              </div>
            </div>

            <div className={styles.panel}>
              <span className={styles.panelLabel}>SURFACE ACTIVITY</span>
              <div>
                {surfaceCategories.map((cat) => (
                  <div key={cat} className={styles.surfaceRow}>
                    <span className={styles.surfaceKey}>{cat}</span>
                    <span className={styles.surfaceValue}>AWAITING DATA</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className={styles.bottomGrid}>
            <div className={styles.logPanel}>
              <span className={styles.panelLabel}>PUBLIC CHAIN LOGS</span>
              <ul className={styles.logList}>
                {chainLog.map((row, i) => (
                  <li key={`${row.id}-${i}`} className={styles.logRow}>
                    <span className={styles.logMessage}>{row.message}</span>
                    <span>{formatAge(row.age)}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className={styles.logPanel}>
              <span className={styles.panelLabel}>MOLE AUDIT</span>
              <ul className={styles.logList}>
                {auditLog.map((row, i) => (
                  <li key={`${row.id}-${i}`} className={styles.logRow}>
                    <span className={styles.logMessage}>{row.message}</span>
                    <span>{formatAge(row.age)}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className={styles.footerRow}>
            <span className={styles.footerNote}>
              Preview layout only. Live public-chain integration comes later.
            </span>
            <span className={styles.openBtn} aria-disabled title="Full terminal not built yet">
              OPEN FULL TERMINAL
              <span className={styles.openBtnSoon}>COMING SOON</span>
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
