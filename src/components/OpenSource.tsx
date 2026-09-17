import styles from "./OpenSource.module.css";
import { site } from "@/config/project";

export default function OpenSource() {
  return (
    <section className={styles.section}>
      <div className="container">
        <div className={styles.panel}>
          <span className={styles.eyebrow}>OPEN SOURCE</span>
          <h2 className={styles.headline}>
            READ THE CODE.
            <br />
            WATCH THE SYSTEM EVOLVE.
          </h2>
          <p className={styles.sub}>
            HYPERMOLE is being built in public. The repository contains the product concept,
            visual language, roadmap and implementation as it grows.
          </p>
          <div className={styles.actions}>
            <a
              href={site.repo}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.primary}
            >
              VIEW GITHUB ↗
            </a>
            <a
              href={`${site.repo}/tree/main/docs`}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.secondary}
            >
              READ DOCS
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
