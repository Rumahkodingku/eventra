import { describe, expect, it } from "vitest";
import type { Order, Ticket, User } from "@/domain/types";
import { visibleOrdersForUser, visibleTicketsForUser } from "@/lib/access";

const baseOrder: Order = {
  id: "order-1",
  orderNumber: "EVT-1",
  ownerKey: "guest:guest-1",
  buyer: { name: "Guest", email: "guest@example.com", phone: "0812" },
  items: [],
  subtotal: 0,
  serviceFee: 0,
  discount: 0,
  total: 0,
  currency: "IDR",
  paymentMethod: "qris",
  paymentStatus: "PAID",
  orderStatus: "CONFIRMED",
  createdAt: new Date().toISOString(),
};

const ticket: Ticket = {
  id: "ticket-1",
  ticketCode: "TKT-1",
  orderId: "order-1",
  eventId: "evt-01",
  ticketTypeId: "tt-1",
  attendeeId: "att-1",
  status: "VALID",
  issuedAt: new Date().toISOString(),
};

const user: User = {
  id: "user-1",
  name: "User",
  email: "user@example.com",
  role: "CUSTOMER",
  locale: "id",
  createdAt: new Date().toISOString(),
};

describe("order access", () => {
  it("shows an API guest order to its guest principal", () => {
    expect(visibleOrdersForUser([baseOrder], null)).toEqual([baseOrder]);
    expect(visibleTicketsForUser([ticket], [baseOrder], null)).toEqual([
      ticket,
    ]);
  });

  it("does not show a logged-in user's order to a guest", () => {
    const owned = { ...baseOrder, ownerKey: "user:user-1", userId: "user-1" };
    expect(visibleOrdersForUser([owned], null)).toEqual([]);
  });

  it("shows a logged-in user only their own orders", () => {
    const owned = { ...baseOrder, ownerKey: "user:user-1", userId: "user-1" };
    const other = {
      ...baseOrder,
      id: "order-2",
      ownerKey: "user:user-2",
      userId: "user-2",
    };
    expect(visibleOrdersForUser([owned, other], user)).toEqual([owned]);
  });
});
