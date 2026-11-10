"use client";

import { Accessibility, ZoomIn, ZoomOut } from "lucide-react";
import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import type { Event, Seat } from "@/domain/types";
import { cn } from "@/lib/cn";
import { formatIDR } from "@/lib/currency";
import { getTicketForSection } from "@/lib/seat";
import { usePreferencesStore } from "@/stores/preferences";

export function SeatMap({
  event,
  sectionId,
  onSectionChange,
  selectedSeatIds,
  onToggleSeat,
  maxSeats,
}: {
  event: Event;
  sectionId: string;
  onSectionChange: (sectionId: string) => void;
  selectedSeatIds: string[];
  onToggleSeat: (seat: Seat) => void;
  maxSeats: number;
}) {
  const t = useTranslations();
  const locale = usePreferencesStore((state) => state.locale);
  const [zoom, setZoom] = useState(1);
  const layout = event.seatLayout;
  const section =
    layout?.sections.find((item) => item.id === sectionId) ??
    layout?.sections[0];
  const ticket = section ? getTicketForSection(event, section) : undefined;

  const rows = useMemo(() => {
    if (!section) return [];
    const map = new Map<string, Seat[]>();
    section.seats.forEach((seat) => {
      const row = map.get(seat.row) ?? [];
      row.push(seat);
      map.set(seat.row, row);
    });
    return [...map.entries()].sort(([a], [b]) => a.localeCompare(b));
  }, [section]);

  if (!layout || !section) return null;

  const selectedInSection = section.seats.filter((seat) =>
    selectedSeatIds.includes(seat.id),
  ).length;

  return (
    <div className="rounded-3xl border border-line bg-surface p-4 sm:p-6">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted">
            {t("event.seatMap")}
          </p>
          <p className="mt-1 font-display text-lg font-semibold">
            {section.name}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="neutral">
            {selectedInSection} {t("cart.seats").toLowerCase()}
          </Badge>
          {ticket ? (
            <Badge variant="brand">{formatIDR(ticket.price, locale)}</Badge>
          ) : null}
          <div className="inline-flex items-center rounded-full border border-line bg-surface p-0.5">
            <button
              type="button"
              onClick={() => setZoom((value) => Math.max(0, value - 1))}
              disabled={zoom === 0}
              className="grid size-7 place-items-center rounded-full text-muted hover:bg-surface-subtle disabled:opacity-30"
              aria-label="Zoom out"
            >
              <ZoomOut className="size-3.5" />
            </button>
            <span className="min-w-8 text-center text-[10px] tabular text-muted">
              {zoom === 0 ? "75%" : zoom === 1 ? "100%" : "125%"}
            </span>
            <button
              type="button"
              onClick={() => setZoom((value) => Math.min(2, value + 1))}
              disabled={zoom === 2}
              className="grid size-7 place-items-center rounded-full text-muted hover:bg-surface-subtle disabled:opacity-30"
              aria-label="Zoom in"
            >
              <ZoomIn className="size-3.5" />
            </button>
          </div>
        </div>
      </div>

      <div className="mb-5 flex gap-1.5 overflow-x-auto pb-1 no-scrollbar">
        {layout.sections.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => onSectionChange(item.id)}
            className={cn(
              "shrink-0 rounded-full border px-3.5 py-2 text-xs font-medium transition-colors",
              item.id === section.id
                ? "border-ink bg-ink text-canvas"
                : "border-line bg-surface text-muted hover:border-ink/20 hover:text-ink",
            )}
          >
            {item.name}
            <span className="ml-1 text-[10px] opacity-60">
              {item.seats.filter((seat) => seat.status === "AVAILABLE").length}
            </span>
          </button>
        ))}
      </div>

      <div className="rounded-2xl bg-surface-subtle/70 p-3 sm:p-4">
        <div className="mx-auto mb-6 h-8 w-4/5 rounded-[50%] border border-brand/30 bg-gradient-to-b from-brand/20 to-transparent text-center text-[9px] font-semibold uppercase tracking-[0.3em] leading-8 text-brand-strong">
          Stage
        </div>

        <div className="overflow-x-auto pb-2 no-scrollbar">
          <div className="mx-auto w-max min-w-full space-y-1.5">
            {rows.map(([row, seats]) => (
              <div key={row} className="flex items-center gap-1.5">
                <span className="w-5 shrink-0 text-center text-[10px] font-semibold text-muted">
                  {row}
                </span>
                {seats.map((seat) => {
                  const selected = selectedSeatIds.includes(seat.id);
                  const isSold = seat.status === "SOLD";
                  const isBlocked = seat.status === "BLOCKED";
                  const disabled =
                    isSold ||
                    isBlocked ||
                    (!selected && selectedSeatIds.length >= maxSeats);
                  return (
                    <button
                      key={seat.id}
                      type="button"
                      disabled={disabled}
                      onClick={() => onToggleSeat(seat)}
                      aria-label={`${section.name}, row ${seat.row}, seat ${seat.number}${seat.accessible ? ", accessible" : ""}${selected ? ", selected" : isSold ? ", sold" : isBlocked ? ", unavailable" : ""}`}
                      aria-pressed={selected}
                      title={`${seat.row}${seat.number}${seat.accessible ? " · Accessible" : ""}`}
                      className={cn(
                        "relative grid shrink-0 place-items-center rounded-[7px] border font-semibold transition-all duration-150",
                        zoom === 0
                          ? "size-6 text-[8px] sm:size-7"
                          : zoom === 2
                            ? "size-8 text-[10px] sm:size-9"
                            : "size-7 text-[9px] sm:size-8",
                        selected
                          ? "border-brand bg-brand text-on-brand shadow-[0_4px_14px_-6px_rgba(115,87,246,0.9)]"
                          : isSold
                            ? "cursor-not-allowed border-transparent bg-surface-subtle text-muted/35"
                            : isBlocked
                              ? "cursor-not-allowed border-transparent bg-[repeating-linear-gradient(135deg,var(--line)_0,var(--line)_2px,transparent_2px,transparent_4px)] text-muted/30"
                              : "border-line bg-surface text-muted hover:border-brand hover:bg-brand-soft hover:text-brand-strong",
                        seat.accessible &&
                          !selected &&
                          !isSold &&
                          "border-dashed border-info/50",
                        disabled && !selected && "cursor-not-allowed",
                      )}
                    >
                      {seat.accessible ? (
                        <Accessibility className="size-3" />
                      ) : (
                        seat.number
                      )}
                    </button>
                  );
                })}
                <span className="w-5 shrink-0 text-center text-[10px] font-semibold text-muted">
                  {row}
                </span>
              </div>
            ))}
          </div>
        </div>
        <p className="mt-2 text-center text-[10px] text-muted sm:hidden">
          Geser ke samping untuk melihat semua kursi.
        </p>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-[11px] text-muted">
        <span className="inline-flex items-center gap-1.5">
          <span className="size-3 rounded-[4px] border border-line bg-surface" />
          {t("common.available")}
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="size-3 rounded-[4px] bg-brand" />
          {t("cart.seats")}
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="size-3 rounded-[4px] bg-surface-subtle" />
          {t("common.soldOut")}
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="size-3 rounded-[4px] bg-[repeating-linear-gradient(135deg,var(--line)_0,var(--line)_2px,transparent_2px,transparent_4px)]" />
          Blocked
        </span>
        <span className="inline-flex items-center gap-1.5">
          <Accessibility className="size-3.5" />
          Accessible
        </span>
      </div>

      <details className="mt-4 rounded-2xl border border-line bg-canvas p-3">
        <summary className="cursor-pointer text-xs font-semibold text-ink">
          {t("common.list")} · {t("event.seatMap")}
        </summary>
        <div className="mt-3 grid grid-cols-4 gap-1.5 sm:grid-cols-6">
          {section.seats
            .filter((seat) => seat.status === "AVAILABLE")
            .map((seat) => {
              const selected = selectedSeatIds.includes(seat.id);
              return (
                <button
                  key={seat.id}
                  type="button"
                  onClick={() => onToggleSeat(seat)}
                  aria-pressed={selected}
                  disabled={!selected && selectedSeatIds.length >= maxSeats}
                  className={cn(
                    "rounded-lg border px-1.5 py-2 text-[10px] font-medium transition-colors",
                    selected
                      ? "border-brand bg-brand text-on-brand"
                      : "border-line bg-surface text-muted hover:border-brand/40 hover:text-ink",
                  )}
                >
                  {seat.row}
                  {seat.number}
                  {seat.accessible ? " ♿" : ""}
                </button>
              );
            })}
        </div>
      </details>
    </div>
  );
}
