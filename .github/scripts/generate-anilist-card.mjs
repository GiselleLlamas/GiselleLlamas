import fs from "node:fs/promises";

const USER = process.env.ANILIST_USER || "ShiningMonster";
const OUT_FILE = process.env.ANILIST_SVG || "github-metrics-anilist.svg";

const ANIME_FAVORITES = [
  {
    title: "Sousou no Frieren",
    medium: "Anime",
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
    medium: "Anime",
    year: "1998",
    approval: "83%",
    episodes: "13 episodes",
    genres: "Drama, Mystery, Psychological, Sci-Fi",
    description:
      "We're all connected. The day after a classmate commits suicide, Lain discovers how closely the real world and the wired world are linked, and whether the line between them has begun to blur.",
    cover: "https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx339-xF2wp1NQuQ4r.png",
    accent: "#60a5fa",
  },
  {
    title: "Dandadan 3rd Season",
    medium: "Anime",
    year: "2027",
    approval: "TBA",
    episodes: "TV",
    genres: "Action, Comedy, Supernatural",
    description: "The third season of Dandadan.",
    cover: "https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx198966-9Ji1GwIyRiiu.jpg",
    accent: "#f97316",
  },
  {
    title: "Bubblegum Crisis TOKYO 2040",
    medium: "Anime",
    year: "1998",
    approval: "71%",
    episodes: "26 episodes",
    genres: "Action, Mecha, Sci-Fi",
    description:
      "After an earthquake levels Tokyo, Genom's Boomers help rebuild the city until some run amok. Lina Yamazaki heads to Tokyo hoping to join the Knight Sabers and stop the rogue Boomers.",
    cover: "https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx568-XvVqG7WdO1jo.jpg",
    accent: "#f472b6",
  },
];

const MANGA_FAVORITES = [
  {
    title: "Dandadan",
    medium: "Manga",
    year: "2021",
    approval: "82%",
    episodes: "Releasing",
    genres: "Action, Comedy, Supernatural",
    description:
      "Momo Ayase and Okarun set out to prove each other wrong about ghosts and aliens, only to get pulled into a wildly strange, funny, and emotional supernatural mess.",
    cover: "https://s4.anilist.co/file/anilistcdn/media/manga/cover/large/bx132029-prGF4gePdSKv.jpg",
    accent: "#22c55e",
  },
  {
    title: "Berserk",
    medium: "Manga",
    year: "1989",
    approval: "92%",
    episodes: "Releasing",
    genres: "Action, Adventure, Drama, Fantasy",
    description:
      "Guts, the Black Swordsman, bears a brutal fate and cuts a path through darkness, sacrifice, and vengeance in one of manga's most relentless epics.",
    cover: "https://s4.anilist.co/file/anilistcdn/media/manga/cover/large/bx30002-Cul4OeN7bYtn.jpg",
    accent: "#eab308",
  },
  {
    title: "X",
    medium: "Manga",
    year: "1992",
    approval: "79%",
    episodes: "Hiatus",
    genres: "Action, Drama, Fantasy, Supernatural",
    description:
      "Kamui Shiro was born with the power to decide the fate of Earth, and must choose between those fated to protect it and those destined to destroy it.",
    cover: "https://s4.anilist.co/file/anilistcdn/media/manga/cover/large/bx30027-UBGLYGgWKzTT.jpg",
    accent: "#a78bfa",
  },
  {
    title: "Tokyo BABYLON",
    medium: "Manga",
    year: "1990",
    approval: "76%",
    episodes: "18 chapters",
    genres: "Drama, Mystery, Supernatural",
    description:
      "In the last days of Japan's bubble economy, Subaru Sumeragi confronts the darkness beneath Tokyo as occult cases spiral into a tragic, elegant love story.",
    cover: "https://s4.anilist.co/file/anilistcdn/media/manga/cover/large/bx30133-sR52jjzieDTp.png",
    accent: "#fb7185",
  },
];

const W = 500;
const PAD = 18;
const HEADER_H = 52;
const COL_GAP = 14;
const COL_W = Math.floor((W - PAD * 2 - COL_GAP) / 2);
const CARD_H = 132;

function truncate(text, max) {
  if (text.length <= max) return text;
  return `${text.slice(0, max - 1)}...`;
}

function descriptionLinesWithEllipsis(text, firstMax, secondMax) {
  const clean = `${text || ""}`.replace(/\s+/g, " ").trim();
  if (!clean) return ["", ""];

  const first = clean.slice(0, firstMax).trimEnd();
  const remaining = clean.slice(first.length).trimStart();
  if (!remaining) return [first, ""];

  if (remaining.length <= secondMax) {
    return [first, remaining];
  }

  return [first, `${remaining.slice(0, Math.max(0, secondMax - 3)).trimEnd()}...`];
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
  const descriptionLines = descriptionLinesWithEllipsis(favorite.description, 24, 24);
  const compactMeta = truncate(
    `${favorite.medium} · ${favorite.year} · ${favorite.approval} · ${favorite.episodes.replace(" episodes", " ep")}`,
    28,
  );
  const compactGenres = truncate(favorite.genres, 26);
  let section = `\n  <rect x="${x}" y="${y}" width="${COL_W}" height="${CARD_H}" rx="12" fill="#131c2b" stroke="#1f2b42"/>`;
  section += `\n  <rect x="${x + 10}" y="${y + 10}" width="58" height="86" rx="7" fill="#0b1220"/>`;
  section += `\n  <image href="${favorite.coverData}" x="${x + 10}" y="${y + 10}" width="58" height="86" preserveAspectRatio="xMidYMid slice"/>`;
  section += `\n  <text x="${x + 74}" y="${y + 28}" font-size="16.5" font-weight="700" fill="${favorite.accent}">${esc(truncate(favorite.title, 17))}</text>`;
  section += `\n  <text x="${x + 74}" y="${y + 47}" font-size="12.6" fill="#cbd5e1">${esc(compactMeta)}</text>`;
  section += `\n  <text x="${x + 74}" y="${y + 65}" font-size="12.2" fill="#94a3b8">${esc(compactGenres)}</text>`;
  section += `\n  <text x="${x + 74}" y="${y + 86}" font-size="12" fill="#e2e8f0">${esc(descriptionLines[0] || "")}</text>`;
  section += `\n  <text x="${x + 74}" y="${y + 104}" font-size="12" fill="#94a3b8">${esc(descriptionLines[1] || "")}</text>`;
  return section;
}

function generateSvg(animeFavorites, mangaFavorites) {
  const H = 706;
  let out = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-label="AniList favorites showcase">
  <defs>
    <linearGradient id="panel" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#0f172a"/>
      <stop offset="100%" stop-color="#101a2d"/>
    </linearGradient>
  </defs>
  <rect width="${W}" height="${H}" rx="16" fill="url(#panel)"/>
  <text x="${PAD}" y="38" font-size="24" font-weight="700" fill="#e2e8f0">AniList</text>
  <text x="${PAD}" y="62" font-size="15" fill="#60a5fa">@${esc(USER)}</text>
  <text x="${PAD}" y="98" font-size="19" font-weight="700" fill="#60a5fa">Favorite anime</text>
  <text x="${PAD + COL_W + COL_GAP}" y="98" font-size="19" font-weight="700" fill="#f472b6">Favorite manga</text>`;

  for (let i = 0; i < animeFavorites.length; i += 1) {
    out += renderFavorite(PAD, 116 + i * 144, animeFavorites[i]);
  }
  for (let i = 0; i < mangaFavorites.length; i += 1) {
    out += renderFavorite(PAD + COL_W + COL_GAP, 116 + i * 144, mangaFavorites[i]);
  }
  out += "\n</svg>";
  return out;
}

async function main() {
  const animeFavorites = [];
  for (const favorite of ANIME_FAVORITES) {
    animeFavorites.push({
      ...favorite,
      coverData: await imageToDataUri(favorite.cover),
    });
  }
  const mangaFavorites = [];
  for (const favorite of MANGA_FAVORITES) {
    mangaFavorites.push({
      ...favorite,
      coverData: await imageToDataUri(favorite.cover),
    });
  }
  const svg = generateSvg(animeFavorites, mangaFavorites);
  await fs.writeFile(OUT_FILE, `${svg}\n`, "utf8");
  console.log(`AniList card written: ${OUT_FILE}`);
}

main().catch((err) => { console.error(err); process.exit(1); });
