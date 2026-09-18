import Link from "next/link";
import styles from "./TerminalSection.module.css";
import HyperMoleTerminal from "./terminal/HyperMoleTerminal";
import { site } from "@/config/project";

const FEATURES = [
  {
    title: "WALLETS",
    copy: "Track smart money and entity behavior.",
    icon: (
      <svg viewBox="0 0 20 20" aria-hidden>
        <rect x="2.5" y="5" width="15" height="11" rx="2" />
        <path d="M13 10.5h4.5M2.5 8h15" />
      </svg>
    ),
  },
  {
    title: "FUNDING ROUTES",
    copy: "Trace capital movement and hidden relationships.",
    icon: (
      <svg viewBox="0 0 20 20" aria-hidden>
        <circle cx="4" cy="15" r="2" />
        <circle cx="16" cy="5" r="2" />
        <path d="M6 14c4-1 5-7 8-8" />
      </svg>
    ),
  },
  {
    title: "CONVERGENCE",
    copy: "Spot independent activity moving toward the same entity.",
    icon: (
      <svg viewBox="0 0 20 20" aria-hidden>
        <circle cx="10" cy="10" r="2.2" />
        <path d="M3 3l4.5 4.5M17 3l-4.5 4.5M3 17l4.5-4.5M17 17l-4.5-4.5" />
      </svg>
    ),
  },
  {
    title: "SEISMIC SIGNALS",
    copy: "Measure acceleration before it becomes obvious.",
    icon: (
      <svg viewBox="0 0 20 20" aria-hidden>
        <path d="M2 10h3l2-4 3 8 3-6 2 2h3" />
      </svg>
    ),
  },
];

// Homepage block: intro + the real flagship terminal, embedded. It runs the
// same SeismicEngine as /terminal — there is no separate homepage simulation.
export default function TerminalSection() {
  return (
    <section id="terminal" className="section">
      <div className="container">
        <div className={styles.intro}>
          <div className={styles.introText}>
            <span className="eyebrow">THE TERMINAL</span>
            <h2 className="h2">
              THE TERMINAL IS WHERE
              <br />
              EVERYTHING <em>CONNECTS</em>
            </h2>
            <p className={styles.triLine}>
              Real-time data.
              <br />
              Deeper context.
              <br />
              Clearer edges.
            </p>
            <p className="lead">
              The HYPERMOLE terminal brings together wallets, funding routes, convergence and
              seismic signals in one interface so you can see what is moving before the market
              does.
            </p>
            <div className={styles.introActions}>
              <Link href="/terminal" className="btnPrimary">
                OPEN TERMINAL
              </Link>
              <a href={site.repo} target="_blank" rel="noopener noreferrer" className="btnSecondary">
                VIEW GITHUB
              </a>
            </div>
          </div>

          <div className={styles.features}>
            {FEATURES.map((f) => (
              <div key={f.title} className={styles.feature}>
                <span className={styles.featureIcon}>{f.icon}</span>
                <div className={styles.featureText}>
                  <span className={styles.featureTitle}>{f.title}</span>
                  <span className={styles.featureCopy}>{f.copy}</span>
                </div>
                <span className={styles.featureArrow} aria-hidden>
                  →
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className={styles.wide}>
        <HyperMoleTerminal variant="embedded" labels="public" />
      </div>
    </section>
  );
}
