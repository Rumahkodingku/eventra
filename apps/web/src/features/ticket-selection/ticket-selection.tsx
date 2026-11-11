"use client";

import {
  ArrowLeft,
  ArrowRight,
  Check,
  Clock3,
  MapPin,
  ShieldCheck,
  Ticket,
  X,
} from "lucide-react";
import { motion } from "motion/react";
import Image from "next/image";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { SeatMap } from "@/components/shared/seat-map";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DemoNotice } from "@/components/ui/demo-notice";
import { EmptyState } from "@/components/ui/empty-state";
import { QuantityStepper } from "@/components/ui/quantity-stepper";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { Event, Seat, TicketType } from "@/domain/types";
import { cn } from "@/lib/cn";
import { formatIDR } from "@/lib/currency";
import { formatEventDate, formatTime, getTimezoneLabel } from "@/lib/dates";
import { getTicketAvailability, isEventPurchasable } from "@/lib/pricing";
import { getTicketForSection } from "@/lib/seat";
import { useCartStore } from "@/services/hooks/use-cart-store";
import { useCatalog } from "@/services/hooks/use-catalog";
import { useEventStore } from "@/services/hooks/use-event-store";
import { usePreferencesStore } from "@/stores/preferences";

export function TicketSelection() {
  const t = useTranslations();
  const { venues } = useCatalog();
  const params = useParams<{ slug: string }>();
  const _router = useRouter();
  const events = useEventStore((state) => state.events);
  const addItem = useCartStore((state) => state.addItem);
  const locale = usePreferencesStore((state) => state.locale);
  const event = events.find((item) => item.slug === params.slug);
  const [selectedSeatIds, setSelectedSeatIds] = useState<string[]>([]);
  const [sectionId, setSectionId] = useState(
    event?.seatLayout?.sections[0]?.id ?? "",
  );
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [tab, setTab] = useState(
    event?.ticketingMode === "RESERVED_SEATING" ? "seated" : "ga",
  );
  const [holdSeconds, setHoldSeconds] = useState(600);

  useEffect(() => {
    const timer = window.setInterval(
      () => setHoldSeconds((seconds) => Math.max(0, seconds - 1)),
      1000,
    );
    return () => window.clearInterval(timer);
  }, []);

  const gaTickets = useMemo(
    () =>
      event?.ticketTypes.filter(
        (ticket) => ticket.kind === "GENERAL_ADMISSION",
      ) ?? [],
    [event],
  );
  const section = event?.seatLayout?.sections.find(
    (item) => item.id === sectionId,
  );
  const seatedTicket =
    event && section ? getTicketForSection(event, section) : undefined;
  const selectedSeats = selectedSeatIds
    .map((seatId) =>
      event?.seatLayout?.sections
        .flatMap((s) => s.seats)
        .find((seat) => seat.id === seatId),
    )
    .filter((seat): seat is Seat => Boolean(seat));
  const seatTotal = selectedSeats.length * (seatedTicket?.price ?? 0);
  const purchasable = event
    ? isEventPurchasable(event)
    : { purchasable: false };

  if (!event) {
    return (
      <div className="container-page section-space">
        <EmptyState
          icon={Ticket}
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

  const venue = venues.find((item) => item.id === event.venueId);
  const maxSeats = seatedTicket?.maxPerOrder ?? 4;

  const toggleSeat = (seat: Seat) => {
    setSelectedSeatIds((current) => {
      if (current.includes(seat.id))
        return current.filter((id) => id !== seat.id);
      if (current.length >= maxSeats) {
        toast.error(`Maksimal ${maxSeats} kursi per transaksi.`);
        return current;
      }
      return [...current, seat.id];
    });
  };

  const addGa = (ticket: TicketType) => {
    const quantity = quantities[ticket.id] ?? 1;
    const availability = getTicketAvailability(ticket);
    if (!availability.available) {
      toast.error(t("errors.salesClosed"));
      return;
    }
    if (quantity < 1) {
      toast.error(t("errors.required"));
      return;
    }
    addItem({
      ownerKey: "local",
      eventId: event.id,
      ticketTypeId: ticket.id,
      quantity,
      seatIds: [],
      unitPriceSnapshot: ticket.price,
    });
    toast.success(`${ticket.name} ditambahkan ke keranjang.`);
    setQuantities((current) => ({ ...current, [ticket.id]: 1 }));
  };

  const addSeats = () => {
    if (!seatedTicket || !selectedSeatIds.length) {
      toast.error(t("errors.required"));
      return;
    }
    addItem({
      ownerKey: "local",
      eventId: event.id,
      ticketTypeId: seatedTicket.id,
      quantity: selectedSeatIds.length,
      seatIds: selectedSeatIds,
      unitPriceSnapshot: seatedTicket.price,
    });
    toast.success(
      `${selectedSeatIds.length} ${t("cart.seats").toLowerCase()} ditambahkan.`,
    );
    setSelectedSeatIds([]);
  };

  return (
    <div className="container-page section-space">
      <Link
        href={`/events/${event.slug}`}
        className="inline-flex items-center gap-2 text-xs font-semibold text-muted transition-colors hover:text-ink"
      >
        <ArrowLeft className="size-3.5" /> {t("common.back")}
      </Link>

      <div className="mt-6 grid gap-8 lg:grid-cols-[1fr_360px]">
        <div className="min-w-0">
          <div className="flex flex-col gap-5 rounded-3xl border border-line bg-surface p-4 sm:flex-row sm:items-center sm:p-5">
            <div className="relative aspect-[4/3] w-full shrink-0 overflow-hidden rounded-2xl sm:size-28">
              <Image
                src={event.coverImage}
                alt={event.title}
                fill
                sizes="(max-width: 640px) 100vw, 112px"
                className="object-cover"
              />
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap gap-2">
                <Badge variant="brand">{event.subcategory}</Badge>
                <Badge variant="neutral">
                  {event.ticketingMode === "GENERAL_ADMISSION"
                    ? t("event.modeGeneral")
                    : event.ticketingMode === "RESERVED_SEATING"
                      ? t("event.modeReserved")
                      : t("event.modeHybrid")}
                </Badge>
              </div>
              <h1 className="mt-3 font-display text-2xl font-semibold leading-tight sm:text-3xl">
                {event.title}
              </h1>
              <p className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted">
                <span className="inline-flex items-center gap-1.5">
                  <Clock3 className="size-3.5" />
                  {formatEventDate(event.startAt, event.timezone, locale)} ·{" "}
                  {formatTime(event.startAt, event.timezone, locale)}{" "}
                  {getTimezoneLabel(event.timezone)}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <MapPin className="size-3.5" />
                  {venue?.name}
                </span>
              </p>
            </div>
          </div>

          {!purchasable.purchasable ? (
            <div className="mt-5 rounded-2xl border border-warning/20 bg-warning/10 px-4 py-3 text-sm text-warning-text">
              {event.status === "PAUSED"
                ? t("event.paused")
                : event.status === "CANCELLED"
                  ? t("event.cancelled")
                  : t("event.soldOut")}
            </div>
          ) : null}

          <div className="mt-6">
            {event.ticketingMode === "HYBRID" ? (
              <Tabs value={tab} onValueChange={setTab}>
                <TabsList>
                  <TabsTrigger value="ga">{t("event.modeGeneral")}</TabsTrigger>
                  <TabsTrigger value="seated">
                    {t("event.modeReserved")}
                  </TabsTrigger>
                </TabsList>
                <TabsContent value="ga">
                  <GaTickets
                    tickets={gaTickets}
                    quantities={quantities}
                    setQuantities={setQuantities}
                    onAdd={addGa}
                    disabled={!purchasable.purchasable}
                  />
                </TabsContent>
                <TabsContent value="seated">
                  <div className="space-y-4">
                    <SeatMap
                      event={event}
                      sectionId={sectionId}
                      onSectionChange={(id) => {
                        setSectionId(id);
                        setSelectedSeatIds([]);
                      }}
                      selectedSeatIds={selectedSeatIds}
                      onToggleSeat={toggleSeat}
                      maxSeats={maxSeats}
                    />
                    <SeatSummary
                      event={event}
                      sectionId={sectionId}
                      selectedSeats={selectedSeats}
                      seatedTicket={seatedTicket}
                      total={seatTotal}
                      onRemove={(seatId) =>
                        setSelectedSeatIds((current) =>
                          current.filter((id) => id !== seatId),
                        )
                      }
                      onAdd={addSeats}
                      disabled={!purchasable.purchasable}
                    />
                  </div>
                </TabsContent>
              </Tabs>
            ) : event.ticketingMode === "RESERVED_SEATING" ? (
              <div className="space-y-4">
                <SeatMap
                  event={event}
                  sectionId={sectionId}
                  onSectionChange={(id) => {
                    setSectionId(id);
                    setSelectedSeatIds([]);
                  }}
                  selectedSeatIds={selectedSeatIds}
                  onToggleSeat={toggleSeat}
                  maxSeats={maxSeats}
                />
                <SeatSummary
                  event={event}
                  sectionId={sectionId}
                  selectedSeats={selectedSeats}
                  seatedTicket={seatedTicket}
                  total={seatTotal}
                  onRemove={(seatId) =>
                    setSelectedSeatIds((current) =>
                      current.filter((id) => id !== seatId),
                    )
                  }
                  onAdd={addSeats}
                  disabled={!purchasable.purchasable}
                />
              </div>
            ) : (
              <GaTickets
                tickets={gaTickets}
                quantities={quantities}
                setQuantities={setQuantities}
                onAdd={addGa}
                disabled={!purchasable.purchasable}
              />
            )}
          </div>
        </div>

        <aside className="min-w-0">
          <div className="sticky top-24 space-y-4">
            <div className="rounded-3xl border border-line bg-surface p-5 shadow-soft">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted">
                {t("event.bookingSummary")}
              </p>
              <div className="mt-4 flex items-baseline justify-between gap-3">
                <span className="text-sm text-muted">{t("cart.subtotal")}</span>
                <motion.span
                  key={`${seatTotal}-${tab}-${Object.values(quantities).join("-")}`}
                  initial={{ opacity: 0.55, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.18, ease: [0.23, 1, 0.32, 1] }}
                  aria-live="polite"
                  className="font-display text-2xl font-semibold tabular"
                >
                  {formatIDR(
                    event.ticketingMode === "RESERVED_SEATING" ||
                      (event.ticketingMode === "HYBRID" && tab === "seated")
                      ? seatTotal
                      : gaTickets.reduce(
                          (total, ticket) =>
                            total + ticket.price * (quantities[ticket.id] ?? 1),
                          0,
                        ),
                    locale,
                  )}
                </motion.span>
              </div>
              <p className="mt-2 text-xs leading-relaxed text-muted">
                {t("cart.feeNote")}
              </p>
              <div className="mt-4 flex items-center justify-between rounded-xl border border-warning/20 bg-warning/10 px-3 py-2 text-[11px] text-warning-text">
                <span>Simulasi hold kursi</span>
                <span className="font-semibold tabular">
                  {String(Math.floor(holdSeconds / 60)).padStart(2, "0")}:
                  {String(holdSeconds % 60).padStart(2, "0")}
                </span>
              </div>
              <Button
                asChild
                className="mt-4 w-full"
                size="lg"
                variant="outline"
              >
                <Link href="/cart">
                  {t("nav.cart")} <ArrowRight className="size-4" />
                </Link>
              </Button>
              <DemoNotice className="mt-4">{t("common.demoNotice")}</DemoNotice>
            </div>
            <div className="rounded-2xl border border-line bg-surface-subtle/50 p-4 text-xs leading-relaxed text-muted">
              <p className="flex items-center gap-2 font-semibold text-ink">
                <ShieldCheck className="size-4 text-brand-strong" />{" "}
                {t("common.simulationNotice")}
              </p>
              <p className="mt-2">
                Ketersediaan kursi adalah ilustrasi lokal dan dapat berubah saat
                halaman dimuat ulang.
              </p>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

function GaTickets({
  tickets,
  quantities,
  setQuantities,
  onAdd,
  disabled,
}: {
  tickets: TicketType[];
  quantities: Record<string, number>;
  setQuantities: React.Dispatch<React.SetStateAction<Record<string, number>>>;
  onAdd: (ticket: TicketType) => void;
  disabled: boolean;
}) {
  const t = useTranslations();
  const locale = usePreferencesStore((state) => state.locale);
  return (
    <div className="space-y-3">
      {tickets.map((ticket) => {
        const availability = getTicketAvailability(ticket);
        const quantity = quantities[ticket.id] ?? 1;
        return (
          <div
            key={ticket.id}
            className={cn(
              "rounded-2xl border border-line bg-surface p-4 sm:p-5",
              !availability.available && "opacity-60",
            )}
          >
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="font-display text-lg font-semibold">
                    {ticket.name}
                  </h2>
                  {!availability.available ? (
                    <Badge variant="danger">{t("common.soldOut")}</Badge>
                  ) : null}
                  {availability.available && availability.remaining < 20 ? (
                    <Badge variant="warning">{t("common.limited")}</Badge>
                  ) : null}
                </div>
                <p className="mt-1 text-sm text-muted">{ticket.description}</p>
                <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-muted">
                  {ticket.benefits.map((benefit) => (
                    <li
                      key={benefit}
                      className="inline-flex items-center gap-1.5"
                    >
                      <Check className="size-3 text-success" />
                      {benefit}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="flex shrink-0 items-center justify-between gap-4 sm:flex-col sm:items-end">
                <p className="font-display text-xl font-semibold tabular">
                  {formatIDR(ticket.price, locale)}
                </p>
                <QuantityStepper
                  value={quantity}
                  min={ticket.minPerOrder}
                  max={Math.min(
                    ticket.maxPerOrder,
                    availability.remaining || 1,
                  )}
                  onChange={(value) =>
                    setQuantities((current) => ({
                      ...current,
                      [ticket.id]: value,
                    }))
                  }
                  disabled={!availability.available || disabled}
                  label={`${ticket.name} quantity`}
                  size="sm"
                />
              </div>
            </div>
            <Button
              className="mt-4 w-full sm:w-auto"
              variant="outline"
              disabled={!availability.available || disabled}
              onClick={() => onAdd(ticket)}
            >
              <Ticket className="size-4" /> {t("common.addToCart")}
            </Button>
          </div>
        );
      })}
    </div>
  );
}

function SeatSummary({
  event,
  sectionId,
  selectedSeats,
  seatedTicket,
  total,
  onRemove,
  onAdd,
  disabled,
}: {
  event: Event;
  sectionId: string;
  selectedSeats: Seat[];
  seatedTicket?: TicketType;
  total: number;
  onRemove: (seatId: string) => void;
  onAdd: () => void;
  disabled: boolean;
}) {
  const t = useTranslations();
  const locale = usePreferencesStore((state) => state.locale);
  const section = event.seatLayout?.sections.find(
    (item) => item.id === sectionId,
  );
  return (
    <div className="rounded-2xl border border-line bg-surface p-4 sm:p-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-ink">{section?.name}</p>
          <p className="mt-0.5 text-xs text-muted">
            {selectedSeats.length
              ? `${selectedSeats.length} ${t("cart.seats").toLowerCase()}`
              : t("event.seatMap")}
          </p>
        </div>
        <p className="font-display text-lg font-semibold tabular">
          {formatIDR(total, locale)}
        </p>
      </div>
      {selectedSeats.length ? (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {selectedSeats.map((seat) => (
            <button
              key={seat.id}
              type="button"
              onClick={() => onRemove(seat.id)}
              className="inline-flex items-center gap-1 rounded-full border border-brand/20 bg-brand-soft px-2.5 py-1 text-[11px] font-medium text-brand-strong transition-colors hover:border-danger/30 hover:bg-danger/10 hover:text-danger"
              aria-label={`Hapus kursi ${seat.row}${seat.number}`}
            >
              {seat.row}
              {seat.number} <X className="size-3" />
            </button>
          ))}
        </div>
      ) : null}
      <Button
        className="mt-4 w-full"
        disabled={disabled || !selectedSeats.length || !seatedTicket}
        onClick={onAdd}
      >
        <Ticket className="size-4" /> {t("common.addToCart")}
        {seatedTicket ? (
          <span className="ml-1 opacity-70">
            · {formatIDR(seatedTicket.price * selectedSeats.length, locale)}
          </span>
        ) : null}
      </Button>
    </div>
  );
}
