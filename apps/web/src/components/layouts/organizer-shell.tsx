"use client";

import {
  BarChart3,
  CalendarDays,
  ClipboardCheck,
  LayoutDashboard,
  LogOut,
  Menu,
  ReceiptText,
  Settings,
  ShieldCheck,
  Ticket,
  Users,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, SheetContent } from "@/components/ui/dialog";
import { LanguageSwitcher } from "@/components/ui/language-switcher";
import { Logo } from "@/components/ui/logo";
import { Skeleton } from "@/components/ui/skeleton";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { useHydrated } from "@/hooks/use-hydrated";
import { cn } from "@/lib/cn";
import { useSessionStore } from "@/services/hooks/use-session-store";

const navItems = [
  {
    href: "/organizer/dashboard",
    key: "organizer.dashboard",
    icon: LayoutDashboard,
  },
  { href: "/organizer/events", key: "organizer.events", icon: CalendarDays },
  { href: "/organizer/orders", key: "organizer.orders", icon: ReceiptText },
  { href: "/organizer/attendees", key: "organizer.attendees", icon: Users },
  {
    href: "/organizer/check-in",
    key: "organizer.checkIn",
    icon: ClipboardCheck,
  },
  { href: "/organizer/analytics", key: "organizer.analytics", icon: BarChart3 },
  { href: "/organizer/settings", key: "organizer.settings", icon: Settings },
] as const;

export function OrganizerShell({ children }: { children: React.ReactNode }) {
  const t = useTranslations();
  const pathname = usePathname();
  const router = useRouter();
  const hydrated = useHydrated();
  const user = useSessionStore((state) => state.user);
  const loginDemo = useSessionStore((state) => state.loginDemo);
  const logout = useSessionStore((state) => state.logout);
  const [menuOpen, setMenuOpen] = useState(false);

  if (!hydrated) {
    return (
      <div className="grid min-h-svh place-items-center bg-canvas p-6">
        <Skeleton className="h-40 w-full max-w-md" />
      </div>
    );
  }

  if (!user || user.role !== "ORGANIZER") {
    return (
      <div className="grid min-h-svh place-items-center bg-canvas px-4 py-16">
        <div className="w-full max-w-md rounded-[2rem] border border-line bg-surface p-7 text-center shadow-lift sm:p-9">
          <Logo />
          <span className="mx-auto mt-8 grid size-14 place-items-center rounded-2xl bg-brand-soft text-brand-strong">
            <ShieldCheck className="size-6" />
          </span>
          <h1 className="mt-5 font-display text-3xl font-semibold">
            {t("organizer.dashboard")}
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-muted">
            {user ? t("organizer.accessDenied") : t("organizer.loginPrompt")}
          </p>
          <div className="mt-6 space-y-2">
            <Button
              className="w-full"
              onClick={() => {
                if (user) logout();
                loginDemo("ORGANIZER");
                toast.success(t("auth.organizerDemo"));
                router.refresh();
              }}
            >
              <ShieldCheck className="size-4" />{" "}
              {t("organizer.loginAsOrganizer")}
            </Button>
            <Button asChild variant="outline" className="w-full">
              <Link href="/">{t("common.back")}</Link>
            </Button>
          </div>
          <p className="mt-5 text-xs text-muted">
            organizer@demo.local · demo12345
          </p>
        </div>
      </div>
    );
  }

  const sidebar = (
    <div className="flex h-full flex-col bg-midnight text-paper">
      <div className="px-5 py-6">
        <Logo variant="dark" priority />
      </div>
      <nav
        className="flex-1 space-y-1 overflow-y-auto px-3"
        aria-label="Navigasi organizer"
      >
        {navItems.map((item) => {
          const active =
            pathname === item.href ||
            (item.href !== "/organizer/dashboard" &&
              pathname.startsWith(item.href));
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMenuOpen(false)}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                active
                  ? "bg-lime text-on-lime"
                  : "text-paper/55 hover:bg-white/5 hover:text-paper",
              )}
            >
              <Icon className="size-4" />
              {t(item.key)}
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-white/10 p-4">
        <div className="flex items-center gap-3">
          <span className="grid size-9 place-items-center rounded-full bg-brand text-sm font-semibold text-on-brand">
            {user.name.charAt(0)}
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">{user.name}</p>
            <p className="truncate text-[10px] text-paper/60">{user.email}</p>
          </div>
        </div>
        <div className="mt-4 flex items-center justify-between">
          <Link href="/" className="text-[11px] text-paper/60 hover:text-lime">
            {t("common.back")}
          </Link>
          <button
            type="button"
            onClick={() => {
              logout();
              toast.success(t("nav.logout"));
              router.push("/");
            }}
            className="inline-flex items-center gap-1.5 text-[11px] text-paper/60 hover:text-paper"
          >
            <LogOut className="size-3.5" /> {t("nav.logout")}
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-svh bg-canvas lg:grid lg:grid-cols-[240px_1fr]">
      <aside className="hidden lg:sticky lg:top-0 lg:block lg:h-svh">
        {sidebar}
      </aside>
      <div className="flex min-w-0 flex-col">
        <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-line bg-canvas/85 px-4 backdrop-blur-xl sm:px-6 lg:px-8">
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={() => setMenuOpen(true)}
            aria-label={t("nav.menu")}
          >
            <Menu className="size-5" />
          </Button>
          <div className="lg:hidden">
            <Logo compact size="sm" priority />
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="lime">{t("brand.demo")}</Badge>
            <span className="hidden text-xs text-muted sm:inline">
              {t("organizer.subtitle")}
            </span>
          </div>
          <div className="ml-auto flex items-center gap-0.5">
            <LanguageSwitcher compact />
            <ThemeToggle />
            <Button
              asChild
              variant="outline"
              size="sm"
              className="ml-1 hidden sm:inline-flex"
            >
              <Link href="/events">
                <Ticket className="size-4" /> {t("nav.events")}
              </Link>
            </Button>
          </div>
        </header>
        <main id="main" className="flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          {children}
        </main>
      </div>

      <Dialog open={menuOpen} onOpenChange={setMenuOpen}>
        <SheetContent side="left" className="bg-midnight p-0 text-paper">
          {sidebar}
        </SheetContent>
      </Dialog>
    </div>
  );
}
