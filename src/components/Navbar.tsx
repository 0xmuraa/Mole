"use client";

import { useState } from "react";
import Image from "next/image";
import styles from "./Navbar.module.css";
import { navLinks, socials, site } from "@/config/project";

export default function Navbar() {
  const [open, setOpen] = useState(false);

  return (
    <header className={styles.nav}>
      <div className={`container ${styles.inner}`}>
        <a href="#top" className={styles.brand} onClick={() => setOpen(false)}>
          <Image
            src="/assets/mole-avatar.png"
            alt="HYPERMOLE"
            width={30}
            height={30}
            className={`${styles.avatar} pixelSharp`}
          />
          <span className={styles.brandText}>
            <span className={styles.wordmark}>{site.name}</span>
            <span className={`${styles.subline} mono`}>ONCHAIN SEISMIC RADAR</span>
          </span>
        </a>

        <nav className={styles.center}>
          {navLinks.map((link) => (
            <a
              key={link.label}
              href={link.href}
              className={styles.navLink}
              target={link.external ? "_blank" : undefined}
              rel={link.external ? "noopener noreferrer" : undefined}
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div className={styles.right}>
          <a
            href={site.repo}
            target="_blank"
            rel="noopener noreferrer"
            className={styles.iconLink}
          >
            GITHUB <span aria-hidden>↗</span>
          </a>
          {socials.x ? (
            <a
              href={socials.x}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.iconLink}
            >
              X <span aria-hidden>↗</span>
            </a>
          ) : (
            <span className={styles.iconLinkDisabled} title="Not available yet">
              X · SOON
            </span>
          )}
          <button
            type="button"
            className={styles.menuButton}
            onClick={() => setOpen((v) => !v)}
            aria-label="Toggle menu"
            aria-expanded={open}
          >
            {open ? "✕" : "☰"}
          </button>
        </div>
      </div>

      {open && (
        <div className={`container ${styles.mobileMenu}`}>
          {navLinks.map((link) => (
            <a
              key={link.label}
              href={link.href}
              className={styles.mobileLink}
              target={link.external ? "_blank" : undefined}
              rel={link.external ? "noopener noreferrer" : undefined}
              onClick={() => setOpen(false)}
            >
              {link.label}
            </a>
          ))}
        </div>
      )}
    </header>
  );
}
