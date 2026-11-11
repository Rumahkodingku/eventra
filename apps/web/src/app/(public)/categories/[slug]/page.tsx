"use client";

import { Compass } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { EventCard } from "@/components/shared/event-card";
import { Badge } from "@/components/ui/badge";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { cn } from "@/lib/cn";
import { useCatalog } from "@/services/hooks/use-catalog";
import { useEventStore } from "@/services/hooks/use-event-store";

export default function CategoryPage() {
  const t = useTranslations();
  const { categories } = useCatalog();
  const params = useParams<{ slug: string }>();
  const events = useEventStore((state) => state.events);
  const category = categories.find((item) => item.slug === params.slug);
  const [subcategory, setSubcategory] = useState("all");

  const categoryEvents = useMemo(() => {
    if (!category) return [];
    return events
      .filter(
        (event) =>
          event.categoryId === category.id &&
          event.status === "PUBLISHED" &&
          (subcategory === "all" || event.subcategory === subcategory),
      )
      .sort(
        (a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime(),
      );
  }, [events, category, subcategory]);

  if (!category) {
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

  return (
    <div>
      <section className="relative overflow-hidden bg-midnight text-paper">
        <Image
          src={category.image}
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover opacity-45"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-midnight via-midnight/80 to-midnight/30" />
        <div className="container-page relative py-16 lg:py-24">
          <Breadcrumbs
            invert
            items={[
              { label: t("nav.categories"), href: "/events" },
              { label: category.name },
            ]}
          />
          <p className="mt-8 text-xs font-semibold uppercase tracking-[0.2em] text-lime">
            {t("nav.categories")}
          </p>
          <h1 className="mt-4 max-w-3xl font-display text-4xl font-semibold sm:text-5xl lg:text-6xl">
            {category.name}
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-relaxed text-paper/60">
            {category.description}
          </p>
          <div className="mt-8 flex flex-wrap gap-2">
            {category.subcategories.map((item) => (
              <Badge
                key={item}
                variant="dark"
                className="border-white/10 bg-white/5 text-paper/70"
              >
                {item}
              </Badge>
            ))}
          </div>
        </div>
      </section>

      <div className="container-page section-space">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setSubcategory("all")}
            className={cn(
              "rounded-full border px-4 py-2 text-xs font-medium transition-colors",
              subcategory === "all"
                ? "border-ink bg-ink text-canvas"
                : "border-line bg-surface text-muted hover:text-ink",
            )}
          >
            {t("common.all")}
          </button>
          {category.subcategories.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setSubcategory(item)}
              className={cn(
                "rounded-full border px-4 py-2 text-xs font-medium transition-colors",
                subcategory === item
                  ? "border-ink bg-ink text-canvas"
                  : "border-line bg-surface text-muted hover:text-ink",
              )}
            >
              {item}
            </button>
          ))}
        </div>

        {categoryEvents.length ? (
          <div className="mt-8 grid gap-x-5 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
            {categoryEvents.map((event, index) => (
              <EventCard key={event.id} event={event} priority={index < 3} />
            ))}
          </div>
        ) : (
          <EmptyState
            className="mt-8"
            icon={Compass}
            title={t("events.noResultsTitle")}
            body={t("events.noResultsBody")}
            action={
              <Button asChild>
                <Link href="/events">{t("common.viewAll")}</Link>
              </Button>
            }
          />
        )}
      </div>
    </div>
  );
}
