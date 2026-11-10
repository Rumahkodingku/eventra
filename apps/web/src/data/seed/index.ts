import {
  buildPromos,
  categories,
  organizers,
  users,
  venues,
} from "@/data/seed/catalog";
import { buildEvents } from "@/data/seed/events";
import { buildNotifications, buildReviews } from "@/data/seed/extras";
import { buildOrders } from "@/data/seed/orders";
import type {
  Attendee,
  Category,
  Event,
  Notification,
  Order,
  Organizer,
  PromoCode,
  Review,
  Ticket,
  User,
  Venue,
} from "@/domain/types";

export interface SeedData {
  seedNow: string;
  categories: Category[];
  venues: Venue[];
  organizers: Organizer[];
  users: User[];
  promos: PromoCode[];
  events: Event[];
  orders: Order[];
  tickets: Ticket[];
  attendees: Attendee[];
  reviews: Review[];
  notifications: Notification[];
}

export function createSeedData(now = new Date()): SeedData {
  const eventList = buildEvents(now, venues);
  const { orders, tickets, attendees } = buildOrders(
    eventList,
    users,
    venues,
    now,
  );
  return {
    seedNow: now.toISOString(),
    categories,
    venues,
    organizers,
    users,
    promos: buildPromos(now),
    events: eventList,
    orders,
    tickets,
    attendees,
    reviews: buildReviews(eventList, now),
    notifications: buildNotifications(orders, now),
  };
}

export const seedData = createSeedData();
