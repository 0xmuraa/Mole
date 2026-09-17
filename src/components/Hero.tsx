import styles from "./Hero.module.css";
import MoleTerminalPreview from "./MoleTerminalPreview";
import { site } from "@/config/project";

export default function Hero() {
  return (
    <section id="top" className={styles.hero}>
      <div className={styles.backdrop} aria-hidden>
        <svg viewBox="0 0 1200 800" preserveAspectRatio="xMidYMid slice" fill="none">
          <path
            d="M -50 620 C 220 560, 340 700, 560 610 S 900 480, 1250 540"
            stroke="#3A2817"
            strokeWidth="2"
          />
          <path
            d="M -50 180 C 260 260, 420 120, 680 210 S 1000 340, 1260 240"
            stroke="#3A2817"
            strokeWidth="1.5"
          />
          <path
            d="M 700 -40 C 760 160, 640 260, 780 420 S 900 700, 820 840"
            stroke="#F0A43A"
            strokeWidth="1"
            strokeOpacity="0.35"
          />
          <circle cx="820" cy="420" r="3" fill="#F0A43A" fillOpacity="0.6" />
          <circle cx="560" cy="610" r="2.4" fill="#FFD27A" fillOpacity="0.5" />
          <circle cx="680" cy="210" r="2" fill="#F0A43A" fillOpacity="0.4" />
        </svg>
      </div>

      <div className={`container ${styles.grid}`}>
        <div className={styles.left}>
          <span className={styles.eyebrow}>
            <span className={styles.eyebrowDot} aria-hidden />
            MOLE AGENT · {site.chain} · PREVIEW
          </span>

          <h1 className={styles.headline}>
            DIG DEEPER.
            <br />
            <span className={styles.headlineAccent}>SEE WHAT MOVES FIRST.</span>
          </h1>

          <p className={styles.sub}>
            MOLE maps wallet activity, funding paths and hidden connections beneath Robinhood
            Chain into one readable underground network.
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
            <span className={styles.indicator}>{site.chain}</span>
            <span className={styles.indicator}>UNDERGROUND MAP</span>
            <span className={styles.indicator}>DEMO MODE</span>
          </div>
        </div>

        <div className={styles.right}>
          <MoleTerminalPreview />
        </div>
      </div>
    </section>
  );
}
