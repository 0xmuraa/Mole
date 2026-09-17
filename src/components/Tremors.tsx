"use client";

import { useEffect, useState } from "react";
import styles from "./Tremors.module.css";
import { tremorRows } from "@/data/seismic";

export default function Tremors() {
  const [rows, setRows] = useState(tremorRows);
  const [gen, setGen] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setRows((prev) => [prev[prev.length - 1], ...prev.slice(0, prev.length - 1)]);
      setGen((g) => g + 1);
    }, 4500);
    return () => clearInterval(timer);
  }, []);

  return (
    <section id="tremors" className={styles.section}>
      <div className="container">
        <div className={styles.headRow}>
          <div className={styles.head}>
            <span className={styles.eyebrow}>TREMORS</span>
            <h2 className={styles.headline}>WHERE ACTIVITY IS STARTING TO MOVE.</h2>
          </div>
          <span className={styles.demoBadge}>DEMO DATA</span>
        </div>

        <div className={styles.panel}>
          <div className={styles.scroll}>
            <table className={styles.table} key={gen}>
              <thead>
                <tr>
                  <th>AGE</th>
                  <th>TYPE</th>
                  <th>MAGNITUDE</th>
                  <th>CONVERGENCE</th>
                  <th>NODES</th>
                  <th>STATE</th>
                </tr>
              </thead>
              <tbody className={styles.rowsIn}>
                {rows.map((row) => (
                  <tr key={row.id}>
                    <td className={styles.age}>{row.age}</td>
                    <td className={styles.type}>{row.type}</td>
                    <td className={styles.magnitude}>{row.magnitude}</td>
                    <td className={styles.convergence}>{row.convergence}</td>
                    <td>{row.nodes}</td>
                    <td>
                      <span className={`${styles.stateBadge} ${styles[`state${row.state}`]}`}>
                        {row.state}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className={styles.footer}>Illustrative demo data. Not live Robinhood Chain activity.</p>
        </div>
      </div>
    </section>
  );
}
