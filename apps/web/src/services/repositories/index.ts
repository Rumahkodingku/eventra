import { apiUserRepository } from "@/services/api/auth";
import { apiCartRepository } from "@/services/api/cart";
import {
  apiNotificationRepository,
  apiReviewRepository,
  apiWishlistRepository,
} from "@/services/api/engagement";
import {
  apiEventRepository,
  apiOrganizerRepository,
  apiTicketRepository,
} from "@/services/api/events";
import {
  apiCheckoutRepository,
  apiOrderRepository,
  apiTicketWalletRepository,
} from "@/services/api/orders";
import { apiOrganizerSettingsRepository } from "@/services/api/settings";
import {
  cartRepository as mockCartRepository,
  checkoutRepository as mockCheckoutRepository,
  eventRepository as mockEventRepository,
  notificationRepository as mockNotificationRepository,
  orderRepository as mockOrderRepository,
  organizerRepository as mockOrganizerRepository,
  organizerSettingsRepository as mockOrganizerSettingsRepository,
  reviewRepository as mockReviewRepository,
  ticketRepository as mockTicketRepository,
  ticketWalletRepository as mockTicketWalletRepository,
  userRepository as mockUserRepository,
  wishlistRepository as mockWishlistRepository,
} from "@/services/mock";

export const apiMode = process.env.NEXT_PUBLIC_API_MODE !== "mock";

export const eventRepository = apiMode
  ? apiEventRepository
  : mockEventRepository;
export const organizerRepository = apiMode
  ? apiOrganizerRepository
  : mockOrganizerRepository;
export const ticketRepository = apiMode
  ? apiTicketRepository
  : mockTicketRepository;
export const userRepository = apiMode ? apiUserRepository : mockUserRepository;
export const cartRepository = apiMode ? apiCartRepository : mockCartRepository;
export const checkoutRepository = apiMode
  ? apiCheckoutRepository
  : mockCheckoutRepository;
export const orderRepository = apiMode
  ? apiOrderRepository
  : mockOrderRepository;
export const ticketWalletRepository = apiMode
  ? apiTicketWalletRepository
  : mockTicketWalletRepository;
export const notificationRepository = apiMode
  ? apiNotificationRepository
  : mockNotificationRepository;
export const reviewRepository = apiMode
  ? apiReviewRepository
  : mockReviewRepository;
export const wishlistRepository = apiMode
  ? apiWishlistRepository
  : mockWishlistRepository;
export const organizerSettingsRepository = apiMode
  ? apiOrganizerSettingsRepository
  : mockOrganizerSettingsRepository;
