import styles from "./LiveSeismicPanel.module.css";

// One period of a calm seismic trace. Rendered twice side by side and
// scrolled by exactly one period so the loop is seamless.
const TRACE =
  "M0 30 L14 30 L20 24 L26 36 L32 30 L52 30 L58 12 L64 46 L70 30 L92 30 L98 26 L104 34 L110 30 L134 30 L140 20 L146 40 L152 30 L176 30 L182 27 L188 33 L194 30 L214 30 L220 8 L226 50 L232 30 L256 30 L262 25 L268 35 L274 30 L300 30";

const METRICS = [
  { value: "103+", label: "WALLETS TRACKED" },
  { value: "7+", label: "MARKETS GROWING" },
  { value: "5", label: "FLOW WALLS" },
  { value: "4663", label: "CHAIN ID" },
];

export default function LiveSeismicPanel() {
  return (
    <div className={styles.panel}>
      <div className={styles.head}>
        <span className={styles.title}>
          <span className="liveDot" />
          LIVE SEISMIC ACTIVITY
        </span>
        <span className={styles.chain}>ROBINHOOD CHAIN</span>
      </div>

      <div className={styles.scope}>
        <svg className={styles.wave} viewBox="0 0 300 60" preserveAspectRatio="none" aria-hidden>
          <g className={styles.track}>
            <path d={TRACE} className={styles.trace} />
            <path d={TRACE} className={styles.trace} transform="translate(300 0)" />
          </g>
        </svg>
        <span className={styles.scanline} />
      </div>

      <div className={styles.metrics}>
        {METRICS.map((m) => (
          <div key={m.label} className={styles.metric}>
            <span className={styles.value}>{m.value}</span>
            <span className={styles.label}>{m.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
