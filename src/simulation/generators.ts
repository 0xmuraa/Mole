import type { AuditType } from "./types";

// Illustrative generators. Identifiers are random and truncated — they do
// not correspond to real addresses, tokens or transactions.

export const rand = (min: number, max: number) => min + Math.random() * (max - min);
export const randInt = (min: number, max: number) => Math.floor(rand(min, max + 1));
export const pick = <T,>(items: readonly T[]): T => items[Math.floor(Math.random() * items.length)];
export const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));

const HEX = "0123456789ABCDEF";
const hex = (n: number) => Array.from({ length: n }, () => HEX[Math.floor(Math.random() * 16)]).join("");

export function demoWalletId() {
  return `0x${hex(3)}…${hex(3)}`;
}

export const DEMO_ENTITY = "HX-042";

export function flowValue() {
  return `+${rand(0.6, 8.4).toFixed(1)}`;
}

export function clockTime(date = new Date()) {
  return [date.getHours(), date.getMinutes(), date.getSeconds()]
    .map((v) => String(v).padStart(2, "0"))
    .join(":");
}

export const AUDIT_TEXT: Record<AuditType, string[]> = {
  WAKE: ["Dormant node activated", "Dormant wallet resumed activity", "Inactive cluster member returned"],
  TRACE: ["New route discovered", "Funding path mapped", "Relationship link added", "Route history extended"],
  FLOW: ["Cross-cluster movement rising", "Flow rate accelerating", "Bridge route carrying volume"],
  TREMOR: ["Magnitude increased", "Tremor forming", "Activity concentration rising"],
  CONVERGE: ["Independent routes approaching same node", "Convergence rising", "Separate sources aligning"],
  EPICENTER: ["New center identified", "Epicenter shifted", "Activity centered"],
  AFTERSHOCK: ["Secondary activity detected", "Follow-on movement nearby", "Residual flow after tremor"],
  VERIFY: ["Public event indexed", "Contract relationship mapped", "Route confirmed"],
  SCAN: ["Scanning event batch", "Relationship graph updated", "Route weights recalculated", "Indexing block range"],
};
