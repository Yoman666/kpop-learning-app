"use client";

import { useCallback, useEffect, useState } from "react";

import type { SavedSentenceRecord, Sentence } from "@/lib/saved-sentences-storage";
import {
  loadSavedSentences,
  removeSavedSentence,
  saveSavedSentences,
  upsertSavedSentence,
} from "@/lib/saved-sentences-storage";

export function useSavedSentences() {
  const [items, setItems] = useState<SavedSentenceRecord[]>([]);

  useEffect(() => {
    setItems(loadSavedSentences());
  }, []);

  const saveSentence = useCallback((sentence: Sentence) => {
    setItems((prev) => {
      const next = upsertSavedSentence(prev, sentence);
      saveSavedSentences(next);
      return next;
    });
  }, []);

  const removeSentence = useCallback((id: string) => {
    setItems((prev) => {
      const next = removeSavedSentence(prev, id);
      saveSavedSentences(next);
      return next;
    });
  }, []);

  const isSaved = useCallback(
    (korean: string) => {
      const trimmed = korean.trim();
      return items.some((x) => x.korean.trim() === trimmed);
    },
    [items]
  );

  return { items, saveSentence, removeSentence, isSaved };
}
