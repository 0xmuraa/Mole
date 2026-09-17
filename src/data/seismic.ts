// All data in this file is illustrative demo/simulation data for the
// HYPERMOLE frontend prototype. None of it reflects live Robinhood Chain
// activity. See DEMO MODE / SIMULATION labels wherever it renders.

export type NodeType =
  | "WALLET"
  | "FRESH"
  | "TRACE"
  | "FLOW"
  | "CONTRACT"
  | "WAKE"
  | "CLUSTER"
  | "VERIFY";

export type Region = "fresh" | "smart" | "funding" | "contracts" | "bridge" | "satellite";

export const regionLabels: Record<Region, string> = {
  fresh: "FRESH WALLETS",
  smart: "SMART CLUSTERS",
  funding: "FUNDING",
  contracts: "CONTRACTS",
  bridge: "BRIDGE",
  satellite: "SATELLITE",
};

export type SeismicNode = {
  id: string;
  type: NodeType;
  region: Region;
  x: number;
  y: number;
};

// viewBox is 0-160 wide, 0-100 tall. The HYPERMOLE seismic core sits at the
// literal center (80, 50) as an overlay badge — it is not a node. Four
// organic regions surround it; coordinates are hand-placed and irregular on
// purpose so the map reads as reorganizing activity, not a symmetric diagram.
export const seismicCore = { x: 80, y: 50 };

export const seismicNodes: SeismicNode[] = [
  // FRESH WALLETS — top left
  { id: "fw1", type: "WALLET", region: "fresh", x: 18, y: 10 },
  { id: "fw2", type: "FRESH", region: "fresh", x: 40, y: 8 },
  { id: "fw3", type: "TRACE", region: "fresh", x: 12, y: 28 },
  { id: "fw4", type: "FLOW", region: "fresh", x: 34, y: 30 },
  { id: "fw5", type: "CONTRACT", region: "fresh", x: 24, y: 18 },

  // SMART CLUSTERS — top right
  { id: "sc1", type: "WAKE", region: "smart", x: 122, y: 9 },
  { id: "sc2", type: "CLUSTER", region: "smart", x: 146, y: 12 },
  { id: "sc3", type: "VERIFY", region: "smart", x: 118, y: 30 },
  { id: "sc4", type: "WALLET", region: "smart", x: 142, y: 32 },
  { id: "sc5", type: "FRESH", region: "smart", x: 132, y: 19 },

  // FUNDING — bottom left
  { id: "fn1", type: "TRACE", region: "funding", x: 14, y: 70 },
  { id: "fn2", type: "FLOW", region: "funding", x: 38, y: 68 },
  { id: "fn3", type: "CONTRACT", region: "funding", x: 10, y: 90 },
  { id: "fn4", type: "WAKE", region: "funding", x: 34, y: 92 },
  { id: "fn5", type: "CLUSTER", region: "funding", x: 26, y: 80 },

  // CONTRACTS — bottom right
  { id: "ct1", type: "VERIFY", region: "contracts", x: 120, y: 70 },
  { id: "ct2", type: "WALLET", region: "contracts", x: 144, y: 68 },
  { id: "ct3", type: "FRESH", region: "contracts", x: 116, y: 90 },
  { id: "ct4", type: "TRACE", region: "contracts", x: 142, y: 92 },
  { id: "ct5", type: "FLOW", region: "contracts", x: 130, y: 80 },

  // bridges + inner satellites tie the four regions to the core
  { id: "br1", type: "CONTRACT", region: "bridge", x: 80, y: 14 },
  { id: "br2", type: "WAKE", region: "bridge", x: 80, y: 88 },
  { id: "s1", type: "CLUSTER", region: "satellite", x: 58, y: 50 },
  { id: "s2", type: "VERIFY", region: "satellite", x: 102, y: 50 },
];

export type SeismicEdge = {
  from: string;
  to: string;
  bend: number;
  long?: boolean;
};

function regionMesh(ids: [string, string, string, string, string], bendStart: number): SeismicEdge[] {
  const [r1, r2, r3, r4, r5] = ids;
  return [
    { from: r1, to: r2, bend: bendStart },
    { from: r2, to: r3, bend: bendStart + 2 },
    { from: r3, to: r4, bend: bendStart - 2 },
    { from: r4, to: r5, bend: bendStart + 3 },
    { from: r5, to: r1, bend: bendStart - 3 },
    { from: r1, to: r3, bend: bendStart - 5 },
    { from: r2, to: r4, bend: bendStart + 5 },
  ];
}

export const seismicEdges: SeismicEdge[] = [
  ...regionMesh(["fw1", "fw2", "fw4", "fw3", "fw5"], 3),
  ...regionMesh(["sc1", "sc2", "sc4", "sc3", "sc5"], -3),
  ...regionMesh(["fn1", "fn2", "fn4", "fn3", "fn5"], -3),
  ...regionMesh(["ct1", "ct2", "ct4", "ct3", "ct5"], 3),

  { from: "fw1", to: "center", bend: -3 },
  { from: "sc1", to: "center", bend: 3 },
  { from: "fn1", to: "center", bend: -3 },
  { from: "ct1", to: "center", bend: 3 },

  { from: "br1", to: "fw2", bend: 2 },
  { from: "br1", to: "sc1", bend: -2 },
  { from: "br1", to: "center", bend: 0 },

  { from: "br2", to: "fn4", bend: -2 },
  { from: "br2", to: "ct3", bend: 2 },
  { from: "br2", to: "center", bend: 0 },

  { from: "s1", to: "center", bend: 2 },
  { from: "s1", to: "fw4", bend: -3 },
  { from: "s1", to: "fn2", bend: 3 },

  { from: "s2", to: "center", bend: -2 },
  { from: "s2", to: "sc3", bend: 3 },
  { from: "s2", to: "ct1", bend: -3 },

  // long diagonal links crossing the whole map
  { from: "fw3", to: "ct3", bend: 6, long: true },
  { from: "sc3", to: "fn2", bend: -6, long: true },
];

// ---------------------------------------------------------------------------
// Dossier / entity demo data
// ---------------------------------------------------------------------------

export const dossier = {
  entity: "ENTITY-0442",
  label: "DEMO DOSSIER",
  tremorScore: 78,
  magnitude: 6.8,
  convergence: 82,
  activeWallets: 19,
  routes: 7,
};

export type Finding = { id: string; text: string };

export const dossierFindings: Finding[] = [
  { id: "df1", text: "Dormant wallets waking" },
  { id: "df2", text: "Funding routes expanding" },
  { id: "df3", text: "Independent entries increasing" },
  { id: "df4", text: "Cross-cluster flow rising" },
];

export const flowSummary = {
  routes: 5,
  independentSources: 3,
  clustersConverging: 2,
};

// ---------------------------------------------------------------------------
// Right panel — surface activity / chart / signal stack
// ---------------------------------------------------------------------------

export const surfaceBase = {
  magnitude: 7.2,
  convergence: 86,
  activitySpeed: 34,
};

export type TremorStackState = "ACTIVE" | "COOLING" | "AFTERSHOCK";

export type TremorStackItem = {
  id: string;
  label: string;
  state: TremorStackState;
};

export const tremorStackSeed: TremorStackItem[] = [
  { id: "t042", label: "TREMOR #042", state: "ACTIVE" },
  { id: "t041", label: "TREMOR #041", state: "COOLING" },
  { id: "t040", label: "TREMOR #040", state: "AFTERSHOCK" },
];

// ---------------------------------------------------------------------------
// Public chain logs (bottom left)
// ---------------------------------------------------------------------------

export type LogEventType = "WAKE" | "TRACE" | "FLOW" | "VERIFY" | "TREMOR";

export type PublicLogRow = {
  id: string;
  event: LogEventType;
  entity: string;
  flow: string;
  depth: number;
  index: number;
};

export const publicLogPool: PublicLogRow[] = [
  { id: "pl1", event: "WAKE", entity: "0x71a…92f", flow: "+4.2", depth: 3, index: 184 },
  { id: "pl2", event: "TRACE", entity: "0x18b…11a", flow: "+2.8", depth: 2, index: 177 },
  { id: "pl3", event: "FLOW", entity: "0x92f…77c", flow: "+5.1", depth: 4, index: 169 },
  { id: "pl4", event: "VERIFY", entity: "0x62a…12e", flow: "—", depth: 2, index: 162 },
  { id: "pl5", event: "WAKE", entity: "0xd45…9a2", flow: "+3.4", depth: 1, index: 155 },
  { id: "pl6", event: "TRACE", entity: "0xb1a…6e3", flow: "+1.9", depth: 3, index: 148 },
  { id: "pl7", event: "FLOW", entity: "0x3f9…7c2", flow: "+6.0", depth: 4, index: 141 },
  { id: "pl8", event: "TREMOR", entity: "0xa08…5e1", flow: "+8.3", depth: 5, index: 134 },
];

// ---------------------------------------------------------------------------
// HYPERMOLE audit feed (bottom right)
// ---------------------------------------------------------------------------

export type AuditTag = "TRACE" | "WAKE" | "CONVERGE" | "TREMOR" | "EPICENTER" | "AFTERSHOCK" | "FLOW" | "VERIFY";

export type AuditRow = {
  id: string;
  tag: AuditTag;
  message: string;
};

export const auditPool: AuditRow[] = [
  { id: "au1", tag: "TRACE", message: "New funding route discovered" },
  { id: "au2", tag: "WAKE", message: "Dormant wallet resumed activity" },
  { id: "au3", tag: "CONVERGE", message: "Independent paths approaching same entity" },
  { id: "au4", tag: "TREMOR", message: "Magnitude increased" },
  { id: "au5", tag: "EPICENTER", message: "New center detected" },
  { id: "au6", tag: "AFTERSHOCK", message: "Secondary activity detected" },
  { id: "au7", tag: "FLOW", message: "Cross-cluster movement accelerating" },
  { id: "au8", tag: "VERIFY", message: "Public event indexed" },
];

// ---------------------------------------------------------------------------
// Tremors section (fast-updating demo feed)
// ---------------------------------------------------------------------------

export type TremorState = "BUILDING" | "ACTIVE" | "COOLING";

export type TremorRow = {
  id: string;
  age: string;
  type: "CONVERGENCE" | "WAKE" | "AFTERSHOCK" | "TREMOR";
  magnitude: number;
  convergence: number;
  nodes: number;
  state: TremorState;
};

export const tremorRows: TremorRow[] = [
  { id: "tr1", age: "8s", type: "CONVERGENCE", magnitude: 7.1, convergence: 86, nodes: 14, state: "BUILDING" },
  { id: "tr2", age: "22s", type: "WAKE", magnitude: 5.4, convergence: 63, nodes: 8, state: "ACTIVE" },
  { id: "tr3", age: "47s", type: "AFTERSHOCK", magnitude: 4.8, convergence: 57, nodes: 11, state: "COOLING" },
  { id: "tr4", age: "1m", type: "TREMOR", magnitude: 6.5, convergence: 74, nodes: 12, state: "ACTIVE" },
  { id: "tr5", age: "3m", type: "CONVERGENCE", magnitude: 5.9, convergence: 68, nodes: 9, state: "COOLING" },
  { id: "tr6", age: "6m", type: "WAKE", magnitude: 4.2, convergence: 51, nodes: 6, state: "COOLING" },
];

// ---------------------------------------------------------------------------
// Epicenters section (3 cards)
// ---------------------------------------------------------------------------

export type EpicenterStatus = "BUILDING" | "ACTIVE" | "COOLING";

export type EpicenterCard = {
  id: string;
  label: string;
  magnitude: number;
  convergence: number;
  wallets: number;
  routes: number;
  status: EpicenterStatus;
};

export const epicenterCards: EpicenterCard[] = [
  { id: "ep1", label: "EPICENTER #01", magnitude: 7.8, convergence: 89, wallets: 14, routes: 9, status: "ACTIVE" },
  { id: "ep2", label: "EPICENTER #02", magnitude: 5.6, convergence: 61, wallets: 7, routes: 4, status: "BUILDING" },
  { id: "ep3", label: "EPICENTER #03", magnitude: 4.3, convergence: 48, wallets: 10, routes: 6, status: "COOLING" },
];
