import { findSeat, findSectionForSeat, seatLabel } from "@/data/seed/layouts";
import type {
  Event,
  Seat,
  Section,
  TicketType,
  VenueLayout,
} from "@/domain/types";

export function getSection(
  layout: VenueLayout,
  sectionId: string,
): Section | undefined {
  return layout.sections.find((section) => section.id === sectionId);
}

export function getTicketForSection(
  event: Event,
  section: Section,
): TicketType | undefined {
  return event.ticketTypes.find(
    (ticket) => ticket.kind === "SEATED" && ticket.tierKey === section.tierKey,
  );
}

export function getSeatPrice(
  event: Event,
  seatId: string,
): { seat?: Seat; section?: Section; ticket?: TicketType } {
  if (!event.seatLayout) return {};
  const seat = findSeat(event.seatLayout, seatId);
  const section = findSectionForSeat(event.seatLayout, seatId);
  const ticket = section ? getTicketForSection(event, section) : undefined;
  return { seat, section, ticket };
}

export function getSeatLabel(event: Event, seatId: string): string {
  if (!event.seatLayout) return seatId;
  const label = seatLabel(event.seatLayout, seatId);
  if (!label) return seatId;
  return `${label.section} · ${label.row}${label.number}`;
}

export function getSelectableSeats(event: Event, sectionId: string): Seat[] {
  const section = event.seatLayout
    ? getSection(event.seatLayout, sectionId)
    : undefined;
  return section?.seats.filter((seat) => seat.status === "AVAILABLE") ?? [];
}

export function countSectionSeats(event: Event, sectionId: string): number {
  const section = event.seatLayout
    ? getSection(event.seatLayout, sectionId)
    : undefined;
  return section?.seats.length ?? 0;
}

export function isSeatAvailable(event: Event, seatId: string): boolean {
  const seat = event.seatLayout
    ? findSeat(event.seatLayout, seatId)
    : undefined;
  return seat?.status === "AVAILABLE";
}
