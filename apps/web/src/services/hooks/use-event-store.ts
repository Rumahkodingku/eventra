"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo } from "react";
import { seedData } from "@/data/seed";
import type { Event } from "@/domain/types";
import { eventRepository } from "@/services/mock";
import type { CreateEventInput } from "@/services/repositories/types";
import { useEventStore as useRawEventStore } from "@/stores/events";

interface EventState {
  events: Event[];
  createEvent: (input: CreateEventInput) => Event;
  updateEvent: (event: Event) => void;
  deleteEvent: (eventId: string) => void;
  markSeatsSold: (eventId: string, seatIds: string[]) => void;
  resetEvents: () => void;
}

export function useEventStore<T>(selector: (state: EventState) => T): T {
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: ["events"],
    queryFn: eventRepository.list,
    initialData: seedData.events,
  });

  const state = useMemo<EventState>(
    () => ({
      events: query.data ?? [],
      createEvent: (input) => {
        const event = useRawEventStore.getState().createEvent(input);
        void queryClient.invalidateQueries({ queryKey: ["events"] });
        return event;
      },
      updateEvent: (event) => {
        useRawEventStore.getState().updateEvent(event);
        void queryClient.invalidateQueries({ queryKey: ["events"] });
      },
      deleteEvent: (eventId) => {
        useRawEventStore.getState().deleteEvent(eventId);
        void queryClient.invalidateQueries({ queryKey: ["events"] });
      },
      markSeatsSold: (eventId, seatIds) => {
        useRawEventStore.getState().markSeatsSold(eventId, seatIds);
        void queryClient.invalidateQueries({ queryKey: ["events"] });
      },
      resetEvents: () => {
        useRawEventStore.getState().resetEvents();
        void queryClient.invalidateQueries({ queryKey: ["events"] });
      },
    }),
    [query.data, queryClient],
  );

  return selector(state);
}
