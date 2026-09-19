# HYPERMOLE

Onchain Seismic Radar for Robinhood Chain.

> See what moves before the market does.

HYPERMOLE maps public onchain activity into a seismic system. Wallet activity, funding routes and emerging convergence are represented as tremors, epicenters and magnitude instead of raw tables and charts, so unusual movement is easy to spot before it becomes obvious on the surface.

## What is HYPERMOLE?

HYPERMOLE is an onchain seismic radar for Robinhood Chain. It watches public onchain activity and turns it into a readable map of where independent wallets are converging, which wallets are waking up, and where capital is moving — before that activity becomes visible in price.

## Core idea

Normal traders usually notice market activity after it starts happening. HYPERMOLE focuses on the activity underneath: wallets becoming active, several independent wallets converging on the same entity, capital arriving from different funding routes, dormant wallets waking up, and clusters changing direction.

The metaphor: onchain movement is seismic movement. When unusual activity starts forming, HYPERMOLE detects a **tremor**. The place it's converging on becomes the **epicenter**. The strength of that activity is its **magnitude**. How much independent activity is meeting in one place is its **convergence**.

## Product vocabulary

| Term | Meaning |
|---|---|
| **Tremor** | An unusual concentration or acceleration of public onchain activity |
| **Epicenter** | The entity / contract / cluster around which activity is converging |
| **Magnitude** | A visual measure of the strength of detected activity |
| **Convergence** | How strongly independent activity is meeting around the same entity |
| **Wake** | A previously inactive wallet or cluster becoming active again |
| **Aftershock** | Follow-on activity appearing after an earlier tremor |
| **Trace** | A mapped relationship or funding path |
| **Flow** | Movement of capital or activity between regions |

## Planned product

- Homepage
- Underground / Seismic Terminal
- Tremor feed
- Epicenter explorer
- Public chain log & audit views
- Docs

The homepage and the terminal are built as an illustrative simulation; the rest are planned.

## The terminal (`/terminal`)

The flagship surface is a full-viewport seismic observatory at `/terminal`, designed for 1920×1200 and screen recording. It is an **illustrative simulation** — it does not read Robinhood Chain yet, and it says so on screen (`DEMO MODE`, `ILLUSTRATIVE SIMULATION`).

- 24 persistent nodes in four organic regions (Fresh Wallets, Smart Clusters, Funding, Contracts), ~51 base connections plus temporary "newly discovered" links, around a small HYPERMOLE seismic core.
- One engine drives everything: `src/simulation/SeismicEngine.ts` owns nodes, edges, packets, seismic rings, metrics, chart, logs, audit and tremor history. Every event updates several of those at once, so the panels stay causally connected.
- Event types: `WAKE`, `TRACE`, `FLOW`, `VERIFY`, minor `TREMOR`, large `TREMOR` (with chained `AFTERSHOCK`), `CONVERGENCE` (with `EPICENTER`), node `MIGRATION`. Intervals are re-rolled after every firing, so a recording never visibly loops.
- Metrics have inertia: magnitude/convergence rise quickly on events and cool gradually; the tremor score follows them.
- Rendering is split in two: the network and chart scroll are applied imperatively every frame (no React re-renders), while panels read an immutable snapshot a few times per second.
- URL flags: `/terminal?speed=0.5|1|1.5|2` tunes intensity, `/terminal?recording=1` hides the AUTO/PAUSE control. `prefers-reduced-motion` disables migration and thins out packets and rings.

## Recording the terminal

```
npm run record:terminal
```

`scripts/record-terminal.mjs` produces a master and a share video of `/terminal?recording=1` without screen capture or OBS:

- It ensures a production server is running (builds and starts one on port 3100 if needed) and launches headless Chromium with a native 2× compositor surface: the 1920×1200 layout renders at 3840×2400.
- Chromium's virtual time is paused and advanced by exactly 1/60 s per frame (`HeadlessExperimental.beginFrame`), so every frame is captured as a lossless PNG regardless of render speed. No frames are dropped, duplicated or interpolated.
- One FFmpeg process encodes both files from the same frames: `recordings/hypermole-terminal-master.mp4` (3840×2400, libx264 slow, CRF 13) and `recordings/hypermole-terminal-share.mp4` (1920×1200 Lanczos downscale, CRF 17). Both are 60 fps, yuv420p, faststart, no audio.
- It ends with ffprobe metadata for both files plus inspection frames at 00:10 / 00:45 / 01:20.

On a fresh machine run `npx playwright install chromium` once (the `playwright` devDependency ships the driver, not the browser). FFmpeg and ffprobe must be on `PATH`.

Options: `--seconds 90 --scale 2 --port 3100 --out recordings --master-crf 13 --share-crf 17 --preset slow`. The 90 s run takes roughly 20 minutes (frame capture is the bottleneck, not encoding).

## Homepage

The homepage reuses the same engine and `NetworkStage` component — the hero radar runs it in compact mode, and the terminal section embeds the real terminal. There is no second simulation.

It also includes a live seismic activity panel, a flow ticker, a telemetry row, a four-step "How HYPERMOLE works" pipeline, an Epicenters section (lifecycle cards, 24h tremor timeline, emerging-activity table, legend), an Open Source section, and a Token Status section driven entirely by `src/config/project.ts` — it will not show a contract address, buy link, or token figures until that config is switched on.

All identifiers, magnitudes, scores, ticker values and feed events on the site are illustrative content (`src/simulation`, `src/data/seismic.ts`). None of it reflects real Robinhood Chain activity, and nothing on the site claims live user counts, trading results, P&L, historical performance, or partnerships.

Not built yet: real public-chain data integration and token integration.

## Tech stack

- [Next.js](https://nextjs.org/) (App Router) + React + TypeScript
- Plain CSS Modules for styling (no UI component library, no Tailwind)
- [next/font](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) (Geist Sans / Geist Mono), self-hosted
- Deployed target: [Vercel](https://vercel.com/)

## Local development

```bash
npm install
npm run dev      # starts the dev server at http://localhost:3000
npm run lint      # ESLint
npm run build     # production build + TypeScript check
npm run start      # serve the production build
```

## Repository structure

```
mole/
├── README.md
├── LICENSE
├── .gitignore
├── docs/
│   ├── CONCEPT.md
│   ├── PRODUCT.md
│   ├── VISUAL_LANGUAGE.md
│   ├── TERMINAL.md
│   └── ROADMAP.md
├── public/
│   └── assets/
│       ├── README.md
│       ├── mole-mascot.png
│       ├── mole-avatar.png
│       └── mole-hero.png
└── src/
    ├── app/            # Next.js App Router: layout, homepage, global styles
    ├── components/      # Homepage sections + components/terminal (the flagship terminal UI)
    ├── config/          # Central project config — including the token-live switch
    ├── data/            # Illustrative content for homepage sections
    └── simulation/      # SeismicEngine: network, events, generators, React hook
```

## Status

Early development. The homepage and the `/terminal` observatory are implemented as an illustrative simulation. The live data layer and token integration are not.

This project began under the name MOLE / "Underground Intelligence." It has since been repositioned as **HYPERMOLE**, an onchain seismic radar, with a simplified vocabulary and a denser, more active terminal. The original pixel-art mole mascot carries over unchanged.

## Links

- Website: https://hypermole.vercel.app
- Terminal: https://hypermole.vercel.app/terminal
- X: https://x.com/0x_mura
- Docs: [./docs/](./docs/)

## Roadmap

01. Brand + mascot
02. Product website
03. Seismic terminal
04. Public-chain data layer
05. Tremor feed
06. Epicenter explorer
07. Documentation
08. Token integration

See [docs/ROADMAP.md](./docs/ROADMAP.md) for the full phased roadmap.
