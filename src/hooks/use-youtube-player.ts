import { useCallback, useMemo } from "react";

/** Stable DOM id for the embed (no YT.Player — avoids destroy() removing React’s iframe). */
export const YOUTUBE_IFRAME_ID = "kpop-yt-iframe";

/**
 * Embeds YouTube with enablejsapi for optional future controls.
 * Subtitles/lyrics use the separate API route — no IFrame Player API required.
 */
export function useYoutubePlayer(videoId: string | null) {
  const embedSrc = useMemo(
    () =>
      videoId
        ? `https://www.youtube.com/embed/${videoId}?enablejsapi=1`
        : "",
    [videoId]
  );

  const onIframeLoad = useCallback(() => {}, []);

  return { onIframeLoad, embedSrc };
}
