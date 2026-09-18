import styles from "./FlowTicker.module.css";
import { tickerItems } from "@/data/seismic";

function TickerList({ ariaHidden }: { ariaHidden?: boolean }) {
  return (
    <ul className={styles.list} aria-hidden={ariaHidden}>
      {tickerItems.map((item) => {
        const tone = item.change > 0 ? styles.up : item.change < 0 ? styles.down : styles.flat;
        const sign = item.change > 0 ? "+" : "";
        return (
          <li key={item.symbol} className={styles.item}>
            <span className={styles.symbol}>{item.symbol}</span>
            <span className={styles.value}>{item.value}</span>
            <span className={`${styles.change} ${tone}`}>
              {sign}
              {item.change.toFixed(1)}%
            </span>
          </li>
        );
      })}
    </ul>
  );
}

export default function FlowTicker() {
  return (
    <div className={styles.ticker} role="region" aria-label="Live flow ticker">
      <div className={styles.label}>
        <svg className={styles.waveIcon} viewBox="0 0 28 14" aria-hidden>
          <path d="M0 7h5l3-5 4 10 4-8 3 5 2-2h7" />
        </svg>
        <span>LIVE FLOW</span>
      </div>
      <div className={styles.viewport}>
        <div className={styles.track}>
          <TickerList />
          <TickerList ariaHidden />
        </div>
      </div>
    </div>
  );
}
