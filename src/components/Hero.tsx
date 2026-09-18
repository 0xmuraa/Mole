import styles from "./Hero.module.css";
import SeismicRadar from "./SeismicRadar";
import LiveSeismicPanel from "./LiveSeismicPanel";
import { site } from "@/config/project";

export default function Hero() {
  return (
    <section id="top" className={styles.hero}>
      <div className={`container ${styles.grid}`}>
        <div className={styles.left}>
          <LiveSeismicPanel />

          <h1 className={styles.headline}>
            SEE WHAT MOVES
            <br />
            <span className={styles.headlineAccent}>BEFORE THE</span>
            <br />
            MARKET DOES.
          </h1>

          <p className={styles.sub}>
            HYPERMOLE maps wallet activity, funding paths and emerging convergence across
            Robinhood Chain before it becomes obvious on the surface.
          </p>

          <div className={styles.ctaRow}>
            <a href="#terminal" className="btnPrimary">
              OPEN TERMINAL
            </a>
            <a href="#how-it-works" className="btnSecondary">
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
            <span className={styles.indicator}>SEISMIC LIVE</span>
          </div>
        </div>

        <div className={styles.right}>
          <SeismicRadar />
        </div>
      </div>
    </section>
  );
}
