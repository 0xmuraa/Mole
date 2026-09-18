"use client";

import { useRef } from "react";
import styles from "./SeismicRadar.module.css";
import NetworkStage from "./terminal/NetworkStage";
import { useEngineSnapshot, useSeismicEngine } from "@/simulation/useSeismicEngine";

const STATUS = ["MONITORING CHAIN EVENTS…", "TRACING FUNDING ROUTES…", "DETECTING CONVERGENCE…", "SURFACING SIGNALS…"];

// Hero preview of the flagship terminal: same SeismicEngine and NetworkStage
// as /terminal, run in compact mode (fewer nodes, no tables).
export default function SeismicRadar() {
  const rootRef = useRef<HTMLDivElement>(null);
  const engine = useSeismicEngine({ compact: true }, rootRef);
  const snap = useEngineSnapshot(engine);

  return (
    <div ref={rootRef} className={styles.terminal}>
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
        <span className={styles.badge}>SEISMIC LIVE</span>
        <span className={styles.badge}>RH CHAIN</span>
        <span className={styles.badgeCyan}>MAG {snap.metrics.magnitude.toFixed(1)}</span>
        <span className={styles.badgeCyan}>CONV {snap.metrics.convergence}</span>
        <span className={styles.status}>{STATUS[snap.processStep]}</span>
      </div>

      <div className={styles.stageBox}>
        <NetworkStage engine={engine} compact />
      </div>

      <div className={styles.feed}>
        <div className={styles.feedHeader}>
          <span className={styles.feedTitle}>HYPERMOLE AUDIT · PUBLIC SIGNALS</span>
          <span className={styles.feedTitle}>EPICENTER · {snap.epicenterLabel ?? "SCANNING"}</span>
        </div>
        <ul className={styles.feedList}>
          {snap.audit.slice(0, 5).map((row) => (
            <li key={row.id} className={styles.feedRow}>
              <span className={`${styles.feedTag} ${styles[`tag${row.type}`]}`}>{row.type}</span>
              <span className={styles.feedMessage}>{row.text}</span>
              <span className={styles.feedAge}>{row.at}</span>
            </li>
          ))}
        </ul>
        <p className={styles.feedFooter}>Public onchain signals · Robinhood Chain</p>
      </div>
    </div>
  );
}
