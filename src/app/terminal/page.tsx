import type { Metadata } from "next";
import HyperMoleTerminal from "@/components/terminal/HyperMoleTerminal";

export const metadata: Metadata = {
  title: "HYPERMOLE Terminal — Seismic Observatory",
  description:
    "The HYPERMOLE seismic observatory: an illustrative simulation of wallet activity, funding routes and convergence across Robinhood Chain.",
};

export default function TerminalPage() {
  return <HyperMoleTerminal variant="page" labels="simulation" />;
}
