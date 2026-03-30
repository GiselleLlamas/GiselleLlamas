import fs from "node:fs/promises";

const OUT_FILE = process.env.PERSONALITY_SVG || "github-metrics-16personalities.svg";

const W = 800;
const HEADER_H = 78;

const TRAITS = [
  { name: "Tactics",  sub: "Judging",     pct: 90, color: "#6366f1" },
  { name: "Mind",     sub: "Intuitive",   pct: 89, color: "#8b5cf6" },
  { name: "Energy",   sub: "Introverted", pct: 71, color: "#0ea5e9" },
  { name: "Nature",   sub: "Thinking",    pct: 61, color: "#10b981" },
  { name: "Identity", sub: "Balanced",    pct: 51, color: "#f59e0b" },
];

const STRENGTHS = [
  "Vision-driven systems thinker",
  "High-structure planning & execution",
  "Pattern recognition & intuitive leaps",
  "Independent builder with high standards",
];

const QUOTE1 = "Man is a reed, the feeblest thing in nature \u2014";
const QUOTE2 = "but he is a thinking reed.  \u2014 Blaise Pascal";

const BAR_W = 250;
const TRAIT_STEP = 38;
const TRAITS_Y = HEADER_H + 30;

function esc(t) {
  return String(t ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function generateSvg() {
  const RP_X = 398;
  const RP_W = W - RP_X - 18;
  const RP_Y = HEADER_H + 14;
  const traitEnd = TRAITS_Y + TRAITS.length * TRAIT_STEP;
  const H = Math.max(traitEnd + 36, RP_Y + 260 + 36);

  let body = `  <defs>
    <linearGradient id="intj" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="#4f46e5"/>
      <stop offset="100%" stop-color="#7c3aed"/>
    </linearGradient>
  </defs>
  <rect width="${W}" height="${H}" rx="16" fill="#fafafa" stroke="#e5e7eb"/>
  <rect width="${W}" height="${HEADER_H}" rx="16" fill="url(#intj)"/>
  <rect y="${HEADER_H - 8}" width="${W}" height="8" fill="#fafafa"/>
  <text x="18" y="38" font-size="22" font-weight="800" fill="#ffffff">Personality Snapshot</text>
  <text x="18" y="62" font-size="13" fill="#c4b5fd">Giselle \u00B7 Architect \u00B7 INTJ-T</text>
  <text x="${W - 18}" y="62" text-anchor="end" font-size="12" font-weight="700" fill="#e0e7ff">90% Judging \u00B7 89% Intuitive</text>
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

  const rpH = H - RP_Y - 26;
  body += `
  <rect x="${RP_X}" y="${RP_Y}" width="${RP_W}" height="${rpH}" rx="12" fill="#f0f2ff" stroke="#dde1f7"/>
  <text x="${RP_X + 18}" y="${RP_Y + 20}" font-size="10" font-weight="700" fill="#6b7280" letter-spacing="1.5">KEY STRENGTHS</text>`;

  for (let i = 0; i < STRENGTHS.length; i++) {
    const sy = RP_Y + 38 + i * 36;
    body += `
  <circle cx="${RP_X + 18}" cy="${sy - 4}" r="3.5" fill="#6366f1"/>
  <text x="${RP_X + 30}" y="${sy}" font-size="12.5" fill="#1e1b4b">${esc(STRENGTHS[i])}</text>`;
  }

  const qy = RP_Y + 38 + STRENGTHS.length * 36 + 12;
  body += `
  <line x1="${RP_X + 14}" y1="${qy}" x2="${RP_X + RP_W - 14}" y2="${qy}" stroke="#c7d2fe" stroke-width="1"/>
  <text x="${RP_X + 18}" y="${qy + 18}" font-size="11" font-style="italic" fill="#4338ca">${esc(QUOTE1)}</text>
  <text x="${RP_X + 18}" y="${qy + 33}" font-size="11" font-style="italic" fill="#6366f1">${esc(QUOTE2)}</text>
  <text x="${W / 2}" y="${H - 10}" text-anchor="middle" font-size="10" fill="#9ca3af">16personalities.com/profiles/f210f18446ae3 \u00B7 updated by GitHub Actions</text>`;

  return `<?xml version="1.0" encoding="UTF-8"?>\n<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-label="16Personalities Personality Snapshot">\n${body}\n</svg>`;
}

async function main() {
  const svg = generateSvg();
  await fs.writeFile(OUT_FILE, `${svg}\n`, "utf8");
  console.log(`16P card written: ${OUT_FILE}`);
}

main().catch((err) => { console.error(err); process.exit(1); });
