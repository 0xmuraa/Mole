import type { RegionId, Role } from "./types";

export const ROLE_COLOR: Record<Role, string> = {
  WALLET: "#4FD9EB",
  FRESH: "#8BEAF5",
  FLOW: "#F2A63B",
  TRACE: "#5B9DFF",
  VERIFY: "#78C96B",
  CONTRACT: "#9B8CE0",
  WAKE: "#FFD36A",
  CLUSTER: "#D79AD0",
};

export const ROLE_GLYPH: Record<Role, string> = {
  WALLET: "WL",
  FRESH: "FR",
  FLOW: "FL",
  TRACE: "TR",
  VERIFY: "VF",
  CONTRACT: "CT",
  WAKE: "WK",
  CLUSTER: "CL",
};

export const REGION_LABEL: Record<RegionId, string> = {
  fresh: "FRESH WALLETS",
  smart: "SMART CLUSTERS",
  funding: "FUNDING",
  contracts: "CONTRACTS",
};

// Seconds between events, [min, max]. Guides, not rigid timers — every
// interval is re-rolled after each firing so the terminal never loops.
export const TIMING = {
  log: [0.6, 1.4],
  audit: [0.5, 1.5],
  verify: [1.0, 3.0],
  trace: [1.0, 3.0],
  flow: [1.5, 3.5],
  wake: [2.5, 5.0],
  minor: [2.0, 5.0],
  tremor: [4.0, 8.0],
  converge: [6.0, 12.0],
  migrate: [5.0, 12.0],
  dormancy: [6.0, 10.0],
} as const;

export type TimerKind = keyof typeof TIMING;

// First firing after load — tuned so the screen is busy within ~3 seconds.
export const FIRST_FIRE: Record<TimerKind, number> = {
  audit: 0.4,
  log: 0.5,
  trace: 0.9,
  wake: 1.2,
  verify: 1.4,
  minor: 1.6,
  flow: 1.9,
  tremor: 2.6,
  migrate: 5.0,
  converge: 6.5,
  dormancy: 9.0,
};

export const BASE = { magnitude: 4.2, convergence: 46, speed: 14 };

export const RANGE = {
  magnitude: [3.0, 8.9],
  convergence: [20, 95],
  speed: [6, 48],
  score: [64, 94],
} as const;

export const CHART = { points: 120, sampleEvery: 0.25 };

export const FINDINGS = [
  "Dormant wallets waking",
  "Independent routes expanding",
  "Cross-cluster flow increasing",
  "New contract interaction detected",
  "Convergence accelerating",
];

export const PROCESS_STEPS = ["MONITOR", "TRACE", "DETECT", "SURFACE"];
