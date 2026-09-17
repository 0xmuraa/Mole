# VISUAL LANGUAGE

Design system for HYPERMOLE. This will evolve as the product gets built.

## Mascot

- Simple pixel-art mole.
- Clean 16-bit feeling.
- Friendly and memorable, not realistic.
- Should work without a background (transparent, drops cleanly onto any surface).
- Used small: a cropped/circular "seismic core" badge at the center of the network, and a navbar/footer avatar mark. It should not dominate the network visualization — the network is the product, the mole is the identity.

See [public/assets/README.md](../public/assets/README.md) for the asset files.

## Colors

| Name | Hex | Use |
|---|---|---|
| Background | `#050505` | Page background |
| Secondary background | `#090909` | Section background |
| Panel | `#0D0D0C` | Card / panel surface |
| Elevated panel | `#121210` | Active / highlighted panel |
| Border | `#25231E` | Panel and hairline borders |
| Primary text | `#F1EEE7` | Main copy |
| Muted text | `#88857C` | Secondary / label text |
| HYPERMOLE amber | `#F2A63B` | Brand identity, scanner, primary signals, core |
| Bright signal gold | `#FFD36A` | Selected paths, wake events, highlights |
| Electric cyan | `#4FD9EB` | Movement, trace, flow, wallet activity |
| Deep cyan | `#167A8A` | Structural / secondary movement accents |
| Verified green | `#76C96B` | Verified / confirmed demo state only |
| Alert red | `#D9604C` | Anomaly / warning only, used sparingly |
| Earth brown | `#352315` | Mascot and small decorative depth only |

Brown is a supporting color now, not a dominant one. It should not fill entire panels — only the mascot, tiny decorative details (like terminal window-control dots), and occasional subtle background depth.

## Design principle

The mascot is pixel-art. The interface around it is a modern, premium intelligence product — dark panels, sharp type, disciplined color. Pixel styling stays on the mascot; it does not spread across the UI as a retro-game theme. No scanlines, no CRT noise, no grain, no constant glow on every element.

## Motifs

- A seismic network of nodes and tunnels, organized into organic regions rather than a symmetric ring or grid.
- Expanding rings and traveling light pulses to represent tremors and detected movement.
- Color used semantically: amber/gold for HYPERMOLE's own signals and core, cyan for movement/trace/flow, green for verified states, red only for anomalies.
