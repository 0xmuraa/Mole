"use client";

import { useEffect, useRef, useState } from "react";

type Props = {
  /** Full text to copy (always the complete value, never a shortened one). */
  text: string;
  label: string;
  copiedLabel?: string;
  className?: string;
  /** How long the copied state stays visible, in ms. */
  resetAfter?: number;
};

async function copyText(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    /* fall through to the legacy path */
  }
  try {
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.setAttribute("readonly", "");
    ta.style.position = "fixed";
    ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand("copy");
    document.body.removeChild(ta);
    return ok;
  } catch {
    return false;
  }
}

export default function CopyButton({ text, label, copiedLabel = "COPIED ✓", className, resetAfter = 2000 }: Props) {
  const [copied, setCopied] = useState(false);
  const timer = useRef<number | null>(null);

  useEffect(
    () => () => {
      if (timer.current) window.clearTimeout(timer.current);
    },
    []
  );

  const onClick = async () => {
    const ok = await copyText(text);
    if (!ok) return;
    setCopied(true);
    if (timer.current) window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setCopied(false), resetAfter);
  };

  return (
    <button type="button" className={className} onClick={onClick} aria-live="polite" data-copied={copied || undefined}>
      {copied ? copiedLabel : label}
    </button>
  );
}
