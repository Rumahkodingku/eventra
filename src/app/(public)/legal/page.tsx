import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function LegalPage() {
  return (
    <div className="container-page section-space">
      <div className="mx-auto max-w-3xl">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-strong">
          Eventra
        </p>
        <h1 className="mt-3 font-display text-4xl font-semibold sm:text-5xl">
          Syarat & Privasi
        </h1>
        <div className="mt-8 space-y-8 text-sm leading-7 text-muted">
          <section>
            <h2 className="font-display text-2xl font-semibold text-ink">
              Syarat penggunaan
            </h2>
            <p className="mt-3">
              Eventra adalah showcase frontend untuk Rumah Kodingku. Semua
              event, organizer, harga, stok, order, dan tiket adalah data
              fiktif. Tidak ada transaksi nyata yang diproses.
            </p>
            <p className="mt-3">
              Jangan memasukkan data pribadi sensitif, nomor kartu, kredensial
              bank, atau OTP ke dalam aplikasi ini. Data demo disimpan di
              localStorage browser dan dapat hilang kapan saja.
            </p>
          </section>
          <section id="privacy">
            <h2 className="font-display text-2xl font-semibold text-ink">
              Privasi
            </h2>
            <p className="mt-3">
              Aplikasi tidak mengirim data ke server. Nama, email, nomor
              telepon, order, tiket, dan preferensi hanya tersimpan di browser.
              QR tiket hanya berisi kode demo, bukan data pribadi.
            </p>
            <p className="mt-3">
              Gunakan tombol Reset data demo di pengaturan untuk menghapus
              seluruh data lokal.
            </p>
          </section>
          <section>
            <h2 className="font-display text-2xl font-semibold text-ink">
              Lisensi aset
            </h2>
            <p className="mt-3">
              Foto event berasal dari Unsplash untuk keperluan demonstrasi.
              Kredit dan daftar sumber tersedia di{" "}
              <code className="rounded bg-surface-subtle px-1.5 py-0.5 text-xs">
                public/images/events/ATTRIBUTION.md
              </code>
              .
            </p>
          </section>
        </div>
        <Button asChild className="mt-8">
          <Link href="/">Kembali ke home</Link>
        </Button>
      </div>
    </div>
  );
}
