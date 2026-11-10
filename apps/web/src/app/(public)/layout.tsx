import { SiteShell } from "@/components/layouts/site-shell";

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <SiteShell>{children}</SiteShell>;
}
