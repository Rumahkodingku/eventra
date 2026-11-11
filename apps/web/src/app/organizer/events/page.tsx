"use client";

import {
  CalendarDays,
  Edit3,
  Plus,
  Search,
  Settings2,
  Trash2,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader } from "@/components/ui/dialog";
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
import { formatShortDate } from "@/lib/dates";
import { useCatalog } from "@/services/hooks/use-catalog";
import { useEventStore } from "@/services/hooks/use-event-store";
import { usePreferencesStore } from "@/stores/preferences";

export default function OrganizerEventsPage() {
  const t = useTranslations();
  const { venues } = useCatalog();
  const hydrated = useHydrated();
  const locale = usePreferencesStore((state) => state.locale);
  const events = useEventStore((state) => state.events);
  const deleteEvent = useEventStore((state) => state.deleteEvent);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("ALL");
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [visibleCount, setVisibleCount] = useState(10);

  const filtered = useMemo(
    () =>
      events.filter((event) => {
        if (status !== "ALL" && event.status !== status) return false;
        const query = search.trim().toLowerCase();
        if (!query) return true;
        return event.title.toLowerCase().includes(query);
      }),
    [events, search, status],
  );

  const visible = filtered.slice(0, visibleCount);

  if (!hydrated) {
    return (
      <div className="space-y-5">
        <Skeleton className="h-20" />
        <Skeleton className="h-96" />
      </div>
    );
  }

  const statusLabel = (value: string) =>
    value === "DRAFT"
      ? t("organizer.draft")
      : value === "PUBLISHED"
        ? t("organizer.published")
        : value === "PAUSED"
          ? t("organizer.paused")
          : value === "ENDED"
            ? t("organizer.ended")
            : t("organizer.cancelled");

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-strong">
            {t("organizer.events")}
          </p>
          <h1 className="mt-2 font-display text-3xl font-semibold sm:text-4xl">
            {t("organizer.events")}
          </h1>
          <p className="mt-2 text-sm text-muted">
            {events.length} event ·{" "}
            {events.filter((event) => event.status === "PUBLISHED").length}{" "}
            published
          </p>
        </div>
        <Button asChild>
          <Link href="/organizer/events/new">
            <Plus className="size-4" /> {t("organizer.createEvent")}
          </Link>
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
          className="sm:w-48"
          aria-label={t("common.status")}
        >
          <option value="ALL">{t("common.all")}</option>
          <option value="DRAFT">{t("organizer.draft")}</option>
          <option value="PUBLISHED">{t("organizer.published")}</option>
          <option value="PAUSED">{t("organizer.paused")}</option>
          <option value="ENDED">{t("organizer.ended")}</option>
          <option value="CANCELLED">{t("organizer.cancelled")}</option>
        </Select>
      </div>

      {filtered.length ? (
        <TableWrap>
          <Table>
            <THead>
              <TR>
                <TH>Event</TH>
                <TH>{t("common.date")}</TH>
                <TH>Venue</TH>
                <TH>{t("common.status")}</TH>
                <TH>Tiket</TH>
                <TH className="text-right">{t("common.actions")}</TH>
              </TR>
            </THead>
            <TBody>
              {visible.map((event) => {
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
                  <TR key={event.id}>
                    <TD>
                      <div className="flex items-center gap-3">
                        <div className="relative size-12 shrink-0 overflow-hidden rounded-xl">
                          <Image
                            src={event.coverImage}
                            alt=""
                            fill
                            sizes="48px"
                            className="object-cover"
                          />
                        </div>
                        <div className="min-w-0">
                          <Link
                            href={`/organizer/events/${event.id}`}
                            className="block max-w-[260px] truncate font-semibold hover:text-brand-strong"
                          >
                            {event.title}
                          </Link>
                          <span className="mt-0.5 block text-[11px] text-muted">
                            {event.subcategory} ·{" "}
                            {event.ticketingMode.replaceAll("_", " ")}
                          </span>
                        </div>
                      </div>
                    </TD>
                    <TD className="whitespace-nowrap text-xs">
                      <span className="inline-flex items-center gap-1.5">
                        <CalendarDays className="size-3.5 text-muted" />
                        {formatShortDate(event.startAt, event.timezone, locale)}
                      </span>
                    </TD>
                    <TD className="text-xs">{venue?.city}</TD>
                    <TD>
                      <StatusBadge
                        status={event.status}
                        label={statusLabel(event.status)}
                      />
                    </TD>
                    <TD className="text-xs tabular">
                      {sold}/{quota}
                    </TD>
                    <TD>
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          asChild
                          variant="ghost"
                          size="icon-sm"
                          aria-label={t("common.edit")}
                        >
                          <Link href={`/organizer/events/${event.id}/edit`}>
                            <Edit3 className="size-4" />
                          </Link>
                        </Button>
                        <Button
                          asChild
                          variant="ghost"
                          size="icon-sm"
                          aria-label={t("organizer.ticketConfig")}
                        >
                          <Link href={`/organizer/events/${event.id}/tickets`}>
                            <Settings2 className="size-4" />
                          </Link>
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          className="text-danger hover:bg-danger/10 hover:text-danger"
                          onClick={() => setDeleteId(event.id)}
                          aria-label={t("organizer.deleteEvent")}
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </div>
                    </TD>
                  </TR>
                );
              })}
            </TBody>
          </Table>
        </TableWrap>
      ) : null}

      {filtered.length > visibleCount ? (
        <div className="flex justify-center">
          <Button
            variant="outline"
            onClick={() => setVisibleCount((count) => count + 10)}
          >
            {t("events.loadMore")}
          </Button>
        </div>
      ) : null}

      {filtered.length === 0 ? (
        <EmptyState
          icon={CalendarDays}
          title={t("events.noResultsTitle")}
          body={t("events.noResultsBody")}
          action={
            <Button asChild>
              <Link href="/organizer/events/new">
                <Plus className="size-4" /> {t("organizer.createEvent")}
              </Link>
            </Button>
          }
        />
      ) : null}

      <Dialog
        open={Boolean(deleteId)}
        onOpenChange={(open) => !open && setDeleteId(null)}
      >
        <DialogContent>
          <DialogHeader
            title={t("organizer.deleteConfirm")}
            description={t("organizer.deleteBody")}
          />
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setDeleteId(null)}>
              {t("common.cancel")}
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (!deleteId) return;
                deleteEvent(deleteId);
                setDeleteId(null);
                toast.success(t("organizer.deleteSuccess"));
              }}
            >
              <Trash2 className="size-4" /> {t("common.delete")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
