"use client";

import { Camera, LogIn, Mail, Phone, Save, UserRound } from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { DemoNotice } from "@/components/ui/demo-notice";
import { EmptyState } from "@/components/ui/empty-state";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useHydrated } from "@/hooks/use-hydrated";
import { useSessionStore } from "@/services/hooks/use-session-store";

export default function ProfilePage() {
  const t = useTranslations();
  const hydrated = useHydrated();
  const user = useSessionStore((state) => state.user);
  const updateProfile = useSessionStore((state) => state.updateProfile);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [avatar, setAvatar] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!user) return;
    setName(user.name);
    setEmail(user.email);
    setPhone(user.phone ?? "");
  }, [user]);

  useEffect(() => {
    return () => {
      if (avatar) URL.revokeObjectURL(avatar);
    };
  }, [avatar]);

  if (!hydrated) {
    return (
      <div className="container-page section-space">
        <Skeleton className="h-12 w-1/4" />
        <Skeleton className="mt-8 h-[360px]" />
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
          {t("account.profile")}
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-muted">
          {t("account.demoNotice")}
        </p>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_300px]">
        <form
          className="rounded-3xl border border-line bg-surface p-5 sm:p-6"
          onSubmit={async (event) => {
            event.preventDefault();
            if (!name.trim() || !email.trim()) {
              toast.error(t("errors.required"));
              return;
            }
            await updateProfile({
              name: name.trim(),
              email: email.trim(),
              phone: phone.trim(),
            });
            toast.success(t("account.profileSaved"));
          }}
        >
          <div className="flex flex-wrap items-center gap-5 border-b border-line pb-6">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="group relative grid size-20 place-items-center overflow-hidden rounded-3xl bg-midnight text-2xl font-semibold text-paper"
              aria-label={t("account.avatar")}
            >
              {avatar ? (
                // biome-ignore lint/performance/noImgElement: local object URL preview
                <img src={avatar} alt="" className="size-full object-cover" />
              ) : (
                user.name.charAt(0)
              )}
              <span className="absolute inset-0 grid place-items-center bg-midnight/60 opacity-0 transition-opacity group-hover:opacity-100">
                <Camera className="size-5" />
              </span>
            </button>
            <input
              ref={inputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (!file) return;
                setAvatar(URL.createObjectURL(file));
              }}
            />
            <div>
              <p className="font-display text-xl font-semibold">{user.name}</p>
              <p className="mt-1 text-sm text-muted">{user.email}</p>
              <p className="mt-1 text-xs text-muted">
                {t("common.optional")}: preview avatar lokal, tidak disimpan
                permanen.
              </p>
            </div>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <Field label={t("account.name")} htmlFor="profile-name" required>
              <Input
                id="profile-name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                autoComplete="name"
              />
            </Field>
            <Field label={t("account.email")} htmlFor="profile-email" required>
              <Input
                id="profile-email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                autoComplete="email"
              />
            </Field>
            <Field
              label={t("account.phone")}
              htmlFor="profile-phone"
              className="sm:col-span-2"
            >
              <Input
                id="profile-phone"
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
                autoComplete="tel"
              />
            </Field>
          </div>

          <Button type="submit" className="mt-6">
            <Save className="size-4" /> {t("account.save")}
          </Button>
        </form>

        <aside className="space-y-4">
          <div className="rounded-3xl border border-line bg-surface p-5">
            <h2 className="font-display text-lg font-semibold">
              {t("account.overview")}
            </h2>
            <div className="mt-4 space-y-2">
              <Link
                href="/tickets"
                className="flex items-center gap-2 rounded-xl px-2 py-2 text-sm text-muted transition-colors hover:bg-surface-subtle hover:text-ink"
              >
                <UserRound className="size-4" /> {t("nav.myTickets")}
              </Link>
              <Link
                href="/orders"
                className="flex items-center gap-2 rounded-xl px-2 py-2 text-sm text-muted transition-colors hover:bg-surface-subtle hover:text-ink"
              >
                <Mail className="size-4" /> {t("nav.orders")}
              </Link>
              <Link
                href="/profile/settings"
                className="flex items-center gap-2 rounded-xl px-2 py-2 text-sm text-muted transition-colors hover:bg-surface-subtle hover:text-ink"
              >
                <Phone className="size-4" /> {t("nav.settings")}
              </Link>
            </div>
          </div>
          <DemoNotice>{t("account.demoNotice")}</DemoNotice>
        </aside>
      </div>
    </div>
  );
}
