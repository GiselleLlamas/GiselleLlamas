import fs from "node:fs/promises";

const USER = process.env.ANILIST_USER || "ShiningMonster";
const OUT_FILE = process.env.ANILIST_SVG || "github-metrics-anilist.svg";

const FAVORITES = [
  {
    title: "Sousou no Frieren",
    year: "2023",
    approval: "91%",
    episodes: "28 episodes",
    genres: "Adventure, Drama, Fantasy",
    description:
      "The adventure is over but life goes on for an elf mage just beginning to learn what living is all about. Frieren sets out to fulfill the last wishes of her comrades and finds herself beginning a new adventure.",
    cover: "https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx154587-qQTzQnEJJ3oB.jpg",
    accent: "#2dd4bf",
  },
  {
    title: "serial experiments lain",
    year: "1998",
    approval: "83%",
    episodes: "13 episodes",
    genres: "Drama, Mystery, Psychological, Sci-Fi",
    description:
      "We're all connected. The day after a classmate commits suicide, Lain discovers how closely the real world and the wired world are linked, and whether the line between them has begun to blur.",
    cover: "https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx339-xF2wp1NQuQ4r.png",
    accent: "#60a5fa",
  },
];

const W = 760;
const PAD = 18;
const HEADER_H = 52;

function truncate(text, max) {
  if (text.length <= max) return text;
  return `${text.slice(0, max - 1)}...`;
}

function wrapText(text, maxChars, maxLines) {
  const words = `${text || ""}`.split(/\s+/);
  const lines = [];
  let current = "";
  for (const word of words) {
    const next = current ? `${current} ${word}` : word;
    if (next.length <= maxChars) {
      current = next;
      continue;
    }
    if (current) lines.push(current);
    current = word;
    if (lines.length === maxLines - 1) break;
  }
  if (lines.length < maxLines && current) {
    lines.push(current);
  }
  if (lines.length > maxLines) {
    return lines.slice(0, maxLines);
  }
  if (words.join(" ").length > lines.join(" ").length && lines.length) {
    lines[lines.length - 1] = truncate(lines[lines.length - 1], Math.max(8, maxChars - 3));
  }
  return lines;
}

function esc(t) {
  return String(t ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

async function imageToDataUri(url) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch image: ${url}`);
  }
  const contentType = response.headers.get("content-type") || "image/jpeg";
  const buffer = Buffer.from(await response.arrayBuffer());
  return `data:${contentType};base64,${buffer.toString("base64")}`;
}

function renderFavorite(x, y, favorite) {
  const descriptionLines = wrapText(favorite.description, 62, 2);
  let section = `\n  <rect x="${x}" y="${y}" width="${W - PAD * 2}" height="118" rx="14" fill="#131c2b" stroke="#1f2b42"/>`;
  section += `\n  <rect x="${x + 12}" y="${y + 12}" width="54" height="82" rx="8" fill="#0b1220"/>`;
  section += `\n  <image href="${favorite.coverData}" x="${x + 12}" y="${y + 12}" width="54" height="82" preserveAspectRatio="xMidYMid slice"/>`;
  section += `\n  <text x="${x + 80}" y="${y + 26}" font-size="15" font-weight="700" fill="${favorite.accent}">${esc(favorite.title)}</text>`;
  section += `\n  <text x="${x + 80}" y="${y + 44}" font-size="11" fill="#cbd5e1">Anime</text>`;
  section += `\n  <text x="${x + 126}" y="${y + 44}" font-size="11" fill="#64748b">${esc(favorite.year)}</text>`;
  section += `\n  <text x="${x + 168}" y="${y + 44}" font-size="11" fill="#94a3b8">${esc(favorite.approval)}</text>`;
  section += `\n  <text x="${x + 222}" y="${y + 44}" font-size="11" fill="#94a3b8">${esc(favorite.episodes)}</text>`;
  section += `\n  <text x="${x + 80}" y="${y + 62}" font-size="11" fill="#94a3b8">${esc(favorite.genres)}</text>`;
  section += `\n  <text x="${x + 80}" y="${y + 82}" font-size="10.5" fill="#e2e8f0">${esc(descriptionLines[0] || "")}</text>`;
  section += `\n  <text x="${x + 80}" y="${y + 98}" font-size="10.5" fill="#94a3b8">${esc(descriptionLines[1] || "")}</text>`;
  return section;
}

function generateSvg(favorites) {
  const H = 332;
  let out = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-label="AniList favorites showcase">
  <defs>
    <linearGradient id="panel" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#0f172a"/>
      <stop offset="100%" stop-color="#101a2d"/>
    </linearGradient>
  </defs>
  <rect width="${W}" height="${H}" rx="16" fill="url(#panel)"/>
  <text x="${PAD}" y="32" font-size="18" font-weight="700" fill="#e2e8f0">AniList</text>
  <text x="${PAD}" y="52" font-size="11" fill="#60a5fa">@${esc(USER)}</text>
  <text x="${PAD}" y="84" font-size="17" font-weight="700" fill="#60a5fa">Favorite anime</text>`;

  out += renderFavorite(PAD, 100, favorites[0]);
  out += renderFavorite(PAD, 226, favorites[1]);
  out += "\n</svg>";
  return out;
}

async function main() {
  const favorites = [];
  for (const favorite of FAVORITES) {
    favorites.push({
      ...favorite,
      coverData: await imageToDataUri(favorite.cover),
    });
  }
  const svg = generateSvg(favorites);
  await fs.writeFile(OUT_FILE, `${svg}\n`, "utf8");
  console.log(`AniList card written: ${OUT_FILE}`);
}

main().catch((err) => { console.error(err); process.exit(1); });
