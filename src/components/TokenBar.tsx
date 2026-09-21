import styles from "./TokenBar.module.css";
import CopyButton from "./CopyButton";
import { token, isTokenLive, shortAddress } from "@/config/project";

/** Thin token strip above the navbar. Renders nothing until the token is live. */
export default function TokenBar() {
  if (!isTokenLive) return null;

  return (
    <div className={styles.bar}>
      <div className={`container ${styles.inner}`}>
        <span className={styles.live}>
          <span className={styles.dot} aria-hidden />
          {token.ticker} LIVE
        </span>
        <span className={styles.sep} aria-hidden />
        <span className={styles.ca}>
          <span className={styles.caLabel}>CA</span>
          <span className={styles.caShort} title={token.contractAddress}>
            {shortAddress(token.contractAddress)}
          </span>
        </span>
        <span className={styles.sep} aria-hidden />
        <CopyButton
          text={token.contractAddress}
          label="COPY CA"
          copiedLabel="COPIED ✓"
          className={styles.copy}
        />
      </div>
    </div>
  );
}
