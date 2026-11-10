"use client";

import { ArrowRight, Camera, Mail, Music2 } from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { DemoNotice } from "@/components/ui/demo-notice";
import { Input } from "@/components/ui/input";
import { Logo } from "@/components/ui/logo";
import { categories } from "@/data/seed/catalog";

export function SiteFooter() {
  const t = useTranslations();
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);

  return (
    <footer className="mt-auto bg-midnight text-paper">
      <div className="container-page">
        <div className="grid gap-12 py-14 lg:grid-cols-[1.2fr_1fr_1fr_1.2fr] lg:py-20">
          <div>
            <Logo variant="dark" size="lg" />
            <p className="mt-5 max-w-xs text-sm leading-relaxed text-paper/55">
              {t("footer.tagline")}
            </p>
            <div className="mt-6 flex items-center gap-2">
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noreferrer"
                className="grid size-9 place-items-center rounded-full border border-white/10 text-paper/60 transition-colors hover:border-lime/40 hover:text-lime"
                aria-label="Instagram"
              >
                <Camera className="size-4" />
              </a>
              <a
                href="https://example.com"
                target="_blank"
                rel="noreferrer"
                className="grid size-9 place-items-center rounded-full border border-white/10 text-paper/60 transition-colors hover:border-lime/40 hover:text-lime"
                aria-label="Music"
              >
                <Music2 className="size-4" />
              </a>
              <a
                href="mailto:hello@example.com"
                className="grid size-9 place-items-center rounded-full border border-white/10 text-paper/60 transition-colors hover:border-lime/40 hover:text-lime"
                aria-label="Email"
              >
                <Mail className="size-4" />
              </a>
            </div>
          </div>

          <div>
            <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-paper/60">
              {t("footer.discover")}
            </h2>
            <ul className="mt-4 space-y-2.5 text-sm text-paper/65">
              <li>
                <Link
                  href="/events"
                  className="transition-colors hover:text-lime"
                >
                  {t("nav.events")}
                </Link>
              </li>
              {categories.slice(0, 4).map((category) => (
                <li key={category.id}>
                  <Link
                    href={`/categories/${category.slug}`}
                    className="transition-colors hover:text-lime"
                  >
                    {category.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-paper/60">
              {t("footer.company")}
            </h2>
            <ul className="mt-4 space-y-2.5 text-sm text-paper/65">
              <li>
                <Link
                  href="/help"
                  className="transition-colors hover:text-lime"
                >
                  {t("footer.help")}
                </Link>
              </li>
              <li>
                <Link
                  href="/legal"
                  className="transition-colors hover:text-lime"
                >
                  {t("common.terms")}
                </Link>
              </li>
              <li>
                <Link
                  href="/legal#privacy"
                  className="transition-colors hover:text-lime"
                >
                  {t("common.privacy")}
                </Link>
              </li>
              <li>
                <Link
                  href="/organizer/dashboard"
                  className="transition-colors hover:text-lime"
                >
                  {t("nav.organizer")}
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-paper/60">
              {t("home.newsletterTitle")}
            </h2>
            <p className="mt-4 text-sm leading-relaxed text-paper/60">
              {t("home.newsletterSubtitle")}
            </p>
            <form
              className="mt-5 flex gap-2"
              onSubmit={(event) => {
                event.preventDefault();
                if (!email.trim()) return;
                setSubscribed(true);
                toast.success(t("common.subscribed"));
                setEmail("");
              }}
            >
              <Input
                type="email"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@example.com"
                aria-label={t("common.email")}
                className="h-10 border-white/10 bg-white/5 text-paper placeholder:text-paper/55 focus:border-lime"
              />
              <Button
                type="submit"
                variant="lime"
                size="icon"
                aria-label={t("common.subscribe")}
              >
                <ArrowRight className="size-4" />
              </Button>
            </form>
            {subscribed ? (
              <p className="mt-2 text-xs text-lime">{t("common.subscribed")}</p>
            ) : null}
          </div>
        </div>

        <DemoNotice tone="dark" className="mb-8">
          {t("footer.demo")}
        </DemoNotice>

        <div className="flex flex-col gap-3 border-t border-white/10 py-6 text-xs text-paper/60 sm:flex-row sm:items-center sm:justify-between">
          <p>{t("footer.copyright")}</p>
          <p className="flex items-center gap-2">
            <span className="size-1.5 rounded-full bg-lime" />
            {t("brand.tagline")}
          </p>
        </div>
      </div>
    </footer>
  );
}
