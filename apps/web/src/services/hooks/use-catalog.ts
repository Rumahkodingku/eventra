"use client";

import { useQuery } from "@tanstack/react-query";
import { seedData } from "@/data/seed";
import { categories, organizers, venues } from "@/data/seed/catalog";
import { eventRepository } from "@/services/mock";

export function useCatalog() {
  const query = useQuery({
    queryKey: ["catalog"],
    queryFn: eventRepository.catalog,
    initialData: {
      categories,
      venues,
      organizers,
      promos: seedData.promos,
    },
    staleTime: Number.POSITIVE_INFINITY,
  });

  return query.data;
}
