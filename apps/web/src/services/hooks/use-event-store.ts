"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { usePathname } from "next/navigation";
import { useMemo } from "react";
import { seedData } from "@/data/seed";
import type { Event } from "@/domain/types";
import {
  apiMode,
  eventRepository,
  organizerRepository,
} from "@/services/repositories";
import type { CreateEventInput } from "@/services/repositories/types";
import { useEventStore as useRawEventStore } from "@/stores/events";

interface EventState {
  events: Event[];
  isLoading: boolean;
  error: string | null;
  createEvent: (input: CreateEventInput) => Promise<Event>;
  updateEvent: (event: Event) => Promise<void>;
  deleteEvent: (eventId: string) => Promise<void>;
  markSeatsSold: (eventId: string, seatIds: string[]) => Promise<void>;
  resetEvents: () => void;
}

export function useEventStore<T>(selector: (state: EventState) => T): T {
  const queryClient = useQueryClient();
  const pathname = usePathname();
  const organizerScope = pathname.startsWith("/organizer");
  const query = useQuery({
    queryKey: ["events", organizerScope ? "organizer" : "public"],
    queryFn: organizerScope
      ? organizerRepository.listEvents
      : eventRepository.list,
    initialData: apiMode ? undefined : seedData.events,
  });

  const state = useMemo<EventState>(
    () => ({
      events: query.data ?? [],
      isLoading: query.isLoading,
      error: query.error ? "Could not load events." : null,
      createEvent: async (input) => {
        const event = apiMode
          ? await organizerRepository.createEvent(input)
          : useRawEventStore.getState().createEvent(input);
        await queryClient.invalidateQueries({ queryKey: ["events"] });
        return event;
      },
      updateEvent: async (event) => {
        if (apiMode) {
          await organizerRepository.updateEvent(event);
        } else {
          useRawEventStore.getState().updateEvent(event);
        }
        await queryClient.invalidateQueries({ queryKey: ["events"] });
      },
      deleteEvent: async (eventId) => {
        if (apiMode) {
          await organizerRepository.deleteEvent(eventId);
        } else {
          useRawEventStore.getState().deleteEvent(eventId);
        }
        await queryClient.invalidateQueries({ queryKey: ["events"] });
      },
      markSeatsSold: async (eventId, seatIds) => {
        if (apiMode) {
          await organizerRepository.markSeatsSold(eventId, seatIds);
        } else {
          useRawEventStore.getState().markSeatsSold(eventId, seatIds);
        }
        await queryClient.invalidateQueries({ queryKey: ["events"] });
      },
      resetEvents: () => {
        useRawEventStore.getState().resetEvents();
        void queryClient.invalidateQueries({ queryKey: ["events"] });
      },
    }),
    [query.data, query.isLoading, query.error, queryClient],
  );

  return selector(state);
}
