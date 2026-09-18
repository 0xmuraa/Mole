import styles from "./HowItWorks.module.css";

const WAVE =
  "M0 22 L12 22 L18 16 L24 28 L30 22 L48 22 L54 8 L60 36 L66 22 L86 22 L92 18 L98 26 L104 22 L128 22 L134 12 L140 32 L146 22 L170 22 L176 20 L182 24 L188 22 L200 22";

function MonitorVisual() {
  return (
    <div className={`${styles.visual} ${styles.visualWave}`}>
      <svg viewBox="0 0 200 44" preserveAspectRatio="none" aria-hidden>
        <g className={styles.waveTrack}>
          <path d={WAVE} className={styles.wavePath} />
          <path d={WAVE} className={styles.wavePath} transform="translate(200 0)" />
        </g>
      </svg>
    </div>
  );
}

function TraceVisual() {
  const nodes = [
    [22, 18],
    [78, 12],
    [90, 46],
    [66, 70],
    [20, 62],
    [8, 40],
  ];
  return (
    <div className={styles.visual}>
      <svg viewBox="0 0 100 80" aria-hidden>
        {nodes.map(([x, y], i) => (
          <line
            key={`l${i}`}
            x1={50}
            y1={40}
            x2={x}
            y2={y}
            className={styles.traceLine}
            style={{ animationDelay: `${i * 0.35}s` }}
          />
        ))}
        {nodes.map(([x, y], i) => (
          <circle
            key={`n${i}`}
            cx={x}
            cy={y}
            r={2.6}
            className={styles.traceNode}
            style={{ animationDelay: `${i * 0.35}s` }}
          />
        ))}
        <circle cx={50} cy={40} r={4.2} className={styles.traceCore} />
      </svg>
    </div>
  );
}

function DetectVisual() {
  return (
    <div className={`${styles.visual} ${styles.visualRadar}`}>
      <svg viewBox="0 0 100 80" aria-hidden>
        <circle cx={50} cy={40} r={34} className={styles.ring} />
        <circle cx={50} cy={40} r={23} className={styles.ring} />
        <circle cx={50} cy={40} r={12} className={styles.ring} />
        <circle cx={50} cy={40} r={2} className={styles.ringCore} />
        <circle cx={68} cy={26} r={2.2} className={styles.blip} />
        <circle cx={34} cy={54} r={2.2} className={styles.blip} style={{ animationDelay: "0.9s" }} />
        <circle cx={58} cy={58} r={2.2} className={styles.blip} style={{ animationDelay: "1.7s" }} />
        <circle cx={50} cy={40} r={6} className={styles.pulseRing} />
      </svg>
      <span className={styles.sweep} />
    </div>
  );
}

function SurfaceVisual() {
  const items = ["NEW EPICENTER", "FUNDING ROUTE", "FLOW ACCELERATING", "INDEPENDENT PATHS"];
  return (
    <div className={`${styles.visual} ${styles.visualList}`}>
      {items.map((t, i) => (
        <div key={t} className={styles.signalRow} style={{ animationDelay: `${i * 0.6}s` }}>
          <span className={styles.signalDot} />
          <span className={styles.signalText}>{t}</span>
          <span className={styles.signalBar} style={{ width: `${34 + i * 14}%` }} />
        </div>
      ))}
    </div>
  );
}

const steps = [
  {
    num: "01",
    title: "MONITOR",
    copy: "Watch real-time onchain activity across wallets, contracts and markets.",
    badge: "LIVE INGESTION",
    visual: <MonitorVisual />,
  },
  {
    num: "02",
    title: "TRACE",
    copy: "Map wallet relationships, funding routes and cross-cluster movement.",
    badge: "WALLET GRAPH",
    visual: <TraceVisual />,
  },
  {
    num: "03",
    title: "DETECT",
    copy: "Measure acceleration, convergence and emerging epicenters.",
    badge: "SEISMIC SIGNALS",
    visual: <DetectVisual />,
  },
  {
    num: "04",
    title: "SURFACE",
    copy: "Turn independent activity into clear, actionable signals.",
    badge: "ACTIONABLE INTEL",
    visual: <SurfaceVisual />,
  },
];

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="section">
      <div className="container">
        <div className={styles.head}>
          <div>
            <span className="eyebrow">HOW IT WORKS</span>
            <h2 className="h2">HOW HYPERMOLE WORKS</h2>
            <p className={styles.subline}>
              Public activity goes in.
              <br />
              Seismic structure comes out.
            </p>
          </div>
          <p className="lead">
            HYPERMOLE maps wallet activity, funding paths and emerging convergence before it
            becomes obvious on the surface.
          </p>
        </div>

        <div className={styles.flow}>
          {steps.map((s, i) => (
            <div key={s.num} className={styles.card}>
              <div className={styles.cardTop}>
                <span className={styles.num}>{s.num}</span>
                <span className={`tag ${styles.badge}`}>{s.badge}</span>
              </div>
              {s.visual}
              <h3 className={styles.title}>{s.title}</h3>
              <p className={styles.copy}>{s.copy}</p>
              {i < steps.length - 1 && (
                <span className={styles.connector} aria-hidden>
                  →
                </span>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
