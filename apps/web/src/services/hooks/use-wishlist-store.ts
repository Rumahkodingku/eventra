"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo } from "react";
import { apiMode, wishlistRepository } from "@/services/repositories";
import { useWishlistStore as useRawWishlistStore } from "@/stores/wishlist";

interface WishlistState {
  eventIds: string[];
  toggle: (eventId: string) => Promise<void>;
  has: (eventId: string) => boolean;
  clear: () => Promise<void>;
}

export function useWishlistStore<T>(selector: (state: WishlistState) => T): T {
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: ["wishlist"],
    queryFn: wishlistRepository.list,
    initialData: apiMode ? undefined : [],
  });

  const state = useMemo<WishlistState>(
    () => ({
      eventIds: query.data ?? [],
      toggle: async (eventId) => {
        if (apiMode) {
          await wishlistRepository.toggle(eventId);
        } else {
          useRawWishlistStore.getState().toggle(eventId);
        }
        await queryClient.invalidateQueries({ queryKey: ["wishlist"] });
      },
      has: (eventId) => (query.data ?? []).includes(eventId),
      clear: async () => {
        if (apiMode) {
          await wishlistRepository.clear();
        } else {
          useRawWishlistStore.getState().clear();
        }
        await queryClient.invalidateQueries({ queryKey: ["wishlist"] });
      },
    }),
    [query.data, queryClient],
  );

  return selector(state);
}
