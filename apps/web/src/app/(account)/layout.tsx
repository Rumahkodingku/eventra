import { SiteShell } from "@/components/layouts/site-shell";

export default function AccountLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <SiteShell>{children}</SiteShell>;
}
