import type { components } from "@eventra/api-client";
import type { Notification, Review } from "@/domain/types";
import { api } from "@/services/api/client";
import type {
  NotificationRepository,
  ReviewRepository,
  WishlistRepository,
} from "@/services/repositories/types";

type ApiNotification = components["schemas"]["Notification"];
type ApiReview = components["schemas"]["Review"];

function mapNotification(item: ApiNotification): Notification {
  return {
    id: item.id,
    userId: item.user_id,
    type: item.type,
    title: item.title,
    message: item.message,
    readAt: item.read_at,
    createdAt: item.created_at,
    targetUrl: item.target_url,
  };
}

function mapReview(item: ApiReview): Review {
  return {
    id: item.id,
    eventId: item.event_id,
    userId: item.user_id,
    authorName: item.author_name,
    rating: item.rating,
    comment: item.comment,
    createdAt: item.created_at,
  };
}

export const apiNotificationRepository: NotificationRepository = {
  list: async () => {
    const result = await api.GET("/account/notifications");
    return (result.data ?? []).map(mapNotification);
  },
  add: async () => {
    // Notifications are created server-side by order and ticket events.
  },
  markRead: async (id) => {
    await api.POST("/account/notifications/{notificationId}/read", {
      params: { path: { notificationId: id } },
    });
  },
  markAllRead: async () => {
    await api.POST("/account/notifications/read-all");
  },
};

function apiErrorCode(error: unknown): string | undefined {
  if (!error || typeof error !== "object") return undefined;
  return (error as { error?: { code?: string } }).error?.code;
}

export const apiReviewRepository: ReviewRepository = {
  list: async (eventId) => {
    if (!eventId) return [];
    const result = await api.GET("/events/{eventId}/reviews", {
      params: { path: { eventId }, query: { sort: "newest" } },
    });
    return (result.data ?? []).map(mapReview);
  },
  add: async (input) => {
    const result = await api.POST("/events/{eventId}/reviews", {
      params: { path: { eventId: input.eventId } },
      body: { rating: input.rating, comment: input.comment },
    });
    const error: unknown = result.error;
    if (error) {
      throw new Error(apiErrorCode(error) ?? "REVIEW_FAILED");
    }
  },
};

export const apiWishlistRepository: WishlistRepository = {
  list: async () => {
    const result = await api.GET("/account/wishlist");
    return result.data ?? [];
  },
  toggle: async (eventId) => {
    const current = await api.GET("/account/wishlist");
    if ((current.data ?? []).includes(eventId)) {
      await api.DELETE("/account/wishlist/{eventId}", {
        params: { path: { eventId } },
      });
      return;
    }
    await api.POST("/account/wishlist", { body: { event_id: eventId } });
  },
  clear: async () => {
    await api.DELETE("/account/wishlist");
  },
};
