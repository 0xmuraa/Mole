import type { Metadata } from "next";
import TokenCover from "@/components/cover/TokenCover";

export const metadata: Metadata = {
  title: "HYPERMOLE — Movement starts below.",
  description: "HYPERMOLE. Onchain Seismic Radar for Robinhood Chain.",
};

export default function CoverPage() {
  return <TokenCover />;
}
