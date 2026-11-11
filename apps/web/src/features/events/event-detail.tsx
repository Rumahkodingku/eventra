"use client";

import {
  Accessibility,
  CalendarDays,
  CalendarPlus,
  Check,
  Clock3,
  Compass,
  Heart,
  MapPin,
  Share2,
  ShieldCheck,
  Star,
  Ticket,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { EventCard } from "@/components/shared/event-card";
import { OrganizerMonogram } from "@/components/shared/organizer-monogram";
import { Badge } from "@/components/ui/badge";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { Button } from "@/components/ui/button";
import { DemoNotice } from "@/components/ui/demo-notice";
import { EmptyState } from "@/components/ui/empty-state";
import { ownsTicketForEvent } from "@/lib/access";
import { downloadIcs } from "@/lib/calendar";
import { cn } from "@/lib/cn";
import { formatIDR } from "@/lib/currency";
import {
  formatDateTime,
  formatEventDate,
  formatTime,
  getTimezoneLabel,
} from "@/lib/dates";
import {
  getEventSalesEnd,
  getStartingPrice,
  getTicketAvailability,
  isEventPurchasable,
} from "@/lib/pricing";
import { useCatalog } from "@/services/hooks/use-catalog";
import { useEventStore } from "@/services/hooks/use-event-store";
import { useOrderStore } from "@/services/hooks/use-order-store";
import { useReviewStore } from "@/services/hooks/use-review-store";
import { useSessionStore } from "@/services/hooks/use-session-store";
import { useWishlistStore } from "@/services/hooks/use-wishlist-store";
import { usePreferencesStore } from "@/stores/preferences";
import { useRecentStore } from "@/stores/recent";

export function EventDetail() {
  const t = useTranslations();
  const { categories, organizers, venues } = useCatalog();
  const params = useParams<{ slug: string }>();
  const events = useEventStore((state) => state.events);
  const addView = useRecentStore((state) => state.addView);
  const wishlistIds = useWishlistStore((state) => state.eventIds);
  const toggleWishlist = useWishlistStore((state) => state.toggle);
  const locale = usePreferencesStore((state) => state.locale);
  const user = useSessionStore((state) => state.user);
  const orders = useOrderStore((state) => state.orders);
  const tickets = useOrderStore((state) => state.tickets);
  const reviews = useReviewStore((state) => state.reviews);
  const addReview = useReviewStore((state) => state.addReview);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [reviewSort, setReviewSort] = useState<"newest" | "highest">("newest");
  const [reviewFilter, setReviewFilter] = useState<"all" | number>("all");

  const event = events.find((item) => item.slug === params.slug);
  const venue = event
    ? venues.find((item) => item.id === event.venueId)
    : undefined;
  const category = event
    ? categories.find((item) => item.id === event.categoryId)
    : undefined;
  const organizer = event
    ? organizers.find((item) => item.id === event.organizerId)
    : undefined;
  const eventReviews = useMemo(
    () =>
      event ? reviews.filter((review) => review.eventId === event.id) : [],
    [reviews, event],
  );
  const averageRating = eventReviews.length
    ? eventReviews.reduce((total, review) => total + review.rating, 0) /
      eventReviews.length
    : 0;
  const sortedReviews = useMemo(
    () =>
      [...eventReviews].sort((a, b) =>
        reviewSort === "highest"
          ? b.rating - a.rating
          : new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      ),
    [eventReviews, reviewSort],
  );
  const filteredReviews =
    reviewFilter === "all"
      ? sortedReviews
      : sortedReviews.filter((review) => review.rating === reviewFilter);
  const eligible = event
    ? ownsTicketForEvent(event.id, tickets, orders, user)
    : false;
  const related = event
    ? events
        .filter(
          (item) =>
            item.id !== event.id &&
            item.categoryId === event.categoryId &&
            item.status === "PUBLISHED",
        )
        .slice(0, 3)
    : [];

  useEffect(() => {
    if (event) addView(event.id);
  }, [event, addView]);

  if (!event) {
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

  const salesEnd = getEventSalesEnd(event);
  const purchasable = isEventPurchasable(event);
  const wishlisted = wishlistIds.includes(event.id);
  const statusMessage =
    event.status === "PAUSED"
      ? t("event.paused")
      : event.status === "CANCELLED"
        ? t("event.cancelled")
        : event.status === "ENDED"
          ? t("event.ended")
          : event.status === "DRAFT"
            ? t("event.draft")
            : !purchasable.purchasable
              ? t("event.soldOut")
              : undefined;

  const share = async () => {
    const url = window.location.href;
    try {
      if (navigator.share) {
        await navigator.share({ title: event.title, url });
      } else {
        await navigator.clipboard.writeText(url);
        toast.success(t("common.copied"));
      }
    } catch {
      // A cancelled share is not an error the user needs to see.
    }
  };

  return (
    <div>
      <section className="relative isolate overflow-hidden bg-midnight text-paper">
        <Image
          src={event.coverImage}
          alt={event.title}
          fill
          priority
          sizes="100vw"
          className="object-cover opacity-55"
        />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(17,19,24,0.96),rgba(17,19,24,0.55)_55%,rgba(17,19,24,0.25))]" />
        <div className="absolute inset-0 bg-gradient-to-t from-midnight via-transparent to-midnight/20" />
        <div className="container-page relative py-14 lg:py-20">
          <Breadcrumbs
            invert
            items={[
              { label: t("nav.events"), href: "/events" },
              ...(category
                ? [
                    {
                      label: category.name,
                      href: `/categories/${category.slug}`,
                    },
                  ]
                : []),
              { label: event.title },
            ]}
          />
          <div className="mt-8 flex flex-wrap gap-2">
            <Badge variant="lime">{event.subcategory}</Badge>
            <Badge variant="dark" className="border-white/10 bg-white/5">
              {event.ticketingMode === "GENERAL_ADMISSION"
                ? t("event.modeGeneral")
                : event.ticketingMode === "RESERVED_SEATING"
                  ? t("event.modeReserved")
                  : t("event.modeHybrid")}
            </Badge>
            {event.limitedAvailability ? (
              <Badge variant="warning">{t("common.limited")}</Badge>
            ) : null}
          </div>
          <h1 className="mt-5 max-w-4xl font-display text-[clamp(2.5rem,6vw,5.5rem)] font-semibold leading-[0.95] tracking-[-0.05em]">
            {event.title}
          </h1>
          <div className="mt-7 flex flex-wrap items-center gap-x-6 gap-y-3 text-sm text-paper/70">
            <span className="inline-flex items-center gap-2">
              <CalendarDays className="size-4 text-lime" />
              {formatEventDate(event.startAt, event.timezone, locale)}
            </span>
            <span className="inline-flex items-center gap-2">
              <Clock3 className="size-4 text-lime" />
              {formatTime(event.startAt, event.timezone, locale)}{" "}
              {getTimezoneLabel(event.timezone)}
            </span>
            <span className="inline-flex items-center gap-2">
              <MapPin className="size-4 text-lime" />
              {venue?.name}, {venue?.city}
            </span>
          </div>
          <div className="mt-8 flex flex-wrap items-center gap-2">
            <Button
              variant={wishlisted ? "lime" : "outline"}
              className={
                wishlisted
                  ? ""
                  : "border-white/15 bg-white/5 text-paper hover:bg-white/10"
              }
              onClick={() => {
                toggleWishlist(event.id);
                toast.success(
                  wishlisted
                    ? t("event.wishlistRemove")
                    : t("event.wishlistAdd"),
                );
              }}
            >
              <Heart className={cn("size-4", wishlisted && "fill-current")} />
              {wishlisted ? t("event.wishlistRemove") : t("event.wishlistAdd")}
            </Button>
            <Button
              variant="ghost"
              className="text-paper hover:bg-white/10 hover:text-paper"
              onClick={share}
            >
              <Share2 className="size-4" /> {t("common.share")}
            </Button>
            <Button
              variant="ghost"
              className="text-paper hover:bg-white/10 hover:text-paper"
              onClick={() => downloadIcs(event, venue)}
            >
              <CalendarPlus className="size-4" /> {t("common.addCalendar")}
            </Button>
          </div>
        </div>
      </section>
      {statusMessage ? (
        <div className="border-b border-warning/20 bg-warning/10">
          <div className="container-page flex items-center gap-2 py-3 text-sm text-warning-text">
            <ShieldCheck className="size-4" />
            {statusMessage}
          </div>
        </div>
      ) : null}
      <div className="container-page grid gap-10 py-10 lg:grid-cols-[1fr_380px] lg:py-16">
        <div className="min-w-0 space-y-12">
          <section>
            <h2 className="font-display text-2xl font-semibold">
              {t("event.about")}
            </h2>
            <p className="mt-4 max-w-3xl text-base leading-8 text-muted">
              {event.description}
            </p>
            <div className="mt-6 flex flex-wrap gap-2">
              {event.tags.map((tag) => (
                <Badge key={tag} variant="neutral">
                  {tag}
                </Badge>
              ))}
            </div>
          </section>

          <section>
            <h2 className="font-display text-2xl font-semibold">
              {t("event.highlights")}
            </h2>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {event.highlights.map((highlight) => (
                <div
                  key={highlight}
                  className="flex items-start gap-3 rounded-2xl border border-line bg-surface p-4"
                >
                  <span className="mt-0.5 grid size-6 shrink-0 place-items-center rounded-full bg-lime text-on-lime">
                    <Check className="size-3.5" />
                  </span>
                  <p className="text-sm leading-relaxed text-ink">
                    {highlight}
                  </p>
                </div>
              ))}
            </div>
          </section>

          <section>
            <h2 className="font-display text-2xl font-semibold">
              {t("event.schedule")}
            </h2>
            <div className="mt-5 space-y-0 border-l border-line pl-6">
              {event.schedule.map((item) => (
                <div
                  key={`${item.time}-${item.title}`}
                  className="relative pb-6 last:pb-0"
                >
                  <span className="absolute -left-[31px] top-1.5 size-2.5 rounded-full border-2 border-canvas bg-brand" />
                  <p className="text-xs font-semibold tabular text-brand-strong">
                    {item.time}
                  </p>
                  <p className="mt-1 text-sm font-semibold text-ink">
                    {item.title}
                  </p>
                  {item.description ? (
                    <p className="mt-1 text-sm text-muted">
                      {item.description}
                    </p>
                  ) : null}
                </div>
              ))}
            </div>
          </section>

          <section className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-line bg-surface p-5">
              <div className="flex items-center gap-2 text-brand-strong">
                <MapPin className="size-4" />
                <h2 className="text-sm font-semibold">
                  {t("event.venueLocation")}
                </h2>
              </div>
              <p className="mt-3 font-display text-lg font-semibold">
                {venue?.name}
              </p>
              <p className="mt-1 text-sm leading-relaxed text-muted">
                {venue?.address}, {venue?.city}
              </p>
              {venue?.mapUrl ? (
                <a
                  href={venue.mapUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-3 inline-flex text-xs font-semibold text-brand-strong hover:underline"
                >
                  {t("common.details")}
                </a>
              ) : null}
            </div>
            <div className="rounded-2xl border border-line bg-surface p-5">
              <div className="flex items-center gap-2 text-brand-strong">
                <CalendarDays className="size-4" />
                <h2 className="text-sm font-semibold">
                  {t("event.eventDate")}
                </h2>
              </div>
              <p className="mt-3 font-display text-lg font-semibold">
                {formatEventDate(event.startAt, event.timezone, locale)}
              </p>
              <p className="mt-1 text-sm text-muted">
                {formatTime(event.startAt, event.timezone, locale)}{" "}
                {getTimezoneLabel(event.timezone)} ·{" "}
                {formatTime(event.endAt, event.timezone, locale)}
              </p>
            </div>
          </section>

          <section>
            <h2 className="font-display text-2xl font-semibold">
              {t("event.terms")}
            </h2>
            <ul className="mt-4 space-y-2.5">
              {event.terms.map((term) => (
                <li
                  key={term}
                  className="flex gap-2.5 text-sm leading-relaxed text-muted"
                >
                  <span className="mt-2 size-1.5 shrink-0 rounded-full bg-brand" />
                  {term}
                </li>
              ))}
            </ul>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {event.ageNote ? (
                <div className="rounded-2xl border border-line bg-surface p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted">
                    {t("event.ageNote")}
                  </p>
                  <p className="mt-2 text-sm leading-relaxed text-ink">
                    {event.ageNote}
                  </p>
                </div>
              ) : null}
              {event.accessibilityNote ? (
                <div className="rounded-2xl border border-line bg-surface p-4">
                  <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-muted">
                    <Accessibility className="size-3.5" />
                    {t("event.accessibility")}
                  </p>
                  <p className="mt-2 text-sm leading-relaxed text-ink">
                    {event.accessibilityNote}
                  </p>
                </div>
              ) : null}
            </div>
          </section>

          <section>
            <h2 className="font-display text-2xl font-semibold">
              {t("event.organizer")}
            </h2>
            <div className="mt-4 flex items-start gap-4 rounded-2xl border border-line bg-surface p-5">
              <OrganizerMonogram
                name={organizer?.displayName ?? "Eventra"}
                size="lg"
              />
              <div>
                <p className="font-display text-lg font-semibold">
                  {organizer?.displayName}
                </p>
                <p className="mt-1 text-sm leading-relaxed text-muted">
                  {organizer?.description}
                </p>
                <p className="mt-2 text-xs text-muted">{organizer?.email}</p>
              </div>
            </div>
          </section>

          <section>
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <h2 className="font-display text-2xl font-semibold">
                  {t("event.reviews")}
                </h2>
                <p className="mt-1 text-sm text-muted">
                  {eventReviews.length
                    ? `${averageRating.toFixed(1)} / 5 · ${t("event.reviewCount", { count: eventReviews.length })}`
                    : t("event.reviewsEmpty")}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <select
                  value={reviewFilter}
                  onChange={(filterEvent) =>
                    setReviewFilter(
                      filterEvent.target.value === "all"
                        ? "all"
                        : Number(filterEvent.target.value),
                    )
                  }
                  className="h-8 rounded-full border border-line bg-surface px-3 text-xs text-muted"
                  aria-label={t("event.rating")}
                >
                  <option value="all">{t("common.all")}</option>
                  <option value="5">★★★★★</option>
                  <option value="4">★★★★</option>
                  <option value="3">★★★</option>
                  <option value="2">★★</option>
                  <option value="1">★</option>
                </select>
                <select
                  value={reviewSort}
                  onChange={(selectEvent) =>
                    setReviewSort(
                      selectEvent.target.value as "newest" | "highest",
                    )
                  }
                  className="h-8 rounded-full border border-line bg-surface px-3 text-xs text-muted"
                  aria-label={t("event.reviews")}
                >
                  <option value="newest">{t("event.reviewNewest")}</option>
                  <option value="highest">{t("event.reviewHighest")}</option>
                </select>
                <div
                  role="img"
                  className="flex items-center gap-0.5"
                  aria-label={`${averageRating.toFixed(1)} dari 5`}
                >
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={cn(
                        "size-4",
                        star <= Math.round(averageRating)
                          ? "fill-lime text-lime"
                          : "text-line",
                      )}
                    />
                  ))}
                </div>
              </div>
            </div>
            <div className="mt-4 space-y-3">
              {filteredReviews.slice(0, 5).map((review) => (
                <div
                  key={review.id}
                  className="rounded-2xl border border-line bg-surface p-4"
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-semibold">{review.authorName}</p>
                    <div className="flex items-center gap-0.5">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={cn(
                            "size-3",
                            star <= review.rating
                              ? "fill-lime text-lime"
                              : "text-line",
                          )}
                        />
                      ))}
                    </div>
                  </div>
                  <p className="mt-2 text-sm leading-relaxed text-muted">
                    {review.comment}
                  </p>
                </div>
              ))}
            </div>
            {eligible ? (
              <form
                className="mt-5 rounded-2xl border border-line bg-surface p-5"
                onSubmit={(formEvent) => {
                  formEvent.preventDefault();
                  if (!comment.trim()) return;
                  addReview({
                    eventId: event.id,
                    userId: user?.id,
                    authorName: user?.name ?? "Guest",
                    rating,
                    comment: comment.trim(),
                  });
                  setComment("");
                  toast.success(t("event.reviewSuccess"));
                }}
              >
                <p className="text-sm font-semibold">
                  {t("event.writeReview")}
                </p>
                <p className="mt-1 text-xs text-muted">
                  {t("event.reviewEligible")}
                </p>
                <div className="mt-3 flex gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      aria-label={`${star} bintang`}
                      className="rounded p-1"
                    >
                      <Star
                        className={cn(
                          "size-5",
                          star <= rating ? "fill-lime text-lime" : "text-line",
                        )}
                      />
                    </button>
                  ))}
                </div>
                <textarea
                  value={comment}
                  onChange={(inputEvent) => setComment(inputEvent.target.value)}
                  placeholder={t("event.reviewPlaceholder")}
                  className="mt-3 min-h-24 w-full rounded-xl border border-line bg-canvas px-3 py-2 text-sm focus:border-brand focus:outline-none"
                />
                <Button type="submit" size="sm" className="mt-3">
                  {t("event.submitReview")}
                </Button>
              </form>
            ) : (
              <p className="mt-5 rounded-2xl border border-dashed border-line bg-surface-subtle/60 p-4 text-xs text-muted">
                {t("event.reviewNotEligible")}
              </p>
            )}
          </section>
        </div>

        <aside className="lg:relative">
          <div className="lg:sticky lg:top-24">
            <div className="rounded-3xl border border-line bg-surface p-5 shadow-soft">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted">
                    {t("event.ticketOptions")}
                  </p>
                  <p className="mt-1 font-display text-2xl font-semibold">
                    {formatIDR(getStartingPrice(event), locale)}
                  </p>
                </div>
                {event.limitedAvailability ? (
                  <Badge variant="warning">{t("common.limited")}</Badge>
                ) : null}
              </div>

              <div className="mt-5 space-y-3">
                {event.ticketTypes.slice(0, 5).map((ticketType) => {
                  const availability = getTicketAvailability(ticketType);
                  return (
                    <Link
                      key={ticketType.id}
                      href={
                        purchasable.purchasable
                          ? `/events/${event.slug}/tickets?type=${ticketType.id}`
                          : "#"
                      }
                      aria-disabled={!availability.available}
                      className={cn(
                        "block rounded-2xl border p-3.5 transition-colors",
                        availability.available
                          ? "border-line hover:border-brand/40 hover:bg-brand-soft/30"
                          : "pointer-events-none border-line bg-surface-subtle/50 opacity-60",
                      )}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold text-ink">
                            {ticketType.name}
                          </p>
                          <p className="mt-0.5 text-xs text-muted">
                            {ticketType.description}
                          </p>
                        </div>
                        <p className="shrink-0 text-sm font-semibold tabular">
                          {formatIDR(ticketType.price, locale)}
                        </p>
                      </div>
                      {ticketType.benefits.length ? (
                        <p className="mt-2 text-[11px] text-muted">
                          {ticketType.benefits.join(" · ")}
                        </p>
                      ) : null}
                      {!availability.available ? (
                        <p className="mt-2 text-[11px] font-medium text-danger">
                          {availability.reason === "sold_out"
                            ? t("common.soldOut")
                            : t("event.salesEnd")}
                        </p>
                      ) : null}
                    </Link>
                  );
                })}
              </div>

              <Button
                asChild
                className="mt-5 w-full"
                size="lg"
                disabled={!purchasable.purchasable}
              >
                <Link
                  href={
                    purchasable.purchasable
                      ? `/events/${event.slug}/tickets`
                      : "#"
                  }
                >
                  <Ticket className="size-4" /> {t("event.selectTickets")}
                </Link>
              </Button>

              {salesEnd ? (
                <p className="mt-3 text-center text-[11px] text-muted">
                  {t("event.salesEnd")}:{" "}
                  {formatDateTime(salesEnd, event.timezone, locale)}
                </p>
              ) : null}
              <DemoNotice className="mt-4">
                {t("common.simulationNotice")}
              </DemoNotice>
            </div>
          </div>
        </aside>
      </div>
      related.length ? (
      <section className="border-t border-line bg-surface/50">
        <div className="container-page section-space">
          <div className="flex items-end justify-between gap-4">
            <h2 className="font-display text-3xl font-semibold">
              {t("event.related")}
            </h2>
            <Button asChild variant="ghost" size="sm">
              <Link href="/events">{t("common.viewAll")}</Link>
            </Button>
          </div>
          <div className="mt-7 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {related.map((item) => (
              <EventCard key={item.id} event={item} />
            ))}
          </div>
        </div>
      </section>
      ) : null;
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-surface/95 p-3 backdrop-blur-md lg:hidden">
        <div className="flex items-center gap-3">
          <div className="min-w-0 flex-1">
            <p className="text-[10px] uppercase tracking-[0.14em] text-muted">
              {t("common.from")}
            </p>
            <p className="text-sm font-semibold tabular">
              {formatIDR(getStartingPrice(event), locale)}
            </p>
          </div>
          <Button asChild size="md" disabled={!purchasable.purchasable}>
            <Link
              href={
                purchasable.purchasable ? `/events/${event.slug}/tickets` : "#"
              }
            >
              {t("event.selectTickets")}
            </Link>
          </Button>
        </div>
      </div>
      <div className="h-16 lg:hidden" />
    </div>
  );
}
