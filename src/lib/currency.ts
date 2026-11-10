import type { Locale } from "@/domain/types";

export function formatIDR(value: number, locale: Locale = "id"): string {
  return new Intl.NumberFormat(locale === "id" ? "id-ID" : "en-US", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatNumber(value: number, locale: Locale = "id"): string {
  return new Intl.NumberFormat(locale === "id" ? "id-ID" : "en-US").format(
    value,
  );
}

export function formatCompact(value: number, locale: Locale = "id"): string {
  return new Intl.NumberFormat(locale === "id" ? "id-ID" : "en-US", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);
}

export function formatPercent(value: number, locale: Locale = "id"): string {
  return new Intl.NumberFormat(locale === "id" ? "id-ID" : "en-US", {
    style: "percent",
    maximumFractionDigits: 0,
  }).format(value / 100);
}
