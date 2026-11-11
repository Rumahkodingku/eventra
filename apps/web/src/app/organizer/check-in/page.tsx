"use client";

import {
  CheckCircle2,
  ClipboardCheck,
  Search,
  TriangleAlert,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useHydrated } from "@/hooks/use-hydrated";
import { formatDateTime } from "@/lib/dates";
import { getSeatLabel } from "@/lib/seat";
import { useCatalog } from "@/services/hooks/use-catalog";
import { useEventStore } from "@/services/hooks/use-event-store";
import { useOrderStore } from "@/services/hooks/use-order-store";
import { usePreferencesStore } from "@/stores/preferences";

export default function OrganizerCheckInPage() {
  const t = useTranslations();
  const { venues } = useCatalog();
  const hydrated = useHydrated();
  const locale = usePreferencesStore((state) => state.locale);
  const tickets = useOrderStore((state) => state.tickets);
  const attendees = useOrderStore((state) => state.attendees);
  const _orders = useOrderStore((state) => state.orders);
  const checkInTicket = useOrderStore((state) => state.checkInTicket);
  const events = useEventStore((state) => state.events);
  const [code, setCode] = useState("");
  const [foundId, setFoundId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const found = foundId
    ? tickets.find((ticket) => ticket.id === foundId)
    : undefined;
  const foundEvent = found
    ? events.find((event) => event.id === found.eventId)
    : undefined;
  const foundAttendee = found
    ? attendees.find((attendee) => attendee.id === found.attendeeId)
    : undefined;
  const foundVenue = foundEvent
    ? venues.find((venue) => venue.id === foundEvent.venueId)
    : undefined;
  const recent = tickets
    .filter((ticket) => ticket.status === "USED" && ticket.checkedInAt)
    .sort(
      (a, b) =>
        new Date(b.checkedInAt ?? 0).getTime() -
        new Date(a.checkedInAt ?? 0).getTime(),
    )
    .slice(0, 6);

  const search = () => {
    const normalized = code.trim().toUpperCase();
    if (!normalized) return;
    const ticket = tickets.find(
      (item) => item.ticketCode.toUpperCase() === normalized,
    );
    setMessage(null);
    if (!ticket) {
      setFoundId(null);
      setError(t("organizer.ticketNotFound"));
      return;
    }
    setFoundId(ticket.id);
    setError(ticket.status === "USED" ? t("organizer.alreadyUsed") : null);
  };

  const confirm = () => {
    if (!found) return;
    const result = checkInTicket(found.id);
    if (!result.ok) {
      setError(
        result.reason === "already_used"
          ? t("organizer.alreadyUsed")
          : t("organizer.ticketNotFound"),
      );
      return;
    }
    setError(null);
    setMessage(t("organizer.checkInSuccess"));
    toast.success(t("organizer.checkInSuccess"));
  };

  if (!hydrated) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-20" />
        <Skeleton className="h-64" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-strong">
          {t("organizer.checkIn")}
        </p>
        <h1 className="mt-2 font-display text-3xl font-semibold sm:text-4xl">
          {t("organizer.checkInTitle")}
        </h1>
        <p className="mt-2 text-sm text-muted">{t("common.demoNotice")}</p>
      </div>

      <div className="grid gap-5 xl:grid-cols-[1fr_1fr]">
        <section className="rounded-3xl border border-line bg-surface p-5 sm:p-6">
          <form
            className="flex flex-col gap-2 sm:flex-row"
            onSubmit={(event) => {
              event.preventDefault();
              search();
            }}
          >
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted" />
              <Input
                value={code}
                onChange={(event) => setCode(event.target.value.toUpperCase())}
                placeholder={t("organizer.checkInPlaceholder")}
                className="pl-10 font-mono tabular"
                aria-label={t("organizer.checkInPlaceholder")}
              />
            </div>
            <Button type="submit">{t("organizer.checkInButton")}</Button>
          </form>

          {error ? (
            <div className="mt-4 flex items-start gap-2 rounded-2xl border border-danger/20 bg-danger/10 p-3 text-sm text-danger">
              <TriangleAlert className="mt-0.5 size-4 shrink-0" />
              {error}
            </div>
          ) : null}
          {message ? (
            <div className="mt-4 flex items-start gap-2 rounded-2xl border border-success/20 bg-success/10 p-3 text-sm text-success">
              <CheckCircle2 className="mt-0.5 size-4 shrink-0" />
              {message}
            </div>
          ) : null}

          {found && foundEvent ? (
            <div className="mt-5 rounded-2xl border border-line bg-canvas p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs text-muted">
                    {t("tickets.ticketCode")}
                  </p>
                  <p className="mt-0.5 font-display text-xl font-semibold tabular">
                    {found.ticketCode}
                  </p>
                </div>
                <Badge variant={found.status === "USED" ? "info" : "success"}>
                  {found.status === "USED"
                    ? t("common.used")
                    : t("common.valid")}
                </Badge>
              </div>
              <div className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
                <div>
                  <p className="text-xs text-muted">Event</p>
                  <p className="mt-0.5 font-medium">{foundEvent.title}</p>
                </div>
                <div>
                  <p className="text-xs text-muted">{t("tickets.attendee")}</p>
                  <p className="mt-0.5 font-medium">
                    {foundAttendee?.fullName}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted">{t("tickets.seat")}</p>
                  <p className="mt-0.5 font-medium">
                    {found.seatId
                      ? getSeatLabel(foundEvent, found.seatId)
                      : "General admission"}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted">Venue</p>
                  <p className="mt-0.5 font-medium">{foundVenue?.name}</p>
                </div>
              </div>
              <Button
                className="mt-4 w-full"
                variant={found.status === "USED" ? "outline" : "primary"}
                disabled={found.status === "USED"}
                onClick={confirm}
              >
                <ClipboardCheck className="size-4" />{" "}
                {found.status === "USED"
                  ? t("organizer.alreadyUsed")
                  : t("organizer.checkIn")}
              </Button>
            </div>
          ) : null}
        </section>

        <section>
          <h2 className="mb-3 font-display text-xl font-semibold">
            {t("organizer.checkIn")}
          </h2>
          {recent.length ? (
            <div className="space-y-2">
              {recent.map((ticket) => {
                const event = events.find((item) => item.id === ticket.eventId);
                const attendee = attendees.find(
                  (item) => item.id === ticket.attendeeId,
                );
                return (
                  <div
                    key={ticket.id}
                    className="flex items-center gap-3 rounded-2xl border border-line bg-surface p-3"
                  >
                    <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-success/10 text-success">
                      <CheckCircle2 className="size-4" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold">
                        {attendee?.fullName}
                      </p>
                      <p className="truncate text-[11px] text-muted">
                        {event?.title} · {ticket.ticketCode}
                      </p>
                    </div>
                    <span className="shrink-0 text-[10px] text-muted">
                      {ticket.checkedInAt
                        ? formatDateTime(
                            ticket.checkedInAt,
                            "Asia/Jakarta",
                            locale,
                          )
                        : ""}
                    </span>
                  </div>
                );
              })}
            </div>
          ) : (
            <EmptyState
              icon={ClipboardCheck}
              title={t("account.noNotifications")}
              body={t("organizer.checkInPlaceholder")}
            />
          )}
        </section>
      </div>
    </div>
  );
}
