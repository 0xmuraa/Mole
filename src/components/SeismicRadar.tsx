"use client";

import { useEffect, useRef, useState } from "react";
import styles from "./SeismicRadar.module.css";
import SeismicNetwork, { edgeKey } from "./SeismicNetwork";
import { seismicNodes, seismicEdges, auditPool, type AuditRow } from "@/data/seismic";

const STATUS_PHRASES = [
  "SCANNING SEISMIC LAYER...",
  "MAPPING CONVERGENCE...",
  "WATCHING FOR TREMORS...",
  "TRACING FUNDING ROUTES...",
];

function randomDelay(min: number, max: number) {
  return min + Math.random() * (max - min);
}

export default function SeismicRadar() {
  const [flared, setFlared] = useState<Set<string>>(new Set());
  const [epicenterId, setEpicenterId] = useState<string | null>(null);
  const [wakingId, setWakingId] = useState<string | null>(null);
  const [statusIndex, setStatusIndex] = useState(0);
  const [rows, setRows] = useState(() => auditPool.slice(0, 5).map((e, i) => ({ ...e, age: i * 6, seq: i })));

  const seqRef = useRef(5);
  const cursorRef = useRef(5);

  useEffect(() => {
    let flareTimer: ReturnType<typeof setTimeout>;
    const scheduleFlare = () => {
      flareTimer = setTimeout(() => {
        const count = 1 + Math.floor(Math.random() * 2);
        const picks = new Set<string>();
        while (picks.size < count) {
          const edge = seismicEdges[Math.floor(Math.random() * seismicEdges.length)];
          picks.add(edgeKey(edge.from, edge.to));
        }
        setFlared(picks);
        scheduleFlare();
      }, randomDelay(1800, 2600));
    };
    scheduleFlare();
    return () => clearTimeout(flareTimer);
  }, []);

  useEffect(() => {
    let tremorTimer: ReturnType<typeof setTimeout>;
    const scheduleTremor = () => {
      tremorTimer = setTimeout(() => {
        const node = seismicNodes[Math.floor(Math.random() * seismicNodes.length)];
        setEpicenterId(node.id);
        setWakingId(node.id);
        setTimeout(() => setEpicenterId(null), 1700);
        setTimeout(() => setWakingId(null), 1300);
        scheduleTremor();
      }, randomDelay(4500, 6500));
    };
    scheduleTremor();
    return () => clearTimeout(tremorTimer);
  }, []);

  useEffect(() => {
    const statusTimer = setInterval(() => {
      setStatusIndex((i) => (i + 1) % STATUS_PHRASES.length);
    }, 4200);

    const ageTimer = setInterval(() => {
      setRows((prev) => prev.map((r) => ({ ...r, age: r.age + 1 })));
    }, 1000);

    const rotateTimer = setInterval(() => {
      setRows((prev) => {
        const next: AuditRow = auditPool[cursorRef.current % auditPool.length];
        cursorRef.current += 1;
        const seq = seqRef.current++;
        return [{ ...next, age: 0, seq }, ...prev.slice(0, prev.length - 1)];
      });
    }, 3400);

    return () => {
      clearInterval(statusTimer);
      clearInterval(ageTimer);
      clearInterval(rotateTimer);
    };
  }, []);

  const formatAge = (s: number) => (s < 60 ? `${s}s` : `${Math.floor(s / 60)}m`);

  return (
    <div className={styles.terminal}>
      <div className={styles.header}>
        <div className={styles.dots}>
          <span className={styles.dot} />
          <span className={styles.dot} />
          <span className={styles.dot} />
        </div>
        <span className={styles.path}>hypermole@rh:~/seismic</span>
        <span className={styles.online}>
          <span className={styles.onlineDot} />
          RADAR ONLINE
        </span>
      </div>

      <div className={styles.modeRow}>
        <span className={styles.badge}>DEMO MODE</span>
        <span className={styles.badge}>RH CHAIN</span>
        <span className={styles.status}>{STATUS_PHRASES[statusIndex]}</span>
      </div>

      <SeismicNetwork
        size="compact"
        epicenterId={epicenterId}
        flaredEdgeKeys={flared}
        wakingNodeId={wakingId}
      />

      <div className={styles.feed}>
        <div className={styles.feedHeader}>
          <span className={styles.feedTitle}>HYPERMOLE AUDIT · SIMULATION</span>
        </div>
        <ul className={styles.feedList}>
          {rows.map((row) => (
            <li key={row.seq} className={styles.feedRow}>
              <span className={`${styles.feedTag} ${styles[`tag${row.tag}`]}`}>{row.tag}</span>
              <span className={styles.feedMessage}>{row.message}</span>
              <span className={styles.feedAge}>{formatAge(row.age)}</span>
            </li>
          ))}
        </ul>
        <p className={styles.feedFooter}>Simulated activity. Live public-chain integration comes later.</p>
      </div>
    </div>
  );
}
