"use client";

import { Bell, CheckCheck } from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { useHydrated } from "@/hooks/use-hydrated";
import { cn } from "@/lib/cn";
import { useNotificationStore } from "@/stores/notifications";
import { useSessionStore } from "@/stores/session";

export default function NotificationsPage() {
  const t = useTranslations();
  const hydrated = useHydrated();
  const user = useSessionStore((state) => state.user);
  const notifications = useNotificationStore((state) => state.notifications);
  const markRead = useNotificationStore((state) => state.markRead);
  const markAllRead = useNotificationStore((state) => state.markAllRead);

  if (!hydrated) {
    return (
      <div className="container-page section-space">
        <Skeleton className="h-12 w-1/4" />
        <div className="mt-8 space-y-3">
          {["one", "two", "three", "four"].map((key) => (
            <Skeleton key={key} className="h-24" />
          ))}
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="container-page section-space">
        <EmptyState
          icon={Bell}
          title={t("account.guestTitle")}
          body={t("account.guestBody")}
          action={
            <Button asChild>
              <Link href="/login">{t("account.loginCta")}</Link>
            </Button>
          }
        />
      </div>
    );
  }

  const mine = notifications
    .filter((item) => item.userId === user.id)
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
  const unread = mine.filter((item) => !item.readAt).length;

  return (
    <div className="container-page section-space">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-strong">
            {t("nav.account")}
          </p>
          <h1 className="mt-3 font-display text-4xl font-semibold sm:text-5xl">
            {t("nav.notifications")}
          </h1>
          <p className="mt-2 text-sm text-muted">
            {unread
              ? `${unread} ${t("account.unread").toLowerCase()}`
              : t("common.all")}
          </p>
        </div>
        {unread ? (
          <Button
            variant="outline"
            size="sm"
            onClick={() => markAllRead(user.id)}
          >
            <CheckCheck className="size-4" /> {t("account.markAllRead")}
          </Button>
        ) : null}
      </div>

      {mine.length ? (
        <div className="mt-8 space-y-2">
          {mine.map((item) => (
            <div
              key={item.id}
              className={cn(
                "flex items-start gap-4 rounded-3xl border p-4 transition-colors sm:p-5",
                item.readAt
                  ? "border-line bg-surface"
                  : "border-brand/20 bg-brand-soft/35",
              )}
            >
              <span
                className={cn(
                  "mt-0.5 grid size-9 shrink-0 place-items-center rounded-xl",
                  item.readAt
                    ? "bg-surface-subtle text-muted"
                    : "bg-brand text-on-brand",
                )}
              >
                <Bell className="size-4" />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm font-semibold">{item.title}</p>
                  {!item.readAt ? (
                    <Badge variant="brand">{t("account.unread")}</Badge>
                  ) : null}
                </div>
                <p className="mt-1 text-sm leading-relaxed text-muted">
                  {item.message}
                </p>
                <div className="mt-2 flex flex-wrap items-center gap-3 text-xs">
                  {item.targetUrl ? (
                    <Link
                      href={item.targetUrl}
                      onClick={() => markRead(item.id)}
                      className="font-semibold text-brand-strong hover:underline"
                    >
                      {t("common.open")}
                    </Link>
                  ) : null}
                  {!item.readAt ? (
                    <button
                      type="button"
                      onClick={() => markRead(item.id)}
                      className="text-muted hover:text-ink"
                    >
                      {t("account.markRead")}
                    </button>
                  ) : null}
                  <span className="text-muted/60">
                    {new Date(item.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={Bell}
          title={t("account.noNotifications")}
          body={t("account.guestBody")}
        />
      )}
    </div>
  );
}
