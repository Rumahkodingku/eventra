"use client";

import {
  ArrowRight,
  Building2,
  LockKeyhole,
  Mail,
  UserRound,
} from "lucide-react";
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
import {
  demoCredentials,
  useSessionStore,
} from "@/services/hooks/use-session-store";

export default function LoginPage() {
  const t = useTranslations();
  const router = useRouter();
  const login = useSessionStore((state) => state.login);
  const loginDemo = useSessionStore((state) => state.loginDemo);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    const result = await login(email, password);
    if (!result.ok) {
      setError(t("auth.invalid"));
      return;
    }
    setError(null);
    const user = result.user;
    toast.success(t("auth.welcome", { name: user?.name ?? "" }));
    router.push(
      user?.role === "ORGANIZER" ? "/organizer/dashboard" : "/tickets",
    );
  };

  const demo = async (role: "CUSTOMER" | "ORGANIZER") => {
    await loginDemo(role);
    toast.success(
      t("auth.welcome", {
        name:
          role === "ORGANIZER"
            ? demoCredentials.organizer.name
            : demoCredentials.customer.name,
      }),
    );
    router.push(role === "ORGANIZER" ? "/organizer/dashboard" : "/tickets");
  };

  return (
    <div className="container-page section-space">
      <div className="mx-auto grid max-w-5xl overflow-hidden rounded-[2rem] border border-line bg-surface shadow-lift lg:grid-cols-[1fr_0.9fr]">
        <div className="p-6 sm:p-10">
          <Logo size="lg" priority />
          <h1 className="mt-10 font-display text-4xl font-semibold">
            {t("auth.loginTitle")}
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-muted">
            {t("auth.loginSubtitle")}
          </p>

          <form className="mt-7 space-y-4" onSubmit={submit}>
            <Field label={t("auth.email")} htmlFor="login-email" required>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted" />
                <Input
                  id="login-email"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="customer@demo.local"
                  className="pl-10"
                  autoComplete="email"
                />
              </div>
            </Field>
            <Field label={t("auth.password")} htmlFor="login-password" required>
              <div className="relative">
                <LockKeyhole className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted" />
                <Input
                  id="login-password"
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="demo12345"
                  className="pl-10"
                  autoComplete="current-password"
                />
              </div>
            </Field>
            {error ? (
              <p className="rounded-xl border border-danger/20 bg-danger/10 p-3 text-xs text-danger">
                {error}
              </p>
            ) : null}
            <Button type="submit" className="w-full" size="lg">
              {t("auth.login")} <ArrowRight className="size-4" />
            </Button>
          </form>

          <div className="my-6 flex items-center gap-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-muted">
            <span className="h-px flex-1 bg-line" />
            Demo
            <span className="h-px flex-1 bg-line" />
          </div>

          <div className="grid gap-2 sm:grid-cols-2">
            <Button variant="outline" onClick={() => demo("CUSTOMER")}>
              <UserRound className="size-4" /> {t("auth.customerDemo")}
            </Button>
            <Button variant="outline" onClick={() => demo("ORGANIZER")}>
              <Building2 className="size-4" /> {t("auth.organizerDemo")}
            </Button>
          </div>

          <DemoNotice className="mt-5">
            <span className="block font-semibold text-ink">
              {t("auth.demoHint")}
            </span>
            <span className="mt-1 block">{t("auth.demoPasswordHint")}</span>
          </DemoNotice>

          <p className="mt-5 text-center text-xs text-muted">
            {t("auth.noAccount")}{" "}
            <Link
              href="/register"
              className="font-semibold text-brand-strong hover:underline"
            >
              {t("auth.register")}
            </Link>
          </p>
        </div>

        <div className="relative hidden min-h-[640px] overflow-hidden bg-midnight lg:block">
          <Image
            priority
            src="/images/events/concert-02.webp"
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
              Satu tempat untuk semua momen yang layak dikenang.
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
