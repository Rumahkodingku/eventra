"use client";

import { Download } from "lucide-react";
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
import { downloadCsv } from "@/lib/csv";
import { formatIDR, formatNumber, formatPercent } from "@/lib/currency";
import { useEventStore } from "@/stores/events";
import { useOrderStore } from "@/stores/orders";
import { usePreferencesStore } from "@/stores/preferences";

const ranges = [
  { key: "7", days: 7, labelKey: "organizer.last7" },
  { key: "30", days: 30, labelKey: "organizer.last30" },
  { key: "90", days: 90, labelKey: "organizer.last90" },
  { key: "all", days: 120, labelKey: "organizer.allTime" },
] as const;

export default function OrganizerAnalyticsPage() {
  const t = useTranslations();
  const hydrated = useHydrated();
  const locale = usePreferencesStore((state) => state.locale);
  const events = useEventStore((state) => state.events);
  const orders = useOrderStore((state) => state.orders);
  const tickets = useOrderStore((state) => state.tickets);
  const attendees = useOrderStore((state) => state.attendees);
  const [range, setRange] = useState<(typeof ranges)[number]["key"]>("30");
  const activeRange = ranges.find((item) => item.key === range) ?? ranges[1];
  const start = Date.now() - activeRange.days * 86_400_000;

  const confirmed = orders.filter(
    (order) =>
      order.orderStatus === "CONFIRMED" &&
      new Date(order.createdAt).getTime() >= start,
  );
  const revenue = confirmed.reduce((total, order) => total + order.total, 0);
  const sold = confirmed.reduce(
    (total, order) =>
      total + order.items.reduce((sum, item) => sum + item.quantity, 0),
    0,
  );
  const checkedIn = attendees.filter(
    (attendee) => attendee.checkInStatus === "CHECKED_IN",
  ).length;
  const checkedRate = attendees.length
    ? (checkedIn / attendees.length) * 100
    : 0;

  const trend = useMemo(() => {
    const buckets = new Map<string, number>();
    for (let index = activeRange.days - 1; index >= 0; index -= 1) {
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

  const eventRows = events
    .map((event) => {
      const eventOrders = confirmed.filter((order) =>
        order.items.some((item) => item.eventId === event.id),
      );
      const eventRevenue = eventOrders.reduce(
        (total, order) =>
          total +
          order.items
            .filter((item) => item.eventId === event.id)
            .reduce((sum, item) => sum + item.lineSubtotal, 0),
        0,
      );
      const eventTickets = tickets.filter(
        (ticket) => ticket.eventId === event.id,
      );
      const eventAttendees = attendees.filter((attendee) =>
        eventTickets.some((ticket) => ticket.id === attendee.ticketId),
      );
      const eventChecked = eventAttendees.filter(
        (attendee) => attendee.checkInStatus === "CHECKED_IN",
      ).length;
      return {
        event,
        revenue: eventRevenue,
        tickets: eventTickets.length,
        attendance: eventAttendees.length
          ? (eventChecked / eventAttendees.length) * 100
          : 0,
      };
    })
    .filter((row) => row.revenue > 0 || row.tickets > 0)
    .sort((a, b) => b.revenue - a.revenue);

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
      .slice(0, 5);
  }, [confirmed]);

  const exportCsv = () => {
    downloadCsv(
      "eventra-analytics.csv",
      [
        { key: "event", label: "Event" },
        { key: "revenue", label: "Revenue (IDR)" },
        { key: "tickets", label: "Tickets" },
        { key: "attendance", label: "Attendance (%)" },
      ],
      eventRows.map((row) => ({
        event: row.event.title,
        revenue: row.revenue,
        tickets: row.tickets,
        attendance: row.attendance.toFixed(1),
      })),
    );
  };

  if (!hydrated) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-20" />
        <Skeleton className="h-80" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-strong">
            {t("organizer.analytics")}
          </p>
          <h1 className="mt-2 font-display text-3xl font-semibold sm:text-4xl">
            {t("organizer.analyticsTitle")}
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
          <Button variant="outline" onClick={exportCsv}>
            <Download className="size-4" /> {t("organizer.export")}
          </Button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: t("organizer.sales"), value: formatIDR(revenue, locale) },
          {
            label: t("organizer.ticketsSold"),
            value: formatNumber(sold, locale),
          },
          {
            label: t("organizer.attendanceRate"),
            value: formatPercent(checkedRate, locale),
          },
          {
            label: t("organizer.activeEvents"),
            value: formatNumber(eventRows.length, locale),
          },
        ].map((stat) => (
          <div
            key={stat.label}
            className="rounded-3xl border border-line bg-surface p-5"
          >
            <p className="text-xs text-muted">{stat.label}</p>
            <p className="mt-3 font-display text-2xl font-semibold tabular">
              {stat.value}
            </p>
          </div>
        ))}
      </div>

      <div className="grid gap-5 xl:grid-cols-[1.4fr_1fr]">
        <div className="rounded-3xl border border-line bg-surface p-5">
          <h2 className="font-display text-xl font-semibold">
            {t("organizer.salesTrend")}
          </h2>
          <div className="mt-5 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={trend}
                margin={{ left: -20, right: 8, top: 8, bottom: 0 }}
              >
                <defs>
                  <linearGradient
                    id="analyticsFill"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
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
                  fill="url(#analyticsFill)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-3xl border border-line bg-surface p-5">
          <h2 className="font-display text-xl font-semibold">
            {t("organizer.ticketBreakdown")}
          </h2>
          <div className="mt-5 h-72">
            {ticketMix.length ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={ticketMix}
                  layout="vertical"
                  margin={{ left: 8, right: 12 }}
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

      <div>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-display text-xl font-semibold">
            {t("organizer.eventComparison")}
          </h2>
          <Badge variant="neutral">{eventRows.length} event</Badge>
        </div>
        <TableWrap>
          <Table>
            <THead>
              <TR>
                <TH>Event</TH>
                <TH>{t("organizer.sales")}</TH>
                <TH>{t("organizer.ticketsSold")}</TH>
                <TH>{t("organizer.attendanceRate")}</TH>
              </TR>
            </THead>
            <TBody>
              {eventRows.map((row) => (
                <TR key={row.event.id}>
                  <TD className="max-w-[300px] truncate font-semibold">
                    {row.event.title}
                  </TD>
                  <TD className="tabular">{formatIDR(row.revenue, locale)}</TD>
                  <TD className="tabular">
                    {formatNumber(row.tickets, locale)}
                  </TD>
                  <TD>
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 w-24 overflow-hidden rounded-full bg-surface-subtle">
                        <div
                          className="h-full rounded-full bg-brand"
                          style={{ width: `${row.attendance}%` }}
                        />
                      </div>
                      <span className="text-xs tabular">
                        {formatPercent(row.attendance, locale)}
                      </span>
                    </div>
                  </TD>
                </TR>
              ))}
            </TBody>
          </Table>
        </TableWrap>
      </div>

      <DemoNotice>{t("common.demoNotice")}</DemoNotice>
    </div>
  );
}
