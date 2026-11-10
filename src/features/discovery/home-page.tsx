"use client";

import {
  ArrowRight,
  CalendarDays,
  MapPin,
  Search,
  Sparkles,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { EventCard } from "@/components/shared/event-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SectionHeading } from "@/components/ui/section-heading";
import { categories, venues } from "@/data/seed/catalog";
import { CategoryTile } from "@/features/discovery/category-tile";
import { useHydrated } from "@/hooks/use-hydrated";
import { cn } from "@/lib/cn";
import { formatIDR, formatNumber } from "@/lib/currency";
import { formatShortDate } from "@/lib/dates";
import { getStartingPrice } from "@/lib/pricing";
import { useEventStore } from "@/stores/events";
import { usePreferencesStore } from "@/stores/preferences";
import { useRecentStore } from "@/stores/recent";

function HeroSearch() {
  const t = useTranslations();
  const router = useRouter();
  const [query, setQuery] = useState("");
  return (
    <form
      className="mt-7 flex w-full max-w-xl items-center gap-2 rounded-full border border-white/15 bg-white/10 p-1.5 backdrop-blur-md"
      onSubmit={(event) => {
        event.preventDefault();
        router.push(
          query.trim()
            ? `/events?q=${encodeURIComponent(query.trim())}`
            : "/events",
        );
      }}
    >
      <Search className="ml-3 size-5 shrink-0 text-paper/60" aria-hidden />
      <Input
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder={t("home.heroSearchPlaceholder")}
        aria-label={t("nav.search")}
        className="h-11 border-0 bg-transparent px-0 text-sm text-paper placeholder:text-paper/60 focus:border-0"
      />
      <Button type="submit" variant="lime" size="md" className="shrink-0">
        {t("common.search")}
      </Button>
    </form>
  );
}

export function HomePage() {
  const t = useTranslations();
  const hydrated = useHydrated();
  const events = useEventStore((state) => state.events);
  const city = usePreferencesStore((state) => state.city);
  const setCity = usePreferencesStore((state) => state.setCity);
  const locale = usePreferencesStore((state) => state.locale);
  const recentIds = useRecentStore((state) => state.eventIds);

  const publicEvents = useMemo(
    () => events.filter((event) => event.status === "PUBLISHED"),
    [events],
  );
  const upcoming = useMemo(
    () =>
      publicEvents
        .filter((event) => new Date(event.startAt).getTime() >= Date.now())
        .sort(
          (a, b) =>
            new Date(a.startAt).getTime() - new Date(b.startAt).getTime(),
        ),
    [publicEvents],
  );
  const featured =
    publicEvents.find((event) => event.isFeatured) ?? publicEvents[0];
  const featuredList = publicEvents
    .filter((event) => event.isFeatured)
    .slice(0, 3);
  const trending = [...publicEvents]
    .sort((a, b) => b.popularity - a.popularity)
    .slice(0, 6);
  const cityEvents = upcoming.filter(
    (event) =>
      venues.find((venue) => venue.id === event.venueId)?.city === city,
  );
  const cityList = [...new Set(venues.map((venue) => venue.city))];
  const recentEvents = recentIds
    .map((id) => events.find((event) => event.id === id))
    .filter((event): event is NonNullable<typeof event> => Boolean(event))
    .slice(0, 4);

  if (!featured) {
    return (
      <div className="container-page section-space">
        <p className="text-muted">{t("events.noResultsBody")}</p>
      </div>
    );
  }

  const venue = venues.find((item) => item.id === featured.venueId);

  return (
    <>
      <section className="relative isolate min-h-[calc(100svh-72px)] overflow-hidden bg-midnight text-paper">
        <Image
          src={featured.coverImage}
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover opacity-55"
        />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(17,19,24,0.96)_0%,rgba(17,19,24,0.72)_46%,rgba(17,19,24,0.18)_100%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(0deg,rgba(17,19,24,0.92)_0%,transparent_38%)]" />
        <div className="container-page relative flex min-h-[calc(100svh-72px)] flex-col justify-center py-16">
          <div className="max-w-3xl">
            <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.22em] text-lime animate-[rise-in_600ms_var(--ease-out)_both]">
              <Sparkles className="size-3.5" />
              {t("home.heroEyebrow")}
            </p>
            <h1 className="mt-5 max-w-4xl font-display text-[clamp(2.8rem,7vw,6.5rem)] font-semibold leading-[0.92] tracking-[-0.055em] text-paper animate-[rise-in_700ms_var(--ease-out)_80ms_both]">
              {t("home.heroTitle")}
            </h1>
            <p className="mt-6 max-w-xl text-base leading-relaxed text-paper/65 sm:text-lg animate-[rise-in_700ms_var(--ease-out)_160ms_both]">
              {t("home.heroSubtitle")}
            </p>
            <div className="animate-[rise-in_700ms_var(--ease-out)_240ms_both]">
              <HeroSearch />
            </div>
            <div className="mt-8 flex flex-wrap items-center gap-3 animate-[rise-in_700ms_var(--ease-out)_320ms_both]">
              <Button asChild variant="lime">
                <Link href="/events">
                  {t("home.explore")} <ArrowRight className="size-4" />
                </Link>
              </Button>
              <Button
                asChild
                variant="ghost"
                className="text-paper hover:bg-white/10 hover:text-paper"
              >
                <Link href="/#categories">{t("home.viewCategories")}</Link>
              </Button>
            </div>
          </div>

          <div className="mt-16 grid max-w-3xl grid-cols-3 gap-4 border-t border-white/10 pt-5 sm:gap-8">
            {[
              {
                value: formatNumber(publicEvents.length, locale),
                label: t("home.statsEvents"),
              },
              {
                value: formatNumber(
                  new Set(venues.map((item) => item.city)).size,
                  locale,
                ),
                label: t("home.statsCities"),
              },
              {
                value: formatNumber(categories.length, locale),
                label: t("home.statsCategories"),
              },
            ].map((stat) => (
              <div key={stat.label}>
                <p className="font-display text-2xl font-semibold tabular text-paper sm:text-3xl">
                  {stat.value}
                </p>
                <p className="mt-1 text-[11px] uppercase tracking-[0.16em] text-paper/60">
                  {stat.label}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="absolute bottom-8 right-6 hidden w-[min(340px,30vw)] xl:block">
          <Link
            href={`/events/${featured.slug}`}
            className="group block overflow-hidden rounded-2xl border border-white/15 bg-midnight/45 p-3 backdrop-blur-md transition-colors hover:border-lime/30"
          >
            <div className="flex gap-3">
              <div className="relative size-20 shrink-0 overflow-hidden rounded-xl">
                <Image
                  src={featured.coverImage}
                  alt=""
                  fill
                  sizes="80px"
                  className="object-cover"
                />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-lime">
                  {t("home.featured")}
                </p>
                <p className="mt-1 line-clamp-2 text-sm font-semibold leading-snug text-paper">
                  {featured.title}
                </p>
                <p className="mt-1 flex items-center gap-1.5 text-[11px] text-paper/65">
                  <CalendarDays className="size-3" />
                  {formatShortDate(featured.startAt, featured.timezone, locale)}
                </p>
              </div>
            </div>
          </Link>
        </div>
      </section>

      <section className="container-page section-space">
        <SectionHeading
          eyebrow={t("home.featured")}
          title={t("home.featured")}
          subtitle={t("home.featuredSubtitle")}
          actionLabel={t("common.viewAll")}
          actionHref="/events"
        />
        <div className="mt-8 grid gap-5 lg:grid-cols-[1.15fr_0.85fr]">
          {featuredList[0] ? (
            <EventCard event={featuredList[0]} variant="featured" />
          ) : null}
          <div className="grid content-start items-start gap-5 sm:grid-cols-2 lg:grid-cols-1">
            {(featuredList.slice(1, 3).length
              ? featuredList.slice(1, 3)
              : trending.slice(0, 2)
            ).map((event) => (
              <EventCard key={event.id} event={event} variant="list" />
            ))}
          </div>
        </div>
      </section>

      <section id="categories" className="border-y border-line bg-surface/50">
        <div className="container-page section-space">
          <SectionHeading
            eyebrow={t("nav.categories")}
            title={t("home.categoriesTitle")}
            subtitle={t("home.categoriesSubtitle")}
            actionLabel={t("common.viewAll")}
            actionHref="/events"
          />
          <div className="mt-8 grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4">
            {categories.map((category) => (
              <CategoryTile
                key={category.id}
                category={category}
                count={
                  events.filter(
                    (event) =>
                      event.categoryId === category.id &&
                      event.status === "PUBLISHED",
                  ).length
                }
              />
            ))}
          </div>
        </div>
      </section>

      <section className="container-page section-space">
        <SectionHeading
          eyebrow={t("home.trending")}
          title={t("home.trending")}
          subtitle={t("home.trendingSubtitle")}
          actionLabel={t("common.viewAll")}
          actionHref="/events?sort=popularity"
        />
        <div className="mt-8 grid gap-x-5 gap-y-9 sm:grid-cols-2 lg:grid-cols-3">
          {trending.map((event) => (
            <EventCard key={event.id} event={event} />
          ))}
        </div>
      </section>

      <section className="bg-midnight text-paper">
        <div className="container-page grid items-center gap-10 py-16 lg:grid-cols-2 lg:py-24">
          <div className="relative aspect-[4/3] overflow-hidden rounded-[2rem]">
            <Image
              src={featured.gallery[1] ?? featured.coverImage}
              alt=""
              fill
              sizes="(max-width: 1024px) 100vw, 50vw"
              className="object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-midnight/70 to-transparent" />
            <div className="absolute bottom-5 left-5">
              <Badge variant="lime">{featured.subcategory}</Badge>
            </div>
          </div>
          <div className="lg:pl-8">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-lime">
              Kurasi Eventra
            </p>
            <h2 className="mt-4 max-w-lg font-display text-4xl font-semibold leading-[0.98] text-paper sm:text-5xl">
              {t("home.curated")}
            </h2>
            <p className="mt-5 max-w-xl text-base leading-relaxed text-paper/60">
              {t("home.curatedSubtitle")}
            </p>
            <div className="mt-8 grid max-w-md grid-cols-2 gap-4 border-t border-white/10 pt-6">
              <div>
                <p className="text-[10px] uppercase tracking-[0.16em] text-paper/60">
                  {t("common.date")}
                </p>
                <p className="mt-1.5 text-sm font-medium text-paper">
                  {formatShortDate(featured.startAt, featured.timezone, locale)}
                </p>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-[0.16em] text-paper/60">
                  {t("common.venue")}
                </p>
                <p className="mt-1.5 text-sm font-medium text-paper">
                  {venue?.name}
                </p>
              </div>
            </div>
            <Button asChild variant="lime" className="mt-8">
              <Link href={`/events/${featured.slug}`}>
                {t("common.viewTicket")} <ArrowRight className="size-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="container-page section-space">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <SectionHeading
            eyebrow={t("home.upcoming")}
            title={`${t("home.upcoming")} · ${city}`}
            subtitle={t("home.upcomingSubtitle")}
          />
          <div className="flex flex-wrap gap-1.5">
            {cityList.slice(0, 5).map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setCity(item)}
                className={cn(
                  "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                  item === city
                    ? "border-ink bg-ink text-canvas"
                    : "border-line bg-surface text-muted hover:border-ink/20 hover:text-ink",
                )}
              >
                {item}
              </button>
            ))}
          </div>
        </div>
        <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_340px]">
          <div className="space-y-4">
            {(cityEvents.length ? cityEvents : upcoming)
              .slice(0, 4)
              .map((event) => (
                <EventCard key={event.id} event={event} variant="list" />
              ))}
          </div>
          <aside className="rounded-3xl border border-line bg-surface p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-strong">
              {t("home.recommended")}
            </p>
            <h2 className="mt-3 font-display text-2xl font-semibold">
              {t("home.recommended")}
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-muted">
              {t("home.recommendedSubtitle")}
            </p>
            <div className="mt-5 space-y-4">
              {publicEvents
                .filter((event) => event.isRecommended)
                .slice(0, 3)
                .map((event) => {
                  const eventVenue = venues.find(
                    (item) => item.id === event.venueId,
                  );
                  return (
                    <Link
                      key={event.id}
                      href={`/events/${event.slug}`}
                      className="group flex items-center gap-3 border-t border-line pt-4 first:border-0 first:pt-0"
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
                        <p className="line-clamp-2 text-sm font-semibold leading-snug text-ink group-hover:text-brand-strong">
                          {event.title}
                        </p>
                        <p className="mt-1 flex items-center gap-1 text-[11px] text-muted">
                          <MapPin className="size-3" /> {eventVenue?.city}
                          <span className="mx-1 size-1 rounded-full bg-muted/40" />
                          {formatIDR(getStartingPrice(event), locale)}
                        </p>
                      </div>
                    </Link>
                  );
                })}
            </div>
          </aside>
        </div>
      </section>

      {hydrated && recentEvents.length ? (
        <section className="border-t border-line bg-surface/50">
          <div className="container-page section-space">
            <SectionHeading
              eyebrow={t("home.recentlyViewed")}
              title={t("home.recentlyViewed")}
              actionLabel={t("common.viewAll")}
              actionHref="/events"
            />
            <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {recentEvents.map((event) => (
                <EventCard key={event.id} event={event} />
              ))}
            </div>
          </div>
        </section>
      ) : null}
    </>
  );
}
