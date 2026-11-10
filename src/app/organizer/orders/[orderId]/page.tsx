"use client";

import { ArrowLeft, Compass, ReceiptText, Ticket } from "lucide-react";
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
import { formatIDR } from "@/lib/currency";
import { formatDateTime } from "@/lib/dates";
import { getSeatLabel } from "@/lib/seat";
import { useEventStore } from "@/stores/events";
import { useOrderStore } from "@/stores/orders";
import { usePreferencesStore } from "@/stores/preferences";

export default function OrganizerOrderDetailPage() {
  const t = useTranslations();
  const params = useParams<{ orderId: string }>();
  const locale = usePreferencesStore((state) => state.locale);
  const order = useOrderStore((state) =>
    state.orders.find((item) => item.id === params.orderId),
  );
  const tickets = useOrderStore((state) => state.tickets);
  const attendees = useOrderStore((state) => state.attendees);
  const events = useEventStore((state) => state.events);

  if (!order) {
    return (
      <EmptyState
        icon={Compass}
        title={t("common.notFound")}
        body={t("errors.notFound")}
        action={
          <Button asChild>
            <Link href="/organizer/orders">{t("organizer.orders")}</Link>
          </Button>
        }
      />
    );
  }

  const orderTickets = tickets.filter((ticket) => ticket.orderId === order.id);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-strong">
            {t("organizer.orders")}
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
          <StatusBadge
            status={order.orderStatus}
            label={
              order.orderStatus === "CONFIRMED"
                ? t("common.confirmed")
                : order.orderStatus === "PENDING_PAYMENT"
                  ? t("common.pending")
                  : order.orderStatus === "PAYMENT_FAILED"
                    ? t("common.failed")
                    : t("common.cancelled")
            }
          />
          <Button asChild variant="ghost" size="sm">
            <Link href="/organizer/orders">
              <ArrowLeft className="size-4" /> {t("organizer.orders")}
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-5 xl:grid-cols-[1fr_360px]">
        <div className="min-w-0 space-y-5">
          <section className="rounded-3xl border border-line bg-surface p-5">
            <h2 className="font-display text-xl font-semibold">
              {t("checkout.summary")}
            </h2>
            <div className="mt-4 space-y-3">
              {order.items.map((item) => {
                const event = events.find((entry) => entry.id === item.eventId);
                return (
                  <div
                    key={item.id}
                    className="border-b border-line pb-3 last:border-0 last:pb-0"
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
          </section>

          {orderTickets.length ? (
            <section>
              <h2 className="mb-3 font-display text-xl font-semibold">
                {t("nav.myTickets")}
              </h2>
              <TableWrap>
                <Table>
                  <THead>
                    <TR>
                      <TH>{t("tickets.ticketCode")}</TH>
                      <TH>{t("tickets.attendee")}</TH>
                      <TH>{t("tickets.status")}</TH>
                    </TR>
                  </THead>
                  <TBody>
                    {orderTickets.map((ticket) => {
                      const attendee = attendees.find(
                        (item) => item.id === ticket.attendeeId,
                      );
                      return (
                        <TR key={ticket.id}>
                          <TD className="font-semibold tabular">
                            {ticket.ticketCode}
                          </TD>
                          <TD>{attendee?.fullName}</TD>
                          <TD>
                            <Badge
                              variant={
                                ticket.status === "USED" ? "info" : "success"
                              }
                            >
                              {ticket.status === "USED"
                                ? t("common.used")
                                : t("common.valid")}
                            </Badge>
                          </TD>
                        </TR>
                      );
                    })}
                  </TBody>
                </Table>
              </TableWrap>
            </section>
          ) : null}
        </div>

        <aside className="space-y-4">
          <div className="rounded-3xl border border-line bg-surface p-5">
            <h2 className="flex items-center gap-2 font-display text-lg font-semibold">
              <ReceiptText className="size-4 text-brand-strong" />{" "}
              {t("organizer.buyer")}
            </h2>
            <div className="mt-4 space-y-3 text-sm">
              <div>
                <p className="text-xs text-muted">{t("checkout.buyerName")}</p>
                <p className="mt-0.5 font-medium">{order.buyer.name}</p>
              </div>
              <div>
                <p className="text-xs text-muted">{t("checkout.buyerEmail")}</p>
                <p className="mt-0.5 font-medium">{order.buyer.email}</p>
              </div>
              <div>
                <p className="text-xs text-muted">{t("checkout.buyerPhone")}</p>
                <p className="mt-0.5 font-medium">{order.buyer.phone}</p>
              </div>
            </div>
          </div>
          <div className="rounded-3xl border border-line bg-surface p-5">
            <h2 className="font-display text-lg font-semibold">
              {t("organizer.paymentStatus")}
            </h2>
            <div className="mt-3">
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
            <p className="mt-3 text-xs leading-relaxed text-muted">
              {order.paymentMethod}
            </p>
          </div>
          <Button asChild variant="outline" className="w-full">
            <Link href={`/organizer/orders`}>
              <Ticket className="size-4" /> {t("organizer.orders")}
            </Link>
          </Button>
        </aside>
      </div>
    </div>
  );
}
