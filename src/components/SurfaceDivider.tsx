import styles from "./SurfaceDivider.module.css";

export default function SurfaceDivider() {
  return (
    <div className={styles.divider} aria-hidden>
      <span className={styles.label}>
        SURFACE
        <span className={styles.arrow}>↓</span>
        UNDERGROUND
      </span>
    </div>
  );
}
