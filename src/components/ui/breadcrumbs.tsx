import { ChevronRight, Home } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/cn";

export function Breadcrumbs({
  items,
  className,
  invert = false,
}: {
  items: { label: string; href?: string }[];
  className?: string;
  invert?: boolean;
}) {
  return (
    <nav
      aria-label="Breadcrumb"
      className={cn(
        "text-xs",
        invert ? "text-paper/55" : "text-muted",
        className,
      )}
    >
      <ol className="flex flex-wrap items-center gap-1.5">
        <li>
          <Link
            href="/"
            className={cn(
              "inline-flex items-center gap-1 rounded transition-colors",
              invert ? "hover:text-paper" : "hover:text-ink",
            )}
          >
            <Home className="size-3.5" aria-hidden />
            <span className="sr-only">Home</span>
          </Link>
        </li>
        {items.map((item, index) => (
          <li
            key={`${item.label}-${index}`}
            className="flex items-center gap-1.5"
          >
            <ChevronRight
              className={cn(
                "size-3",
                invert ? "text-paper/25" : "text-muted/50",
              )}
              aria-hidden
            />
            {item.href ? (
              <Link
                href={item.href}
                className={cn(
                  "rounded transition-colors",
                  invert ? "hover:text-paper" : "hover:text-ink",
                )}
              >
                {item.label}
              </Link>
            ) : (
              <span
                className={cn(invert ? "text-paper" : "text-ink")}
                aria-current="page"
              >
                {item.label}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
