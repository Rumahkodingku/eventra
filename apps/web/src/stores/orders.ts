import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { seedData } from "@/data/seed";
import type {
  Attendee,
  BuyerDetails,
  CartItem,
  Order,
  OrderItem,
  Ticket,
  User,
} from "@/domain/types";
import { createId, createOrderNumber, createTicketCode } from "@/lib/ids";
import { calculateCartTotals } from "@/lib/pricing";
import { safeStorage } from "@/lib/storage";
import { useEventStore } from "@/stores/events";
import { useNotificationStore } from "@/stores/notifications";

export interface CheckoutAttendee {
  fullName: string;
  email: string;
  phone?: string;
}

interface CreateOrderInput {
  buyer: BuyerDetails;
  paymentMethod: string;
  promoCode?: string;
  items: CartItem[];
  attendees: Record<string, CheckoutAttendee[]>;
  simulateFailure: boolean;
  user?: User | null;
}

interface OrderState {
  orders: Order[];
  tickets: Ticket[];
  attendees: Attendee[];
  createOrder: (input: CreateOrderInput) => { order: Order; tickets: Ticket[] };
  checkInTicket: (ticketId: string) => {
    ok: boolean;
    reason?: "not_found" | "already_used" | "invalid";
  };
  reset: () => void;
}

export const useOrderStore = create<OrderState>()(
  persist(
    (set, get) => ({
      orders: seedData.orders,
      tickets: seedData.tickets,
      attendees: seedData.attendees,
      createOrder: (input) => {
        const events = useEventStore.getState().events;
        const pricing = calculateCartTotals({
          items: input.items,
          events,
          promos: seedData.promos,
          orders: get().orders,
          promoCode: input.promoCode,
        });
        const orderId = createId("ord");
        const orderNumber = createOrderNumber();
        const now = new Date().toISOString();
        const success = !input.simulateFailure;
        const createdTickets: Ticket[] = [];
        const createdAttendees: Attendee[] = [];
        let ticketIndex = 0;

        const items: OrderItem[] = input.items.map((item) => {
          const event = events.find((entry) => entry.id === item.eventId);
          const ticketType = event?.ticketTypes.find(
            (entry) => entry.id === item.ticketTypeId,
          );
          const attendeeForItem = input.attendees[item.id] ?? [];
          const attendeeIds: string[] = [];
          if (success) {
            for (let unit = 0; unit < item.quantity; unit += 1) {
              const attendeeInput = attendeeForItem[unit] ?? {
                fullName: input.buyer.name,
                email: input.buyer.email,
                phone: input.buyer.phone,
              };
              const attendeeId = createId("att");
              const ticketId = createId("tkt");
              const code = createTicketCode(orderNumber, ticketIndex);
              ticketIndex += 1;
              const attendee: Attendee = {
                id: attendeeId,
                orderId,
                ticketId,
                fullName: attendeeInput.fullName,
                email: attendeeInput.email,
                phone: attendeeInput.phone,
                checkInStatus: "NOT_CHECKED_IN",
              };
              createdAttendees.push(attendee);
              createdTickets.push({
                id: ticketId,
                ticketCode: code,
                orderId,
                eventId: item.eventId,
                ticketTypeId: item.ticketTypeId,
                attendeeId,
                seatId: item.seatIds[unit],
                status: "VALID",
                issuedAt: now,
              });
              attendeeIds.push(attendeeId);
            }
          }
          return {
            id: createId("item"),
            orderId,
            eventId: item.eventId,
            ticketTypeId: item.ticketTypeId,
            ticketNameSnapshot: ticketType?.name ?? "Ticket",
            eventTitleSnapshot: event?.title ?? "Event",
            eventStartAtSnapshot: event?.startAt ?? now,
            venueNameSnapshot: event?.venueId ?? "",
            quantity: item.quantity,
            seatIds: item.seatIds,
            unitPriceSnapshot: item.unitPriceSnapshot,
            lineSubtotal: item.unitPriceSnapshot * item.quantity,
            attendeeIds,
          };
        });

        const order: Order = {
          id: orderId,
          orderNumber,
          userId: input.user?.id,
          ownerKey: input.user?.id ?? "guest-local",
          buyer: input.buyer,
          items,
          subtotal: pricing.subtotal,
          serviceFee: pricing.serviceFee,
          discount: pricing.discount,
          total: pricing.total,
          currency: "IDR",
          promoCode: pricing.promo?.code,
          paymentMethod: input.paymentMethod,
          paymentStatus: success ? "PAID" : "FAILED",
          orderStatus: success ? "CONFIRMED" : "PAYMENT_FAILED",
          createdAt: now,
          paidAt: success ? now : undefined,
        };

        set((state) => ({
          orders: [order, ...state.orders],
          tickets: [...createdTickets, ...state.tickets],
          attendees: [...createdAttendees, ...state.attendees],
        }));

        if (success) {
          input.items.forEach((item) => {
            if (item.seatIds.length) {
              useEventStore
                .getState()
                .markSeatsSold(item.eventId, item.seatIds);
            }
          });
        }

        useNotificationStore.getState().addNotification({
          userId: input.user?.id,
          type: "ORDER",
          title: success ? "Pesanan berhasil dibuat" : "Pembayaran gagal",
          message: success
            ? `Pesanan ${orderNumber} sudah dikonfirmasi. Tiket digitalmu siap.`
            : `Pembayaran untuk ${orderNumber} gagal. Keranjangmu masih tersimpan.`,
          targetUrl: success
            ? `/checkout/success/${order.id}`
            : `/checkout/result/${order.id}`,
        });

        return { order, tickets: createdTickets };
      },
      checkInTicket: (ticketId) => {
        const ticket = get().tickets.find((item) => item.id === ticketId);
        if (!ticket) return { ok: false, reason: "not_found" };
        if (ticket.status === "USED")
          return { ok: false, reason: "already_used" };
        if (ticket.status !== "VALID") return { ok: false, reason: "invalid" };
        const now = new Date().toISOString();
        set((state) => ({
          tickets: state.tickets.map((item) =>
            item.id === ticketId
              ? { ...item, status: "USED", checkedInAt: now }
              : item,
          ),
          attendees: state.attendees.map((attendee) =>
            attendee.ticketId === ticketId
              ? { ...attendee, checkInStatus: "CHECKED_IN", checkedInAt: now }
              : attendee,
          ),
        }));
        return { ok: true };
      },
      reset: () =>
        set({
          orders: seedData.orders,
          tickets: seedData.tickets,
          attendees: seedData.attendees,
        }),
    }),
    {
      name: "eventra-orders",
      version: 1,
      storage: createJSONStorage(() => safeStorage),
    },
  ),
);
