# TERMINAL

The Seismic Terminal lives at `/terminal`. It currently runs an illustrative simulation (`src/simulation`) — the layout and behavior are real, the data is not connected to Robinhood Chain yet.

## Layout

```
┌───────────────┬───────────────────────────────┬───────────────┐
│               │                                 │               │
│  ENTITY       │  SEISMIC NETWORK                │  SURFACE      │
│  DOSSIER      │  (the hero — ~55-60% of the     │  ACTIVITY     │
│               │  panel's visual attention)       │               │
│               │                                   │               │
├───────────────┴───────────────────┬───────────────┴───────────────┤
│  PUBLIC CHAIN LOGS                 │  HYPERMOLE AUDIT               │
│                                     │                                │
└─────────────────────────────────────┴─────────────────────────────┘
```

## Panels

- **Entity dossier** — details on a selected entity/cluster: tremor score, magnitude, convergence, active wallets, routes, and a short list of findings.
- **Seismic network** — the centerpiece. Four organic regions (Fresh Wallets, Smart Clusters, Funding, Contracts) tied together by a dense mesh of tunnels, with a small HYPERMOLE seismic-core badge at the center. This is where tremors, epicenters, wakes and convergence become visible as they're detected.
- **Surface activity** — what eventually becomes visible above the underground activity: a live-feeling chart, magnitude/convergence/activity readouts, and a small stack of recent tremor events.
- **Public chain logs** — raw public onchain activity feeding the system.
- **HYPERMOLE audit** — a live log of what HYPERMOLE itself is detecting and flagging (trace, wake, converge, tremor, epicenter, aftershock, flow, verify).

## Seismic network

The centerpiece of the terminal. Four irregular, organically-placed regions of nodes, cross-linked densely (not a simple ring or hub-and-spoke), with a couple of long links crossing the whole map and two bridge/satellite nodes tying the regions to the center. Tremor, convergence and epicenter events light up specific nodes and tunnels rather than the whole graph at once, so activity reads as *something specific just happened here* instead of generic ambient motion.

## Simulation architecture

`SeismicEngine` is a single class with one scheduler. Each timer (log, audit, verify, trace, flow, wake, minor tremor, tremor, convergence, migration, dormancy) re-rolls its next firing inside a min/max range. Events mutate shared state together — e.g. a convergence sequence creates converging routes, streams packets into the target, leans source nodes toward it, steps the convergence metric up, promotes the target to epicenter, spikes the chart, and writes log, audit and tremor-history rows.

Output is two-channel: per-frame listeners (network stage, chart scroll) mutate the DOM directly, while React panels subscribe to an immutable snapshot via `useSyncExternalStore`. Simulation time is sub-stepped in 50ms slices so it stays on the wall clock when frames drop during screen recording.
