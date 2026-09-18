// Shared types for the HYPERMOLE seismic simulation. Everything produced by
// this engine is illustrative — it never reads a chain or a market.

export type Role =
  | "WALLET"
  | "FRESH"
  | "FLOW"
  | "TRACE"
  | "VERIFY"
  | "CONTRACT"
  | "WAKE"
  | "CLUSTER";

export type RegionId = "fresh" | "smart" | "funding" | "contracts";
export type EdgeState = "idle" | "trace" | "flow" | "converging" | "verified";
export type EdgeKind = "local" | "bridge" | "core" | "temp";
export type Tone = "cyan" | "amber" | "gold" | "green" | "dim";

export interface SimNode {
  id: string;
  role: Role;
  num: number;
  region: RegionId;
  // base + current position, normalized 0..1 inside the stage
  bx: number;
  by: number;
  x: number;
  y: number;
  // drift parameters
  ax: number;
  ay: number;
  fx: number;
  fy: number;
  px: number;
  py: number;
  // migration offset (current) and its target
  mx: number;
  my: number;
  mtx: number;
  mty: number;
  dormant: boolean;
  activeUntil: number;
  wakeUntil: number;
  verifiedUntil: number;
}

export interface SimEdge {
  id: string;
  a: string;
  b: string; // node id or "core"
  bend: number;
  weight: number;
  kind: EdgeKind;
  state: EdgeState;
  stateUntil: number;
  bornAt: number;
  dieAt: number; // 0 = permanent
  g: number[]; // per-frame geometry cache [x0,y0,cx,cy,x1,y1], written by the stage
}

export interface Packet {
  edge: SimEdge;
  t: number;
  dur: number;
  dir: 1 | -1;
  size: number;
  tone: Tone;
}

export interface Ring {
  nodeId: string;
  start: number;
  dur: number;
  maxR: number; // fraction of stage width
  tone: Tone;
}

export type ScoreState = "BUILDING" | "ACTIVE" | "COOLING";

export interface Metrics {
  score: number;
  scoreState: ScoreState;
  magnitude: number;
  magDelta: number;
  convergence: number;
  activitySpeed: number;
  activeRoutes: number;
  activeNodes: number;
  totalNodes: number;
  traces: number;
  tremorsActive: number;
  routesIndependent: number;
  routesShared: number;
  routesCross: number;
}

export interface ChartMarker {
  seq: number;
  tone: Tone;
}

export interface ChartState {
  points: number[];
  seq: number;
  markers: ChartMarker[];
}

export type LogType = "WAKE" | "TRACE" | "FLOW" | "VERIFY" | "CONTRACT" | "TREMOR" | "CONVERGE";

export interface LogRow {
  id: number;
  time: string;
  type: LogType;
  entity: string;
  flow: string;
  depth: number;
  index: number;
}

export type AuditType =
  | "WAKE"
  | "TRACE"
  | "FLOW"
  | "TREMOR"
  | "CONVERGE"
  | "EPICENTER"
  | "AFTERSHOCK"
  | "VERIFY"
  | "SCAN";

export interface AuditRow {
  id: number;
  at: string;
  type: AuditType;
  text: string;
}

export type HistoryState = "BUILDING" | "ACTIVE" | "AFTERSHOCK" | "COOLING";

export interface HistoryRow {
  id: string;
  state: HistoryState;
  magnitude: number;
}

export interface RouteRow {
  id: number;
  kind: "TRACE" | "FLOW" | "CONVERGE";
  from: string;
  to: string;
}

export interface Selection {
  id: string;
  label: string;
  region: string;
  role: Role;
  links: number;
  dormant: boolean;
}

export interface Snapshot {
  metrics: Metrics;
  chart: ChartState;
  logs: LogRow[];
  audit: AuditRow[];
  history: HistoryRow[];
  routes: RouteRow[];
  findingIndex: number;
  processStep: number;
  topologyVersion: number;
  selection: Selection | null;
  epicenterLabel: string | null;
  paused: boolean;
}

export interface EngineOptions {
  compact?: boolean;
}
