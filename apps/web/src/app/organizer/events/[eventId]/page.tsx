"use client";

import {
  ArrowLeft,
  CalendarDays,
  Edit3,
  MapPin,
  Settings2,
  Ticket,
  Users,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { StatusBadge } from "@/components/ui/status-badge";
import {
  Table,
  TableWrap,
  TBody,
  TD,
  TH,
  THead,
  TR,
} from "@/components/ui/table";
import { venues } from "@/data/seed/catalog";
import { formatIDR } from "@/lib/currency";
import { formatDateTime } from "@/lib/dates";
import { getTicketAvailability } from "@/lib/pricing";
import { useEventStore } from "@/stores/events";
import { useOrderStore } from "@/stores/orders";
import { usePreferencesStore } from "@/stores/preferences";

export default function OrganizerEventOverviewPage() {
  const t = useTranslations();
  const params = useParams<{ eventId: string }>();
  const locale = usePreferencesStore((state) => state.locale);
  const events = useEventStore((state) => state.events);
  const orders = useOrderStore((state) => state.orders);
  const event = events.find((item) => item.id === params.eventId);

  if (!event) {
    return (
      <EmptyState
        icon={CalendarDays}
        title={t("common.notFound")}
        body={t("errors.notFound")}
        action={
          <Button asChild>
            <Link href="/organizer/events">{t("organizer.events")}</Link>
          </Button>
        }
      />
    );
  }

  const venue = venues.find((item) => item.id === event.venueId);
  const eventOrders = orders.filter(
    (order) =>
      order.orderStatus === "CONFIRMED" &&
      order.items.some((item) => item.eventId === event.id),
  );
  const ticketsSold = event.ticketTypes.reduce(
    (total, ticket) => total + ticket.soldCount,
    0,
  );
  const revenue = eventOrders.reduce(
    (total, order) =>
      total +
      order.items
        .filter((item) => item.eventId === event.id)
        .reduce((sum, item) => sum + item.lineSubtotal, 0),
    0,
  );
  const statusLabel =
    event.status === "DRAFT"
      ? t("organizer.draft")
      : event.status === "PUBLISHED"
        ? t("organizer.published")
        : event.status === "PAUSED"
          ? t("organizer.paused")
          : event.status === "ENDED"
            ? t("organizer.ended")
            : t("organizer.cancelled");

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge status={event.status} label={statusLabel} />
            <Badge variant="brand">{event.subcategory}</Badge>
          </div>
          <h1 className="mt-3 max-w-3xl font-display text-3xl font-semibold sm:text-4xl">
            {event.title}
          </h1>
          <p className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted">
            <span className="inline-flex items-center gap-1.5">
              <CalendarDays className="size-3.5" />
              {formatDateTime(event.startAt, event.timezone, locale)}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <MapPin className="size-3.5" />
              {venue?.name}, {venue?.city}
            </span>
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline" size="sm">
            <Link href={`/events/${event.slug}`} target="_blank">
              {t("common.viewTicket")}
            </Link>
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link href={`/organizer/events/${event.id}/edit`}>
              <Edit3 className="size-4" /> {t("common.edit")}
            </Link>
          </Button>
          <Button asChild size="sm">
            <Link href={`/organizer/events/${event.id}/tickets`}>
              <Settings2 className="size-4" /> {t("organizer.ticketConfig")}
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {[
          {
            label: t("organizer.ticketsSold"),
            value: ticketsSold.toLocaleString(
              locale === "id" ? "id-ID" : "en-US",
            ),
            icon: Ticket,
          },
          {
            label: t("organizer.sales"),
            value: formatIDR(revenue, locale),
            icon: Ticket,
          },
          {
            label: t("organizer.orders"),
            value: eventOrders.length.toLocaleString(
              locale === "id" ? "id-ID" : "en-US",
            ),
            icon: Users,
          },
        ].map((stat) => (
          <div
            key={stat.label}
            className="rounded-3xl border border-line bg-surface p-5"
          >
            <span className="grid size-9 place-items-center rounded-xl bg-brand-soft text-brand-strong">
              <stat.icon className="size-4" />
            </span>
            <p className="mt-3 text-xs text-muted">{stat.label}</p>
            <p className="mt-1 font-display text-2xl font-semibold tabular">
              {stat.value}
            </p>
          </div>
        ))}
      </div>

      <div className="grid gap-5 xl:grid-cols-[1fr_360px]">
        <div className="min-w-0 space-y-5">
          <div className="overflow-hidden rounded-3xl border border-line bg-surface">
            <div className="relative aspect-[21/9]">
              <Image
                src={event.coverImage}
                alt={event.title}
                fill
                sizes="(max-width: 1280px) 100vw, 60vw"
                className="object-cover"
              />
            </div>
            <div className="p-5">
              <h2 className="font-display text-xl font-semibold">
                {t("event.about")}
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-muted">
                {event.description}
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                {event.tags.map((tag) => (
                  <Badge key={tag} variant="neutral">
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          </div>

          <div>
            <h2 className="mb-3 font-display text-xl font-semibold">
              {t("organizer.ticketConfig")}
            </h2>
            <TableWrap>
              <Table>
                <THead>
                  <TR>
                    <TH>{t("organizer.ticketName")}</TH>
                    <TH>{t("organizer.price")}</TH>
                    <TH>{t("organizer.quota")}</TH>
                    <TH>Terjual</TH>
                    <TH>{t("common.status")}</TH>
                  </TR>
                </THead>
                <TBody>
                  {event.ticketTypes.map((ticket) => {
                    const availability = getTicketAvailability(ticket);
                    return (
                      <TR key={ticket.id}>
                        <TD>
                          <span className="font-semibold">{ticket.name}</span>
                          <span className="mt-0.5 block text-[11px] text-muted">
                            {ticket.kind.replaceAll("_", " ")}
                          </span>
                        </TD>
                        <TD className="tabular">
                          {formatIDR(ticket.price, locale)}
                        </TD>
                        <TD className="tabular">{ticket.quota}</TD>
                        <TD className="tabular">{ticket.soldCount}</TD>
                        <TD>
                          <Badge
                            variant={
                              availability.available ? "success" : "danger"
                            }
                          >
                            {availability.available
                              ? t("common.available")
                              : t("common.soldOut")}
                          </Badge>
                        </TD>
                      </TR>
                    );
                  })}
                </TBody>
              </Table>
            </TableWrap>
          </div>
        </div>

        <aside className="space-y-4">
          <div className="rounded-3xl border border-line bg-surface p-5">
            <h2 className="font-display text-lg font-semibold">
              {t("event.schedule")}
            </h2>
            <div className="mt-4 space-y-3">
              {event.schedule.map((item) => (
                <div
                  key={`${item.time}-${item.title}`}
                  className="flex gap-3 text-sm"
                >
                  <span className="w-12 shrink-0 font-semibold tabular text-brand-strong">
                    {item.time}
                  </span>
                  <span className="text-ink">{item.title}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-3xl border border-line bg-surface p-5">
            <h2 className="font-display text-lg font-semibold">
              {t("common.actions")}
            </h2>
            <div className="mt-3 space-y-2">
              <Button
                asChild
                variant="outline"
                className="w-full justify-start"
              >
                <Link href={`/organizer/events/${event.id}/tickets`}>
                  <Settings2 className="size-4" /> {t("organizer.ticketConfig")}
                </Link>
              </Button>
              <Button
                asChild
                variant="outline"
                className="w-full justify-start"
              >
                <Link href="/organizer/orders">
                  <Ticket className="size-4" /> {t("organizer.orders")}
                </Link>
              </Button>
              <Button asChild variant="ghost" className="w-full justify-start">
                <Link href="/organizer/events">
                  <ArrowLeft className="size-4" /> {t("organizer.events")}
                </Link>
              </Button>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
