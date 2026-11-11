import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/cn";

export function SectionHeading({
  eyebrow,
  title,
  subtitle,
  actionLabel,
  actionHref,
  className,
  invert = false,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  actionLabel?: string;
  actionHref?: string;
  className?: string;
  invert?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between",
        className,
      )}
    >
      <div className="max-w-2xl">
        {eyebrow ? (
          <p
            className={cn(
              "mb-3 text-xs font-semibold uppercase tracking-[0.2em]",
              invert ? "text-lime" : "text-brand-strong",
            )}
          >
            {eyebrow}
          </p>
        ) : null}
        <h2
          className={cn(
            "font-display text-3xl font-semibold sm:text-4xl lg:text-5xl",
            invert ? "text-paper" : "text-ink",
          )}
        >
          {title}
        </h2>
        {subtitle ? (
          <p
            className={cn(
              "mt-3 max-w-xl text-sm leading-relaxed sm:text-base",
              invert ? "text-paper/60" : "text-muted",
            )}
          >
            {subtitle}
          </p>
        ) : null}
      </div>
      {actionLabel && actionHref ? (
        <Link
          href={actionHref}
          className={cn(
            "group inline-flex shrink-0 items-center gap-2 text-sm font-semibold transition-colors",
            invert
              ? "text-paper hover:text-lime"
              : "text-brand-strong hover:text-brand-hover",
          )}
        >
          {actionLabel}
          <ArrowRight className="size-4 transition-transform duration-200 group-hover:translate-x-0.5" />
        </Link>
      ) : null}
    </div>
  );
}
