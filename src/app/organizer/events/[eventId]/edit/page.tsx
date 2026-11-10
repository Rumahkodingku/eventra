import { OrganizerEventForm } from "@/features/organizer/event-form";

export default async function Page({
  params,
}: {
  params: Promise<{ eventId: string }>;
}) {
  const { eventId } = await params;
  return <OrganizerEventForm eventId={eventId} />;
}
