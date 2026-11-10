"use client";

import { Download, ReceiptText, Search } from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Input, Select } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
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
import { useHydrated } from "@/hooks/use-hydrated";
import { downloadCsv } from "@/lib/csv";
import { formatIDR } from "@/lib/currency";
import { formatDateTime } from "@/lib/dates";
import { getSeatLabel } from "@/lib/seat";
import { useEventStore } from "@/stores/events";
import { useOrderStore } from "@/stores/orders";
import { usePreferencesStore } from "@/stores/preferences";

export default function OrganizerOrdersPage() {
  const t = useTranslations();
  const hydrated = useHydrated();
  const locale = usePreferencesStore((state) => state.locale);
  const orders = useOrderStore((state) => state.orders);
  const events = useEventStore((state) => state.events);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("ALL");

  const filtered = useMemo(
    () =>
      orders.filter((order) => {
        if (status !== "ALL" && order.orderStatus !== status) return false;
        const query = search.trim().toLowerCase();
        if (!query) return true;
        return (
          order.orderNumber.toLowerCase().includes(query) ||
          order.buyer.name.toLowerCase().includes(query) ||
          order.buyer.email.toLowerCase().includes(query) ||
          order.items.some((item) =>
            item.eventTitleSnapshot.toLowerCase().includes(query),
          )
        );
      }),
    [orders, search, status],
  );

  const exportCsv = () => {
    const rows = filtered.flatMap((order) =>
      order.items.map((item) => ({
        orderNumber: order.orderNumber,
        date: formatDateTime(order.createdAt, "Asia/Jakarta", locale),
        event: item.eventTitleSnapshot,
        buyer: order.buyer.name,
        email: order.buyer.email,
        ticketType: item.ticketNameSnapshot,
        quantity: item.quantity,
        seats: item.seatIds
          .map((seatId) => {
            const event = events.find((entry) => entry.id === item.eventId);
            return event ? getSeatLabel(event, seatId) : seatId;
          })
          .join(" | "),
        subtotal: item.lineSubtotal,
        serviceFee: order.serviceFee,
        discount: order.discount,
        total: order.total,
        orderStatus: order.orderStatus,
        paymentStatus: order.paymentStatus,
      })),
    );
    downloadCsv(
      "eventra-orders.csv",
      [
        { key: "orderNumber", label: "Order number" },
        { key: "date", label: "Date" },
        { key: "event", label: "Event" },
        { key: "buyer", label: "Buyer" },
        { key: "email", label: "Email" },
        { key: "ticketType", label: "Ticket type" },
        { key: "quantity", label: "Quantity" },
        { key: "seats", label: "Seats" },
        { key: "subtotal", label: "Subtotal" },
        { key: "serviceFee", label: "Service fee" },
        { key: "discount", label: "Discount" },
        { key: "total", label: "Total" },
        { key: "orderStatus", label: "Order status" },
        { key: "paymentStatus", label: "Payment status" },
      ],
      rows,
    );
  };

  if (!hydrated) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-20" />
        <Skeleton className="h-96" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-strong">
            {t("organizer.orders")}
          </p>
          <h1 className="mt-2 font-display text-3xl font-semibold sm:text-4xl">
            {t("organizer.ordersTitle")}
          </h1>
          <p className="mt-2 text-sm text-muted">
            {filtered.length} pesanan ·{" "}
            {formatIDR(
              filtered
                .filter((order) => order.orderStatus === "CONFIRMED")
                .reduce((sum, order) => sum + order.total, 0),
              locale,
            )}
          </p>
        </div>
        <Button variant="outline" onClick={exportCsv}>
          <Download className="size-4" /> {t("organizer.exportCsv")}
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
          value={status}
          onChange={(event) => setStatus(event.target.value)}
          className="sm:w-52"
          aria-label={t("common.status")}
        >
          <option value="ALL">{t("common.all")}</option>
          <option value="CONFIRMED">{t("common.confirmed")}</option>
          <option value="PENDING_PAYMENT">{t("common.pending")}</option>
          <option value="PAYMENT_FAILED">{t("common.failed")}</option>
          <option value="CANCELLED">{t("common.cancelled")}</option>
        </Select>
      </div>

      {filtered.length ? (
        <TableWrap>
          <Table>
            <THead>
              <TR>
                <TH>{t("organizer.orderNumber")}</TH>
                <TH>{t("organizer.buyer")}</TH>
                <TH>Event</TH>
                <TH>{t("organizer.total")}</TH>
                <TH>{t("organizer.paymentStatus")}</TH>
                <TH>{t("organizer.orderStatus")}</TH>
              </TR>
            </THead>
            <TBody>
              {filtered.map((order) => (
                <TR key={order.id}>
                  <TD>
                    <Link
                      href={`/organizer/orders/${order.id}`}
                      className="font-semibold hover:text-brand-strong"
                    >
                      {order.orderNumber}
                    </Link>
                    <span className="mt-0.5 block text-[11px] text-muted">
                      {formatDateTime(order.createdAt, "Asia/Jakarta", locale)}
                    </span>
                  </TD>
                  <TD>
                    <span className="text-sm">{order.buyer.name}</span>
                    <span className="mt-0.5 block text-[11px] text-muted">
                      {order.buyer.email}
                    </span>
                  </TD>
                  <TD className="max-w-[240px] truncate text-xs">
                    {order.items
                      .map((item) => item.eventTitleSnapshot)
                      .join(", ")}
                  </TD>
                  <TD className="font-semibold tabular">
                    {formatIDR(order.total, locale)}
                  </TD>
                  <TD>
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
                  </TD>
                  <TD>
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
                  </TD>
                </TR>
              ))}
            </TBody>
          </Table>
        </TableWrap>
      ) : (
        <EmptyState
          icon={ReceiptText}
          title={t("events.noResultsTitle")}
          body={t("events.noResultsBody")}
        />
      )}
    </div>
  );
}
