# MOLE

Underground Intelligence for Robinhood Chain.

> Everyone watches the surface.
> MOLE watches what moves underneath.

MOLE maps public onchain activity into an underground visual system. Wallet movements, capital flows, and relationships are represented as tunnels and burrows instead of raw tables and charts, so what is happening beneath the surface is easy to see and easy to follow.

## What is MOLE?

MOLE is an underground intelligence tool for Robinhood Chain. It observes public onchain activity and turns it into a visual map of what is moving, who is connected, and where capital is going before that activity becomes obvious on the surface.

## Core idea

Most people only notice a token once its activity is already visible on the surface: price charts, trending lists, social mentions. MOLE is built to organize what is happening underneath that surface — wallet movements, funding relationships, fresh participants, and unusual onchain activity — and present it as a readable underground map.

## Product vocabulary

| Term | Meaning |
|---|---|
| **Fresh Dirt** | Newly detected activity |
| **Tunnels** | Connections or movement between wallets |
| **Burrows** | Related wallet clusters |
| **MOLE Signal** | Noteworthy detected activity |
| **MOLE Score** | A future signal/confidence visualization |
| **Surface** | Visible market activity |
| **Underground** | Underlying wallet/onchain activity |

## Planned product

- Homepage
- Underground Terminal
- Fresh Dirt / Pulse
- Tunnel Inspector
- Burrows
- MOLE Signals
- Surface Receipts
- Docs

These are planned modules. None of them are built yet.

## Homepage (v1)

The homepage is implemented as a Next.js app and includes:

- A hero section with an animated, interactive underground network preview (the mini terminal), built with SVG and CSS — not a screenshot.
- Four working preview actions in the mini terminal: `DIG`, `TRACE`, `BURROWS`, `RESET`.
- A "How MOLE Works" flow (Dig → Trace → Connect → Surface).
- A Fresh Dirt preview table and a Burrows preview with mini cluster graphs.
- A larger Underground Terminal layout teaser (dossier / network / surface / logs / audit panels).
- An Open Source section linking to this repository.
- A Token Status section driven entirely by `src/config/project.ts` — it will not show a contract address, buy link, or any token figures until that config is switched on.

All numbers, wallet identifiers, feed events, and scores shown on the homepage are demo/illustrative data (see `src/data/demo.ts`), clearly labeled as such in the UI (`DEMO MODE`, `DEMO DATA`, `ILLUSTRATIVE FEED`). None of it reflects real Robinhood Chain activity. Nothing on the site claims live user counts, wallet counts, trading results, P&L, historical performance, or partnerships.

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
    ├── components/      # Homepage sections (Navbar, Hero, MoleTerminalPreview, ...)
    ├── config/          # Central project config — including the token-live switch
    └── data/            # Demo/illustrative data used by the homepage previews
```

## Status

Early development. The v1 homepage above is implemented. The terminal product, live data layer, and token integration are not.

## Links

- Website: Coming soon
- Terminal: Coming soon
- X: Coming soon
- Docs: [./docs/](./docs/)

## Roadmap

01. Brand + mascot
02. Product website
03. Underground terminal
04. Public-chain data layer
05. Pulse / Fresh Dirt
06. Burrow explorer
07. Documentation
08. Token integration

See [docs/ROADMAP.md](./docs/ROADMAP.md) for the full phased roadmap.
