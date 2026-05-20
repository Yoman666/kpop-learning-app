"use client";

import { useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { speakKorean } from "@/lib/korean-speech";
import type { Sentence } from "@/lib/saved-sentences-storage";

type Props = {
  korean: string;
  anchor: { x: number; y: number };
  onClose: () => void;
  onSave: (sentence: Sentence) => void;
  isSaved: boolean;
};

export function WordPopup({ korean, anchor, onClose, onSave, isSaved }: Props) {
  const panelRef = useRef<HTMLDivElement>(null);
  const [translation, setTranslation] = useState("");
  const [romanization, setRomanization] = useState("");
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setNotice(null);
    setTranslation("");
    setRomanization("");

    fetch("/api/word-enrich", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ korean }),
    })
      .then(async (res) => {
        const data = (await res.json()) as {
          translation?: string;
          romanization?: string;
          notice?: string;
        };
        if (cancelled) return;
        setTranslation((data.translation ?? "").trim());
        setRomanization((data.romanization ?? "").trim());
        setNotice(data.notice?.trim() || null);
      })
      .catch(() => {
        if (cancelled) return;
        setNotice("Could not load word details.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [korean]);

  useEffect(() => {
    function onPointerDown(e: PointerEvent) {
      const el = panelRef.current;
      if (el && !el.contains(e.target as Node)) onClose();
    }
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [onClose]);

  const rom = romanization.trim();
  const left = Math.min(Math.max(anchor.x, 120), window.innerWidth - 120);
  const top = Math.max(anchor.y - 12, 80);

  return (
    <div
      className="fixed inset-0 z-50"
      role="presentation"
      aria-hidden={false}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-labelledby="word-popup-title"
        className="absolute w-[min(18rem,calc(100vw-1.5rem))] -translate-x-1/2 -translate-y-full rounded-xl border border-white/15 bg-card px-4 py-3 shadow-2xl ring-1 ring-white/10"
        style={{ left, top }}
      >
        <p
          id="word-popup-title"
          className="text-lg font-semibold leading-snug text-foreground"
        >
          {korean}
        </p>

        <div className="mt-3 space-y-2.5">
          <div>
            <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
              Chinese
            </p>
            <p className="mt-0.5 text-sm text-foreground/90">
              {loading ? "…" : translation || "—"}
            </p>
          </div>

          <div>
            <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
              Pronunciation
            </p>
            {rom ? (
              <p className="mt-0.5 font-mono text-sm text-[#1ed760]/90">{rom}</p>
            ) : (
              <p className="mt-0.5 text-xs text-muted-foreground">
                {loading ? "…" : "Tap play to hear"}
              </p>
            )}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => speakKorean(korean)}
              className="mt-2 h-8 border-white/20 bg-white/5 text-xs text-foreground hover:bg-white/10"
            >
              ▶ Play
            </Button>
          </div>

          {notice ? (
            <p className="text-xs text-amber-400/90">{notice}</p>
          ) : null}
        </div>

        <div className="mt-3 flex gap-2">
          <Button
            type="button"
            onClick={() =>
              onSave({
                korean,
                translation,
                romanization: rom || undefined,
              })
            }
            disabled={isSaved || loading}
            className={
              isSaved
                ? "h-9 flex-1 border border-white/10 bg-white/5 text-xs text-muted-foreground"
                : "h-9 flex-1 bg-[#1DB954] text-xs font-semibold text-black hover:bg-[#1ed760]"
            }
          >
            {isSaved ? "❤️ Saved" : "❤️ Save"}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className="h-9 shrink-0 border-white/15 px-3 text-xs"
          >
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}
