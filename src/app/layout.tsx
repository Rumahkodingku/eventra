import type { Metadata } from "next";
import { Inter, Inter_Tight } from "next/font/google";
import { Providers } from "@/components/providers";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const interTight = Inter_Tight({
  variable: "--font-display-family",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://eventra.example.com"),
  title: {
    default: "Eventra — Your Gateway to Every Experience",
    template: "%s | Eventra",
  },
  description:
    "Eventra adalah platform discovery dan ticketing untuk konser, pertandingan, festival, konferensi, dan pengalaman live lainnya. Showcase frontend dengan transaksi simulasi.",
  applicationName: "Eventra",
  keywords: [
    "event",
    "tiket",
    "konser",
    "festival",
    "olahraga",
    "konferensi",
    "ticketing",
  ],
  openGraph: {
    title: "Eventra — Your Gateway to Every Experience",
    description:
      "Temukan pengalaman live yang layak keluar rumah. Showcase frontend dengan transaksi simulasi.",
    type: "website",
    images: [
      {
        url: "/brand/og.png",
        width: 1200,
        height: 630,
        alt: "Eventra — Your Gateway to Every Experience",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Eventra — Your Gateway to Every Experience",
    description:
      "Temukan pengalaman live yang layak keluar rumah. Showcase frontend dengan transaksi simulasi.",
    images: ["/brand/og.png"],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="id"
      suppressHydrationWarning
      data-scroll-behavior="smooth"
      className={`${inter.variable} ${interTight.variable}`}
    >
      <body className="min-h-svh bg-canvas text-ink antialiased">
        <a
          href="#main"
          className="sr-only z-[100] rounded-full bg-ink px-5 py-3 text-sm font-medium text-canvas focus:not-sr-only focus:fixed focus:left-4 focus:top-4"
        >
          Lewati ke konten utama
        </a>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
