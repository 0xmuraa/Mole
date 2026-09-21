import Image from "next/image";
import styles from "./TokenCover.module.css";
import { site } from "@/config/project";

/**
 * HYPERMOLE token hero screen.
 *
 * One full-screen composition: the pixel mole in the middle of an animated
 * seismic / data field, the name top-left, the slogan at the bottom. Nothing
 * else. Every animation is CSS (deterministic under the frame-stepped
 * recorder) and starts immediately.
 *
 * The SVG field uses a 1000x1000 viewBox centred at (500,500).
 */

// Deterministic particle layout (golden-angle spiral over 4 orbit bands)
const PARTICLES = Array.from({ length: 56 }, (_, i) => {
  const band = i % 4;
  const radius = [286, 338, 396, 452][band] + ((i * 7) % 5) * 3;
  const angle = (i * 137.508) % 360;
  const size = 2.6 + ((i * 13) % 7) * 0.45;
  const cyan = i % 3 !== 0; // roughly 2/3 cyan, 1/3 amber
  return { band, radius, angle, size, cyan };
});

// fast tiny sparks on an inner band
const SPARKS = Array.from({ length: 14 }, (_, i) => ({
  radius: 246 + (i % 3) * 9,
  angle: (i * 360) / 14 + (i % 2) * 11,
  size: 1.8 + (i % 3) * 0.5,
}));

const BAND_CLASS = [styles.bandA, styles.bandB, styles.bandC, styles.bandD];

export default function TokenCover() {
  return (
    <main className={styles.cover}>
      {/* background: grid, depth, glows, vignette */}
      <div className={styles.grid} aria-hidden />
      <div className={`${styles.glow} ${styles.glowAmber}`} aria-hidden />
      <div className={`${styles.glow} ${styles.glowCyan}`} aria-hidden />
      <div className={styles.vignette} aria-hidden />

      {/* name */}
      <header className={styles.brand}>
        <h1 className={styles.name}>{site.name}</h1>
        <div className={`${styles.chain} mono`}>
          <span className={styles.chainDot} aria-hidden />
          ROBINHOOD CHAIN
        </div>
      </header>

      {/* centre: field + mole */}
      <div className={styles.stage}>
        <svg className={styles.field} viewBox="0 0 1000 1000" aria-hidden>
          <defs>
            <linearGradient id="cv-trail" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0" stopColor="#38d7ed" stopOpacity="0" />
              <stop offset="0.7" stopColor="#38d7ed" stopOpacity="0.9" />
              <stop offset="1" stopColor="#dffbff" stopOpacity="1" />
            </linearGradient>
            <radialGradient id="cv-core" cx="0.5" cy="0.5" r="0.5">
              <stop offset="0" stopColor="#ffb83c" stopOpacity="0.55" />
              <stop offset="0.45" stopColor="#ffb83c" stopOpacity="0.14" />
              <stop offset="1" stopColor="#ffb83c" stopOpacity="0" />
            </radialGradient>
          </defs>

          {/* breathing core glow */}
          <circle className={styles.core} cx="500" cy="500" r="330" fill="url(#cv-core)" />

          {/* seismic rings expanding from the centre */}
          <g className={styles.rings}>
            <circle className={`${styles.ring} ${styles.ring1}`} cx="500" cy="500" r="300" />
            <circle className={`${styles.ring} ${styles.ring2}`} cx="500" cy="500" r="300" />
            <circle className={`${styles.ring} ${styles.ring3}`} cx="500" cy="500" r="300" />
          </g>

          {/* occasional amber pulse */}
          <circle className={styles.pulse} cx="500" cy="500" r="300" />

          {/* amber orbital lines, slow rotation, occasional shift */}
          <g className={styles.orbits}>
            <g className={`${styles.orbit} ${styles.orbitA}`}>
              <ellipse cx="500" cy="500" rx="470" ry="180" />
            </g>
            <g className={`${styles.orbit} ${styles.orbitB}`}>
              <ellipse cx="500" cy="500" rx="440" ry="250" />
            </g>
            <g className={`${styles.orbit} ${styles.orbitC}`}>
              <ellipse cx="500" cy="500" rx="360" ry="360" />
            </g>
          </g>

          {/* rotating partial arcs */}
          <g className={`${styles.arc} ${styles.arcA}`}>
            <circle cx="500" cy="500" r="418" pathLength="100" />
          </g>
          <g className={`${styles.arc} ${styles.arcB}`}>
            <circle cx="500" cy="500" r="466" pathLength="100" />
          </g>

          {/* cyan data trails: comets running around two bands */}
          <g className={`${styles.trailSpin} ${styles.trailA}`}>
            <circle className={`${styles.trail} ${styles.trailTail}`} cx="500" cy="500" r="365" pathLength="100" />
            <circle className={`${styles.trail} ${styles.trailHead}`} cx="500" cy="500" r="365" pathLength="100" />
          </g>
          <g className={`${styles.trailSpin} ${styles.trailB}`}>
            <circle className={`${styles.trail} ${styles.trailTail}`} cx="500" cy="500" r="428" pathLength="100" />
            <circle className={`${styles.trail} ${styles.trailHead}`} cx="500" cy="500" r="428" pathLength="100" />
          </g>
          <g className={`${styles.trailSpin} ${styles.trailC}`}>
            <circle className={`${styles.trail} ${styles.trailTail}`} cx="500" cy="500" r="298" pathLength="100" />
            <circle className={`${styles.trail} ${styles.trailHead}`} cx="500" cy="500" r="298" pathLength="100" />
          </g>

          {/* particles on 4 counter-rotating bands + fast sparks */}
          {BAND_CLASS.map((cls, band) => (
            <g key={band} className={`${styles.band} ${cls}`}>
              {PARTICLES.filter((p) => p.band === band).map((p, i) => (
                <circle
                  key={i}
                  className={p.cyan ? styles.dotCyan : styles.dotAmber}
                  cx={500 + p.radius * Math.cos((p.angle * Math.PI) / 180)}
                  cy={500 + p.radius * Math.sin((p.angle * Math.PI) / 180)}
                  r={p.size}
                />
              ))}
            </g>
          ))}
          <g className={`${styles.band} ${styles.sparks}`}>
            {SPARKS.map((p, i) => (
              <circle
                key={i}
                className={styles.dotSpark}
                cx={500 + p.radius * Math.cos((p.angle * Math.PI) / 180)}
                cy={500 + p.radius * Math.sin((p.angle * Math.PI) / 180)}
                r={p.size}
              />
            ))}
          </g>
        </svg>

        <div className={styles.halo} aria-hidden />
        <Image
          src="/assets/mole-mascot.png"
          alt="HYPERMOLE mole"
          width={1254}
          height={1254}
          priority
          className={styles.mole}
        />
      </div>

      {/* slogan */}
      <footer className={styles.bottom}>
        <p className={styles.slogan}>MOVEMENT STARTS BELOW.</p>
        <p className={`${styles.tag} mono`}>ONCHAIN SEISMIC RADAR</p>
      </footer>
    </main>
  );
}
