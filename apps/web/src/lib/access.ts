import type { Order, Ticket, User } from "@/domain/types";

export function visibleOrdersForUser(
  orders: Order[],
  user: User | null,
): Order[] {
  if (!user)
    return orders.filter(
      (order) =>
        order.ownerKey === "guest-local" || order.ownerKey.startsWith("guest:"),
    );
  return orders.filter(
    (order) => order.userId === user.id || order.ownerKey === "guest-local",
  );
}

export function visibleTicketsForUser(
  tickets: Ticket[],
  orders: Order[],
  user: User | null,
): Ticket[] {
  const orderIds = new Set(
    visibleOrdersForUser(orders, user).map((order) => order.id),
  );
  return tickets.filter((ticket) => orderIds.has(ticket.orderId));
}

export function ownsTicketForEvent(
  eventId: string,
  tickets: Ticket[],
  orders: Order[],
  user: User | null,
): boolean {
  const visible = visibleTicketsForUser(tickets, orders, user);
  return visible.some(
    (ticket) =>
      ticket.eventId === eventId &&
      (ticket.status === "VALID" || ticket.status === "USED"),
  );
}

export function isOrganizer(user: User | null): boolean {
  return user?.role === "ORGANIZER";
}
