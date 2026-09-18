"use client";

import { memo, useEffect, useRef } from "react";
import s from "./terminal.module.css";
import { FINDINGS, PROCESS_STEPS } from "@/simulation/config";
import { DEMO_ENTITY } from "@/simulation/generators";
import type { SeismicEngine } from "@/simulation/SeismicEngine";
import type { AuditRow, ChartState, HistoryRow, LogRow, Metrics, RouteRow, Selection } from "@/simulation/types";

// ---------------------------------------------------------------- dossier

export const EntityDossier = memo(function EntityDossier({
  metrics,
  findingIndex,
  selection,
  sim,
  onClear,
}: {
  metrics: Metrics;
  findingIndex: number;
  selection: Selection | null;
  sim: boolean;
  onClear: () => void;
}) {
  return (
    <section className={`${s.panel} ${s.dossier}`}>
      <header className={s.panelHead}>
        <h3 className={s.panelTitle}>ENTITY DOSSIER</h3>
        <span className={s.panelTag}>{sim ? "DEMO ENTITY" : "TRACKED ENTITY"}</span>
      </header>

      <div className={s.entity}>
        <span className={s.entityBadge}>HX</span>
        <div>
          <div className={s.entityName}>{DEMO_ENTITY}</div>
          <div className={s.entitySub}>{sim ? "ILLUSTRATIVE TARGET" : "RH CHAIN TARGET"}</div>
        </div>
      </div>

      <div className={s.scoreBox} data-state={metrics.scoreState}>
        <div className={s.scoreTop}>
          <span className={s.kicker}>TREMOR SCORE</span>
          <span className={s.scoreLight} />
        </div>
        <div className={s.scoreValue}>
          {metrics.score}
          <small>/ 100</small>
        </div>
        <div className={s.scoreState}>STATE · {metrics.scoreState}</div>
      </div>

      <div className={s.statGrid}>
        <div>
          <b>{metrics.magnitude.toFixed(1)}</b>
          <span>MAGNITUDE</span>
        </div>
        <div>
          <b className={s.cyan}>{metrics.convergence}</b>
          <span>CONVERGENCE</span>
        </div>
        <div>
          <b>{metrics.activeNodes}</b>
          <span>ACTIVE NODES</span>
        </div>
        <div>
          <b className={s.cyan}>{metrics.activeRoutes}</b>
          <span>ROUTES</span>
        </div>
      </div>

      {selection ? (
        <button type="button" className={s.selection} onClick={onClear}>
          <span className={s.kicker}>SELECTED NODE</span>
          <b>{selection.label}</b>
          <span>
            {selection.region} · {selection.links} LINKS · {selection.dormant ? "DORMANT" : "ONLINE"}
          </span>
          <i>CLEAR ✕</i>
        </button>
      ) : null}

      <div className={s.findings}>
        <span className={s.kicker}>UNDERGROUND FINDINGS</span>
        <ul>
          {FINDINGS.map((text, i) => (
            <li key={text} data-active={i === findingIndex ? "" : undefined}>
              <span>{text}</span>
              <i>↗</i>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
});

// -------------------------------------------------------------- route flow

export const RouteFlow = memo(function RouteFlow({ metrics, routes }: { metrics: Metrics; routes: RouteRow[] }) {
  const total = metrics.routesIndependent + metrics.routesShared + metrics.routesCross;
  const pct = (v: number) => `${Math.round((v / total) * 100)}%`;
  return (
    <section className={`${s.panel} ${s.routeFlow}`}>
      <header className={s.panelHead}>
        <h3 className={s.panelTitle}>ROUTE FLOW</h3>
        <span className={s.panelTag}>FLOW MAP</span>
      </header>

      <div className={s.routeMetric}>
        <b>{metrics.activeRoutes}</b>
        <span>ACTIVE ROUTES</span>
      </div>

      <div className={s.flowPath}>
        <span className={s.flowStop}>SOURCE</span>
        <span className={s.flowLine}>
          <i />
          <i />
        </span>
        <span className={s.flowStop}>TRACE</span>
        <span className={s.flowLine}>
          <i />
          <i />
        </span>
        <span className={`${s.flowStop} ${s.flowStopHot}`}>EPICENTER</span>
      </div>

      <div className={s.routeBars}>
        <div>
          <span>INDEPENDENT</span>
          <b>{metrics.routesIndependent}</b>
          <em>
            <i className={s.barCyan} style={{ width: pct(metrics.routesIndependent) }} />
          </em>
        </div>
        <div>
          <span>SHARED</span>
          <b>{metrics.routesShared}</b>
          <em>
            <i className={s.barAmber} style={{ width: pct(metrics.routesShared) }} />
          </em>
        </div>
        <div>
          <span>CROSS-CLUSTER</span>
          <b>{metrics.routesCross}</b>
          <em>
            <i className={s.barGold} style={{ width: pct(metrics.routesCross) }} />
          </em>
        </div>
      </div>

      <ul className={s.routeTicker}>
        {routes.map((r) => (
          <li key={r.id} data-kind={r.kind}>
            <b>{r.kind}</b>
            <span>{r.from}</span>
            <i>→</i>
            <span>{r.to}</span>
          </li>
        ))}
      </ul>
    </section>
  );
});

// ------------------------------------------------------------------ chart

const CW = 300;
const CH = 120;
const PLOT = 288;
// fixed domain (no rescaling → the chart never jumps): magnitude lives in ~3–9
const Y_MIN = 2;
const Y_MAX = 9.6;
const yOf = (v: number) => CH - 6 - ((v - Y_MIN) / (Y_MAX - Y_MIN)) * (CH - 14);

function LiveChart({ engine, chart }: { engine: SeismicEngine; chart: ChartState }) {
  const groupRef = useRef<SVGGElement>(null);
  const dotRef = useRef<HTMLSpanElement>(null);

  const n = chart.points.length;
  const step = PLOT / (n - 2);
  const xOf = (i: number) => (i - (n - 2)) * step + PLOT;
  const line = chart.points.map((v, i) => `${i ? "L" : "M"}${xOf(i).toFixed(1)} ${yOf(v).toFixed(1)}`).join("");
  const area = `${line}L${xOf(n - 1).toFixed(1)} ${CH}L${xOf(0).toFixed(1)} ${CH}Z`;

  // scroll continuously between samples so the line never looks stepped
  useEffect(
    () =>
      engine.onFrame(() => {
        const p = engine.sampleProgress;
        const pts = engine.getSnapshot().chart.points;
        const len = pts.length;
        groupRef.current?.setAttribute("transform", `translate(${(-p * (PLOT / (len - 2))).toFixed(2)} 0)`);
        if (dotRef.current) {
          const v = pts[len - 2] + (pts[len - 1] - pts[len - 2]) * p;
          dotRef.current.style.top = `${(yOf(v) / CH) * 100}%`;
        }
      }),
    [engine],
  );

  return (
    <div className={s.chart}>
      <div className={s.chartPlot}>
        {[9, 7, 5, 3].map((v) => (
          <span key={v} className={s.chartGrid} style={{ top: `${(yOf(v) / CH) * 100}%` }}>
            {v.toFixed(1)}
          </span>
        ))}
        <svg viewBox={`0 0 ${CW} ${CH}`} preserveAspectRatio="none" aria-hidden>
          <defs>
            <linearGradient id="hmChartFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#F2A63B" stopOpacity="0.32" />
              <stop offset="100%" stopColor="#F2A63B" stopOpacity="0" />
            </linearGradient>
          </defs>
          <g ref={groupRef}>
            {chart.markers.map((m) => {
              const x = (m.seq - chart.seq) * step + PLOT + step;
              return <line key={m.seq} x1={x} x2={x} y1={6} y2={CH} className={s.chartMarker} data-tone={m.tone} />;
            })}
            <path d={area} fill="url(#hmChartFill)" />
            <path d={line} className={s.chartLine} />
          </g>
        </svg>
        <span ref={dotRef} className={s.chartDot} style={{ left: `${(PLOT / CW) * 100}%` }} />
      </div>
      <div className={s.chartAxis}>
        <span>−30s</span>
        <span>−20s</span>
        <span>−10s</span>
        <span>NOW</span>
      </div>
    </div>
  );
}

// --------------------------------------------------------- surface activity

export const SurfaceActivity = memo(function SurfaceActivity({
  engine,
  metrics,
  chart,
  history,
  sim,
}: {
  engine: SeismicEngine;
  metrics: Metrics;
  chart: ChartState;
  history: HistoryRow[];
  sim: boolean;
}) {
  const rising = metrics.magDelta >= 0;
  return (
    <section className={`${s.panel} ${s.surface}`}>
      <header className={s.panelHead}>
        <h3 className={s.panelTitle}>SURFACE ACTIVITY</h3>
        <span className={s.panelTag}>{sim ? "SIMULATION" : "SEISMIC LIVE"}</span>
      </header>

      <p className={s.surfaceNote}>What becomes visible above the underground activity.</p>

      <div className={s.bigMetric}>
        <span className={s.kicker}>TREMOR MAGNITUDE</span>
        <div className={s.bigRow}>
          <b data-hot={metrics.magnitude >= 6.5 ? "" : undefined}>{metrics.magnitude.toFixed(1)}</b>
          <span className={rising ? s.deltaUp : s.deltaDown}>
            {rising ? "▲" : "▼"} {Math.abs(metrics.magDelta).toFixed(1)}
          </span>
        </div>
      </div>

      <div className={s.triple}>
        <div>
          <span>CONVERGENCE</span>
          <b className={s.cyan}>{metrics.convergence}</b>
        </div>
        <div>
          <span>ACTIVITY SPEED</span>
          <b className={s.cyan}>+{metrics.activitySpeed}%</b>
        </div>
        <div>
          <span>ACTIVE ROUTES</span>
          <b>{metrics.activeRoutes}</b>
        </div>
      </div>

      <LiveChart engine={engine} chart={chart} />

      <div className={s.history}>
        {history.map((h) => (
          <div key={h.id} className={s.historyRow} data-state={h.state}>
            <i />
            <b>TREMOR {h.id}</b>
            <span>{h.state}</span>
            <em>{h.magnitude.toFixed(1)}</em>
          </div>
        ))}
      </div>
    </section>
  );
});

// -------------------------------------------------------------- event log

export const PublicEventLog = memo(function PublicEventLog({ logs, sim }: { logs: LogRow[]; sim: boolean }) {
  return (
    <section className={`${s.panel} ${s.logPanel}`}>
      <header className={s.panelHead}>
        <h3 className={s.panelTitle}>PUBLIC EVENT LOG</h3>
        <span className={s.panelTag}>{sim ? "ILLUSTRATIVE REPLAY" : "RH CHAIN"}</span>
      </header>
      <div className={s.tableWrap}>
        <table className={s.table}>
          <thead>
            <tr>
              <th>TIME</th>
              <th>TYPE</th>
              <th>ENTITY</th>
              <th>FLOW</th>
              <th>DEPTH</th>
              <th>INDEX</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((row, i) => (
              <tr key={row.id} data-first={i === 0 ? "" : undefined}>
                <td className={s.dim}>{row.time}</td>
                <td>
                  <span className={s.typeChip} data-type={row.type}>
                    {row.type}
                  </span>
                </td>
                <td>{row.entity}</td>
                <td className={row.flow === "—" ? s.dim : s.flowUp}>{row.flow}</td>
                <td>{row.depth}</td>
                <td className={s.dim}>{row.index}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
});

// ------------------------------------------------------------------ audit

export const HyperMoleAudit = memo(function HyperMoleAudit({
  audit,
  processStep,
}: {
  audit: AuditRow[];
  processStep: number;
}) {
  return (
    <section className={`${s.panel} ${s.auditPanel}`}>
      <header className={s.panelHead}>
        <h3 className={s.panelTitle}>HYPERMOLE AUDIT</h3>
        <span className={s.panelTag}>TIMELINE</span>
      </header>
      <ul className={s.audit}>
        {audit.map((row, i) => (
          <li key={row.id} data-first={i === 0 ? "" : undefined}>
            <i data-type={row.type} />
            <span className={s.auditAt}>{row.at}</span>
            <b data-type={row.type}>{row.type}</b>
            <span className={s.auditText}>{row.text}</span>
          </li>
        ))}
      </ul>
      <div className={s.process}>
        {PROCESS_STEPS.map((label, i) => (
          <div key={label} className={s.processStep} data-active={i === processStep ? "" : undefined}>
            <em>{i + 1}</em>
            {label}
            {i < PROCESS_STEPS.length - 1 ? <span>→</span> : null}
          </div>
        ))}
      </div>
    </section>
  );
});
