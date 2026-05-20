const VIDEO_ID_PATTERN = /^[\w-]{11}$/;

function isValidVideoId(id: string): boolean {
  return VIDEO_ID_PATTERN.test(id);
}

/**
 * Returns the YouTube video ID from a URL or raw ID string, or null if invalid.
 */
export function extractYouTubeVideoId(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;

  if (isValidVideoId(trimmed)) return trimmed;

  let urlString = trimmed;
  if (!/^https?:\/\//i.test(urlString)) {
    urlString = `https://${urlString}`;
  }

  try {
    const url = new URL(urlString);
    const host = url.hostname.replace(/^www\./i, "").toLowerCase();

    if (host === "youtu.be") {
      const id = url.pathname.split("/").filter(Boolean)[0] ?? "";
      return isValidVideoId(id) ? id : null;
    }

    if (host === "youtube.com" || host === "m.youtube.com" || host === "music.youtube.com") {
      if (url.pathname === "/watch" || url.pathname.startsWith("/watch")) {
        const v = url.searchParams.get("v");
        return v && isValidVideoId(v) ? v : null;
      }

      const embed = url.pathname.match(/^\/embed\/([\w-]{11})(?:\/|$)/);
      if (embed) return embed[1];

      const shorts = url.pathname.match(/^\/shorts\/([\w-]{11})(?:\/|$)/);
      if (shorts) return shorts[1];

      const legacy = url.pathname.match(/^\/v\/([\w-]{11})(?:\/|$)/);
      if (legacy) return legacy[1];
    }
  } catch {
    return null;
  }

  return null;
}
