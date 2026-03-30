import fs from "node:fs/promises";

const USER = process.env.ANILIST_USER || "ShiningMonster";
const OUT_FILE = process.env.ANILIST_SVG || "github-metrics-anilist.svg";

const SECTIONS = [
  { title: "Watching",          items: ["Little Witch Academia (TV)", "Sousou no Frieren 2nd Season"],                                     color: "#38bdf8" },
  { title: "Anime \u00B7 Completed", items: ["Bubblegum Crisis", "Bubblegum Crisis TOKYO 2040", "Dandadan"],                              color: "#34d399" },
  { title: "Manga \u00B7 Reading",   items: ["Dandadan", "Berserk", "X"],                                                                 color: "#f97316" },
  { title: "Manga \u00B7 Completed", items: ["Denei Shoujo", "Tokyo BABYLON", "Silent M\u00F6bius"],                                     color: "#a78bfa" },
  { title: "Recent Activity",   items: ["Completed Matantei Loki Ragnarok", "Completed Matantei Loki", "Completed Bubblegum Crisis TOKYO 2040"], color: "#fb7185", wide: true },
];

const W = 800;
const PAD = 18;
const COL_GAP = 14;
const COL_W = Math.floor((W - PAD * 2 - COL_GAP) / 2);
const ITEM_H = 20;
const SEC_HDR = 36;
const SEC_PAD = 10;

function esc(t) {
  return String(t ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function sectionCard(x, y, w, { title, items, color }) {
  const h = SEC_HDR + SEC_PAD + items.length * ITEM_H + SEC_PAD;
  let s = `\n  <rect x="${x}" y="${y}" width="${w}" height="${h}" rx="10" fill="#162032"/>`;
  s += `\n  <rect x="${x + 1}" y="${y}" width="${w - 2}" height="${SEC_HDR}" rx="9" fill="${color}1a"/>`;
  s += `\n  <circle cx="${x + 15}" cy="${y + Math.round(SEC_HDR / 2)}" r="5" fill="${color}"/>`;
  s += `\n  <text x="${x + 29}" y="${y + Math.round(SEC_HDR / 2) + 5}" font-size="13" font-weight="700" fill="${color}">${esc(title)}</text>`;
  const baseY = y + SEC_HDR + SEC_PAD;
  for (let i = 0; i < items.length; i++) {
    const ty = baseY + i * ITEM_H + 14;
    s += `\n  <text x="${x + 15}" y="${ty}" font-size="12" fill="#334155">\u203A</text>`;
    s += `\n  <text x="${x + 27}" y="${ty}" font-size="12" fill="#94a3b8">${esc(items[i])}</text>`;
  }
  return { svg: s, h };
}

function generateSvg() {
  const HEADER_H = 76;
  let y = HEADER_H + 10;
  const parts = [];

  const r1l = sectionCard(PAD, y, COL_W, SECTIONS[0]);
  const r1r = sectionCard(PAD + COL_W + COL_GAP, y, COL_W, SECTIONS[1]);
  parts.push(r1l, r1r);
  y += Math.max(r1l.h, r1r.h) + 10;

  const r2l = sectionCard(PAD, y, COL_W, SECTIONS[2]);
  const r2r = sectionCard(PAD + COL_W + COL_GAP, y, COL_W, SECTIONS[3]);
  parts.push(r2l, r2r);
  y += Math.max(r2l.h, r2r.h) + 10;

  const r3 = sectionCard(PAD, y, W - PAD * 2, SECTIONS[4]);
  parts.push(r3);
  y += r3.h + 10;

  const H = y + 22;

  let out = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-label="AniList showcase">
  <defs>
    <linearGradient id="hdr" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="#0f3460"/>
      <stop offset="100%" stop-color="#162032"/>
    </linearGradient>
  </defs>
  <rect width="${W}" height="${H}" rx="16" fill="#0d1b2a"/>
  <rect width="${W}" height="${HEADER_H}" rx="16" fill="url(#hdr)"/>
  <rect y="${HEADER_H - 8}" width="${W}" height="8" fill="#0d1b2a"/>
  <text x="${PAD}" y="36" font-size="22" font-weight="800" fill="#f0f9ff">AniList Showcase</text>
  <text x="${PAD}" y="60" font-size="13" fill="#7dd3fc">@${esc(USER)} \u00B7 curated highlights \u00B7 anilist.co/user/${esc(USER)}</text>`;
  for (const p of parts) out += p.svg;
  out += `\n  <text x="${W / 2}" y="${H - 8}" text-anchor="middle" font-size="10" fill="#1e3a5f">updated by GitHub Actions \u00B7 static showcase</text>`;
  out += "\n</svg>";
  return out;
}

async function main() {
  const svg = generateSvg();
  await fs.writeFile(OUT_FILE, `${svg}\n`, "utf8");
  console.log(`AniList card written: ${OUT_FILE}`);
}

main().catch((err) => { console.error(err); process.exit(1); });
