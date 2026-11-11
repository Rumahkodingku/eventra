import type { components } from "@eventra/api-client";
import type { CartItem, CartPricing } from "@/domain/types";
import { api } from "@/services/api/client";
import type { CartRepository } from "@/services/repositories/types";

type ApiCart = components["schemas"]["Cart"];
type ApiCartItem = components["schemas"]["CartItem"];

function mapCartItem(item: ApiCartItem): CartItem {
  return {
    id: item.id,
    ownerKey: item.owner_key,
    eventId: item.event_id,
    ticketTypeId: item.ticket_type_id,
    quantity: item.quantity,
    seatIds: item.seat_ids,
    unitPriceSnapshot: item.unit_price_snapshot,
    addedAt: item.added_at ?? new Date().toISOString(),
  };
}

function mapCart(cart: ApiCart) {
  return {
    items: cart.items.map(mapCartItem),
    promoCode: cart.promo_code,
  };
}

export async function quoteCart(
  eventId: string,
  items: CartItem[],
  promoCode?: string,
): Promise<CartPricing & { expiresAt?: string }> {
  const result = await api.POST("/checkout/quote", {
    body: {
      event_id: eventId,
      promo_code: promoCode,
      items: items.map((item) => ({
        ticket_type_id: item.ticketTypeId,
        quantity: item.quantity,
        seat_ids: item.seatIds,
      })),
    },
  });
  if (result.error || !result.data) {
    throw new Error("QUOTE_FAILED");
  }
  return {
    subtotal: result.data.subtotal,
    serviceFee: result.data.service_fee,
    discount: result.data.discount,
    total: result.data.total,
    expiresAt: result.data.expires_at,
  };
}

export const apiCartRepository: CartRepository = {
  get: async () => {
    const result = await api.GET("/cart");
    if (result.error || !result.data) {
      throw new Error("Could not load cart.");
    }
    return mapCart(result.data);
  },
  addItem: async (input) => {
    const result = await api.POST("/cart/items", {
      body: {
        event_id: input.eventId,
        ticket_type_id: input.ticketTypeId,
        quantity: input.quantity,
        seat_ids: input.seatIds,
      },
    });
    if (result.error) {
      throw new Error("Could not add item to cart.");
    }
  },
  updateQuantity: async (itemId, quantity) => {
    const result = await api.PATCH("/cart/items/{itemId}", {
      params: { path: { itemId } },
      body: { quantity },
    });
    if (result.error) {
      throw new Error("Could not update cart item.");
    }
  },
  removeItem: async (itemId) => {
    const result = await api.DELETE("/cart/items/{itemId}", {
      params: { path: { itemId } },
    });
    if (result.error) {
      throw new Error("Could not remove cart item.");
    }
  },
  setPromoCode: async (code) => {
    const result = code
      ? await api.POST("/cart/promo", { body: { code } })
      : await api.DELETE("/cart/promo");
    if (result.error) {
      throw new Error("PROMO_INVALID");
    }
  },
  clear: async () => {
    const result = await api.DELETE("/cart");
    if (result.error) {
      throw new Error("Could not clear cart.");
    }
  },
};
