"use client";

import { useState } from "react";

import { WordPopup } from "@/components/word-popup";
import { tokenizeKoreanLine } from "@/lib/korean-tokens";
import type { Sentence } from "@/lib/saved-sentences-storage";

type WordPopupState = {
  korean: string;
  anchor: { x: number; y: number };
};

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
  onSaveWord: (sentence: Sentence) => void;
  isWordSaved: (korean: string) => boolean;
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
  onSaveWord,
  isWordSaved,
}: Props) {
  const [wordPopup, setWordPopup] = useState<WordPopupState | null>(null);

  function handleWordClick(word: string, e: React.MouseEvent) {
    e.stopPropagation();
    const trimmed = word.trim();
    if (!trimmed) return;
    setWordPopup({
      korean: trimmed,
      anchor: { x: e.clientX, y: e.clientY },
    });
  }

  return (
    <aside className="relative flex h-full min-h-[240px] flex-col rounded-xl border border-white/10 bg-card/40 ring-1 ring-white/5 lg:max-h-[min(72vh,640px)] lg:min-h-[min(40vh,320px)]">
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
        {status === "ready" ? (
          <p className="mt-1.5 text-[11px] text-muted-foreground">
            Tap a word for translation · tap a line for the sentence panel
          </p>
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
              const tokens = tokenizeKoreanLine(kr);
              return (
                <li key={`${i}-${kr.slice(0, 24)}`}>
                  <div
                    role="button"
                    tabIndex={0}
                    onClick={() => onSelectLine(i)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        onSelectLine(i);
                      }
                    }}
                    aria-pressed={selected}
                    className={`w-full cursor-pointer rounded-lg px-3 py-2.5 text-left transition-colors ${
                      selected
                        ? "bg-white/12 ring-2 ring-[#1DB954] ring-offset-2 ring-offset-background"
                        : "bg-white/5 hover:bg-white/8"
                    }`}
                  >
                    <p className="text-[15px] leading-relaxed text-foreground">
                      {tokens.map((tok, ti) =>
                        tok.kind === "word" ? (
                          <button
                            key={`${i}-w-${ti}-${tok.text}`}
                            type="button"
                            onClick={(e) => handleWordClick(tok.text, e)}
                            className="rounded px-0.5 font-inherit text-inherit underline decoration-[#1DB954]/40 decoration-dotted underline-offset-[3px] transition-colors hover:bg-[#1DB954]/15 hover:decoration-[#1DB954]"
                          >
                            {tok.text}
                          </button>
                        ) : (
                          <span key={`${i}-t-${ti}`}>{tok.text}</span>
                        )
                      )}
                    </p>
                    <p className="mt-1.5 border-l-2 border-[#1DB954]/50 pl-2.5 text-sm leading-relaxed text-muted-foreground">
                      {chineseLines[i] ?? "—"}
                    </p>
                  </div>
                </li>
              );
            })}
          </ul>
        ) : null}
      </div>

      {wordPopup ? (
        <WordPopup
          korean={wordPopup.korean}
          anchor={wordPopup.anchor}
          onClose={() => setWordPopup(null)}
          onSave={(sentence) => {
            onSaveWord(sentence);
            setWordPopup(null);
          }}
          isSaved={isWordSaved(wordPopup.korean)}
        />
      ) : null}
    </aside>
  );
}
