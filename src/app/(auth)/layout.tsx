import { SiteShell } from "@/components/layouts/site-shell";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <SiteShell>{children}</SiteShell>;
}
