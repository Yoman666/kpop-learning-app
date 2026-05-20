"use client";

import type { SavedSentenceRecord } from "@/lib/saved-sentences-storage";

type Props = {
  items: SavedSentenceRecord[];
  onPick: (record: SavedSentenceRecord) => void;
  onRemove: (id: string) => void;
};

export function SavedSentencesPanel({ items, onPick, onRemove }: Props) {
  return (
    <aside className="flex max-h-[280px] flex-col rounded-xl border border-white/10 bg-card/30 ring-1 ring-white/5">
      <div className="border-b border-white/10 px-3 py-2.5">
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
          Saved sentences
        </p>
        <p className="mt-0.5 text-xs text-muted-foreground">{items.length} total</p>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto px-2 py-2">
        {items.length === 0 ? (
          <p className="px-2 py-2 text-xs text-muted-foreground">
            Save lines with ❤️ to build your phrase list.
          </p>
        ) : (
          <ul className="flex flex-col gap-1">
            {items.map((item) => (
              <li
                key={item.id}
                className="group relative rounded-lg border border-transparent hover:border-white/10 hover:bg-white/5"
              >
                <button
                  type="button"
                  onClick={() => onPick(item)}
                  className="w-full px-2.5 py-2 pr-7 text-left"
                >
                  <span className="line-clamp-2 text-xs font-medium leading-snug text-foreground">
                    {item.korean}
                  </span>
                  <span className="mt-0.5 line-clamp-1 text-[10px] text-muted-foreground">
                    {item.translation}
                  </span>
                </button>
                <button
                  type="button"
                  aria-label="Remove saved sentence"
                  onClick={(e) => {
                    e.stopPropagation();
                    onRemove(item.id);
                  }}
                  className="absolute right-1 top-2 flex size-6 items-center justify-center rounded text-muted-foreground opacity-0 hover:bg-white/10 hover:text-foreground group-hover:opacity-100"
                >
                  ×
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </aside>
  );
}
