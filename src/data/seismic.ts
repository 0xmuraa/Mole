// Illustrative content for the homepage sections (ticker, epicenters, emerging
// activity, tremor telemetry). The terminal itself is driven by src/simulation.

// ---------------------------------------------------------------------------
// Live Flow ticker (simulated)
// ---------------------------------------------------------------------------

export type TickerItem = { symbol: string; value: string; change: number };

export const tickerItems: TickerItem[] = [
  { symbol: "$SDRIFT", value: "$0.0427", change: 6.0 },
  { symbol: "$LREALM", value: "$1.184", change: 2.3 },
  { symbol: "$NEBULA", value: "$0.0091", change: -2.8 },
  { symbol: "$QUARTZ", value: "$0.318", change: 4.1 },
  { symbol: "$FAULT", value: "$0.0022", change: -1.2 },
  { symbol: "$MAGMA", value: "$2.907", change: 9.4 },
  { symbol: "$STRATA", value: "$0.140", change: 0.0 },
  { symbol: "$VECTOR", value: "$0.0563", change: -5.6 },
  { symbol: "$CRUST", value: "$0.771", change: 1.7 },
  { symbol: "$MANTLE", value: "$0.0308", change: 3.3 },
];

// ---------------------------------------------------------------------------
// Epicenters section — three lifecycle states (simulated examples)
// ---------------------------------------------------------------------------

export type EpicenterStatus = "ACTIVE" | "BUILDING" | "COOLING";
export type Confidence = "HIGH" | "MEDIUM" | "LOW";

export type Epicenter = {
  id: string;
  index: string;
  ticker: string;
  name: string;
  status: EpicenterStatus;
  description: string;
  tags: string[];
  magnitude: number;
  convergence: number;
  wallets: number;
  routes: number;
  velocity: number;
  confidence: Confidence;
  heat: number[];
};

export const epicenters: Epicenter[] = [
  {
    id: "ep1",
    index: "#01",
    ticker: "$SOLAR",
    name: "SOLAR DRIFT",
    status: "ACTIVE",
    description: "Early wallets converging on a new token cluster.",
    tags: ["SOL", "MEME", "NEW"],
    magnitude: 8.4,
    convergence: 92,
    wallets: 27,
    routes: 14,
    velocity: 320,
    confidence: "HIGH",
    heat: [3, 5, 4, 7, 6, 9, 8, 10, 9, 11, 10, 12],
  },
  {
    id: "ep2",
    index: "#02",
    ticker: "$LIQUID",
    name: "LIQUID REALM",
    status: "BUILDING",
    description: "Funding routes expanding across two wallet groups.",
    tags: ["ETH", "DEFI"],
    magnitude: 6.1,
    convergence: 67,
    wallets: 19,
    routes: 11,
    velocity: 118,
    confidence: "MEDIUM",
    heat: [2, 3, 3, 4, 5, 4, 6, 6, 7, 7, 8, 8],
  },
  {
    id: "ep3",
    index: "#03",
    ticker: "$NSWAP",
    name: "NEBULA SWAP",
    status: "COOLING",
    description: "Activity slowing after an earlier convergence spike.",
    tags: ["BASE", "DEX"],
    magnitude: 4.3,
    convergence: 48,
    wallets: 10,
    routes: 6,
    velocity: -42,
    confidence: "LOW",
    heat: [9, 8, 8, 7, 6, 6, 5, 4, 4, 3, 3, 2],
  },
];

// ---------------------------------------------------------------------------
// Emerging activity table (simulated)
// ---------------------------------------------------------------------------

export type ChainTab = "ALL" | "SOL" | "ETH" | "BASE" | "OTHER";

export type EmergingRow = {
  id: string;
  ticker: string;
  cluster: string;
  chain: Exclude<ChainTab, "ALL">;
  magnitude: number;
  delta: number;
  time: string;
};

export const emergingRows: EmergingRow[] = [
  { id: "em1", ticker: "$SOLAR", cluster: "Solar Drift", chain: "SOL", magnitude: 8.4, delta: 320, time: "2h" },
  { id: "em2", ticker: "$MAGMA", cluster: "Magma Pool", chain: "ETH", magnitude: 6.8, delta: 205, time: "1h" },
  { id: "em3", ticker: "$LIQUID", cluster: "Liquid Realm", chain: "ETH", magnitude: 6.1, delta: 118, time: "6h" },
  { id: "em4", ticker: "$QUARTZ", cluster: "Quartz Vein", chain: "SOL", magnitude: 5.7, delta: 64, time: "3h" },
  { id: "em5", ticker: "$STRATA", cluster: "Strata Bridge", chain: "BASE", magnitude: 5.2, delta: 37, time: "11h" },
  { id: "em6", ticker: "$NSWAP", cluster: "Nebula Swap", chain: "BASE", magnitude: 4.3, delta: -42, time: "14h" },
  { id: "em7", ticker: "$FAULT", cluster: "Fault Line", chain: "OTHER", magnitude: 3.9, delta: -12, time: "9h" },
];

// ---------------------------------------------------------------------------
// Network tremors — 24h telemetry (simulated)
// ---------------------------------------------------------------------------

export type TremorMetric = { label: string; value: string; delta: number };

export const tremorMetrics: TremorMetric[] = [
  { label: "TOTAL SIGNALS", value: "472", delta: 26 },
  { label: "NEW EPICENTERS", value: "3", delta: 200 },
  { label: "AVG. MAGNITUDE", value: "4.9", delta: 18 },
  { label: "ROUTES DISCOVERED", value: "31", delta: 107 },
];

// 24 hourly samples, 0-100. Spikes near the end read as "activity now".
export const tremorTimeline: number[] = [
  22, 18, 26, 20, 31, 24, 19, 28, 35, 27, 44, 38, 30, 52, 41, 36, 58, 47, 63, 55, 71, 66, 84, 78,
];
