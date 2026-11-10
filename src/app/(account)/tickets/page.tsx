"use client";

import {
  CalendarDays,
  MapPin,
  Search,
  Ticket as TicketIcon,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusBadge } from "@/components/ui/status-badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { venues } from "@/data/seed/catalog";
import { useHydrated } from "@/hooks/use-hydrated";
import { visibleTicketsForUser } from "@/lib/access";
import { formatShortDate, formatTime } from "@/lib/dates";
import { getSeatLabel } from "@/lib/seat";
import { useEventStore } from "@/stores/events";
import { useOrderStore } from "@/stores/orders";
import { usePreferencesStore } from "@/stores/preferences";
import { useSessionStore } from "@/stores/session";

export default function TicketsPage() {
  const t = useTranslations();
  const hydrated = useHydrated();
  const locale = usePreferencesStore((state) => state.locale);
  const user = useSessionStore((state) => state.user);
  const orders = useOrderStore((state) => state.orders);
  const tickets = useOrderStore((state) => state.tickets);
  const events = useEventStore((state) => state.events);
  const [search, setSearch] = useState("");

  const visible = useMemo(
    () => visibleTicketsForUser(tickets, orders, user),
    [tickets, orders, user],
  );
  const enriched = visible
    .map((ticket) => ({
      ticket,
      event: events.find((event) => event.id === ticket.eventId),
    }))
    .filter(
      (
        item,
      ): item is {
        ticket: (typeof visible)[number];
        event: NonNullable<(typeof item)["event"]>;
      } => Boolean(item.event),
    );
  const filtered = enriched.filter(({ ticket, event }) => {
    if (!event) return false;
    const query = search.trim().toLowerCase();
    return (
      !query ||
      event.title.toLowerCase().includes(query) ||
      ticket.ticketCode.toLowerCase().includes(query)
    );
  });

  const now = Date.now();
  const upcoming = filtered.filter(
    ({ ticket, event }) =>
      new Date(event.startAt).getTime() >= now && ticket.status === "VALID",
  );
  const past = filtered.filter(
    ({ event }) => new Date(event.startAt).getTime() < now,
  );
  const cancelled = filtered.filter(
    ({ ticket }) => ticket.status === "CANCELLED",
  );
  const expired = filtered.filter(({ ticket }) => ticket.status === "EXPIRED");

  if (!hydrated) {
    return (
      <div className="container-page section-space">
        <Skeleton className="h-5 w-24" />
        <Skeleton className="mt-4 h-12 w-1/3" />
        <div className="mt-8 space-y-4">
          {["one", "two", "three"].map((key) => (
            <Skeleton key={key} className="h-40" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container-page section-space">
      <div className="max-w-2xl">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-strong">
          {t("nav.account")}
        </p>
        <h1 className="mt-3 font-display text-4xl font-semibold sm:text-5xl">
          {t("tickets.title")}
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-muted">
          {t("tickets.subtitle")}
        </p>
      </div>

      <div className="mt-7 flex max-w-md items-center gap-2 rounded-full border border-line bg-surface p-1.5">
        <Search className="ml-3 size-4 text-muted" />
        <Input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder={t("common.search")}
          className="h-9 border-0 bg-transparent px-0 focus:border-0"
          aria-label={t("common.search")}
        />
      </div>

      <Tabs defaultValue="all" className="mt-7">
        <TabsList>
          <TabsTrigger value="all">
            {t("tickets.all")}{" "}
            <span className="ml-1 text-xs opacity-60">{filtered.length}</span>
          </TabsTrigger>
          <TabsTrigger value="upcoming">
            {t("tickets.upcoming")}{" "}
            <span className="ml-1 text-xs opacity-60">{upcoming.length}</span>
          </TabsTrigger>
          <TabsTrigger value="past">
            {t("tickets.past")}{" "}
            <span className="ml-1 text-xs opacity-60">{past.length}</span>
          </TabsTrigger>
          <TabsTrigger value="cancelled">
            {t("tickets.cancelled")}{" "}
            <span className="ml-1 text-xs opacity-60">{cancelled.length}</span>
          </TabsTrigger>
          <TabsTrigger value="expired">
            {t("tickets.expired")}{" "}
            <span className="ml-1 text-xs opacity-60">{expired.length}</span>
          </TabsTrigger>
        </TabsList>

        {[
          { value: "all", data: filtered },
          { value: "upcoming", data: upcoming },
          { value: "past", data: past },
          { value: "cancelled", data: cancelled },
          { value: "expired", data: expired },
        ].map(({ value, data }) => (
          <TabsContent key={value} value={value}>
            {data.length ? (
              <div className="grid gap-4">
                {data.map(({ ticket, event }) => {
                  if (!event) return null;
                  const venue = venues.find(
                    (item) => item.id === event.venueId,
                  );
                  const ticketType = event.ticketTypes.find(
                    (item) => item.id === ticket.ticketTypeId,
                  );
                  const statusLabel =
                    ticket.status === "VALID"
                      ? t("common.valid")
                      : ticket.status === "USED"
                        ? t("common.used")
                        : ticket.status === "CANCELLED"
                          ? t("common.cancelled")
                          : t("common.expired");
                  return (
                    <Link
                      key={ticket.id}
                      href={`/tickets/${ticket.id}`}
                      className="group flex flex-col gap-4 rounded-3xl border border-line bg-surface p-4 transition-all hover:-translate-y-0.5 hover:border-brand/30 hover:shadow-soft sm:flex-row"
                    >
                      <div className="relative aspect-[4/3] w-full shrink-0 overflow-hidden rounded-2xl sm:size-32">
                        <Image
                          src={event.coverImage}
                          alt={event.title}
                          fill
                          sizes="(max-width: 640px) 100vw, 128px"
                          className="object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge variant="brand">{ticketType?.name}</Badge>
                          <StatusBadge
                            status={ticket.status}
                            label={statusLabel}
                          />
                        </div>
                        <h2 className="mt-2 font-display text-xl font-semibold leading-tight group-hover:text-brand-strong">
                          {event.title}
                        </h2>
                        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted">
                          <span className="inline-flex items-center gap-1.5">
                            <CalendarDays className="size-3.5" />
                            {formatShortDate(
                              event.startAt,
                              event.timezone,
                              locale,
                            )}{" "}
                            ·{" "}
                            {formatTime(event.startAt, event.timezone, locale)}
                          </span>
                          <span className="inline-flex items-center gap-1.5">
                            <MapPin className="size-3.5" />
                            {venue?.name} · {venue?.city}
                          </span>
                        </div>
                        <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
                          {ticket.seatId ? (
                            <Badge variant="neutral">
                              {getSeatLabel(event, ticket.seatId)}
                            </Badge>
                          ) : null}
                          <span className="text-muted">
                            {t("tickets.ticketCode")}:{" "}
                            <span className="font-semibold text-ink">
                              {ticket.ticketCode}
                            </span>
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center sm:flex-col sm:items-end sm:justify-between">
                        <span className="text-xs font-semibold text-brand-strong">
                          {t("common.viewTicket")} →
                        </span>
                      </div>
                    </Link>
                  );
                })}
              </div>
            ) : (
              <EmptyState
                icon={TicketIcon}
                title={t("tickets.emptyTitle")}
                body={user ? t("tickets.emptyBody") : t("tickets.emptyGuest")}
                action={
                  <Button asChild>
                    <Link href="/events">{t("tickets.browseEvents")}</Link>
                  </Button>
                }
              />
            )}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
