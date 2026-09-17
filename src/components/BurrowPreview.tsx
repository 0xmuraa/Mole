import styles from "./BurrowPreview.module.css";
import { burrowCards } from "@/data/demo";

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
      <circle className={styles.graphNode} cx={cx} cy={cy} r={3} />
      {points.map((p, i) => (
        <circle key={`n-${i}`} className={styles.graphNode} cx={p.x} cy={p.y} r={2} />
      ))}
    </svg>
  );
}

export default function BurrowPreview() {
  return (
    <section id="burrows" className={styles.section}>
      <div className="container">
        <div className={styles.head}>
          <span className={styles.eyebrow}>BURROWS</span>
          <h2 className={styles.headline}>WALLETS RARELY MOVE ALONE.</h2>
          <p className={styles.sub}>
            MOLE groups related public activity into readable clusters called Burrows.
          </p>
        </div>

        <div className={styles.grid}>
          {burrowCards.map((burrow, i) => (
            <div key={burrow.id} className={styles.card}>
              <div className={styles.cardHead}>
                <span className={styles.cardLabel}>{burrow.label}</span>
                <span className={`${styles.activity} ${styles[`activity${burrow.activity}`]}`}>
                  {burrow.activity}
                </span>
              </div>

              <div className={styles.graphWrap}>
                <MiniGraph count={burrow.nodeCount} seed={i} />
              </div>

              <div className={styles.stats}>
                <div className={styles.stat}>
                  <span className={styles.statLabel}>NODES</span>
                  <span className={styles.statValue}>{burrow.nodeCount}</span>
                </div>
                <div className={styles.stat}>
                  <span className={styles.statLabel}>CONNECTIONS</span>
                  <span className={styles.statValue}>{burrow.connectionCount}</span>
                </div>
                <div className={styles.stat}>
                  <span className={styles.statLabel}>DEPTH</span>
                  <span className={styles.statValue}>{burrow.depth}</span>
                </div>
                <div className={styles.stat}>
                  <span className={styles.statLabel}>ACTIVITY</span>
                  <span className={styles.statValue}>{burrow.activity}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className={styles.ctaRow}>
          <span className={styles.cta}>EXPLORE BURROWS</span>
          <span className={styles.comingSoon}>COMING SOON</span>
        </div>
      </div>
    </section>
  );
}
