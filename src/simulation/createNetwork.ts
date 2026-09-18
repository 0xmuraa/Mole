import type { RegionId, Role, SimEdge, SimNode } from "./types";

// Deterministic PRNG so the initial network is identical on server and client.
function mulberry32(seed: number) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Hand-placed, deliberately irregular. Four loose communities around the
// core at (0.5, 0.5): no ring, no grid, no symmetry.
const NODE_DEFS: [number, Role, RegionId, number, number][] = [
  [1, "WALLET", "fresh", 0.085, 0.2],
  [2, "FRESH", "fresh", 0.2, 0.115],
  [3, "FRESH", "fresh", 0.315, 0.225],
  [4, "WALLET", "fresh", 0.15, 0.37],
  [5, "TRACE", "fresh", 0.275, 0.41],
  [6, "WAKE", "fresh", 0.395, 0.1],

  [7, "CLUSTER", "smart", 0.655, 0.125],
  [8, "CLUSTER", "smart", 0.78, 0.225],
  [9, "WALLET", "smart", 0.905, 0.15],
  [10, "VERIFY", "smart", 0.705, 0.36],
  [11, "TRACE", "smart", 0.86, 0.39],
  [12, "FRESH", "smart", 0.575, 0.255],

  [13, "FLOW", "funding", 0.1, 0.615],
  [14, "FLOW", "funding", 0.225, 0.735],
  [15, "WALLET", "funding", 0.075, 0.835],
  [16, "TRACE", "funding", 0.335, 0.625],
  [17, "WAKE", "funding", 0.365, 0.85],
  [18, "VERIFY", "funding", 0.215, 0.905],

  [19, "CONTRACT", "contracts", 0.665, 0.675],
  [20, "CONTRACT", "contracts", 0.795, 0.615],
  [21, "VERIFY", "contracts", 0.915, 0.7],
  [22, "FLOW", "contracts", 0.725, 0.855],
  [23, "CLUSTER", "contracts", 0.875, 0.885],
  [24, "WAKE", "contracts", 0.555, 0.885],
];

const COMPACT_NUMS = new Set([1, 2, 3, 5, 7, 8, 10, 12, 13, 14, 16, 19, 20, 24]);

type EdgeDef = [number, number | "core", number?];

const LOCAL: EdgeDef[] = [
  [1, 2], [2, 3], [1, 4], [4, 5], [3, 5], [2, 4], [3, 6], [2, 6],
  [7, 8], [8, 9], [7, 12], [10, 12], [8, 10], [10, 11], [9, 11], [8, 11],
  [13, 14], [13, 15], [14, 15], [14, 16], [14, 18], [15, 18], [17, 18], [16, 17],
  [19, 20], [20, 21], [19, 22], [22, 23], [21, 23], [20, 22], [19, 24], [22, 24],
];

// Third value forces the bend so long links arc around the core, not through it.
const BRIDGES: EdgeDef[] = [
  [6, 12], [6, 7], [3, 12], [5, 16], [4, 13], [5, 10, -0.3],
  [11, 20], [10, 20], [16, 19, 0.28], [17, 24], [16, 24], [11, 21],
];

const CORE: EdgeDef[] = [
  [5, "core"], [12, "core"], [16, "core"], [19, "core"], [10, "core"], [24, "core"], [3, "core"],
];

export function nodeId(num: number) {
  return `n${String(num).padStart(2, "0")}`;
}

export function nodeLabel(node: Pick<SimNode, "role" | "num" | "dormant">) {
  const name = node.dormant ? "DORMANT" : node.role;
  return `${name} ${String(node.num).padStart(2, "0")}`;
}

export function makeEdge(a: string, b: string, kind: SimEdge["kind"], bend: number, weight: number, now = 0, ttl = 0): SimEdge {
  return {
    id: `${a}-${b}-${kind}${ttl ? `-${Math.round(now * 1000)}` : ""}`,
    a,
    b,
    bend,
    weight,
    kind,
    state: "idle",
    stateUntil: 0,
    bornAt: now,
    dieAt: ttl ? now + ttl : 0,
    g: [0, 0, 0, 0, 0, 0],
  };
}

export function createNetwork(compact: boolean) {
  const rng = mulberry32(42);
  const defs = compact ? NODE_DEFS.filter((d) => COMPACT_NUMS.has(d[0])) : NODE_DEFS;

  const nodes: SimNode[] = defs.map(([num, role, region, bx, by]) => ({
    id: nodeId(num),
    role,
    num,
    region,
    bx,
    by,
    x: bx,
    y: by,
    ax: 0.006 + rng() * 0.008,
    ay: 0.009 + rng() * 0.012,
    fx: (Math.PI * 2) / (2 + rng() * 4),
    fy: (Math.PI * 2) / (2 + rng() * 4),
    px: rng() * Math.PI * 2,
    py: rng() * Math.PI * 2,
    mx: 0,
    my: 0,
    mtx: 0,
    mty: 0,
    dormant: role === "WAKE",
    activeUntil: 0,
    wakeUntil: 0,
    verifiedUntil: 0,
  }));

  const present = new Set(nodes.map((n) => n.id));
  const edges: SimEdge[] = [];
  const add = (defsList: EdgeDef[], kind: SimEdge["kind"]) => {
    for (const [a, b, forced] of defsList) {
      const ida = nodeId(a);
      const idb = b === "core" ? "core" : nodeId(b);
      if (!present.has(ida) || (idb !== "core" && !present.has(idb))) continue;
      const sign = rng() > 0.5 ? 1 : -1;
      const bend = forced ?? sign * (0.06 + rng() * 0.16) * (kind === "core" ? 0.6 : 1);
      const weight = kind === "bridge" ? 0.3 + rng() * 0.45 : 0.4 + rng() * 0.6;
      edges.push(makeEdge(ida, idb, kind, bend, weight));
    }
  };
  add(LOCAL, "local");
  add(BRIDGES, "bridge");
  add(CORE, "core");

  return { nodes, edges };
}
