import Image from "next/image";
import styles from "./Footer.module.css";
import CopyButton from "./CopyButton";
import { navLinks, socials, site, token, isTokenLive, shortAddress } from "@/config/project";

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <div className="container">
        <div className={styles.top}>
          <div className={styles.brand}>
            <Image
              src="/assets/mole-avatar.png"
              alt="HYPERMOLE"
              width={28}
              height={28}
              className={`${styles.avatar} pixelSharp`}
            />
            <div>
              <div className={styles.brandName}>{site.name}</div>
              <p className={styles.brandTag}>{site.tagline}.</p>
            </div>
          </div>

          <div className={styles.linkCol}>
            {navLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                className={styles.link}
                target={link.external ? "_blank" : undefined}
                rel={link.external ? "noopener noreferrer" : undefined}
              >
                {link.label}
              </a>
            ))}
          </div>

          <div className={styles.linkCol}>
            <a href={site.repo} target="_blank" rel="noopener noreferrer" className={styles.link}>
              GITHUB ↗
            </a>
            {socials.x ? (
              <a href={socials.x} target="_blank" rel="noopener noreferrer" className={styles.link}>
                X ↗
              </a>
            ) : (
              <span className={styles.linkDisabled}>X · SOON</span>
            )}
          </div>
        </div>

        <div className={styles.bottom}>
          <span className={styles.bottomLine}>MOVEMENT STARTS BELOW THE SURFACE.</span>
          {isTokenLive && (
            <span className={styles.ca}>
              <span className={styles.caLabel}>CA</span>
              <span className={styles.caShort} title={token.contractAddress}>
                {shortAddress(token.contractAddress)}
              </span>
              <CopyButton
                text={token.contractAddress}
                label="COPY"
                copiedLabel="COPIED ✓"
                className={styles.caCopy}
              />
            </span>
          )}
          <span className={styles.stage}>{isTokenLive ? `${token.ticker} LIVE` : "EARLY DEVELOPMENT"}</span>
        </div>
      </div>
    </footer>
  );
}
