import styles from "./HowItWorks.module.css";

const stages = [
  { num: "01", title: "DIG", desc: "Watch public Robinhood Chain activity." },
  { num: "02", title: "TRACE", desc: "Map movement and funding relationships." },
  { num: "03", title: "CONNECT", desc: "Group related activity into tunnels and burrows." },
  { num: "04", title: "SURFACE", desc: "Turn noteworthy patterns into readable MOLE signals." },
];

export default function HowItWorks() {
  return (
    <section id="how-it-works" className={styles.section}>
      <div className="container">
        <div className={styles.head}>
          <span className={styles.eyebrow}>HOW IT WORKS</span>
          <h2 className={styles.headline}>HOW MOLE WORKS</h2>
          <p className={styles.sub}>Public activity goes in. An underground map comes out.</p>
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
      </div>
    </section>
  );
}
