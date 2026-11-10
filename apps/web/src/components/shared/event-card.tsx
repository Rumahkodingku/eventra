"use client";

import { ArrowUpRight, CalendarDays, Heart, MapPin } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { venues } from "@/data/seed/catalog";
import type { Event } from "@/domain/types";
import { cn } from "@/lib/cn";
import { formatIDR } from "@/lib/currency";
import { formatShortDate, formatTime } from "@/lib/dates";
import { getStartingPrice, getTicketAvailability } from "@/lib/pricing";
import { usePreferencesStore } from "@/stores/preferences";
import { useWishlistStore } from "@/stores/wishlist";

export function WishlistButton({
  eventId,
  className,
  compact = false,
}: {
  eventId: string;
  className?: string;
  compact?: boolean;
}) {
  const t = useTranslations();
  const eventIds = useWishlistStore((state) => state.eventIds);
  const toggle = useWishlistStore((state) => state.toggle);
  const active = eventIds.includes(eventId);
  return (
    <button
      type="button"
      onClick={(event) => {
        event.preventDefault();
        event.stopPropagation();
        toggle(eventId);
        toast.success(
          active ? t("event.wishlistRemove") : t("event.wishlistAdd"),
        );
      }}
      className={cn(
        "grid place-items-center rounded-full border border-white/20 bg-midnight/45 text-paper backdrop-blur-md transition-all duration-200 hover:scale-105 hover:bg-midnight/70",
        compact ? "size-9" : "size-10",
        active && "border-lime/50 bg-lime text-midnight",
        className,
      )}
      aria-label={active ? t("event.wishlistRemove") : t("event.wishlistAdd")}
      aria-pressed={active}
    >
      <Heart className={cn("size-4", active && "fill-current")} />
    </button>
  );
}

export function EventCard({
  event,
  variant = "default",
  className,
  priority = false,
}: {
  event: Event;
  variant?: "default" | "compact" | "featured" | "list";
  className?: string;
  priority?: boolean;
}) {
  const t = useTranslations();
  const locale = usePreferencesStore((state) => state.locale);
  const venue = venues.find((item) => item.id === event.venueId);
  const startingPrice = getStartingPrice(event);
  const soldOut = !event.ticketTypes.some(
    (ticket) => getTicketAvailability(ticket).available,
  );

  if (variant === "featured") {
    return (
      <article
        className={cn(
          "group relative overflow-hidden rounded-[2rem] bg-midnight",
          className,
        )}
      >
        <Link href={`/events/${event.slug}`} className="block">
          <div className="relative aspect-[4/3] overflow-hidden">
            <Image
              src={event.coverImage}
              alt={event.title}
              fill
              sizes="(max-width: 768px) 100vw, 40vw"
              className="image-zoom object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-midnight via-midnight/20 to-transparent" />
            <div className="absolute left-5 top-5 flex flex-wrap gap-2">
              <Badge variant="dark">{event.subcategory}</Badge>
              {event.limitedAvailability ? (
                <Badge variant="lime">{t("common.limited")}</Badge>
              ) : null}
            </div>
            <div className="absolute bottom-0 left-0 right-0 p-6 text-paper sm:p-8">
              <p className="flex items-center gap-2 text-xs text-paper/65">
                <CalendarDays className="size-3.5" />
                {formatShortDate(event.startAt, event.timezone, locale)}
                <span className="size-1 rounded-full bg-paper/30" />
                {formatTime(event.startAt, event.timezone, locale)}
              </p>
              <h3 className="mt-3 max-w-lg font-display text-3xl font-semibold leading-[1.02] text-paper sm:text-4xl">
                {event.title}
              </h3>
              <div className="mt-4 flex items-end justify-between gap-4">
                <div>
                  <p className="flex items-center gap-1.5 text-xs text-paper/60">
                    <MapPin className="size-3.5" />
                    {venue?.name} · {venue?.city}
                  </p>
                  <p className="mt-2 text-sm font-semibold text-lime">
                    {t("common.from")} {formatIDR(startingPrice, locale)}
                  </p>
                </div>
                <span className="grid size-11 shrink-0 place-items-center rounded-full border border-paper/20 text-paper transition-colors group-hover:border-lime group-hover:bg-lime group-hover:text-midnight">
                  <ArrowUpRight className="size-5" />
                </span>
              </div>
            </div>
          </div>
        </Link>
        <WishlistButton eventId={event.id} className="absolute right-5 top-5" />
      </article>
    );
  }

  if (variant === "list") {
    return (
      <article
        className={cn(
          "group relative flex flex-col gap-5 rounded-3xl border border-line bg-surface p-4 transition-transform duration-300 hover:-translate-y-1 sm:flex-row sm:items-center",
          className,
        )}
      >
        <Link
          href={`/events/${event.slug}`}
          className="relative aspect-[4/3] w-full shrink-0 overflow-hidden rounded-2xl bg-surface-subtle sm:w-56"
        >
          <Image
            src={event.coverImage}
            alt={event.title}
            fill
            priority={priority}
            sizes="(max-width: 640px) 100vw, 224px"
            className="image-zoom object-cover"
          />
        </Link>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="brand">{event.subcategory}</Badge>
            {soldOut ? (
              <Badge variant="danger">{t("common.soldOut")}</Badge>
            ) : null}
          </div>
          <Link href={`/events/${event.slug}`} className="mt-3 block">
            <h3 className="font-display text-xl font-semibold leading-tight text-ink transition-colors group-hover:text-brand-strong">
              {event.title}
            </h3>
          </Link>
          <p className="mt-2 flex flex-wrap items-center gap-3 text-xs text-muted">
            <span className="flex items-center gap-1.5">
              <CalendarDays className="size-3.5" />
              {formatShortDate(event.startAt, event.timezone, locale)}
            </span>
            <span className="flex items-center gap-1.5">
              <MapPin className="size-3.5" />
              {venue?.city}
            </span>
          </p>
        </div>
        <div className="flex items-center justify-between gap-4 border-t border-line pt-4 sm:flex-col sm:items-end sm:border-t-0 sm:pt-0">
          <div className="text-right">
            <p className="text-[10px] uppercase tracking-[0.14em] text-muted">
              {t("common.from")}
            </p>
            <p className="mt-1 text-sm font-semibold text-ink">
              {formatIDR(startingPrice, locale)}
            </p>
          </div>
          <WishlistButton eventId={event.id} compact />
        </div>
      </article>
    );
  }

  return (
    <article className={cn("group relative", className)}>
      <Link href={`/events/${event.slug}`} className="block">
        <div className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-surface-subtle">
          <Image
            src={event.coverImage}
            alt={event.title}
            fill
            priority={priority}
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="image-zoom object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-midnight/40 via-transparent to-transparent opacity-70" />
          <div className="absolute left-3 top-3 flex flex-wrap gap-2">
            <Badge variant="dark">{event.subcategory}</Badge>
            {event.limitedAvailability ? (
              <Badge variant="lime">{t("common.limited")}</Badge>
            ) : null}
          </div>
          {soldOut ? (
            <div className="absolute inset-0 grid place-items-center bg-midnight/55">
              <Badge variant="dark" className="px-4 py-2 text-xs">
                {t("common.soldOut")}
              </Badge>
            </div>
          ) : null}
          <div className="absolute bottom-3 left-3 rounded-xl bg-surface/95 px-2.5 py-1.5 text-[11px] font-semibold text-ink shadow-sm backdrop-blur">
            {formatShortDate(event.startAt, event.timezone, locale)}
          </div>
        </div>
        <div className="pt-3">
          <div className="flex items-start justify-between gap-3">
            <h3 className="line-clamp-2 font-display text-lg font-semibold leading-tight text-ink transition-colors group-hover:text-brand-strong">
              {event.title}
            </h3>
            <ArrowUpRight className="mt-1 size-4 shrink-0 text-muted transition-transform duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-brand-strong" />
          </div>
          <p className="mt-1.5 flex items-center gap-1.5 text-xs text-muted">
            <MapPin className="size-3.5" />
            {venue?.name} · {venue?.city}
          </p>
          <p className="mt-2 text-sm font-semibold text-ink">
            {t("common.from")}{" "}
            <span className="tabular">{formatIDR(startingPrice, locale)}</span>
          </p>
        </div>
      </Link>
      <WishlistButton
        eventId={event.id}
        className="absolute right-3 top-3"
        compact
      />
    </article>
  );
}
