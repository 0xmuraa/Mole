"use client";

import { useEffect, useState } from "react";
import styles from "./FreshDirt.module.css";
import { freshDirtRows } from "@/data/demo";

export default function FreshDirt() {
  const [rows, setRows] = useState(freshDirtRows);
  const [gen, setGen] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setRows((prev) => [prev[prev.length - 1], ...prev.slice(0, prev.length - 1)]);
      setGen((g) => g + 1);
    }, 7000);
    return () => clearInterval(timer);
  }, []);

  return (
    <section id="fresh-dirt" className={styles.section}>
      <div className="container">
        <div className={styles.headRow}>
          <div className={styles.head}>
            <span className={styles.eyebrow}>FRESH DIRT</span>
            <h2 className={styles.headline}>WHAT JUST MOVED UNDERGROUND?</h2>
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
                  <th>ENTITY</th>
                  <th>CONNECTIONS</th>
                  <th>DEPTH</th>
                  <th>MOLE SCORE</th>
                </tr>
              </thead>
              <tbody className={styles.rowsIn}>
                {rows.map((row) => (
                  <tr key={row.id}>
                    <td className={styles.age}>{row.age}</td>
                    <td className={styles.type}>{row.type}</td>
                    <td className={styles.entity}>{row.entity}</td>
                    <td>{row.connections}</td>
                    <td>{row.depth}</td>
                    <td>
                      <span className={styles.score}>
                        <span className={styles.scoreBar}>
                          <span
                            className={styles.scoreFill}
                            style={{ width: `${row.score}%` }}
                          />
                        </span>
                        <span className={styles.scoreNum}>{row.score}</span>
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
