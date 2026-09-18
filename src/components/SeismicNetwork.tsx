"use client";

import { useMemo, type CSSProperties } from "react";
import Image from "next/image";
import styles from "./SeismicNetwork.module.css";
import { buildEdgePath } from "@/lib/edgePath";
import { seismicNodes, seismicEdges, seismicCore, type NodeType } from "@/data/seismic";

const TYPE_COLOR: Record<NodeType, string> = {
  WALLET: "var(--cyan)",
  FRESH: "var(--cyan)",
  TRACE: "var(--gold)",
  FLOW: "var(--amber)",
  CONTRACT: "var(--cyan-dim)",
  WAKE: "var(--gold)",
  CLUSTER: "var(--cyan-dim)",
  VERIFY: "var(--status-green)",
};

// A handful of nodes drift a little over time so the map never feels frozen.
const DRIFT: Record<string, { x: number; y: number; duration: number }> = {
  fw4: { x: 1.6, y: -1.2, duration: 7.5 },
  sc4: { x: -1.3, y: 1.4, duration: 8.4 },
  fn1: { x: 1.2, y: 1.1, duration: 6.8 },
  ct2: { x: -1.5, y: -1, duration: 9.1 },
  s1: { x: 1, y: 1.3, duration: 7.1 },
  s2: { x: -1.1, y: -1.3, duration: 8.9 },
};

export type SeismicNetworkProps = {
  size?: "compact" | "full";
  epicenterId?: string | null;
  flaredEdgeKeys?: Set<string>;
  activeNodeIds?: Set<string>;
  wakingNodeId?: string | null;
  tempEdge?: { from: string; to: string; bend: number } | null;
};

export function edgeKey(a: string, b: string) {
  return [a, b].sort().join("::");
}

export default function SeismicNetwork({
  size = "full",
  epicenterId = null,
  flaredEdgeKeys,
  activeNodeIds,
  wakingNodeId = null,
  tempEdge = null,
}: SeismicNetworkProps) {
  const nodesById = useMemo(() => {
    const map = new Map<string, { x: number; y: number }>();
    seismicNodes.forEach((n) => map.set(n.id, n));
    map.set("center", seismicCore);
    return map;
  }, []);

  const nodeRadius = size === "compact" ? 2.0 : 2.15;
  const labelSize = size === "compact" ? 2.5 : 2.8;
  const epicenter = epicenterId ? nodesById.get(epicenterId) : null;

  return (
    <div className={`${styles.stage} ${styles[size]}`}>
      <svg
        className={styles.svg}
        viewBox="0 0 160 100"
        role="img"
        aria-label="Animated seismic wallet network with four regions"
      >
        {seismicEdges.map((edge, i) => {
          const from = nodesById.get(edge.from);
          const to = nodesById.get(edge.to);
          if (!from || !to) return null;
          const d = buildEdgePath(from, to, edge.bend);
          const duration = 1.7 + (i % 5) * 0.22;
          const delay = -((i % 9) * 0.3);
          const pulseStyle: CSSProperties = {
            animationDuration: `${duration}s`,
            animationDelay: `${delay}s`,
          };
          const flared = flaredEdgeKeys?.has(edgeKey(edge.from, edge.to));
          const cls = [edge.long ? styles.tunnelLong : "", flared ? styles.edgeFlare : ""]
            .filter(Boolean)
            .join(" ");
          return (
            <g key={`${edge.from}-${edge.to}-${i}`} className={cls}>
              <path className={styles.tunnel} d={d} />
              <path className={styles.tunnelPulse} d={d} style={pulseStyle} />
            </g>
          );
        })}

        {tempEdge &&
          (() => {
            const from = nodesById.get(tempEdge.from);
            const to = nodesById.get(tempEdge.to);
            if (!from || !to) return null;
            const d = buildEdgePath(from, to, tempEdge.bend);
            return (
              <g className={styles.tempEdge}>
                <path className={styles.tunnel} d={d} />
              </g>
            );
          })()}

        {seismicNodes.map((node, i) => {
          const drift = DRIFT[node.id];
          const isActive = activeNodeIds?.has(node.id) || node.id === epicenterId;
          const isWaking = node.id === wakingNodeId;
          const nodeStyle = {
            "--breathe-duration": `${2.1 + (i % 4) * 0.28}s`,
            "--breathe-delay": `${-((i % 7) * 0.34)}s`,
            "--node-color": TYPE_COLOR[node.type],
            ...(drift
              ? { "--drift-x": `${drift.x}px`, "--drift-y": `${drift.y}px`, "--drift-duration": `${drift.duration}s` }
              : {}),
          } as CSSProperties;
          const labelBelow = node.y >= 50;
          const classes = [
            styles.node,
            drift ? styles.drift : "",
            isActive ? styles.active : "",
            isWaking ? styles.waking : "",
            node.id === epicenterId ? styles.epicenterBadge : "",
          ]
            .filter(Boolean)
            .join(" ");
          return (
            <g key={node.id} className={classes} style={nodeStyle}>
              <circle cx={node.x} cy={node.y} r={nodeRadius} />
              <text
                x={node.x}
                y={labelBelow ? node.y + 5.2 : node.y - 3.4}
                textAnchor="middle"
                className={styles.nodeLabel}
                style={{ fontSize: labelSize }}
              >
                {node.type}
              </text>
            </g>
          );
        })}

        {epicenter && (
          <circle
            key={epicenterId}
            className={styles.epicenterRing}
            cx={epicenter.x}
            cy={epicenter.y}
            r={nodeRadius}
          />
        )}
      </svg>

      <div className={styles.core}>
        <div className={styles.coreBadge}>
          <Image
            src="/assets/mole-mascot.png"
            alt="HYPERMOLE"
            fill
            sizes="58px"
            className="pixelSharp"
          />
        </div>
        <span className={styles.coreLabel}>
          HYPERMOLE
          <br />
          <span className={styles.coreLabelSub}>SEISMIC CORE</span>
        </span>
      </div>
    </div>
  );
}
