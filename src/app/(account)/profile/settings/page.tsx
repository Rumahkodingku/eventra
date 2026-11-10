"use client";

import { LogIn, Monitor, Moon, RotateCcw, Save, Sun } from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useTheme } from "next-themes";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { DemoNotice } from "@/components/ui/demo-notice";
import { Dialog, DialogContent, DialogHeader } from "@/components/ui/dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { Field } from "@/components/ui/field";
import { Input, Select } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { venues } from "@/data/seed/catalog";
import { useHydrated } from "@/hooks/use-hydrated";
import { cn } from "@/lib/cn";
import { resetDemoData } from "@/lib/storage";
import { usePreferencesStore } from "@/stores/preferences";
import { useSessionStore } from "@/stores/session";

export default function SettingsPage() {
  const t = useTranslations();
  const hydrated = useHydrated();
  const user = useSessionStore((state) => state.user);
  const locale = usePreferencesStore((state) => state.locale);
  const setLocale = usePreferencesStore((state) => state.setLocale);
  const city = usePreferencesStore((state) => state.city);
  const setCity = usePreferencesStore((state) => state.setCity);
  const prefs = usePreferencesStore((state) => state.notificationPrefs);
  const setPref = usePreferencesStore((state) => state.setNotificationPref);
  const { setTheme } = useTheme();
  const [resetOpen, setResetOpen] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  if (!hydrated) {
    return (
      <div className="container-page section-space">
        <Skeleton className="h-12 w-1/4" />
        <Skeleton className="mt-8 h-[460px]" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="container-page section-space">
        <EmptyState
          icon={LogIn}
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

  return (
    <div className="container-page section-space">
      <div className="max-w-2xl">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-strong">
          {t("nav.account")}
        </p>
        <h1 className="mt-3 font-display text-4xl font-semibold sm:text-5xl">
          {t("account.settings")}
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-muted">
          {t("account.demoNotice")}
        </p>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <section className="rounded-3xl border border-line bg-surface p-5 sm:p-6">
          <h2 className="font-display text-xl font-semibold">
            {t("account.language")} & {t("account.theme")}
          </h2>
          <div className="mt-4 space-y-4">
            <Field label={t("account.language")} htmlFor="settings-language">
              <Select
                id="settings-language"
                value={locale}
                onChange={(event) =>
                  setLocale(event.target.value as "id" | "en")
                }
              >
                <option value="id">Bahasa Indonesia</option>
                <option value="en">English</option>
              </Select>
            </Field>
            <div>
              <p className="text-sm font-medium">{t("account.theme")}</p>
              <div className="mt-2 grid grid-cols-3 gap-2">
                {[
                  { value: "light", icon: Sun, label: t("nav.light") },
                  { value: "dark", icon: Moon, label: t("nav.dark") },
                  { value: "system", icon: Monitor, label: t("nav.system") },
                ].map((item) => (
                  <button
                    key={item.value}
                    type="button"
                    onClick={() => setTheme(item.value)}
                    className={cn(
                      "flex items-center justify-center gap-2 rounded-xl border border-line bg-canvas px-3 py-2.5 text-xs font-medium text-muted transition-colors hover:border-brand/30 hover:text-ink",
                    )}
                  >
                    <item.icon className="size-4" /> {item.label}
                  </button>
                ))}
              </div>
            </div>
            <Field label={t("account.city")} htmlFor="settings-city">
              <Select
                id="settings-city"
                value={city}
                onChange={(event) => {
                  setCity(event.target.value);
                  toast.success(t("account.saved"));
                }}
              >
                {[...new Set(venues.map((venue) => venue.city))].map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </Select>
            </Field>
          </div>
        </section>

        <section className="rounded-3xl border border-line bg-surface p-5 sm:p-6">
          <h2 className="font-display text-xl font-semibold">
            {t("account.notificationPrefs")}
          </h2>
          <div className="mt-4 space-y-3">
            {[
              {
                key: "orderUpdates" as const,
                label: t("account.orderUpdates"),
              },
              {
                key: "eventReminders" as const,
                label: t("account.eventReminders"),
              },
              { key: "newsletter" as const, label: t("account.newsletter") },
            ].map((item) => (
              <div
                key={item.key}
                className="flex items-center justify-between gap-4 rounded-xl border border-line px-3.5 py-3"
              >
                <span className="text-sm text-ink">{item.label}</span>
                <Switch
                  checked={prefs[item.key]}
                  onCheckedChange={(value) => setPref(item.key, value)}
                  aria-label={item.label}
                />
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-3xl border border-line bg-surface p-5 sm:p-6">
          <h2 className="font-display text-xl font-semibold">
            {t("account.password")}
          </h2>
          <p className="mt-1 text-xs leading-relaxed text-muted">
            {t("account.passwordNote")}
          </p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <Field label={t("account.password")} htmlFor="new-password">
              <Input
                id="new-password"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="••••••••"
              />
            </Field>
            <Field label={t("auth.password")} htmlFor="confirm-password">
              <Input
                id="confirm-password"
                type="password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                placeholder="••••••••"
              />
            </Field>
          </div>
          <Button
            type="button"
            variant="outline"
            className="mt-4"
            onClick={() => {
              if (!password || password !== confirmPassword) {
                toast.error(t("errors.required"));
                return;
              }
              setPassword("");
              setConfirmPassword("");
              toast.success(t("account.saved"));
            }}
          >
            <Save className="size-4" /> {t("account.changePassword")}
          </Button>
        </section>

        <section className="rounded-3xl border border-danger/20 bg-danger/5 p-5 sm:p-6">
          <h2 className="font-display text-xl font-semibold text-danger">
            {t("account.resetData")}
          </h2>
          <p className="mt-1 text-xs leading-relaxed text-muted">
            {t("account.resetDataBody")}
          </p>
          <Button
            variant="destructive"
            className="mt-4"
            onClick={() => setResetOpen(true)}
          >
            <RotateCcw className="size-4" /> {t("account.resetData")}
          </Button>
        </section>
      </div>

      <DemoNotice className="mt-6 max-w-2xl">
        {t("common.demoNotice")}
      </DemoNotice>

      <Dialog open={resetOpen} onOpenChange={setResetOpen}>
        <DialogContent>
          <DialogHeader
            title={t("account.resetConfirm")}
            description={t("account.resetDataBody")}
          />
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setResetOpen(false)}>
              {t("common.cancel")}
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                toast.success(t("account.resetDone"));
                resetDemoData();
              }}
            >
              {t("account.resetData")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
