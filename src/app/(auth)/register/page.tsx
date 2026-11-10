"use client";

import { ArrowRight, LockKeyhole, Mail, Phone, UserRound } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { DemoNotice } from "@/components/ui/demo-notice";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Logo } from "@/components/ui/logo";
import { useSessionStore } from "@/stores/session";

export default function RegisterPage() {
  const t = useTranslations();
  const router = useRouter();
  const register = useSessionStore((state) => state.register);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!name.trim() || !email.trim() || password.length < 8) {
      setError(t("auth.required"));
      return;
    }
    const result = register({ name, email, phone });
    if (!result.ok) {
      setError(
        result.error === "exists"
          ? "Email sudah terdaftar."
          : t("auth.required"),
      );
      return;
    }
    setError(null);
    toast.success(t("auth.registerSuccess"));
    router.push("/tickets");
  };

  return (
    <div className="container-page section-space">
      <div className="mx-auto grid max-w-5xl overflow-hidden rounded-[2rem] border border-line bg-surface shadow-lift lg:grid-cols-[1fr_0.9fr]">
        <div className="p-6 sm:p-10">
          <Logo size="lg" priority />
          <h1 className="mt-10 font-display text-4xl font-semibold">
            {t("auth.registerTitle")}
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-muted">
            {t("auth.registerSubtitle")}
          </p>

          <form className="mt-7 space-y-4" onSubmit={submit}>
            <Field label={t("auth.name")} htmlFor="register-name" required>
              <div className="relative">
                <UserRound className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted" />
                <Input
                  id="register-name"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="Nama lengkap"
                  className="pl-10"
                  autoComplete="name"
                />
              </div>
            </Field>
            <Field label={t("auth.email")} htmlFor="register-email" required>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted" />
                <Input
                  id="register-email"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="you@example.com"
                  className="pl-10"
                  autoComplete="email"
                />
              </div>
            </Field>
            <Field label={t("auth.phone")} htmlFor="register-phone">
              <div className="relative">
                <Phone className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted" />
                <Input
                  id="register-phone"
                  value={phone}
                  onChange={(event) => setPhone(event.target.value)}
                  placeholder="+62..."
                  className="pl-10"
                  autoComplete="tel"
                />
              </div>
            </Field>
            <Field
              label={t("auth.password")}
              htmlFor="register-password"
              required
              hint={t("auth.demoPasswordHint")}
            >
              <div className="relative">
                <LockKeyhole className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted" />
                <Input
                  id="register-password"
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Minimal 8 karakter"
                  className="pl-10"
                  autoComplete="new-password"
                />
              </div>
            </Field>
            {error ? (
              <p className="rounded-xl border border-danger/20 bg-danger/10 p-3 text-xs text-danger">
                {error}
              </p>
            ) : null}
            <Button type="submit" className="w-full" size="lg">
              {t("auth.register")} <ArrowRight className="size-4" />
            </Button>
          </form>

          <DemoNotice className="mt-5">{t("account.passwordNote")}</DemoNotice>
          <p className="mt-5 text-center text-xs text-muted">
            {t("auth.haveAccount")}{" "}
            <Link
              href="/login"
              className="font-semibold text-brand-strong hover:underline"
            >
              {t("auth.login")}
            </Link>
          </p>
        </div>

        <div className="relative hidden min-h-[640px] overflow-hidden bg-midnight lg:block">
          <Image
            priority
            src="/images/events/festival-03.webp"
            alt=""
            fill
            sizes="45vw"
            className="object-cover opacity-55"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-midnight via-midnight/40 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 p-10 text-paper">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-lime">
              {t("brand.tagline")}
            </p>
            <p className="mt-3 max-w-sm font-display text-3xl font-semibold leading-tight">
              Simpan tiket, wishlist, dan rencana berikutnya di satu tempat.
            </p>
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-paper/55">
              {t("common.demoNotice")}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
