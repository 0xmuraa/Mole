import styles from "./PageBackdrop.module.css";

// Fixed, very low-opacity layer that gives the whole page one continuous
// "seismic" environment: orbital arcs, a faint dot grid and a few amber
// intersection points. Sections are transparent so it shows through.
export default function PageBackdrop() {
  return (
    <div className={styles.backdrop} aria-hidden>
      <div className={styles.dots} />
      <svg className={styles.svg} viewBox="0 0 1600 1000" preserveAspectRatio="xMidYMid slice" fill="none">
        <ellipse cx="820" cy="520" rx="760" ry="420" stroke="#38D7ED" strokeOpacity="0.07" />
        <ellipse cx="820" cy="520" rx="560" ry="300" stroke="#38D7ED" strokeOpacity="0.05" />
        <ellipse cx="820" cy="520" rx="980" ry="560" stroke="#FFB83C" strokeOpacity="0.045" />
        <path d="M -100 760 C 300 700, 520 860, 900 780 S 1400 640, 1750 720" stroke="#38D7ED" strokeOpacity="0.08" />
        <path d="M -100 220 C 260 300, 480 160, 760 240 S 1200 380, 1750 260" stroke="#38D7ED" strokeOpacity="0.06" />
        <path d="M 1100 -50 C 1180 220, 1000 420, 1140 640 S 1280 900, 1180 1050" stroke="#FFB83C" strokeOpacity="0.06" />
        <circle cx="760" cy="240" r="2.5" fill="#FFB83C" fillOpacity="0.5" />
        <circle cx="900" cy="780" r="2.5" fill="#FFB83C" fillOpacity="0.45" />
        <circle cx="1140" cy="640" r="2" fill="#FFB83C" fillOpacity="0.4" />
        <circle cx="260" cy="300" r="2" fill="#38D7ED" fillOpacity="0.35" />
        <circle cx="1400" cy="640" r="2" fill="#38D7ED" fillOpacity="0.35" />
      </svg>
    </div>
  );
}
