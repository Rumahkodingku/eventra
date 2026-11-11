"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo } from "react";
import { wishlistRepository } from "@/services/mock";
import { useWishlistStore as useRawWishlistStore } from "@/stores/wishlist";

interface WishlistState {
  eventIds: string[];
  toggle: (eventId: string) => void;
  has: (eventId: string) => boolean;
  clear: () => void;
}

export function useWishlistStore<T>(selector: (state: WishlistState) => T): T {
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: ["wishlist"],
    queryFn: wishlistRepository.list,
    initialData: [],
  });

  const state = useMemo<WishlistState>(
    () => ({
      eventIds: query.data ?? [],
      toggle: (eventId) => {
        useRawWishlistStore.getState().toggle(eventId);
        void queryClient.invalidateQueries({ queryKey: ["wishlist"] });
      },
      has: (eventId) => (query.data ?? []).includes(eventId),
      clear: () => {
        useRawWishlistStore.getState().clear();
        void queryClient.invalidateQueries({ queryKey: ["wishlist"] });
      },
    }),
    [query.data, queryClient],
  );

  return selector(state);
}
