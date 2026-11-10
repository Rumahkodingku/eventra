import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { seedData } from "@/data/seed";
import type { Review } from "@/domain/types";
import { createId } from "@/lib/ids";
import { safeStorage } from "@/lib/storage";

interface ReviewState {
  reviews: Review[];
  addReview: (input: {
    eventId: string;
    userId?: string;
    authorName: string;
    rating: number;
    comment: string;
  }) => void;
  reset: () => void;
}

export const useReviewStore = create<ReviewState>()(
  persist(
    (set) => ({
      reviews: seedData.reviews,
      addReview: (input) =>
        set((state) => ({
          reviews: [
            {
              id: createId("review"),
              createdAt: new Date().toISOString(),
              ...input,
            },
            ...state.reviews,
          ],
        })),
      reset: () => set({ reviews: seedData.reviews }),
    }),
    {
      name: "eventra-reviews",
      version: 1,
      storage: createJSONStorage(() => safeStorage),
    },
  ),
);
