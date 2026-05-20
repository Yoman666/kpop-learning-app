"use client";

type Props = {
  videoTitle: string | null;
  channelTitle: string | null;
  trackLabel: string | null;
  koreanLines: string[];
  chineseLines: string[];
  status: "idle" | "loading" | "error" | "ready" | "empty";
  errorMessage: string | null;
  emptyDetail: string | null;
  selectedLineIndex: number | null;
  onSelectLine: (index: number) => void;
};

export function LyricsPanel({
  videoTitle,
  channelTitle,
  trackLabel,
  koreanLines,
  chineseLines,
  status,
  errorMessage,
  emptyDetail,
  selectedLineIndex,
  onSelectLine,
}: Props) {
  return (
    <aside className="flex h-full min-h-[240px] flex-col rounded-xl border border-white/10 bg-card/40 ring-1 ring-white/5 lg:max-h-[min(72vh,640px)] lg:min-h-[min(40vh,320px)]">
      <div className="border-b border-white/10 px-4 py-3">
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
          Lyrics
        </p>
        <p className="mt-1 line-clamp-2 text-sm font-medium text-foreground">
          {status === "loading"
            ? "Searching…"
            : trackLabel || videoTitle || "—"}
        </p>
        {channelTitle ? (
          <p className="mt-0.5 text-xs text-muted-foreground">{channelTitle}</p>
        ) : null}
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-3 py-3">
        {status === "loading" ? (
          <p className="px-1 text-sm text-muted-foreground">
            Looking up lyrics from the web using the video title…
          </p>
        ) : null}

        {status === "error" && errorMessage ? (
          <p className="px-1 text-sm text-red-400" role="alert">
            {errorMessage}
          </p>
        ) : null}

        {status === "empty" ? (
          <div className="space-y-2 px-1 text-sm text-muted-foreground">
            <p className="font-medium text-foreground/90">No lyrics loaded</p>
            <p>
              {emptyDetail?.trim() ||
                "We could not find lyrics for this song. Try another video."}
            </p>
          </div>
        ) : null}

        {status === "ready" && koreanLines.length > 0 ? (
          <ul className="flex flex-col gap-2">
            {koreanLines.map((kr, i) => {
              const selected = i === selectedLineIndex;
              return (
                <li key={`${i}-${kr.slice(0, 24)}`}>
                  <button
                    type="button"
                    onClick={() => onSelectLine(i)}
                    aria-pressed={selected}
                    className={`w-full rounded-lg px-3 py-2.5 text-left transition-colors ${
                      selected
                        ? "bg-white/12 ring-2 ring-[#1DB954] ring-offset-2 ring-offset-background"
                        : "bg-white/5 hover:bg-white/8"
                    }`}
                  >
                    <p className="text-[15px] leading-relaxed text-foreground">{kr}</p>
                    <p className="mt-1.5 border-l-2 border-[#1DB954]/50 pl-2.5 text-sm leading-relaxed text-muted-foreground">
                      {chineseLines[i] ?? "—"}
                    </p>
                  </button>
                </li>
              );
            })}
          </ul>
        ) : null}
      </div>
    </aside>
  );
}
