"use client";

import {
  ArrowLeft,
  CalendarPlus,
  CheckCircle2,
  Compass,
  Download,
  MapPin,
  Printer,
  Share2,
  Ticket as TicketIcon,
} from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useMemo } from "react";
import { toast } from "sonner";
import { DigitalTicket } from "@/components/shared/digital-ticket";
import { Badge } from "@/components/ui/badge";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { venues } from "@/data/seed/catalog";
import { visibleTicketsForUser } from "@/lib/access";
import { downloadIcs } from "@/lib/calendar";
import { cn } from "@/lib/cn";
import { formatEventDate, formatTime, getTimezoneLabel } from "@/lib/dates";
import { useEventStore } from "@/stores/events";
import { useOrderStore } from "@/stores/orders";
import { usePreferencesStore } from "@/stores/preferences";
import { useSessionStore } from "@/stores/session";

export default function TicketDetailPage() {
  const t = useTranslations();
  const params = useParams<{ ticketId: string }>();
  const locale = usePreferencesStore((state) => state.locale);
  const user = useSessionStore((state) => state.user);
  const orders = useOrderStore((state) => state.orders);
  const tickets = useOrderStore((state) => state.tickets);
  const attendees = useOrderStore((state) => state.attendees);
  const events = useEventStore((state) => state.events);

  const ticket = useMemo(
    () =>
      visibleTicketsForUser(tickets, orders, user).find(
        (item) => item.id === params.ticketId,
      ),
    [tickets, orders, user, params.ticketId],
  );
  const order = orders.find((item) => item.id === ticket?.orderId);
  const event = events.find((item) => item.id === ticket?.eventId);
  const venue = event
    ? venues.find((item) => item.id === event.venueId)
    : undefined;
  const attendee = attendees.find((item) => item.id === ticket?.attendeeId);
  const ticketType = event?.ticketTypes.find(
    (item) => item.id === ticket?.ticketTypeId,
  );

  if (!ticket || !event) {
    return (
      <div className="container-page section-space">
        <EmptyState
          icon={Compass}
          title={t("common.notFound")}
          body={t("errors.notFound")}
          action={
            <Button asChild>
              <Link href="/tickets">{t("nav.myTickets")}</Link>
            </Button>
          }
        />
      </div>
    );
  }

  const download = () => {
    const text = [
      "EVENTRA — DEMO TICKET",
      `Event: ${event.title}`,
      `Date: ${formatEventDate(event.startAt, event.timezone, locale)} ${formatTime(event.startAt, event.timezone, locale)} ${getTimezoneLabel(event.timezone)}`,
      `Venue: ${venue?.name ?? ""}, ${venue?.city ?? ""}`,
      `Ticket holder: ${attendee?.fullName ?? ""}`,
      `Ticket type: ${ticketType?.name ?? ""}`,
      `Seat: ${ticket.seatId ?? "General admission"}`,
      `Ticket code: ${ticket.ticketCode}`,
      `Status: ${ticket.status}`,
      "This is a simulation. No real ticket or payment exists.",
    ].join("\n");
    const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${ticket.ticketCode}.txt`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const share = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: event.title,
          text: ticket.ticketCode,
          url: window.location.href,
        });
      } else {
        await navigator.clipboard.writeText(window.location.href);
        toast.success(t("common.copied"));
      }
    } catch {
      // Share can be cancelled by the user.
    }
  };

  return (
    <div className="container-page section-space">
      <Breadcrumbs
        items={[
          { label: t("nav.myTickets"), href: "/tickets" },
          { label: ticket.ticketCode },
        ]}
      />
      <div className="mt-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-strong">
            {t("tickets.title")}
          </p>
          <h1 className="mt-2 font-display text-3xl font-semibold sm:text-4xl">
            {event.title}
          </h1>
          <p className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted">
            <span>
              {formatEventDate(event.startAt, event.timezone, locale)}
            </span>
            <span className="size-1 rounded-full bg-line" />
            <span>
              {formatTime(event.startAt, event.timezone, locale)}{" "}
              {getTimezoneLabel(event.timezone)}
            </span>
            <span className="size-1 rounded-full bg-line" />
            <span className="inline-flex items-center gap-1">
              <MapPin className="size-3.5" />
              {venue?.name}
            </span>
          </p>
        </div>
        <Button asChild variant="ghost" size="sm">
          <Link href="/tickets">
            <ArrowLeft className="size-4" /> {t("nav.myTickets")}
          </Link>
        </Button>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_360px]">
        <div className="space-y-4">
          <DigitalTicket
            ticket={ticket}
            event={event}
            ticketType={ticketType}
            attendee={attendee}
            venue={venue}
            orderNumber={order?.orderNumber}
            showLink={false}
          />
          <div className="flex flex-wrap gap-2 no-print">
            <Button variant="outline" onClick={download}>
              <Download className="size-4" /> {t("tickets.download")}
            </Button>
            <Button variant="outline" onClick={() => window.print()}>
              <Printer className="size-4" /> {t("tickets.print")}
            </Button>
            <Button variant="outline" onClick={share}>
              <Share2 className="size-4" /> {t("tickets.share")}
            </Button>
          </div>
        </div>

        <aside className="space-y-4">
          <div className="rounded-3xl border border-line bg-surface p-5">
            <h2 className="font-display text-lg font-semibold">
              {t("common.details")}
            </h2>
            <dl className="mt-4 space-y-3 text-sm">
              <div className="flex items-start justify-between gap-4">
                <dt className="text-muted">{t("tickets.attendee")}</dt>
                <dd className="text-right font-medium">
                  {attendee?.fullName ?? "—"}
                </dd>
              </div>
              <div className="flex items-start justify-between gap-4">
                <dt className="text-muted">{t("tickets.seat")}</dt>
                <dd className="text-right font-medium">
                  {ticket.seatId
                    ? ticket.seatId.split(":").slice(-2).join("")
                    : "GA"}
                </dd>
              </div>
              <div className="flex items-start justify-between gap-4">
                <dt className="text-muted">{t("tickets.status")}</dt>
                <dd>
                  <Badge
                    variant={ticket.status === "USED" ? "info" : "success"}
                  >
                    {ticket.status === "USED"
                      ? t("common.used")
                      : ticket.status === "CANCELLED"
                        ? t("common.cancelled")
                        : ticket.status === "EXPIRED"
                          ? t("common.expired")
                          : t("common.valid")}
                  </Badge>
                </dd>
              </div>
              <div className="flex items-start justify-between gap-4">
                <dt className="text-muted">{t("tickets.order")}</dt>
                <dd className="text-right font-medium tabular">
                  {order?.orderNumber}
                </dd>
              </div>
            </dl>
            <div className="mt-5 flex flex-col gap-2">
              {order ? (
                <Button asChild variant="outline" size="sm">
                  <Link href={`/orders/${order.id}`}>
                    {t("common.viewOrder")}
                  </Link>
                </Button>
              ) : null}
              <Button
                variant="outline"
                size="sm"
                onClick={() => downloadIcs(event, venue)}
              >
                <CalendarPlus className="size-4" /> {t("common.addCalendar")}
              </Button>
            </div>
          </div>

          <div
            className={cn(
              "rounded-3xl border p-5",
              attendee?.checkInStatus === "CHECKED_IN"
                ? "border-success/20 bg-success/10"
                : "border-line bg-surface",
            )}
          >
            <div className="flex items-center gap-2">
              <CheckCircle2
                className={cn(
                  "size-5",
                  attendee?.checkInStatus === "CHECKED_IN"
                    ? "text-success"
                    : "text-muted",
                )}
              />
              <p className="text-sm font-semibold">
                {attendee?.checkInStatus === "CHECKED_IN"
                  ? t("tickets.checkedIn")
                  : t("tickets.notCheckedIn")}
              </p>
            </div>
            <p className="mt-2 text-xs leading-relaxed text-muted">
              {attendee?.checkedInAt
                ? `${t("tickets.checkedIn")}: ${new Date(attendee.checkedInAt).toLocaleString(locale === "id" ? "id-ID" : "en-GB")}`
                : t("tickets.qrNote")}
            </p>
          </div>

          <div className="rounded-3xl border border-line bg-surface p-5">
            <h2 className="flex items-center gap-2 text-sm font-semibold">
              <TicketIcon className="size-4 text-brand-strong" />{" "}
              {t("tickets.useAtGate")}
            </h2>
            <p className="mt-2 text-xs leading-relaxed text-muted">
              Tunjukkan QR code kepada petugas. Setelah check-in, status tiket
              berubah menjadi {t("common.used")} dan tidak dapat dipakai ulang.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}
