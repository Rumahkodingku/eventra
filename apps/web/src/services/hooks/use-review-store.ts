"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo } from "react";
import { seedData } from "@/data/seed";
import type { Review } from "@/domain/types";
import { apiMode, reviewRepository } from "@/services/repositories";
import { useReviewStore as useRawReviewStore } from "@/stores/reviews";

interface ReviewState {
  reviews: Review[];
  addReview: (input: {
    eventId: string;
    userId?: string;
    authorName: string;
    rating: number;
    comment: string;
  }) => Promise<void>;
  reset: () => void;
}

export function useReviewStore<T>(
  eventId: string | undefined,
  selector: (state: ReviewState) => T,
): T {
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: ["reviews", eventId],
    queryFn: () => reviewRepository.list(eventId),
    initialData: apiMode
      ? undefined
      : seedData.reviews.filter(
          (review) => !eventId || review.eventId === eventId,
        ),
  });

  const state = useMemo<ReviewState>(
    () => ({
      reviews: query.data ?? [],
      addReview: async (input) => {
        if (apiMode) {
          await reviewRepository.add(input);
        } else {
          useRawReviewStore.getState().addReview(input);
        }
        await queryClient.invalidateQueries({ queryKey: ["reviews"] });
      },
      reset: () => {
        useRawReviewStore.getState().reset();
        void queryClient.invalidateQueries({ queryKey: ["reviews"] });
      },
    }),
    [query.data, queryClient],
  );

  return selector(state);
}
