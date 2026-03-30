import fs from "node:fs/promises";
import { chromium } from "playwright";

const USER = process.env.ANILIST_USER || "ShiningMonster";
const OUT_FILE = process.env.ANILIST_SVG || "github-metrics-anilist.svg";
const LIMIT = Number(process.env.ANILIST_LIMIT || 4);

const store = {
  stats: null,
  lists: {
    anime: { CURRENT: [], COMPLETED: [] },
    manga: { CURRENT: [] },
  },
  favoritesManga: [],
};

function pickTitle(media) {
  return (
    media?.title?.english ||
    media?.title?.romaji ||
    media?.title?.native ||
    "Untitled"
  );
}

function stripHtml(text) {
  return `${text || ""}`
    .replace(/<br\s*\/?>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function escapeXml(text) {
  return `${text || ""}`
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function truncate(text, max) {
  if (!text) return "";
  return text.length <= max ? text : `${text.slice(0, max - 1)}...`;
}

function uniqByTitle(items) {
  const seen = new Set();
  const out = [];
  for (const item of items) {
    const key = `${item.title}|${item.cover}`;
    if (!seen.has(key)) {
      seen.add(key);
      out.push(item);
    }
  }
  return out;
}

function normalizeMediaEntry(entry) {
  const media = entry?.media || entry;
  if (!media) return null;
  const title = pickTitle(media);
  const description = truncate(stripHtml(media?.description), 90);
  const cover =
    media?.coverImage?.large ||
    media?.coverImage?.medium ||
    media?.coverImage?.extraLarge ||
    null;
  const progress = entry?.progress ?? null;
  const status = entry?.status || media?.status || "";
  const type = media?.type || "";
  return { title, description, cover, progress, status, type };
}

function mergeStats(user) {
  const stats = user?.statistics;
  if (!stats) return;
  store.stats = {
    minutesWatched: stats?.anime?.minutesWatched ?? 0,
    chaptersRead: stats?.manga?.chaptersRead ?? 0,
    genres: [
      ...(stats?.anime?.genres || []).map((g) => g?.genre).filter(Boolean),
      ...(stats?.manga?.genres || []).map((g) => g?.genre).filter(Boolean),
    ],
  };
  store.stats.genres = [...new Set(store.stats.genres)].slice(0, 8);
}

function mergeFavorites(user) {
  const nodes = user?.favourites?.manga?.nodes;
  if (!Array.isArray(nodes)) return;
  for (const node of nodes) {
    const normalized = normalizeMediaEntry(node);
    if (normalized) store.favoritesManga.push(normalized);
  }
}

function mergeMediaListCollection(collection) {
  const lists = collection?.lists;
  if (!Array.isArray(lists)) return;
  for (const list of lists) {
    const entries = Array.isArray(list?.entries) ? list.entries : [];
    for (const entry of entries) {
      const normalized = normalizeMediaEntry(entry);
      if (!normalized) continue;
      const kind = normalized.type?.toUpperCase();
      const status = (entry?.status || "").toUpperCase();
      if (kind === "ANIME" && (status === "CURRENT" || status === "COMPLETED")) {
        store.lists.anime[status].push(normalized);
      }
      if (kind === "MANGA" && status === "CURRENT") {
        store.lists.manga.CURRENT.push(normalized);
      }
    }
  }
}

function walkAndHarvest(input, seen = new Set()) {
  if (!input || typeof input !== "object") return;
  if (seen.has(input)) return;
  seen.add(input);

  if (input?.data?.User) {
    mergeStats(input.data.User);
    mergeFavorites(input.data.User);
  }
  if (input?.data?.MediaListCollection) {
    mergeMediaListCollection(input.data.MediaListCollection);
  }
  if (input?.User) {
    mergeStats(input.User);
    mergeFavorites(input.User);
  }
  if (input?.MediaListCollection) {
    mergeMediaListCollection(input.MediaListCollection);
  }

  for (const value of Object.values(input)) {
    if (value && typeof value === "object") walkAndHarvest(value, seen);
  }
}

async function maybeJson(response) {
  try {
    const ctype = response.headers()["content-type"] || "";
    if (!/json/i.test(ctype)) return null;
    return await response.json();
  } catch {
    return null;
  }
}

async function imageToDataUri(url) {
  if (!url) return null;
  try {
    const response = await fetch(url, { redirect: "follow" });
    if (!response.ok) return null;
    const buffer = Buffer.from(await response.arrayBuffer());
    const ctype = response.headers.get("content-type") || "image/jpeg";
    return `data:${ctype};base64,${buffer.toString("base64")}`;
  } catch {
    return null;
  }
}

async function scrapeAniList() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1360, height: 1400 } });
  const page = await context.newPage();

  page.on("response", async (response) => {
    const url = response.url();
    if (!/graphql|anilist/i.test(url)) return;
    const json = await maybeJson(response);
    if (!json) return;
    walkAndHarvest(json);
  });

  const urls = [
    `https://anilist.co/user/${USER}/`,
    `https://anilist.co/user/${USER}/animelist`,
    `https://anilist.co/user/${USER}/mangalist`,
  ];

  for (const url of urls) {
    await page.goto(url, { waitUntil: "networkidle", timeout: 90000 });
    await page.waitForTimeout(4000);
    const globals = await page.evaluate(() => ({
      apollo: globalThis.__APOLLO_STATE__ ?? null,
      nuxt: globalThis.__NUXT__ ?? null,
      initial: globalThis.__INITIAL_STATE__ ?? null,
      preload: globalThis.__PRELOADED_STATE__ ?? null,
    }));
    walkAndHarvest(globals);
  }

  await browser.close();
}

function section(title, items, y, totalWidth) {
  const cardW = 212;
  const cardH = 152;
  const gap = 14;
  const startX = 24;
  let out = `\n    <text x="24" y="${y}" font-size="20" font-weight="700" fill="#111827">${escapeXml(title)}</text>`;
  const cardY = y + 12;

  for (let i = 0; i < 4; i++) {
    const x = startX + i * (cardW + gap);
    const item = items[i];
    out += `\n    <rect x="${x}" y="${cardY}" rx="12" ry="12" width="${cardW}" height="${cardH}" fill="#ffffff" stroke="#e5e7eb"/>`;
    if (!item) continue;

    const coverW = 78;
    const coverH = 114;
    const tx = x + 92;
    const ty = cardY + 24;
    if (item.cover) {
      out += `\n    <image href="${item.cover}" x="${x + 8}" y="${cardY + 8}" width="${coverW}" height="${coverH}" preserveAspectRatio="xMidYMid slice"/>`;
    } else {
      out += `\n    <rect x="${x + 8}" y="${cardY + 8}" width="${coverW}" height="${coverH}" fill="#f3f4f6"/>`;
    }

    out += `\n    <text x="${tx}" y="${ty}" font-size="13" font-weight="700" fill="#0f172a">${escapeXml(truncate(item.title, 30))}</text>`;
    out += `\n    <text x="${tx}" y="${ty + 18}" font-size="11" fill="#374151">${escapeXml(truncate(item.description || "No description", 52))}</text>`;
    if (item.progress != null) {
      out += `\n    <text x="${tx}" y="${ty + 35}" font-size="11" fill="#6b7280">Progress: ${escapeXml(String(item.progress))}</text>`;
    }
  }

  return { svg: out, nextY: cardY + cardH + 28, width: totalWidth };
}

function generateSvg(payload) {
  const width = 928;
  let y = 40;

  const minutes = payload.stats?.minutesWatched ?? 0;
  const chapters = payload.stats?.chaptersRead ?? 0;
  const genres = (payload.stats?.genres || []).slice(0, 6).join(", ") || "N/A";

  const watching = uniqByTitle(payload.watching).slice(0, LIMIT);
  const completed = uniqByTitle(payload.completed).slice(0, LIMIT);
  const favoritesManga = uniqByTitle(payload.favoritesManga).slice(0, LIMIT);
  const reading = uniqByTitle(payload.reading).slice(0, LIMIT);

  const totalHeight = 880;
  let body = "";

  body += `\n    <rect x="0" y="0" width="${width}" height="${totalHeight}" fill="#f8fafc"/>`;
  body += `\n    <rect x="16" y="16" width="${width - 32}" height="${totalHeight - 32}" rx="16" ry="16" fill="#ffffff" stroke="#e2e8f0"/>`;
  body += `\n    <text x="32" y="${y}" font-size="28" font-weight="800" fill="#111827">AniList Highlights - ${escapeXml(USER)}</text>`;
  y += 30;
  body += `\n    <text x="32" y="${y}" font-size="14" fill="#334155">Minutes watched: ${minutes.toLocaleString()}   |   Chapters read: ${chapters.toLocaleString()}</text>`;
  y += 22;
  body += `\n    <text x="32" y="${y}" font-size="13" fill="#475569">Favorite genres: ${escapeXml(truncate(genres, 96))}</text>`;
  y += 24;

  const sections = [
    ["Currently Watching (Anime)", watching],
    ["Completed (Anime)", completed],
    ["Favorites (Manga)", favoritesManga],
    ["Currently Reading (Manga)", reading],
  ];

  for (const [title, items] of sections) {
    const built = section(title, items, y, width);
    body += built.svg;
    y = built.nextY;
  }

  body += `\n    <text x="32" y="${totalHeight - 28}" font-size="11" fill="#94a3b8">Generated automatically from public AniList pages</text>`;

  return `<?xml version="1.0" encoding="UTF-8"?>\n<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${totalHeight}" viewBox="0 0 ${width} ${totalHeight}" role="img" aria-label="AniList highlights card">${body}\n</svg>`;
}

async function main() {
  await scrapeAniList();

  const payload = {
    stats: store.stats,
    watching: store.lists.anime.CURRENT,
    completed: store.lists.anime.COMPLETED,
    favoritesManga: store.favoritesManga,
    reading: store.lists.manga.CURRENT,
  };

  const totalItems =
    payload.watching.length +
    payload.completed.length +
    payload.favoritesManga.length +
    payload.reading.length;

  if (!payload.stats || totalItems === 0) {
    throw new Error("Could not collect AniList data from public pages.");
  }

  const imageMap = new Map();
  const allItems = [
    ...payload.watching,
    ...payload.completed,
    ...payload.favoritesManga,
    ...payload.reading,
  ];

  for (const item of allItems) {
    if (!item.cover || imageMap.has(item.cover)) continue;
    const dataUri = await imageToDataUri(item.cover);
    if (dataUri) imageMap.set(item.cover, dataUri);
  }

  for (const group of [payload.watching, payload.completed, payload.favoritesManga, payload.reading]) {
    for (const item of group) {
      if (item.cover && imageMap.has(item.cover)) {
        item.cover = imageMap.get(item.cover);
      }
    }
  }

  const svg = generateSvg(payload);
  await fs.writeFile(OUT_FILE, `${svg}\n`, "utf8");
  console.log(`AniList card generated: ${OUT_FILE}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
