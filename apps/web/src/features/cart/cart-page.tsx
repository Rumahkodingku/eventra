"use client";

import { ArrowRight, ShoppingBag, Tag, Trash2, X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DemoNotice } from "@/components/ui/demo-notice";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { QuantityStepper } from "@/components/ui/quantity-stepper";
import { seedData } from "@/data/seed";
import { venues } from "@/data/seed/catalog";
import { cn } from "@/lib/cn";
import { formatIDR } from "@/lib/currency";
import { formatShortDate, formatTime } from "@/lib/dates";
import {
  calculateCartTotals,
  getTicketAvailability,
  isEventPurchasable,
} from "@/lib/pricing";
import { getSeatLabel } from "@/lib/seat";
import { useCartStore } from "@/stores/cart";
import { useEventStore } from "@/stores/events";
import { useOrderStore } from "@/stores/orders";
import { usePreferencesStore } from "@/stores/preferences";

export function CartPage() {
  const t = useTranslations();
  const locale = usePreferencesStore((state) => state.locale);
  const items = useCartStore((state) => state.items);
  const promoCode = useCartStore((state) => state.promoCode);
  const setPromoCode = useCartStore((state) => state.setPromoCode);
  const updateQuantity = useCartStore((state) => state.updateQuantity);
  const removeItem = useCartStore((state) => state.removeItem);
  const events = useEventStore((state) => state.events);
  const orders = useOrderStore((state) => state.orders);
  const [promoInput, setPromoInput] = useState("");
  const [promoError, setPromoError] = useState<string | null>(null);
  const [promoSuccess, setPromoSuccess] = useState<string | null>(null);

  const pricing = useMemo(
    () =>
      calculateCartTotals({
        items,
        events,
        promos: seedData.promos,
        orders,
        promoCode,
      }),
    [items, events, orders, promoCode],
  );

  const issueItems = items.filter((item) => {
    const event = events.find((entry) => entry.id === item.eventId);
    const ticket = event?.ticketTypes.find(
      (entry) => entry.id === item.ticketTypeId,
    );
    if (!event || !ticket) return true;
    if (!isEventPurchasable(event).purchasable) return true;
    if (!getTicketAvailability(ticket).available) return true;
    if (ticket.kind === "SEATED" && !item.seatIds.length) return true;
    return false;
  });

  const applyPromo = () => {
    const result = calculateCartTotals({
      items,
      events,
      promos: seedData.promos,
      orders,
      promoCode: promoInput,
    });
    if (result.error || !result.promo) {
      const message =
        result.error === "expired"
          ? t("cart.promoExpired")
          : result.error === "min"
            ? t("cart.promoMin")
            : result.error === "ineligible"
              ? t("cart.promoIneligible")
              : t("cart.promoInvalid");
      setPromoError(message);
      setPromoSuccess(null);
      return;
    }
    setPromoCode(result.promo.code);
    setPromoError(null);
    setPromoSuccess(t("cart.promoApplied", { code: result.promo.code }));
    setPromoInput("");
    toast.success(t("cart.promoApplied", { code: result.promo.code }));
  };

  if (!items.length) {
    return (
      <div className="container-page section-space">
        <EmptyState
          icon={ShoppingBag}
          title={t("cart.emptyTitle")}
          body={t("cart.emptyBody")}
          action={
            <Button asChild>
              <Link href="/events">{t("cart.continueShopping")}</Link>
            </Button>
          }
        />
      </div>
    );
  }

  return (
    <div className="container-page section-space">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-strong">
        {t("nav.cart")}
      </p>
      <h1 className="mt-3 font-display text-4xl font-semibold sm:text-5xl">
        {t("cart.title")}
      </h1>
      <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted">
        {t("cart.subtitle")}
      </p>

      <div className="mt-9 grid gap-8 lg:grid-cols-[1fr_380px]">
        <div className="space-y-4">
          {items.map((item) => {
            const event = events.find((entry) => entry.id === item.eventId);
            const ticket = event?.ticketTypes.find(
              (entry) => entry.id === item.ticketTypeId,
            );
            const venue = event
              ? venues.find((entry) => entry.id === event.venueId)
              : undefined;
            if (!event || !ticket) return null;
            const hasIssue = issueItems.includes(item);
            return (
              <article
                key={item.id}
                className={cn(
                  "rounded-3xl border bg-surface p-4 sm:p-5",
                  hasIssue ? "border-danger/30" : "border-line",
                )}
              >
                <div className="flex flex-col gap-4 sm:flex-row">
                  <Link
                    href={`/events/${event.slug}`}
                    className="relative aspect-[4/3] w-full shrink-0 overflow-hidden rounded-2xl sm:size-28"
                  >
                    <Image
                      src={event.coverImage}
                      alt={event.title}
                      fill
                      sizes="(max-width: 640px) 100vw, 112px"
                      className="object-cover"
                    />
                  </Link>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-brand-strong">
                          {ticket.name}
                        </p>
                        <Link
                          href={`/events/${event.slug}`}
                          className="mt-1 block font-display text-lg font-semibold leading-tight hover:text-brand-strong"
                        >
                          {event.title}
                        </Link>
                        <p className="mt-1 text-xs text-muted">
                          {formatShortDate(
                            event.startAt,
                            event.timezone,
                            locale,
                          )}{" "}
                          · {formatTime(event.startAt, event.timezone, locale)}{" "}
                          · {venue?.city}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeItem(item.id)}
                        className="grid size-9 shrink-0 place-items-center rounded-full text-muted transition-colors hover:bg-danger/10 hover:text-danger"
                        aria-label={t("cart.remove")}
                      >
                        <Trash2 className="size-4" />
                      </button>
                    </div>

                    {item.seatIds.length ? (
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {item.seatIds.map((seatId) => (
                          <Badge key={seatId} variant="brand">
                            {getSeatLabel(event, seatId)}
                          </Badge>
                        ))}
                      </div>
                    ) : null}

                    <div className="mt-4 flex flex-wrap items-end justify-between gap-3">
                      <div>
                        <p className="text-[10px] uppercase tracking-[0.14em] text-muted">
                          {event.ticketingMode === "RESERVED_SEATING"
                            ? t("cart.seats")
                            : t("cart.quantity")}
                        </p>
                        {item.seatIds.length ? (
                          <p className="mt-1 text-sm font-semibold">
                            {item.seatIds.length}{" "}
                            {t("cart.seats").toLowerCase()}
                          </p>
                        ) : (
                          <QuantityStepper
                            value={item.quantity}
                            min={ticket.minPerOrder}
                            max={ticket.maxPerOrder}
                            onChange={(value) => updateQuantity(item.id, value)}
                            size="sm"
                            label={`${ticket.name} quantity`}
                          />
                        )}
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] uppercase tracking-[0.14em] text-muted">
                          {formatIDR(item.unitPriceSnapshot, locale)} ×{" "}
                          {item.quantity}
                        </p>
                        <p className="font-display text-xl font-semibold tabular">
                          {formatIDR(
                            item.unitPriceSnapshot * item.quantity,
                            locale,
                          )}
                        </p>
                      </div>
                    </div>
                    {hasIssue ? (
                      <p className="mt-3 text-xs font-medium text-danger">
                        {isEventPurchasable(event).purchasable
                          ? t("cart.invalidSelection")
                          : t("cart.saleClosed")}
                      </p>
                    ) : null}
                  </div>
                </div>
              </article>
            );
          })}

          <Button asChild variant="ghost" className="mt-2">
            <Link href="/events">
              {t("cart.continueShopping")} <ArrowRight className="size-4" />
            </Link>
          </Button>
        </div>

        <aside>
          <div className="sticky top-24 space-y-4">
            <div className="rounded-3xl border border-line bg-surface p-5 shadow-soft">
              <h2 className="font-display text-xl font-semibold">
                {t("common.total")}
              </h2>

              <div className="mt-5 space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted">{t("cart.subtotal")}</span>
                  <span className="font-medium tabular">
                    {formatIDR(pricing.subtotal, locale)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted">{t("cart.fee")}</span>
                  <span className="font-medium tabular">
                    {formatIDR(pricing.serviceFee, locale)}
                  </span>
                </div>
                {pricing.discount ? (
                  <div className="flex items-center justify-between text-sm text-success">
                    <span>{t("cart.discount")}</span>
                    <span className="font-medium tabular">
                      − {formatIDR(pricing.discount, locale)}
                    </span>
                  </div>
                ) : null}
                <div className="flex items-center justify-between border-t border-line pt-3">
                  <span className="font-semibold">{t("cart.total")}</span>
                  <span className="font-display text-2xl font-semibold tabular">
                    {formatIDR(pricing.total, locale)}
                  </span>
                </div>
              </div>

              <div className="mt-5 border-t border-line pt-5">
                <p className="flex items-center gap-2 text-xs font-semibold text-ink">
                  <Tag className="size-3.5 text-brand-strong" />{" "}
                  {t("cart.promo")}
                </p>
                {promoCode ? (
                  <div className="mt-2 flex items-center justify-between rounded-xl border border-success/20 bg-success/10 px-3 py-2">
                    <span className="text-xs font-semibold text-success">
                      {promoCode}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setPromoCode(undefined);
                        setPromoSuccess(null);
                        setPromoError(null);
                      }}
                      className="text-success/70 hover:text-success"
                      aria-label={t("cart.promoRemoved")}
                    >
                      <X className="size-3.5" />
                    </button>
                  </div>
                ) : (
                  <div className="mt-2 flex gap-2">
                    <Input
                      value={promoInput}
                      onChange={(event) =>
                        setPromoInput(event.target.value.toUpperCase())
                      }
                      placeholder={t("cart.promoPlaceholder")}
                      className="h-10 text-xs"
                      aria-label={t("cart.promo")}
                    />
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={applyPromo}
                    >
                      {t("cart.apply")}
                    </Button>
                  </div>
                )}
                {promoError ? (
                  <p className="mt-2 text-xs text-danger">{promoError}</p>
                ) : null}
                {promoSuccess ? (
                  <p className="mt-2 text-xs text-success">{promoSuccess}</p>
                ) : null}
              </div>

              {issueItems.length ? (
                <p className="mt-4 rounded-xl border border-danger/20 bg-danger/10 p-3 text-xs text-danger">
                  {t("cart.invalidSelection")}
                </p>
              ) : null}

              <Button
                asChild
                className="mt-5 w-full"
                size="lg"
                disabled={issueItems.length > 0}
              >
                <Link href={issueItems.length ? "/cart" : "/checkout"}>
                  {t("cart.checkout")} <ArrowRight className="size-4" />
                </Link>
              </Button>
              <p className="mt-3 text-[11px] leading-relaxed text-muted">
                {t("cart.feeNote")}
              </p>
              <DemoNotice className="mt-3">
                {t("common.simulationNotice")}
              </DemoNotice>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
