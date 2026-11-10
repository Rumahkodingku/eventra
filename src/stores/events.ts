import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { seedData } from "@/data/seed";
import { categories } from "@/data/seed/catalog";
import { cloneLayout, getTemplateLayout } from "@/data/seed/layouts";
import type { Event, TicketingMode, VenueLayout } from "@/domain/types";
import { createId, slugify } from "@/lib/ids";
import { safeStorage } from "@/lib/storage";

interface CreateEventInput {
  title: string;
  categoryId: string;
  venueId: string;
  startAt: string;
  endAt: string;
  timezone: string;
  ticketingMode: TicketingMode;
  description: string;
  coverImage: string;
  status: Event["status"];
  basePrice: number;
  subcategory?: string;
  highlights?: string[];
  schedule?: Event["schedule"];
  terms?: string[];
  ageNote?: string;
  accessibilityNote?: string;
  layoutId?: string;
}

interface EventState {
  events: Event[];
  createEvent: (input: CreateEventInput) => Event;
  updateEvent: (event: Event) => void;
  deleteEvent: (eventId: string) => void;
  markSeatsSold: (eventId: string, seatIds: string[]) => void;
  resetEvents: () => void;
}

function makeTickets(
  eventId: string,
  mode: TicketingMode,
  basePrice: number,
  startAt: string,
  layout: VenueLayout | undefined,
) {
  const start = new Date().toISOString();
  const end = new Date(
    new Date(startAt).getTime() - 2 * 86_400_000,
  ).toISOString();
  const baseTicket = {
    eventId,
    currency: "IDR" as const,
    quota: 200,
    soldCount: 0,
    minPerOrder: 1,
    maxPerOrder: 6,
    salesStartAt: start,
    salesEndAt: end,
    status: "ACTIVE" as const,
  };
  const ga = [
    {
      ...baseTicket,
      id: `tt-${eventId}-regular`,
      name: "Regular",
      description: "Akses area reguler.",
      price: basePrice,
      benefits: ["Akses area", "Kursi tidak bernomor"],
      kind: "GENERAL_ADMISSION" as const,
    },
    {
      ...baseTicket,
      id: `tt-${eventId}-vip`,
      name: "VIP",
      description: "Akses area VIP.",
      price: Math.round((basePrice * 1.6) / 1000) * 1000,
      quota: 80,
      benefits: ["Area VIP", "Fast lane"],
      kind: "GENERAL_ADMISSION" as const,
    },
  ];
  if (!layout) return ga;
  const seated = layout.sections.map((section) => ({
    ...baseTicket,
    id: `tt-${eventId}-${section.tierKey}`,
    name: section.name,
    description: section.label,
    price: Math.round((basePrice * 1.1) / 1000) * 1000,
    quota: section.seats.length,
    benefits: ["Kursi bernomor", "Akses area"],
    kind: "SEATED" as const,
    tierKey: section.tierKey,
  }));
  return mode === "RESERVED_SEATING" ? seated : [...ga, ...seated];
}

export const useEventStore = create<EventState>()(
  persist(
    (set) => ({
      events: seedData.events,
      createEvent: (input) => {
        const id = createId("evt");
        const category = categories.find(
          (item) => item.id === input.categoryId,
        );
        const layout =
          input.ticketingMode === "GENERAL_ADMISSION"
            ? undefined
            : cloneLayout(getTemplateLayout(input.layoutId));
        const event: Event = {
          id,
          slug: `${slugify(input.title)}-${id.slice(-4)}`,
          title: input.title,
          categoryId: input.categoryId,
          subcategory:
            input.subcategory || category?.subcategories[0] || "Event",
          description: input.description,
          coverImage: input.coverImage,
          gallery: [input.coverImage],
          organizerId: "org-rumahkodingku",
          status: input.status,
          ticketingMode: input.ticketingMode,
          startAt: input.startAt,
          endAt: input.endAt,
          timezone: input.timezone,
          venueId: input.venueId,
          tags: [category?.name ?? "Event"],
          highlights: input.highlights?.length
            ? input.highlights
            : [
                "Event baru dari organizer demo",
                "Detail dapat diubah kapan saja",
              ],
          schedule: input.schedule?.length
            ? input.schedule
            : [{ time: "19:00", title: "Doors open" }],
          terms: input.terms?.length
            ? input.terms
            : [
                "Tiket hanya berlaku untuk satu orang.",
                "Tunjukkan QR code di pintu masuk.",
                "Ini adalah event demo lokal.",
              ],
          ageNote: input.ageNote,
          accessibilityNote: input.accessibilityNote,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          isFeatured: false,
          isTrending: false,
          isRecommended: false,
          popularity: 50,
          limitedAvailability: false,
          isEarlyBird: false,
          ticketTypes: makeTickets(
            id,
            input.ticketingMode,
            input.basePrice,
            input.startAt,
            layout,
          ),
          layoutId: layout?.id,
          seatLayout: layout,
        };
        set((state) => ({ events: [event, ...state.events] }));
        return event;
      },
      updateEvent: (event) =>
        set((state) => ({
          events: state.events.map((item) =>
            item.id === event.id
              ? { ...event, updatedAt: new Date().toISOString() }
              : item,
          ),
        })),
      deleteEvent: (eventId) =>
        set((state) => ({
          events: state.events.filter((event) => event.id !== eventId),
        })),
      markSeatsSold: (eventId, seatIds) =>
        set((state) => ({
          events: state.events.map((event) => {
            if (event.id !== eventId || !event.seatLayout) return event;
            const seatSet = new Set(seatIds);
            return {
              ...event,
              seatLayout: {
                ...event.seatLayout,
                sections: event.seatLayout.sections.map((section) => ({
                  ...section,
                  seats: section.seats.map((seat) =>
                    seatSet.has(seat.id) ? { ...seat, status: "SOLD" } : seat,
                  ),
                })),
              },
            };
          }),
        })),
      resetEvents: () => set({ events: seedData.events }),
    }),
    {
      name: "eventra-events",
      version: 1,
      storage: createJSONStorage(() => safeStorage),
    },
  ),
);
