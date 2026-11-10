import { OrganizerShell } from "@/components/layouts/organizer-shell";

export const instant = false;

export default function OrganizerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <OrganizerShell>{children}</OrganizerShell>;
}
