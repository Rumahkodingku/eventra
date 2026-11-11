import { seedData } from "@/data/seed";
import { categories, organizers, venues } from "@/data/seed/catalog";
import { getTicketAvailability } from "@/lib/pricing";
import type {
  CartRepository,
  CheckoutRepository,
  EventRepository,
  NotificationRepository,
  OrderRepository,
  OrganizerRepository,
  OrganizerSettingsRepository,
  ReviewRepository,
  TicketRepository,
  TicketWalletRepository,
  UserRepository,
  WishlistRepository,
} from "@/services/repositories/types";
import { useCartStore } from "@/stores/cart";
import { useEventStore } from "@/stores/events";
import { useNotificationStore } from "@/stores/notifications";
import { useOrderStore } from "@/stores/orders";
import { useOrganizerSettingsStore } from "@/stores/organizer-settings";
import { useReviewStore } from "@/stores/reviews";
import { useSessionStore } from "@/stores/session";
import { useWishlistStore } from "@/stores/wishlist";

export const eventRepository: EventRepository = {
  list: async () => useEventStore.getState().events,
  getBySlug: async (slug) =>
    useEventStore.getState().events.find((event) => event.slug === slug),
  getById: async (id) =>
    useEventStore.getState().events.find((event) => event.id === id),
  catalog: async () => ({
    categories,
    venues,
    organizers,
    promos: seedData.promos,
  }),
  createEvent: async (input) => useEventStore.getState().createEvent(input),
  updateEvent: async (event) => useEventStore.getState().updateEvent(event),
  deleteEvent: async (eventId) => useEventStore.getState().deleteEvent(eventId),
  markSeatsSold: async (eventId, seatIds) =>
    useEventStore.getState().markSeatsSold(eventId, seatIds),
};

export const ticketRepository: TicketRepository = {
  listTypes: async (eventId) => {
    const event = useEventStore
      .getState()
      .events.find((item) => item.id === eventId);
    return event?.ticketTypes ?? [];
  },
  getAvailability: async (eventId) => {
    const event = useEventStore
      .getState()
      .events.find((item) => item.id === eventId);
    const ticketTypes = event?.ticketTypes ?? [];
    return {
      eventId,
      ticketTypes,
      remaining: Object.fromEntries(
        ticketTypes.map((ticket) => [
          ticket.id,
          getTicketAvailability(ticket).remaining,
        ]),
      ),
    };
  },
};

export const cartRepository: CartRepository = {
  get: async () => {
    const state = useCartStore.getState();
    return { items: state.items, promoCode: state.promoCode };
  },
  addItem: async (input) => useCartStore.getState().addItem(input),
  updateQuantity: async (itemId, quantity) =>
    useCartStore.getState().updateQuantity(itemId, quantity),
  removeItem: async (itemId) => useCartStore.getState().removeItem(itemId),
  setPromoCode: async (code) => useCartStore.getState().setPromoCode(code),
  clear: async () => useCartStore.getState().clear(),
};

export const checkoutRepository: CheckoutRepository = {
  createOrder: async (input) => useOrderStore.getState().createOrder(input),
};

export const orderRepository: OrderRepository = {
  bundle: async () => {
    const state = useOrderStore.getState();
    return {
      orders: state.orders,
      tickets: state.tickets,
      attendees: state.attendees,
    };
  },
  list: async () => useOrderStore.getState().orders,
  get: async (id) =>
    useOrderStore.getState().orders.find((order) => order.id === id),
  listTickets: async (orderId) => {
    const tickets = useOrderStore.getState().tickets;
    return orderId
      ? tickets.filter((ticket) => ticket.orderId === orderId)
      : tickets;
  },
  checkInTicket: async (ticketId) =>
    useOrderStore.getState().checkInTicket(ticketId),
};

export const ticketWalletRepository: TicketWalletRepository = {
  list: async () => useOrderStore.getState().tickets,
  get: async (id) =>
    useOrderStore.getState().tickets.find((ticket) => ticket.id === id),
};

export const userRepository: UserRepository = {
  me: async () => useSessionStore.getState().user,
  login: async ({ email, password }) => {
    const result = useSessionStore.getState().login(email, password);
    return { ...result, user: useSessionStore.getState().user };
  },
  loginDemo: async (role) => useSessionStore.getState().loginDemo(role),
  register: async (input) => useSessionStore.getState().register(input),
  logout: async () => useSessionStore.getState().logout(),
  updateProfile: async (input) =>
    useSessionStore.getState().updateProfile(input),
};

export const organizerRepository: OrganizerRepository = {
  listEvents: async () => useEventStore.getState().events,
  getEvent: async (id) =>
    useEventStore.getState().events.find((event) => event.id === id),
  createEvent: async (input) => useEventStore.getState().createEvent(input),
  updateEvent: async (event) => useEventStore.getState().updateEvent(event),
  deleteEvent: async (eventId) => useEventStore.getState().deleteEvent(eventId),
  markSeatsSold: async (eventId, seatIds) =>
    useEventStore.getState().markSeatsSold(eventId, seatIds),
  listOrders: async () => useOrderStore.getState().orders,
  listAttendees: async () => useOrderStore.getState().attendees,
  listTickets: async () => useOrderStore.getState().tickets,
};

export const notificationRepository: NotificationRepository = {
  list: async () => useNotificationStore.getState().notifications,
  add: async (input) => useNotificationStore.getState().addNotification(input),
  markRead: async (id) => useNotificationStore.getState().markRead(id),
  markAllRead: async (userId) =>
    useNotificationStore.getState().markAllRead(userId),
};

export const reviewRepository: ReviewRepository = {
  list: async (eventId) => {
    const reviews = useReviewStore.getState().reviews;
    return eventId
      ? reviews.filter((review) => review.eventId === eventId)
      : reviews;
  },
  add: async (input) => useReviewStore.getState().addReview(input),
};

export const wishlistRepository: WishlistRepository = {
  list: async () => useWishlistStore.getState().eventIds,
  toggle: async (eventId) => useWishlistStore.getState().toggle(eventId),
  clear: async () => useWishlistStore.getState().clear(),
};

export const organizerSettingsRepository: OrganizerSettingsRepository = {
  get: async () => useOrganizerSettingsStore.getState().settings,
  update: async (settings) =>
    useOrganizerSettingsStore.getState().updateSettings(settings),
  reset: async () => useOrganizerSettingsStore.getState().reset(),
};
