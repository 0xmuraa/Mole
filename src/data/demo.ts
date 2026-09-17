// All data in this file is illustrative demo/preview data.
// None of it represents live Robinhood Chain activity. See DEMO MODE labels
// wherever this data is rendered.

export type NetworkNodeType = "WALLET" | "FRESH" | "FLOW" | "TOKEN" | "TRACE" | "BURROW";

export type NetworkNode = {
  id: string;
  type: NetworkNodeType;
  x: number;
  y: number;
  // Curve bend for the tunnel back to center: negative bends left, positive right.
  bend: number;
};

// Positions sit on a 0-100 grid. The mole mascot occupies the literal center
// (50, 50) as an overlay — it is not a node. Radii/angles are irregular on
// purpose so the ring reads as organic burrows rather than a spoke diagram.
export const networkNodes: NetworkNode[] = [
  { id: "n1", type: "WALLET", x: 50, y: 9, bend: 4 },
  { id: "n2", type: "FRESH", x: 17, y: 19, bend: -6 },
  { id: "n3", type: "FLOW", x: 84, y: 21, bend: 6 },
  { id: "n4", type: "TRACE", x: 8, y: 52, bend: -4 },
  { id: "n5", type: "TOKEN", x: 92, y: 54, bend: 5 },
  { id: "n6", type: "BURROW", x: 21, y: 84, bend: -5 },
  { id: "n7", type: "WALLET", x: 79, y: 86, bend: 6 },
  { id: "n8", type: "FRESH", x: 50, y: 92, bend: -3 },
  { id: "n9", type: "FLOW", x: 33, y: 34, bend: -3 },
];

export const networkCenter = { x: 50, y: 50 };

export type NetworkEdge = {
  from: string;
  // "center" connects the node to the mole hub. Otherwise this is another node id.
  to: string | "center";
};

// Most tunnels run back to the center hub; a few cross-link neighboring
// nodes so the web feels organic instead of a rigid hub-and-spoke diagram.
export const networkEdges: NetworkEdge[] = [
  { from: "n1", to: "center" },
  { from: "n2", to: "center" },
  { from: "n3", to: "center" },
  { from: "n4", to: "center" },
  { from: "n5", to: "center" },
  { from: "n6", to: "center" },
  { from: "n7", to: "center" },
  { from: "n8", to: "center" },
  { from: "n9", to: "center" },
  { from: "n2", to: "n4" },
  { from: "n3", to: "n5" },
  { from: "n6", to: "n8" },
];

// The node/tunnel MOLE's DIG action reveals — not part of the base graph.
export const digReveal: NetworkNode = { id: "n-dig", type: "FRESH", x: 65, y: 31, bend: 4 };

// Node ids TRACE animates a signal across, in order.
export const tracePath: string[] = ["n2", "n4", "n9", "center", "n5", "n3"];

// Node ids grouped into a burrow when the BURROWS action runs.
export const burrowGroup: string[] = ["n6", "n8", "n7"];

export type FeedEvent = {
  id: string;
  tag: "TRACE" | "FRESH" | "TUNNEL" | "BURROW" | "VERIFY";
  message: string;
};

export const feedEvents: FeedEvent[] = [
  { id: "f1", tag: "TRACE", message: "funding path discovered" },
  { id: "f2", tag: "FRESH", message: "new wallet entered cluster" },
  { id: "f3", tag: "TUNNEL", message: "wallet relationship mapped" },
  { id: "f4", tag: "BURROW", message: "connected group detected" },
  { id: "f5", tag: "VERIFY", message: "public event indexed" },
];

export type FreshDirtRow = {
  id: string;
  age: string;
  type: "FRESH WALLET" | "FUNDING PATH" | "NEW CLUSTER" | "FLOW CHANGE";
  entity: string;
  connections: number;
  depth: number;
  score: number;
};

export const freshDirtRows: FreshDirtRow[] = [
  { id: "d1", age: "12s", type: "FRESH WALLET", entity: "0x7a3…f21", connections: 2, depth: 1, score: 41 },
  { id: "d2", age: "48s", type: "FUNDING PATH", entity: "0x91c…4b0", connections: 5, depth: 3, score: 67 },
  { id: "d3", age: "2m", type: "NEW CLUSTER", entity: "0x2e8…d17", connections: 9, depth: 4, score: 82 },
  { id: "d4", age: "5m", type: "FLOW CHANGE", entity: "0xd45…9a2", connections: 3, depth: 2, score: 54 },
  { id: "d5", age: "9m", type: "FRESH WALLET", entity: "0x60f…c88", connections: 1, depth: 1, score: 29 },
  { id: "d6", age: "14m", type: "FUNDING PATH", entity: "0xb1a…6e3", connections: 6, depth: 3, score: 71 },
];

export type BurrowCard = {
  id: string;
  label: string;
  nodeCount: number;
  connectionCount: number;
  depth: number;
  activity: "LOW" | "MODERATE" | "ELEVATED";
};

export const burrowCards: BurrowCard[] = [
  { id: "b1", label: "BURROW #01", nodeCount: 6, connectionCount: 11, depth: 3, activity: "MODERATE" },
  { id: "b2", label: "BURROW #02", nodeCount: 4, connectionCount: 6, depth: 2, activity: "LOW" },
  { id: "b3", label: "BURROW #03", nodeCount: 9, connectionCount: 18, depth: 4, activity: "ELEVATED" },
];

export type ChainLogEvent = {
  id: string;
  message: string;
};

export const publicChainLog: ChainLogEvent[] = [
  { id: "c1", message: "block indexed" },
  { id: "c2", message: "transfer observed" },
  { id: "c3", message: "contract call observed" },
  { id: "c4", message: "new address seen" },
];

export type AuditEvent = {
  id: string;
  message: string;
};

export const moleAuditLog: AuditEvent[] = [
  { id: "a1", message: "pattern scored" },
  { id: "a2", message: "cluster candidate flagged" },
  { id: "a3", message: "signal reviewed" },
  { id: "a4", message: "burrow updated" },
];
