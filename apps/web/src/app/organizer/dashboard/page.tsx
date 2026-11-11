"use client";

import {
  ArrowUpRight,
  CalendarDays,
  CircleDollarSign,
  Plus,
  Ticket,
  Users,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DemoNotice } from "@/components/ui/demo-notice";
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
import { cn } from "@/lib/cn";
import { formatIDR, formatNumber, formatPercent } from "@/lib/currency";
import { formatDateTime, formatShortDate } from "@/lib/dates";
import { useCatalog } from "@/services/hooks/use-catalog";
import { useEventStore } from "@/services/hooks/use-event-store";
import { useOrderStore } from "@/services/hooks/use-order-store";
import { useSessionStore } from "@/services/hooks/use-session-store";
import { usePreferencesStore } from "@/stores/preferences";

const ranges = [
  { key: "7", days: 7, labelKey: "organizer.last7" },
  { key: "30", days: 30, labelKey: "organizer.last30" },
  { key: "90", days: 90, labelKey: "organizer.last90" },
  { key: "all", days: 120, labelKey: "organizer.allTime" },
] as const;

export default function OrganizerDashboardPage() {
  const t = useTranslations();
  const { venues } = useCatalog();
  const hydrated = useHydrated();
  const locale = usePreferencesStore((state) => state.locale);
  const user = useSessionStore((state) => state.user);
  const events = useEventStore((state) => state.events);
  const orders = useOrderStore((state) => state.orders);
  const attendees = useOrderStore((state) => state.attendees);
  const [range, setRange] = useState<(typeof ranges)[number]["key"]>("30");
  const activeRange = ranges.find((item) => item.key === range) ?? ranges[1];
  const startTime = Date.now() - activeRange.days * 86_400_000;

  const confirmed = useMemo(
    () =>
      orders.filter(
        (order) =>
          order.orderStatus === "CONFIRMED" &&
          new Date(order.createdAt).getTime() >= startTime,
      ),
    [orders, startTime],
  );

  const gross = confirmed.reduce((total, order) => total + order.total, 0);
  const ticketsSold = confirmed.reduce(
    (total, order) =>
      total + order.items.reduce((sum, item) => sum + item.quantity, 0),
    0,
  );
  const activeEvents = events.filter(
    (event) => event.status === "PUBLISHED",
  ).length;
  const attendeeCount = attendees.filter((attendee) =>
    confirmed.some((order) => order.id === attendee.orderId),
  ).length;

  const trend = useMemo(() => {
    const days = activeRange.days;
    const buckets = new Map<string, number>();
    for (let index = days - 1; index >= 0; index -= 1) {
      const date = new Date(Date.now() - index * 86_400_000);
      buckets.set(date.toISOString().slice(0, 10), 0);
    }
    confirmed.forEach((order) => {
      const key = new Date(order.createdAt).toISOString().slice(0, 10);
      if (buckets.has(key))
        buckets.set(key, (buckets.get(key) ?? 0) + order.total);
    });
    return [...buckets.entries()].map(([date, value]) => ({
      date: new Date(date).toLocaleDateString(
        locale === "id" ? "id-ID" : "en-GB",
        { day: "2-digit", month: "short" },
      ),
      value,
    }));
  }, [confirmed, activeRange.days, locale]);

  const ticketMix = useMemo(() => {
    const map = new Map<string, number>();
    confirmed.forEach((order) => {
      order.items.forEach((item) => {
        map.set(
          item.ticketNameSnapshot,
          (map.get(item.ticketNameSnapshot) ?? 0) + item.quantity,
        );
      });
    });
    return [...map.entries()]
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 6);
  }, [confirmed]);

  const recentOrders = [...orders]
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    )
    .slice(0, 5);
  const upcoming = events
    .filter((event) => new Date(event.startAt).getTime() >= Date.now())
    .sort(
      (a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime(),
    )
    .slice(0, 4);
  const checkInRate = attendeeCount
    ? Math.round(
        (attendees.filter((attendee) => attendee.checkInStatus === "CHECKED_IN")
          .length /
          attendeeCount) *
          100,
      )
    : 0;

  if (!hydrated) {
    return (
      <div className="space-y-5">
        <Skeleton className="h-24" />
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {["one", "two", "three", "four"].map((key) => (
            <Skeleton key={key} className="h-32" />
          ))}
        </div>
        <Skeleton className="h-80" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-strong">
            {t("organizer.overview")}
          </p>
          <h1 className="mt-2 font-display text-3xl font-semibold sm:text-4xl">
            {t("organizer.welcome", { name: user?.name.split(" ")[0] ?? "" })}
          </h1>
          <p className="mt-2 text-sm text-muted">{t("organizer.subtitle")}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex rounded-full border border-line bg-surface p-1">
            {ranges.map((item) => (
              <button
                key={item.key}
                type="button"
                onClick={() => setRange(item.key)}
                className={cn(
                  "rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
                  range === item.key
                    ? "bg-ink text-canvas"
                    : "text-muted hover:text-ink",
                )}
              >
                {t(item.labelKey)}
              </button>
            ))}
          </div>
          <Button asChild>
            <Link href="/organizer/events/new">
              <Plus className="size-4" /> {t("organizer.createEvent")}
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          {
            label: t("organizer.sales"),
            value: formatIDR(gross, locale),
            icon: CircleDollarSign,
            hint: t("common.paid"),
          },
          {
            label: t("organizer.ticketsSold"),
            value: formatNumber(ticketsSold, locale),
            icon: Ticket,
            hint: `${checkInRate}% ${t("organizer.attendanceRate").toLowerCase()}`,
          },
          {
            label: t("organizer.activeEvents"),
            value: formatNumber(activeEvents, locale),
            icon: CalendarDays,
            hint: `${events.length} total event`,
          },
          {
            label: t("organizer.attendeesCount"),
            value: formatNumber(attendeeCount, locale),
            icon: Users,
            hint: `${formatPercent(checkInRate, locale)} check-in`,
          },
        ].map((stat) => (
          <div
            key={stat.label}
            className="rounded-3xl border border-line bg-surface p-5"
          >
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium text-muted">{stat.label}</p>
              <span className="grid size-9 place-items-center rounded-xl bg-brand-soft text-brand-strong">
                <stat.icon className="size-4" />
              </span>
            </div>
            <p className="mt-4 font-display text-3xl font-semibold tabular">
              {stat.value}
            </p>
            <p className="mt-1 text-xs text-muted">{stat.hint}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-5 xl:grid-cols-[1.5fr_1fr]">
        <div className="rounded-3xl border border-line bg-surface p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="font-display text-xl font-semibold">
                {t("organizer.salesTrend")}
              </h2>
              <p className="mt-1 text-xs text-muted">
                {t("organizer.subtitle")}
              </p>
            </div>
            <Badge variant="success">{t("common.paid")}</Badge>
          </div>
          <div className="mt-6 h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={trend}
                margin={{ left: -20, right: 8, top: 8, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="salesFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#7357F6" stopOpacity={0.35} />
                    <stop
                      offset="100%"
                      stopColor="#7357F6"
                      stopOpacity={0.02}
                    />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="var(--line)"
                  vertical={false}
                />
                <XAxis
                  dataKey="date"
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 10, fill: "var(--muted)" }}
                  interval="preserveStartEnd"
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 10, fill: "var(--muted)" }}
                  tickFormatter={(value) =>
                    `${Math.round(Number(value) / 1000)}k`
                  }
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: 12,
                    border: "1px solid var(--line)",
                    background: "var(--surface)",
                    color: "var(--ink)",
                    fontSize: 12,
                  }}
                  formatter={(value) => formatIDR(Number(value), locale)}
                />
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke="#7357F6"
                  strokeWidth={2.5}
                  fill="url(#salesFill)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-3xl border border-line bg-surface p-5">
          <h2 className="font-display text-xl font-semibold">
            {t("organizer.ticketBreakdown")}
          </h2>
          <div className="mt-4 h-64 w-full">
            {ticketMix.length ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={ticketMix}
                  layout="vertical"
                  margin={{ left: 8, right: 12, top: 8, bottom: 0 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="var(--line)"
                    horizontal={false}
                  />
                  <XAxis
                    type="number"
                    tickLine={false}
                    axisLine={false}
                    tick={{ fontSize: 10, fill: "var(--muted)" }}
                  />
                  <YAxis
                    type="category"
                    dataKey="name"
                    width={90}
                    tickLine={false}
                    axisLine={false}
                    tick={{ fontSize: 10, fill: "var(--muted)" }}
                  />
                  <Tooltip
                    contentStyle={{
                      borderRadius: 12,
                      border: "1px solid var(--line)",
                      background: "var(--surface)",
                      color: "var(--ink)",
                      fontSize: 12,
                    }}
                  />
                  <Bar dataKey="value" radius={[0, 6, 6, 0]}>
                    {ticketMix.map((entry, index) => (
                      <Cell
                        key={entry.name}
                        fill={index % 2 === 0 ? "#7357F6" : "#C7F36B"}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="grid h-full place-items-center text-sm text-muted">
                {t("common.noResults")}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid gap-5 xl:grid-cols-[1.25fr_1fr]">
        <div className="min-w-0">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-display text-xl font-semibold">
              {t("organizer.recentOrders")}
            </h2>
            <Button asChild variant="ghost" size="sm">
              <Link href="/organizer/orders">
                {t("common.viewAll")} <ArrowUpRight className="size-3.5" />
              </Link>
            </Button>
          </div>
          <TableWrap>
            <Table>
              <THead>
                <TR>
                  <TH>{t("organizer.orderNumber")}</TH>
                  <TH>{t("organizer.buyer")}</TH>
                  <TH>{t("organizer.total")}</TH>
                  <TH>{t("common.status")}</TH>
                </TR>
              </THead>
              <TBody>
                {recentOrders.map((order) => (
                  <TR key={order.id}>
                    <TD>
                      <Link
                        href={`/organizer/orders/${order.id}`}
                        className="font-semibold hover:text-brand-strong"
                      >
                        {order.orderNumber}
                      </Link>
                      <span className="mt-0.5 block text-[11px] text-muted">
                        {formatDateTime(
                          order.createdAt,
                          "Asia/Jakarta",
                          locale,
                        )}
                      </span>
                    </TD>
                    <TD>
                      <span className="text-sm">{order.buyer.name}</span>
                      <span className="mt-0.5 block text-[11px] text-muted">
                        {order.items[0]?.eventTitleSnapshot}
                      </span>
                    </TD>
                    <TD className="font-semibold tabular">
                      {formatIDR(order.total, locale)}
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
        </div>

        <div className="min-w-0">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-display text-xl font-semibold">
              {t("organizer.upcomingEvents")}
            </h2>
            <Button asChild variant="ghost" size="sm">
              <Link href="/organizer/events">
                {t("common.viewAll")} <ArrowUpRight className="size-3.5" />
              </Link>
            </Button>
          </div>
          <div className="space-y-3">
            {upcoming.map((event) => {
              const venue = venues.find((item) => item.id === event.venueId);
              const sold = event.ticketTypes.reduce(
                (total, ticket) => total + ticket.soldCount,
                0,
              );
              const quota = event.ticketTypes.reduce(
                (total, ticket) => total + ticket.quota,
                0,
              );
              return (
                <Link
                  key={event.id}
                  href={`/organizer/events/${event.id}`}
                  className="group flex items-center gap-3 rounded-2xl border border-line bg-surface p-3.5 transition-colors hover:border-brand/30"
                >
                  <div className="relative size-14 shrink-0 overflow-hidden rounded-xl">
                    <Image
                      src={event.coverImage}
                      alt=""
                      fill
                      sizes="56px"
                      className="object-cover"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold group-hover:text-brand-strong">
                      {event.title}
                    </p>
                    <p className="mt-0.5 text-[11px] text-muted">
                      {formatShortDate(event.startAt, event.timezone, locale)} ·{" "}
                      {venue?.city}
                    </p>
                    <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-surface-subtle">
                      <div
                        className="h-full rounded-full bg-brand"
                        style={{
                          width: `${quota ? Math.round((sold / quota) * 100) : 0}%`,
                        }}
                      />
                    </div>
                  </div>
                  <p className="shrink-0 text-xs font-semibold tabular">
                    {sold}/{quota}
                  </p>
                </Link>
              );
            })}
          </div>
        </div>
      </div>

      <DemoNotice>{t("common.demoNotice")}</DemoNotice>
    </div>
  );
}
