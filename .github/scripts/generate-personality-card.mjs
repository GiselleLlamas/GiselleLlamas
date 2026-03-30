import fs from "node:fs/promises";

const OUT_FILE = process.env.PERSONALITY_SVG || "github-metrics-16personalities.svg";

const profile = {
  owner: "Giselle",
  type: "INTJ-T",
  label: "Architect",
  traits: [
    { name: "Mind", value: "89% Intuitive" },
    { name: "Tactics", value: "90% Judging" },
    { name: "Energy", value: "71% Introverted" },
    { name: "Nature", value: "61% Thinking" },
    { name: "Identity", value: "51% balanced" },
  ],
  highlights: [
    "Top strengths: 90% Judging and 89% Intuitive",
    "Vision + pragmatism in one profile",
    "Strategic, systems-first problem solving",
    "Independent builder with high standards",
    "High-structure planning with strong pattern recognition",
  ],
  quote:
    "Thought constitutes the greatness of man. Man is a reed, the feeblest thing in nature, but he is a thinking reed.",
};

function escapeXml(text) {
  return `${text || ""}`
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function traitLine(index, name, value) {
  const y = 146 + index * 34;
  return `\n  <text x="46" y="${y}" font-size="13" fill="#1f2a44"><tspan font-weight="700">${escapeXml(name)}:</tspan> ${escapeXml(value)}</text>`;
}

function highlightLine(index, value) {
  const y = 158 + index * 30;
  return `\n  <text x="492" y="${y}" font-size="13" fill="#3b4f67">• ${escapeXml(value)}</text>`;
}

function generateSvg() {
  const width = 928;
  const height = 430;
  let body = "";

  body += `\n  <defs>
    <linearGradient id="panel" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#fef9f2"/>
      <stop offset="100%" stop-color="#f6efe3"/>
    </linearGradient>
  </defs>`;
  body += `\n  <rect width="${width}" height="${height}" fill="#fffdfa"/>`;
  body += `\n  <rect x="16" y="16" width="${width - 32}" height="${height - 32}" rx="18" fill="url(#panel)" stroke="#eadfcf"/>`;

  body += `\n  <text x="36" y="58" font-size="30" font-weight="800" fill="#3a2f21">Personality Snapshot</text>`;
  body += `\n  <text x="36" y="84" font-size="14" fill="#6b5d4b">${escapeXml(profile.owner)} • ${escapeXml(profile.label)} (${escapeXml(profile.type)})</text>`;
  body += `\n  <text x="36" y="102" font-size="13" font-weight="700" fill="#3a2f21">Employer-facing strengths: 90% Judging • 89% Intuitive</text>`;

  body += `\n  <rect x="32" y="108" width="404" height="266" rx="14" fill="#ffffff" stroke="#eadfcf"/>`;
  body += `\n  <text x="46" y="132" font-size="16" font-weight="700" fill="#3a2f21">Trait Breakdown</text>`;
  for (let i = 0; i < profile.traits.length; i += 1) {
    body += traitLine(i, profile.traits[i].name, profile.traits[i].value);
  }

  body += `\n  <rect x="456" y="108" width="440" height="266" rx="14" fill="#ffffff" stroke="#eadfcf"/>`;
  body += `\n  <text x="472" y="132" font-size="16" font-weight="700" fill="#3a2f21">Interesting Tidbits</text>`;
  for (let i = 0; i < profile.highlights.length; i += 1) {
    body += highlightLine(i, profile.highlights[i]);
  }

  body += `\n  <text x="472" y="294" font-size="12" fill="#6b5d4b">${escapeXml(profile.quote)}</text>`;
  body += `\n  <a href="https://www.16personalities.com/profiles/f210f18446ae3" target="_blank" rel="noopener noreferrer">
    <rect x="650" y="326" width="226" height="38" rx="10" fill="#3a2f21"/>
    <text x="763" y="350" text-anchor="middle" font-size="13" font-weight="700" fill="#ffffff">Open Full 16Personalities Profile</text>
  </a>`;

  body += `\n  <text x="36" y="398" font-size="11" fill="#8a7963">Resilient fallback card so this section always renders even if plugin scraping breaks.</text>`;

  return `<?xml version="1.0" encoding="UTF-8"?>\n<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img" aria-label="16Personalities showcase card">${body}\n</svg>`;
}

async function main() {
  const svg = generateSvg();
  await fs.writeFile(OUT_FILE, `${svg}\n`, "utf8");
  console.log(`16Personalities fallback card generated: ${OUT_FILE}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});