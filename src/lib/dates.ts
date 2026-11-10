import type { Locale } from "@/domain/types";

export function getTimezoneLabel(timezone: string): string {
  if (timezone === "Asia/Jayapura") return "WIT";
  if (timezone === "Asia/Makassar") return "WITA";
  return "WIB";
}

export function formatEventDate(
  value: string,
  timezone: string,
  locale: Locale = "id",
): string {
  return new Intl.DateTimeFormat(locale === "id" ? "id-ID" : "en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: timezone,
  }).format(new Date(value));
}

export function formatShortDate(
  value: string,
  timezone: string,
  locale: Locale = "id",
): string {
  return new Intl.DateTimeFormat(locale === "id" ? "id-ID" : "en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    timeZone: timezone,
  }).format(new Date(value));
}

export function formatDateTime(
  value: string,
  timezone: string,
  locale: Locale = "id",
): string {
  return new Intl.DateTimeFormat(locale === "id" ? "id-ID" : "en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: timezone,
  }).format(new Date(value));
}

export function formatTime(
  value: string,
  timezone: string,
  locale: Locale = "id",
): string {
  return new Intl.DateTimeFormat(locale === "id" ? "id-ID" : "en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: timezone,
  }).format(new Date(value));
}

export function formatDay(
  value: string,
  timezone: string,
  locale: Locale = "id",
): string {
  return new Intl.DateTimeFormat(locale === "id" ? "id-ID" : "en-GB", {
    day: "2-digit",
    month: "short",
    timeZone: timezone,
  }).format(new Date(value));
}

export function formatMonth(
  value: string,
  timezone: string,
  locale: Locale = "id",
): string {
  return new Intl.DateTimeFormat(locale === "id" ? "id-ID" : "en-GB", {
    month: "short",
    year: "numeric",
    timeZone: timezone,
  }).format(new Date(value));
}

export function isPast(value: string): boolean {
  return new Date(value).getTime() < Date.now();
}

export function isUpcoming(value: string): boolean {
  return new Date(value).getTime() >= Date.now();
}

export function daysUntil(value: string): number {
  return Math.ceil((new Date(value).getTime() - Date.now()) / 86_400_000);
}

export function toDateTimeLocal(value: string): string {
  const date = new Date(value);
  const offset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}

export function fromDateTimeLocal(value: string): string {
  return new Date(value).toISOString();
}

export function addDays(value: Date, days: number): Date {
  return new Date(value.getTime() + days * 86_400_000);
}
