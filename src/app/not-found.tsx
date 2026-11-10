import { Compass } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="grid min-h-svh place-items-center bg-canvas px-4 py-16">
      <div className="max-w-md text-center">
        <span className="mx-auto grid size-16 place-items-center rounded-3xl bg-brand-soft text-brand-strong">
          <Compass className="size-7" />
        </span>
        <p className="mt-6 font-display text-6xl font-semibold tracking-tight">
          404
        </p>
        <h1 className="mt-2 font-display text-2xl font-semibold">
          Halaman tidak ditemukan
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-muted">
          Tautan mungkin sudah berubah, atau data demo yang kamu cari tidak
          tersedia di browser ini.
        </p>
        <div className="mt-6 flex justify-center gap-2">
          <Button asChild>
            <Link href="/">Kembali ke home</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/events">Jelajahi event</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
