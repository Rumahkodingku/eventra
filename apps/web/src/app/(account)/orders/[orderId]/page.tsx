"use client";

import { ArrowLeft, Compass, ReceiptText, Ticket } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { StatusBadge } from "@/components/ui/status-badge";
import { visibleOrdersForUser } from "@/lib/access";
import { formatIDR } from "@/lib/currency";
import { formatDateTime } from "@/lib/dates";
import { getSeatLabel } from "@/lib/seat";
import { useEventStore } from "@/stores/events";
import { useOrderStore } from "@/stores/orders";
import { usePreferencesStore } from "@/stores/preferences";
import { useSessionStore } from "@/stores/session";

export default function OrderDetailPage() {
  const t = useTranslations();
  const params = useParams<{ orderId: string }>();
  const locale = usePreferencesStore((state) => state.locale);
  const user = useSessionStore((state) => state.user);
  const orders = useOrderStore((state) => state.orders);
  const tickets = useOrderStore((state) => state.tickets);
  const events = useEventStore((state) => state.events);
  const order = visibleOrdersForUser(orders, user).find(
    (item) => item.id === params.orderId,
  );

  if (!order) {
    return (
      <div className="container-page section-space">
        <EmptyState
          icon={Compass}
          title={t("common.notFound")}
          body={t("errors.notFound")}
          action={
            <Button asChild>
              <Link href="/orders">{t("nav.orders")}</Link>
            </Button>
          }
        />
      </div>
    );
  }

  const orderTickets = tickets.filter((ticket) => ticket.orderId === order.id);
  const progress = ["PENDING_PAYMENT", "CONFIRMED"].includes(order.orderStatus);
  const statusLabel =
    order.orderStatus === "CONFIRMED"
      ? t("common.confirmed")
      : order.orderStatus === "PENDING_PAYMENT"
        ? t("common.pending")
        : order.orderStatus === "PAYMENT_FAILED"
          ? t("common.failed")
          : t("common.cancelled");

  return (
    <div className="container-page section-space">
      <Breadcrumbs
        items={[
          { label: t("nav.orders"), href: "/orders" },
          { label: order.orderNumber },
        ]}
      />
      <div className="mt-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-strong">
            {t("common.viewOrder")}
          </p>
          <h1 className="mt-2 font-display text-3xl font-semibold tabular sm:text-4xl">
            {order.orderNumber}
          </h1>
          <p className="mt-2 text-xs text-muted">
            {formatDateTime(order.createdAt, "Asia/Jakarta", locale)} ·{" "}
            {order.paymentMethod}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <StatusBadge status={order.orderStatus} label={statusLabel} />
          <Button asChild variant="ghost" size="sm">
            <Link href="/orders">
              <ArrowLeft className="size-4" /> {t("nav.orders")}
            </Link>
          </Button>
        </div>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_360px]">
        <div className="space-y-5">
          <div className="rounded-3xl border border-line bg-surface p-5">
            <h2 className="font-display text-xl font-semibold">
              {t("checkout.summary")}
            </h2>
            <div className="mt-4 space-y-4">
              {order.items.map((item) => {
                const event = events.find((entry) => entry.id === item.eventId);
                return (
                  <div
                    key={item.id}
                    className="border-b border-line pb-4 last:border-0 last:pb-0"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-sm font-semibold">
                          {item.eventTitleSnapshot}
                        </p>
                        <p className="mt-0.5 text-xs text-muted">
                          {item.ticketNameSnapshot} · {item.quantity} tiket
                        </p>
                        {item.seatIds.length && event ? (
                          <p className="mt-1 text-xs text-muted">
                            {item.seatIds
                              .map((seatId) => getSeatLabel(event, seatId))
                              .join(" · ")}
                          </p>
                        ) : null}
                      </div>
                      <p className="shrink-0 text-sm font-semibold tabular">
                        {formatIDR(item.lineSubtotal, locale)}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="mt-4 space-y-2 border-t border-line pt-4 text-sm">
              <div className="flex justify-between">
                <span className="text-muted">{t("cart.subtotal")}</span>
                <span className="tabular">
                  {formatIDR(order.subtotal, locale)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">{t("cart.fee")}</span>
                <span className="tabular">
                  {formatIDR(order.serviceFee, locale)}
                </span>
              </div>
              {order.discount ? (
                <div className="flex justify-between text-success">
                  <span>{t("cart.discount")}</span>
                  <span className="tabular">
                    − {formatIDR(order.discount, locale)}
                  </span>
                </div>
              ) : null}
              <div className="flex justify-between border-t border-line pt-2 font-semibold">
                <span>{t("cart.total")}</span>
                <span className="font-display text-xl tabular">
                  {formatIDR(order.total, locale)}
                </span>
              </div>
            </div>
          </div>

          {orderTickets.length ? (
            <div className="rounded-3xl border border-line bg-surface p-5">
              <h2 className="font-display text-xl font-semibold">
                {t("nav.myTickets")}
              </h2>
              <div className="mt-4 space-y-2">
                {orderTickets.map((ticket) => (
                  <Link
                    key={ticket.id}
                    href={`/tickets/${ticket.id}`}
                    className="flex items-center justify-between gap-3 rounded-2xl border border-line p-3 text-sm transition-colors hover:border-brand/30 hover:bg-brand-soft/20"
                  >
                    <span className="inline-flex items-center gap-2">
                      <Ticket className="size-4 text-brand-strong" />
                      <span className="font-semibold tabular">
                        {ticket.ticketCode}
                      </span>
                    </span>
                    <Badge
                      variant={ticket.status === "USED" ? "info" : "success"}
                    >
                      {ticket.status === "USED"
                        ? t("common.used")
                        : ticket.status === "EXPIRED"
                          ? t("common.expired")
                          : t("common.valid")}
                    </Badge>
                  </Link>
                ))}
              </div>
            </div>
          ) : null}
        </div>

        <aside className="space-y-4">
          <div className="rounded-3xl border border-line bg-surface p-5">
            <h2 className="flex items-center gap-2 font-display text-lg font-semibold">
              <ReceiptText className="size-4 text-brand-strong" />{" "}
              {t("checkout.buyer")}
            </h2>
            <dl className="mt-4 space-y-3 text-sm">
              <div>
                <dt className="text-xs text-muted">
                  {t("checkout.buyerName")}
                </dt>
                <dd className="mt-0.5 font-medium">{order.buyer.name}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted">
                  {t("checkout.buyerEmail")}
                </dt>
                <dd className="mt-0.5 font-medium">{order.buyer.email}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted">
                  {t("checkout.buyerPhone")}
                </dt>
                <dd className="mt-0.5 font-medium">{order.buyer.phone}</dd>
              </div>
            </dl>
          </div>
          <div className="rounded-3xl border border-line bg-surface p-5">
            <h2 className="font-display text-lg font-semibold">
              {t("checkout.payment")}
            </h2>
            <div className="mt-3 flex items-center justify-between text-sm">
              <span className="text-muted">{order.paymentMethod}</span>
              <StatusBadge
                status={order.paymentStatus}
                label={
                  order.paymentStatus === "PAID"
                    ? t("common.paid")
                    : order.paymentStatus === "FAILED"
                      ? t("common.failed")
                      : t("common.pending")
                }
              />
            </div>
            {progress ? (
              <p className="mt-3 text-xs leading-relaxed text-muted">
                {order.paymentStatus === "PAID"
                  ? t("checkout.successBody")
                  : t("checkout.orderNote")}
              </p>
            ) : null}
          </div>
        </aside>
      </div>
    </div>
  );
}
