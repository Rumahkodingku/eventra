import type {
  Category,
  Organizer,
  PromoCode,
  User,
  Venue,
} from "@/domain/types";

export const categories: Category[] = [
  {
    id: "cat-concert",
    slug: "concert-music",
    name: "Concert & Music",
    description:
      "Panggung besar, suara yang lebih besar. Temukan konser, showcase, dan malam musik yang paling ditunggu.",
    image: "/images/events/concert-01.webp",
    icon: "Music2",
    subcategories: ["Pop", "Rock", "Indie", "Jazz", "Electronic"],
  },
  {
    id: "cat-sports",
    slug: "sports",
    name: "Sports",
    description:
      "Dari tribun penuh sorak sampai garis akhir. Pilih pertandingan dan rasakan energinya langsung.",
    image: "/images/events/sports-01.webp",
    icon: "Trophy",
    subcategories: ["Football", "Basketball", "Running", "Badminton"],
  },
  {
    id: "cat-festival",
    slug: "festival",
    name: "Festival",
    description:
      "Satu tempat, banyak cerita. Festival musik, kuliner, dan budaya untuk dinikmati sepanjang hari.",
    image: "/images/events/festival-01.webp",
    icon: "Sparkles",
    subcategories: ["Music Festival", "Food & Culture", "Art Festival"],
  },
  {
    id: "cat-conference",
    slug: "conference-seminar",
    name: "Conference & Seminar",
    description:
      "Bertemu orang yang tepat, membawa pulang ide baru. Konferensi dan seminar untuk tumbuh bersama.",
    image: "/images/events/conference-01.webp",
    icon: "Presentation",
    subcategories: ["Technology", "Business", "Design", "Career"],
  },
  {
    id: "cat-entertainment",
    slug: "entertainment",
    name: "Entertainment",
    description:
      "Tawa, cerita, dan kejutan di atas panggung. Pilih malam yang akan kamu ingat.",
    image: "/images/events/theatre-01.webp",
    icon: "Theater",
    subcategories: ["Theatre", "Comedy", "Dance", "Talk Show"],
  },
  {
    id: "cat-exhibition",
    slug: "exhibition",
    name: "Exhibition",
    description:
      "Lihat lebih dekat karya, ide, dan benda yang sedang membentuk percakapan hari ini.",
    image: "/images/events/exhibition-01.webp",
    icon: "Palette",
    subcategories: ["Art", "Design", "Photography", "Pop Culture"],
  },
  {
    id: "cat-arts",
    slug: "arts-culture",
    name: "Arts & Culture",
    description:
      "Warisan yang hidup dan ekspresi baru. Temukan pertunjukan, pameran, dan karya yang bermakna.",
    image: "/images/events/arts-01.webp",
    icon: "Brush",
    subcategories: ["Contemporary", "Traditional", "Literature", "Film"],
  },
  {
    id: "cat-community",
    slug: "community",
    name: "Community",
    description:
      "Ruang untuk bertemu, berbagi, dan membangun sesuatu bersama. Acara lokal yang terasa dekat.",
    image: "/images/events/community-01.webp",
    icon: "Users",
    subcategories: ["Market", "Meetup", "Social Impact", "Workshop"],
  },
];

export const venues: Venue[] = [
  {
    id: "venue-jcc",
    name: "Jakarta Convention Center",
    address: "Jalan Gatot Subroto, Senayan",
    city: "Jakarta",
    region: "DKI Jakarta",
    country: "Indonesia",
    timezone: "Asia/Jakarta",
    mapUrl: "https://maps.example.com/jcc",
    layoutId: "arena",
  },
  {
    id: "venue-istora",
    name: "Istora Senayan",
    address: "Jalan Pintu Satu Senayan",
    city: "Jakarta",
    region: "DKI Jakarta",
    country: "Indonesia",
    timezone: "Asia/Jakarta",
    mapUrl: "https://maps.example.com/istora",
    layoutId: "arena",
  },
  {
    id: "venue-gbk",
    name: "Gelora Bung Karno",
    address: "Jalan Pintu Satu Senayan",
    city: "Jakarta",
    region: "DKI Jakarta",
    country: "Indonesia",
    timezone: "Asia/Jakarta",
    mapUrl: "https://maps.example.com/gbk",
    layoutId: "arena",
  },
  {
    id: "venue-sabuga",
    name: "Sabuga ITB",
    address: "Jalan Tamansari",
    city: "Bandung",
    region: "Jawa Barat",
    country: "Indonesia",
    timezone: "Asia/Jakarta",
    mapUrl: "https://maps.example.com/sabuga",
    layoutId: "theater",
  },
  {
    id: "venue-tunjungan",
    name: "Grand City Convention Hall",
    address: "Jalan Gubeng Pojok",
    city: "Surabaya",
    region: "Jawa Timur",
    country: "Indonesia",
    timezone: "Asia/Jakarta",
    mapUrl: "https://maps.example.com/tunjungan",
    layoutId: "theater",
  },
  {
    id: "venue-jogja",
    name: "Jogja Expo Center",
    address: "Jalan Raya Janti",
    city: "Yogyakarta",
    region: "DI Yogyakarta",
    country: "Indonesia",
    timezone: "Asia/Jakarta",
    mapUrl: "https://maps.example.com/jogja",
    layoutId: "theater",
  },
  {
    id: "venue-bali",
    name: "Bali Nusa Dua Convention Center",
    address: "Kawasan Nusa Dua",
    city: "Bali",
    region: "Bali",
    country: "Indonesia",
    timezone: "Asia/Makassar",
    mapUrl: "https://maps.example.com/bali",
    layoutId: "arena",
  },
  {
    id: "venue-medan",
    name: "Medan International Convention Center",
    address: "Jalan Gatot Subroto",
    city: "Medan",
    region: "Sumatera Utara",
    country: "Indonesia",
    timezone: "Asia/Jakarta",
    mapUrl: "https://maps.example.com/medan",
    layoutId: "theater",
  },
  {
    id: "venue-makassar",
    name: "Celebes Convention Center",
    address: "Jalan Metro Tanjung Bunga",
    city: "Makassar",
    region: "Sulawesi Selatan",
    country: "Indonesia",
    timezone: "Asia/Makassar",
    mapUrl: "https://maps.example.com/makassar",
    layoutId: "arena",
  },
  {
    id: "venue-semarang",
    name: "Muladi Dome Undip",
    address: "Jalan Prof. Soedarto",
    city: "Semarang",
    region: "Jawa Tengah",
    country: "Indonesia",
    timezone: "Asia/Jakarta",
    mapUrl: "https://maps.example.com/semarang",
    layoutId: "theater",
  },
];

export const organizers: Organizer[] = [
  {
    id: "org-rumahkodingku",
    userId: "user-organizer",
    displayName: "Rumah Kodingku Live",
    description:
      "Rumah produksi pengalaman live yang menghubungkan musisi, komunitas, dan penonton di seluruh Indonesia.",
    email: "organizer@demo.local",
    socialLinks: [
      { label: "Instagram", href: "https://instagram.com/example" },
      { label: "TikTok", href: "https://tiktok.com/@example" },
      { label: "Website", href: "https://example.com" },
    ],
  },
  {
    id: "org-urbanlive",
    userId: "user-organizer-2",
    displayName: "Urban Live Asia",
    description:
      "Kurator pengalaman urban: konser intimate, kolaborasi lintas disiplin, dan festival kota.",
    email: "urban@demo.local",
    socialLinks: [
      { label: "Instagram", href: "https://instagram.com/example" },
    ],
  },
  {
    id: "org-panggung",
    userId: "user-organizer-3",
    displayName: "Panggung Nusantara",
    description:
      "Rumah bagi pertunjukan tari, teater, dan musik tradisional yang relevan untuk generasi baru.",
    email: "panggung@demo.local",
    socialLinks: [{ label: "Website", href: "https://example.com" }],
  },
];

export const users: User[] = [
  {
    id: "user-customer",
    name: "Alya Putri",
    email: "customer@demo.local",
    phone: "+62 812 0000 0001",
    role: "CUSTOMER",
    locale: "id",
    createdAt: "2026-01-12T09:00:00.000Z",
  },
  {
    id: "user-organizer",
    name: "Raka Mahendra",
    email: "organizer@demo.local",
    phone: "+62 812 0000 0002",
    role: "ORGANIZER",
    locale: "id",
    createdAt: "2025-08-01T09:00:00.000Z",
  },
];

export function buildPromos(now: Date): PromoCode[] {
  const day = 86_400_000;
  const iso = (offset: number) =>
    new Date(now.getTime() + offset).toISOString();
  return [
    {
      id: "promo-eventra10",
      code: "EVENTRA10",
      type: "PERCENTAGE",
      value: 10,
      startsAt: iso(-30 * day),
      endsAt: iso(365 * day),
      minimumSpend: 250_000,
      maxDiscount: 100_000,
      usageLimit: 500,
      usedCount: 0,
      isActive: true,
    },
    {
      id: "promo-hemat50k",
      code: "HEMAT50K",
      type: "FIXED",
      value: 50_000,
      startsAt: iso(-30 * day),
      endsAt: iso(365 * day),
      minimumSpend: 500_000,
      usageLimit: 250,
      usedCount: 0,
      isActive: true,
    },
    {
      id: "promo-expired10",
      code: "EXPIRED10",
      type: "PERCENTAGE",
      value: 10,
      startsAt: iso(-90 * day),
      endsAt: iso(-2 * day),
      usageLimit: 100,
      usedCount: 0,
      isActive: false,
    },
  ];
}
