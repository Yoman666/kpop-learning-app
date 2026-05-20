"use client";

import { useEffect, useMemo, useState } from "react";

import { FavoritesPanel } from "@/components/favorites-panel";
import { LyricsPanel } from "@/components/lyrics-panel";
import { SavedSentencesPanel } from "@/components/saved-sentences-panel";
import { SentencePanel } from "@/components/sentence-panel";
import { Button } from "@/components/ui/button";
import { useFavorites } from "@/hooks/use-favorites";
import { useSavedSentences } from "@/hooks/use-saved-sentences";
import { type FavoriteVideo, watchUrlForVideoId } from "@/lib/favorites-storage";
import type { SavedSentenceRecord, Sentence } from "@/lib/saved-sentences-storage";
import { extractYouTubeVideoId } from "@/lib/youtube";
import { useYoutubePlayer, YOUTUBE_IFRAME_ID } from "@/hooks/use-youtube-player";

type LyricsState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "error"; message: string }
  | {
      status: "ready";
      videoTitle: string;
      channelTitle: string;
      trackLabel: string;
      koreanLines: string[];
      chineseLines: string[];
    }
  | { status: "empty"; detail?: string; videoTitle?: string; channelTitle?: string };

type LineSelection =
  | { kind: "none" }
  | { kind: "line"; index: number }
  | { kind: "saved"; sentence: Sentence };

function favoriteTitleForSave(
  lyrics: LyricsState,
  urlInput: string,
  videoId: string
): string {
  if (lyrics.status === "ready") {
    return (lyrics.trackLabel || lyrics.videoTitle).trim() || `YouTube · ${videoId}`;
  }
  if (lyrics.status === "empty" && lyrics.videoTitle?.trim()) {
    return lyrics.videoTitle.trim();
  }
  const trimmed = urlInput.trim();
  if (trimmed) return trimmed.slice(0, 240);
  return `YouTube · ${videoId}`;
}

export default function Home() {
  const [urlInput, setUrlInput] = useState("");
  const [videoId, setVideoId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [lyrics, setLyrics] = useState<LyricsState>({ status: "idle" });
  const [lineSelection, setLineSelection] = useState<LineSelection>({ kind: "none" });

  const { items: favorites, addFavorite, removeFavorite, isFavorite } =
    useFavorites();

  const { items: savedSentences, saveSentence, removeSentence, isSaved } =
    useSavedSentences();

  const { onIframeLoad, embedSrc } = useYoutubePlayer(videoId);

  useEffect(() => {
    setLineSelection({ kind: "none" });
  }, [videoId]);

  useEffect(() => {
    if (!videoId) {
      setLyrics({ status: "idle" });
      return;
    }

    let cancelled = false;
    setLyrics({ status: "loading" });

    fetch(`/api/lyrics?videoId=${encodeURIComponent(videoId)}`, {
      cache: "no-store",
    })
      .then(async (res) => {
        const text = await res.text();
        let payload: {
          error?: string;
          videoTitle?: string;
          channelTitle?: string;
          trackName?: string;
          artistName?: string;
          koreanLines?: string[];
          chineseLines?: string[];
        } = {};
        try {
          payload = text ? (JSON.parse(text) as typeof payload) : {};
        } catch {
          throw new Error("Invalid response from lyrics API.");
        }

        if (res.status === 404) {
          return {
            kind: "not_found" as const,
            detail: payload.error,
            videoTitle: payload.videoTitle,
            channelTitle: payload.channelTitle,
          };
        }

        if (!res.ok) {
          throw new Error(payload.error ?? "Could not load lyrics.");
        }

        const kr = payload.koreanLines ?? [];
        const zh = payload.chineseLines ?? [];
        if (kr.length === 0) {
          return {
            kind: "not_found" as const,
            detail: "No lyric lines to display.",
            videoTitle: payload.videoTitle,
            channelTitle: payload.channelTitle,
          };
        }

        const trackLabel = [payload.artistName, payload.trackName]
          .filter(Boolean)
          .join(" — ");

        return {
          kind: "ok" as const,
          data: {
            videoTitle: payload.videoTitle ?? "",
            channelTitle: payload.channelTitle ?? "",
            trackLabel: trackLabel || (payload.videoTitle ?? ""),
            koreanLines: kr,
            chineseLines: zh,
          },
        };
      })
      .then((out) => {
        if (cancelled) return;

        if (out.kind === "not_found") {
          setLyrics({
            status: "empty",
            detail: out.detail,
            videoTitle: out.videoTitle,
            channelTitle: out.channelTitle,
          });
          return;
        }

        setLyrics({
          status: "ready",
          ...out.data,
        });
      })
      .catch((e: unknown) => {
        if (cancelled) return;
        setLyrics({
          status: "error",
          message: e instanceof Error ? e.message : "Could not load lyrics.",
        });
      });

    return () => {
      cancelled = true;
    };
  }, [videoId]);

  useEffect(() => {
    setLineSelection((prev) => {
      if (prev.kind !== "line") return prev;
      if (lyrics.status !== "ready") return { kind: "none" };
      const n = lyrics.koreanLines.length;
      if (prev.index < 0 || prev.index >= n) return { kind: "none" };
      return prev;
    });
  }, [lyrics]);

  const { activeKorean, activeChineseHint } = useMemo(() => {
    if (lyrics.status !== "ready") {
      return { activeKorean: null as string | null, activeChineseHint: "" };
    }
    if (lineSelection.kind === "line") {
      const kr = lyrics.koreanLines[lineSelection.index] ?? "";
      const zh = lyrics.chineseLines[lineSelection.index] ?? "";
      return { activeKorean: kr || null, activeChineseHint: zh };
    }
    if (lineSelection.kind === "saved") {
      return {
        activeKorean: lineSelection.sentence.korean,
        activeChineseHint: lineSelection.sentence.translation,
      };
    }
    return { activeKorean: null as string | null, activeChineseHint: "" };
  }, [lyrics, lineSelection]);

  const selectedLineIndex =
    lineSelection.kind === "line" ? lineSelection.index : null;

  const bookmarkedCurrent = Boolean(
    activeKorean && isSaved(activeKorean)
  );

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const id = extractYouTubeVideoId(urlInput);
    if (id) {
      setVideoId(id);
      setError(null);
      return;
    }
    setVideoId(null);
    setError("Enter a valid YouTube link or video ID.");
  }

  function handleSelectFavorite(item: FavoriteVideo) {
    setUrlInput(item.url);
    setVideoId(item.videoId);
    setError(null);
  }

  const favorited = Boolean(videoId && isFavorite(videoId));

  function handleFavoriteClick() {
    if (!videoId) return;
    if (favorited) {
      removeFavorite(videoId);
      return;
    }
    addFavorite({
      title: favoriteTitleForSave(lyrics, urlInput, videoId),
      url: watchUrlForVideoId(videoId),
      videoId,
    });
  }

  function handleSelectLyricLine(index: number) {
    setLineSelection({ kind: "line", index });
  }

  function handlePickSaved(record: SavedSentenceRecord) {
    const kr = record.korean.trim();
    if (lyrics.status === "ready") {
      const idx = lyrics.koreanLines.findIndex((l) => l.trim() === kr);
      if (idx >= 0) {
        setLineSelection({ kind: "line", index: idx });
        return;
      }
    }
    setLineSelection({
      kind: "saved",
      sentence: {
        korean: record.korean,
        translation: record.translation,
        romanization: record.romanization,
      },
    });
  }

  const panelVideoTitle =
    lyrics.status === "ready"
      ? lyrics.videoTitle
      : lyrics.status === "empty"
        ? lyrics.videoTitle ?? null
        : null;
  const panelChannelTitle =
    lyrics.status === "ready"
      ? lyrics.channelTitle
      : lyrics.status === "empty"
        ? lyrics.channelTitle ?? null
        : null;
  const panelTrackLabel = lyrics.status === "ready" ? lyrics.trackLabel : null;
  const panelKorean = lyrics.status === "ready" ? lyrics.koreanLines : [];
  const panelChinese = lyrics.status === "ready" ? lyrics.chineseLines : [];
  const panelStatus =
    lyrics.status === "idle"
      ? "idle"
      : lyrics.status === "loading"
        ? "loading"
        : lyrics.status === "error"
          ? "error"
          : lyrics.status === "empty"
            ? "empty"
            : "ready";
  const panelError = lyrics.status === "error" ? lyrics.message : null;
  const panelEmpty = lyrics.status === "empty" ? lyrics.detail ?? null : null;

  return (
    <div className="min-h-screen text-foreground">
      <div className="mx-auto flex min-h-screen max-w-[90rem] flex-col px-4 pb-16 pt-14 sm:px-6">
        <header className="mb-10">
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
            Korean lyrics
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
            Learn
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            Load a music video, tap a word for a quick popup or a line for the
            sentence panel — Chinese, pronunciation, and saved phrases with ❤️.
          </p>
        </header>

        <form
          onSubmit={handleSubmit}
          className="flex flex-col gap-3 sm:flex-row sm:items-stretch"
        >
          <label htmlFor="youtube-url" className="sr-only">
            YouTube URL
          </label>
          <input
            id="youtube-url"
            type="text"
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            placeholder="https://www.youtube.com/watch?v=…"
            autoComplete="off"
            spellCheck={false}
            className="h-11 w-full flex-1 rounded-lg border border-border bg-card px-4 text-sm text-foreground placeholder:text-muted-foreground outline-none ring-offset-background transition-[color,box-shadow] focus-visible:border-transparent focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          />
          <Button
            type="submit"
            className="h-11 shrink-0 rounded-lg bg-[#1DB954] px-6 font-semibold text-black hover:bg-[#1ed760]"
          >
            Load video
          </Button>
        </form>

        {error ? (
          <p className="mt-3 text-sm text-red-400" role="alert">
            {error}
          </p>
        ) : null}

        <div
          className={
            videoId
              ? "mt-10 grid gap-6 lg:grid-cols-[minmax(200px,220px)_1fr_minmax(min(100%,560px),1.15fr)] lg:items-start"
              : "mt-10 grid gap-6 lg:grid-cols-[minmax(200px,220px)_1fr] lg:items-start"
          }
        >
          <FavoritesPanel
            items={favorites}
            activeVideoId={videoId}
            onSelect={handleSelectFavorite}
            onRemove={removeFavorite}
          />

          {videoId ? (
            <>
              <div className="flex min-w-0 flex-col gap-3">
                <div className="overflow-hidden rounded-xl bg-black shadow-2xl ring-1 ring-white/10">
                  <div className="aspect-video w-full">
                    <iframe
                      key={videoId}
                      id={YOUTUBE_IFRAME_ID}
                      src={embedSrc}
                      title="YouTube video player"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                      allowFullScreen
                      className="h-full w-full border-0"
                      onLoad={onIframeLoad}
                    />
                  </div>
                </div>

                <Button
                  type="button"
                  variant="outline"
                  onClick={handleFavoriteClick}
                  className="h-11 w-full shrink-0 border-white/15 bg-card/50 text-foreground hover:bg-white/10 sm:w-auto sm:self-start"
                >
                  {favorited ? "★ Saved — tap to remove" : "⭐ Favorite"}
                </Button>
              </div>

              <div className="flex min-w-0 flex-col gap-4 lg:max-h-[min(72vh,680px)]">
                <div className="grid min-h-0 flex-1 gap-4 xl:grid-cols-2 xl:gap-3">
                  <LyricsPanel
                    videoTitle={panelVideoTitle}
                    channelTitle={panelChannelTitle}
                    trackLabel={panelTrackLabel}
                    koreanLines={panelKorean}
                    chineseLines={panelChinese}
                    status={panelStatus}
                    errorMessage={panelError}
                    emptyDetail={panelEmpty}
                    selectedLineIndex={selectedLineIndex}
                    onSelectLine={handleSelectLyricLine}
                    onSaveWord={saveSentence}
                    isWordSaved={isSaved}
                  />
                  <div className="flex min-h-0 flex-col gap-3 overflow-y-auto xl:max-h-[min(64vh,640px)]">
                    <SentencePanel
                      korean={activeKorean}
                      initialTranslation={activeChineseHint}
                      onSave={saveSentence}
                      isSaved={bookmarkedCurrent}
                    />
                    <SavedSentencesPanel
                      items={savedSentences}
                      onPick={handlePickSaved}
                      onRemove={removeSentence}
                    />
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="flex min-h-[200px] items-center justify-center rounded-xl border border-dashed border-white/15 bg-card/20 px-6 py-12 text-center text-sm text-muted-foreground">
              Paste a URL above or pick a saved favorite to start.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
