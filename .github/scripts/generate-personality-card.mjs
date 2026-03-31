import fs from "node:fs/promises";

const OUT_FILE = process.env.PERSONALITY_SVG || "github-metrics-16personalities.svg";

const W = 500;
const HEADER_H = 72;

const TRAITS = [
  { name: "Tactics",  sub: "Judging",     pct: 90, color: "#6366f1" },
  { name: "Mind",     sub: "Intuitive",   pct: 89, color: "#8b5cf6" },
  { name: "Energy",   sub: "Introverted", pct: 71, color: "#0ea5e9" },
  { name: "Nature",   sub: "Thinking",    pct: 61, color: "#10b981" },
  { name: "Identity", sub: "Balanced",    pct: 51, color: "#f59e0b" },
];

const BAR_W = 190;
const TRAIT_STEP = 31;
const TRAITS_Y = HEADER_H + 24;

function esc(t) {
  return String(t ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function generateSvg() {
  const traitEnd = TRAITS_Y + TRAITS.length * TRAIT_STEP;
  const H = traitEnd + 34;

  let body = `  <defs>
    <linearGradient id="intj" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="#4f46e5"/>
      <stop offset="100%" stop-color="#7c3aed"/>
    </linearGradient>
  </defs>
  <rect width="${W}" height="${H}" rx="16" fill="#fafafa" stroke="#e5e7eb"/>
  <rect width="${W}" height="${HEADER_H}" rx="16" fill="url(#intj)"/>
  <rect y="${HEADER_H - 8}" width="${W}" height="8" fill="#fafafa"/>
  <text x="18" y="36" font-size="20" font-weight="800" fill="#ffffff">Personality Snapshot</text>
  <text x="18" y="58" font-size="13" fill="#c4b5fd">Giselle \u00B7 Architect \u00B7 INTJ-T</text>
  <text x="${W - 18}" y="58" text-anchor="end" font-size="11" font-weight="700" fill="#e0e7ff">90% Judging \u00B7 89% Intuitive</text>
  <text x="18" y="${TRAITS_Y - 8}" font-size="10" font-weight="700" fill="#6b7280" letter-spacing="1.5">TRAIT BREAKDOWN</text>`;

  for (let i = 0; i < TRAITS.length; i++) {
    const ty = TRAITS_Y + i * TRAIT_STEP;
    const fill = Math.round(BAR_W * TRAITS[i].pct / 100);
    body += `
  <text x="18" y="${ty + 12}" font-size="12" font-weight="700" fill="#374151">${esc(TRAITS[i].name)}</text>
  <text x="90" y="${ty + 12}" font-size="12" fill="#9ca3af">${esc(TRAITS[i].sub)}</text>
  <rect x="18" y="${ty + 17}" width="${BAR_W}" height="9" rx="4.5" fill="#e9ecf0"/>
  <rect x="18" y="${ty + 17}" width="${fill}" height="9" rx="4.5" fill="${TRAITS[i].color}"/>
  <text x="${18 + BAR_W + 8}" y="${ty + 25}" font-size="11" font-weight="700" fill="${TRAITS[i].color}">${TRAITS[i].pct}%</text>`;
  }
  body += `
  <text x="${W / 2}" y="${H - 10}" text-anchor="middle" font-size="10" fill="#9ca3af">updated by GitHub Actions</text>`;

  return `<?xml version="1.0" encoding="UTF-8"?>\n<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-label="16Personalities Personality Snapshot">\n${body}\n</svg>`;
}

async function main() {
  const svg = generateSvg();
  await fs.writeFile(OUT_FILE, `${svg}\n`, "utf8");
  console.log(`16P card written: ${OUT_FILE}`);
}

main().catch((err) => { console.error(err); process.exit(1); });
