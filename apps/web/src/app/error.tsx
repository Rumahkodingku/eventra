"use client";

import { AlertTriangle } from "lucide-react";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Keep the demo console useful without exposing personal data.
    console.error(error.message);
  }, [error]);

  return (
    <div className="grid min-h-svh place-items-center bg-canvas px-4 py-16">
      <div className="max-w-md text-center">
        <span className="mx-auto grid size-16 place-items-center rounded-3xl bg-danger/10 text-danger">
          <AlertTriangle className="size-7" />
        </span>
        <h1 className="mt-6 font-display text-3xl font-semibold">
          Ada yang tidak berjalan
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-muted">
          Data demo mungkin tidak terbaca dengan benar. Coba muat ulang halaman
          atau reset data demo dari pengaturan.
        </p>
        <div className="mt-6 flex justify-center gap-2">
          <Button onClick={reset}>Coba lagi</Button>
          <Button asChild variant="outline">
            <a href="/">Kembali ke home</a>
          </Button>
        </div>
      </div>
    </div>
  );
}
