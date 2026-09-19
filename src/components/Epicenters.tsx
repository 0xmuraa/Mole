"use client";

import { useState } from "react";
import styles from "./Epicenters.module.css";
import {
  epicenters,
  emergingRows,
  tremorMetrics,
  tremorTimeline,
  type Epicenter,
  type ChainTab,
} from "@/data/seismic";

const TABS: ChainTab[] = ["ALL", "SOL", "ETH", "BASE", "OTHER"];

const STATUS_CLASS: Record<Epicenter["status"], string> = {
  ACTIVE: styles.active,
  BUILDING: styles.building,
  COOLING: styles.cooling,
};

function ConvergenceMap({ status, wallets }: { status: Epicenter["status"]; wallets: number }) {
  const count = status === "ACTIVE" ? 9 : status === "BUILDING" ? 7 : 5;
  const cx = 50;
  const cy = 40;
  const points = Array.from({ length: count }).map((_, i) => {
    const angle = (i / count) * Math.PI * 2 + wallets * 0.13;
    const r = 24 + ((i * 7 + wallets) % 9);
    return { x: cx + Math.cos(angle) * r, y: cy + Math.sin(angle) * r * 0.66 };
  });
  return (
    <svg className={styles.map} viewBox="0 0 100 80" aria-hidden>
      <circle cx={cx} cy={cy} r={30} className={styles.mapRing} />
      <circle cx={cx} cy={cy} r={18} className={styles.mapRing} />
      {points.map((p, i) => (
        <line
          key={`l${i}`}
          x1={cx}
          y1={cy}
          x2={p.x}
          y2={p.y}
          className={styles.mapLine}
          style={{ animationDelay: `${i * 0.3}s` }}
        />
      ))}
      {points.map((p, i) => (
        <circle
          key={`n${i}`}
          cx={p.x}
          cy={p.y}
          r={2.2}
          className={styles.mapNode}
          style={{ animationDelay: `${i * 0.3}s` }}
        />
      ))}
      <circle cx={cx} cy={cy} r={4} className={styles.mapCore} />
      {status === "ACTIVE" && <circle cx={cx} cy={cy} r={5} className={styles.mapPulse} />}
    </svg>
  );
}

function EpicenterCard({ ep }: { ep: Epicenter }) {
  const velocityTone = ep.velocity > 0 ? styles.up : ep.velocity < 0 ? styles.down : "";
  return (
    <article className={`${styles.card} ${STATUS_CLASS[ep.status]}`}>
      <div className={styles.cardHead}>
        <span className={styles.cardIndex}>EPICENTER {ep.index}</span>
        <span className={styles.status}>
          <span className={styles.statusDot} />
          {ep.status}
        </span>
      </div>

      <div className={styles.cardTitleRow}>
        <h3 className={styles.cardName}>
          <span className={styles.ticker}>{ep.ticker}</span>
          {ep.name}
        </h3>
        <div className={styles.tags}>
          {ep.tags.map((t) => (
            <span key={t} className={styles.tagChip}>
              {t}
            </span>
          ))}
        </div>
      </div>
      <p className={styles.cardDesc}>{ep.description}</p>

      <div className={styles.mapWrap}>
        <ConvergenceMap status={ep.status} wallets={ep.wallets} />
      </div>

      <div className={styles.metrics}>
        <div className={styles.metric}>
          <span className={styles.metricLabel}>MAGNITUDE</span>
          <span className={`${styles.metricValue} ${styles.metricAccent}`}>{ep.magnitude.toFixed(1)}</span>
        </div>
        <div className={styles.metric}>
          <span className={styles.metricLabel}>CONVERGENCE</span>
          <span className={styles.metricValue}>{ep.convergence}</span>
        </div>
        <div className={styles.metric}>
          <span className={styles.metricLabel}>WALLETS</span>
          <span className={styles.metricValue}>{ep.wallets}</span>
        </div>
        <div className={styles.metric}>
          <span className={styles.metricLabel}>ROUTES</span>
          <span className={styles.metricValue}>{ep.routes}</span>
        </div>
        <div className={styles.metric}>
          <span className={styles.metricLabel}>VELOCITY</span>
          <span className={`${styles.metricValue} ${velocityTone}`}>
            {ep.velocity > 0 ? "+" : ""}
            {ep.velocity}%
          </span>
        </div>
        <div className={styles.metric}>
          <span className={styles.metricLabel}>CONFIDENCE</span>
          <span className={`${styles.metricValue} ${styles.confidence}`}>{ep.confidence}</span>
        </div>
      </div>

      <div className={styles.heat}>
        <div className={styles.heatHead}>
          <span className={styles.metricLabel}>ACTIVITY HEAT</span>
          <span className={styles.metricLabel}>12H</span>
        </div>
        <div className={styles.heatBars}>
          {ep.heat.map((h, i) => (
            <span
              key={i}
              className={styles.heatBar}
              style={{ height: `${h * 8}%`, animationDelay: `${i * 0.18}s` }}
            />
          ))}
        </div>
      </div>

      <span className={styles.cardLink}>
        VIEW EPICENTER <span className={styles.arrow}>→</span>
      </span>
    </article>
  );
}

function EmergingActivity() {
  const [tab, setTab] = useState<ChainTab>("ALL");
  const rows = tab === "ALL" ? emergingRows : emergingRows.filter((r) => r.chain === tab);

  return (
    <div className={styles.table}>
      <div className={styles.panelHead}>
        <span className={styles.panelTitle}>EMERGING ACTIVITY</span>
        <span className={styles.liveLabel}>
          <span className="liveDot" /> LIVE
        </span>
      </div>
      <div className={styles.tabs}>
        {TABS.map((t) => (
          <button
            key={t}
            type="button"
            className={`${styles.tab} ${tab === t ? styles.tabActive : ""}`}
            onClick={() => setTab(t)}
          >
            {t}
          </button>
        ))}
      </div>
      <table className={styles.grid}>
        <thead>
          <tr>
            <th>#</th>
            <th>CLUSTER</th>
            <th>MAG</th>
            <th>Δ</th>
            <th>TIME</th>
          </tr>
        </thead>
        <tbody key={tab}>
          {rows.map((r, i) => (
            <tr key={r.id} className={styles.row} style={{ animationDelay: `${i * 0.05}s` }}>
              <td className={styles.dim}>{String(i + 1).padStart(2, "0")}</td>
              <td>
                <span className={styles.ticker}>{r.ticker}</span>
                <span className={styles.cluster}>{r.cluster}</span>
                <span className={styles.chainChip}>{r.chain}</span>
              </td>
              <td className={r.magnitude >= 7 ? styles.magHigh : r.magnitude >= 4 ? styles.magMid : styles.dim}>
                {r.magnitude.toFixed(1)}
              </td>
              <td className={r.delta > 0 ? styles.up : styles.down}>
                {r.delta > 0 ? "+" : ""}
                {r.delta}%
              </td>
              <td className={styles.dim}>{r.time}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <span className={styles.panelLink}>
        VIEW ALL EPICENTERS <span className={styles.arrow}>→</span>
      </span>
    </div>
  );
}

function NetworkTremors() {
  const w = 480;
  const h = 96;
  const step = w / (tremorTimeline.length - 1);
  const pts = tremorTimeline.map((v, i) => [i * step, h - (v / 100) * (h - 10) - 4] as const);
  const line = pts.map(([x, y], i) => `${i === 0 ? "M" : "L"} ${x.toFixed(1)} ${y.toFixed(1)}`).join(" ");
  const area = `${line} L ${w} ${h} L 0 ${h} Z`;
  const peaks = pts.filter((_, i) => tremorTimeline[i] >= 60 && i !== pts.length - 1);
  const last = pts[pts.length - 1];

  return (
    <div id="tremors" className={styles.tremors}>
      <div className={styles.timeline}>
        <div className={styles.panelHead}>
          <span className={styles.panelTitle}>NETWORK TREMORS</span>
          <span className={styles.liveLabel}>
            <span className="liveDot" /> LIVE
          </span>
        </div>
        <div className={styles.timelineChart}>
          <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" aria-hidden>
            <defs>
              <linearGradient id="tremorArea" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#38D7ED" stopOpacity="0.35" />
                <stop offset="100%" stopColor="#38D7ED" stopOpacity="0" />
              </linearGradient>
            </defs>
            <path d={area} fill="url(#tremorArea)" />
            <path d={line} className={styles.timelineLine} />
            {peaks.map(([x, y]) => (
              <circle key={x} cx={x} cy={y} r={2.5} className={styles.peak} />
            ))}
            <circle cx={last[0]} cy={last[1]} r={3.5} className={styles.nowDot} />
          </svg>
          <span className={styles.timelineScan} />
        </div>
        <div className={styles.timelineLabels}>
          <span>24H AGO</span>
          <span>18H</span>
          <span>12H</span>
          <span>6H</span>
          <span className={styles.now}>NOW</span>
        </div>
      </div>

      <div className={styles.summary}>
        {tremorMetrics.map((m) => (
          <div key={m.label} className={styles.summaryItem}>
            <span className={styles.metricLabel}>{m.label}</span>
            <span className={styles.summaryValue}>{m.value}</span>
            <span className={`${styles.summaryDelta} ${m.delta >= 0 ? styles.up : styles.down}`}>
              {m.delta >= 0 ? "+" : ""}
              {m.delta}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function Legend() {
  return (
    <div className={styles.legend}>
      <span className={styles.panelTitle}>ACTIVITY LEGEND</span>
      <div className={styles.legendItems}>
        <div className={`${styles.legendItem} ${styles.active}`}>
          <span className={styles.statusDot} />
          <div>
            <span className={styles.legendName}>ACTIVE</span>
            <span className={styles.legendDesc}>High momentum · Magnitude ≥ 7</span>
          </div>
        </div>
        <div className={`${styles.legendItem} ${styles.building}`}>
          <span className={styles.statusDot} />
          <div>
            <span className={styles.legendName}>BUILDING</span>
            <span className={styles.legendDesc}>Growing · Magnitude 4–7</span>
          </div>
        </div>
        <div className={`${styles.legendItem} ${styles.cooling}`}>
          <span className={styles.statusDot} />
          <div>
            <span className={styles.legendName}>COOLING</span>
            <span className={styles.legendDesc}>Declining · Magnitude &lt; 4</span>
          </div>
        </div>
      </div>
      <p className={styles.legendNote}>
        Magnitude bands are shared across every HYPERMOLE epicenter view.
      </p>
    </div>
  );
}

export default function Epicenters() {
  return (
    <section id="map" className="section">
      <div className="container">
        <div className={styles.head}>
          <div>
            <span className="eyebrow">EPICENTERS</span>
            <h2 className="h2">
              WHERE ACTIVITY
              <br />
              <em>STARTS TO MOVE.</em>
            </h2>
          </div>
          <p className="lead">
            HYPERMOLE identifies and groups independent onchain activity into emerging epicenters
            before it becomes obvious.
          </p>
        </div>

        <div className={styles.cards}>
          {epicenters.map((ep) => (
            <EpicenterCard key={ep.id} ep={ep} />
          ))}
        </div>

        <NetworkTremors />

        <div className={styles.lower}>
          <EmergingActivity />
          <Legend />
        </div>
      </div>
    </section>
  );
}
