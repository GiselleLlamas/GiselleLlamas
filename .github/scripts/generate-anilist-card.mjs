import fs from "node:fs/promises";

const USER = process.env.ANILIST_USER || "ShiningMonster";
const OUT_FILE = process.env.ANILIST_SVG || "github-metrics-anilist.svg";

const DATA = {
  watching: [
    "Little Witch Academia (TV)",
    "Sousou no Frieren 2nd Season",
  ],
  completedAnime: [
    "Bubblegum Crisis",
    "Bubblegum Crisis TOKYO 2040",
    "Dandadan",
    "Dungeon Meshi",
  ],
  readingManga: [
    "Dandadan",
    "Berserk",
    "X",
  ],
  completedManga: [
    "Denei Shoujo",
    "Tokyo BABYLON",
    "Silent Mobius",
    "Shin Seiki Evangelion",
  ],
  recentActivity: [
    "Completed Matantei Loki Ragnarok",
    "Completed Matantei Loki",
    "Completed Bubblegum Crisis TOKYO 2040",
    "Completed Bubblegum Crisis",
  ],
  note:
    "AniList public API has intermittent 403 restrictions. This showcase keeps your profile section stable and aesthetic.",
};

function escapeXml(text) {
  return `${text || ""}`
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function listBlock(x, y, title, items, color) {
  let out = `\n  <rect x="${x}" y="${y}" width="430" height="106" rx="14" fill="#ffffff" stroke="#dbe4ee"/>`;
  out += `\n  <rect x="${x + 12}" y="${y + 14}" width="6" height="24" rx="3" fill="${color}"/>`;
  out += `\n  <text x="${x + 28}" y="${y + 32}" font-size="15" font-weight="700" fill="#13243a">${escapeXml(title)}</text>`;
  for (let i = 0; i < Math.min(items.length, 3); i += 1) {
    out += `\n  <text x="${x + 28}" y="${y + 56 + i * 18}" font-size="13" fill="#334155">• ${escapeXml(items[i])}</text>`;
  }
  return out;
}

function generateSvg() {
  const width = 928;
  const height = 510;

  let body = "";
  body += `\n  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#f5fbff"/>
      <stop offset="100%" stop-color="#ecf5ff"/>
    </linearGradient>
  </defs>`;

  body += `\n  <rect width="${width}" height="${height}" fill="url(#bg)"/>`;
  body += `\n  <rect x="16" y="16" width="${width - 32}" height="${height - 32}" rx="18" fill="#f9fcff" stroke="#d8e7f5"/>`;
  body += `\n  <text x="34" y="54" font-size="30" font-weight="800" fill="#11253d">AniList Showcase</text>`;
  body += `\n  <text x="34" y="78" font-size="14" fill="#3b4f67">@${escapeXml(USER)} • curated highlights</text>`;
  body += `\n  <text x="34" y="102" font-size="12" fill="#5b6e84">${escapeXml(DATA.note)}</text>`;

  body += listBlock(24, 126, "Anime: Watching", DATA.watching, "#2f80ed");
  body += listBlock(472, 126, "Anime: Completed Highlights", DATA.completedAnime, "#17a34a");
  body += listBlock(24, 244, "Manga: Reading", DATA.readingManga, "#c2410c");
  body += listBlock(472, 244, "Manga: Completed Highlights", DATA.completedManga, "#7c3aed");
  body += listBlock(24, 362, "Recent Activity Signals", DATA.recentActivity, "#0ea5a3");

  body += `\n  <a href="https://anilist.co/user/${escapeXml(USER)}/" target="_blank" rel="noopener noreferrer">
    <rect x="698" y="384" width="198" height="46" rx="12" fill="#11253d"/>
    <text x="797" y="412" text-anchor="middle" font-size="13" font-weight="700" fill="#ffffff">Open AniList Profile</text>
  </a>`;
  body += `\n  <text x="34" y="478" font-size="11" fill="#7990a8">Updated by GitHub Actions • static fallback mode for reliability</text>`;

  return `<?xml version="1.0" encoding="UTF-8"?>\n<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img" aria-label="AniList showcase card">${body}\n</svg>`;
}

async function main() {
  const svg = generateSvg();
  await fs.writeFile(OUT_FILE, `${svg}\n`, "utf8");
  console.log(`AniList fallback card generated: ${OUT_FILE}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
