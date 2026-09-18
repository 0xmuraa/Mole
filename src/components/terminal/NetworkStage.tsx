"use client";

import { useEffect, useRef, useSyncExternalStore } from "react";
import Image from "next/image";
import styles from "./NetworkStage.module.css";
import { REGION_LABEL, ROLE_COLOR, ROLE_GLYPH } from "@/simulation/config";
import { nodeLabel } from "@/simulation/createNetwork";
import type { SeismicEngine } from "@/simulation/SeismicEngine";
import type { RegionId, Tone } from "@/simulation/types";

const TONE: Record<Tone, string> = {
  cyan: "#4FD9EB",
  amber: "#F2A63B",
  gold: "#FFD36A",
  green: "#78C96B",
  dim: "#C9F3F8",
};

const PACKET_POOL = 18;
const RING_POOL = 6;
const REGIONS: RegionId[] = ["fresh", "smart", "funding", "contracts"];

const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));

// point on the quadratic curve cached in g = [x0,y0,cx,cy,x1,y1]
function curvePoint(g: number[], t: number, out: [number, number]) {
  const u = 1 - t;
  out[0] = u * u * g[0] + 2 * u * t * g[2] + t * t * g[4];
  out[1] = u * u * g[1] + 2 * u * t * g[3] + t * t * g[5];
}

/**
 * The seismic network. React renders the static structure once (and again
 * only when the edge list changes); every animation frame is applied
 * directly to the DOM from a single engine frame callback.
 */
export default function NetworkStage({ engine, compact = false }: { engine: SeismicEngine; compact?: boolean }) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const nodeEls = useRef(new Map<string, SVGGElement>());
  const edgeEls = useRef(new Map<string, SVGPathElement>());
  const packetEls = useRef<(SVGLineElement | null)[]>([]);
  const ringEls = useRef<(SVGCircleElement | null)[]>([]);

  const topology = useSyncExternalStore(
    engine.subscribe,
    () => engine.getSnapshot().topologyVersion,
    () => 0,
  );
  const selectedId = useSyncExternalStore(
    engine.subscribe,
    () => engine.getSnapshot().selection?.id ?? null,
    () => null,
  );

  useEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap) return;
    let w = 0;
    let h = 0;
    const measure = () => {
      const r = wrap.getBoundingClientRect();
      w = r.width;
      h = r.height;
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(wrap);

    const byId = new Map(engine.nodes.map((n) => [n.id, n]));
    const nodeKeys = new Map<string, string>();
    const edgeKeys = new Map<string, string>();
    const head: [number, number] = [0, 0];
    const tail: [number, number] = [0, 0];

    const frame = () => {
      if (!w || !h) return;
      const t = engine.t;
      const cx = w * 0.5;
      const cy = h * 0.5;
      const coreR = w * (compact ? 0.078 : 0.062) + 4;
      const scale = clamp(w / (compact ? 680 : 1040), 0.72, 1.3);

      for (const n of engine.nodes) {
        const el = nodeEls.current.get(n.id);
        if (!el) continue;
        el.setAttribute("transform", `translate(${(n.x * w).toFixed(1)} ${(n.y * h).toFixed(1)}) scale(${scale.toFixed(3)})`);
        const epi = engine.epicenterId === n.id;
        const key = `${+n.dormant}${+(n.activeUntil > t)}${+epi}${+(n.wakeUntil > t)}${+(n.verifiedUntil > t)}`;
        if (nodeKeys.get(n.id) !== key) {
          nodeKeys.set(n.id, key);
          el.toggleAttribute("data-dormant", n.dormant);
          el.toggleAttribute("data-active", n.activeUntil > t);
          el.toggleAttribute("data-epicenter", epi);
          el.toggleAttribute("data-waking", n.wakeUntil > t);
          el.toggleAttribute("data-verified", n.verifiedUntil > t);
          const label = el.querySelector("[data-label]");
          if (label) label.textContent = nodeLabel(n);
        }
      }

      for (const e of engine.edges) {
        const a = byId.get(e.a);
        if (!a) continue;
        const x0 = a.x * w;
        const y0 = a.y * h;
        let x1: number;
        let y1: number;
        if (e.b === "core") {
          const dx = x0 - cx;
          const dy = y0 - cy;
          const len = Math.hypot(dx, dy) || 1;
          x1 = cx + (dx / len) * coreR;
          y1 = cy + (dy / len) * coreR;
        } else {
          const b = byId.get(e.b);
          if (!b) continue;
          x1 = b.x * w;
          y1 = b.y * h;
        }
        const g = e.g;
        g[0] = x0;
        g[1] = y0;
        g[2] = (x0 + x1) / 2 - (y1 - y0) * e.bend;
        g[3] = (y0 + y1) / 2 + (x1 - x0) * e.bend;
        g[4] = x1;
        g[5] = y1;

        const el = edgeEls.current.get(e.id);
        if (!el) continue;
        el.setAttribute("d", `M${x0.toFixed(1)} ${y0.toFixed(1)}Q${g[2].toFixed(1)} ${g[3].toFixed(1)} ${x1.toFixed(1)} ${y1.toFixed(1)}`);
        const dying = e.dieAt > 0 && e.dieAt - t < 0.7;
        const key = `${e.state}${+dying}${e.weight.toFixed(2)}`;
        if (edgeKeys.get(e.id) !== key) {
          edgeKeys.set(e.id, key);
          el.setAttribute("data-state", e.state);
          el.toggleAttribute("data-dying", dying);
          el.style.setProperty("--w", e.weight.toFixed(2));
        }
      }

      for (let i = 0; i < PACKET_POOL; i++) {
        const el = packetEls.current[i];
        if (!el) continue;
        const p = engine.packets[i];
        if (!p || (p.edge.g[0] === 0 && p.edge.g[4] === 0)) {
          if (el.style.opacity !== "0") el.style.opacity = "0";
          continue;
        }
        const pos = p.dir === 1 ? p.t : 1 - p.t;
        curvePoint(p.edge.g, pos, head);
        curvePoint(p.edge.g, clamp(pos - p.dir * 0.075, 0, 1), tail);
        el.setAttribute("x1", tail[0].toFixed(1));
        el.setAttribute("y1", tail[1].toFixed(1));
        el.setAttribute("x2", head[0].toFixed(1));
        el.setAttribute("y2", head[1].toFixed(1));
        el.setAttribute("stroke", TONE[p.tone]);
        el.setAttribute("stroke-width", (2.4 * p.size * scale).toFixed(2));
        el.style.opacity = Math.min(1, Math.sin(Math.PI * p.t) * 1.6).toFixed(2);
      }

      for (let i = 0; i < RING_POOL; i++) {
        const el = ringEls.current[i];
        if (!el) continue;
        const r = engine.rings[i];
        const n = r ? byId.get(r.nodeId) : null;
        if (!r || !n) {
          if (el.style.opacity !== "0") el.style.opacity = "0";
          continue;
        }
        const p = clamp((t - r.start) / r.dur, 0, 1);
        const eased = 1 - (1 - p) * (1 - p);
        el.setAttribute("cx", (n.x * w).toFixed(1));
        el.setAttribute("cy", (n.y * h).toFixed(1));
        el.setAttribute("r", (r.maxR * w * eased + 8).toFixed(1));
        el.setAttribute("stroke", TONE[r.tone]);
        el.style.opacity = ((1 - p) * 0.85).toFixed(2);
      }

      if (svgRef.current && !svgRef.current.hasAttribute("data-ready")) svgRef.current.setAttribute("data-ready", "");
    };

    const off = engine.onFrame(frame);
    return () => {
      off();
      ro.disconnect();
    };
  }, [engine, compact]);

  // selection: dim everything that is not related to the selected node
  useEffect(() => {
    const related = new Set<string>();
    if (selectedId) {
      related.add(selectedId);
      for (const e of engine.edges) {
        if (e.a === selectedId || e.b === selectedId) {
          related.add(e.id);
          related.add(e.a);
          related.add(e.b);
        }
      }
    }
    edgeEls.current.forEach((el, id) => el.toggleAttribute("data-rel", related.has(id)));
    nodeEls.current.forEach((el, id) => el.toggleAttribute("data-rel", related.has(id)));
  }, [engine, selectedId, topology]);

  const edges = engine.edges;

  return (
    <div
      ref={wrapRef}
      className={`${styles.stage} ${compact ? styles.compact : ""}`}
      onClick={() => selectedId && engine.select(null)}
    >
      <svg ref={svgRef} className={styles.svg} data-selection={selectedId ? "" : undefined} aria-label="Seismic network simulation" role="img">
        <g>
          {edges.map((e) => (
            <path
              key={e.id}
              ref={(el) => {
                if (el) edgeEls.current.set(e.id, el);
                else edgeEls.current.delete(e.id);
              }}
              className={styles.edge}
              data-kind={e.kind}
              data-state="idle"
            />
          ))}
        </g>
        <g>
          {Array.from({ length: RING_POOL }, (_, i) => (
            <circle
              key={i}
              ref={(el) => {
                ringEls.current[i] = el;
              }}
              className={styles.pulse}
            />
          ))}
        </g>
        <g>
          {Array.from({ length: PACKET_POOL }, (_, i) => (
            <line
              key={i}
              ref={(el) => {
                packetEls.current[i] = el;
              }}
              className={styles.packet}
            />
          ))}
        </g>
        <g>
          {engine.nodes.map((n) => (
            <g
              key={n.id}
              ref={(el) => {
                if (el) nodeEls.current.set(n.id, el);
                else nodeEls.current.delete(n.id);
              }}
              className={styles.node}
              style={{ "--c": ROLE_COLOR[n.role] } as React.CSSProperties}
              data-dormant={n.dormant ? "" : undefined}
              onClick={(ev) => {
                ev.stopPropagation();
                engine.select(n.id);
              }}
            >
              <g className={styles.nodeBody}>
                <circle className={styles.halo} r={27} />
                <circle className={styles.epiRing} r={31} />
                <circle className={styles.ring} r={17} />
                <circle className={styles.nodeCore} r={12.5} />
                <text className={styles.glyph} dy="0.36em">
                  {ROLE_GLYPH[n.role]}
                </text>
                <circle className={styles.light} cx={13.5} cy={-13.5} r={3} />
                <text className={styles.epiLabel} y={-39}>
                  EPICENTER
                </text>
                <text className={styles.label} y={33} data-label>
                  {nodeLabel(n)}
                </text>
              </g>
            </g>
          ))}
        </g>
      </svg>

      {REGIONS.map((r) => (
        <span key={r} className={`${styles.region} ${styles[r]}`}>
          {REGION_LABEL[r]}
        </span>
      ))}

      <div className={styles.core} aria-hidden>
        <span className={styles.coreSweep} />
        <span className={styles.coreRing} />
        <div className={styles.coreDisc}>
          <Image src="/assets/mole-avatar.png" alt="" fill sizes="140px" className={`${styles.coreImg} pixelSharp`} />
        </div>
        <div className={styles.coreText}>
          <b>HYPERMOLE</b>
          <i>SEISMIC CORE</i>
        </div>
      </div>
    </div>
  );
}
