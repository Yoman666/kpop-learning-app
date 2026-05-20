export type FavoriteVideo = {
  title: string;
  url: string;
  videoId: string;
};

const STORAGE_KEY = "kpop-favorite-videos";

function isFavoriteVideo(x: unknown): x is FavoriteVideo {
  if (!x || typeof x !== "object") return false;
  const o = x as Record<string, unknown>;
  return (
    typeof o.title === "string" &&
    typeof o.url === "string" &&
    typeof o.videoId === "string" &&
    /^[\w-]{11}$/.test(o.videoId)
  );
}

export function watchUrlForVideoId(videoId: string): string {
  return `https://www.youtube.com/watch?v=${videoId}`;
}

export function loadFavorites(): FavoriteVideo[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isFavoriteVideo);
  } catch {
    return [];
  }
}

export function saveFavorites(items: FavoriteVideo[]): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

/** Newest first; same `videoId` replaces previous entry. */
export function upsertFavorite(
  list: FavoriteVideo[],
  item: FavoriteVideo
): FavoriteVideo[] {
  const rest = list.filter((x) => x.videoId !== item.videoId);
  return [item, ...rest];
}

export function removeFavoriteById(
  list: FavoriteVideo[],
  videoId: string
): FavoriteVideo[] {
  return list.filter((x) => x.videoId !== videoId);
}
