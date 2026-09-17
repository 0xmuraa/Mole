import Image from "next/image";
import styles from "./Footer.module.css";
import { navLinks, socials, site } from "@/config/project";

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <div className="container">
        <div className={styles.top}>
          <div className={styles.brand}>
            <Image
              src="/assets/mole-avatar.png"
              alt="MOLE"
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
          <span className={styles.bottomLine}>BUILT BELOW THE SURFACE.</span>
          <span className={styles.stage}>EARLY DEVELOPMENT</span>
        </div>
      </div>
    </footer>
  );
}
