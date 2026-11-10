"use client";

import {
  ArrowRight,
  CircleAlert,
  Clock3,
  Compass,
  RotateCcw,
} from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DemoNotice } from "@/components/ui/demo-notice";
import { EmptyState } from "@/components/ui/empty-state";
import { cn } from "@/lib/cn";
import { formatIDR } from "@/lib/currency";
import { formatDateTime } from "@/lib/dates";
import { useOrderStore } from "@/stores/orders";
import { usePreferencesStore } from "@/stores/preferences";

export function OrderResult() {
  const t = useTranslations();
  const params = useParams<{ orderId: string }>();
  const locale = usePreferencesStore((state) => state.locale);
  const order = useOrderStore((state) =>
    state.orders.find((item) => item.id === params.orderId),
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
              <Link href="/events">{t("nav.events")}</Link>
            </Button>
          }
        />
      </div>
    );
  }

  const failed = order.orderStatus === "PAYMENT_FAILED";
  const pending = order.orderStatus === "PENDING_PAYMENT";

  return (
    <div className="container-page section-space">
      <div className="mx-auto max-w-2xl text-center">
        <span
          className={cn(
            "mx-auto grid size-16 place-items-center rounded-3xl",
            failed
              ? "bg-danger/10 text-danger"
              : pending
                ? "bg-warning/10 text-warning-text"
                : "bg-success/10 text-success",
          )}
        >
          {failed ? (
            <CircleAlert className="size-7" />
          ) : (
            <Clock3 className="size-7" />
          )}
        </span>
        <h1 className="mt-6 font-display text-4xl font-semibold sm:text-5xl">
          {failed ? t("checkout.failureTitle") : t("checkout.processing")}
        </h1>
        <p className="mx-auto mt-3 max-w-lg text-sm leading-relaxed text-muted">
          {failed
            ? t("checkout.failureBody")
            : "Pembayaran simulasi sedang diproses. Halaman ini dapat dimuat ulang."}
        </p>
        <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-line bg-surface px-4 py-2 text-xs">
          <span className="text-muted">{t("checkout.orderNumber")}</span>
          <span className="font-semibold tabular">{order.orderNumber}</span>
          <Badge variant={failed ? "danger" : "warning"}>
            {failed ? t("common.failed") : t("common.pending")}
          </Badge>
        </div>
      </div>

      <div className="mx-auto mt-8 max-w-2xl rounded-3xl border border-line bg-surface p-5 shadow-soft">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line pb-4 text-xs text-muted">
          <span>{formatDateTime(order.createdAt, "Asia/Jakarta", locale)}</span>
          <span>{order.paymentMethod}</span>
        </div>
        <div className="space-y-3 py-4">
          {order.items.map((item) => (
            <div
              key={item.id}
              className="flex items-start justify-between gap-4"
            >
              <div>
                <p className="text-sm font-semibold">
                  {item.eventTitleSnapshot}
                </p>
                <p className="mt-0.5 text-xs text-muted">
                  {item.ticketNameSnapshot} · {item.quantity} tiket
                </p>
              </div>
              <p className="shrink-0 text-sm font-semibold tabular">
                {formatIDR(item.lineSubtotal, locale)}
              </p>
            </div>
          ))}
        </div>
        <div className="flex items-center justify-between border-t border-line pt-4 font-semibold">
          <span>{t("cart.total")}</span>
          <span className="font-display text-2xl tabular">
            {formatIDR(order.total, locale)}
          </span>
        </div>
      </div>

      <div className="mx-auto mt-6 flex max-w-2xl flex-col gap-3 sm:flex-row">
        {failed ? (
          <>
            <Button asChild className="flex-1" size="lg">
              <Link href="/checkout">
                <RotateCcw className="size-4" /> {t("checkout.retry")}
              </Link>
            </Button>
            <Button asChild variant="outline" className="flex-1" size="lg">
              <Link href="/cart">
                {t("checkout.backToCart")} <ArrowRight className="size-4" />
              </Link>
            </Button>
          </>
        ) : (
          <Button asChild className="flex-1" size="lg">
            <Link href={`/checkout/success/${order.id}`}>
              {t("checkout.viewTickets")}
            </Link>
          </Button>
        )}
      </div>
      <DemoNotice className="mx-auto mt-6 max-w-2xl">
        {t("common.simulationNotice")}
      </DemoNotice>
    </div>
  );
}
