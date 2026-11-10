"use client";

import { Minus, Plus } from "lucide-react";
import { cn } from "@/lib/cn";

export function QuantityStepper({
  value,
  onChange,
  min = 1,
  max = 99,
  size = "md",
  label = "Jumlah",
  disabled = false,
}: {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  size?: "sm" | "md";
  label?: string;
  disabled?: boolean;
}) {
  const buttonClass = size === "sm" ? "size-8" : "size-10";
  return (
    <fieldset
      className={cn(
        "inline-flex items-center rounded-full border border-line bg-surface p-1",
        disabled && "opacity-50",
      )}
    >
      <legend className="sr-only">{label}</legend>
      <button
        type="button"
        onClick={() => onChange(Math.max(min, value - 1))}
        disabled={disabled || value <= min}
        className={cn(
          "grid place-items-center rounded-full text-ink transition-colors hover:bg-surface-subtle disabled:opacity-35",
          buttonClass,
        )}
        aria-label="Kurangi jumlah"
      >
        <Minus className="size-4" />
      </button>
      <span
        className="min-w-9 text-center text-sm font-semibold tabular"
        aria-live="polite"
      >
        {value}
      </span>
      <button
        type="button"
        onClick={() => onChange(Math.min(max, value + 1))}
        disabled={disabled || value >= max}
        className={cn(
          "grid place-items-center rounded-full text-ink transition-colors hover:bg-surface-subtle disabled:opacity-35",
          buttonClass,
        )}
        aria-label="Tambah jumlah"
      >
        <Plus className="size-4" />
      </button>
    </fieldset>
  );
}
