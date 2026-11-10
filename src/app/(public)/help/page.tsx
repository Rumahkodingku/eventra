import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/ui/logo";

export default function HelpPage() {
  return (
    <div className="container-page section-space">
      <div className="mx-auto max-w-3xl">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-strong">
          Eventra
        </p>
        <h1 className="mt-3 font-display text-4xl font-semibold sm:text-5xl">
          Bantuan
        </h1>
        <p className="mt-4 text-base leading-relaxed text-muted">
          Eventra adalah showcase frontend. Semua pembayaran, stok, dan tiket
          adalah simulasi lokal.
        </p>
        <div className="mt-8 space-y-3">
          {[
            {
              q: "Apakah saya bisa membeli tiket sungguhan?",
              a: "Tidak. Checkout hanya membuat order dan tiket demo di browser. Tidak ada uang yang diproses.",
            },
            {
              q: "Bagaimana cara masuk sebagai organizer?",
              a: "Gunakan organizer@demo.local dengan kata sandi demo12345, atau tekan tombol demo organizer di halaman login.",
            },
            {
              q: "Mengapa tiket hilang setelah membersihkan browser?",
              a: "Data disimpan di localStorage. Menghapus site data akan menghapus tiket, order, dan perubahan demo.",
            },
            {
              q: "Apakah QR tiket bisa dipakai di gate nyata?",
              a: "Tidak. QR hanya berisi kode demo dan tidak terhubung ke sistem validasi tiket.",
            },
          ].map((item) => (
            <details
              key={item.q}
              className="group rounded-2xl border border-line bg-surface p-5 open:shadow-soft"
            >
              <summary className="cursor-pointer list-none text-sm font-semibold text-ink">
                {item.q}
              </summary>
              <p className="mt-3 text-sm leading-relaxed text-muted">
                {item.a}
              </p>
            </details>
          ))}
        </div>
        <div className="mt-8 flex flex-wrap gap-2">
          <Button asChild>
            <Link href="/events">Jelajahi event</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/">Kembali ke home</Link>
          </Button>
        </div>
        <div className="mt-10 border-t border-line pt-6">
          <Logo />
        </div>
      </div>
    </div>
  );
}
