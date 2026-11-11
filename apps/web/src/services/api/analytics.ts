export async function downloadOrganizerAnalyticsCsv(eventId?: string) {
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? "/api/v1";
  const query = eventId ? `?event_id=${encodeURIComponent(eventId)}` : "";
  const response = await fetch(
    `${baseUrl}/organizer/analytics/export.csv${query}`,
    { credentials: "include" },
  );
  if (!response.ok) {
    throw new Error("CSV_EXPORT_FAILED");
  }
  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "eventra-analytics.csv";
  link.click();
  URL.revokeObjectURL(url);
}
