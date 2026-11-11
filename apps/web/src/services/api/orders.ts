import type { components } from "@eventra/api-client";
import type { Attendee, Order, OrderItem, Ticket } from "@/domain/types";
import { api } from "@/services/api/client";
import type {
  CheckoutRepository,
  CreateOrderInput,
  OrderBundle,
  OrderRepository,
  TicketWalletRepository,
} from "@/services/repositories/types";

type ApiOrder = components["schemas"]["Order"];
type ApiOrderItem = components["schemas"]["OrderItem"];
type ApiTicket = components["schemas"]["Ticket"];
type ApiAttendee = components["schemas"]["Attendee"];

function mapOrderItem(orderId: string, item: ApiOrderItem): OrderItem {
  return {
    id: item.id,
    orderId,
    eventId: item.event_id,
    ticketTypeId: item.ticket_type_id,
    ticketNameSnapshot: item.ticket_name_snapshot,
    eventTitleSnapshot: item.event_title_snapshot,
    eventStartAtSnapshot: item.event_start_at_snapshot ?? "",
    venueNameSnapshot: item.venue_name_snapshot ?? "",
    quantity: item.quantity,
    seatIds: item.seat_ids,
    unitPriceSnapshot: item.unit_price_snapshot,
    lineSubtotal: item.line_subtotal,
    attendeeIds: item.attendee_ids ?? [],
  };
}

function mapOrder(order: ApiOrder): Order {
  return {
    id: order.id,
    orderNumber: order.order_number,
    userId: order.user_id,
    ownerKey: order.owner_key ?? "",
    buyer: {
      name: order.buyer_name,
      email: order.buyer_email,
      phone: order.buyer_phone,
    },
    items: order.items.map((item) => mapOrderItem(order.id, item)),
    subtotal: order.subtotal,
    serviceFee: order.service_fee,
    discount: order.discount,
    total: order.total,
    currency: "IDR",
    promoCode: order.promo_code,
    paymentMethod: order.payment_method ?? "",
    paymentStatus: order.payment_status,
    orderStatus: order.order_status,
    createdAt: order.created_at ?? new Date().toISOString(),
    paidAt: order.paid_at,
  };
}

export function mapTicket(ticket: ApiTicket): Ticket {
  return {
    id: ticket.id,
    ticketCode: ticket.ticket_code,
    orderId: ticket.order_id,
    eventId: ticket.event_id,
    ticketTypeId: ticket.ticket_type_id,
    attendeeId: ticket.attendee_id,
    seatId: ticket.seat_id,
    status: ticket.status,
    issuedAt: ticket.issued_at,
    checkedInAt: ticket.checked_in_at,
  };
}

function mapAttendee(attendee: ApiAttendee): Attendee {
  return {
    id: attendee.id,
    orderId: attendee.order_id,
    ticketId: attendee.ticket_id ?? "",
    fullName: attendee.full_name,
    email: attendee.email,
    phone: attendee.phone,
    checkInStatus: attendee.check_in_status,
    checkedInAt: attendee.checked_in_at,
  };
}

async function loadBundle(): Promise<OrderBundle> {
  const [orders, tickets, attendees] = await Promise.all([
    api.GET("/orders"),
    api.GET("/tickets"),
    api.GET("/account/attendees"),
  ]);
  return {
    orders: (orders.data?.items ?? []).map(mapOrder),
    tickets: (tickets.data?.items ?? []).map(mapTicket),
    attendees: (attendees.data?.items ?? []).map(mapAttendee),
  };
}

function flattenAttendees(input: CreateOrderInput) {
  return input.items.flatMap((item) =>
    (input.attendees[item.id] ?? []).map((attendee) => ({
      full_name: attendee.fullName,
      email: attendee.email,
      phone: attendee.phone,
    })),
  );
}

export const apiCheckoutRepository: CheckoutRepository = {
  createOrder: async (input) => {
    const eventIDs = [...new Set(input.items.map((item) => item.eventId))];
    if (eventIDs.length !== 1) {
      throw new Error("MULTI_EVENT_CART");
    }
    const eventID = eventIDs[0];
    const reservation = await api.POST("/checkout/reservations", {
      body: {
        event_id: eventID,
        items: input.items.map((item) => ({
          ticket_type_id: item.ticketTypeId,
          quantity: item.quantity,
          seat_ids: item.seatIds,
        })),
      },
    });
    if (reservation.error || !reservation.data) {
      throw new Error("INVENTORY_CONFLICT");
    }
    const result = await api.POST("/checkout/orders", {
      params: {
        header: { "Idempotency-Key": crypto.randomUUID() },
      },
      body: {
        reservation_id: reservation.data.id,
        payment_method: input.paymentMethod,
        promo_code: input.promoCode,
        simulate_failure: input.simulateFailure,
        buyer: input.buyer,
        attendees: flattenAttendees(input),
      },
    });
    if (result.error || !result.data) {
      throw new Error("ORDER_FAILED");
    }
    return {
      order: mapOrder(result.data.order),
      tickets: (result.data.tickets ?? []).map(mapTicket),
    };
  },
};

export async function listOrganizerOrders(): Promise<Order[]> {
  const result = await api.GET("/organizer/orders");
  return (result.data?.items ?? []).map(mapOrder);
}

export async function listOrganizerAttendees(): Promise<Attendee[]> {
  const result = await api.GET("/organizer/attendees");
  return (result.data?.items ?? []).map(mapAttendee);
}

export async function listOrganizerTickets(): Promise<Ticket[]> {
  const result = await api.GET("/organizer/tickets");
  return (result.data?.items ?? []).map(mapTicket);
}

export const apiOrderRepository: OrderRepository = {
  bundle: loadBundle,
  list: async () => (await loadBundle()).orders,
  get: async (id) => {
    const result = await api.GET("/orders/{id}", { params: { path: { id } } });
    return result.data ? mapOrder(result.data) : undefined;
  },
  listTickets: async (orderId) => {
    const result = await api.GET("/tickets");
    const tickets = (result.data?.items ?? []).map(mapTicket);
    return orderId
      ? tickets.filter((ticket) => ticket.orderId === orderId)
      : tickets;
  },
  checkInTicket: async (ticketId) => {
    const result = await api.GET("/organizer/tickets");
    const ticket = result.data?.items
      .map(mapTicket)
      .find((item) => item.id === ticketId);
    if (!ticket) return { ok: false, reason: "not_found" };
    const checked = await api.POST("/organizer/events/{eventId}/check-in", {
      params: { path: { eventId: ticket.eventId } },
      body: { token: ticket.ticketCode },
    });
    if (checked.error) {
      const code = (checked.error as { error?: { code?: string } }).error?.code;
      return {
        ok: false,
        reason: code === "TICKET_ALREADY_USED" ? "already_used" : "not_found",
      };
    }
    return { ok: true };
  },
};

export const apiTicketWalletRepository: TicketWalletRepository = {
  list: async () => {
    const result = await api.GET("/tickets");
    return (result.data?.items ?? []).map(mapTicket);
  },
  get: async (id) => {
    const result = await api.GET("/tickets/{id}", { params: { path: { id } } });
    return result.data ? mapTicket(result.data) : undefined;
  },
};
