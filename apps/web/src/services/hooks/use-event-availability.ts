"use client";

import { useQuery } from "@tanstack/react-query";
import type { Event, SeatStatus } from "@/domain/types";
import { api } from "@/services/api/client";
import { apiMode, ticketRepository } from "@/services/repositories";

export function useEventAvailability(event: Event | undefined) {
  const availability = useQuery({
    queryKey: ["availability", event?.id],
    queryFn: () => ticketRepository.getAvailability(event?.id ?? ""),
    enabled: Boolean(event?.id),
  });
  const seats = useQuery({
    queryKey: ["seats", event?.id],
    queryFn: async () => {
      const result = await api.GET("/events/{eventId}/seats", {
        params: { path: { eventId: event?.id ?? "" } },
      });
      return new Set(result.data?.claimed ?? []);
    },
    enabled: apiMode && Boolean(event?.id) && Boolean(event?.seatLayout),
  });

  if (!event) {
    return { event, isLoading: false };
  }
  const ticketTypes = availability.data?.ticketTypes.map((ticket) => ({
    ...ticket,
    soldCount: Math.max(
      0,
      ticket.quota - (availability.data?.remaining[ticket.id] ?? ticket.quota),
    ),
  }));
  const claimed = seats.data;
  const seatLayout =
    claimed && event.seatLayout
      ? {
          id: event.seatLayout.id,
          name: event.seatLayout.name,
          sections: event.seatLayout.sections.map((section) => ({
            ...section,
            seats: section.seats.map((seat) => ({
              ...seat,
              status: (claimed.has(seat.id)
                ? "SOLD"
                : seat.status) as SeatStatus,
            })),
          })),
        }
      : event.seatLayout;

  return {
    event: {
      ...event,
      ticketTypes: ticketTypes ?? event.ticketTypes,
      seatLayout,
    },
    isLoading: availability.isLoading || seats.isLoading,
  };
}
