"use client";

import { cn } from "@/lib/cn";
import { formatIDR } from "@/lib/currency";
import { usePreferencesStore } from "@/stores/preferences";

export function Price({
  value,
  className,
  suffix,
}: {
  value: number;
  className?: string;
  suffix?: string;
}) {
  const locale = usePreferencesStore((state) => state.locale);
  return (
    <span className={cn("tabular", className)}>
      {formatIDR(value, locale)}
      {suffix ? (
        <span className="ml-1 text-xs font-normal text-muted">{suffix}</span>
      ) : null}
    </span>
  );
}
