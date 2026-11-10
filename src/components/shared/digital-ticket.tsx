"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import QRCode from "react-qr-code";
import { StatusBadge } from "@/components/ui/status-badge";
import type {
  Attendee,
  Event,
  Ticket,
  TicketType,
  Venue,
} from "@/domain/types";
import { cn } from "@/lib/cn";
import { formatEventDate, formatTime } from "@/lib/dates";
import { getSeatLabel } from "@/lib/seat";
import { usePreferencesStore } from "@/stores/preferences";

export function DigitalTicket({
  ticket,
  event,
  ticketType,
  attendee,
  venue,
  orderNumber,
  dark = false,
  compact = false,
  showLink = true,
}: {
  ticket: Ticket;
  event: Event;
  ticketType?: TicketType;
  attendee?: Attendee;
  venue?: Venue;
  orderNumber?: string;
  dark?: boolean;
  compact?: boolean;
  showLink?: boolean;
}) {
  const t = useTranslations();
  const locale = usePreferencesStore((state) => state.locale);
  const statusLabel =
    ticket.status === "VALID"
      ? t("common.valid")
      : ticket.status === "USED"
        ? t("common.used")
        : ticket.status === "CANCELLED"
          ? t("common.cancelled")
          : t("common.expired");
  return (
    <article
      className={cn(
        "print-ticket overflow-hidden rounded-3xl border",
        dark
          ? "border-white/10 bg-midnight text-paper"
          : "border-line bg-surface text-ink",
        compact ? "p-4" : "p-5 sm:p-6",
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p
            className={cn(
              "text-[10px] font-semibold uppercase tracking-[0.18em]",
              dark ? "text-lime" : "text-brand-strong",
            )}
          >
            {event.subcategory}
          </p>
          <h3
            className={cn(
              "mt-1.5 font-display font-semibold leading-tight",
              compact ? "text-lg" : "text-2xl",
            )}
          >
            {event.title}
          </h3>
          <p
            className={cn(
              "mt-1.5 text-xs",
              dark ? "text-paper/55" : "text-muted",
            )}
          >
            {formatEventDate(event.startAt, event.timezone, locale)} ·{" "}
            {formatTime(event.startAt, event.timezone, locale)} · {venue?.city}
          </p>
        </div>
        <StatusBadge status={ticket.status} label={statusLabel} />
      </div>

      <div
        className={cn(
          "my-5 border-t border-dashed",
          dark ? "border-white/15" : "border-line",
        )}
      />

      <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div className="grid grid-cols-2 gap-x-5 gap-y-3 text-xs">
          <div>
            <p
              className={cn(
                "text-[10px] uppercase tracking-[0.14em]",
                dark ? "text-paper/60" : "text-muted",
              )}
            >
              {t("tickets.attendee")}
            </p>
            <p className="mt-1 font-semibold">{attendee?.fullName ?? "—"}</p>
          </div>
          <div>
            <p
              className={cn(
                "text-[10px] uppercase tracking-[0.14em]",
                dark ? "text-paper/60" : "text-muted",
              )}
            >
              {t("tickets.seat")}
            </p>
            <p className="mt-1 font-semibold">
              {ticket.seatId
                ? getSeatLabel(event, ticket.seatId)
                : (ticketType?.name ?? "General admission")}
            </p>
          </div>
          <div>
            <p
              className={cn(
                "text-[10px] uppercase tracking-[0.14em]",
                dark ? "text-paper/60" : "text-muted",
              )}
            >
              {t("tickets.order")}
            </p>
            <p className="mt-1 font-semibold">
              {orderNumber ?? ticket.orderId}
            </p>
          </div>
          <div>
            <p
              className={cn(
                "text-[10px] uppercase tracking-[0.14em]",
                dark ? "text-paper/60" : "text-muted",
              )}
            >
              {t("tickets.ticketCode")}
            </p>
            <p className="mt-1 font-semibold tabular">{ticket.ticketCode}</p>
          </div>
        </div>

        <div className="shrink-0">
          <div className="rounded-2xl bg-white p-2.5">
            <QRCode
              value={ticket.ticketCode}
              size={compact ? 96 : 128}
              fgColor="#111318"
              bgColor="#FFFFFF"
            />
          </div>
          <p
            className={cn(
              "mt-2 max-w-36 text-center text-[9px] leading-relaxed",
              dark ? "text-paper/55" : "text-muted",
            )}
          >
            {t("tickets.qrNote")}
          </p>
        </div>
      </div>

      {!compact ? (
        <div
          className={cn(
            "mt-5 flex flex-wrap items-center justify-between gap-2 border-t pt-4 text-[11px]",
            dark ? "border-white/10 text-paper/60" : "border-line text-muted",
          )}
        >
          <span>{venue?.name}</span>
          {showLink ? (
            <Link
              href={`/tickets/${ticket.id}`}
              className={cn(
                "font-semibold",
                dark ? "text-lime" : "text-brand-strong",
              )}
            >
              {t("common.viewTicket")}
            </Link>
          ) : null}
        </div>
      ) : null}
    </article>
  );
}
