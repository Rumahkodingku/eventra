import type {
  CartItem,
  CartPricing,
  Event,
  Order,
  PromoCode,
  TicketType,
} from "@/domain/types";

export const SERVICE_FEE_RATE = 0.05;
export const MAX_SERVICE_FEE = 25_000;

export type PromoError = "invalid" | "expired" | "min" | "ineligible" | "limit";

export function round100(value: number): number {
  return Math.round(value / 100) * 100;
}

export function calculateServiceFee(subtotal: number): number {
  if (subtotal <= 0) return 0;
  return Math.min(round100(subtotal * SERVICE_FEE_RATE), MAX_SERVICE_FEE);
}

export function calculateDiscount(promo: PromoCode, subtotal: number): number {
  if (promo.type === "PERCENTAGE") {
    const raw = round100((subtotal * promo.value) / 100);
    return Math.min(raw, promo.maxDiscount ?? raw, subtotal);
  }
  return Math.min(promo.value, subtotal);
}

export function validatePromo({
  code,
  promos,
  subtotal,
  eventIds,
  events,
  orders,
  now = new Date(),
}: {
  code: string;
  promos: PromoCode[];
  subtotal: number;
  eventIds: string[];
  events: Event[];
  orders: Order[];
  now?: Date;
}): { promo?: PromoCode; error?: PromoError } {
  const normalized = code.trim().toUpperCase();
  const promo = promos.find((item) => item.code === normalized);
  if (!promo || !promo.isActive) return { error: "invalid" };
  const nowTime = now.getTime();
  if (nowTime < new Date(promo.startsAt).getTime()) return { error: "invalid" };
  if (nowTime > new Date(promo.endsAt).getTime()) return { error: "expired" };
  if (promo.minimumSpend && subtotal < promo.minimumSpend) {
    return { error: "min" };
  }
  if (
    promo.eligibleEventIds?.length &&
    !eventIds.some((id) => promo.eligibleEventIds?.includes(id))
  ) {
    return { error: "ineligible" };
  }
  if (promo.eligibleCategoryIds?.length) {
    const categories = new Set(
      events
        .filter((event) => eventIds.includes(event.id))
        .map((event) => event.categoryId),
    );
    if (
      ![...categories].some((id) => promo.eligibleCategoryIds?.includes(id))
    ) {
      return { error: "ineligible" };
    }
  }
  if (promo.usageLimit) {
    const used = orders.filter(
      (order) =>
        order.promoCode === promo.code && order.orderStatus === "CONFIRMED",
    ).length;
    if (used >= promo.usageLimit) return { error: "limit" };
  }
  return { promo };
}

export function calculateCartTotals({
  items,
  events,
  promos,
  orders,
  promoCode,
}: {
  items: CartItem[];
  events: Event[];
  promos: PromoCode[];
  orders: Order[];
  promoCode?: string;
}): CartPricing {
  const subtotal = items.reduce((total, item) => {
    return total + item.unitPriceSnapshot * item.quantity;
  }, 0);
  const serviceFee = calculateServiceFee(subtotal);
  let discount = 0;
  let promo: PromoCode | undefined;
  let error: PromoError | undefined;

  if (promoCode) {
    const result = validatePromo({
      code: promoCode,
      promos,
      subtotal,
      eventIds: items.map((item) => item.eventId),
      events,
      orders,
    });
    promo = result.promo;
    error = result.error;
    if (promo) discount = calculateDiscount(promo, subtotal);
  }

  return {
    subtotal,
    serviceFee,
    discount,
    total: Math.max(0, subtotal + serviceFee - discount),
    promo,
    error,
  };
}

export function getStartingPrice(event: Event): number {
  const prices = event.ticketTypes
    .filter((ticket) => ticket.status !== "INACTIVE")
    .map((ticket) => ticket.price);
  return prices.length ? Math.min(...prices) : 0;
}

export function getTicketType(
  event: Event | undefined,
  ticketTypeId: string,
): TicketType | undefined {
  return event?.ticketTypes.find((ticket) => ticket.id === ticketTypeId);
}

export type AvailabilityReason =
  | "available"
  | "sold_out"
  | "inactive"
  | "not_started"
  | "closed";

export function getTicketAvailability(
  ticketType: TicketType,
  now = new Date(),
): { available: boolean; remaining: number; reason: AvailabilityReason } {
  const remaining = Math.max(0, ticketType.quota - ticketType.soldCount);
  if (ticketType.status === "INACTIVE") {
    return { available: false, remaining, reason: "inactive" };
  }
  if (ticketType.status === "SOLD_OUT" || remaining <= 0) {
    return { available: false, remaining: 0, reason: "sold_out" };
  }
  const time = now.getTime();
  if (time < new Date(ticketType.salesStartAt).getTime()) {
    return { available: false, remaining, reason: "not_started" };
  }
  if (time > new Date(ticketType.salesEndAt).getTime()) {
    return { available: false, remaining, reason: "closed" };
  }
  return { available: true, remaining, reason: "available" };
}

export function isEventPurchasable(
  event: Event,
  now = new Date(),
): {
  purchasable: boolean;
  reason?: "paused" | "cancelled" | "ended" | "draft" | "sold_out";
} {
  if (event.status === "DRAFT") return { purchasable: false, reason: "draft" };
  if (event.status === "PAUSED")
    return { purchasable: false, reason: "paused" };
  if (event.status === "CANCELLED")
    return { purchasable: false, reason: "cancelled" };
  if (event.status === "ENDED") return { purchasable: false, reason: "ended" };
  const available = event.ticketTypes.some(
    (ticket) => getTicketAvailability(ticket, now).available,
  );
  return available
    ? { purchasable: true }
    : { purchasable: false, reason: "sold_out" };
}

export function getEventSalesEnd(event: Event): string | undefined {
  const ends = event.ticketTypes.map((ticket) => ticket.salesEndAt);
  if (!ends.length) return undefined;
  return ends.sort()[ends.length - 1];
}

export function getEventSoldPercent(event: Event): number {
  const quota = event.ticketTypes.reduce(
    (total, ticket) => total + ticket.quota,
    0,
  );
  const sold = event.ticketTypes.reduce(
    (total, ticket) => total + ticket.soldCount,
    0,
  );
  return quota ? Math.round((sold / quota) * 100) : 0;
}
