"use client";

import {
  Bell,
  Heart,
  LayoutDashboard,
  LogOut,
  Menu,
  Search,
  Settings,
  ShoppingBag,
  Ticket,
  UserRound,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { SearchDialog } from "@/components/shared/search-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, SheetContent } from "@/components/ui/dialog";
import {
  Dropdown,
  DropdownContent,
  DropdownItem,
  DropdownLabel,
  DropdownSeparator,
  DropdownTrigger,
} from "@/components/ui/dropdown";
import { LanguageSwitcher } from "@/components/ui/language-switcher";
import { Logo } from "@/components/ui/logo";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { useHydrated } from "@/hooks/use-hydrated";
import { cn } from "@/lib/cn";
import { useCartStore } from "@/services/hooks/use-cart-store";
import { useNotificationStore } from "@/services/hooks/use-notification-store";
import { useSessionStore } from "@/services/hooks/use-session-store";
import { useWishlistStore } from "@/services/hooks/use-wishlist-store";

export function SiteHeader() {
  const t = useTranslations();
  const pathname = usePathname();
  const router = useRouter();
  const hydrated = useHydrated();
  const [searchOpen, setSearchOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const cartItems = useCartStore((state) => state.items);
  const wishlist = useWishlistStore((state) => state.eventIds);
  const user = useSessionStore((state) => state.user);
  const logout = useSessionStore((state) => state.logout);
  const notifications = useNotificationStore((state) => state.notifications);
  const cartCount = cartItems.reduce((total, item) => total + item.quantity, 0);
  const unread = user
    ? notifications.filter((item) => item.userId === user.id && !item.readAt)
        .length
    : 0;

  const navItems = [
    { href: "/", label: t("nav.discover") },
    { href: "/events", label: t("nav.events") },
    { href: "/#categories", label: t("nav.categories") },
  ];

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const typing =
        target?.tagName === "INPUT" ||
        target?.tagName === "TEXTAREA" ||
        target?.tagName === "SELECT" ||
        target?.isContentEditable;
      if (event.key === "/" && !typing) {
        event.preventDefault();
        setSearchOpen(true);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const signOut = () => {
    logout();
    toast.success(t("nav.logout"));
    router.push("/");
  };

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-line/80 bg-canvas/85 backdrop-blur-xl">
        <div className="container-page flex h-[72px] items-center gap-3">
          <Logo priority />

          <nav
            className="ml-6 hidden items-center gap-1 lg:flex"
            aria-label="Navigasi utama"
          >
            {navItems.map((item) => {
              const active =
                item.href === "/"
                  ? pathname === "/"
                  : item.href === "/events"
                    ? pathname === "/events" || pathname.startsWith("/events/")
                    : false;
              return (
                <Link
                  key={`${item.href}-${item.label}`}
                  href={item.href}
                  className={cn(
                    "rounded-full px-3.5 py-2 text-sm font-medium transition-colors",
                    active
                      ? "bg-surface-subtle text-ink"
                      : "text-muted hover:bg-surface-subtle hover:text-ink",
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="ml-auto flex items-center gap-0.5">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSearchOpen(true)}
              className="hidden gap-2 text-muted hover:text-ink md:inline-flex"
            >
              <Search className="size-[18px]" />
              <span className="text-xs font-medium">{t("nav.search")}</span>
              <kbd className="ml-2 rounded border border-line bg-surface px-1.5 py-0.5 text-[10px] text-muted">
                /
              </kbd>
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSearchOpen(true)}
              className="text-muted hover:text-ink md:hidden"
              aria-label={t("nav.search")}
            >
              <Search className="size-[18px]" />
            </Button>

            <div className="hidden sm:block">
              <LanguageSwitcher compact />
            </div>
            <div className="hidden sm:block">
              <ThemeToggle />
            </div>

            <Button
              asChild
              variant="ghost"
              size="icon"
              className="relative hidden text-muted hover:text-ink sm:inline-flex"
            >
              <Link href="/wishlist" aria-label={t("nav.wishlist")}>
                <Heart className="size-[18px]" />
                {hydrated && wishlist.length ? (
                  <span className="absolute right-1 top-1 grid size-4 place-items-center rounded-full bg-brand text-[9px] font-bold text-on-brand">
                    {wishlist.length}
                  </span>
                ) : null}
              </Link>
            </Button>

            <Button
              asChild
              variant="ghost"
              size="icon"
              className="relative text-muted hover:text-ink"
            >
              <Link href="/cart" aria-label={t("nav.cart")}>
                <ShoppingBag className="size-[18px]" />
                {hydrated && cartCount ? (
                  <span className="absolute right-1 top-1 grid min-w-4 place-items-center rounded-full bg-lime px-1 text-[9px] font-bold text-on-lime">
                    {cartCount}
                  </span>
                ) : null}
              </Link>
            </Button>

            {hydrated && user ? (
              <Dropdown>
                <DropdownTrigger asChild>
                  <button
                    type="button"
                    className="ml-1 grid size-9 place-items-center rounded-full bg-midnight text-sm font-semibold text-paper ring-2 ring-transparent transition-all hover:ring-brand/40"
                    aria-label={t("nav.account")}
                  >
                    {user.name.charAt(0)}
                  </button>
                </DropdownTrigger>
                <DropdownContent className="w-64">
                  <DropdownLabel>
                    <span className="block text-xs font-semibold text-ink">
                      {user.name}
                    </span>
                    <span className="mt-0.5 block text-[10px] font-normal normal-case tracking-normal text-muted">
                      {user.email}
                    </span>
                  </DropdownLabel>
                  <DropdownSeparator />
                  <DropdownItem asChild>
                    <Link href="/tickets">
                      <Ticket className="size-4" /> {t("nav.myTickets")}
                    </Link>
                  </DropdownItem>
                  <DropdownItem asChild>
                    <Link href="/orders">
                      <ShoppingBag className="size-4" /> {t("nav.orders")}
                    </Link>
                  </DropdownItem>
                  <DropdownItem asChild>
                    <Link href="/notifications">
                      <Bell className="size-4" /> {t("nav.notifications")}
                      {unread ? (
                        <Badge variant="brand" className="ml-auto">
                          {unread}
                        </Badge>
                      ) : null}
                    </Link>
                  </DropdownItem>
                  <DropdownSeparator />
                  <DropdownItem asChild>
                    <Link href="/profile">
                      <UserRound className="size-4" /> {t("nav.profile")}
                    </Link>
                  </DropdownItem>
                  <DropdownItem asChild>
                    <Link href="/profile/settings">
                      <Settings className="size-4" /> {t("nav.settings")}
                    </Link>
                  </DropdownItem>
                  {user.role === "ORGANIZER" ? (
                    <>
                      <DropdownSeparator />
                      <DropdownItem asChild>
                        <Link href="/organizer/dashboard">
                          <LayoutDashboard className="size-4" />{" "}
                          {t("nav.organizer")}
                        </Link>
                      </DropdownItem>
                    </>
                  ) : null}
                  <DropdownSeparator />
                  <DropdownItem
                    onSelect={signOut}
                    className="text-danger focus:bg-danger/10"
                  >
                    <LogOut className="size-4" /> {t("nav.logout")}
                  </DropdownItem>
                </DropdownContent>
              </Dropdown>
            ) : (
              <div className="ml-1 hidden items-center gap-1 sm:flex">
                <Button asChild variant="ghost" size="sm">
                  <Link href="/login">{t("nav.login")}</Link>
                </Button>
              </div>
            )}

            <Button
              variant="ghost"
              size="icon"
              onClick={() => setMenuOpen(true)}
              className="ml-0.5 text-muted hover:text-ink lg:hidden"
              aria-label={t("nav.menu")}
            >
              <Menu className="size-5" />
            </Button>
          </div>
        </div>
      </header>

      <SearchDialog open={searchOpen} onOpenChange={setSearchOpen} />

      <Dialog open={menuOpen} onOpenChange={setMenuOpen}>
        <SheetContent side="right" className="p-6">
          <div className="mb-8 pr-10">
            <Logo priority />
          </div>
          <nav className="space-y-1" aria-label="Navigasi mobile">
            {[
              { href: "/", label: t("nav.discover") },
              { href: "/events", label: t("nav.events") },
              { href: "/#categories", label: t("nav.categories") },
              { href: "/wishlist", label: t("nav.wishlist") },
              { href: "/cart", label: t("nav.cart") },
              { href: "/tickets", label: t("nav.myTickets") },
              { href: "/orders", label: t("nav.orders") },
              { href: "/notifications", label: t("nav.notifications") },
              { href: "/profile", label: t("nav.profile") },
              { href: "/profile/settings", label: t("nav.settings") },
            ].map((item) => (
              <Link
                key={`${item.href}-${item.label}`}
                href={item.href}
                onClick={() => setMenuOpen(false)}
                className="flex items-center justify-between rounded-2xl px-3 py-3 text-sm font-medium text-ink transition-colors hover:bg-surface-subtle"
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="mt-6 flex items-center justify-between border-t border-line pt-5">
            <LanguageSwitcher />
            <ThemeToggle />
          </div>
          <div className="mt-6 space-y-2">
            {user ? (
              <>
                {user.role === "ORGANIZER" ? (
                  <Button asChild variant="outline" className="w-full">
                    <Link
                      href="/organizer/dashboard"
                      onClick={() => setMenuOpen(false)}
                    >
                      <LayoutDashboard className="size-4" />{" "}
                      {t("nav.organizer")}
                    </Link>
                  </Button>
                ) : null}
                <Button
                  variant="ghost"
                  className="w-full text-danger"
                  onClick={signOut}
                >
                  <LogOut className="size-4" /> {t("nav.logout")}
                </Button>
              </>
            ) : (
              <>
                <Button asChild className="w-full">
                  <Link href="/login" onClick={() => setMenuOpen(false)}>
                    {t("nav.login")}
                  </Link>
                </Button>
                <Button asChild variant="outline" className="w-full">
                  <Link href="/register" onClick={() => setMenuOpen(false)}>
                    {t("auth.register")}
                  </Link>
                </Button>
              </>
            )}
          </div>
        </SheetContent>
      </Dialog>
    </>
  );
}
