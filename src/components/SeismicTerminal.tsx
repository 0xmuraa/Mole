"use client";

import { useEffect, useRef, useState } from "react";
import styles from "./SeismicTerminal.module.css";
import SeismicNetwork, { edgeKey } from "./SeismicNetwork";
import { site } from "@/config/project";
import {
  dossier,
  dossierFindings,
  flowSummary,
  surfaceBase,
  tremorStackSeed,
  publicLogPool,
  auditPool,
  seismicNodes,
  seismicEdges,
  type TremorStackItem,
  type LogEventType,
  type AuditTag,
} from "@/data/seismic";

type Tab = "logs" | "tremors" | "decisions";

const FEATURES = [
  {
    title: "WALLETS",
    copy: "Track smart money and entity behavior.",
    icon: (
      <svg viewBox="0 0 20 20" aria-hidden>
        <rect x="2.5" y="5" width="15" height="11" rx="2" />
        <path d="M13 10.5h4.5M2.5 8h15" />
      </svg>
    ),
  },
  {
    title: "FUNDING ROUTES",
    copy: "Trace capital movement and hidden relationships.",
    icon: (
      <svg viewBox="0 0 20 20" aria-hidden>
        <circle cx="4" cy="15" r="2" />
        <circle cx="16" cy="5" r="2" />
        <path d="M6 14c4-1 5-7 8-8" />
      </svg>
    ),
  },
  {
    title: "CONVERGENCE",
    copy: "Spot independent activity moving toward the same entity.",
    icon: (
      <svg viewBox="0 0 20 20" aria-hidden>
        <circle cx="10" cy="10" r="2.2" />
        <path d="M3 3l4.5 4.5M17 3l-4.5 4.5M3 17l4.5-4.5M17 17l-4.5-4.5" />
      </svg>
    ),
  },
  {
    title: "SEISMIC SIGNALS",
    copy: "Measure acceleration before it becomes obvious.",
    icon: (
      <svg viewBox="0 0 20 20" aria-hidden>
        <path d="M2 10h3l2-4 3 8 3-6 2 2h3" />
      </svg>
    ),
  },
];

const DEMO_ENTITIES = [
  "0x71a…92f",
  "0x18b…11a",
  "0x92f…77c",
  "0x62a…12e",
  "0xd45…9a2",
  "0xb1a…6e3",
  "0x3f9…7c2",
  "0xa08…5e1",
  "0x204…c6d",
  "0x9e7…4b1",
];

function randomEntity() {
  return DEMO_ENTITIES[Math.floor(Math.random() * DEMO_ENTITIES.length)];
}

function pickNode() {
  return seismicNodes[Math.floor(Math.random() * seismicNodes.length)];
}

function edgeKeysTouching(nodeId: string, count: number) {
  const touching = seismicEdges.filter((e) => e.from === nodeId || e.to === nodeId);
  const pool = touching.length ? touching : seismicEdges;
  const picks = new Set<string>();
  let guard = 0;
  while (picks.size < Math.min(count, pool.length) && guard < 50) {
    const e = pool[Math.floor(Math.random() * pool.length)];
    picks.add(edgeKey(e.from, e.to));
    guard++;
  }
  return picks;
}

function neighborsOf(nodeId: string, count: number) {
  const touching = seismicEdges.filter((e) => e.from === nodeId || e.to === nodeId);
  const ids = new Set<string>();
  touching.slice(0, count).forEach((e) => {
    const other = e.from === nodeId ? e.to : e.from;
    if (other !== "center") ids.add(other);
  });
  return ids;
}

// Fires `fn` on its own independently randomized interval within [min, max]
// seconds. Reads only refs/stable setters, so it never needs to restart.
function useRandomLoop(fn: () => void, minSec: number, maxSec: number) {
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    let stopped = false;
    const tick = () => {
      if (stopped) return;
      fn();
      timer = setTimeout(tick, (minSec + Math.random() * (maxSec - minSec)) * 1000);
    };
    timer = setTimeout(tick, (minSec + Math.random() * (maxSec - minSec)) * 1000);
    return () => {
      stopped = true;
      clearTimeout(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}

function clamp(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, v));
}

function formatAge(seconds: number) {
  if (seconds < 60) return `${seconds}s`;
  return `${Math.floor(seconds / 60)}m`;
}

function buildChartPaths(points: number[], width: number, height: number) {
  const step = width / (points.length - 1);
  const coords = points.map((p, i) => [i * step, height - (p / 100) * height] as const);
  const line = coords.map(([x, y], i) => `${i === 0 ? "M" : "L"} ${x.toFixed(1)} ${y.toFixed(1)}`).join(" ");
  const area = `${line} L ${width} ${height} L 0 ${height} Z`;
  const last = coords[coords.length - 1];
  return { line, area, lastX: last[0], lastY: last[1] };
}

export default function SeismicTerminal() {
  const [activeTab, setActiveTab] = useState<Tab>("tremors");

  // --- metrics (ref + state mirror so event handlers never read stale values) ---
  const magnitudeRef = useRef(surfaceBase.magnitude);
  const [magnitude, setMagnitude] = useState(surfaceBase.magnitude);
  const [magDelta, setMagDelta] = useState(0);

  const convergenceRef = useRef(surfaceBase.convergence);
  const [convergence, setConvergence] = useState(surfaceBase.convergence);
  const [convDelta, setConvDelta] = useState(0);

  const speedRef = useRef(surfaceBase.activitySpeed);
  const [activitySpeed, setActivitySpeed] = useState(surfaceBase.activitySpeed);

  const tremorScoreRef = useRef(dossier.tremorScore);
  const [tremorScore, setTremorScore] = useState(dossier.tremorScore);
  const [scoreDelta, setScoreDelta] = useState(0);

  const bumpMagnitude = (delta: number) => {
    const next = +clamp(magnitudeRef.current + delta, 1, 9.9).toFixed(1);
    const actual = +(next - magnitudeRef.current).toFixed(1);
    magnitudeRef.current = next;
    setMagnitude(next);
    setMagDelta(actual);
    return next;
  };

  const bumpConvergence = (delta: number) => {
    const next = Math.round(clamp(convergenceRef.current + delta, 15, 99));
    const actual = next - convergenceRef.current;
    convergenceRef.current = next;
    setConvergence(next);
    setConvDelta(actual);
    return next;
  };

  const bumpSpeed = (delta: number) => {
    const next = Math.round(clamp(speedRef.current + delta, -20, 90));
    speedRef.current = next;
    setActivitySpeed(next);
    return next;
  };

  // --- network highlight state ---
  const [epicenterId, setEpicenterId] = useState<string | null>(null);
  const [flared, setFlared] = useState<Set<string>>(new Set());
  const [activeNodeIds, setActiveNodeIds] = useState<Set<string>>(new Set());
  const [wakingId, setWakingId] = useState<string | null>(null);

  const addFlare = (keys: Set<string>, ms: number) => {
    setFlared((prev) => new Set([...prev, ...keys]));
    setTimeout(() => {
      setFlared((prev) => {
        const next = new Set(prev);
        keys.forEach((k) => next.delete(k));
        return next;
      });
    }, ms);
  };

  const addActive = (ids: Set<string>, ms: number) => {
    setActiveNodeIds((prev) => new Set([...prev, ...ids]));
    setTimeout(() => {
      setActiveNodeIds((prev) => {
        const next = new Set(prev);
        ids.forEach((id) => next.delete(id));
        return next;
      });
    }, ms);
  };

  // --- chart ---
  const [chartPoints, setChartPoints] = useState<number[]>(() => {
    const arr: number[] = [];
    for (let i = 0; i < 30; i++) {
      arr.push(clamp(46 + 16 * Math.sin(i * 0.6) + 5 * Math.sin(i * 1.7), 10, 92));
    }
    return arr;
  });
  const [chartHot, setChartHot] = useState(false);

  const ambientChartTick = () => {
    setChartPoints((prev) => {
      const last = prev[prev.length - 1];
      const next = clamp(last + (Math.random() * 16 - 8), 8, 94);
      return [...prev.slice(1), next];
    });
  };

  const spikeChart = () => {
    setChartPoints((prev) => {
      const last = prev[prev.length - 1];
      const next = clamp(last + (26 + Math.random() * 20), 8, 96);
      return [...prev.slice(1), next];
    });
    setChartHot(true);
    setTimeout(() => setChartHot(false), 1800);
  };

  // --- tremor event stack ---
  const [tremorStack, setTremorStack] = useState<TremorStackItem[]>(tremorStackSeed);
  const tremorCounterRef = useRef(42);

  const pushTremorStack = () => {
    tremorCounterRef.current += 1;
    const label = `TREMOR #${String(tremorCounterRef.current).padStart(3, "0")}`;
    setTremorStack((prev) => {
      const demoted = prev.map((t, i) =>
        i === 0 ? { ...t, state: "COOLING" as const } : i === 1 ? { ...t, state: "AFTERSHOCK" as const } : t,
      );
      return [{ id: label, label, state: "ACTIVE" as const }, ...demoted.slice(0, 2)];
    });
  };

  // --- logs ---
  const publicSeqRef = useRef(publicLogPool.length);
  const [publicRows, setPublicRows] = useState(() =>
    publicLogPool.slice(0, 6).map((r, i) => ({ ...r, age: i * 5, seq: i })),
  );

  const auditSeqRef = useRef(auditPool.length);
  const [auditRows, setAuditRows] = useState(() =>
    auditPool.slice(0, 6).map((r, i) => ({ ...r, age: i * 6, seq: i })),
  );

  const pushPublicRow = (event: LogEventType, flow?: string) => {
    setPublicRows((prev) => {
      const seq = publicSeqRef.current++;
      const row = {
        id: `pl-${seq}`,
        event,
        entity: randomEntity(),
        flow: flow ?? (event === "VERIFY" ? "—" : `+${(Math.random() * 7 + 0.5).toFixed(1)}`),
        depth: 1 + Math.floor(Math.random() * 5),
        index: 130 + Math.floor(Math.random() * 80),
        age: 0,
        seq,
      };
      return [row, ...prev.slice(0, prev.length - 1)];
    });
  };

  const pushAuditRow = (tag: AuditTag, message: string) => {
    setAuditRows((prev) => {
      const seq = auditSeqRef.current++;
      return [{ id: `au-${seq}`, tag, message, age: 0, seq }, ...prev.slice(0, prev.length - 1)];
    });
  };

  useEffect(() => {
    const ageTimer = setInterval(() => {
      setPublicRows((prev) => prev.map((r) => ({ ...r, age: r.age + 1 })));
      setAuditRows((prev) => prev.map((r) => ({ ...r, age: r.age + 1 })));
    }, 1000);
    const chartTimer = setInterval(ambientChartTick, 900);
    return () => {
      clearInterval(ageTimer);
      clearInterval(chartTimer);
    };
  }, []);

  // ambient tremor-score jitter — a small independent "still scanning" tick
  useRandomLoop(() => {
    const step = Math.random() > 0.5 ? 1 : -1;
    const next = Math.round(clamp(tremorScoreRef.current + step, 60, 95));
    setScoreDelta(next - tremorScoreRef.current);
    tremorScoreRef.current = next;
    setTremorScore(next);
  }, 3, 5);

  // gentle mean-reversion so magnitude/convergence settle back down between
  // tremors instead of drifting up to the ceiling and getting stuck there.
  useRandomLoop(() => {
    bumpMagnitude((surfaceBase.magnitude - magnitudeRef.current) * 0.18);
    bumpConvergence((surfaceBase.convergence - convergenceRef.current) * 0.15);
    bumpSpeed((surfaceBase.activitySpeed - speedRef.current) * 0.35);
  }, 3.5, 5);

  // --- coordinated event types ---

  useRandomLoop(() => {
    const node = pickNode();
    addActive(new Set([node.id]), 2400);
  }, 1, 3);

  useRandomLoop(() => {
    const node = pickNode();
    setWakingId(node.id);
    setTimeout(() => setWakingId((id) => (id === node.id ? null : id)), 1200);
    addActive(new Set([node.id]), 2400);
    pushAuditRow("WAKE", "Dormant wallet resumed activity");
    pushPublicRow("WAKE");
  }, 3, 5.5);

  useRandomLoop(() => {
    const node = pickNode();
    addFlare(edgeKeysTouching(node.id, 1), 1800);
    pushAuditRow("TRACE", "New funding route discovered");
    pushPublicRow("TRACE");
  }, 2, 4);

  useRandomLoop(() => {
    const longEdges = seismicEdges.filter((e) => e.long);
    const edge =
      longEdges.length && Math.random() < 0.6
        ? longEdges[Math.floor(Math.random() * longEdges.length)]
        : seismicEdges[Math.floor(Math.random() * seismicEdges.length)];
    addFlare(new Set([edgeKey(edge.from, edge.to)]), 2000);
    bumpSpeed(Math.random() * 10 - 5);
    pushAuditRow("FLOW", "Cross-cluster movement accelerating");
    pushPublicRow("FLOW");
  }, 2.5, 4.5);

  useRandomLoop(() => {
    const node = pickNode();
    const keys = edgeKeysTouching(node.id, 3);
    addFlare(keys, 2200);
    addActive(new Set([node.id]), 2200);
    bumpConvergence(Math.round(Math.random() * 10 - 3));
    pushAuditRow("CONVERGE", "Independent paths approaching same entity");
    pushPublicRow("VERIFY", "—");
  }, 7, 12);

  useRandomLoop(() => {
    const node = pickNode();
    setEpicenterId(node.id);
    setTimeout(() => setEpicenterId((id) => (id === node.id ? null : id)), 1700);
    pushAuditRow("EPICENTER", "New center detected");
  }, 9, 14);

  useRandomLoop(() => {
    const node = pickNode();
    const keys = edgeKeysTouching(node.id, 3);
    const neighbors = neighborsOf(node.id, 3);

    setEpicenterId(node.id);
    addFlare(keys, 2600);
    addActive(new Set([node.id, ...neighbors]), 2600);
    setTimeout(() => setEpicenterId((id) => (id === node.id ? null : id)), 1700);

    const nextMag = bumpMagnitude(+(Math.random() * 1.2 + 0.3).toFixed(1));
    spikeChart();
    pushTremorStack();
    pushAuditRow("TREMOR", `Magnitude increased to ${nextMag}`);
    pushPublicRow("TREMOR", `+${nextMag}`);

    // aftershock follows shortly after
    setTimeout(() => {
      const aftershockNode = neighbors.size ? [...neighbors][0] : pickNode().id;
      addActive(new Set([aftershockNode]), 1600);
      bumpMagnitude(-(Math.random() * 0.6 + 0.1));
      pushAuditRow("AFTERSHOCK", "Secondary activity detected");
      pushPublicRow("FLOW");
    }, 2400 + Math.random() * 1200);
  }, 4, 7);

  return (
    <section id="terminal" className="section">
      <div className="container">
        <div className={styles.intro}>
          <div className={styles.introText}>
            <span className="eyebrow">THE TERMINAL</span>
            <h2 className="h2">
              THE TERMINAL IS WHERE
              <br />
              EVERYTHING <em>CONNECTS</em>
            </h2>
            <p className={styles.triLine}>
              Real-time data.
              <br />
              Deeper context.
              <br />
              Clearer edges.
            </p>
            <p className="lead">
              The HYPERMOLE terminal brings together wallets, funding routes, convergence and
              seismic signals in one interface so you can see what is moving before the market
              does.
            </p>
            <div className={styles.introActions}>
              <a href="#terminal-frame" className="btnPrimary">
                OPEN TERMINAL
              </a>
              <a href={site.repo} target="_blank" rel="noopener noreferrer" className="btnSecondary">
                VIEW GITHUB
              </a>
            </div>
          </div>

          <div className={styles.features}>
            {FEATURES.map((f) => (
              <div key={f.title} className={styles.feature}>
                <span className={styles.featureIcon}>{f.icon}</span>
                <div className={styles.featureText}>
                  <span className={styles.featureTitle}>{f.title}</span>
                  <span className={styles.featureCopy}>{f.copy}</span>
                </div>
                <span className={styles.featureArrow} aria-hidden>
                  →
                </span>
              </div>
            ))}
          </div>
        </div>

        <div id="terminal-frame" className={styles.frame}>
          <div className={styles.topBar}>
            <div className={styles.topBarLeft}>
              <span className={styles.dots}>
                <span className={styles.dot} />
                <span className={styles.dot} />
                <span className={styles.dot} />
              </span>
              <span className={styles.title}>
                HYPERMOLE <span className={styles.titleSub}>/ SEISMIC OBSERVATORY</span>
              </span>
            </div>

            <div className={styles.tabs}>
              <button
                type="button"
                className={`${styles.tab} ${activeTab === "logs" ? styles.tabActive : ""}`}
                onClick={() => setActiveTab("logs")}
              >
                PUBLIC LOGS
              </button>
              <span className={styles.tabArrow}>→</span>
              <button
                type="button"
                className={`${styles.tab} ${activeTab === "tremors" ? styles.tabActive : ""}`}
                onClick={() => setActiveTab("tremors")}
              >
                TREMORS
              </button>
              <span className={styles.tabArrow}>→</span>
              <button
                type="button"
                className={`${styles.tab} ${activeTab === "decisions" ? styles.tabActive : ""}`}
                onClick={() => setActiveTab("decisions")}
              >
                DECISIONS
              </button>
            </div>

            <div className={styles.statusGroup}>
              <span className={styles.statusBadge}>RH CHAIN</span>
              <span className={styles.statusBadge}>PUBLIC SIGNALS</span>
              <span className={styles.statusBadge}>
                <span className={styles.onlineDot} />
                ONLINE
              </span>
            </div>
          </div>

          <div className={styles.mainGrid}>
            {/* LEFT — entity dossier */}
            <div className={`${styles.panel} ${activeTab === "tremors" ? styles.panelActive : ""}`}>
              <div className={styles.panelLabelRow}>
                <span className={styles.panelLabel}>ENTITY DOSSIER</span>
                <span className={styles.miniTag}>RH CHAIN</span>
              </div>

              <div>
                <div className={styles.entityName}>{dossier.entity}</div>
                <div className={styles.entitySub}>{dossier.label}</div>
              </div>

              <div className={styles.metricGrid}>
                <div className={styles.metricBox}>
                  <span className={styles.metricLabel}>TREMOR SCORE</span>
                  <span className={styles.metricValue}>
                    {tremorScore}
                    <span className={`${styles.metricDelta} ${scoreDelta > 0 ? styles.deltaUp : scoreDelta < 0 ? styles.deltaDown : ""}`}>
                      {scoreDelta > 0 ? `▲${scoreDelta}` : scoreDelta < 0 ? `▼${Math.abs(scoreDelta)}` : ""}
                    </span>
                  </span>
                </div>
                <div className={styles.metricBox}>
                  <span className={styles.metricLabel}>MAGNITUDE</span>
                  <span className={styles.metricValue}>
                    {magnitude}
                    <span className={`${styles.metricDelta} ${magDelta > 0 ? styles.deltaUp : ""}`}>
                      {magDelta > 0 ? `▲${magDelta}` : ""}
                    </span>
                  </span>
                </div>
                <div className={styles.metricBox}>
                  <span className={styles.metricLabel}>CONVERGENCE</span>
                  <span className={`${styles.metricValue} ${styles.metricValueCyan}`}>
                    {convergence}
                    <span className={`${styles.metricDelta} ${convDelta > 0 ? styles.deltaUp : convDelta < 0 ? styles.deltaDown : ""}`}>
                      {convDelta > 0 ? `▲${convDelta}` : convDelta < 0 ? `▼${Math.abs(convDelta)}` : ""}
                    </span>
                  </span>
                </div>
                <div className={styles.metricBox}>
                  <span className={styles.metricLabel}>ACTIVE WALLETS</span>
                  <span className={`${styles.metricValue} ${styles.metricValueCyan}`}>{dossier.activeWallets}</span>
                </div>
              </div>

              <ul className={styles.findings}>
                {dossierFindings.map((f) => (
                  <li key={f.id} className={styles.findingItem}>
                    <span className={styles.findingDash}>—</span>
                    {f.text}
                  </li>
                ))}
              </ul>

              <div className={styles.subPanel}>
                <span className={styles.subPanelTitle}>FLOW SUMMARY</span>
                <span className={styles.subPanelLine}>
                  <strong>{flowSummary.routes}</strong> routes detected
                </span>
                <span className={styles.subPanelLine}>
                  <strong>{flowSummary.independentSources}</strong> independent sources
                </span>
                <span className={styles.subPanelLine}>
                  <strong>{flowSummary.clustersConverging}</strong> clusters converging
                </span>
              </div>
            </div>

            {/* CENTER — seismic network */}
            <div className={`${styles.panel} ${styles.networkPanel}`}>
              <div className={styles.networkWrap}>
                <span className={styles.networkStatus}>{seismicNodes.length} NODES · CONTINUOUS MAPPING</span>
                <SeismicNetwork
                  size="full"
                  epicenterId={epicenterId}
                  flaredEdgeKeys={flared}
                  activeNodeIds={activeNodeIds}
                  wakingNodeId={wakingId}
                />
              </div>
            </div>

            {/* RIGHT — surface activity */}
            <div className={`${styles.panel} ${activeTab === "decisions" ? styles.panelActive : ""}`}>
              <div className={styles.panelLabelRow}>
                <span className={styles.panelLabel}>SURFACE ACTIVITY</span>
                <span className={styles.miniTag}>SEISMIC LIVE</span>
              </div>

              {(() => {
                const { line, area, lastX, lastY } = buildChartPaths(chartPoints, 240, 92);
                return (
                  <div className={styles.chartWrap}>
                    <svg className={styles.chartSvg} viewBox="0 0 240 92" preserveAspectRatio="none">
                      <defs>
                        <linearGradient id="seismicChartGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#4fd9eb" stopOpacity="0.5" />
                          <stop offset="100%" stopColor="#4fd9eb" stopOpacity="0" />
                        </linearGradient>
                      </defs>
                      <path className={styles.chartArea} d={area} />
                      <path className={styles.chartLine} d={line} />
                      <circle
                        className={chartHot ? styles.chartSpikeDot : undefined}
                        cx={lastX}
                        cy={lastY}
                        r={chartHot ? 2.6 : 1.8}
                        fill={chartHot ? undefined : "var(--cyan)"}
                      />
                    </svg>
                  </div>
                );
              })()}

              <div className={styles.surfaceMetrics}>
                <div className={styles.metricBox}>
                  <span className={styles.metricLabel}>MAGNITUDE</span>
                  <span className={styles.metricValue}>{magnitude}</span>
                </div>
                <div className={styles.metricBox}>
                  <span className={styles.metricLabel}>CONVERGENCE</span>
                  <span className={`${styles.metricValue} ${styles.metricValueCyan}`}>{convergence}</span>
                </div>
                <div className={styles.metricBox}>
                  <span className={styles.metricLabel}>ACTIVITY</span>
                  <span className={`${styles.metricValue} ${styles.metricValueCyan}`}>
                    {activitySpeed >= 0 ? "+" : ""}
                    {activitySpeed}%
                  </span>
                </div>
              </div>

              <div className={styles.tremorStack}>
                {tremorStack.map((t) => (
                  <div key={t.id} className={styles.tremorStackRow}>
                    <span className={styles.tremorLabel}>{t.label}</span>
                    <span className={`${styles.stateBadge} ${styles[`state${t.state}`]}`}>{t.state}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className={styles.bottomGrid}>
            <div className={`${styles.logPanel} ${activeTab === "logs" ? styles.panelActive : ""}`}>
              <div className={styles.panelLabelRow}>
                <span className={styles.panelLabel}>PUBLIC CHAIN LOGS</span>
                <span className={styles.miniTag}>RH CHAIN</span>
              </div>
              <table className={styles.logTable}>
                <thead>
                  <tr>
                    <th>TIME</th>
                    <th>EVENT</th>
                    <th>ENTITY</th>
                    <th>FLOW</th>
                    <th>DEPTH</th>
                    <th>INDEX</th>
                  </tr>
                </thead>
                <tbody>
                  {publicRows.map((row) => (
                    <tr key={row.seq} className={styles.logRowIn}>
                      <td className={styles.logAge}>{formatAge(row.age)}</td>
                      <td className={styles[`event${row.event}`]}>{row.event}</td>
                      <td>{row.entity}</td>
                      <td>{row.flow}</td>
                      <td>{row.depth}</td>
                      <td>{row.index}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className={styles.logPanel}>
              <div className={styles.panelLabelRow}>
                <span className={styles.panelLabel}>HYPERMOLE AUDIT</span>
                <span className={styles.miniTag}>LIVE</span>
              </div>
              <ul className={styles.auditList}>
                {auditRows.map((row) => (
                  <li key={row.seq} className={styles.auditRow}>
                    <span className={`${styles.auditTag} ${styles[`tag${row.tag}`]}`}>{row.tag}</span>
                    <span className={styles.auditMessage}>{row.message}</span>
                    <span className={styles.auditAge}>{formatAge(row.age)}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className={styles.footerRow}>
            <span className={styles.footerNote}>
              Public onchain signals · Robinhood Chain
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
