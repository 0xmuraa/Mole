import styles from "./Hero.module.css";
import SeismicRadar from "./SeismicRadar";
import { site } from "@/config/project";

export default function Hero() {
  return (
    <section id="top" className={styles.hero}>
      <div className={styles.backdrop} aria-hidden>
        <svg viewBox="0 0 1200 800" preserveAspectRatio="xMidYMid slice" fill="none">
          <path
            d="M -50 620 C 220 560, 340 700, 560 610 S 900 480, 1250 540"
            stroke="#25231E"
            strokeWidth="2"
          />
          <path
            d="M -50 180 C 260 260, 420 120, 680 210 S 1000 340, 1260 240"
            stroke="#25231E"
            strokeWidth="1.5"
          />
          <path
            d="M 700 -40 C 760 160, 640 260, 780 420 S 900 700, 820 840"
            stroke="#4FD9EB"
            strokeWidth="1"
            strokeOpacity="0.22"
          />
          <path
            d="M 60 460 L 130 460 L 160 400 L 195 510 L 230 440 L 265 460 L 340 460"
            stroke="#F2A63B"
            strokeWidth="1.2"
            strokeOpacity="0.28"
          />
          <circle cx="820" cy="420" r="3" fill="#F2A63B" fillOpacity="0.55" />
          <circle cx="560" cy="610" r="2.4" fill="#4FD9EB" fillOpacity="0.4" />
          <circle cx="680" cy="210" r="2" fill="#F2A63B" fillOpacity="0.35" />
        </svg>
      </div>

      <div className={`container ${styles.grid}`}>
        <div className={styles.left}>
          <span className={styles.eyebrow}>
            <span className={styles.eyebrowDot} aria-hidden />
            HYPERMOLE · {site.chain} · DEMO
          </span>

          <h1 className={styles.headline}>
            SEE WHAT MOVES
            <br />
            <span className={styles.headlineAccent}>BEFORE THE MARKET DOES.</span>
          </h1>

          <p className={styles.sub}>
            HYPERMOLE maps wallet activity, funding paths and emerging convergence across
            Robinhood Chain before it becomes obvious on the surface.
          </p>

          <div className={styles.ctaRow}>
            <a href="#terminal" className={styles.primaryBtn}>
              OPEN TERMINAL
            </a>
            <a href="#how-it-works" className={styles.secondaryBtn}>
              HOW IT WORKS
            </a>
            <a
              href={site.repo}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.githubLink}
            >
              VIEW GITHUB ↗
            </a>
          </div>

          <div className={styles.indicators}>
            <span className={styles.indicator}>ONCHAIN RADAR</span>
            <span className={styles.indicator}>CONVERGENCE MAP</span>
            <span className={styles.indicator}>DEMO MODE</span>
          </div>
        </div>

        <div className={styles.right}>
          <SeismicRadar />
        </div>
      </div>
    </section>
  );
}
