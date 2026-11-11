"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo } from "react";
import { seedData } from "@/data/seed";
import type { Review } from "@/domain/types";
import { reviewRepository } from "@/services/mock";
import { useReviewStore as useRawReviewStore } from "@/stores/reviews";

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

export function useReviewStore<T>(selector: (state: ReviewState) => T): T {
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: ["reviews"],
    queryFn: () => reviewRepository.list(),
    initialData: seedData.reviews,
  });

  const state = useMemo<ReviewState>(
    () => ({
      reviews: query.data ?? [],
      addReview: (input) => {
        useRawReviewStore.getState().addReview(input);
        void queryClient.invalidateQueries({ queryKey: ["reviews"] });
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
