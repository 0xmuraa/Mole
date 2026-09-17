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

These are planned modules. Only the homepage below is built.

## Homepage (v2)

The homepage is a Next.js app and includes:

- A hero section with an animated, self-scanning seismic radar preview (`SeismicRadar` + `SeismicNetwork`), built with SVG and CSS — not a screenshot.
- A "How HYPERMOLE Works" flow (Monitor → Trace → Detect → Surface).
- A Tremors table and an Epicenters section with mini convergence graphs.
- A full Seismic Observatory terminal showcase: a 20-node, four-region network (Fresh Wallets / Smart Clusters / Funding / Contracts) driven by a small frontend simulation engine that fires coordinated `WAKE`, `TRACE`, `FLOW`, `TREMOR`, `CONVERGENCE`, `EPICENTER` and `AFTERSHOCK` events — each event updates the network, the chart, the metrics and both log feeds together, on independently randomized intervals so it never repeats on a fixed beat.
- An Open Source section linking to this repository.
- A Token Status section driven entirely by `src/config/project.ts` — it will not show a contract address, buy link, or any token figures until that config is switched on.

All numbers, wallet identifiers, feed events, magnitudes and scores shown on the homepage are demo/simulation data (see `src/data/seismic.ts`), clearly labeled in the UI (`DEMO MODE`, `DEMO DATA`, `SIMULATION`, `ILLUSTRATIVE`). None of it reflects real Robinhood Chain activity. Nothing on the site claims live user counts, wallet counts, trading results, P&L, historical performance, or partnerships.

Not built yet: the standalone `/terminal` product, real public-chain data integration, and token integration.

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
    ├── components/      # Homepage sections (Navbar, Hero, SeismicNetwork, SeismicTerminal, ...)
    ├── config/          # Central project config — including the token-live switch
    ├── data/            # Demo/simulation data used by the homepage previews
    └── lib/             # Small shared helpers (e.g. tunnel path math)
```

## Status

Early development. The v2 homepage above is implemented. The terminal product, live data layer, and token integration are not.

This project began under the name MOLE / "Underground Intelligence." It has since been repositioned as **HYPERMOLE**, an onchain seismic radar, with a simplified vocabulary and a denser, more active terminal. The original pixel-art mole mascot carries over unchanged.

## Links

- Website: Coming soon
- Terminal: Coming soon
- X: Coming soon
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
