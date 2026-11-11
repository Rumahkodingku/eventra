import { describe, expect, it } from "vitest";
import type {
  CartItem,
  Event,
  Order,
  PromoCode,
  TicketType,
} from "@/domain/types";
import {
  calculateCartTotals,
  calculateDiscount,
  calculateServiceFee,
  getStartingPrice,
  getTicketAvailability,
  isEventPurchasable,
  validatePromo,
} from "@/lib/pricing";

const now = new Date("2026-11-10T00:00:00.000Z");

const ticket: TicketType = {
  id: "tt-1",
  eventId: "evt-1",
  name: "Regular",
  description: "Regular ticket",
  price: 100_000,
  currency: "IDR",
  quota: 100,
  soldCount: 10,
  minPerOrder: 1,
  maxPerOrder: 6,
  salesStartAt: "2026-10-01T00:00:00.000Z",
  salesEndAt: "2026-12-01T00:00:00.000Z",
  benefits: ["Entry"],
  status: "ACTIVE",
  kind: "GENERAL_ADMISSION",
};

const event: Event = {
  id: "evt-1",
  slug: "test-event",
  title: "Test Event",
  categoryId: "cat-concert",
  description: "A test event",
  coverImage: "/test.webp",
  gallery: ["/test.webp"],
  organizerId: "org-1",
  status: "PUBLISHED",
  ticketingMode: "GENERAL_ADMISSION",
  startAt: "2026-11-20T12:00:00.000Z",
  endAt: "2026-11-20T15:00:00.000Z",
  timezone: "Asia/Jakarta",
  venueId: "venue-1",
  tags: ["Test"],
  highlights: ["One"],
  schedule: [{ time: "19:00", title: "Doors" }],
  terms: ["Term"],
  createdAt: "2026-10-01T00:00:00.000Z",
  updatedAt: "2026-10-01T00:00:00.000Z",
  isFeatured: false,
  isTrending: false,
  isRecommended: false,
  popularity: 50,
  limitedAvailability: false,
  isEarlyBird: false,
  ticketTypes: [ticket],
};

const promo: PromoCode = {
  id: "promo-1",
  code: "TEST10",
  type: "PERCENTAGE",
  value: 10,
  startsAt: "2026-10-01T00:00:00.000Z",
  endsAt: "2026-12-01T00:00:00.000Z",
  minimumSpend: 100_000,
  maxDiscount: 100_000,
  usageLimit: 100,
  usedCount: 0,
  isActive: true,
};

const cartItem: CartItem = {
  id: "cart-1",
  ownerKey: "local",
  eventId: "evt-1",
  ticketTypeId: "tt-1",
  quantity: 2,
  seatIds: [],
  unitPriceSnapshot: 100_000,
  addedAt: "2026-11-10T00:00:00.000Z",
};

describe("pricing", () => {
  it("calculates a 5% service fee rounded to 100 IDR", () => {
    expect(calculateServiceFee(100_000)).toBe(5_000);
    expect(calculateServiceFee(1_010)).toBe(100);
    expect(calculateServiceFee(0)).toBe(0);
  });

  it("caps the service fee at 25,000 IDR", () => {
    expect(calculateServiceFee(1_000_000)).toBe(25_000);
    expect(calculateServiceFee(10_000_000)).toBe(25_000);
  });

  it("calculates percentage discount with a maximum", () => {
    expect(calculateDiscount(promo, 200_000)).toBe(20_000);
    expect(calculateDiscount({ ...promo, maxDiscount: 10_000 }, 200_000)).toBe(
      10_000,
    );
  });

  it("calculates fixed discount without exceeding subtotal", () => {
    expect(
      calculateDiscount({ ...promo, type: "FIXED", value: 500_000 }, 200_000),
    ).toBe(200_000);
  });

  it("validates an active promo", () => {
    const result = validatePromo({
      code: "test10",
      promos: [promo],
      subtotal: 200_000,
      eventIds: ["evt-1"],
      events: [event],
      orders: [],
      now,
    });
    expect(result.promo?.code).toBe("TEST10");
    expect(result.error).toBeUndefined();
  });

  it("rejects an expired promo", () => {
    const result = validatePromo({
      code: "TEST10",
      promos: [{ ...promo, endsAt: "2026-10-02T00:00:00.000Z" }],
      subtotal: 200_000,
      eventIds: ["evt-1"],
      events: [event],
      orders: [],
      now,
    });
    expect(result.error).toBe("expired");
  });

  it("rejects a promo below minimum spend", () => {
    const result = validatePromo({
      code: "TEST10",
      promos: [promo],
      subtotal: 50_000,
      eventIds: ["evt-1"],
      events: [event],
      orders: [],
      now,
    });
    expect(result.error).toBe("min");
  });

  it("rejects a promo whose usage limit is reached", () => {
    const order = {
      promoCode: "TEST10",
      orderStatus: "CONFIRMED",
    } as Order;
    const result = validatePromo({
      code: "TEST10",
      promos: [{ ...promo, usageLimit: 1 }],
      subtotal: 200_000,
      eventIds: ["evt-1"],
      events: [event],
      orders: [order],
      now,
    });
    expect(result.error).toBe("limit");
  });

  it("calculates cart totals with fee and discount", () => {
    const result = calculateCartTotals({
      items: [cartItem],
      events: [event],
      promos: [promo],
      orders: [],
      promoCode: "TEST10",
    });
    expect(result.subtotal).toBe(200_000);
    expect(result.serviceFee).toBe(10_000);
    expect(result.discount).toBe(20_000);
    expect(result.total).toBe(190_000);
  });

  it("returns the starting ticket price", () => {
    expect(getStartingPrice(event)).toBe(100_000);
  });

  it("derives ticket availability", () => {
    expect(getTicketAvailability(ticket, now).available).toBe(true);
    expect(
      getTicketAvailability({ ...ticket, soldCount: 100 }, now).reason,
    ).toBe("sold_out");
    expect(
      getTicketAvailability(
        { ...ticket, salesEndAt: "2026-10-02T00:00:00.000Z" },
        now,
      ).reason,
    ).toBe("closed");
  });

  it("checks event purchasability", () => {
    expect(isEventPurchasable(event, now).purchasable).toBe(true);
    expect(isEventPurchasable({ ...event, status: "PAUSED" }, now).reason).toBe(
      "paused",
    );
  });
});
