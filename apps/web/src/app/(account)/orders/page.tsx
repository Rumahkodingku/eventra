"use client";

import { ArrowRight, ReceiptText, Search } from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Input, Select } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusBadge } from "@/components/ui/status-badge";
import { useHydrated } from "@/hooks/use-hydrated";
import { visibleOrdersForUser } from "@/lib/access";
import { formatIDR } from "@/lib/currency";
import { formatDateTime } from "@/lib/dates";
import { useOrderStore } from "@/services/hooks/use-order-store";
import { useSessionStore } from "@/services/hooks/use-session-store";
import { usePreferencesStore } from "@/stores/preferences";

export default function OrdersPage() {
  const t = useTranslations();
  const hydrated = useHydrated();
  const locale = usePreferencesStore((state) => state.locale);
  const user = useSessionStore((state) => state.user);
  const orders = useOrderStore((state) => state.orders);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("ALL");
  const visible = useMemo(
    () => visibleOrdersForUser(orders, user),
    [orders, user],
  );
  const filtered = visible.filter((order) => {
    if (status !== "ALL" && order.orderStatus !== status) return false;
    const query = search.trim().toLowerCase();
    if (!query) return true;
    return (
      order.orderNumber.toLowerCase().includes(query) ||
      order.items.some((item) =>
        item.eventTitleSnapshot.toLowerCase().includes(query),
      )
    );
  });

  if (!hydrated) {
    return (
      <div className="container-page section-space">
        <Skeleton className="h-12 w-1/3" />
        <div className="mt-8 space-y-3">
          {["one", "two", "three", "four"].map((key) => (
            <Skeleton key={key} className="h-24" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container-page section-space">
      <div className="max-w-2xl">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-strong">
          {t("nav.account")}
        </p>
        <h1 className="mt-3 font-display text-4xl font-semibold sm:text-5xl">
          {t("nav.orders")}
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-muted">
          {t("checkout.orderNote")}
        </p>
      </div>

      <div className="mt-7 flex max-w-xl flex-col gap-2 rounded-2xl border border-line bg-surface p-2 sm:flex-row">
        <div className="flex flex-1 items-center gap-2">
          <Search className="ml-2 size-4 text-muted" />
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder={t("common.search")}
            className="h-9 border-0 bg-transparent px-0 focus:border-0"
            aria-label={t("common.search")}
          />
        </div>
        <Select
          value={status}
          onChange={(event) => setStatus(event.target.value)}
          className="h-9 sm:w-48"
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
        <div className="mt-7 space-y-3">
          {filtered.map((order) => {
            const statusLabel =
              order.orderStatus === "CONFIRMED"
                ? t("common.confirmed")
                : order.orderStatus === "PENDING_PAYMENT"
                  ? t("common.pending")
                  : order.orderStatus === "PAYMENT_FAILED"
                    ? t("common.failed")
                    : t("common.cancelled");
            return (
              <Link
                key={order.id}
                href={`/orders/${order.id}`}
                className="group flex flex-col gap-4 rounded-3xl border border-line bg-surface p-5 transition-all hover:-translate-y-0.5 hover:border-brand/30 hover:shadow-soft sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-display text-lg font-semibold tabular">
                      {order.orderNumber}
                    </span>
                    <StatusBadge
                      status={order.orderStatus}
                      label={statusLabel}
                    />
                    <Badge variant="neutral">{order.items.length} item</Badge>
                  </div>
                  <p className="mt-1.5 text-xs text-muted">
                    {formatDateTime(order.createdAt, "Asia/Jakarta", locale)} ·{" "}
                    {order.paymentMethod}
                  </p>
                  <p className="mt-2 line-clamp-1 text-sm text-ink">
                    {order.items
                      .map((item) => item.eventTitleSnapshot)
                      .join(" · ")}
                  </p>
                </div>
                <div className="flex items-center justify-between gap-4 sm:flex-col sm:items-end">
                  <p className="font-display text-xl font-semibold tabular">
                    {formatIDR(order.total, locale)}
                  </p>
                  <span className="text-xs font-semibold text-brand-strong">
                    {t("common.viewOrder")}{" "}
                    <ArrowRight className="inline size-3.5" />
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      ) : (
        <EmptyState
          icon={ReceiptText}
          title={t("nav.orders")}
          body={t("tickets.emptyBody")}
          action={
            <Button asChild>
              <Link href="/events">{t("tickets.browseEvents")}</Link>
            </Button>
          }
        />
      )}
    </div>
  );
}
