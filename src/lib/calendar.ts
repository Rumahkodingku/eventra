import type { Event, Venue } from "@/domain/types";

function icsDate(value: string): string {
  return `${new Date(value).toISOString().replace(/[-:]/g, "").split(".")[0]}Z`;
}

function escapeIcs(value: string): string {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/\n/g, "\\n")
    .replace(/,/g, "\\,")
    .replace(/;/g, "\\;");
}

export function buildIcs(event: Event, venue: Venue | undefined): string {
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Eventra//Demo//EN",
    "CALSCALE:GREGORIAN",
    "BEGIN:VEVENT",
    `UID:${event.id}@eventra.demo`,
    `DTSTAMP:${icsDate(new Date().toISOString())}`,
    `DTSTART:${icsDate(event.startAt)}`,
    `DTEND:${icsDate(event.endAt)}`,
    `SUMMARY:${escapeIcs(event.title)}`,
    `DESCRIPTION:${escapeIcs(event.description.slice(0, 220))}`,
    `LOCATION:${escapeIcs(venue ? `${venue.name}, ${venue.city}` : "Indonesia")}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ];
  return lines.join("\r\n");
}

export function downloadIcs(event: Event, venue: Venue | undefined): void {
  const blob = new Blob([buildIcs(event, venue)], {
    type: "text/calendar;charset=utf-8;",
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `${event.slug}.ics`;
  anchor.click();
  URL.revokeObjectURL(url);
}
