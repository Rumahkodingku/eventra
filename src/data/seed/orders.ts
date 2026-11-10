import type {
  Attendee,
  Event,
  Order,
  OrderItem,
  OrderStatus,
  PaymentStatus,
  Ticket,
  TicketStatus,
  User,
  Venue,
} from "@/domain/types";

const DAY = 86_400_000;
const HOUR = 3_600_000;

interface LineDefinition {
  ticketTypeName: string;
  quantity: number;
  seats?: number;
}

interface OrderDefinition {
  eventIndex: number;
  lines: LineDefinition[];
  orderStatus: OrderStatus;
  paymentStatus: PaymentStatus;
  daysAgo: number;
  buyerName: string;
  buyerEmail: string;
  buyerPhone: string;
  promoCode?: string;
}

const orderDefinitions: OrderDefinition[] = [
  {
    eventIndex: 0,
    lines: [{ ticketTypeName: "Regular", quantity: 2 }],
    orderStatus: "CONFIRMED",
    paymentStatus: "PAID",
    daysAgo: 4,
    buyerName: "Alya Putri",
    buyerEmail: "customer@demo.local",
    buyerPhone: "+62 812 0000 0001",
  },
  {
    eventIndex: 2,
    lines: [{ ticketTypeName: "Front Stage", quantity: 2, seats: 2 }],
    orderStatus: "CONFIRMED",
    paymentStatus: "PAID",
    daysAgo: 8,
    buyerName: "Alya Putri",
    buyerEmail: "customer@demo.local",
    buyerPhone: "+62 812 0000 0001",
  },
  {
    eventIndex: 10,
    lines: [
      { ticketTypeName: "Regular", quantity: 1 },
      { ticketTypeName: "Orchestra", quantity: 2, seats: 2 },
    ],
    orderStatus: "CONFIRMED",
    paymentStatus: "PAID",
    daysAgo: 12,
    buyerName: "Bagas Pratama",
    buyerEmail: "bagas@example.com",
    buyerPhone: "+62 812 0000 0010",
  },
  {
    eventIndex: 5,
    lines: [{ ticketTypeName: "Orchestra", quantity: 2, seats: 2 }],
    orderStatus: "CONFIRMED",
    paymentStatus: "PAID",
    daysAgo: 16,
    buyerName: "Citra Lestari",
    buyerEmail: "citra@example.com",
    buyerPhone: "+62 812 0000 0011",
    promoCode: "EVENTRA10",
  },
  {
    eventIndex: 8,
    lines: [{ ticketTypeName: "Front Stage", quantity: 1, seats: 1 }],
    orderStatus: "CONFIRMED",
    paymentStatus: "PAID",
    daysAgo: 20,
    buyerName: "Dimas Saputra",
    buyerEmail: "dimas@example.com",
    buyerPhone: "+62 812 0000 0012",
  },
  {
    eventIndex: 13,
    lines: [{ ticketTypeName: "Regular", quantity: 2 }],
    orderStatus: "CONFIRMED",
    paymentStatus: "PAID",
    daysAgo: 24,
    buyerName: "Eka Wulandari",
    buyerEmail: "eka@example.com",
    buyerPhone: "+62 812 0000 0013",
  },
  {
    eventIndex: 18,
    lines: [{ ticketTypeName: "Regular", quantity: 2 }],
    orderStatus: "CONFIRMED",
    paymentStatus: "PAID",
    daysAgo: 32,
    buyerName: "Fajar Nugroho",
    buyerEmail: "fajar@example.com",
    buyerPhone: "+62 812 0000 0014",
  },
  {
    eventIndex: 19,
    lines: [{ ticketTypeName: "Mezzanine", quantity: 1, seats: 1 }],
    orderStatus: "CONFIRMED",
    paymentStatus: "PAID",
    daysAgo: 40,
    buyerName: "Gita Maharani",
    buyerEmail: "gita@example.com",
    buyerPhone: "+62 812 0000 0015",
  },
  {
    eventIndex: 1,
    lines: [{ ticketTypeName: "Regular", quantity: 1 }],
    orderStatus: "PENDING_PAYMENT",
    paymentStatus: "UNPAID",
    daysAgo: 1,
    buyerName: "Hendra Wijaya",
    buyerEmail: "hendra@example.com",
    buyerPhone: "+62 812 0000 0016",
  },
  {
    eventIndex: 4,
    lines: [{ ticketTypeName: "Early Bird", quantity: 1 }],
    orderStatus: "PAYMENT_FAILED",
    paymentStatus: "FAILED",
    daysAgo: 2,
    buyerName: "Intan Permata",
    buyerEmail: "intan@example.com",
    buyerPhone: "+62 812 0000 0017",
  },
  {
    eventIndex: 22,
    lines: [{ ticketTypeName: "Regular", quantity: 1 }],
    orderStatus: "CANCELLED",
    paymentStatus: "CANCELLED",
    daysAgo: 3,
    buyerName: "Joko Santoso",
    buyerEmail: "joko@example.com",
    buyerPhone: "+62 812 0000 0018",
  },
];

const attendeeNames = [
  "Alya Putri",
  "Bagas Pratama",
  "Citra Lestari",
  "Dimas Saputra",
  "Eka Wulandari",
  "Fajar Nugroho",
  "Gita Maharani",
  "Hendra Wijaya",
  "Intan Permata",
  "Joko Santoso",
];

function round100(value: number): number {
  return Math.round(value / 100) * 100;
}

function makeOrderId(index: number): string {
  return `ord-${String(index + 1).padStart(3, "0")}`;
}

function makeOrderNumber(index: number): string {
  return `EVT-2026-${String(1001 + index).padStart(4, "0")}`;
}

function takeSeats(
  event: Event,
  tierKey: string | undefined,
  count: number,
): string[] {
  if (!event.seatLayout || !tierKey) return [];
  const section = event.seatLayout.sections.find(
    (item) => item.tierKey === tierKey,
  );
  if (!section) return [];
  const available = section.seats.filter((seat) => seat.status === "AVAILABLE");
  const chosen = available.slice(0, count);
  chosen.forEach((seat) => {
    seat.status = "SOLD";
  });
  return chosen.map((seat) => seat.id);
}

export function buildOrders(
  events: Event[],
  users: User[],
  venues: Venue[],
  now: Date,
): { orders: Order[]; tickets: Ticket[]; attendees: Attendee[] } {
  const orders: Order[] = [];
  const tickets: Ticket[] = [];
  const attendees: Attendee[] = [];

  orderDefinitions.forEach((definition, orderIndex) => {
    const event = events[definition.eventIndex];
    if (!event) return;
    const orderId = makeOrderId(orderIndex);
    const orderNumber = makeOrderNumber(orderIndex);
    const createdAt = new Date(
      now.getTime() - definition.daysAgo * DAY,
    ).toISOString();
    const paidAt =
      definition.orderStatus === "CONFIRMED"
        ? new Date(new Date(createdAt).getTime() + HOUR).toISOString()
        : undefined;
    const itemSnapshots: OrderItem[] = [];
    const orderTickets: Ticket[] = [];
    let subtotal = 0;

    definition.lines.forEach((line, lineIndex) => {
      const ticketType = event.ticketTypes.find(
        (item) => item.name === line.ticketTypeName,
      );
      if (!ticketType) return;
      const quantity = line.seats ?? line.quantity;
      const seatIds =
        ticketType.kind === "SEATED"
          ? takeSeats(event, ticketType.tierKey, quantity)
          : [];
      const lineSubtotal = ticketType.price * quantity;
      subtotal += lineSubtotal;
      const itemId = `${orderId}-item-${lineIndex + 1}`;
      const attendeeIds: string[] = [];

      if (definition.orderStatus === "CONFIRMED") {
        for (let unit = 0; unit < quantity; unit += 1) {
          const attendeeId = `${orderId}-att-${lineIndex + 1}-${unit + 1}`;
          const ticketId = `${orderId}-ticket-${lineIndex + 1}-${unit + 1}`;
          const ticketCode = `${orderNumber}-${lineIndex + 1}${unit + 1}`;
          const attendeeName =
            orderIndex === 0
              ? (users.find((user) => user.id === "user-customer")?.name ??
                attendeeNames[unit])
              : attendeeNames[(orderIndex + unit) % attendeeNames.length];
          const eventEnded = new Date(event.endAt).getTime() < now.getTime();
          const ticketStatus: TicketStatus = eventEnded
            ? unit === 0
              ? "USED"
              : "EXPIRED"
            : "VALID";
          const checkedInAt =
            ticketStatus === "USED"
              ? new Date(
                  new Date(event.startAt).getTime() + 30 * 60_000,
                ).toISOString()
              : undefined;

          attendees.push({
            id: attendeeId,
            orderId,
            ticketId,
            fullName: attendeeName,
            email:
              orderIndex === 0
                ? "customer@demo.local"
                : `${attendeeName.toLowerCase().replace(/\s+/g, ".")}@example.com`,
            phone: definition.buyerPhone,
            checkInStatus:
              ticketStatus === "USED" ? "CHECKED_IN" : "NOT_CHECKED_IN",
            checkedInAt,
          });
          const ticket: Ticket = {
            id: ticketId,
            ticketCode,
            orderId,
            eventId: event.id,
            ticketTypeId: ticketType.id,
            attendeeId,
            seatId: seatIds[unit],
            status: ticketStatus,
            issuedAt: paidAt ?? createdAt,
            checkedInAt,
          };
          tickets.push(ticket);
          orderTickets.push(ticket);
          attendeeIds.push(attendeeId);
        }
      }

      itemSnapshots.push({
        id: itemId,
        orderId,
        eventId: event.id,
        ticketTypeId: ticketType.id,
        ticketNameSnapshot: ticketType.name,
        eventTitleSnapshot: event.title,
        eventStartAtSnapshot: event.startAt,
        venueNameSnapshot:
          venues.find((venue) => venue.id === event.venueId)?.name ??
          event.venueId,
        quantity,
        seatIds,
        unitPriceSnapshot: ticketType.price,
        lineSubtotal,
        attendeeIds,
      });
    });

    const serviceFee = Math.min(round100(subtotal * 0.05), 25_000);
    let discount = 0;
    if (definition.promoCode === "EVENTRA10" && subtotal >= 250_000) {
      discount = Math.min(round100(subtotal * 0.1), 100_000);
    }
    const total = Math.max(0, subtotal + serviceFee - discount);

    orders.push({
      id: orderId,
      orderNumber,
      userId: "user-customer",
      ownerKey: "user-customer",
      buyer: {
        name: definition.buyerName,
        email: definition.buyerEmail,
        phone: definition.buyerPhone,
      },
      items: itemSnapshots,
      subtotal,
      serviceFee,
      discount,
      total,
      currency: "IDR",
      promoCode: definition.promoCode,
      paymentMethod:
        orderIndex % 3 === 0
          ? "QRIS"
          : orderIndex % 3 === 1
            ? "E-Wallet"
            : "Bank Transfer",
      paymentStatus: definition.paymentStatus,
      orderStatus: definition.orderStatus,
      createdAt,
      paidAt,
    });
  });

  return { orders, tickets, attendees };
}
