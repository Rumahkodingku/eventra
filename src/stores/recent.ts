import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { safeStorage } from "@/lib/storage";

interface RecentState {
  eventIds: string[];
  searches: string[];
  addView: (eventId: string) => void;
  addSearch: (query: string) => void;
  removeSearch: (query: string) => void;
  clearSearches: () => void;
  clearViews: () => void;
}

export const useRecentStore = create<RecentState>()(
  persist(
    (set) => ({
      eventIds: [],
      searches: [],
      addView: (eventId) =>
        set((state) => ({
          eventIds: [
            eventId,
            ...state.eventIds.filter((id) => id !== eventId),
          ].slice(0, 8),
        })),
      addSearch: (query) =>
        set((state) => {
          const normalized = query.trim();
          if (!normalized) return state;
          return {
            searches: [
              normalized,
              ...state.searches.filter(
                (item) => item.toLowerCase() !== normalized.toLowerCase(),
              ),
            ].slice(0, 5),
          };
        }),
      removeSearch: (query) =>
        set((state) => ({
          searches: state.searches.filter(
            (item) => item.toLowerCase() !== query.toLowerCase(),
          ),
        })),
      clearSearches: () => set({ searches: [] }),
      clearViews: () => set({ eventIds: [] }),
    }),
    {
      name: "eventra-recent",
      version: 1,
      storage: createJSONStorage(() => safeStorage),
    },
  ),
);
