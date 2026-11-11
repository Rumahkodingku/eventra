export type Locale = "id" | "en";

export type EventStatus =
  | "DRAFT"
  | "PUBLISHED"
  | "PAUSED"
  | "ENDED"
  | "CANCELLED";

export type TicketingMode = "GENERAL_ADMISSION" | "RESERVED_SEATING" | "HYBRID";

export type TicketKind = "GENERAL_ADMISSION" | "SEATED";

export type TicketTypeStatus = "ACTIVE" | "INACTIVE" | "SOLD_OUT";

export type SeatStatus = "AVAILABLE" | "SOLD" | "BLOCKED";

export type OrderStatus =
  | "PENDING_PAYMENT"
  | "CONFIRMED"
  | "PAYMENT_FAILED"
  | "CANCELLED";

export type PaymentStatus =
  | "UNPAID"
  | "PROCESSING"
  | "PAID"
  | "FAILED"
  | "CANCELLED";

export type TicketStatus = "VALID" | "USED" | "CANCELLED" | "EXPIRED";

export type UserRole = "CUSTOMER" | "ORGANIZER";

export type CheckInStatus = "NOT_CHECKED_IN" | "CHECKED_IN";

export interface Category {
  id: string;
  slug: string;
  name: string;
  description: string;
  image: string;
  icon: string;
  subcategories: string[];
}

export interface Venue {
  id: string;
  name: string;
  address: string;
  city: string;
  region: string;
  country: string;
  timezone: string;
  mapUrl?: string;
  layoutId?: string;
}

export interface Organizer {
  id: string;
  userId: string;
  displayName: string;
  description: string;
  logo?: string;
  email: string;
  socialLinks: { label: string; href: string }[];
}

export interface ScheduleItem {
  time: string;
  title: string;
  description?: string;
}

export interface TicketType {
  id: string;
  eventId: string;
  name: string;
  description: string;
  price: number;
  currency: "IDR";
  quota: number;
  soldCount: number;
  minPerOrder: number;
  maxPerOrder: number;
  salesStartAt: string;
  salesEndAt: string;
  benefits: string[];
  status: TicketTypeStatus;
  kind: TicketKind;
  tierKey?: string;
}

export interface Seat {
  id: string;
  sectionId: string;
  row: string;
  number: number;
  status: SeatStatus;
  accessible?: boolean;
}

export interface Section {
  id: string;
  name: string;
  label: string;
  tierKey: string;
  seats: Seat[];
}

export interface VenueLayout {
  id: string;
  name: string;
  sections: Section[];
}

export interface Event {
  id: string;
  slug: string;
  title: string;
  categoryId: string;
  subcategory?: string;
  description: string;
  coverImage: string;
  gallery: string[];
  organizerId: string;
  status: EventStatus;
  ticketingMode: TicketingMode;
  startAt: string;
  endAt: string;
  timezone: string;
  venueId: string;
  tags: string[];
  highlights: string[];
  schedule: ScheduleItem[];
  terms: string[];
  ageNote?: string;
  accessibilityNote?: string;
  createdAt: string;
  updatedAt: string;
  isFeatured: boolean;
  isTrending: boolean;
  isRecommended: boolean;
  popularity: number;
  limitedAvailability: boolean;
  isEarlyBird: boolean;
  ticketTypes: TicketType[];
  layoutId?: string;
  seatLayout?: VenueLayout;
}

export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  avatar?: string;
  role: UserRole;
  locale: Locale;
  createdAt: string;
}

export interface BuyerDetails {
  name: string;
  email: string;
  phone: string;
}

export interface CartItem {
  id: string;
  ownerKey: string;
  eventId: string;
  ticketTypeId: string;
  quantity: number;
  seatIds: string[];
  unitPriceSnapshot: number;
  addedAt: string;
}

export interface OrderItem {
  id: string;
  orderId: string;
  eventId: string;
  ticketTypeId: string;
  ticketNameSnapshot: string;
  eventTitleSnapshot: string;
  eventStartAtSnapshot: string;
  venueNameSnapshot: string;
  quantity: number;
  seatIds: string[];
  unitPriceSnapshot: number;
  lineSubtotal: number;
  attendeeIds: string[];
}

export interface Order {
  id: string;
  orderNumber: string;
  userId?: string;
  ownerKey: string;
  buyer: BuyerDetails;
  items: OrderItem[];
  subtotal: number;
  serviceFee: number;
  discount: number;
  total: number;
  currency: "IDR";
  promoCode?: string;
  paymentMethod: string;
  paymentStatus: PaymentStatus;
  orderStatus: OrderStatus;
  createdAt: string;
  paidAt?: string;
}

export interface Attendee {
  id: string;
  orderId: string;
  ticketId: string;
  fullName: string;
  email: string;
  phone?: string;
  checkInStatus: CheckInStatus;
  checkedInAt?: string;
}

export interface Ticket {
  id: string;
  ticketCode: string;
  orderId: string;
  eventId: string;
  ticketTypeId: string;
  attendeeId: string;
  seatId?: string;
  status: TicketStatus;
  issuedAt: string;
  checkedInAt?: string;
}

export interface Notification {
  id: string;
  userId?: string;
  type: "ORDER" | "TICKET" | "EVENT" | "SYSTEM";
  title: string;
  message: string;
  readAt?: string;
  createdAt: string;
  targetUrl?: string;
}

export interface Review {
  id: string;
  eventId: string;
  userId?: string;
  authorName: string;
  rating: number;
  comment: string;
  createdAt: string;
}

export interface PromoCode {
  id: string;
  code: string;
  type: "FIXED" | "PERCENTAGE";
  value: number;
  startsAt: string;
  endsAt: string;
  minimumSpend?: number;
  maxDiscount?: number;
  eligibleEventIds?: string[];
  eligibleCategoryIds?: string[];
  usageLimit?: number;
  usedCount: number;
  isActive: boolean;
}

export interface Preferences {
  locale: Locale;
  city: string;
  notificationPrefs: {
    orderUpdates: boolean;
    eventReminders: boolean;
    newsletter: boolean;
  };
}

export interface CartPricing {
  subtotal: number;
  serviceFee: number;
  discount: number;
  total: number;
  promo?: PromoCode;
  expiresAt?: string;
  error?: string;
}

export interface DemoSession {
  userId: string;
  role: UserRole;
  startedAt: string;
}

export interface SeatSelection {
  sectionId: string;
  seatIds: string[];
}
