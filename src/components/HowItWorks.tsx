import styles from "./HowItWorks.module.css";

const stages = [
  { num: "01", title: "MONITOR", desc: "Watch public chain activity." },
  { num: "02", title: "TRACE", desc: "Map wallet and funding relationships." },
  { num: "03", title: "DETECT", desc: "Measure acceleration and convergence." },
  { num: "04", title: "SURFACE", desc: "Show tremors before activity becomes obvious." },
];

export default function HowItWorks() {
  return (
    <section id="how-it-works" className={styles.section}>
      <div className="container">
        <div className={styles.head}>
          <span className={styles.eyebrow}>HOW IT WORKS</span>
          <h2 className={styles.headline}>HOW HYPERMOLE WORKS</h2>
          <p className={styles.sub}>Public activity goes in. Seismic structure comes out.</p>
        </div>

        <div className={styles.flow}>
          {stages.map((stage, i) => (
            <div key={stage.num} className={styles.stage}>
              <span className={styles.num}>{stage.num}</span>
              <span className={styles.title}>{stage.title}</span>
              <p className={styles.desc}>{stage.desc}</p>
              {i < stages.length - 1 && (
                <span className={styles.arrow} aria-hidden>
                  →
                </span>
              )}
            </div>
          ))}
        </div>

        <div className={styles.statement}>
          <p className={styles.statementBig}>
            HYPERMOLE DOESN&apos;T START WITH PRICE.
            <br />
            IT STARTS WITH MOVEMENT.
          </p>
          <p className={styles.statementSmall}>
            Wallets wake. Funding routes change. Independent activity converges. HYPERMOLE turns
            that movement into a readable seismic map.
          </p>
        </div>
      </div>
    </section>
  );
}
