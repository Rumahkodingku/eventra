"use client";

import { Clock3, Search, X } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useDeferredValue, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { categories, venues } from "@/data/seed/catalog";
import { cn } from "@/lib/cn";
import { formatShortDate } from "@/lib/dates";
import { useEventStore } from "@/stores/events";
import { useRecentStore } from "@/stores/recent";

export function SearchDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const t = useTranslations();
  const router = useRouter();
  const events = useEventStore((state) => state.events);
  const searches = useRecentStore((state) => state.searches);
  const addSearch = useRecentStore((state) => state.addSearch);
  const removeSearch = useRecentStore((state) => state.removeSearch);
  const clearSearches = useRecentStore((state) => state.clearSearches);
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(-1);
  const deferredQuery = useDeferredValue(query);
  const normalized = deferredQuery.trim().toLowerCase();

  const suggestions = useMemo(() => {
    if (!normalized) return [];
    return events
      .filter((event) => event.status === "PUBLISHED")
      .map((event) => {
        const category = categories.find(
          (item) => item.id === event.categoryId,
        );
        const venue = venues.find((item) => item.id === event.venueId);
        const title = event.title.toLowerCase();
        let score = 0;
        if (title.startsWith(normalized)) score += 5;
        else if (title.includes(normalized)) score += 3;
        if (event.subcategory?.toLowerCase().includes(normalized)) score += 2;
        if (category?.name.toLowerCase().includes(normalized)) score += 2;
        if (venue?.city.toLowerCase().includes(normalized)) score += 2;
        if (venue?.name.toLowerCase().includes(normalized)) score += 1;
        return { event, score };
      })
      .filter((item) => item.score > 0)
      .sort(
        (a, b) => b.score - a.score || b.event.popularity - a.event.popularity,
      )
      .slice(0, 5)
      .map((item) => item.event);
  }, [events, normalized]);

  const submit = (value: string) => {
    const next = value.trim();
    if (!next) return;
    addSearch(next);
    onOpenChange(false);
    router.push(`/events?q=${encodeURIComponent(next)}`);
  };

  const openEvent = (slug: string) => {
    addSearch(query);
    onOpenChange(false);
    router.push(`/events/${slug}`);
  };

  const onKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((index) => Math.min(index + 1, suggestions.length - 1));
      return;
    }
    if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((index) => Math.max(index - 1, -1));
      return;
    }
    if (event.key === "Escape") {
      event.preventDefault();
      onOpenChange(false);
      return;
    }
    if (event.key === "Enter" && activeIndex >= 0 && suggestions[activeIndex]) {
      event.preventDefault();
      openEvent(suggestions[activeIndex].slug);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl p-0" showClose={false}>
        <DialogTitle className="sr-only">{t("nav.search")}</DialogTitle>
        <form
          onSubmit={(event) => {
            event.preventDefault();
            if (activeIndex >= 0 && suggestions[activeIndex]) {
              openEvent(suggestions[activeIndex].slug);
              return;
            }
            submit(query);
          }}
          className="flex items-center gap-2 border-b border-line px-4 py-4"
        >
          <Search className="size-5 shrink-0 text-muted" aria-hidden />
          <Input
            autoFocus
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setActiveIndex(-1);
            }}
            onKeyDown={onKeyDown}
            placeholder={t("home.heroSearchPlaceholder")}
            className="h-10 border-0 bg-transparent px-0 text-base focus:border-0"
            aria-label={t("nav.search")}
            aria-autocomplete="list"
            aria-controls="search-suggestions"
            aria-activedescendant={
              activeIndex >= 0 ? `search-suggestion-${activeIndex}` : undefined
            }
          />
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="grid size-9 shrink-0 place-items-center rounded-full text-muted hover:bg-surface-subtle hover:text-ink"
            aria-label={t("nav.close")}
          >
            <X className="size-4" />
          </button>
        </form>

        <div className="max-h-[60svh] overflow-y-auto p-4">
          {normalized ? (
            suggestions.length ? (
              <div id="search-suggestions" className="space-y-1" role="listbox">
                <p className="px-2 pb-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted">
                  {t("search.suggestions")}
                </p>
                {suggestions.map((event, index) => (
                  <button
                    key={event.id}
                    id={`search-suggestion-${index}`}
                    type="button"
                    role="option"
                    aria-selected={index === activeIndex}
                    onMouseEnter={() => setActiveIndex(index)}
                    onClick={() => openEvent(event.slug)}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-2xl p-2.5 text-left transition-colors",
                      index === activeIndex
                        ? "bg-surface-subtle"
                        : "hover:bg-surface-subtle",
                    )}
                  >
                    <span className="relative size-14 shrink-0 overflow-hidden rounded-xl bg-surface-subtle">
                      <Image
                        src={event.coverImage}
                        alt=""
                        fill
                        sizes="56px"
                        className="object-cover"
                      />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold text-ink">
                        {event.title}
                      </span>
                      <span className="mt-0.5 block truncate text-xs text-muted">
                        {formatShortDate(event.startAt, event.timezone)} ·{" "}
                        {event.subcategory}
                      </span>
                    </span>
                  </button>
                ))}
              </div>
            ) : (
              <p className="px-2 py-8 text-center text-sm text-muted">
                {t("events.noResultsTitle")}
              </p>
            )
          ) : (
            <div className="space-y-3">
              {searches.length ? (
                <div>
                  <div className="flex items-center justify-between px-2 pb-2">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted">
                      {t("search.recent")}
                    </p>
                    <button
                      type="button"
                      onClick={clearSearches}
                      className="text-[11px] font-medium text-brand-strong hover:underline"
                    >
                      {t("common.clearAll")}
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {searches.map((search) => (
                      <span
                        key={search}
                        className="inline-flex items-center overflow-hidden rounded-full border border-line bg-surface"
                      >
                        <button
                          type="button"
                          onClick={() => {
                            setQuery(search);
                            submit(search);
                          }}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs text-muted transition-colors hover:text-ink"
                        >
                          <Clock3 className="size-3.5" />
                          {search}
                        </button>
                        <button
                          type="button"
                          onClick={() => removeSearch(search)}
                          className="grid size-6 place-items-center text-muted transition-colors hover:bg-danger/10 hover:text-danger"
                          aria-label={`${t("common.remove")} ${search}`}
                        >
                          <X className="size-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              ) : null}
              <div className="flex flex-wrap gap-2 border-t border-line pt-4">
                {["Konser", "Festival", "Jakarta", "Basketball"].map((item) => (
                  <Button
                    key={item}
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setQuery(item);
                      submit(item);
                    }}
                  >
                    {item}
                  </Button>
                ))}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
