"use client";

import { useRef, useSyncExternalStore } from "react";
import Image from "next/image";
import Link from "next/link";
import s from "./terminal.module.css";
import NetworkStage from "./NetworkStage";
import { EntityDossier, HyperMoleAudit, PublicEventLog, RouteFlow, SurfaceActivity } from "./panels";
import { useEngineSnapshot, useSeismicEngine } from "@/simulation/useSeismicEngine";
import { DEMO_TARGET } from "@/simulation/generators";

const noopSubscribe = () => () => {};
const readRecordingFlag = () => new URLSearchParams(window.location.search).get("recording") === "1";

type Props = {
  /** "page" fills the viewport (/terminal). "embedded" is a fixed-height block for the homepage. */
  variant?: "page" | "embedded";
  /** "simulation" shows DEMO / SIMULATION labels. "public" uses the homepage's public-facing labels. */
  labels?: "simulation" | "public";
};

export default function HyperMoleTerminal({ variant = "page", labels = "simulation" }: Props) {
  const rootRef = useRef<HTMLDivElement>(null);
  const engine = useSeismicEngine({}, rootRef);
  const snap = useEngineSnapshot(engine);
  const recording = useSyncExternalStore(noopSubscribe, readRecordingFlag, () => false);
  const sim = labels === "simulation";
  const m = snap.metrics;

  return (
    <div ref={rootRef} className={`${s.term} ${variant === "embedded" ? s.embedded : ""}`}>
      {/* ---------------------------------------------------- global bar */}
      <header className={s.topBar}>
        <Link href={variant === "embedded" ? "/terminal" : "/"} className={s.brand}>
          <Image src="/assets/mole-avatar.png" alt="" width={34} height={34} priority className={`${s.brandAvatar} pixelSharp`} />
          <b>HYPERMOLE</b>
          <span>/ SEISMIC OBSERVATORY</span>
        </Link>

        <nav className={s.flowNav} aria-label="Pipeline">
          <span>PUBLIC LOGS</span>
          <i>→</i>
          <span>TREMORS</span>
          <i>→</i>
          <span>DECISIONS</span>
        </nav>

        <div className={s.status}>
          <span className={s.chainPill}>
            RH CHAIN
            <em className={s.scanner} />
          </span>
          <span className={s.modePill}>{sim ? "DEMO MODE" : "SEISMIC LIVE"}</span>
          {!recording && (
            <button
              type="button"
              className={s.pauseBtn}
              onClick={() => engine.setPaused(!snap.paused)}
              aria-pressed={snap.paused}
            >
              {snap.paused ? "PAUSED" : "AUTO"}
            </button>
          )}
          <span className={s.online}>
            <i />
            ONLINE
          </span>
          {variant === "embedded" && (
            <Link href="/terminal" className={s.openFull}>
              OPEN FULL ↗
            </Link>
          )}
        </div>
      </header>

      {/* --------------------------------------------------- context bar */}
      <div className={s.contextBar}>
        <div>
          <span>SOURCE</span>
          <b>PUBLIC CHAIN EVENTS</b>
        </div>
        <div>
          <span>ANALYSIS</span>
          <b>WALLET + FLOW + CONTRACT</b>
        </div>
        <div className={s.counters}>
          <span>NODES</span>
          <b>{m.activeNodes} ACTIVE</b>
          <span>TRACES</span>
          <b>{m.traces}</b>
          <span>TREMORS</span>
          <b>{m.tremorsActive} ACTIVE</b>
        </div>
        <div>
          <span>MODE</span>
          <b className={s.amber}>{sim ? "ILLUSTRATIVE SIMULATION" : "PUBLIC SIGNALS"}</b>
        </div>
        <div>
          <span>NETWORK</span>
          <b className={s.amber}>RH CHAIN</b>
        </div>
      </div>

      {/* ---------------------------------------------------------- main */}
      <div className={s.main}>
        <div className={s.leftCol}>
          <EntityDossier
            metrics={m}
            findingIndex={snap.findingIndex}
            selection={snap.selection}
            sim={sim}
            epicenterLabel={snap.epicenterLabel}
            epicenterAddr={snap.epicenterAddr}
            onClear={() => engine.select(null)}
          />
          <RouteFlow metrics={m} routes={snap.routes} />
        </div>

        <section className={`${s.panel} ${s.networkPanel}`}>
          <header className={s.panelHead}>
            <h3 className={s.panelTitle}>SEISMIC NETWORK</h3>
            <span className={s.panelTag}>
              {m.totalNodes} NODES · CONTINUOUS EXCHANGE{sim ? " · SIMULATION" : ""}
            </span>
          </header>
          <div className={s.stageWrap}>
            <NetworkStage engine={engine} />
          </div>
          <footer className={s.legend}>
            <span data-k="idle">IDLE</span>
            <span data-k="trace">TRACE</span>
            <span data-k="flow">FLOW</span>
            <span data-k="converging">CONVERGING</span>
            <span data-k="verified">VERIFIED</span>
            <b>
              TARGET <em>{DEMO_TARGET.ticker}</em> · EPICENTER <em>{snap.epicenterLabel ?? "SCANNING…"}</em>
            </b>
          </footer>
        </section>

        <SurfaceActivity engine={engine} metrics={m} chart={snap.chart} history={snap.history} sim={sim} />
      </div>

      {/* -------------------------------------------------------- bottom */}
      <div className={s.bottom}>
        <PublicEventLog logs={snap.logs} sim={sim} />
        <HyperMoleAudit audit={snap.audit} processStep={snap.processStep} />
      </div>

      {/* --------------------------------------------------------- strip */}
      {variant === "page" && (
        <footer className={s.strip}>
          <span className={s.stripLeft}>
            {sim ? "DEMO MODE" : "SEISMIC LIVE"} <i>·</i> NO PRICE SIGNAL <i>·</i> NO TRANSACTION PATH
          </span>
          <span className={s.stripMid}>
            {sim
              ? "HYPERMOLE maps simulated chain activity for product preview."
              : "HYPERMOLE maps public chain activity. It never touches it."}
          </span>
          <span className={s.stripRight}>
            <b>hypermole</b>
            <em>RH CHAIN</em>
          </span>
        </footer>
      )}
    </div>
  );
}
