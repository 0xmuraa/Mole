import styles from "./Epicenters.module.css";
import { epicenterCards } from "@/data/seismic";

function MiniGraph({ count, seed }: { count: number; seed: number }) {
  const cx = 50;
  const cy = 50;
  const points = Array.from({ length: count }).map((_, i) => {
    const angle = (i / count) * Math.PI * 2 + seed;
    const r = 26 + ((i * 7 + seed * 3) % 10);
    return {
      x: cx + Math.cos(angle) * r,
      y: cy + Math.sin(angle) * r * 0.62,
    };
  });

  return (
    <svg className={styles.graph} viewBox="0 0 100 62" aria-hidden>
      {points.map((p, i) => (
        <line key={`e-${i}`} className={styles.graphEdge} x1={cx} y1={cy} x2={p.x} y2={p.y} />
      ))}
      <circle className={styles.graphNodeCore} cx={cx} cy={cy} r={3} />
      {points.map((p, i) => (
        <circle key={`n-${i}`} className={styles.graphNode} cx={p.x} cy={p.y} r={2} />
      ))}
    </svg>
  );
}

export default function Epicenters() {
  return (
    <section id="map" className={styles.section}>
      <div className="container">
        <div className={styles.head}>
          <span className={styles.eyebrow}>EPICENTERS</span>
          <h2 className={styles.headline}>WHERE INDEPENDENT ACTIVITY MEETS.</h2>
          <p className={styles.sub}>
            HYPERMOLE groups independent public activity into visible epicenters.
          </p>
        </div>

        <div className={styles.grid}>
          {epicenterCards.map((card, i) => (
            <div key={card.id} className={styles.card}>
              <div className={styles.cardHead}>
                <span className={styles.cardLabel}>{card.label}</span>
                <span className={`${styles.status} ${styles[`status${card.status}`]}`}>
                  {card.status}
                </span>
              </div>

              <div className={styles.graphWrap}>
                <MiniGraph count={card.wallets} seed={i} />
              </div>

              <div className={styles.stats}>
                <div className={styles.stat}>
                  <span className={styles.statLabel}>MAGNITUDE</span>
                  <span className={`${styles.statValue} ${styles.statValueGold}`}>{card.magnitude}</span>
                </div>
                <div className={styles.stat}>
                  <span className={styles.statLabel}>CONVERGENCE</span>
                  <span className={`${styles.statValue} ${styles.statValueCyan}`}>{card.convergence}</span>
                </div>
                <div className={styles.stat}>
                  <span className={styles.statLabel}>WALLETS</span>
                  <span className={styles.statValue}>{card.wallets}</span>
                </div>
                <div className={styles.stat}>
                  <span className={styles.statLabel}>ROUTES</span>
                  <span className={styles.statValue}>{card.routes}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
