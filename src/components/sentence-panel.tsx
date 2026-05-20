"use client";

import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import type { Sentence } from "@/lib/saved-sentences-storage";

type Props = {
  /** Korean line to study; null clears panel. */
  korean: string | null;
  /** Rough gloss from lyrics pipeline (shown until enrich returns). */
  initialTranslation: string;
  onSave: (sentence: Sentence) => void;
  /** Whether this exact Korean line is already in saved list. */
  isSaved: boolean;
};

function speakKorean(text: string) {
  if (typeof window === "undefined" || !text.trim()) return;
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = "ko-KR";
  u.rate = 0.9;
  const pickVoice = () => {
    const voices = window.speechSynthesis.getVoices();
    return voices.find((v) => v.lang.startsWith("ko")) ?? null;
  };
  const v = pickVoice();
  if (v) u.voice = v;
  window.speechSynthesis.speak(u);
}

export function SentencePanel({
  korean,
  initialTranslation,
  onSave,
  isSaved,
}: Props) {
  const [sentence, setSentence] = useState<Sentence>({
    korean: "",
    translation: "",
    romanization: "",
  });
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    if (!korean?.trim()) {
      setSentence({ korean: "", translation: "", romanization: "" });
      setNotice(null);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setNotice(null);
    setSentence({
      korean: korean.trim(),
      translation: initialTranslation.trim(),
      romanization: "",
    });

    fetch("/api/sentence-enrich", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        korean: korean.trim(),
        translation: initialTranslation.trim(),
      }),
    })
      .then(async (res) => {
        const data = (await res.json()) as {
          translation?: string;
          romanization?: string;
          notice?: string;
        };
        if (cancelled) return;
        setSentence({
          korean: korean.trim(),
          translation: (data.translation ?? initialTranslation).trim(),
          romanization: (data.romanization ?? "").trim(),
        });
        setNotice(data.notice?.trim() || null);
      })
      .catch(() => {
        if (cancelled) return;
        setSentence({
          korean: korean.trim(),
          translation: initialTranslation.trim(),
          romanization: "",
        });
        setNotice("Could not reach translation service.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [korean, initialTranslation]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const handler = () => {
      window.speechSynthesis.getVoices();
    };
    window.speechSynthesis.addEventListener("voiceschanged", handler);
    handler();
    return () =>
      window.speechSynthesis.removeEventListener("voiceschanged", handler);
  }, []);

  if (!korean?.trim()) {
    return (
      <aside className="flex min-h-[200px] flex-col rounded-xl border border-white/10 bg-card/40 p-4 ring-1 ring-white/5">
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
          Sentence
        </p>
        <p className="mt-4 text-sm text-muted-foreground">
          Tap a lyric line to study it here — Korean, Chinese, romanization, and
          pronunciation.
        </p>
      </aside>
    );
  }

  const rom = sentence.romanization?.trim();

  return (
    <aside className="flex flex-col rounded-xl border border-white/10 bg-card/40 ring-1 ring-white/5">
      <div className="border-b border-white/10 px-4 py-3">
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
          Sentence
        </p>
        {loading ? (
          <p className="mt-1 text-xs text-muted-foreground">Enriching…</p>
        ) : null}
      </div>

      <div className="flex flex-1 flex-col gap-4 px-4 py-4">
        <div>
          <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
            Korean
          </p>
          <p className="mt-1 text-lg font-medium leading-snug text-foreground">
            {sentence.korean}
          </p>
        </div>

        {rom ? (
          <div>
            <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
              Romanization
            </p>
            <p className="mt-1 font-mono text-sm leading-relaxed text-[#1ed760]/90">
              {rom}
            </p>
          </div>
        ) : null}

        <div>
          <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
            Chinese
          </p>
          <p className="mt-1 text-sm leading-relaxed text-foreground/90">
            {sentence.translation || "—"}
          </p>
        </div>

        {notice ? (
          <p className="text-xs text-amber-400/90">{notice}</p>
        ) : null}

        <div className="mt-auto flex flex-wrap gap-2 pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => speakKorean(sentence.korean)}
            className="border-white/20 bg-white/5 text-foreground hover:bg-white/10"
          >
            ▶ Play pronunciation
          </Button>
          <Button
            type="button"
            onClick={() =>
              onSave({
                korean: sentence.korean,
                translation: sentence.translation,
                romanization: rom || undefined,
              })
            }
            disabled={isSaved}
            className={
              isSaved
                ? "border border-white/10 bg-white/5 text-muted-foreground"
                : "bg-[#1DB954] font-semibold text-black hover:bg-[#1ed760]"
            }
          >
            {isSaved ? "❤️ Saved" : "❤️ Save sentence"}
          </Button>
        </div>
      </div>
    </aside>
  );
}
