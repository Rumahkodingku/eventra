"use client";

import { useQuery } from "@tanstack/react-query";
import { seedData } from "@/data/seed";
import { categories, organizers, venues } from "@/data/seed/catalog";
import { apiMode, eventRepository } from "@/services/repositories";

const fallback = {
  categories: apiMode ? [] : categories,
  venues: apiMode ? [] : venues,
  organizers: apiMode ? [] : organizers,
  promos: seedData.promos,
};

export function useCatalog() {
  const query = useQuery({
    queryKey: ["catalog"],
    queryFn: eventRepository.catalog,
    initialData: apiMode ? undefined : fallback,
    staleTime: Number.POSITIVE_INFINITY,
  });

  return {
    ...(query.data ?? fallback),
    isLoading: query.isLoading,
    error: query.error ? "Could not load catalog." : null,
  };
}
