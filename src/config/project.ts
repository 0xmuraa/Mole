// Central project configuration.
// This is the single place that controls whether token-related UI renders.
// Flip `tokenLive` to true and fill in the fields once a real deployment exists.
// Nothing else in the codebase should hardcode token state.

export type TokenConfig = {
  tokenLive: boolean;
  contractAddress: string;
  buyUrl: string;
  chartUrl: string;
};

export const token: TokenConfig = {
  tokenLive: false,
  contractAddress: "",
  buyUrl: "",
  chartUrl: "",
};

export type SocialLinks = {
  github: string;
  x: string | null;
};

export const socials: SocialLinks = {
  github: "https://github.com/0xmuraa/Mole",
  x: "https://x.com/0x_mura",
};

export type NavLink = {
  label: string;
  href: string;
  external?: boolean;
};

// All links resolve to a real, working destination: either an in-page
// section (the closest available preview of that future product page) or
// the real docs folder on GitHub. None of these are placeholder/dead links.
export const navLinks: NavLink[] = [
  { label: "TERMINAL", href: "/terminal" },
  { label: "TREMORS", href: "#tremors" },
  { label: "HOW IT WORKS", href: "#how-it-works" },
  { label: "MAP", href: "#map" },
  { label: "DOCS", href: "https://github.com/0xmuraa/Mole/tree/main/docs", external: true },
];

export const site = {
  name: "HYPERMOLE",
  tagline: "Onchain Seismic Radar for Robinhood Chain",
  chain: "RH CHAIN",
  repo: "https://github.com/0xmuraa/Mole",
};
