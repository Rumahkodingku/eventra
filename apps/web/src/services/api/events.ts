import type { components } from "@eventra/api-client";
import { seedData } from "@/data/seed";
import type {
  Category,
  Event,
  Organizer,
  TicketType,
  Venue,
  VenueLayout,
} from "@/domain/types";
import { api } from "@/services/api/client";
import { organizerRepository as mockOrganizerRepository } from "@/services/mock";
import type {
  CatalogView,
  CreateEventInput,
  EventRepository,
  OrganizerRepository,
} from "@/services/repositories/types";

type ApiEvent = components["schemas"]["EventDetail"];
type ApiTicketType = components["schemas"]["TicketType"];
type ApiLayout = components["schemas"]["VenueLayout"];
type ApiCategory = components["schemas"]["Category"];
type ApiVenue = components["schemas"]["Venue"];
type ApiOrganizer = components["schemas"]["Organizer"];
type ApiEventInput = components["schemas"]["OrganizerEventCreate"];

function mapTicketType(ticket: ApiTicketType): TicketType {
  return {
    id: ticket.id,
    eventId: ticket.event_id,
    name: ticket.name,
    description: ticket.description ?? "",
    price: ticket.price,
    currency: "IDR",
    quota: ticket.quota,
    soldCount: ticket.sold_count,
    minPerOrder: ticket.min_per_order ?? 1,
    maxPerOrder: ticket.max_per_order ?? 6,
    salesStartAt: ticket.sales_start_at ?? "",
    salesEndAt: ticket.sales_end_at ?? "",
    benefits: ticket.benefits ?? [],
    status: ticket.status,
    kind: ticket.kind,
    tierKey: ticket.tier_key,
  };
}

function mapLayout(layout: ApiLayout): VenueLayout {
  return {
    id: layout.id,
    name: layout.name,
    sections: layout.sections.map((section) => ({
      id: section.id,
      name: section.name,
      label: section.label ?? section.name,
      tierKey: section.tier_key,
      seats: section.seats.map((seat) => ({
        id: seat.id,
        sectionId: seat.section_id,
        row: seat.row,
        number: seat.number,
        status: seat.status,
        accessible: seat.accessible,
      })),
    })),
  };
}

function mapEvent(event: ApiEvent): Event {
  return {
    id: event.id,
    slug: event.slug,
    title: event.title,
    categoryId: event.category_id ?? "",
    subcategory: event.subcategory ?? undefined,
    description: event.description ?? "",
    coverImage: event.cover_image ?? "",
    gallery: event.gallery ?? (event.cover_image ? [event.cover_image] : []),
    organizerId: event.organizer_id ?? "",
    status: event.status,
    ticketingMode: event.ticketing_mode,
    startAt: event.start_at,
    endAt: event.end_at ?? event.start_at,
    timezone: event.timezone,
    venueId: event.venue_id,
    tags: event.tags ?? [],
    highlights: event.highlights ?? [],
    schedule: (event.schedule ?? []).map((item) => ({
      time: item.time ?? "",
      title: item.title ?? "",
      description: item.description,
    })),
    terms: event.terms ?? [],
    ageNote: event.age_note,
    accessibilityNote: event.accessibility_note,
    createdAt: event.created_at ?? event.start_at,
    updatedAt: event.updated_at ?? event.start_at,
    isFeatured: event.is_featured ?? false,
    isTrending: event.is_trending ?? false,
    isRecommended: event.is_recommended ?? false,
    popularity: event.popularity ?? 0,
    limitedAvailability: event.limited_availability ?? false,
    isEarlyBird: event.is_early_bird ?? false,
    ticketTypes: event.ticket_types.map(mapTicketType),
    layoutId: event.layout_id,
    seatLayout: event.seat_layout ? mapLayout(event.seat_layout) : undefined,
  };
}

function mapCategory(category: ApiCategory): Category {
  return {
    id: category.id,
    slug: category.slug,
    name: category.name,
    description: category.description ?? "",
    image: category.image ?? "",
    icon: category.icon ?? "",
    subcategories: category.subcategories ?? [],
  };
}

function mapVenue(venue: ApiVenue): Venue {
  return {
    id: venue.id,
    name: venue.name,
    address: venue.address ?? "",
    city: venue.city,
    region: venue.region ?? "",
    country: venue.country ?? "",
    timezone: venue.timezone,
    mapUrl: venue.map_url,
  };
}

function mapOrganizer(organizer: ApiOrganizer): Organizer {
  return {
    id: organizer.id,
    userId: "",
    displayName: organizer.display_name,
    description: organizer.description ?? "",
    logo: organizer.logo,
    email: organizer.email ?? "",
    socialLinks: organizer.social_links ?? [],
  };
}

function toEventInput(input: CreateEventInput): ApiEventInput {
  return {
    title: input.title,
    category_id: input.categoryId,
    venue_id: input.venueId,
    start_at: input.startAt,
    end_at: input.endAt,
    timezone: input.timezone,
    ticketing_mode: input.ticketingMode,
    description: input.description,
    cover_image: input.coverImage,
    status: input.status,
    base_price: input.basePrice,
    subcategory: input.subcategory,
    gallery: input.coverImage ? [input.coverImage] : [],
    highlights: input.highlights,
    schedule: input.schedule,
    terms: input.terms,
    age_note: input.ageNote,
    accessibility_note: input.accessibilityNote,
  };
}

function toUpdateInput(event: Event): ApiEventInput {
  return {
    title: event.title,
    category_id: event.categoryId,
    venue_id: event.venueId,
    start_at: event.startAt,
    end_at: event.endAt,
    timezone: event.timezone,
    ticketing_mode: event.ticketingMode,
    description: event.description,
    cover_image: event.coverImage,
    status: event.status,
    base_price: event.ticketTypes[0]?.price ?? 0,
    subcategory: event.subcategory,
    gallery: event.gallery,
    highlights: event.highlights,
    schedule: event.schedule,
    terms: event.terms,
    age_note: event.ageNote,
    accessibility_note: event.accessibilityNote,
    ticket_types: event.ticketTypes.map((ticket) => ({
      id: ticket.id,
      name: ticket.name,
      description: ticket.description,
      price: ticket.price,
      quota: ticket.quota,
      min_per_order: ticket.minPerOrder,
      max_per_order: ticket.maxPerOrder,
      sales_start_at: ticket.salesStartAt,
      sales_end_at: ticket.salesEndAt,
      benefits: ticket.benefits,
      status: ticket.status,
      kind: ticket.kind,
      tier_key: ticket.tierKey,
    })),
  };
}

async function listEvents(): Promise<Event[]> {
  const result = await api.GET("/events");
  if (result.error || !result.data) {
    throw new Error("Could not load events.");
  }
  return result.data.items.map(mapEvent);
}

export const apiEventRepository: EventRepository = {
  list: listEvents,
  getBySlug: async (slug) => {
    const result = await api.GET("/events/{slug}", {
      params: { path: { slug } },
    });
    return result.data ? mapEvent(result.data) : undefined;
  },
  getById: async (id) => {
    const events = await listEvents();
    return events.find((event) => event.id === id);
  },
  catalog: async (): Promise<CatalogView> => {
    const [categories, venues, organizers] = await Promise.all([
      api.GET("/categories"),
      api.GET("/venues"),
      api.GET("/organizers"),
    ]);
    return {
      categories: (categories.data ?? []).map(mapCategory),
      venues: (venues.data ?? []).map(mapVenue),
      organizers: (organizers.data ?? []).map(mapOrganizer),
      promos: seedData.promos,
    };
  },
  createEvent: async (input) => {
    const result = await api.POST("/organizer/events", {
      body: toEventInput(input),
    });
    if (result.error || !result.data) {
      throw new Error("Could not create event.");
    }
    return mapEvent(result.data);
  },
  updateEvent: async (event) => {
    const result = await api.PATCH("/organizer/events/{eventId}", {
      params: { path: { eventId: event.id } },
      body: toUpdateInput(event),
    });
    if (result.error || !result.data) {
      throw new Error("Could not update event.");
    }
  },
  deleteEvent: async (eventId) => {
    const result = await api.DELETE("/organizer/events/{eventId}", {
      params: { path: { eventId } },
    });
    if (result.error) {
      throw new Error("Could not delete event.");
    }
  },
  markSeatsSold: async () => {
    // Inventory is authoritative in the API; sold seats are updated by checkout.
  },
};

async function listOrganizerEvents(): Promise<Event[]> {
  const result = await api.GET("/organizer/events");
  if (result.error || !result.data) {
    throw new Error("Could not load organizer events.");
  }
  return result.data.map(mapEvent);
}

export const apiOrganizerRepository: OrganizerRepository = {
  listEvents: listOrganizerEvents,
  getEvent: async (id) => {
    const result = await api.GET("/organizer/events/{eventId}", {
      params: { path: { eventId: id } },
    });
    return result.data ? mapEvent(result.data) : undefined;
  },
  createEvent: apiEventRepository.createEvent,
  updateEvent: apiEventRepository.updateEvent,
  deleteEvent: apiEventRepository.deleteEvent,
  markSeatsSold: apiEventRepository.markSeatsSold,
  listOrders: mockOrganizerRepository.listOrders,
  listAttendees: mockOrganizerRepository.listAttendees,
  listTickets: mockOrganizerRepository.listTickets,
};
