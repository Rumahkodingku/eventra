import type { Event, Notification, Order, Review } from "@/domain/types";

const DAY = 86_400_000;

export function buildReviews(events: Event[], now: Date): Review[] {
  const definitions = [
    {
      eventIndex: 0,
      authorName: "Nadia",
      rating: 5,
      comment:
        "Produksi panggungnya rapi, sound-nya jernih, dan Aurora benar-benar membawa energi. Worth it.",
      daysAgo: 6,
    },
    {
      eventIndex: 2,
      authorName: "Rizky",
      rating: 5,
      comment:
        "Atmosfer tribun luar biasa. Kursi bernomor bikin semuanya lebih tenang dan nyaman.",
      daysAgo: 14,
    },
    {
      eventIndex: 5,
      authorName: "Sari",
      rating: 4,
      comment:
        "Teaternya kuat, kostumnya detail. Jeda sedikit panjang, tapi pertunjukannya memuaskan.",
      daysAgo: 18,
    },
    {
      eventIndex: 8,
      authorName: "Bimo",
      rating: 5,
      comment:
        "Visual dan orkestranya menyatu dengan baik. Malam yang terasa terlalu cepat selesai.",
      daysAgo: 21,
    },
    {
      eventIndex: 10,
      authorName: "Kevin",
      rating: 4,
      comment:
        "Materi workshopnya padat dan praktis. Networking-nya juga terasa natural.",
      daysAgo: 25,
    },
    {
      eventIndex: 13,
      authorName: "Laras",
      rating: 4,
      comment:
        "Line-up-nya cocok untuk pencinta musik baru. Ruangannya intim dan tidak terlalu ramai.",
      daysAgo: 29,
    },
    {
      eventIndex: 18,
      authorName: "Putri",
      rating: 5,
      comment:
        "Pasar komunitas yang hangat. Banyak karya lokal yang benar-benar menarik.",
      daysAgo: 33,
    },
    {
      eventIndex: 0,
      authorName: "Yoga",
      rating: 4,
      comment:
        "Lagu-lagu barunya enak didengar live. Semoga next show bisa bawa produksi yang lebih besar.",
      daysAgo: 4,
    },
  ];

  return definitions.map((definition, index) => {
    const event = events[definition.eventIndex];
    return {
      id: `review-${index + 1}`,
      eventId: event?.id ?? events[0].id,
      userId: index === 0 ? "user-customer" : undefined,
      authorName: definition.authorName,
      rating: definition.rating,
      comment: definition.comment,
      createdAt: new Date(
        now.getTime() - definition.daysAgo * DAY,
      ).toISOString(),
    };
  });
}

export function buildNotifications(orders: Order[], now: Date): Notification[] {
  const confirmed = orders.find((order) => order.orderStatus === "CONFIRMED");
  const failed = orders.find((order) => order.orderStatus === "PAYMENT_FAILED");
  const pending = orders.find(
    (order) => order.orderStatus === "PENDING_PAYMENT",
  );
  const items = [
    {
      type: "ORDER" as const,
      title: "Pesanan berhasil dibuat",
      message: confirmed
        ? `Pesanan ${confirmed.orderNumber} sudah dikonfirmasi. Tiketmu siap digunakan.`
        : "Pesanan demo kamu sudah dibuat.",
      targetUrl: confirmed ? `/orders/${confirmed.id}` : "/orders",
      daysAgo: 1,
      read: false,
    },
    {
      type: "TICKET" as const,
      title: "Tiket digital siap",
      message:
        "QR tiket sudah tersedia di My Tickets. Simpan atau cetak sebelum hari acara.",
      targetUrl: "/tickets",
      daysAgo: 1,
      read: false,
    },
    {
      type: "EVENT" as const,
      title: "Pengingat acara minggu ini",
      message:
        "Ada acara yang kamu simpan dalam 7 hari ke depan. Cek jadwal dan lokasinya.",
      targetUrl: "/wishlist",
      daysAgo: 2,
      read: false,
    },
    {
      type: "ORDER" as const,
      title: "Pembayaran perlu dicoba lagi",
      message: failed
        ? `Pembayaran untuk ${failed.orderNumber} gagal. Keranjangmu masih tersimpan.`
        : "Ada pembayaran simulasi yang gagal. Kamu bisa mencoba lagi.",
      targetUrl: failed ? `/orders/${failed.id}` : "/cart",
      daysAgo: 3,
      read: true,
    },
    {
      type: "ORDER" as const,
      title: "Menunggu pembayaran",
      message: pending
        ? `Pesanan ${pending.orderNumber} masih menunggu pembayaran simulasi.`
        : "Selesaikan pembayaran simulasi untuk mengunci tiket.",
      targetUrl: pending ? `/orders/${pending.id}` : "/orders",
      daysAgo: 4,
      read: true,
    },
    {
      type: "SYSTEM" as const,
      title: "Selamat datang di Eventra",
      message:
        "Ini adalah showcase frontend. Semua transaksi, stok, dan pembayaran adalah simulasi.",
      targetUrl: "/",
      daysAgo: 7,
      read: true,
    },
  ];

  return items.map((item, index) => ({
    id: `notif-${index + 1}`,
    userId: "user-customer",
    type: item.type,
    title: item.title,
    message: item.message,
    targetUrl: item.targetUrl,
    readAt: item.read
      ? new Date(now.getTime() - item.daysAgo * DAY).toISOString()
      : undefined,
    createdAt: new Date(now.getTime() - item.daysAgo * DAY).toISOString(),
  }));
}
