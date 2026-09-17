import styles from "./TokenStatus.module.css";
import { token } from "@/config/project";

export default function TokenStatus() {
  const isLive = token.tokenLive && token.contractAddress.length > 0;

  return (
    <section className={styles.section}>
      <div className="container">
        <div className={styles.panel}>
          <span className={styles.eyebrow}>HYPERMOLE TOKEN</span>
          <h2 className={styles.headline}>{isLive ? "TOKEN LIVE" : "NOT LIVE YET"}</h2>

          {isLive ? (
            <>
              <span className={styles.statusBadge}>
                <span className={styles.statusDot} />
                CONTRACT VERIFIED
              </span>
              <p className={styles.sub}>{token.contractAddress}</p>
              {token.buyUrl && (
                <a href={token.buyUrl} target="_blank" rel="noopener noreferrer">
                  BUY
                </a>
              )}
            </>
          ) : (
            <>
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
