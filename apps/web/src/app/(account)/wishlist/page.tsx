"use client";

import { Heart } from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { EventCard } from "@/components/shared/event-card";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { useHydrated } from "@/hooks/use-hydrated";
import { useEventStore } from "@/services/hooks/use-event-store";
import { useWishlistStore } from "@/services/hooks/use-wishlist-store";

export default function WishlistPage() {
  const t = useTranslations();
  const hydrated = useHydrated();
  const eventIds = useWishlistStore((state) => state.eventIds);
  const events = useEventStore((state) => state.events);
  const saved = eventIds
    .map((id) => events.find((event) => event.id === id))
    .filter((event): event is NonNullable<typeof event> => Boolean(event));

  if (!hydrated) {
    return (
      <div className="container-page section-space">
        <Skeleton className="h-12 w-1/3" />
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {["one", "two", "three"].map((key) => (
            <Skeleton key={key} className="aspect-[4/3]" />
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
          {t("nav.wishlist")}
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-muted">
          {t("home.recommendedSubtitle")}
        </p>
      </div>

      {saved.length ? (
        <div className="mt-8 grid gap-x-5 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
          {saved.map((event) => (
            <EventCard key={event.id} event={event} />
          ))}
        </div>
      ) : (
        <EmptyState
          icon={Heart}
          title={t("nav.wishlist")}
          body={t("events.noResultsBody")}
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
