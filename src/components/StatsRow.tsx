import styles from "./StatsRow.module.css";

const icons = {
  wallets: (
    <svg viewBox="0 0 20 20" aria-hidden>
      <rect x="2.5" y="5" width="15" height="11" rx="2" />
      <path d="M13 10.5h4.5M2.5 8h15" />
    </svg>
  ),
  markets: (
    <svg viewBox="0 0 20 20" aria-hidden>
      <path d="M2.5 15.5l4.5-5 3.5 3 6.5-8" />
      <path d="M13 5.5h4v4" />
    </svg>
  ),
  walls: (
    <svg viewBox="0 0 20 20" aria-hidden>
      <path d="M3 16.5h14M5 16.5v-6M9 16.5V5M13 16.5V8M17 16.5v-9" />
    </svg>
  ),
  queue: (
    <svg viewBox="0 0 20 20" aria-hidden>
      <circle cx="10" cy="10" r="7" />
      <path d="M10 6v4l2.5 2" />
    </svg>
  ),
};

const stats = [
  { icon: icons.wallets, value: "103+", label: "WALLETS TRACKED", sub: "Following smart money" },
  { icon: icons.markets, value: "7+", label: "MARKETS GROWING", sub: "New activity emerging" },
  { icon: icons.walls, value: "5", label: "FLOW WALLS", sub: "Significant movement" },
  { icon: icons.queue, value: "LIVE", label: "QUEUE", sub: "Monitoring for breakouts", live: true },
];

export default function StatsRow() {
  return (
    <div className={styles.wrap}>
      <div className={`container ${styles.row}`}>
        {stats.map((s) => (
          <div key={s.label} className={styles.cell}>
            <span className={styles.icon}>{s.icon}</span>
            <div className={styles.text}>
              <span className={`${styles.value} ${s.live ? styles.valueLive : ""}`}>
                {s.live && <span className="liveDot" />}
                {s.value}
              </span>
              <span className={styles.label}>{s.label}</span>
              <span className={styles.sub}>{s.sub}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
