import type {
  Attendee,
  BuyerDetails,
  CartItem,
  Category,
  Event,
  Notification,
  Order,
  Organizer,
  PromoCode,
  Review,
  Ticket,
  TicketType,
  User,
  Venue,
} from "@/domain/types";

export interface Paginated<T> {
  items: T[];
  nextCursor?: string;
}

export interface ApiError {
  code: string;
  message: string;
  requestId?: string;
  fieldErrors?: Record<string, string>;
}

export interface CatalogView {
  categories: Category[];
  venues: Venue[];
  organizers: Organizer[];
  promos: PromoCode[];
}

export interface EventRepository {
  list(): Promise<Event[]>;
  getBySlug(slug: string): Promise<Event | undefined>;
  getById(id: string): Promise<Event | undefined>;
  catalog(): Promise<CatalogView>;
  createEvent(input: CreateEventInput): Promise<Event>;
  updateEvent(event: Event): Promise<void>;
  deleteEvent(eventId: string): Promise<void>;
  markSeatsSold(eventId: string, seatIds: string[]): Promise<void>;
}

export interface TicketRepository {
  listTypes(eventId: string): Promise<TicketType[]>;
  getAvailability(eventId: string): Promise<{
    eventId: string;
    ticketTypes: TicketType[];
    remaining: Record<string, number>;
  }>;
}

export interface CartView {
  items: CartItem[];
  promoCode?: string;
}

export interface AddCartItemInput {
  ownerKey: string;
  eventId: string;
  ticketTypeId: string;
  quantity: number;
  seatIds: string[];
  unitPriceSnapshot: number;
}

export interface CartRepository {
  get(): Promise<CartView>;
  addItem(input: AddCartItemInput): Promise<void>;
  updateQuantity(itemId: string, quantity: number): Promise<void>;
  removeItem(itemId: string): Promise<void>;
  setPromoCode(code?: string): Promise<void>;
  clear(): Promise<void>;
}

export interface CreateOrderInput {
  buyer: BuyerDetails;
  paymentMethod: string;
  promoCode?: string;
  items: CartItem[];
  attendees: Record<
    string,
    { fullName: string; email: string; phone?: string }[]
  >;
  simulateFailure: boolean;
  user?: User | null;
}

export interface OrderBundle {
  orders: Order[];
  tickets: Ticket[];
  attendees: Attendee[];
}

export interface CheckoutRepository {
  createOrder(input: CreateOrderInput): Promise<{
    order: Order;
    tickets: Ticket[];
  }>;
}

export interface OrderRepository {
  bundle(): Promise<OrderBundle>;
  list(): Promise<Order[]>;
  get(id: string): Promise<Order | undefined>;
  listTickets(orderId?: string): Promise<Ticket[]>;
  checkInTicket(ticketId: string): Promise<{
    ok: boolean;
    reason?: "not_found" | "already_used" | "invalid";
  }>;
}

export interface TicketWalletRepository {
  list(): Promise<Ticket[]>;
  get(id: string): Promise<Ticket | undefined>;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface RegisterInput {
  name: string;
  email: string;
  phone?: string;
}

export interface UserRepository {
  me(): Promise<User | null>;
  login(input: LoginInput): Promise<{
    ok: boolean;
    error?: string;
    user?: User | null;
  }>;
  loginDemo(role: User["role"]): Promise<User>;
  register(input: RegisterInput): Promise<{
    ok: boolean;
    error?: string;
    user?: User;
  }>;
  logout(): Promise<void>;
  updateProfile(
    input: Partial<Pick<User, "name" | "email" | "phone">>,
  ): Promise<void>;
}

export interface CreateEventInput {
  title: string;
  categoryId: string;
  venueId: string;
  startAt: string;
  endAt: string;
  timezone: string;
  ticketingMode: Event["ticketingMode"];
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

export interface OrganizerRepository {
  listEvents(): Promise<Event[]>;
  getEvent(id: string): Promise<Event | undefined>;
  createEvent(input: CreateEventInput): Promise<Event>;
  updateEvent(event: Event): Promise<void>;
  deleteEvent(eventId: string): Promise<void>;
  markSeatsSold(eventId: string, seatIds: string[]): Promise<void>;
  listOrders(): Promise<Order[]>;
  listAttendees(): Promise<Attendee[]>;
  listTickets(): Promise<Ticket[]>;
}

export interface NotificationRepository {
  list(): Promise<Notification[]>;
  add(input: {
    userId?: string;
    type: Notification["type"];
    title: string;
    message: string;
    targetUrl?: string;
  }): Promise<void>;
  markRead(id: string): Promise<void>;
  markAllRead(userId?: string): Promise<void>;
}

export interface ReviewRepository {
  list(eventId?: string): Promise<Review[]>;
  add(input: {
    eventId: string;
    userId?: string;
    authorName: string;
    rating: number;
    comment: string;
  }): Promise<void>;
}

export interface WishlistRepository {
  list(): Promise<string[]>;
  toggle(eventId: string): Promise<void>;
  clear(): Promise<void>;
}

export interface OrganizerSettingsRepository {
  get(): Promise<import("@/stores/organizer-settings").OrganizerSettings>;
  update(
    settings: import("@/stores/organizer-settings").OrganizerSettings,
  ): Promise<void>;
  reset(): Promise<void>;
}
