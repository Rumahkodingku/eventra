"use client";

import { Building2, Save, ShieldCheck } from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { DemoNotice } from "@/components/ui/demo-notice";
import { Field } from "@/components/ui/field";
import { Input, Textarea } from "@/components/ui/input";
import { Logo } from "@/components/ui/logo";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { useHydrated } from "@/hooks/use-hydrated";
import { useOrganizerSettingsStore } from "@/services/hooks/use-organizer-settings-store";

export default function OrganizerSettingsPage() {
  const t = useTranslations();
  const hydrated = useHydrated();
  const settings = useOrganizerSettingsStore((state) => state.settings);
  const updateSettings = useOrganizerSettingsStore(
    (state) => state.updateSettings,
  );
  const saveSettings = useOrganizerSettingsStore((state) => state.saveSettings);

  if (!hydrated) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-20" />
        <Skeleton className="h-96" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-strong">
            {t("organizer.settings")}
          </p>
          <h1 className="mt-2 font-display text-3xl font-semibold sm:text-4xl">
            {t("organizer.settingsTitle")}
          </h1>
          <p className="mt-2 text-sm text-muted">{t("organizer.subtitle")}</p>
        </div>
        <Button
          onClick={async () => {
            try {
              await saveSettings(settings);
              toast.success(t("organizer.saved"));
            } catch {
              toast.error(t("errors.generic"));
            }
          }}
        >
          <Save className="size-4" /> {t("common.save")}
        </Button>
      </div>

      <div className="grid gap-5 xl:grid-cols-[1fr_360px]">
        <div className="space-y-5">
          <section className="rounded-3xl border border-line bg-surface p-5 sm:p-6">
            <h2 className="font-display text-xl font-semibold">
              {t("organizer.organizerProfile")}
            </h2>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <Field label={t("organizer.displayName")} htmlFor="org-name">
                <Input
                  id="org-name"
                  value={settings.displayName}
                  onChange={(event) =>
                    updateSettings({ displayName: event.target.value })
                  }
                />
              </Field>
              <Field label={t("checkout.buyerEmail")} htmlFor="org-email">
                <Input
                  id="org-email"
                  type="email"
                  value={settings.email}
                  onChange={(event) =>
                    updateSettings({ email: event.target.value })
                  }
                />
              </Field>
              <Field
                label={t("organizer.description")}
                htmlFor="org-description"
                className="sm:col-span-2"
              >
                <Textarea
                  id="org-description"
                  value={settings.description}
                  onChange={(event) =>
                    updateSettings({ description: event.target.value })
                  }
                />
              </Field>
              <Field label="Website" htmlFor="org-website">
                <Input
                  id="org-website"
                  value={settings.website}
                  onChange={(event) =>
                    updateSettings({ website: event.target.value })
                  }
                />
              </Field>
              <Field label="Instagram" htmlFor="org-instagram">
                <Input
                  id="org-instagram"
                  value={settings.instagram}
                  onChange={(event) =>
                    updateSettings({ instagram: event.target.value })
                  }
                />
              </Field>
              <Field
                label="TikTok"
                htmlFor="org-tiktok"
                className="sm:col-span-2"
              >
                <Input
                  id="org-tiktok"
                  value={settings.tiktok}
                  onChange={(event) =>
                    updateSettings({ tiktok: event.target.value })
                  }
                />
              </Field>
            </div>
          </section>

          <section className="rounded-3xl border border-line bg-surface p-5 sm:p-6">
            <h2 className="font-display text-xl font-semibold">
              {t("organizer.notificationPrefs")}
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
                    checked={settings[item.key]}
                    onCheckedChange={(value) =>
                      updateSettings({ [item.key]: value })
                    }
                    aria-label={item.label}
                  />
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-3xl border border-line bg-surface p-5 sm:p-6">
            <h2 className="flex items-center gap-2 font-display text-xl font-semibold">
              <Building2 className="size-5 text-brand-strong" />{" "}
              {t("organizer.payout")}
            </h2>
            <p className="mt-1 text-xs leading-relaxed text-muted">
              {t("organizer.payoutNote")}
            </p>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <Field label="Bank" htmlFor="payout-bank">
                <Input
                  id="payout-bank"
                  value={settings.payoutBank}
                  onChange={(event) =>
                    updateSettings({ payoutBank: event.target.value })
                  }
                />
              </Field>
              <Field label="Nomor rekening" htmlFor="payout-account">
                <Input
                  id="payout-account"
                  value={settings.payoutAccount}
                  onChange={(event) =>
                    updateSettings({ payoutAccount: event.target.value })
                  }
                />
              </Field>
            </div>
            <div className="mt-3 flex items-center gap-2 rounded-xl border border-success/20 bg-success/10 p-3 text-xs text-success">
              <ShieldCheck className="size-4" /> Data rekening adalah contoh dan
              tidak terhubung ke penyedia pembayaran.
            </div>
          </section>
        </div>

        <aside className="space-y-4">
          <div className="rounded-3xl border border-line bg-surface p-5">
            <h2 className="font-display text-lg font-semibold">
              {t("organizer.branding")}
            </h2>
            <div className="mt-4 rounded-2xl bg-midnight p-5">
              <Logo variant="dark" />
              <p className="mt-4 text-sm text-paper/55">
                {settings.description}
              </p>
              <p className="mt-3 text-xs text-lime">{settings.website}</p>
            </div>
            <p className="mt-3 text-xs leading-relaxed text-muted">
              {t("organizer.imageNote")}
            </p>
          </div>
          <DemoNotice>{t("common.demoNotice")}</DemoNotice>
        </aside>
      </div>
    </div>
  );
}
