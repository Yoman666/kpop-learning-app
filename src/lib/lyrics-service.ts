const UA = "Kpop-Learn/1.0 (https://github.com)";

export type VideoMeta = {
  title: string;
  authorName: string;
};

export type LyricsMatch = {
  source: "lrclib";
  id: number;
  trackName: string;
  artistName: string;
  albumName: string;
  plainLyrics: string;
};

export async function fetchYouTubeOEmbed(videoId: string): Promise<VideoMeta | null> {
  const url = `https://www.youtube.com/oembed?format=json&url=${encodeURIComponent(
    `https://www.youtube.com/watch?v=${videoId}`
  )}`;
  const res = await fetch(url, {
    headers: { "User-Agent": UA, Accept: "application/json" },
    cache: "no-store",
  });
  if (!res.ok) return null;
  try {
    const data = (await res.json()) as { title?: string; author_name?: string };
    if (!data.title) return null;
    return {
      title: data.title.trim(),
      authorName: (data.author_name ?? "").trim(),
    };
  } catch {
    return null;
  }
}

type LrclibHit = {
  id: number;
  trackName?: string;
  artistName?: string;
  albumName?: string;
  plainLyrics?: string | null;
  syncedLyrics?: string | null;
};

function syncedToPlain(synced: string): string {
  return synced
    .split("\n")
    .map((line) => line.replace(/^\[[\d:.]+\]\s*/, "").trimEnd())
    .filter((line) => line.length > 0)
    .join("\n");
}

function pickLyricsText(hit: LrclibHit): string | null {
  const plain = hit.plainLyrics?.trim();
  if (plain && plain.length > 0) return plain;
  const synced = hit.syncedLyrics?.trim();
  if (synced && synced.length > 0) return syncedToPlain(synced);
  return null;
}

/** YouTube channel names like "BIGBANG - Topic" → "BIGBANG". */
function normalizeChannelName(name: string): string {
  return name
    .replace(/\s*-\s*Topic\s*$/i, "")
    .replace(/\s+Official(\s+Channel)?\s*$/i, "")
    .trim();
}

/** Strip `M/V`, `MV`, brackets, etc. (YouTube titles rarely use `[` before M/V). */
function stripTrailingVideoSuffixes(s: string): string {
  let x = s.trim();
  for (let n = 0; n < 4; n++) {
    const prev = x;
    x = x
      .replace(
        /\s*[\[(]?\s*(official\s*)?(music\s*video|m\/v|mv|visualizer|audio|lyrics|lyric\s*video|가사|한글자막)\s*[\])]?\s*$/i,
        ""
      )
      .trim();
    if (x === prev) break;
  }
  return x;
}

/** Remove straight/curly quotes wrapping a segment. */
function stripEdgeQuotes(s: string): string {
  return s
    .replace(/^[\s'"`]+/, "")
    .replace(/[\s'"`]+$/, "")
    .trim();
}

function cleanYouTubeTitle(title: string): string {
  return stripTrailingVideoSuffixes(title)
    .replace(/\s*[\[(](feat|ft)\.[^)\]]*[\])]/i, "")
    .trim();
}

type SearchAttempt =
  | { kind: "q"; q: string }
  | { kind: "fields"; artist: string; track: string };

function buildLyricsSearchAttempts(meta: VideoMeta): SearchAttempt[] {
  const channel = normalizeChannelName(meta.authorName);
  const raw = meta.title.trim();
  const noSuffix = stripTrailingVideoSuffixes(raw);
  const cleanedFull = cleanYouTubeTitle(raw);

  const attempts: SearchAttempt[] = [];
  const seenQ = new Set<string>();
  const seenFields = new Set<string>();

  const addQ = (q: string) => {
    const v = q.replace(/\s+/g, " ").trim();
    if (v.length < 2) return;
    const k = v.toLowerCase();
    if (seenQ.has(k)) return;
    seenQ.add(k);
    attempts.push({ kind: "q", q: v });
  };

  const addFields = (artist: string, track: string) => {
    const a = artist.replace(/\s+/g, " ").trim();
    const t = track.replace(/\s+/g, " ").trim();
    if (a.length < 1 || t.length < 2) return;
    const k = `${a.toLowerCase()}|${t.toLowerCase()}`;
    if (seenFields.has(k)) return;
    seenFields.add(k);
    attempts.push({ kind: "fields", artist: a, track: t });
  };

  // --- Parse "Artist - 'Song (Alt)' …" ---
  const dashParts = noSuffix.split(/\s+-\s+/).map((p) => stripEdgeQuotes(p.trim()));
  let artistFromTitle = "";
  let songPart = stripEdgeQuotes(noSuffix);
  if (dashParts.length >= 2) {
    artistFromTitle = stripEdgeQuotes(dashParts[0]);
    songPart = stripEdgeQuotes(dashParts.slice(1).join(" - "));
  }
  songPart = stripTrailingVideoSuffixes(songPart);

  const artistPrimary = artistFromTitle || channel;
  const artistAlt = channel && channel !== artistFromTitle ? channel : "";

  // "봄여름가을겨울 (Still Life)" → main + parenthetical
  let mainTrack = songPart;
  let parenTrack = "";
  const paren = songPart.match(/^(.+?)\s*\(([^)]+)\)\s*$/);
  if (paren) {
    mainTrack = stripEdgeQuotes(paren[1]);
    parenTrack = stripEdgeQuotes(paren[2]);
  } else {
    mainTrack = stripEdgeQuotes(songPart);
  }

  /** Prefer English/Roman title in () for LRCLIB (e.g. catalogue "Still Life"). */
  const parenLooksRoman = parenTrack.length > 0 && /^[\s\w.'’,-]+$/i.test(parenTrack);

  // LRCLIB field search (often best for K-pop MV titles)
  if (parenLooksRoman) {
    if (artistPrimary && parenTrack) addFields(artistPrimary, parenTrack);
    if (artistAlt && parenTrack) addFields(artistAlt, parenTrack);
    if (artistPrimary && mainTrack) addFields(artistPrimary, mainTrack);
    if (artistAlt && mainTrack) addFields(artistAlt, mainTrack);
  } else {
    if (artistPrimary && mainTrack) addFields(artistPrimary, mainTrack);
    if (artistPrimary && parenTrack) addFields(artistPrimary, parenTrack);
    if (artistAlt && mainTrack) addFields(artistAlt, mainTrack);
    if (artistAlt && parenTrack) addFields(artistAlt, parenTrack);
  }

  // Keyword search fallbacks
  if (parenLooksRoman && artistPrimary && parenTrack) {
    addQ(`${artistPrimary} ${parenTrack}`);
    addQ(`${parenTrack} ${artistPrimary}`);
  }
  if (artistPrimary && mainTrack) addQ(`${artistPrimary} ${mainTrack}`);
  if (artistPrimary && parenTrack && !parenLooksRoman) {
    addQ(`${artistPrimary} ${parenTrack}`);
  }
  if (artistAlt && mainTrack) addQ(`${artistAlt} ${mainTrack}`);
  if (artistAlt && parenTrack) addQ(`${artistAlt} ${parenTrack}`);
  if (parenTrack && artistPrimary && !parenLooksRoman) {
    addQ(`${parenTrack} ${artistPrimary}`);
  }

  addQ(cleanedFull);
  addQ(`${channel} ${cleanedFull}`.trim());
  addQ(`${channel} ${mainTrack}`.trim());
  if (mainTrack) addQ(mainTrack);
  if (parenTrack) addQ(parenTrack);

  return attempts;
}

async function lrclibSearch(
  attempt: SearchAttempt,
  meta: VideoMeta
): Promise<LyricsMatch | null> {
  const searchUrl = new URL("https://lrclib.net/api/search");
  if (attempt.kind === "q") {
    searchUrl.searchParams.set("q", attempt.q);
  } else {
    searchUrl.searchParams.set("artist_name", attempt.artist);
    searchUrl.searchParams.set("track_name", attempt.track);
  }

  const res = await fetch(searchUrl.toString(), {
    headers: { "User-Agent": UA, Accept: "application/json" },
    cache: "no-store",
  });
  if (!res.ok) return null;

  let hits: LrclibHit[];
  try {
    hits = (await res.json()) as LrclibHit[];
  } catch {
    return null;
  }
  if (!Array.isArray(hits) || hits.length === 0) return null;

  for (const hit of hits) {
    const text = pickLyricsText(hit);
    if (!text || text.length < 8) continue;
    return {
      source: "lrclib",
      id: hit.id,
      trackName: hit.trackName ?? meta.title,
      artistName: hit.artistName ?? meta.authorName,
      albumName: hit.albumName ?? "",
      plainLyrics: text,
    };
  }

  return null;
}

export async function searchLyricsFromWeb(meta: VideoMeta): Promise<LyricsMatch | null> {
  const attempts = buildLyricsSearchAttempts(meta);
  for (let i = 0; i < attempts.length; i++) {
    const hit = await lrclibSearch(attempts[i], meta);
    if (hit) return hit;
    if (i > 0 && i % 5 === 0) {
      await new Promise((r) => setTimeout(r, 50));
    }
  }
  return null;
}

export async function translateKoreanToChinese(text: string): Promise<string> {
  return translateMyMemory(text);
}

async function translateMyMemory(text: string): Promise<string> {
  const trimmed = text.trim();
  if (!trimmed) return "";
  const url = new URL("https://api.mymemory.translated.net/get");
  url.searchParams.set("q", trimmed.slice(0, 450));
  url.searchParams.set("langpair", "ko|zh-CN");

  const res = await fetch(url.toString(), {
    headers: { "User-Agent": UA, Accept: "application/json" },
    cache: "no-store",
  });
  if (!res.ok) return "";
  try {
    const data = (await res.json()) as {
      responseData?: { translatedText?: string };
      responseStatus?: number;
    };
    const t = data.responseData?.translatedText?.trim();
    if (!t || t === trimmed) return "";
    return t;
  } catch {
    return "";
  }
}

/** Split lyrics into lines; preserve structure for paired display. */
export function splitLyricLines(plain: string): string[] {
  return plain
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);
}

export async function translateKoreanLinesToChinese(
  lines: string[]
): Promise<string[]> {
  if (lines.length === 0) return [];

  const batchSize = 6;
  const out: string[] = [];
  for (let i = 0; i < lines.length; i += batchSize) {
    const batch = lines.slice(i, i + batchSize);
    const translated = await Promise.all(
      batch.map((line) => translateMyMemory(line))
    );
    out.push(...translated.map((t) => t || "—"));
    if (i + batchSize < lines.length) {
      await new Promise((r) => setTimeout(r, 120));
    }
  }
  return out;
}
