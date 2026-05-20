"use client";

import type { FavoriteVideo } from "@/lib/favorites-storage";

type Props = {
  items: FavoriteVideo[];
  activeVideoId: string | null;
  onSelect: (item: FavoriteVideo) => void;
  onRemove: (videoId: string) => void;
};

export function FavoritesPanel({
  items,
  activeVideoId,
  onSelect,
  onRemove,
}: Props) {
  return (
    <aside className="flex min-h-[200px] flex-col rounded-xl border border-white/10 bg-card/40 ring-1 ring-white/5 lg:max-h-[min(70vh,620px)] lg:min-h-0">
      <div className="border-b border-white/10 px-3 py-3">
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
          Favorites
        </p>
        <p className="mt-1 text-sm font-medium text-foreground">
          {items.length} saved
        </p>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-2 py-2">
        {items.length === 0 ? (
          <p className="px-2 py-3 text-sm text-muted-foreground">
            Star a video below the player to save it here.
          </p>
        ) : (
          <ul className="flex flex-col gap-1">
            {items.map((item) => {
              const active = item.videoId === activeVideoId;
              return (
                <li key={item.videoId} className="group relative">
                  <button
                    type="button"
                    onClick={() => onSelect(item)}
                    className={`w-full rounded-lg px-2.5 py-2.5 pr-8 text-left transition-colors ${
                      active
                        ? "bg-white/10 ring-1 ring-[#1DB954]/40"
                        : "hover:bg-white/5"
                    }`}
                  >
                    <span className="line-clamp-2 text-sm font-medium leading-snug text-foreground">
                      {item.title}
                    </span>
                    <span className="mt-0.5 block truncate font-mono text-[10px] text-muted-foreground">
                      {item.videoId}
                    </span>
                  </button>
                  <button
                    type="button"
                    aria-label={`Remove ${item.title} from favorites`}
                    onClick={(e) => {
                      e.stopPropagation();
                      onRemove(item.videoId);
                    }}
                    className="absolute right-1 top-1/2 flex size-7 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground opacity-0 transition-opacity hover:bg-white/10 hover:text-foreground group-hover:opacity-100"
                  >
                    ×
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </aside>
  );
}
