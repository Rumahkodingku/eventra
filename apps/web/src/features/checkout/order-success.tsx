"use client";

import { ArrowRight, Check, Compass, Printer, Ticket } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { DigitalTicket } from "@/components/shared/digital-ticket";
import { Button } from "@/components/ui/button";
import { DemoNotice } from "@/components/ui/demo-notice";
import { EmptyState } from "@/components/ui/empty-state";
import { formatIDR } from "@/lib/currency";
import { formatDateTime } from "@/lib/dates";
import { useCatalog } from "@/services/hooks/use-catalog";
import { useEventStore } from "@/services/hooks/use-event-store";
import { useOrderStore } from "@/services/hooks/use-order-store";
import { usePreferencesStore } from "@/stores/preferences";

export function OrderSuccess() {
  const t = useTranslations();
  const { venues } = useCatalog();
  const params = useParams<{ orderId: string }>();
  const locale = usePreferencesStore((state) => state.locale);
  const orders = useOrderStore((state) => state.orders);
  const tickets = useOrderStore((state) => state.tickets);
  const attendees = useOrderStore((state) => state.attendees);
  const events = useEventStore((state) => state.events);
  const order = orders.find((item) => item.id === params.orderId);

  if (!order) {
    return (
      <div className="container-page section-space">
        <EmptyState
          icon={Compass}
          title={t("common.notFound")}
          body={t("errors.notFound")}
          action={
            <Button asChild>
              <Link href="/events">{t("nav.events")}</Link>
            </Button>
          }
        />
      </div>
    );
  }

  if (order.orderStatus !== "CONFIRMED") {
    return (
      <div className="container-page section-space">
        <EmptyState
          icon={Compass}
          title={t("common.pending")}
          body={t("checkout.orderNote")}
          action={
            <Button asChild>
              <Link href={`/checkout/result/${order.id}`}>
                {t("common.viewOrder")}
              </Link>
            </Button>
          }
        />
      </div>
    );
  }

  const orderTickets = tickets.filter((ticket) => ticket.orderId === order.id);

  return (
    <div className="container-page section-space">
      <div className="mx-auto max-w-3xl text-center">
        <span className="mx-auto grid size-16 place-items-center rounded-3xl bg-success/10 text-success">
          <Check className="size-8" />
        </span>
        <p className="mt-6 text-xs font-semibold uppercase tracking-[0.2em] text-brand-strong">
          {t("checkout.success")}
        </p>
        <h1 className="mt-3 font-display text-4xl font-semibold sm:text-5xl">
          {t("checkout.successTitle")}
        </h1>
        <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-muted">
          {t("checkout.successBody")}
        </p>
        <div className="mt-6 inline-flex flex-wrap items-center justify-center gap-2 rounded-full border border-line bg-surface px-4 py-2 text-xs">
          <span className="text-muted">{t("checkout.orderNumber")}</span>
          <span className="font-semibold tabular">{order.orderNumber}</span>
          <span className="size-1 rounded-full bg-line" />
          <span className="font-semibold">
            {formatIDR(order.total, locale)}
          </span>
        </div>
      </div>

      <div className="mx-auto mt-8 grid max-w-3xl gap-4">
        {orderTickets.map((ticket) => {
          const event = events.find((item) => item.id === ticket.eventId);
          const attendee = attendees.find(
            (item) => item.id === ticket.attendeeId,
          );
          const ticketType = event?.ticketTypes.find(
            (item) => item.id === ticket.ticketTypeId,
          );
          const venue = event
            ? venues.find((item) => item.id === event.venueId)
            : undefined;
          if (!event) return null;
          return (
            <DigitalTicket
              key={ticket.id}
              ticket={ticket}
              event={event}
              ticketType={ticketType}
              attendee={attendee}
              venue={venue}
              orderNumber={order.orderNumber}
              showLink={false}
              dark
            />
          );
        })}
      </div>

      <div className="mx-auto mt-7 flex max-w-3xl flex-col gap-3 sm:flex-row">
        <Button asChild className="flex-1" size="lg">
          <Link href="/tickets">
            <Ticket className="size-4" /> {t("checkout.viewTickets")}
          </Link>
        </Button>
        <Button asChild variant="outline" className="flex-1" size="lg">
          <Link href={`/orders/${order.id}`}>
            {t("checkout.viewOrder")} <ArrowRight className="size-4" />
          </Link>
        </Button>
        <Button variant="ghost" size="lg" onClick={() => window.print()}>
          <Printer className="size-4" /> {t("common.print")}
        </Button>
      </div>

      <div className="mx-auto mt-5 max-w-3xl text-center text-xs text-muted">
        {formatDateTime(
          order.paidAt ?? order.createdAt,
          "Asia/Jakarta",
          locale,
        )}
      </div>
      <DemoNotice className="mx-auto mt-6 max-w-3xl">
        {t("common.simulationNotice")}
      </DemoNotice>
    </div>
  );
}
