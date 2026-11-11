"use client";

import { Filter, Grid3X3, List, SlidersHorizontal, X } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { EventCard } from "@/components/shared/event-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, SheetContent } from "@/components/ui/dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { Field } from "@/components/ui/field";
import { Input, Select } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import type { Event } from "@/domain/types";
import { cn } from "@/lib/cn";
import { getStartingPrice, isEventPurchasable } from "@/lib/pricing";
import { useCatalog } from "@/services/hooks/use-catalog";
import { useEventStore } from "@/services/hooks/use-event-store";

const PAGE_SIZE = 9;
const SKELETON_ROWS = [1, 2, 3, 4, 5, 6];

type SortKey =
  | "recommended"
  | "soonest"
  | "newest"
  | "price-low"
  | "price-high"
  | "popularity";

function dateRange(key: string): { from: number; to: number } | undefined {
  const now = Date.now();
  if (key === "week") return { from: now, to: now + 7 * 86_400_000 };
  if (key === "month") return { from: now, to: now + 30 * 86_400_000 };
  if (key === "next")
    return { from: now + 30 * 86_400_000, to: now + 60 * 86_400_000 };
  return undefined;
}

function priceMatch(event: Event, key: string): boolean {
  const price = getStartingPrice(event);
  if (key === "under200") return price < 200_000;
  if (key === "200to500") return price >= 200_000 && price <= 500_000;
  if (key === "500to1000") return price > 500_000 && price <= 1_000_000;
  if (key === "above1000") return price > 1_000_000;
  return true;
}

export function EventListing() {
  const t = useTranslations();
  const { categories, organizers, venues } = useCatalog();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const events = useEventStore((state) => state.events);
  const isLoading = useEventStore((state) => state.isLoading);
  const error = useEventStore((state) => state.error);
  const [filterOpen, setFilterOpen] = useState(false);
  const [query, setQuery] = useState(searchParams.get("q") ?? "");
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  const params = useMemo(
    () => new URLSearchParams(searchParams.toString()),
    [searchParams],
  );
  const categorySlug = params.get("category") ?? "all";
  const city = params.get("city") ?? "all";
  const dateKey = params.get("date") ?? "all";
  const priceKey = params.get("price") ?? "all";
  const mode = params.get("mode") ?? "all";
  const availability = params.get("availability") ?? "all";
  const sort = (params.get("sort") ?? "recommended") as SortKey;
  const view = params.get("view") === "list" ? "list" : "grid";
  const q = params.get("q") ?? "";

  const update = (key: string, value: string) => {
    const next = new URLSearchParams(params.toString());
    if (!value || value === "all") next.delete(key);
    else next.set(key, value);
    setVisibleCount(PAGE_SIZE);
    router.replace(`${pathname}?${next.toString()}`, { scroll: false });
  };

  const reset = () => {
    setQuery("");
    setVisibleCount(PAGE_SIZE);
    router.replace(pathname, { scroll: false });
  };

  const filtered = useMemo(() => {
    const category = categories.find((item) => item.slug === categorySlug);
    const range = dateRange(dateKey);
    const normalized = q.trim().toLowerCase();
    const list = events.filter((event) => {
      if (event.status === "DRAFT" || event.status === "ENDED") return false;
      const venue = venues.find((item) => item.id === event.venueId);
      const categoryItem = categories.find(
        (item) => item.id === event.categoryId,
      );
      const organizer = organizers.find(
        (item) => item.id === event.organizerId,
      );
      if (category && event.categoryId !== category.id) return false;
      if (city !== "all" && venue?.city !== city) return false;
      if (dateKey !== "all") {
        if (!range) return false;
        const time = new Date(event.startAt).getTime();
        if (time < range.from || time > range.to) return false;
      }
      if (!priceMatch(event, priceKey)) return false;
      if (mode !== "all" && event.ticketingMode !== mode) return false;
      if (
        availability === "available" &&
        !isEventPurchasable(event).purchasable
      )
        return false;
      if (normalized) {
        const haystack = [
          event.title,
          event.description,
          event.subcategory,
          event.tags.join(" "),
          venue?.name,
          venue?.city,
          categoryItem?.name,
          organizer?.displayName,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        if (!haystack.includes(normalized)) return false;
      }
      return true;
    });

    return list.sort((a, b) => {
      if (sort === "soonest") {
        return new Date(a.startAt).getTime() - new Date(b.startAt).getTime();
      }
      if (sort === "newest") {
        return (
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
      }
      if (sort === "price-low")
        return getStartingPrice(a) - getStartingPrice(b);
      if (sort === "price-high")
        return getStartingPrice(b) - getStartingPrice(a);
      if (sort === "popularity") return b.popularity - a.popularity;
      return (
        Number(b.isRecommended) - Number(a.isRecommended) ||
        b.popularity - a.popularity
      );
    });
  }, [
    events,
    categorySlug,
    city,
    dateKey,
    priceKey,
    mode,
    availability,
    q,
    sort,
    categories,
    organizers,
    venues,
  ]);

  const visible = filtered.slice(0, visibleCount);
  const activeCount = [
    "category",
    "city",
    "date",
    "price",
    "mode",
    "availability",
    "q",
  ].filter((key) => params.get(key)).length;

  const chips = [
    q ? { key: "q", label: `“${q}”` } : null,
    categorySlug !== "all"
      ? {
          key: "category",
          label:
            categories.find((item) => item.slug === categorySlug)?.name ??
            categorySlug,
        }
      : null,
    city !== "all" ? { key: "city", label: city } : null,
    dateKey !== "all"
      ? {
          key: "date",
          label:
            dateKey === "week"
              ? t("events.thisWeek")
              : dateKey === "month"
                ? t("events.thisMonth")
                : t("events.nextMonth"),
        }
      : null,
    priceKey !== "all"
      ? {
          key: "price",
          label:
            priceKey === "under200"
              ? t("events.priceUnder200")
              : priceKey === "200to500"
                ? t("events.price200to500")
                : priceKey === "500to1000"
                  ? t("events.price500to1000")
                  : t("events.priceAbove1000"),
        }
      : null,
    mode !== "all"
      ? {
          key: "mode",
          label:
            mode === "GENERAL_ADMISSION"
              ? t("events.modeGeneral")
              : mode === "RESERVED_SEATING"
                ? t("events.modeReserved")
                : t("events.modeHybrid"),
        }
      : null,
    availability !== "all"
      ? { key: "availability", label: t("events.availableOnly") }
      : null,
  ].filter((chip): chip is { key: string; label: string } => Boolean(chip));

  const filterPanel = (
    <div className="space-y-5">
      <Field label={t("common.category")} htmlFor="filter-category">
        <Select
          id="filter-category"
          value={categorySlug}
          onChange={(event) => update("category", event.target.value)}
        >
          <option value="all">{t("events.allCategories")}</option>
          {categories.map((category) => (
            <option key={category.id} value={category.slug}>
              {category.name}
            </option>
          ))}
        </Select>
      </Field>
      <Field label={t("common.city")} htmlFor="filter-city">
        <Select
          id="filter-city"
          value={city}
          onChange={(event) => update("city", event.target.value)}
        >
          <option value="all">{t("events.allCities")}</option>
          {[...new Set(venues.map((venue) => venue.city))].map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </Select>
      </Field>
      <Field label={t("common.date")} htmlFor="filter-date">
        <Select
          id="filter-date"
          value={dateKey}
          onChange={(event) => update("date", event.target.value)}
        >
          <option value="all">{t("events.allDates")}</option>
          <option value="week">{t("events.thisWeek")}</option>
          <option value="month">{t("events.thisMonth")}</option>
          <option value="next">{t("events.nextMonth")}</option>
        </Select>
      </Field>
      <Field label={t("events.priceLabel")} htmlFor="filter-price">
        <Select
          id="filter-price"
          value={priceKey}
          onChange={(event) => update("price", event.target.value)}
        >
          <option value="all">{t("events.anyPrice")}</option>
          <option value="under200">{t("events.priceUnder200")}</option>
          <option value="200to500">{t("events.price200to500")}</option>
          <option value="500to1000">{t("events.price500to1000")}</option>
          <option value="above1000">{t("events.priceAbove1000")}</option>
        </Select>
      </Field>
      <Field label={t("events.modeLabel")} htmlFor="filter-mode">
        <Select
          id="filter-mode"
          value={mode}
          onChange={(event) => update("mode", event.target.value)}
        >
          <option value="all">{t("events.anyMode")}</option>
          <option value="GENERAL_ADMISSION">{t("events.modeGeneral")}</option>
          <option value="RESERVED_SEATING">{t("events.modeReserved")}</option>
          <option value="HYBRID">{t("events.modeHybrid")}</option>
        </Select>
      </Field>
      <Field
        label={t("events.availabilityLabel")}
        htmlFor="filter-availability"
      >
        <Select
          id="filter-availability"
          value={availability}
          onChange={(event) => update("availability", event.target.value)}
        >
          <option value="all">{t("events.anyAvailability")}</option>
          <option value="available">{t("events.availableOnly")}</option>
        </Select>
      </Field>
      <Button variant="outline" className="w-full" onClick={reset}>
        <X className="size-4" /> {t("events.reset")}
      </Button>
    </div>
  );

  return (
    <div className="container-page section-space">
      <div className="max-w-3xl">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-strong">
          {t("nav.events")}
        </p>
        <h1 className="mt-3 font-display text-4xl font-semibold sm:text-5xl lg:text-6xl">
          {t("events.title")}
        </h1>
        <p className="mt-4 text-base leading-relaxed text-muted">
          {t("events.subtitle")}
        </p>
      </div>

      <form
        className="mt-8 flex max-w-3xl items-center gap-2 rounded-full border border-line bg-surface p-1.5"
        onSubmit={(event) => {
          event.preventDefault();
          update("q", query);
        }}
      >
        <Input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={t("events.searchPlaceholder")}
          className="h-11 border-0 bg-transparent px-4 focus:border-0"
          aria-label={t("common.search")}
        />
        <Button type="submit" size="md">
          {t("common.search")}
        </Button>
      </form>

      <div className="mt-8 flex flex-col gap-4 border-y border-line py-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="lg:hidden"
            onClick={() => setFilterOpen(true)}
          >
            <SlidersHorizontal className="size-4" />
            {t("common.filters")}
            {activeCount ? <Badge variant="brand">{activeCount}</Badge> : null}
          </Button>
          <p className="text-sm text-muted">
            {t("events.results", { count: filtered.length })}
          </p>
          {activeCount ? (
            <button
              type="button"
              onClick={reset}
              className="text-xs font-medium text-brand-strong hover:underline"
            >
              {t("common.clearAll")}
            </button>
          ) : null}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Select
            value={sort}
            onChange={(event) => update("sort", event.target.value)}
            className="h-9 w-auto min-w-40 text-xs"
            aria-label={t("common.sort")}
          >
            <option value="recommended">{t("events.sortRecommended")}</option>
            <option value="soonest">{t("events.sortSoonest")}</option>
            <option value="newest">{t("events.sortNewest")}</option>
            <option value="price-low">{t("events.sortPriceLow")}</option>
            <option value="price-high">{t("events.sortPriceHigh")}</option>
            <option value="popularity">{t("events.sortPopularity")}</option>
          </Select>
          <div className="inline-flex rounded-full border border-line bg-surface p-1">
            <button
              type="button"
              onClick={() => update("view", "grid")}
              className={cn(
                "grid size-7 place-items-center rounded-full",
                view === "grid" ? "bg-ink text-canvas" : "text-muted",
              )}
              aria-label={t("events.viewGrid")}
              aria-pressed={view === "grid"}
            >
              <Grid3X3 className="size-3.5" />
            </button>
            <button
              type="button"
              onClick={() => update("view", "list")}
              className={cn(
                "grid size-7 place-items-center rounded-full",
                view === "list" ? "bg-ink text-canvas" : "text-muted",
              )}
              aria-label={t("events.viewList")}
              aria-pressed={view === "list"}
            >
              <List className="size-3.5" />
            </button>
          </div>
        </div>
      </div>

      {chips.length ? (
        <div className="mt-4 flex flex-wrap items-center gap-2">
          {chips.map((chip) => (
            <button
              key={chip.key}
              type="button"
              onClick={() => {
                if (chip.key === "q") setQuery("");
                update(chip.key, "");
              }}
              className="inline-flex items-center gap-1.5 rounded-full border border-brand/20 bg-brand-soft/50 px-3 py-1.5 text-xs font-medium text-brand-strong transition-colors hover:border-danger/20 hover:bg-danger/10 hover:text-danger"
            >
              {chip.label}
              <X className="size-3" />
            </button>
          ))}
        </div>
      ) : null}

      <div className="mt-8 grid gap-8 lg:grid-cols-[240px_1fr]">
        <aside className="hidden lg:block">
          <div className="sticky top-24 rounded-2xl border border-line bg-surface p-5">
            <div className="mb-4 flex items-center gap-2">
              <Filter className="size-4 text-brand-strong" />
              <h2 className="text-sm font-semibold">{t("common.filters")}</h2>
              {activeCount ? (
                <Badge variant="brand">{activeCount}</Badge>
              ) : null}
            </div>
            {filterPanel}
          </div>
        </aside>

        <div>
          {isLoading ? (
            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {SKELETON_ROWS.map((row) => (
                <Skeleton key={row} className="h-80 rounded-2xl" />
              ))}
            </div>
          ) : error ? (
            <EmptyState
              icon={Filter}
              title={t("errors.generic")}
              body={error}
              action={
                <Button onClick={() => router.refresh()}>
                  {t("common.retry")}
                </Button>
              }
            />
          ) : visible.length ? (
            <>
              <div
                className={
                  view === "grid"
                    ? "grid gap-x-5 gap-y-9 sm:grid-cols-2 xl:grid-cols-3"
                    : "space-y-4"
                }
              >
                {visible.map((event, index) => (
                  <EventCard
                    key={event.id}
                    event={event}
                    variant={view === "list" ? "list" : "default"}
                    priority={index < 3}
                  />
                ))}
              </div>
              {visibleCount < filtered.length ? (
                <div className="mt-10 flex justify-center">
                  <Button
                    variant="outline"
                    onClick={() =>
                      setVisibleCount((count) => count + PAGE_SIZE)
                    }
                  >
                    {t("events.loadMore")}
                  </Button>
                </div>
              ) : null}
            </>
          ) : (
            <EmptyState
              icon={Filter}
              title={t("events.noResultsTitle")}
              body={t("events.noResultsBody")}
              action={<Button onClick={reset}>{t("events.reset")}</Button>}
            />
          )}
        </div>
      </div>

      <Dialog open={filterOpen} onOpenChange={setFilterOpen}>
        <SheetContent side="bottom" className="p-6">
          <div className="mb-6 pr-10">
            <h2 className="font-display text-2xl font-semibold">
              {t("common.filters")}
            </h2>
          </div>
          {filterPanel}
          <Button className="mt-5 w-full" onClick={() => setFilterOpen(false)}>
            {`${t("common.applyFilters")} · ${filtered.length}`}
          </Button>
        </SheetContent>
      </Dialog>
    </div>
  );
}
