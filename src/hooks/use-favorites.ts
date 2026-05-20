"use client";

import { useCallback, useEffect, useState } from "react";

import type { FavoriteVideo } from "@/lib/favorites-storage";
import {
  loadFavorites,
  removeFavoriteById,
  saveFavorites,
  upsertFavorite,
} from "@/lib/favorites-storage";

export function useFavorites() {
  const [items, setItems] = useState<FavoriteVideo[]>([]);

  useEffect(() => {
    setItems(loadFavorites());
  }, []);

  const addFavorite = useCallback((item: FavoriteVideo) => {
    setItems((prev) => {
      const next = upsertFavorite(prev, item);
      saveFavorites(next);
      return next;
    });
  }, []);

  const removeFavorite = useCallback((videoId: string) => {
    setItems((prev) => {
      const next = removeFavoriteById(prev, videoId);
      saveFavorites(next);
      return next;
    });
  }, []);

  const isFavorite = useCallback(
    (videoId: string | null) =>
      Boolean(videoId && items.some((x) => x.videoId === videoId)),
    [items]
  );

  return { items, addFavorite, removeFavorite, isFavorite };
}
