export type Sentence = {
  korean: string;
  translation: string;
  romanization?: string;
};

/** Persisted bookmark with stable id for list keys. */
export type SavedSentenceRecord = Sentence & {
  id: string;
  savedAt: number;
};

const STORAGE_KEY = "kpop-saved-sentences";

function isSavedRecord(x: unknown): x is SavedSentenceRecord {
  if (!x || typeof x !== "object") return false;
  const o = x as Record<string, unknown>;
  return (
    typeof o.id === "string" &&
    typeof o.korean === "string" &&
    typeof o.translation === "string" &&
    typeof o.savedAt === "number"
  );
}

export function loadSavedSentences(): SavedSentenceRecord[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isSavedRecord);
  } catch {
    return [];
  }
}

export function saveSavedSentences(items: SavedSentenceRecord[]): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

export function upsertSavedSentence(
  list: SavedSentenceRecord[],
  sentence: Sentence
): SavedSentenceRecord[] {
  const id = hashKorean(sentence.korean);
  const next: SavedSentenceRecord = {
    ...sentence,
    id,
    savedAt: Date.now(),
  };
  const rest = list.filter((x) => x.id !== id);
  return [next, ...rest];
}

export function removeSavedSentence(
  list: SavedSentenceRecord[],
  id: string
): SavedSentenceRecord[] {
  return list.filter((x) => x.id !== id);
}

function hashKorean(korean: string): string {
  let h = 0;
  const s = korean.trim();
  for (let i = 0; i < s.length; i++) {
    h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;
  }
  return `s_${Math.abs(h)}_${s.length}`;
}
