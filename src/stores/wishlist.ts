import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { safeStorage } from "@/lib/storage";

interface WishlistState {
  eventIds: string[];
  toggle: (eventId: string) => void;
  has: (eventId: string) => boolean;
  clear: () => void;
}

export const useWishlistStore = create<WishlistState>()(
  persist(
    (set, get) => ({
      eventIds: [],
      toggle: (eventId) =>
        set((state) => ({
          eventIds: state.eventIds.includes(eventId)
            ? state.eventIds.filter((id) => id !== eventId)
            : [eventId, ...state.eventIds],
        })),
      has: (eventId) => get().eventIds.includes(eventId),
      clear: () => set({ eventIds: [] }),
    }),
    {
      name: "eventra-wishlist",
      version: 1,
      storage: createJSONStorage(() => safeStorage),
    },
  ),
);
