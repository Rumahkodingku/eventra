"use client";

import { ClipboardCheck, Search, Users } from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader } from "@/components/ui/dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { Input, Select } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableWrap,
  TBody,
  TD,
  TH,
  THead,
  TR,
} from "@/components/ui/table";
import { useHydrated } from "@/hooks/use-hydrated";
import { formatDateTime } from "@/lib/dates";
import { getSeatLabel } from "@/lib/seat";
import { useEventStore } from "@/stores/events";
import { useOrderStore } from "@/stores/orders";
import { usePreferencesStore } from "@/stores/preferences";

export default function OrganizerAttendeesPage() {
  const t = useTranslations();
  const hydrated = useHydrated();
  const locale = usePreferencesStore((state) => state.locale);
  const attendees = useOrderStore((state) => state.attendees);
  const tickets = useOrderStore((state) => state.tickets);
  const orders = useOrderStore((state) => state.orders);
  const events = useEventStore((state) => state.events);
  const [search, setSearch] = useState("");
  const [eventId, setEventId] = useState("ALL");
  const [selectedAttendeeId, setSelectedAttendeeId] = useState<string | null>(
    null,
  );

  const rows = useMemo(
    () =>
      attendees
        .map((attendee) => {
          const ticket = tickets.find((item) => item.id === attendee.ticketId);
          const order = orders.find((item) => item.id === attendee.orderId);
          const event = ticket
            ? events.find((item) => item.id === ticket.eventId)
            : undefined;
          return { attendee, ticket, order, event };
        })
        .filter((row) => row.ticket && row.order && row.event)
        .filter((row) => {
          if (eventId !== "ALL" && row.event?.id !== eventId) return false;
          const query = search.trim().toLowerCase();
          if (!query) return true;
          return (
            (row.attendee.fullName.toLowerCase().includes(query) ||
              row.attendee.email.toLowerCase().includes(query) ||
              row.ticket?.ticketCode.toLowerCase().includes(query)) ??
            false
          );
        }),
    [attendees, tickets, orders, events, search, eventId],
  );

  if (!hydrated) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-20" />
        <Skeleton className="h-96" />
      </div>
    );
  }

  const checkedIn = rows.filter(
    (row) => row.attendee.checkInStatus === "CHECKED_IN",
  ).length;
  const selected = rows.find((row) => row.attendee.id === selectedAttendeeId);

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-strong">
            {t("organizer.attendees")}
          </p>
          <h1 className="mt-2 font-display text-3xl font-semibold sm:text-4xl">
            {t("organizer.attendeesTitle")}
          </h1>
          <p className="mt-2 text-sm text-muted">
            {rows.length} attendee · {checkedIn}{" "}
            {t("tickets.checkedIn").toLowerCase()}
          </p>
        </div>
        <Button asChild>
          <Link href="/organizer/check-in">
            <ClipboardCheck className="size-4" /> {t("organizer.checkIn")}
          </Link>
        </Button>
      </div>

      <div className="flex flex-col gap-2 rounded-2xl border border-line bg-surface p-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted" />
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder={t("common.search")}
            className="pl-10"
            aria-label={t("common.search")}
          />
        </div>
        <Select
          value={eventId}
          onChange={(event) => setEventId(event.target.value)}
          className="sm:w-64"
          aria-label={t("nav.events")}
        >
          <option value="ALL">{t("common.all")}</option>
          {events
            .filter((event) => event.status !== "DRAFT")
            .map((event) => (
              <option key={event.id} value={event.id}>
                {event.title}
              </option>
            ))}
        </Select>
      </div>

      {rows.length ? (
        <TableWrap>
          <Table>
            <THead>
              <TR>
                <TH>{t("organizer.attendeeName")}</TH>
                <TH>Event</TH>
                <TH>{t("tickets.ticketCode")}</TH>
                <TH>{t("organizer.checkInStatus")}</TH>
                <TH>{t("organizer.checkedInAt")}</TH>
                <TH>{t("common.actions")}</TH>
              </TR>
            </THead>
            <TBody>
              {rows.map(({ attendee, ticket, event }) => (
                <TR key={attendee.id}>
                  <TD>
                    <span className="font-semibold">{attendee.fullName}</span>
                    <span className="mt-0.5 block text-[11px] text-muted">
                      {attendee.email}
                    </span>
                  </TD>
                  <TD className="max-w-[260px] truncate text-xs">
                    {event?.title}
                  </TD>
                  <TD className="font-semibold tabular">
                    {ticket?.ticketCode}
                  </TD>
                  <TD>
                    <Badge
                      variant={
                        attendee.checkInStatus === "CHECKED_IN"
                          ? "success"
                          : "neutral"
                      }
                    >
                      {attendee.checkInStatus === "CHECKED_IN"
                        ? t("tickets.checkedIn")
                        : t("tickets.notCheckedIn")}
                    </Badge>
                  </TD>
                  <TD className="text-xs text-muted">
                    {attendee.checkedInAt
                      ? formatDateTime(
                          attendee.checkedInAt,
                          "Asia/Jakarta",
                          locale,
                        )
                      : "—"}
                  </TD>
                  <TD>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedAttendeeId(attendee.id)}
                    >
                      {t("common.details")}
                    </Button>
                  </TD>
                </TR>
              ))}
            </TBody>
          </Table>
        </TableWrap>
      ) : (
        <EmptyState
          icon={Users}
          title={t("events.noResultsTitle")}
          body={t("events.noResultsBody")}
        />
      )}

      <Dialog
        open={Boolean(selected)}
        onOpenChange={(open) => !open && setSelectedAttendeeId(null)}
      >
        <DialogContent>
          {selected ? (
            <>
              <DialogHeader
                title={selected.attendee.fullName}
                description={selected.attendee.email}
              />
              <dl className="space-y-3 text-sm">
                <div className="flex justify-between gap-4">
                  <dt className="text-muted">{t("nav.events")}</dt>
                  <dd className="text-right font-medium">
                    {selected.event?.title}
                  </dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-muted">{t("tickets.ticketCode")}</dt>
                  <dd className="text-right font-semibold tabular">
                    {selected.ticket?.ticketCode}
                  </dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-muted">{t("tickets.seat")}</dt>
                  <dd className="text-right font-medium">
                    {selected.ticket?.seatId && selected.event
                      ? getSeatLabel(selected.event, selected.ticket.seatId)
                      : "General admission"}
                  </dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-muted">{t("tickets.order")}</dt>
                  <dd className="text-right font-medium tabular">
                    {selected.order?.orderNumber}
                  </dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-muted">{t("organizer.checkInStatus")}</dt>
                  <dd className="text-right">
                    <Badge
                      variant={
                        selected.attendee.checkInStatus === "CHECKED_IN"
                          ? "success"
                          : "neutral"
                      }
                    >
                      {selected.attendee.checkInStatus === "CHECKED_IN"
                        ? t("tickets.checkedIn")
                        : t("tickets.notCheckedIn")}
                    </Badge>
                  </dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-muted">{t("organizer.checkedInAt")}</dt>
                  <dd className="text-right text-xs">
                    {selected.attendee.checkedInAt
                      ? formatDateTime(
                          selected.attendee.checkedInAt,
                          "Asia/Jakarta",
                          locale,
                        )
                      : "—"}
                  </dd>
                </div>
              </dl>
            </>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
