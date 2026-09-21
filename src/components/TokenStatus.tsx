import styles from "./TokenStatus.module.css";
import CopyButton from "./CopyButton";
import { token, isTokenLive } from "@/config/project";

export default function TokenStatus() {
  return (
    <section id="token" className={styles.section}>
      <div className="container">
        <div className={styles.panel}>
          <span className={styles.eyebrow}>HYPERMOLE TOKEN</span>

          {isTokenLive ? (
            <>
              <h2 className={styles.headline}>{token.ticker}</h2>
              <span className={`${styles.statusBadge} ${styles.statusLive}`}>
                <span className={`${styles.statusDot} ${styles.statusDotLive}`} />
                {token.chainLabel}
              </span>
              <span className={styles.caLabel}>OFFICIAL CONTRACT ADDRESS</span>
              <code className={styles.ca}>{token.contractAddress}</code>
              <div className={styles.actions}>
                <CopyButton
                  text={token.contractAddress}
                  label="COPY CONTRACT"
                  copiedLabel="COPIED ✓"
                  className="btnPrimary"
                />
                {token.explorerUrl && (
                  <a href={token.explorerUrl} target="_blank" rel="noopener noreferrer" className="btnSecondary">
                    EXPLORER ↗
                  </a>
                )}
              </div>
            </>
          ) : (
            <>
              <h2 className={styles.headline}>NOT LIVE YET</h2>
              <span className={styles.statusBadge}>
                <span className={styles.statusDot} />
                NO CONTRACT DEPLOYED
              </span>
              <p className={styles.sub}>
                The official contract address will only appear here after a real deployment
                exists.
              </p>
            </>
          )}
        </div>
      </div>
    </section>
  );
}
