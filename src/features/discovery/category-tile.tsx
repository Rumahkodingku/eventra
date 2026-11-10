"use client";

import { ArrowRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useTranslations } from "next-intl";
import type { Category } from "@/domain/types";
import { cn } from "@/lib/cn";

export function CategoryTile({
  category,
  count,
  className,
}: {
  category: Category;
  count: number;
  className?: string;
}) {
  const t = useTranslations();
  return (
    <Link
      href={`/categories/${category.slug}`}
      className={cn(
        "group relative block overflow-hidden rounded-2xl bg-midnight",
        className,
      )}
    >
      <div className="relative aspect-[4/3]">
        <Image
          src={category.image}
          alt={category.name}
          fill
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 18vw"
          className="image-zoom object-cover opacity-80 transition-opacity duration-300 group-hover:opacity-100"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-midnight via-midnight/30 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-2 p-4">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-lime">
              {count} {t("nav.events").toLowerCase()}
            </p>
            <h3 className="mt-1 font-display text-lg font-semibold leading-tight text-paper">
              {category.name}
            </h3>
          </div>
          <span className="grid size-8 shrink-0 place-items-center rounded-full border border-paper/20 text-paper transition-colors group-hover:border-lime group-hover:bg-lime group-hover:text-midnight">
            <ArrowRight className="size-3.5" />
          </span>
        </div>
      </div>
    </Link>
  );
}
