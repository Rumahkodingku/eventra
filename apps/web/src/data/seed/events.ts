import {
  arenaLayout,
  cloneLayout,
  getTemplateLayout,
} from "@/data/seed/layouts";
import type {
  Event,
  EventStatus,
  ScheduleItem,
  TicketingMode,
  TicketType,
  Venue,
  VenueLayout,
} from "@/domain/types";

const DAY = 86_400_000;

const terms = [
  "Tiket hanya berlaku untuk satu orang dan satu kali masuk.",
  "Tunjukkan QR code atau kode tiket kepada petugas di pintu masuk.",
  "Dilarang membawa senjata, minuman keras, dan barang berbahaya ke dalam venue.",
  "Penyelenggara berhak mengubah susunan acara dengan pemberitahuan sebelumnya.",
];

function slugify(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

function atLocalTime(
  now: Date,
  offsetDays: number,
  hour: number,
  minute: number,
  timezone: string,
): Date {
  const target = new Date(now.getTime() + offsetDays * DAY);
  const offset =
    timezone === "Asia/Jayapura" ? 9 : timezone === "Asia/Makassar" ? 8 : 7;
  return new Date(
    Date.UTC(
      target.getUTCFullYear(),
      target.getUTCMonth(),
      target.getUTCDate(),
      hour - offset,
      minute,
      0,
      0,
    ),
  );
}

function iso(date: Date): string {
  return date.toISOString();
}

function roundPrice(value: number): number {
  return Math.round(value / 1000) * 1000;
}

function baseBenefits(name: string): string[] {
  if (name.toLowerCase().includes("vip")) {
    return [
      "Area terbaik",
      "Fast lane masuk",
      "Welcome drink",
      "Merchandise eksklusif",
    ];
  }
  if (name.toLowerCase().includes("early")) {
    return ["Harga terbatas", "Akses area reguler", "Masuk lebih awal"];
  }
  if (
    name.toLowerCase().includes("front") ||
    name.toLowerCase().includes("orchestra")
  ) {
    return ["Paling dekat panggung", "Akses khusus", "Kursi bernomor"];
  }
  return ["Kursi bernomor", "Akses area", "Kursi nyaman"];
}

function makeGaTiers(
  eventId: string,
  basePrice: number,
  _startAt: string,
  salesStartAt: string,
  salesEndAt: string,
  options: {
    earlyBird: boolean;
    soldOut: boolean;
    limited: boolean;
    past: boolean;
  },
): TicketType[] {
  const definitions = [
    ...(options.earlyBird
      ? [
          {
            key: "early",
            name: "Early Bird",
            multiplier: 0.8,
            quota: 50,
            description: "Harga khusus untuk pembelian awal, jumlah terbatas.",
          },
        ]
      : []),
    {
      key: "regular",
      name: "Regular",
      multiplier: 1,
      quota: 250,
      description: "Akses area reguler dengan pengalaman penuh.",
    },
    {
      key: "vip",
      name: "VIP Experience",
      multiplier: 1.7,
      quota: 80,
      description: "Area VIP dengan akses dan fasilitas tambahan.",
    },
  ];

  return definitions.map((definition) => {
    const soldCount = options.soldOut
      ? definition.quota
      : Math.round(definition.quota * (options.limited ? 0.76 : 0.22));
    return {
      id: `tt-${eventId}-${definition.key}`,
      eventId,
      name: definition.name,
      description: definition.description,
      price: roundPrice(basePrice * definition.multiplier),
      currency: "IDR",
      quota: definition.quota,
      soldCount,
      minPerOrder: 1,
      maxPerOrder: 6,
      salesStartAt,
      salesEndAt,
      benefits: baseBenefits(definition.name),
      status: options.soldOut
        ? "SOLD_OUT"
        : options.past
          ? "INACTIVE"
          : "ACTIVE",
      kind: "GENERAL_ADMISSION",
    };
  });
}

function makeSeatedTiers(
  eventId: string,
  layout: VenueLayout,
  basePrice: number,
  salesStartAt: string,
  salesEndAt: string,
  options: { soldOut: boolean; limited: boolean; past: boolean },
): TicketType[] {
  const tierDefinitions: Record<
    string,
    { name: string; multiplier: number; description: string }
  > = {
    front: {
      name: "Front Stage",
      multiplier: 1.65,
      description: "Baris paling dekat dengan panggung.",
    },
    mid: {
      name: "Main Floor",
      multiplier: 1.25,
      description: "Area tengah dengan pandangan seimbang.",
    },
    rear: {
      name: "Rear Floor",
      multiplier: 0.9,
      description: "Area belakang dengan akses cepat.",
    },
    side: {
      name: "Side Balcony",
      multiplier: 0.7,
      description: "Sudut samping dengan suasana berbeda.",
    },
    orchestra: {
      name: "Orchestra",
      multiplier: 1.4,
      description: "Lantai utama dengan jarak dekat ke panggung.",
    },
    mezzanine: {
      name: "Mezzanine",
      multiplier: 0.8,
      description: "Balkon dengan pandangan menyeluruh.",
    },
  };

  return layout.sections.map((section) => {
    const definition = tierDefinitions[section.tierKey] ?? {
      name: section.name,
      multiplier: 1,
      description: section.label,
    };
    const quota = section.seats.length;
    const soldSeats = section.seats.filter(
      (seat) => seat.status === "SOLD",
    ).length;
    return {
      id: `tt-${eventId}-${section.tierKey}`,
      eventId,
      name: definition.name,
      description: definition.description,
      price: roundPrice(basePrice * definition.multiplier),
      currency: "IDR",
      quota,
      soldCount: options.soldOut ? quota : soldSeats,
      minPerOrder: 1,
      maxPerOrder: 4,
      salesStartAt,
      salesEndAt,
      benefits: baseBenefits(definition.name),
      status: options.soldOut
        ? "SOLD_OUT"
        : options.past
          ? "INACTIVE"
          : "ACTIVE",
      kind: "SEATED",
      tierKey: section.tierKey,
    };
  });
}

interface EventBlueprint {
  title: string;
  categoryId: string;
  venueId: string;
  image: string;
  mode: TicketingMode;
  offset: number;
  status: EventStatus;
  basePrice: number;
  featured?: boolean;
  trending?: boolean;
  recommended?: boolean;
  limited?: boolean;
  earlyBird?: boolean;
  popularity: number;
  subcategory: string;
  description: string;
  highlights: string[];
  schedule: ScheduleItem[];
  ageNote?: string;
  accessibilityNote?: string;
}

const blueprints: EventBlueprint[] = [
  {
    title: "Senja Sessions: Aurora Live",
    categoryId: "cat-concert",
    venueId: "venue-jcc",
    image: "/images/events/concert-01.webp",
    mode: "GENERAL_ADMISSION",
    offset: 12,
    status: "PUBLISHED",
    basePrice: 450_000,
    featured: true,
    trending: true,
    recommended: true,
    earlyBird: true,
    popularity: 98,
    subcategory: "Pop",
    description:
      "Aurora membawa materi baru dan lagu-lagu yang membuatnya dikenal ke panggung Jakarta. Satu malam, satu ruang, dan suara yang dirancang untuk terasa dekat.",
    highlights: [
      "Penampilan penuh dari Aurora",
      "Guest performance spesial",
      "Produksi panggung dan cahaya baru",
    ],
    schedule: [
      { time: "18:00", title: "Doors open" },
      { time: "19:30", title: "Opening act" },
      { time: "20:30", title: "Aurora live" },
      { time: "22:15", title: "Encore" },
    ],
    ageNote:
      "Usia 12+; penonton di bawah 17 tahun wajib didampingi orang dewasa.",
    accessibilityNote:
      "Area kursi roda tersedia di sisi kanan panggung. Hubungi petugas untuk akses.",
  },
  {
    title: "Jakarta Night Festival 2026",
    categoryId: "cat-festival",
    venueId: "venue-gbk",
    image: "/images/events/festival-02.webp",
    mode: "GENERAL_ADMISSION",
    offset: 18,
    status: "PUBLISHED",
    basePrice: 550_000,
    featured: true,
    trending: true,
    limited: true,
    popularity: 96,
    subcategory: "Music Festival",
    description:
      "Tiga panggung, satu malam panjang. Jakarta Night Festival menghadirkan musisi lintas genre, pasar kreatif, dan ruang untuk bertemu orang baru.",
    highlights: [
      "3 panggung musik",
      "Pasar kreatif dan food court",
      "Area komunitas dan afterparty",
    ],
    schedule: [
      { time: "15:00", title: "Gate opens" },
      { time: "16:00", title: "Main stage begins" },
      { time: "21:00", title: "Headliner" },
      { time: "23:00", title: "Afterparty" },
    ],
    ageNote: "Usia 18+ untuk area afterparty.",
    accessibilityNote: "Akses kursi roda tersedia di setiap panggung utama.",
  },
  {
    title: "Liga Nusantara: Final Derby",
    categoryId: "cat-sports",
    venueId: "venue-gbk",
    image: "/images/events/sports-01.webp",
    mode: "RESERVED_SEATING",
    offset: 25,
    status: "PUBLISHED",
    basePrice: 350_000,
    featured: true,
    trending: true,
    popularity: 95,
    subcategory: "Football",
    description:
      "Dua tim terbaik musim ini bertemu di satu pertandingan yang menentukan. Pilih tribunmu dan rasakan atmosfer dari baris pertama.",
    highlights: [
      "Pertandingan final liga",
      "Fan zone sebelum kick-off",
      "Kursi bernomor di semua tribun",
    ],
    schedule: [
      { time: "16:00", title: "Fan zone opens" },
      { time: "18:30", title: "Opening ceremony" },
      { time: "19:00", title: "Kick-off" },
    ],
    accessibilityNote: "Kursi aksesibel tersedia di setiap section tribun.",
  },
  {
    title: "Future Forward Summit 2026",
    categoryId: "cat-conference",
    venueId: "venue-jcc",
    image: "/images/events/conference-01.webp",
    mode: "GENERAL_ADMISSION",
    offset: 31,
    status: "PUBLISHED",
    basePrice: 750_000,
    featured: true,
    recommended: true,
    popularity: 89,
    subcategory: "Technology",
    description:
      "Satu hari untuk membahas produk, AI, desain, dan cara tim membangun hal yang berarti. Dibuat untuk founder, product leader, dan praktisi.",
    highlights: [
      "12 sesi dan workshop",
      "Networking lunch",
      "Akses rekaman sesi",
    ],
    schedule: [
      { time: "08:30", title: "Registration" },
      { time: "09:15", title: "Opening keynote" },
      { time: "13:00", title: "Breakout sessions" },
      { time: "17:00", title: "Closing" },
    ],
    ageNote: "Usia 18+.",
    accessibilityNote: "Semua ruang utama dapat diakses kursi roda.",
  },
  {
    title: "Monochrom: Contemporary Ink",
    categoryId: "cat-exhibition",
    venueId: "venue-jogja",
    image: "/images/events/exhibition-01.webp",
    mode: "GENERAL_ADMISSION",
    offset: 38,
    status: "PUBLISHED",
    basePrice: 120_000,
    recommended: true,
    popularity: 82,
    subcategory: "Art",
    description:
      "Pameran seni kontemporer yang mempertemukan tradisi tinta dengan eksperimen visual baru. Jelajahi karya, proses, dan cerita di baliknya.",
    highlights: [
      "30 karya dari 12 seniman",
      "Artist talk setiap akhir pekan",
      "Katalog pameran digital",
    ],
    schedule: [
      { time: "10:00", title: "Gallery opens" },
      { time: "14:00", title: "Artist talk" },
      { time: "20:00", title: "Gallery closes" },
    ],
    accessibilityNote: "Lantai pameran dapat diakses kursi roda.",
  },
  {
    title: "Malam Teater: Bumi Manusia",
    categoryId: "cat-entertainment",
    venueId: "venue-tunjungan",
    image: "/images/events/theatre-01.webp",
    mode: "RESERVED_SEATING",
    offset: 45,
    status: "PUBLISHED",
    basePrice: 300_000,
    featured: true,
    popularity: 91,
    subcategory: "Theatre",
    description:
      "Adaptasi panggung yang menghidupkan kembali cerita, pergulatan, dan keberanian di awal abad ke-20. Durasi penuh dengan jeda.",
    highlights: [
      "Pertunjukan teater penuh",
      "Kostum dan tata panggung baru",
      "Diskusi singkat setelah pertunjukan",
    ],
    schedule: [
      { time: "18:30", title: "Doors open" },
      { time: "19:30", title: "Act I" },
      { time: "20:45", title: "Intermission" },
      { time: "21:00", title: "Act II" },
    ],
    ageNote: "Usia 13+.",
    accessibilityNote: "Kursi aksesibel tersedia di Orchestra dan Mezzanine.",
  },
  {
    title: "Stand Up Night: Jakarta Babak Baru",
    categoryId: "cat-entertainment",
    venueId: "venue-istora",
    image: "/images/events/comedy-01.webp",
    mode: "GENERAL_ADMISSION",
    offset: 52,
    status: "PUBLISHED",
    basePrice: 250_000,
    trending: true,
    popularity: 88,
    subcategory: "Comedy",
    description:
      "Enam komika, satu panggung, dan materi yang belum pernah keluar. Malam untuk tertawa sampai lupa waktu.",
    highlights: [
      "6 komika dalam satu malam",
      "Materi baru dan improvisasi",
      "Meet and greet setelah acara",
    ],
    schedule: [
      { time: "19:00", title: "Doors open" },
      { time: "20:00", title: "Show starts" },
      { time: "22:00", title: "Meet and greet" },
    ],
    ageNote: "Usia 18+.",
    accessibilityNote: "Area aksesibel tersedia di sisi kiri panggung.",
  },
  {
    title: "Pasar Kreatif Bandung",
    categoryId: "cat-community",
    venueId: "venue-sabuga",
    image: "/images/events/community-01.webp",
    mode: "GENERAL_ADMISSION",
    offset: 60,
    status: "PUBLISHED",
    basePrice: 75_000,
    recommended: true,
    popularity: 78,
    subcategory: "Market",
    description:
      "Pasar kurasi untuk karya lokal, makanan, dan ide baru. Temui pembuatnya langsung dan bawa pulang sesuatu yang punya cerita.",
    highlights: [
      "60+ tenant lokal",
      "Workshop gratis",
      "Live acoustic sepanjang hari",
    ],
    schedule: [
      { time: "10:00", title: "Market opens" },
      { time: "13:00", title: "Workshop" },
      { time: "17:00", title: "Live acoustic" },
      { time: "21:00", title: "Market closes" },
    ],
    accessibilityNote: "Area pasar dapat diakses kursi roda.",
  },
  {
    title: "Symphony of Lights",
    categoryId: "cat-concert",
    venueId: "venue-bali",
    image: "/images/events/concert-02.webp",
    mode: "RESERVED_SEATING",
    offset: 68,
    status: "PUBLISHED",
    basePrice: 650_000,
    featured: true,
    popularity: 93,
    subcategory: "Orchestra",
    description:
      "Orkestra dan permainan cahaya dalam satu pertunjukan. Sebuah malam sinematik di Bali yang dirancang untuk dinikmati perlahan.",
    highlights: [
      "Orkestra 40 musisi",
      "Visual light mapping",
      "Resepsi sebelum pertunjukan",
    ],
    schedule: [
      { time: "18:00", title: "Reception" },
      { time: "19:30", title: "Performance" },
      { time: "21:00", title: "Meet the orchestra" },
    ],
    ageNote: "Semua usia. Anak di bawah 12 tahun wajib didampingi.",
    accessibilityNote: "Kursi aksesibel tersedia di Orchestra.",
  },
  {
    title: "Nusantara Basketball Classic",
    categoryId: "cat-sports",
    venueId: "venue-istora",
    image: "/images/events/sports-02.webp",
    mode: "RESERVED_SEATING",
    offset: 75,
    status: "PUBLISHED",
    basePrice: 280_000,
    popularity: 84,
    subcategory: "Basketball",
    description:
      "Tim terbaik dari dua kota bertemu di lapangan. Cepat, fisik, dan penuh tekanan sampai detik terakhir.",
    highlights: [
      "All-star exhibition",
      "Half-time performance",
      "Fan zone dan merchandise",
    ],
    schedule: [
      { time: "17:00", title: "Fan zone" },
      { time: "19:00", title: "Tip-off" },
      { time: "21:00", title: "Awards" },
    ],
    accessibilityNote: "Kursi aksesibel tersedia di setiap section.",
  },
  {
    title: "Design Systems Week",
    categoryId: "cat-conference",
    venueId: "venue-jcc",
    image: "/images/events/conference-02.webp",
    mode: "HYBRID",
    offset: 82,
    status: "PUBLISHED",
    basePrice: 900_000,
    recommended: true,
    popularity: 90,
    subcategory: "Design",
    description:
      "Dua hari untuk tim produk dan desain yang ingin membangun sistem yang benar-benar dipakai. Pilih kelas umum atau kursi workshop terbatas.",
    highlights: [
      "Workshop hands-on",
      "Studi kasus dari tim produk",
      "Akses materi dan rekaman",
    ],
    schedule: [
      { time: "08:30", title: "Registration" },
      { time: "09:30", title: "Keynote" },
      { time: "11:00", title: "Workshop" },
      { time: "16:30", title: "Closing" },
    ],
    ageNote: "Usia 18+.",
    accessibilityNote: "Semua ruang dapat diakses kursi roda.",
  },
  {
    title: "The Art of Motion",
    categoryId: "cat-arts",
    venueId: "venue-semarang",
    image: "/images/events/arts-01.webp",
    mode: "GENERAL_ADMISSION",
    offset: 90,
    status: "PUBLISHED",
    basePrice: 150_000,
    popularity: 76,
    subcategory: "Contemporary",
    description:
      "Pameran dan pertunjukan yang mengeksplorasi gerak tubuh, material, dan ruang. Sebuah pengalaman yang berubah setiap kali dilihat.",
    highlights: [
      "Instalasi interaktif",
      "Pertunjukan tari kontemporer",
      "Diskusi kurator",
    ],
    schedule: [
      { time: "11:00", title: "Exhibition opens" },
      { time: "15:00", title: "Performance" },
      { time: "19:00", title: "Curator talk" },
    ],
    accessibilityNote: "Area pameran dapat diakses kursi roda.",
  },
  {
    title: "Soundscape: East Jakarta",
    categoryId: "cat-concert",
    venueId: "venue-istora",
    image: "/images/events/concert-03.webp",
    mode: "GENERAL_ADMISSION",
    offset: 100,
    status: "PUBLISHED",
    basePrice: 380_000,
    popularity: 81,
    subcategory: "Indie",
    description:
      "Line-up musisi indie dan elektronik dari Jakarta timur. Suara baru, ruang intim, dan energi yang tidak dibuat-buat.",
    highlights: [
      "5 penampil lokal",
      "Visual dan lighting baru",
      "Vinyl market",
    ],
    schedule: [
      { time: "18:00", title: "Doors open" },
      { time: "19:00", title: "First set" },
      { time: "22:00", title: "Closing set" },
    ],
    ageNote: "Usia 18+.",
    accessibilityNote: "Area aksesibel tersedia.",
  },
  {
    title: "Bali Surf & Music Weekend",
    categoryId: "cat-festival",
    venueId: "venue-bali",
    image: "/images/events/festival-03.webp",
    mode: "HYBRID",
    offset: 110,
    status: "PUBLISHED",
    basePrice: 480_000,
    featured: true,
    popularity: 94,
    subcategory: "Music Festival",
    description:
      "Dua hari musik, laut, dan komunitas. Pilih tiket umum atau kursi terbatas untuk panggung utama.",
    highlights: [
      "2 hari pertunjukan",
      "Surf clinic pagi hari",
      "Beach market dan food trucks",
    ],
    schedule: [
      { time: "09:00", title: "Surf clinic" },
      { time: "15:00", title: "Main stage" },
      { time: "21:00", title: "Sunset session" },
    ],
    ageNote: "Semua usia. Area tertentu 18+.",
    accessibilityNote: "Area utama dapat diakses kursi roda.",
  },
  {
    title: "Startup Founders Dinner",
    categoryId: "cat-conference",
    venueId: "venue-medan",
    image: "/images/events/conference-03.webp",
    mode: "GENERAL_ADMISSION",
    offset: 118,
    status: "PUBLISHED",
    basePrice: 500_000,
    popularity: 72,
    subcategory: "Business",
    description:
      "Makan malam intim untuk founder dan operator yang sedang membangun sesuatu. Pembicaraan jujur, tanpa pitch.",
    highlights: [
      "Dinner dan networking",
      "Founder fireside chat",
      "Akses komunitas",
    ],
    schedule: [
      { time: "18:30", title: "Welcome" },
      { time: "19:15", title: "Fireside chat" },
      { time: "20:30", title: "Dinner" },
    ],
    ageNote: "Usia 18+.",
    accessibilityNote: "Ruang acara dapat diakses kursi roda.",
  },
  {
    title: "Laugh Factory: Surabaya",
    categoryId: "cat-entertainment",
    venueId: "venue-tunjungan",
    image: "/images/events/comedy-02.webp",
    mode: "GENERAL_ADMISSION",
    offset: 22,
    status: "PUBLISHED",
    basePrice: 220_000,
    popularity: 80,
    subcategory: "Comedy",
    description:
      "Malam stand-up dengan komika lokal dan tamu kejutan. Duduk dekat, tertawa lebih keras.",
    highlights: ["5 komika", "Materi baru", "Foto bersama"],
    schedule: [
      { time: "19:00", title: "Doors open" },
      { time: "20:00", title: "Show starts" },
    ],
    ageNote: "Usia 18+.",
    accessibilityNote: "Area aksesibel tersedia.",
  },
  {
    title: "Court Side: All-Star Night",
    categoryId: "cat-sports",
    venueId: "venue-makassar",
    image: "/images/events/sports-03.webp",
    mode: "RESERVED_SEATING",
    offset: 27,
    status: "PUBLISHED",
    basePrice: 320_000,
    popularity: 87,
    subcategory: "Basketball",
    description:
      "Pemain terbaik dari berbagai kota berkumpul untuk satu pertandingan eksibisi yang penuh skill dan tawa.",
    highlights: ["All-star roster", "Three-point contest", "Fan interaction"],
    schedule: [
      { time: "18:00", title: "Doors open" },
      { time: "19:00", title: "Tip-off" },
    ],
    accessibilityNote: "Kursi aksesibel tersedia di semua section.",
  },
  {
    title: "Kriya Nusantara Exhibition",
    categoryId: "cat-exhibition",
    venueId: "venue-jogja",
    image: "/images/events/exhibition-02.webp",
    mode: "GENERAL_ADMISSION",
    offset: 35,
    status: "PUBLISHED",
    basePrice: 100_000,
    popularity: 74,
    subcategory: "Design",
    description:
      "Kriya tradisional bertemu desain kontemporer. Lihat proses, bahan, dan cerita di balik karya para perajin.",
    highlights: ["40 karya kurasi", "Demo proses", "Market karya"],
    schedule: [
      { time: "10:00", title: "Exhibition opens" },
      { time: "15:00", title: "Demo" },
      { time: "20:00", title: "Closes" },
    ],
    accessibilityNote: "Area pameran dapat diakses kursi roda.",
  },
  {
    title: "Ruang Temu: Community Market",
    categoryId: "cat-community",
    venueId: "venue-sabuga",
    image: "/images/events/community-02.webp",
    mode: "GENERAL_ADMISSION",
    offset: -20,
    status: "ENDED",
    basePrice: 60_000,
    popularity: 65,
    subcategory: "Meetup",
    description:
      "Pasar komunitas yang mempertemukan pembuat, tetangga, dan cerita lokal. Edisi yang sudah selesai.",
    highlights: ["50 tenant", "Workshop", "Live music"],
    schedule: [{ time: "10:00", title: "Market opens" }],
    accessibilityNote: "Area pasar dapat diakses kursi roda.",
  },
  {
    title: "Last Encore: The Final Show",
    categoryId: "cat-concert",
    venueId: "venue-istora",
    image: "/images/events/concert-04.webp",
    mode: "RESERVED_SEATING",
    offset: -45,
    status: "ENDED",
    basePrice: 600_000,
    popularity: 92,
    subcategory: "Rock",
    description:
      "Konser perpisahan yang sudah menjadi bagian dari sejarah. Malam terakhir yang tidak akan terulang.",
    highlights: ["Setlist penuh", "Guest musisi", "Merchandise terbatas"],
    schedule: [{ time: "20:00", title: "Show starts" }],
    accessibilityNote: "Kursi aksesibel tersedia.",
  },
  {
    title: "City Run 10K",
    categoryId: "cat-sports",
    venueId: "venue-gbk",
    image: "/images/events/sports-04.webp",
    mode: "GENERAL_ADMISSION",
    offset: -70,
    status: "ENDED",
    basePrice: 200_000,
    popularity: 70,
    subcategory: "Running",
    description:
      "Lari 10K keliling kota dengan rute cepat dan suporter di setiap tikungan. Edisi yang sudah selesai.",
    highlights: ["Rute 10K", "Race pack", "Finisher medal"],
    schedule: [{ time: "05:00", title: "Flag off" }],
    accessibilityNote: "Rute ramah kursi roda di area start/finish.",
  },
  {
    title: "Poetry & Jazz Evening",
    categoryId: "cat-arts",
    venueId: "venue-semarang",
    image: "/images/events/arts-02.webp",
    mode: "GENERAL_ADMISSION",
    offset: 15,
    status: "PAUSED",
    basePrice: 180_000,
    popularity: 68,
    subcategory: "Literature",
    description:
      "Malam puisi dan jazz di ruang intim. Penjualan dijeda sementara sambil menunggu konfirmasi jadwal baru.",
    highlights: ["Pembacaan puisi", "Jazz quartet", "Open mic"],
    schedule: [{ time: "19:30", title: "Performance" }],
    accessibilityNote: "Ruang acara dapat diakses kursi roda.",
  },
  {
    title: "Neon Garden Festival",
    categoryId: "cat-festival",
    venueId: "venue-bali",
    image: "/images/events/festival-01.webp",
    mode: "GENERAL_ADMISSION",
    offset: 40,
    status: "CANCELLED",
    basePrice: 450_000,
    popularity: 66,
    subcategory: "Art Festival",
    description:
      "Festival taman dengan instalasi cahaya dan musik. Acara ini dibatalkan oleh penyelenggara.",
    highlights: ["Instalasi cahaya", "Live music", "Night market"],
    schedule: [{ time: "17:00", title: "Gates open" }],
    accessibilityNote: "Area festival dapat diakses kursi roda.",
  },
  {
    title: "The Next Wave: Draft Showcase",
    categoryId: "cat-concert",
    venueId: "venue-jcc",
    image: "/images/events/concert-01.webp",
    mode: "GENERAL_ADMISSION",
    offset: 55,
    status: "DRAFT",
    basePrice: 250_000,
    popularity: 60,
    subcategory: "Indie",
    description:
      "Showcase untuk musisi baru yang sedang disiapkan. Belum dipublikasikan ke penonton.",
    highlights: ["Line-up baru", "Showcase intim", "Meet the artists"],
    schedule: [{ time: "19:00", title: "Show starts" }],
    accessibilityNote: "Area aksesibel tersedia.",
  },
];

function getVenue(venueId: string): Venue {
  const venue = venuesById[venueId];
  if (!venue) throw new Error(`Venue not found: ${venueId}`);
  return venue;
}

// Filled by buildEvents to keep getVenue local without a circular import.
let venuesById: Record<string, Venue> = {};

export function buildEvents(now: Date, venueList: Venue[]): Event[] {
  venuesById = Object.fromEntries(venueList.map((venue) => [venue.id, venue]));
  return blueprints.map((blueprint, index) => {
    const venue = getVenue(blueprint.venueId);
    const id = `evt-${String(index + 1).padStart(2, "0")}`;
    const start = atLocalTime(now, blueprint.offset, 19, 30, venue.timezone);
    const end = new Date(start.getTime() + 3 * 60 * 60 * 1000);
    const salesStartAt = iso(new Date(now.getTime() - 25 * DAY));
    const salesEndAt = iso(new Date(start.getTime() - 2 * DAY));
    const past = blueprint.offset < 0;
    const soldOut = index === 1 || index === 16;
    const limited = Boolean(blueprint.limited);
    const layout =
      blueprint.mode === "GENERAL_ADMISSION"
        ? undefined
        : cloneLayout(
            blueprint.mode === "HYBRID" && blueprint.venueId === "venue-bali"
              ? arenaLayout
              : getTemplateLayout(
                  blueprint.venueId === "venue-tunjungan" ||
                    blueprint.venueId === "venue-sabuga" ||
                    blueprint.venueId === "venue-jogja" ||
                    blueprint.venueId === "venue-medan" ||
                    blueprint.venueId === "venue-semarang"
                    ? "theater"
                    : "arena",
                ),
          );
    const gaTiers = makeGaTiers(
      id,
      blueprint.basePrice,
      iso(start),
      salesStartAt,
      salesEndAt,
      {
        earlyBird: Boolean(blueprint.earlyBird),
        soldOut,
        limited,
        past,
      },
    );
    const seatedTiers = layout
      ? makeSeatedTiers(
          id,
          layout,
          blueprint.basePrice,
          salesStartAt,
          salesEndAt,
          {
            soldOut,
            limited,
            past,
          },
        )
      : [];
    const ticketTypes =
      blueprint.mode === "GENERAL_ADMISSION"
        ? gaTiers
        : blueprint.mode === "RESERVED_SEATING"
          ? seatedTiers
          : [...gaTiers, ...seatedTiers];

    const category = categoriesById[blueprint.categoryId];
    const gallery = [
      blueprint.image,
      category?.image ?? blueprint.image,
      blueprint.image,
    ];

    return {
      id,
      slug: slugify(blueprint.title),
      title: blueprint.title,
      categoryId: blueprint.categoryId,
      subcategory: blueprint.subcategory,
      description: blueprint.description,
      coverImage: blueprint.image,
      gallery,
      organizerId: "org-rumahkodingku",
      status: blueprint.status,
      ticketingMode: blueprint.mode,
      startAt: iso(start),
      endAt: iso(end),
      timezone: venue.timezone,
      venueId: blueprint.venueId,
      tags: [category?.name ?? "Event", blueprint.subcategory],
      highlights: blueprint.highlights,
      schedule: blueprint.schedule,
      terms,
      ageNote: blueprint.ageNote,
      accessibilityNote: blueprint.accessibilityNote,
      createdAt: iso(new Date(now.getTime() - 30 * DAY)),
      updatedAt: iso(new Date(now.getTime() - 3 * DAY)),
      isFeatured: Boolean(blueprint.featured),
      isTrending: Boolean(blueprint.trending),
      isRecommended: Boolean(blueprint.recommended),
      popularity: blueprint.popularity,
      limitedAvailability: limited,
      isEarlyBird: Boolean(blueprint.earlyBird),
      ticketTypes,
      layoutId: layout?.id,
      seatLayout: layout,
    } satisfies Event;
  });
}

const categoriesById: Record<string, { name: string; image: string }> = {
  "cat-concert": {
    name: "Concert & Music",
    image: "/images/events/concert-02.webp",
  },
  "cat-sports": { name: "Sports", image: "/images/events/sports-02.webp" },
  "cat-festival": {
    name: "Festival",
    image: "/images/events/festival-03.webp",
  },
  "cat-conference": {
    name: "Conference & Seminar",
    image: "/images/events/conference-02.webp",
  },
  "cat-entertainment": {
    name: "Entertainment",
    image: "/images/events/theatre-02.webp",
  },
  "cat-exhibition": {
    name: "Exhibition",
    image: "/images/events/exhibition-02.webp",
  },
  "cat-arts": { name: "Arts & Culture", image: "/images/events/arts-02.webp" },
  "cat-community": {
    name: "Community",
    image: "/images/events/community-02.webp",
  },
};
