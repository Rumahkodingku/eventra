"use client";

import {
  ArrowRight,
  Building2,
  CreditCard,
  LockKeyhole,
  QrCode,
  ShieldCheck,
  ShoppingBag,
  Wallet,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { Button } from "@/components/ui/button";
import { DemoNotice } from "@/components/ui/demo-notice";
import { EmptyState } from "@/components/ui/empty-state";
import { Field } from "@/components/ui/field";
import { Checkbox, Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import type { BuyerDetails } from "@/domain/types";
import { useHydrated } from "@/hooks/use-hydrated";
import { cn } from "@/lib/cn";
import { formatIDR } from "@/lib/currency";
import { formatShortDate } from "@/lib/dates";
import {
  calculateCartTotals,
  getTicketAvailability,
  isEventPurchasable,
} from "@/lib/pricing";
import { useCartStore } from "@/services/hooks/use-cart-store";
import { useCatalog } from "@/services/hooks/use-catalog";
import { useEventStore } from "@/services/hooks/use-event-store";
import { useOrderStore } from "@/services/hooks/use-order-store";
import { useSessionStore } from "@/services/hooks/use-session-store";
import { usePreferencesStore } from "@/stores/preferences";

type AttendeeDraft = { fullName: string; email: string; phone: string };

const paymentMethods = [
  { id: "bank", icon: Building2, labelKey: "checkout.paymentBank" as const },
  { id: "ewallet", icon: Wallet, labelKey: "checkout.paymentEwallet" as const },
  { id: "qris", icon: QrCode, labelKey: "checkout.paymentQris" as const },
  { id: "card", icon: CreditCard, labelKey: "checkout.paymentCard" as const },
];

export function CheckoutPage() {
  const t = useTranslations();
  const hydrated = useHydrated();
  const { promos, venues } = useCatalog();
  const router = useRouter();
  const locale = usePreferencesStore((state) => state.locale);
  const items = useCartStore((state) => state.items);
  const promoCode = useCartStore((state) => state.promoCode);
  const quote = useCartStore((state) => state.quote);
  const clearCart = useCartStore((state) => state.clear);
  const events = useEventStore((state) => state.events);
  const orders = useOrderStore((state) => state.orders);
  const createOrder = useOrderStore((state) => state.createOrder);
  const user = useSessionStore((state) => state.user);

  const [buyer, setBuyer] = useState<BuyerDetails>({
    name: "",
    email: "",
    phone: "",
  });
  const [attendees, setAttendees] = useState<Record<string, AttendeeDraft[]>>(
    {},
  );
  const [paymentMethod, setPaymentMethod] = useState("qris");
  const [terms, setTerms] = useState(false);
  const [simulation, setSimulation] = useState(false);
  const [simulateFailure, setSimulateFailure] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const localPricing = useMemo(
    () =>
      calculateCartTotals({
        items,
        events,
        promos,
        orders,
        promoCode,
      }),
    [items, events, orders, promoCode, promos],
  );
  const pricing = quote ?? localPricing;

  useEffect(() => {
    if (!user) return;
    setBuyer((current) =>
      current.name || current.email
        ? current
        : { name: user.name, email: user.email, phone: user.phone ?? "" },
    );
  }, [user]);

  useEffect(() => {
    setAttendees((current) => {
      const next: Record<string, AttendeeDraft[]> = {};
      items.forEach((item) => {
        next[item.id] = Array.from({ length: item.quantity }, (_, index) => {
          return (
            current[item.id]?.[index] ?? {
              fullName: "",
              email: "",
              phone: "",
            }
          );
        });
      });
      return next;
    });
  }, [items]);

  if (!hydrated) {
    return (
      <div className="container-page section-space">
        <Skeleton className="h-5 w-24" />
        <Skeleton className="mt-4 h-12 w-1/2" />
        <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_380px]">
          <Skeleton className="h-[520px]" />
          <Skeleton className="h-[360px]" />
        </div>
      </div>
    );
  }

  if (!items.length) {
    return (
      <div className="container-page section-space">
        <EmptyState
          icon={ShoppingBag}
          title={t("cart.emptyTitle")}
          body={t("checkout.empty")}
          action={
            <Button asChild>
              <Link href="/events">{t("cart.continueShopping")}</Link>
            </Button>
          }
        />
      </div>
    );
  }

  const issue = items.some((item) => {
    const event = events.find((entry) => entry.id === item.eventId);
    const ticket = event?.ticketTypes.find(
      (entry) => entry.id === item.ticketTypeId,
    );
    return (
      !event ||
      !ticket ||
      !isEventPurchasable(event).purchasable ||
      !getTicketAvailability(ticket).available
    );
  });

  const fillBuyer = () => {
    setAttendees((current) => {
      const next: Record<string, AttendeeDraft[]> = {};
      Object.entries(current).forEach(([itemId, list]) => {
        next[itemId] = list.map(() => ({
          fullName: buyer.name,
          email: buyer.email,
          phone: buyer.phone,
        }));
      });
      return next;
    });
    toast.success(t("checkout.useBuyer"));
  };

  const submit = async () => {
    const errors: Record<string, string> = {};
    if (!buyer.name.trim()) errors["buyer.name"] = t("errors.required");
    if (!buyer.email.trim()) errors["buyer.email"] = t("errors.required");
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(buyer.email))
      errors["buyer.email"] = t("errors.invalidEmail");
    if (!buyer.phone.trim()) errors["buyer.phone"] = t("errors.required");
    Object.entries(attendees).forEach(([itemId, list]) => {
      list.forEach((attendee, index) => {
        if (!attendee.fullName.trim())
          errors[`attendee.${itemId}.${index}.name`] = t("errors.required");
        if (!attendee.email.trim())
          errors[`attendee.${itemId}.${index}.email`] = t("errors.required");
        else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(attendee.email))
          errors[`attendee.${itemId}.${index}.email`] = t(
            "errors.invalidEmail",
          );
      });
    });
    if (!terms) errors.terms = t("checkout.requiredTerms");
    if (!simulation) errors.simulation = t("checkout.requiredSimulation");
    setFieldErrors(errors);
    if (Object.keys(errors).length) {
      setFormError(t("errors.required"));
      return;
    }
    if (issue) {
      setFormError(t("cart.invalidSelection"));
      return;
    }
    setFormError(null);
    setProcessing(true);
    try {
      const result = await createOrder({
        buyer,
        paymentMethod,
        promoCode,
        items,
        attendees,
        simulateFailure,
        user,
      });
      if (simulateFailure) {
        toast.error(t("checkout.failed"));
        router.push(`/checkout/result/${result.order.id}`);
        return;
      }
      await clearCart();
      toast.success(t("checkout.success"));
      router.push(`/checkout/success/${result.order.id}`);
    } catch (error) {
      const inventoryConflict =
        error instanceof Error && error.message === "INVENTORY_CONFLICT";
      toast.error(t("checkout.failed"));
      setFormError(
        inventoryConflict ? t("cart.invalidSelection") : t("errors.generic"),
      );
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="container-page section-space">
      <Breadcrumbs
        items={[
          { label: t("nav.cart"), href: "/cart" },
          { label: t("checkout.title") },
        ]}
      />
      <div className="mt-6 max-w-3xl">
        <h1 className="font-display text-4xl font-semibold sm:text-5xl">
          {t("checkout.title")}
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-muted">
          {t("checkout.subtitle")}
        </p>
      </div>

      <div className="mt-9 grid gap-8 lg:grid-cols-[1fr_380px]">
        <div className="space-y-6">
          <section className="rounded-3xl border border-line bg-surface p-5 sm:p-6">
            <h2 className="font-display text-xl font-semibold">
              {t("checkout.buyer")}
            </h2>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <Field
                label={t("checkout.buyerName")}
                htmlFor="buyer-name"
                required
                error={fieldErrors["buyer.name"]}
              >
                <Input
                  id="buyer-name"
                  value={buyer.name}
                  onChange={(event) =>
                    setBuyer({ ...buyer, name: event.target.value })
                  }
                  autoComplete="name"
                />
              </Field>
              <Field
                label={t("checkout.buyerEmail")}
                htmlFor="buyer-email"
                required
                error={fieldErrors["buyer.email"]}
              >
                <Input
                  id="buyer-email"
                  type="email"
                  value={buyer.email}
                  onChange={(event) =>
                    setBuyer({ ...buyer, email: event.target.value })
                  }
                  autoComplete="email"
                />
              </Field>
              <Field
                label={t("checkout.buyerPhone")}
                htmlFor="buyer-phone"
                required
                error={fieldErrors["buyer.phone"]}
                className="sm:col-span-2"
              >
                <Input
                  id="buyer-phone"
                  value={buyer.phone}
                  onChange={(event) =>
                    setBuyer({ ...buyer, phone: event.target.value })
                  }
                  autoComplete="tel"
                />
              </Field>
            </div>
          </section>

          <section className="rounded-3xl border border-line bg-surface p-5 sm:p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="font-display text-xl font-semibold">
                  {t("checkout.attendees")}
                </h2>
                <p className="mt-1 text-xs text-muted">
                  {t("checkout.attendeeNote")}
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={fillBuyer}
              >
                {t("checkout.useBuyer")}
              </Button>
            </div>
            <div className="mt-5 space-y-6">
              {items.map((item) => {
                const event = events.find((entry) => entry.id === item.eventId);
                const ticket = event?.ticketTypes.find(
                  (entry) => entry.id === item.ticketTypeId,
                );
                if (!event || !ticket) return null;
                return (
                  <div
                    key={item.id}
                    className="rounded-2xl border border-line bg-canvas p-4"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <p className="text-sm font-semibold">{event.title}</p>
                        <p className="text-xs text-muted">
                          {ticket.name} · {item.quantity} tiket
                        </p>
                      </div>
                      <Badge variant="brand">{ticket.name}</Badge>
                    </div>
                    <div className="mt-4 space-y-4">
                      {(attendees[item.id] ?? []).map((attendee, index) => (
                        <div
                          key={`${item.id}-${attendee.email || attendee.fullName || "attendee"}`}
                          className="grid gap-3 border-t border-line pt-4 first:border-0 first:pt-0 sm:grid-cols-2"
                        >
                          <p className="sm:col-span-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">
                            {t("checkout.attendeeFor", { index: index + 1 })}
                          </p>
                          <Field
                            label={t("checkout.buyerName")}
                            htmlFor={`att-${item.id}-${index}-name`}
                            required
                            error={
                              fieldErrors[`attendee.${item.id}.${index}.name`]
                            }
                          >
                            <Input
                              id={`att-${item.id}-${index}-name`}
                              value={attendee.fullName}
                              onChange={(event) =>
                                setAttendees((current) => ({
                                  ...current,
                                  [item.id]: current[item.id].map(
                                    (entry, entryIndex) =>
                                      entryIndex === index
                                        ? {
                                            ...entry,
                                            fullName: event.target.value,
                                          }
                                        : entry,
                                  ),
                                }))
                              }
                            />
                          </Field>
                          <Field
                            label={t("checkout.buyerEmail")}
                            htmlFor={`att-${item.id}-${index}-email`}
                            required
                            error={
                              fieldErrors[`attendee.${item.id}.${index}.email`]
                            }
                          >
                            <Input
                              id={`att-${item.id}-${index}-email`}
                              type="email"
                              value={attendee.email}
                              onChange={(inputEvent) =>
                                setAttendees((current) => ({
                                  ...current,
                                  [item.id]: current[item.id].map(
                                    (entry, entryIndex) =>
                                      entryIndex === index
                                        ? {
                                            ...entry,
                                            email: inputEvent.target.value,
                                          }
                                        : entry,
                                  ),
                                }))
                              }
                            />
                          </Field>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          <section className="rounded-3xl border border-line bg-surface p-5 sm:p-6">
            <h2 className="font-display text-xl font-semibold">
              {t("checkout.payment")}
            </h2>
            <fieldset className="mt-4">
              <legend className="sr-only">{t("checkout.payment")}</legend>
              <div className="grid gap-2 sm:grid-cols-2">
                {paymentMethods.map((method) => {
                  const Icon = method.icon;
                  return (
                    <label
                      key={method.id}
                      className={cn(
                        "flex cursor-pointer items-center gap-3 rounded-2xl border p-4 text-left transition-colors",
                        paymentMethod === method.id
                          ? "border-brand bg-brand-soft/50 ring-1 ring-brand"
                          : "border-line bg-canvas hover:border-ink/20",
                      )}
                    >
                      <input
                        type="radio"
                        name="payment-method"
                        value={method.id}
                        checked={paymentMethod === method.id}
                        onChange={() => setPaymentMethod(method.id)}
                        className="sr-only"
                      />
                      <span className="grid size-10 place-items-center rounded-xl bg-surface text-brand-strong">
                        <Icon className="size-5" />
                      </span>
                      <span className="text-sm font-semibold">
                        {t(method.labelKey)}
                      </span>
                      {paymentMethod === method.id ? <CheckCircle /> : null}
                    </label>
                  );
                })}
              </div>
            </fieldset>
            <p className="mt-4 flex items-start gap-2 text-xs leading-relaxed text-muted">
              <LockKeyhole className="mt-0.5 size-3.5 shrink-0 text-success" />
              {t("checkout.paymentNotice")}
            </p>
          </section>

          <section className="rounded-3xl border border-line bg-surface p-5 sm:p-6">
            <div className="space-y-3">
              <label
                htmlFor="checkout-terms"
                className="flex items-start gap-3 text-sm text-ink"
              >
                <Checkbox
                  id="checkout-terms"
                  checked={terms}
                  onChange={(event) => setTerms(event.target.checked)}
                  className="mt-0.5"
                />
                <span>{t("checkout.terms")}</span>
              </label>
              {fieldErrors.terms ? (
                <p className="text-xs text-danger">{fieldErrors.terms}</p>
              ) : null}
              <label
                htmlFor="checkout-simulation"
                className="flex items-start gap-3 text-sm text-ink"
              >
                <Checkbox
                  id="checkout-simulation"
                  checked={simulation}
                  onChange={(event) => setSimulation(event.target.checked)}
                  className="mt-0.5"
                />
                <span>{t("checkout.simulation")}</span>
              </label>
              {fieldErrors.simulation ? (
                <p className="text-xs text-danger">{fieldErrors.simulation}</p>
              ) : null}
              <label
                htmlFor="checkout-failure"
                className="flex items-start gap-3 rounded-2xl border border-warning/20 bg-warning/10 p-3 text-sm text-warning-text"
              >
                <Checkbox
                  id="checkout-failure"
                  checked={simulateFailure}
                  onChange={(event) => setSimulateFailure(event.target.checked)}
                  className="mt-0.5"
                />
                <span>{t("checkout.simulateFailure")}</span>
              </label>
            </div>
            {formError ? (
              <p className="mt-4 rounded-xl border border-danger/20 bg-danger/10 p-3 text-xs text-danger">
                {formError}
              </p>
            ) : null}
            <Button
              className="mt-5 w-full"
              size="lg"
              loading={processing}
              onClick={submit}
              disabled={issue}
            >
              {processing ? t("checkout.processing") : t("checkout.pay")}{" "}
              <ArrowRight className="size-4" />
            </Button>
            <DemoNotice className="mt-4">
              {t("common.simulationNotice")}
            </DemoNotice>
          </section>
        </div>

        <aside>
          <div className="sticky top-24 space-y-4">
            <div className="rounded-3xl border border-line bg-surface p-5 shadow-soft">
              <h2 className="font-display text-xl font-semibold">
                {t("checkout.summary")}
              </h2>
              <div className="mt-4 space-y-3">
                {items.map((item) => {
                  const event = events.find(
                    (entry) => entry.id === item.eventId,
                  );
                  const ticket = event?.ticketTypes.find(
                    (entry) => entry.id === item.ticketTypeId,
                  );
                  const venue = event
                    ? venues.find((entry) => entry.id === event.venueId)
                    : undefined;
                  if (!event || !ticket) return null;
                  return (
                    <div
                      key={item.id}
                      className="border-b border-line pb-3 last:border-0 last:pb-0"
                    >
                      <p className="text-sm font-semibold leading-snug">
                        {event.title}
                      </p>
                      <p className="mt-0.5 text-xs text-muted">
                        {ticket.name} · {item.quantity} ×{" "}
                        {formatIDR(item.unitPriceSnapshot, locale)}
                      </p>
                      <p className="mt-0.5 text-[11px] text-muted">
                        {formatShortDate(event.startAt, event.timezone, locale)}{" "}
                        · {venue?.city}
                      </p>
                    </div>
                  );
                })}
              </div>
              <div className="mt-4 space-y-2.5 border-t border-line pt-4 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted">{t("cart.subtotal")}</span>
                  <span className="tabular">
                    {formatIDR(pricing.subtotal, locale)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted">{t("cart.fee")}</span>
                  <span className="tabular">
                    {formatIDR(pricing.serviceFee, locale)}
                  </span>
                </div>
                {pricing.discount ? (
                  <div className="flex justify-between text-success">
                    <span>{t("cart.discount")}</span>
                    <span className="tabular">
                      − {formatIDR(pricing.discount, locale)}
                    </span>
                  </div>
                ) : null}
                <div className="flex justify-between border-t border-line pt-3 font-semibold">
                  <span>{t("cart.total")}</span>
                  <span className="font-display text-xl tabular">
                    {formatIDR(pricing.total, locale)}
                  </span>
                </div>
                {pricing.expiresAt ? (
                  <p className="text-[11px] text-muted">
                    Reservasi aktif sampai{" "}
                    {new Date(pricing.expiresAt).toLocaleTimeString("id-ID", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                    .
                  </p>
                ) : null}
              </div>
              <p className="mt-4 flex items-start gap-2 text-[11px] leading-relaxed text-muted">
                <ShieldCheck className="mt-0.5 size-3.5 shrink-0 text-success" />
                {t("checkout.orderNote")}
              </p>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

function CheckCircle() {
  return (
    <span className="ml-auto grid size-5 place-items-center rounded-full bg-brand text-on-brand">
      <span className="size-2 rounded-full bg-current" />
    </span>
  );
}
