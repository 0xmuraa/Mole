import { BASE, CHART, FIRST_FIRE, RANGE, REGION_LABEL, TIMING, type TimerKind } from "./config";
import { createNetwork, makeEdge, nodeLabel } from "./createNetwork";
import { AUDIT_TEXT, DEMO_ENTITY, clamp, clockTime, demoWalletId, flowValue, pick, rand, randInt } from "./generators";
import type {
  AuditRow,
  AuditType,
  EdgeState,
  EngineOptions,
  HistoryRow,
  LogRow,
  LogType,
  Packet,
  RegionId,
  Ring,
  RouteRow,
  SimEdge,
  SimNode,
  Snapshot,
  Tone,
} from "./types";

const LOG_ROWS = 6;
const AUDIT_ROWS = 6;
const MAX_PACKETS = 18;

const STATE_TONE: Record<EdgeState, Tone> = {
  idle: "dim",
  trace: "cyan",
  flow: "amber",
  converging: "gold",
  verified: "green",
};

function initialChart(): number[] {
  // deterministic so server and client render the same first frame
  return Array.from({ length: CHART.points }, (_, i) => BASE.magnitude + Math.sin(i * 0.21) * 0.35 + Math.sin(i * 0.053) * 0.5);
}

/**
 * One engine owns the whole simulation: network, packets, rings, metrics,
 * chart, logs, audit and tremor history. Every event type mutates several of
 * those together, so the UI reads as one causally-connected system.
 *
 * Two output channels:
 *  - frame listeners (every animation frame) for the imperative network/chart layers
 *  - an immutable snapshot (a few times per second) for React panels
 */
export class SeismicEngine {
  readonly nodes: SimNode[];
  edges: SimEdge[];
  packets: Packet[] = [];
  rings: Ring[] = [];
  readonly compact: boolean;

  t = 0;
  speed = 1;
  reduced = false;
  visible = true;
  epicenterId: string | null = null;
  sampleProgress = 0;

  private paused = false;
  private started = false;
  private lastNow = 0;
  private epicenterUntil = 0;

  private mag = BASE.magnitude;
  private magTarget = BASE.magnitude;
  private conv = BASE.convergence;
  private convTarget = BASE.convergence;
  private spd = BASE.speed;
  private spdTarget = BASE.speed;
  private score = 68;

  private next = { ...FIRST_FIRE };
  private queue: { at: number; fn: () => void }[] = [];
  private lastSample = 0;
  private lastLogAt = -10;
  private lastAuditAt = -10;
  private lastProcessAt = 0;
  private rowId = 0;
  private logIndex = 140;
  private tremorNo = 42;
  private chartSeq = 0;

  private nodeById = new Map<string, SimNode>();
  private listeners = new Set<() => void>();
  private frameListeners = new Set<() => void>();
  private pending: Partial<Snapshot> | null = null;
  private snapshot: Snapshot;

  constructor(options: EngineOptions = {}) {
    this.compact = !!options.compact;
    const { nodes, edges } = createNetwork(this.compact);
    this.nodes = nodes;
    this.edges = edges;
    nodes.forEach((n) => this.nodeById.set(n.id, n));

    this.snapshot = {
      metrics: {
        score: 68,
        scoreState: "ACTIVE",
        magnitude: BASE.magnitude,
        magDelta: 0,
        convergence: BASE.convergence,
        activitySpeed: BASE.speed,
        activeRoutes: 6,
        activeNodes: nodes.filter((n) => !n.dormant).length,
        totalNodes: nodes.length,
        traces: 4,
        tremorsActive: 1,
        routesIndependent: 2,
        routesShared: 3,
        routesCross: 1,
      },
      chart: { points: initialChart(), seq: 0, markers: [] },
      logs: [],
      audit: [],
      history: [
        { id: "#042", state: "BUILDING", magnitude: 6.8 },
        { id: "#041", state: "AFTERSHOCK", magnitude: 5.1 },
        { id: "#040", state: "COOLING", magnitude: 4.3 },
      ],
      routes: [],
      findingIndex: 0,
      processStep: 0,
      topologyVersion: 0,
      selection: null,
      epicenterLabel: null,
      paused: false,
    };
  }

  // ---------------------------------------------------------------- store

  subscribe = (cb: () => void) => {
    this.listeners.add(cb);
    return () => {
      this.listeners.delete(cb);
    };
  };

  getSnapshot = () => this.snapshot;

  onFrame(cb: () => void) {
    this.frameListeners.add(cb);
    return () => {
      this.frameListeners.delete(cb);
    };
  }

  private commit(partial: Partial<Snapshot>) {
    this.pending = { ...(this.pending ?? {}), ...partial };
  }

  private flush() {
    if (!this.pending) return;
    this.snapshot = { ...this.snapshot, ...this.pending };
    this.pending = null;
    this.listeners.forEach((l) => l());
  }

  // ------------------------------------------------------------- controls

  configure(opts: { speed?: number; reduced?: boolean }) {
    if (opts.speed && Number.isFinite(opts.speed)) this.speed = clamp(opts.speed, 0.25, 3);
    if (typeof opts.reduced === "boolean") this.reduced = opts.reduced;
  }

  start() {
    if (this.started) return;
    this.started = true;
    // Seed the tables on the client so the first paint is already populated.
    (["TRACE", "FLOW", "VERIFY", "WAKE", "TRACE"] as LogType[]).forEach((type) => this.pushLog(type, true));
    (["SCAN", "TRACE", "VERIFY", "FLOW"] as AuditType[]).forEach((type) => this.pushAudit(type, pick(AUDIT_TEXT[type]), true));
    this.pushRoute("TRACE", this.nodes[0].id, this.nodes[2].id);
    this.pushRoute("FLOW", this.nodes[4].id, "core");
    this.pushRoute("TRACE", this.nodes[6].id, this.nodes[7].id);
    this.flush();
  }

  setPaused(paused: boolean) {
    this.paused = paused;
    this.commit({ paused });
    this.flush();
  }

  select(id: string | null) {
    const node = id ? this.nodeById.get(id) : null;
    if (!node || this.snapshot.selection?.id === id) {
      this.commit({ selection: null });
    } else {
      this.commit({
        selection: {
          id: node.id,
          label: nodeLabel(node),
          region: REGION_LABEL[node.region],
          role: node.role,
          links: this.edgesOf(node.id).length,
          dormant: node.dormant,
        },
      });
    }
    this.flush();
  }

  // ------------------------------------------------------------ main loop

  tick(now: number) {
    if (!this.lastNow) this.lastNow = now;
    let dt = (now - this.lastNow) / 1000;
    this.lastNow = now;
    if (!this.started || !this.visible) return;
    if (this.paused) dt = 0;

    // Stay on the wall clock even when frames are dropped (busy machine,
    // screen recording, throttled tab): catch up in fixed 50ms slices instead
    // of letting simulation time slow down. Long stalls are capped at 0.5s.
    let remaining = Math.min(dt, 0.5) * this.speed;
    const advanced = remaining > 0;
    while (remaining > 0) {
      const step = Math.min(remaining, 0.05);
      remaining -= step;
      this.t += step;
      this.runQueue();
      this.runTimers();
      this.updateDynamics(step);
      this.updateNodes(step);
      this.updateEdges();
      this.updatePackets(step);
      this.sample();
    }
    if (advanced) {
      this.rings = this.rings.filter((r) => this.t - r.start < r.dur);
      this.flush();
    }
    this.frameListeners.forEach((l) => l());
  }

  private runQueue() {
    if (!this.queue.length) return;
    const due = this.queue.filter((q) => q.at <= this.t);
    if (!due.length) return;
    this.queue = this.queue.filter((q) => q.at > this.t);
    due.forEach((q) => q.fn());
  }

  private later(delay: number, fn: () => void) {
    this.queue.push({ at: this.t + delay, fn });
  }

  private runTimers() {
    const fire: Record<TimerKind, () => void> = {
      log: () => this.pumpLog(),
      audit: () => this.pumpAudit(),
      verify: () => this.verifyEvent(),
      trace: () => this.traceEvent(),
      flow: () => this.flowEvent(),
      wake: () => this.wakeEvent(),
      minor: () => this.minorTremor(),
      tremor: () => this.tremorEvent(),
      converge: () => this.convergenceEvent(),
      migrate: () => this.migrationEvent(),
      dormancy: () => this.dormancyEvent(),
    };
    (Object.keys(fire) as TimerKind[]).forEach((kind) => {
      if (this.t < this.next[kind]) return;
      const [min, max] = TIMING[kind];
      this.next[kind] = this.t + rand(min, max);
      fire[kind]();
    });

    // keep the process bar visibly progressing even in quiet moments
    if (this.t - this.lastProcessAt > 1.7) this.setProcess((this.snapshot.processStep + 1) % 4);
  }

  private updateDynamics(dt: number) {
    const approach = (v: number, target: number, k: number) => v + (target - v) * Math.min(1, k * dt);

    this.magTarget = clamp(approach(this.magTarget, BASE.magnitude, 0.3), RANGE.magnitude[0], RANGE.magnitude[1]);
    this.mag = approach(this.mag, this.magTarget, 5);
    this.convTarget = clamp(approach(this.convTarget, BASE.convergence, 0.16), RANGE.convergence[0], RANGE.convergence[1]);
    this.conv = approach(this.conv, this.convTarget, 3);
    this.spdTarget = clamp(approach(this.spdTarget, BASE.speed, 0.12), RANGE.speed[0], RANGE.speed[1]);
    this.spd = approach(this.spd, this.spdTarget, 2.5);

    const scoreTarget = clamp(36 + this.mag * 4.4 + this.conv * 0.28, RANGE.score[0], RANGE.score[1]);
    this.score = approach(this.score, scoreTarget, 1.1);

    if (this.epicenterId && this.t > this.epicenterUntil) {
      this.epicenterId = null;
      this.commit({ epicenterLabel: null });
    }
  }

  private updateNodes(dt: number) {
    const t = this.t;
    const still = this.reduced;
    for (const n of this.nodes) {
      const rp = n.region.length; // cheap stable per-region phase
      const rx = still ? 0 : Math.sin(t * 0.23 + rp) * 0.008;
      const ry = still ? 0 : Math.cos(t * 0.19 + rp * 1.7) * 0.011;
      const dx = still ? 0 : Math.sin(t * n.fx + n.px) * n.ax + Math.sin(t * n.fx * 0.37 + n.py) * n.ax * 0.6;
      const dy = still ? 0 : Math.cos(t * n.fy + n.py) * n.ay + Math.sin(t * n.fy * 0.41 + n.px) * n.ay * 0.5;
      n.mx += (n.mtx - n.mx) * Math.min(1, dt * 2.2);
      n.my += (n.mty - n.my) * Math.min(1, dt * 2.2);
      n.x = n.bx + rx + dx + n.mx;
      n.y = n.by + ry + dy + n.my;
    }
  }

  private updateEdges() {
    let topologyChanged = false;
    for (const e of this.edges) {
      if (e.state !== "idle" && this.t > e.stateUntil) e.state = "idle";
      if (e.dieAt && this.t > e.dieAt) topologyChanged = true;
    }
    if (topologyChanged) {
      this.edges = this.edges.filter((e) => !e.dieAt || this.t <= e.dieAt);
      this.packets = this.packets.filter((p) => this.edges.includes(p.edge));
      this.commit({ topologyVersion: this.snapshot.topologyVersion + 1 });
    }
  }

  private updatePackets(dt: number) {
    for (const p of this.packets) p.t += dt / p.dur;
    this.packets = this.packets.filter((p) => p.t < 1);

    // ambient traffic: there are always several packets in flight
    const busy = clamp((this.spd - BASE.speed) / 20, 0, 1);
    const target = this.reduced ? 3 : Math.round(7 + busy * 4);
    if (this.packets.length < target && Math.random() < 0.55) {
      const active = this.edges.filter((e) => e.state !== "idle");
      const edge = active.length && Math.random() < 0.6 ? pick(active) : pick(this.edges);
      this.spawnPacket(edge);
    }
  }

  private sample() {
    const elapsed = this.t - this.lastSample;
    this.sampleProgress = clamp(elapsed / CHART.sampleEvery, 0, 1);
    if (elapsed < CHART.sampleEvery) return;
    this.lastSample = this.t;
    this.sampleProgress = 0;
    this.chartSeq += 1;

    const value = clamp(this.mag + Math.sin(this.t * 2.1) * 0.12 + rand(-0.12, 0.12), 0.4, 9.6);
    const prev = this.snapshot.chart;
    const points = [...prev.points.slice(1), value];
    const markers = prev.markers.filter((m) => m.seq > this.chartSeq - CHART.points);

    const activeEdges = this.edges.filter((e) => e.state !== "idle");
    const scoreTarget = 36 + this.mag * 4.4 + this.conv * 0.28;
    this.commit({
      chart: { points, seq: this.chartSeq, markers },
      metrics: {
        score: Math.round(this.score),
        scoreState: scoreTarget - this.score > 1.5 ? "BUILDING" : this.score - scoreTarget > 1.5 ? "COOLING" : "ACTIVE",
        magnitude: value,
        magDelta: value - points[points.length - 9],
        convergence: Math.round(this.conv),
        activitySpeed: Math.round(this.spd),
        activeRoutes: 3 + activeEdges.length,
        activeNodes: this.nodes.filter((n) => !n.dormant).length,
        totalNodes: this.nodes.length,
        traces: 2 + activeEdges.filter((e) => e.state === "trace").length,
        tremorsActive: this.snapshot.history.filter((h) => h.state === "BUILDING" || h.state === "ACTIVE").length,
        routesIndependent: 1 + activeEdges.filter((e) => e.kind === "temp" || e.kind === "core").length,
        routesShared: 1 + activeEdges.filter((e) => e.kind === "local").length,
        routesCross: 1 + activeEdges.filter((e) => e.kind === "bridge").length,
      },
    });
  }

  // -------------------------------------------------------------- helpers

  private awake(exclude?: string) {
    const list = this.nodes.filter((n) => !n.dormant && n.id !== exclude);
    return list.length ? list : this.nodes;
  }

  private edgesOf(id: string) {
    return this.edges.filter((e) => e.a === id || e.b === id);
  }

  private other(edge: SimEdge, id: string) {
    return edge.a === id ? edge.b : edge.a;
  }

  private setEdge(edge: SimEdge, state: EdgeState, dur: number) {
    edge.state = state;
    edge.stateUntil = this.t + dur;
  }

  private spawnPacket(edge: SimEdge, toward?: string, tone?: Tone) {
    if (this.packets.length >= MAX_PACKETS) return;
    const dir: 1 | -1 = toward ? (edge.b === toward ? 1 : -1) : Math.random() > 0.5 ? 1 : -1;
    this.packets.push({
      edge,
      t: 0,
      dur: rand(0.45, 1.6),
      dir,
      size: rand(0.8, 1.35),
      tone: tone ?? STATE_TONE[edge.state],
    });
  }

  private burst(edge: SimEdge, count: number, toward?: string, tone?: Tone) {
    for (let i = 0; i < count; i++) this.later(i * 0.16, () => this.edges.includes(edge) && this.spawnPacket(edge, toward, tone));
  }

  private ring(nodeId: string, maxR: number, dur: number, tone: Tone, delay = 0) {
    if (this.reduced && delay > 0) return;
    const add = () => this.rings.push({ nodeId, start: this.t, dur, maxR, tone });
    if (delay) this.later(delay, add);
    else add();
  }

  private tempEdge(a: string, b: string, ttl: number) {
    const existing = this.edges.find((e) => (e.a === a && e.b === b) || (e.a === b && e.b === a));
    if (existing) return existing;
    const edge = makeEdge(a, b, "temp", (Math.random() > 0.5 ? 1 : -1) * rand(0.08, 0.2), 0.75, this.t, ttl);
    this.edges = [...this.edges, edge];
    this.commit({ topologyVersion: this.snapshot.topologyVersion + 1 });
    return edge;
  }

  private nearest(node: SimNode, filter: (n: SimNode) => boolean) {
    let best: SimNode | null = null;
    let bestD = Infinity;
    for (const n of this.nodes) {
      if (n.id === node.id || !filter(n)) continue;
      const d = (n.bx - node.bx) ** 2 + (n.by - node.by) ** 2;
      if (d < bestD) {
        bestD = d;
        best = n;
      }
    }
    return best;
  }

  private setEpicenter(node: SimNode, dur: number) {
    this.epicenterId = node.id;
    this.epicenterUntil = this.t + dur;
    this.commit({ epicenterLabel: nodeLabel(node) });
  }

  private setProcess(step: number) {
    this.lastProcessAt = this.t;
    if (this.snapshot.processStep !== step && this.pending?.processStep !== step) this.commit({ processStep: step });
  }

  private setFinding(index: number) {
    this.commit({ findingIndex: index });
  }

  private mark(tone: Tone) {
    const chart = this.pending?.chart ?? this.snapshot.chart;
    if (chart.markers.some((m) => m.seq === this.chartSeq + 1)) return;
    this.commit({ chart: { ...chart, markers: [...chart.markers, { seq: this.chartSeq + 1, tone }] } });
  }

  private pushLog(type: LogType, force = false, flow?: string) {
    if (!force && this.t - this.lastLogAt < 0.72) return;
    this.lastLogAt = this.t;
    this.logIndex += randInt(5, 9);
    const row: LogRow = {
      id: ++this.rowId,
      time: clockTime(),
      type,
      entity: type === "CONTRACT" ? DEMO_ENTITY : demoWalletId(),
      flow: flow ?? (type === "VERIFY" || type === "CONTRACT" ? "—" : flowValue()),
      depth: randInt(1, 5),
      index: this.logIndex,
    };
    const logs = this.pending?.logs ?? this.snapshot.logs;
    this.commit({ logs: [row, ...logs].slice(0, LOG_ROWS) });
  }

  private pushAudit(type: AuditType, text: string, force = false) {
    if (!force && this.t - this.lastAuditAt < 0.62) return;
    this.lastAuditAt = this.t;
    const row: AuditRow = { id: ++this.rowId, at: `${this.t.toFixed(1).padStart(5, "0")}s`, type, text };
    const audit = this.pending?.audit ?? this.snapshot.audit;
    this.commit({ audit: [row, ...audit].slice(0, AUDIT_ROWS) });
  }

  private pushHistory(magnitude: number) {
    this.tremorNo += 1;
    const aged = (this.pending?.history ?? this.snapshot.history).map<HistoryRow>((h, i) =>
      i === 0 ? { ...h, state: h.state === "AFTERSHOCK" ? "AFTERSHOCK" : "ACTIVE" } : { ...h, state: "COOLING" },
    );
    const row: HistoryRow = { id: `#${String(this.tremorNo).padStart(3, "0")}`, state: "BUILDING", magnitude };
    this.commit({ history: [row, ...aged].slice(0, 3) });
  }

  private pushRoute(kind: RouteRow["kind"], fromId: string, toId: string) {
    const name = (id: string) => {
      const n = this.nodeById.get(id);
      return n ? nodeLabel(n) : "CORE";
    };
    const row: RouteRow = { id: ++this.rowId, kind, from: name(fromId), to: name(toId) };
    const routes = this.pending?.routes ?? this.snapshot.routes;
    this.commit({ routes: [row, ...routes].slice(0, 4) });
  }

  private setTopHistory(state: HistoryRow["state"]) {
    const history = this.pending?.history ?? this.snapshot.history;
    if (!history.length) return;
    this.commit({ history: [{ ...history[0], state }, ...history.slice(1)] });
  }

  // --------------------------------------------------------------- events

  private pumpLog() {
    if (this.t - this.lastLogAt < 0.55) return;
    this.pushLog(pick<LogType>(["TRACE", "FLOW", "VERIFY", "CONTRACT", "TRACE", "FLOW"]), true);
    this.setProcess(0);
  }

  private pumpAudit() {
    if (this.t - this.lastAuditAt < 0.45) return;
    this.pushAudit("SCAN", pick(AUDIT_TEXT.SCAN));
  }

  private verifyEvent() {
    const node = pick(this.awake());
    node.verifiedUntil = this.t + 1.6;
    node.activeUntil = this.t + 1.2;
    const edges = this.edgesOf(node.id);
    if (edges.length) {
      const edge = pick(edges);
      this.setEdge(edge, "verified", 1.8);
      this.spawnPacket(edge, undefined, "green");
    }
    this.pushAudit("VERIFY", `${pick(AUDIT_TEXT.VERIFY)} · ${nodeLabel(node)}`);
    this.pushLog(Math.random() < 0.35 ? "CONTRACT" : "VERIFY");
    this.setFinding(3);
    this.setProcess(3);
  }

  private traceEvent() {
    const from = pick(this.awake());
    let edge: SimEdge | undefined;
    if (!this.reduced && Math.random() < 0.4) {
      const to = pick(this.awake(from.id));
      edge = this.tempEdge(from.id, to.id, rand(4, 7));
    } else {
      const idle = this.edgesOf(from.id).filter((e) => e.state === "idle");
      edge = idle.length ? pick(idle) : pick(this.edges);
    }
    this.setEdge(edge, "trace", rand(1.6, 2.4));
    this.burst(edge, randInt(2, 3), undefined, "cyan");
    from.activeUntil = this.t + 1.4;
    this.pushRoute("TRACE", edge.a, edge.b);
    this.pushAudit("TRACE", `${pick(AUDIT_TEXT.TRACE)} · ${nodeLabel(from)}`);
    this.pushLog("TRACE");
    this.setFinding(1);
    this.setProcess(1);
  }

  private flowEvent() {
    const candidates = this.edges.filter((e) => (e.kind === "bridge" || e.kind === "core") && e.state === "idle");
    const edge = candidates.length ? pick(candidates) : pick(this.edges);
    this.setEdge(edge, "flow", rand(2, 3));
    this.burst(edge, 3, undefined, "amber");
    this.spdTarget += rand(6, 12);
    const a = this.nodeById.get(edge.a);
    if (a) a.activeUntil = this.t + 1.6;
    this.pushRoute("FLOW", edge.a, edge.b);
    this.pushAudit("FLOW", pick(AUDIT_TEXT.FLOW));
    this.pushLog("FLOW");
    this.setFinding(2);
    this.setProcess(1);
  }

  private wakeEvent() {
    const dormant = this.nodes.filter((n) => n.dormant);
    const node = dormant.length ? pick(dormant) : pick(this.nodes.filter((n) => n.role === "WAKE").concat(this.awake()));
    node.dormant = false;
    node.wakeUntil = this.t + 1.4;
    node.activeUntil = this.t + 2.2;
    this.ring(node.id, 0.05, 0.6, "cyan");
    const partner = this.nearest(node, (n) => !n.dormant);
    if (partner && !this.reduced) {
      const edge = this.tempEdge(node.id, partner.id, rand(4.5, 6.5));
      this.setEdge(edge, "trace", 2.2);
      this.later(0.35, () => this.edges.includes(edge) && this.spawnPacket(edge, partner.id, "cyan"));
    }
    this.pushAudit("WAKE", `${pick(AUDIT_TEXT.WAKE)} · ${nodeLabel(node)}`);
    this.pushLog("WAKE");
    this.setFinding(0);
  }

  private dormancyEvent() {
    const candidates = this.nodes.filter(
      (n) => n.role === "WAKE" && !n.dormant && n.id !== this.epicenterId && this.t - n.wakeUntil > 5,
    );
    if (candidates.length) pick(candidates).dormant = true;
  }

  private minorTremor() {
    const node = pick(this.awake());
    this.ring(node.id, 0.07, 0.7, "cyan");
    node.activeUntil = this.t + 1.2;
    this.magTarget += rand(0.15, 0.4);
    const edges = this.edgesOf(node.id);
    if (edges.length) {
      const edge = pick(edges);
      this.setEdge(edge, "trace", 1.2);
      this.spawnPacket(edge, undefined, "cyan");
    }
    if (Math.random() < 0.6) this.pushAudit("TREMOR", `Minor tremor near ${nodeLabel(node)}`);
    this.setProcess(2);
  }

  private tremorEvent() {
    const node = pick(this.awake(this.epicenterId ?? undefined));
    const claims = !this.epicenterId && Math.random() < 0.55;
    if (claims) this.setEpicenter(node, rand(4, 7));
    this.ring(node.id, 0.16, 0.9, "gold");
    this.ring(node.id, 0.11, 0.7, "cyan", 0.18);

    const edges = this.edgesOf(node.id).slice(0, 5);
    edges.forEach((edge, i) => {
      this.setEdge(edge, "flow", 2.4);
      const otherId = this.other(edge, node.id);
      this.burst(edge, 2, i % 2 ? node.id : otherId, i % 2 ? "gold" : "amber");
      const neighbor = this.nodeById.get(otherId);
      if (neighbor) neighbor.activeUntil = this.t + 2;
    });
    node.activeUntil = this.t + 3;

    this.magTarget += rand(1.2, 2.4);
    this.convTarget += rand(2, 5);
    this.spdTarget += rand(5, 10);
    const reading = clamp(this.magTarget, RANGE.magnitude[0], RANGE.magnitude[1]);

    this.mark("cyan");
    this.pushHistory(reading);
    this.pushAudit("TREMOR", `Magnitude increased to ${reading.toFixed(1)}`, true);
    if (claims) this.later(0.35, () => this.pushAudit("EPICENTER", `${pick(AUDIT_TEXT.EPICENTER)} · ${nodeLabel(node)}`, true));
    this.pushLog("TREMOR", true, `+${reading.toFixed(1)}`);
    this.setFinding(4);
    this.setProcess(2);
    this.later(0.6, () => this.setProcess(3));

    if (Math.random() < 0.5) this.later(rand(1, 3), () => this.aftershockEvent(node));
  }

  private aftershockEvent(origin: SimNode) {
    const neighborIds = this.edgesOf(origin.id)
      .map((e) => this.other(e, origin.id))
      .filter((id) => id !== "core");
    const node = (neighborIds.length && this.nodeById.get(pick(neighborIds))) || pick(this.awake(origin.id));
    this.ring(node.id, 0.08, 0.6, "cyan");
    node.activeUntil = this.t + 1.8;

    const count = this.reduced ? 0 : randInt(1, 2);
    for (let i = 0; i < count; i++) {
      const to = pick(this.awake(node.id));
      const edge = this.tempEdge(node.id, to.id, rand(3.5, 5.5));
      this.setEdge(edge, "trace", 2);
      this.burst(edge, 2, to.id, "cyan");
    }

    this.magTarget += rand(0.3, 0.6);
    this.mark("cyan");
    this.setTopHistory("AFTERSHOCK");
    this.pushAudit("AFTERSHOCK", `${pick(AUDIT_TEXT.AFTERSHOCK)} · ${nodeLabel(node)}`, true);
    this.pushLog("FLOW");
    this.setProcess(2);
  }

  private convergenceEvent() {
    const target = pick(this.awake(this.epicenterId ?? undefined));
    const pool = this.awake(target.id).filter((n) => n.region !== target.region);
    const sources: SimNode[] = [];
    const want = this.compact ? 3 : randInt(4, 5);
    while (sources.length < want && pool.length) sources.push(pool.splice(Math.floor(Math.random() * pool.length), 1)[0]);
    if (!sources.length) return;

    const dur = rand(2.6, 4);
    const label = nodeLabel(target);
    const edges = sources.map((s) => {
      const edge = this.tempEdge(s.id, target.id, dur + 1.6);
      this.setEdge(edge, "converging", dur);
      // sources lean toward the point of convergence, then relax back
      if (!this.reduced) {
        s.mtx = (target.bx - s.bx) * 0.14;
        s.mty = (target.by - s.by) * 0.14;
        this.later(dur + 0.8, () => {
          s.mtx = 0;
          s.mty = 0;
        });
      }
      s.activeUntil = this.t + dur;
      this.pushRoute("CONVERGE", s.id, target.id);
      return edge;
    });

    // waves of packets streaming into the target for the whole sequence
    const waves = Math.floor(dur / 0.38);
    for (let w = 0; w < waves; w++) {
      this.later(w * 0.38, () => edges.forEach((e) => this.edges.includes(e) && this.spawnPacket(e, target.id, "gold")));
    }

    // convergence climbs in visible steps: e.g. 62 → 71 → 79 → 86
    const start = Math.max(this.conv, rand(44, 60));
    this.conv = start;
    this.convTarget = start;
    for (let k = 1; k <= 4; k++) {
      this.later((dur / 4) * k - 0.2, () => {
        this.convTarget = clamp(this.convTarget + rand(6, 10), 0, RANGE.convergence[1]);
        this.pushAudit("CONVERGE", `Convergence rising · ${Math.round(this.convTarget)}`);
        this.pushLog("CONVERGE");
      });
    }

    target.activeUntil = this.t + dur + 1;
    this.spdTarget += rand(8, 14);
    this.pushAudit("CONVERGE", `${sources.length} independent routes approaching ${label}`, true);
    this.pushLog("CONVERGE", true);
    this.setFinding(4);
    this.setProcess(2);

    this.later(dur * 0.55, () => {
      this.setEpicenter(target, rand(5, 7));
      this.ring(target.id, 0.17, 0.9, "gold");
      this.ring(target.id, 0.1, 0.65, "amber", 0.2);
      this.magTarget += rand(0.6, 1.2);
      this.mark("amber");
      this.pushHistory(clamp(this.magTarget, RANGE.magnitude[0], RANGE.magnitude[1]));
      this.pushAudit("EPICENTER", `${pick(AUDIT_TEXT.EPICENTER)} · ${label}`, true);
      this.setProcess(3);
    });
    this.later(dur + 0.4, () => this.setTopHistory("ACTIVE"));
  }

  private migrationEvent() {
    if (this.reduced) return;
    const movers = this.awake(this.epicenterId ?? undefined).filter((n) => n.mtx === 0 && n.mty === 0);
    if (!movers.length) return;
    const node = pick(movers);
    const regions = (["fresh", "smart", "funding", "contracts"] as RegionId[]).filter((r) => r !== node.region);
    const region = pick(regions);
    const members = this.nodes.filter((n) => n.region === region);
    if (!members.length) return;
    const cx = members.reduce((s, n) => s + n.bx, 0) / members.length;
    const cy = members.reduce((s, n) => s + n.by, 0) / members.length;
    const len = Math.hypot(cx - node.bx, cy - node.by) || 1;
    node.mtx = ((cx - node.bx) / len) * rand(0.03, 0.05);
    node.mty = ((cy - node.by) / len) * rand(0.045, 0.075);

    const partner = this.nearest(node, (n) => n.region === region && !n.dormant);
    const stay = rand(7, 11);
    if (partner) {
      const bridge = this.tempEdge(node.id, partner.id, stay);
      this.setEdge(bridge, "trace", 2.4);
      this.burst(bridge, 2, partner.id, "cyan");
    }
    const weak = this.edgesOf(node.id).find((e) => e.kind === "local");
    const weight = weak?.weight ?? 0;
    if (weak) weak.weight = weight * 0.3;
    this.later(stay, () => {
      node.mtx = 0;
      node.mty = 0;
      if (weak) weak.weight = weight;
    });

    this.pushAudit("TRACE", `${nodeLabel(node)} drifting toward ${REGION_LABEL[region]}`);
    this.pushLog("TRACE");
    this.setFinding(1);
  }
}
