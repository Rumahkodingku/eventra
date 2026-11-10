# 16 — Implementation Plan

**Status:** IMPLEMENTED — POST-QA PASS (2026-11-10)
**Baseline:** Dokumentasi produk dan desain v1.1 (`00`–`15`)
**Scope:** Seluruh P0, P1, dan P2
**Platform:** Frontend-only, responsive desktop dan mobile
**Tanggal:** 2026-11-10

## 1. Tujuan dokumen

Dokumen ini adalah rencana eksekusi lengkap untuk membangun Eventra dari scaffold `create-next-app` menjadi showcase ticketing end-to-end.

Dokumen ini:

- Menerjemahkan requirement `02`, route `07`, flow `08`, arsitektur `09`, data `10`, roadmap `11`, dan QA `12` menjadi task yang bisa dieksekusi.
- Menetapkan urutan phase, dependency, output, dan acceptance criteria.
- Mencatat keputusan yang sudah dikunci.
- Mencatat GATE yang belum boleh diasumsikan.
- Menjadi acuan status implementasi dan QA.

Dokumen ini bukan pengganti spesifikasi produk. Jika terjadi konflik:

1. Locked decisions `00` dan `15`.
2. Business rules `02`, terutama D1–D10.
3. Invariant data `10 §9`.
4. Route dan flow `07`/`08`.
5. Arsitektur `09`.
6. Desain `05`/`13`.
7. QA `12`.

Perubahan scope, brand, palette, role model, ticketing mode, payment simulation, atau aturan bisnis harus memperbarui `15` dan dokumen terkait.

---

## 2. Decision register

### 2.1 Keputusan terkunci

| ID    | Decision           | Approved value                                                                           |
| ----- | ------------------ | ---------------------------------------------------------------------------------------- |
| D-016 | Locale dan URL     | `next-intl` tanpa locale prefix; locale dari cookie/localStorage; seluruh route IA tetap |
| D-017 | Konten event       | UI bilingual ID/EN; konten event satu bahasa, seed Bahasa Indonesia                      |
| D-018 | Service fee        | 5% dari subtotal, dibulatkan ke Rp100, cap Rp25.000 per order                            |
| D-019 | Promo              | `EVENTRA10`, `HEMAT50K`, `EXPIRED10`                                                     |
| D-020 | Tanggal seed       | Relatif saat seed/reset, 7–120 hari ke depan, dipersist                                  |
| D-021 | Organizer scope    | Satu organizer demo memiliki semua event seed; organizer lain hanya profil               |
| D-022 | Guest access       | Guest dapat mengakses order/tiket berbasis record lokal di browser                       |
| D-023 | Payment simulation | Toggle simulasi gagal; login demo memakai `demo12345`; password tidak disimpan           |
| D-024 | Aset dan QA        | Foto berlisensi lokal, wordmark Eventra, Vitest + Playwright                             |
| D-025 | Route kanonis      | `/events` kanonis; `/search` redirect; ticket selection di `/events/[slug]/tickets`      |
| D-026 | Fase               | Reset data Phase 0; theme switcher Phase 6                                               |

### 2.2 GATE yang belum ditutup

GATE berikut tidak boleh diasumsikan. Task yang bertanda GATE berhenti sampai keputusan diberikan.

| ID   | Ambiguitas                      | Rekomendasi                                                                                                                           | Blocked tasks              |
| ---- | ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- | -------------------------- |
| G-01 | Promo stacking dan usage        | Satu promo per order, tanpa stacking; `usedCount` bertambah saat order `CONFIRMED`; usage per browser                                 | P2-09, P3-06               |
| G-02 | Registrasi dan login akun lokal | Registrasi auto-login; semua akun lokal memakai `demo12345`; password tidak disimpan                                                  | P4-01, P4-02               |
| G-03 | Pembatalan                      | Tidak ada customer cancel/refund; organizer cancel event → order dan ticket `CANCELLED`; event ended → ticket `EXPIRED`               | P3-10, P4-03, P5-04        |
| G-04 | Aturan koleksi homepage         | Field seed `isFeatured`, `isTrending`, `isRecommended`, `popularity`; upcoming dari `startAt`; limited/early-bird dari flag eksplisit | P0-10, P1-01               |
| G-05 | Schema amendment                | Tambahan field pada §5.2                                                                                                              | P0-10, P0-14, P5-04        |
| G-06 | Analytics dan CSV               | Range 7/30/90/all; CSV kolom pada §10.5                                                                                               | P5-02, P5-06, P5-09        |
| G-07 | Token kontras                   | Secondary `#5C6270`; warning text `#8A5A12`; warning fill `#B7791F` dengan teks ink; update dokumen `05`/`13`/`15`                    | P0-04                      |
| G-08 | Seat layout                     | Arena 4×6×10 = 240 seat; Theater 2×8×14 = 224 seat; 2 accessible seat per section; beberapa blocked                                   | P0-10, P0-15, P2-03, P5-05 |

---

## 3. Prinsip eksekusi

1. Bangun vertical slice, bukan breadth-first.
2. Setiap phase harus menghasilkan aplikasi yang bisa dijalankan dan diuji.
3. Jangan mulai polish dekoratif sebelum core flow stabil.
4. Tidak ada fitur dianggap selesai sebelum dijalankan di browser.
5. Semua UI memakai token semantik; tidak ada hard-coded color, radius, atau spacing.
6. Semua data access lewat repository; komponen tidak import seed JSON langsung.
7. Semua localStorage access hanya di client.
8. Semua uang berupa integer IDR; satu pricing utility.
9. Semua route guard adalah UX, bukan security.
10. Semua fitur P0 punya minimal satu acceptance test.
11. Semua copy user-facing memakai translation key.
12. Semua fitur P1/P2 tetap dicatat, walau ditunda.
13. Setiap phase diakhiri laporan completed, deferred, dan blocked.
14. Perubahan scope masuk decision log sebelum diimplementasikan.

---

## 4. Arsitektur

### 4.1 Stack

Terpasang:

- Next.js `16.4.6`, App Router.
- React `19.3.0`.
- TypeScript `5`.
- Tailwind CSS `4.3.3` melalui `@tailwindcss/turbopack`.
- Biome `2.4.2`.

Ditambahkan:

- shadcn/ui + Radix primitives.
- Zustand.
- React Hook Form + Zod + `@hookform/resolvers`.
- Motion for React (`motion`).
- Recharts.
- Lucide React.
- date-fns.
- `react-qr-code`.
- `next-intl`.
- `clsx`, `tailwind-merge`, `class-variance-authority`.
- Vitest, React Testing Library, jsdom.
- Playwright, `@axe-core/playwright`.

Tidak wajib:

- TanStack Query. Gunakan hanya jika repository async benar-benar membutuhkan cache terpusat.

### 4.2 Struktur folder final

```text
src/
  app/
    (public)/
      page.tsx
      events/
        page.tsx
        [slug]/
          page.tsx
          tickets/page.tsx
      categories/[slug]/page.tsx
      search/page.tsx
      cart/page.tsx
      checkout/
        page.tsx
        result/[orderId]/page.tsx
        success/[orderId]/page.tsx
    (account)/
      tickets/
        page.tsx
        [ticketId]/page.tsx
      orders/
        page.tsx
        [orderId]/page.tsx
      wishlist/page.tsx
      notifications/page.tsx
      profile/
        page.tsx
        settings/page.tsx
    (auth)/
      login/page.tsx
      register/page.tsx
    organizer/
      page.tsx
      dashboard/page.tsx
      events/
        page.tsx
        new/page.tsx
        [eventId]/
          page.tsx
          edit/page.tsx
          tickets/page.tsx
      orders/
        page.tsx
        [orderId]/page.tsx
      attendees/page.tsx
      check-in/page.tsx
      analytics/page.tsx
      settings/page.tsx
    layout.tsx
    loading.tsx
    not-found.tsx
    error.tsx
    global-error.tsx
    globals.css
  components/
    ui/
    shared/
    layouts/
  features/
    discovery/
    events/
    ticket-selection/
    seat-map/
    cart/
    checkout/
    tickets/
    wishlist/
    account/
    notifications/
    organizer/
    analytics/
  domain/
    event/
    ticket/
    order/
    user/
    organizer/
    promo/
    review/
  data/
    seed/
    factories/
  services/
    repositories/
    mock/
  stores/
  hooks/
  i18n/
    messages/
      id.json
      en.json
    config.ts
    provider.tsx
  lib/
    currency.ts
    dates.ts
    validation.ts
    storage.ts
    ids.ts
    cn.ts
    csv.ts
    qr.ts
  config/
    brand.ts
    navigation.ts
    site.ts
  types/
```

### 4.3 Layer dan dependency

```text
route/page
  -> feature component
    -> domain use-case
      -> repository interface
        -> mock adapter
          -> seed data + local persistence
```

Aturan:

- `domain` tidak import React, Next, Zustand, atau localStorage.
- `features` boleh import domain, repository interface, hooks, dan components.
- `components/ui` tidak import domain.
- `services/mock` satu-satunya layer yang menyentuh storage.
- `app` hanya composition, metadata, dan route params.

### 4.4 Client/server boundary

- Server component merender shell, metadata, dan seed statis.
- Client island menangani interaksi, localStorage, session, cart, seat map, dan chart.
- `useSearchParams` dibungkus `Suspense` sesuai aturan Next 16.
- `params` dan `searchParams` selalu async.
- Tidak ada localStorage di server component.
- Persisted state dihydrate setelah mount; sebelum selesai tampilkan skeleton, bukan default menyesatkan.
- `cacheComponents: true` dan `partialPrefetching: true` dipertahankan.
- Route statis tetap prerender; data lokal menjadi client island.

### 4.5 State ownership

| State                                                                  | Owner                       |
| ---------------------------------------------------------------------- | --------------------------- |
| Search, filter, sort, pagination, view                                 | URL query                   |
| Dialog, form step, hover, seat viewport                                | Local component             |
| Session, cart, wishlist, recently viewed, notifications, locale, theme | Zustand                     |
| Orders, tickets, attendees, organizer overlays, preferences            | localStorage via repository |
| Seed data                                                              | Immutable module + overlay  |

### 4.6 Repository interfaces

- `EventRepository`: list, getBySlug, getById, create, update, delete, listByOrganizer.
- `TicketRepository`: listByEvent, getById, updateAvailability.
- `CartRepository`: get, save, clear.
- `OrderRepository`: create, getById, list, updateStatus.
- `TicketWalletRepository`: list, getById, updateStatus.
- `UserRepository`: demoLogin, register, updateProfile, logout.
- `OrganizerRepository`: dashboardMetrics, listOrders, listAttendees, checkIn.
- `NotificationRepository`: list, markRead, markAllRead.
- `PromoRepository`: validate, listActive, recordUsage.
- `ReviewRepository`: listByEvent, create, eligibility.
- `AnalyticsRepository`: salesTrend, ticketBreakdown, eventComparison, attendanceRate.

Semua method async, deterministic, dengan latency kecil untuk loading state.

### 4.7 Error model

Typed errors:

- `NotFoundError`
- `InvalidSelectionError`
- `SoldOutError`
- `SalesWindowClosedError`
- `InvalidPromoError`
- `ValidationError`
- `UnauthorizedDemoError`
- `StorageCorruptionError`

Semua error dipetakan ke pesan i18n. Tidak ada raw error ke user.

### 4.8 Persistence

Versioned keys:

```text
rk-ticketing:meta:v1
rk-ticketing:session:v1
rk-ticketing:cart:v1
rk-ticketing:wishlist:v1
rk-ticketing:recently-viewed:v1
rk-ticketing:recent-searches:v1
rk-ticketing:orders:v1
rk-ticketing:tickets:v1
rk-ticketing:attendees:v1
rk-ticketing:notifications:v1
rk-ticketing:reviews:v1
rk-ticketing:preferences:v1
rk-ticketing:organizer-events:v1
rk-ticketing:promo-usage:v1
```

Aturan:

- Payload divalidasi Zod.
- Schema version disimpan.
- Data korup/outdated fallback ke seed, bukan crash.
- Reset menghapus semua key dan regenerate seed.
- Seed immutable; organizer changes disimpan sebagai overlay/copied record.
- Tidak menyimpan gambar biner; preview memakai object URL.
- Tidak menyimpan kredensial pembayaran.

### 4.9 Checkout use case

1. Validasi cart dan referensi event/ticket.
2. Validasi sale window, quantity, seat, dan duplicate seat.
3. Validasi buyer/attendee.
4. Hitung subtotal, fee, discount, total lewat satu utility.
5. Buat order `PENDING_PAYMENT`.
6. Jalankan simulasi pembayaran.
7. Sukses: order `CONFIRMED`, payment `PAID`, buat ticket per attendee/seat.
8. Gagal: order `PAYMENT_FAILED`, payment `FAILED`, tidak ada ticket valid.
9. Hapus item cart yang berhasil dibeli.
10. Buat notifikasi lokal.
11. Route ke result/success.

### 4.10 State machine

Event:

```text
DRAFT -> PUBLISHED -> PAUSED -> PUBLISHED -> ENDED
CANCELLED dari DRAFT/PUBLISHED/PAUSED
```

Order/payment:

```text
PENDING_PAYMENT -> CONFIRMED
PENDING_PAYMENT -> PAYMENT_FAILED
PENDING_PAYMENT -> CANCELLED
```

Payment:

```text
UNPAID -> PROCESSING -> PAID
UNPAID -> PROCESSING -> FAILED
UNPAID -> CANCELLED
```

Ticket:

```text
VALID -> USED
VALID -> CANCELLED
VALID -> EXPIRED
```

Cascade:

- Event `PAUSED`: purchase disabled; ticket existing tetap valid.
- Event `ENDED`: purchase disabled; ticket `VALID` menjadi `EXPIRED`.
- Event `CANCELLED`: purchase disabled; ticket `VALID` menjadi `CANCELLED`.
- `USED` tidak bisa check-in ulang.

### 4.11 Seat model

- Layout berisi sections → rows → seats.
- Seat ID stabil: `layoutId:sectionId:row:number`.
- Seat punya `sectionId`, `row`, `number`, `status`, `accessible`.
- `SELECTED` hanya state sesi; tidak pernah disimpan sebagai inventory.
- Section punya `priceTierId` yang merujuk `TicketType.id` untuk mode seated.
- Seat map wajib punya legend, label section, keyboard navigation, dan list alternative.
- Maksimal seat per order mengikuti `TicketType.maxPerOrder`.
- Seat yang sudah dipilih di cart lain pada browser yang sama tidak bisa dipilih lagi.

### 4.12 Next.js 16 constraints

- `params` dan `searchParams` async; gunakan `PageProps`/`LayoutProps`.
- `middleware` sudah diganti `proxy`; plan ini tidak membutuhkan proxy karena locale tanpa prefix.
- `cacheComponents` dan `partialPrefetching` aktif.
- Route yang membaca search params harus memperhatikan prerender/Suspense.
- Tailwind v4 memakai `@theme`.
- Verifikasi kompatibilitas shadcn CLI dengan loader `@tailwindcss/turbopack`.
- Baca `node_modules/next/dist/docs/01-app/` sebelum menulis kode.
- `next lint` sudah dihapus; gunakan Biome.

---

## 5. Data dan seed

### 5.1 Entity final

- `Category`: id, slug, name, description, image, icon, subcategories.
- `Venue`: id, name, address, city, region, country, timezone, mapUrl, layoutId.
- `Organizer`: id, userId, displayName, description, logo, email, socialLinks.
- `Event`: id, slug, title, categoryId, subcategoryId, description, coverImage, gallery, organizerId, status, ticketingMode, startAt, endAt, timezone, venueId, tags, highlights, schedule, terms, createdAt, updatedAt.
- `TicketType`: id, eventId, name, description, price, currency, quota, soldCount, minPerOrder, maxPerOrder, salesStartAt, salesEndAt, benefits, status, kind.
- `VenueLayout`: layoutId, sections.
- `Section`: id, name, label, priceTierId, rows.
- `Seat`: id, sectionId, row, number, status, accessible.
- `User`: id, name, email, phone, avatar, role, locale, createdAt.
- `DemoSession`: userId, role, startedAt.
- `CartItem`: id, ownerKey, eventId, ticketTypeId, quantity, seatIds, unitPriceSnapshot, addedAt.
- `Order`: id, orderNumber, userId, ownerKey, buyer, items, subtotal, serviceFee, discount, total, currency, paymentMethod, paymentStatus, orderStatus, createdAt, paidAt.
- `OrderItem`: id, orderId, eventId, ticketTypeId, ticketNameSnapshot, eventTitleSnapshot, eventStartAtSnapshot, venueNameSnapshot, quantity, seatIds, unitPriceSnapshot, lineSubtotal, attendeeIds.
- `Attendee`: id, orderId, ticketId, fullName, email, phone, checkInStatus, checkedInAt.
- `Ticket`: id, ticketCode, orderId, eventId, ticketTypeId, attendeeId, seatId, status, issuedAt, checkedInAt.
- `WishlistItem`: id, ownerKey, userId, eventId, createdAt.
- `Notification`: id, userId, type, title, message, readAt, createdAt, targetUrl.
- `Review`: id, eventId, userId, rating, comment, createdAt.
- `PromoCode`: id, code, type, value, startsAt, endsAt, minimumSpend, maxDiscount, eligibleEventIds, eligibleCategoryIds, usageLimit, usedCount, isActive.
- `Preferences`: locale, theme, city, notification prefs.

### 5.2 Schema amendment — GATE G-05

Tambahan wajib:

- `Event`: `isFeatured`, `isTrending`, `isRecommended`, `popularity`, `limitedAvailability`, `isEarlyBird`.
- `TicketType.status`: `ACTIVE | INACTIVE | SOLD_OUT`.
- `Notification.userId`.
- `WishlistItem.userId` dan `ownerKey`.
- `Organizer.userId`.
- `PromoCode.usedCount`.
- `Section.priceTierId` didefinisikan sebagai `TicketType.id`.
- Shape `schedule[]`, `highlights[]`, `terms[]`, `socialLinks[]`.
- `Venue.layoutId` wajib untuk event reserved/hybrid.
- `CartItem` tidak menyimpan attendee; attendee dikumpulkan saat checkout.

### 5.3 Seed final

- 8 kategori: Concert & Music, Sports, Festival, Conference & Seminar, Entertainment, Exhibition, Arts & Culture, Community.
- 24 event:
  - 18 upcoming.
  - 3 past untuk ticket history.
  - 1 paused.
  - 1 cancelled.
  - 1 draft.
- Minimal 2 GA, 2 reserved, 2 hybrid di antara event upcoming.
- 3 organizer profile; satu organizer demo memiliki semua event.
- 6–10 venue; 2 layout:
  - Arena: 4 section × 6 row × 10 seat = 240 seat.
  - Theater: 2 tier × 8 row × 14 seat = 224 seat.
- 3–5 ticket type untuk event terpilih; semua event minimal 1.
- 2 demo user:
  - `customer@demo.local`
  - `organizer@demo.local`
  - password `demo12345`
- 8–10 order lintas status; ticket valid/used/cancelled/expired; attendee.
- 6–8 notifikasi; 6–10 review; promo valid/invalid.
- 1 sold-out event; 1 event limited availability; 1 early-bird.
- Semua konten event fiktif.
- Foto lokal di `public/images/events/`; attribution file.
- Tanggal relatif terhadap `seedNow` yang disimpan di meta; reset regenerate.

### 5.4 Fee dan promo

Service fee:

```text
fee = round(subtotal * 0.05 / 100) * 100
fee = min(fee, 25000)
```

Promo:

- `EVENTRA10`: percentage 10%, min 250.000, max discount 100.000.
- `HEMAT50K`: fixed 50.000, min 500.000.
- `EXPIRED10`: percentage 10%, `endsAt < seedNow`, selalu invalid.
- Discount tidak boleh membuat total negatif.
- Hanya satu promo per order — GATE G-01.

### 5.5 Aturan tanggal

- Event upcoming: `startAt = seedNow + 7..120 days`.
- Sales start: `seedNow - 30..0 days`.
- Sales end: `startAt - 1..14 days`.
- Past event: `startAt = seedNow - 120..-1 days`.
- Order dates tersebar 0–90 hari ke belakang untuk analytics.
- Unit test memakai fixed clock; seed factory menerima `now` sebagai parameter.
- Reset memakai `seedNow` baru; hasil deterministik per reset.

### 5.6 Storage keys

Lihat §4.8.

### 5.7 Invariants

- Quantity positive integer within min/max.
- Price, fee, discount, total non-negative integer IDR.
- Satu seat maksimal satu valid ticket pada state lokal.
- Satu ticket per attendee/seat unit.
- Ticket code unik.
- QR hanya demo ticket code/opaque ID.
- Sale window dihormati.
- `SOLD_OUT` derived dari quota.
- Promo discount tidak melebihi subtotal.
- Status transition hanya lewat domain function.
- Tidak ada PII di URL, QR, atau CSV di luar kolom yang disetujui.

---

## 6. Design system implementation

### 6.1 Token

Light:

- `background #F7F6F2`
- `surface #FFFFFF`
- `surface.subtle #F0F0ED`
- `text.primary #111318`
- `text.secondary #5C6270` — koreksi kontras dari `#737987`
- `text.inverse #FFFFFF`
- `brand.primary #7357F6`
- `brand.primary-hover #6245E8`
- `brand.primary-subtle #EEEAFE`
- `border #E5E5E2`
- `success #16845B`
- `warning.fill #B7791F`
- `warning.text #8A5A12` — koreksi kontras
- `danger #C44545`
- `info #2768B2`
- `lime #C7F36B`

Dark:

- `background #111318`
- `surface #171B2B`
- `surface.subtle #222638`
- `text.primary #F7F6F2`
- `text.secondary #B6BAC5`
- `text.inverse #111318`
- `brand.primary #8B78FF`
- `brand.primary-hover #A092FF`
- `brand.primary-subtle #30295B`
- `border #343849`
- `success #45B88A`
- `warning #E2B45B`
- `danger #F07878`
- `info #78A9E8`

Aturan kontras:

- Violet hanya untuk teks di atas putih, bukan di atas soft violet.
- Soft violet memakai teks ink.
- Warning fill memakai teks ink; warning text memakai `#8A5A12`.
- Semua pasangan dicek WCAG 2.2 AA.
- GATE G-07 untuk nilai final dan update dokumen `05`/`13`/`15`.

### 6.2 Tipografi dan layout

- Font UI/body: Inter; display family sama dengan weight ekspresif.
- Scale: 12, 14, 16, 18, 20, 24, 30, 36, display 48–64.
- Tabular numerals untuk harga, order ID, analytics.
- Spacing 4px scale.
- Max width 1280–1440.
- Gutter 32–48 / 24 / 16–20.
- Radius 8, 12, 16, 24, pill.
- Breakpoint 640, 768, 1024, 1280, 1536.
- Motion 120ms, 180–220ms, 280–360ms.
- Reduced motion wajib.

### 6.3 Komponen wajib

Global:
`Button`, `IconButton`, `Input`, `Textarea`, `Select`, `Combobox`, `Checkbox`, `Radio`, `Switch`, `Badge`, `StatusBadge`, `Tooltip`, `Tabs`, `Breadcrumbs`, `Pagination`, `DropdownMenu`, `Popover`, `Dialog`, `Drawer`, `AlertDialog`, `Toast`, `Skeleton`, `Spinner`, `EmptyState`, `ErrorState`, `Avatar`, `AvatarGroup`, `LanguageSwitcher`, `DemoNotice`, `ConfirmDialog`.

Customer:
`EventCard`, `FeaturedEventCard`, `CategoryTile`, `EventMeta`, `OrganizerMiniProfile`, `TicketTierCard`, `QuantityStepper`, `SeatMap`, `Seat`, `SeatLegend`, `SectionSelector`, `SeatListAlternative`, `PriceBreakdown`, `PromoCodeInput`, `CartItem`, `OrderSummary`, `PaymentMethodOption`, `DigitalTicket`, `QRCodePanel`, `ReviewCard`, `NotificationItem`.

Organizer:
`DashboardSidebar`, `DashboardTopbar`, `StatCard`, `ChartPanel`, `DataTable`, `FilterBar`, `SearchToolbar`, `EventStatusBadge`, `EventForm`, `TicketTypeForm`, `AttendeeRow`, `CheckInStatus`, `ExportMenu`.

### 6.4 State wajib

Setiap komponen interaktif:
default, hover, focus-visible, active/pressed, selected, disabled, loading, error/invalid.

Seat:
available, selected, unavailable/sold, restricted, accessible, hover/focus preview.

### 6.5 Accessibility

- Target WCAG 2.2 AA.
- Semantic heading dan landmark.
- Keyboard untuk navigation, dialog, menu, seat selection.
- Focus visible.
- Label dan error association.
- Status tidak hanya warna.
- Alt text untuk gambar bermakna; decorative empty alt.
- Reduced motion.
- `lang` metadata berubah.
- Announce async status.
- Seat map punya list alternative.

### 6.6 Assets

- 24 foto event berlisensi, disimpan lokal.
- Attribution file.
- Wordmark Eventra sederhana; favicon; OG image.
- Rasio card 16:9 atau 4:3; poster 3:4.
- Tidak ada remote URL untuk core UI.
- Object position metadata untuk crop.

---

## 7. Route dan page inventory

| Route                                 | Akses                | Tanggung jawab                                     |
| ------------------------------------- | -------------------- | -------------------------------------------------- |
| `/`                                   | Guest                | Homepage, hero, koleksi, kategori, recently viewed |
| `/events`                             | Guest                | Listing, filter, sort, grid/list, URL state        |
| `/events/[slug]`                      | Guest                | Event detail                                       |
| `/events/[slug]/tickets`              | Guest                | Ticket tier, quantity, seat map                    |
| `/categories/[slug]`                  | Guest                | Category overview dan event list                   |
| `/search`                             | Guest                | Redirect ke `/events?q=`                           |
| `/cart`                               | Guest/customer       | Cart multi-event, pricing, promo                   |
| `/checkout`                           | Guest/customer       | Buyer/attendee, payment simulation                 |
| `/checkout/result/[orderId]`          | Guest/session        | Processing, success, failure, retry                |
| `/checkout/success/[orderId]`         | Guest/session        | Order confirmation                                 |
| `/tickets`                            | Guest lokal/customer | Ticket wallet, tab upcoming/past/cancelled/expired |
| `/tickets/[ticketId]`                 | Guest lokal/customer | Ticket detail, QR, print                           |
| `/orders`                             | Guest lokal/customer | Order history                                      |
| `/orders/[orderId]`                   | Guest lokal/customer | Order detail                                       |
| `/wishlist`                           | Guest/customer       | Wishlist                                           |
| `/notifications`                      | Customer             | Notification center                                |
| `/login`                              | Guest                | Demo login                                         |
| `/register`                           | Guest                | Local registration                                 |
| `/profile`                            | Customer             | Profile                                            |
| `/profile/settings`                   | Customer             | Preferences                                        |
| `/organizer`                          | Organizer            | Redirect dashboard                                 |
| `/organizer/dashboard`                | Organizer            | KPI, chart, recent orders                          |
| `/organizer/events`                   | Organizer            | Event list                                         |
| `/organizer/events/new`               | Organizer            | Create event                                       |
| `/organizer/events/[eventId]`         | Organizer            | Event overview                                     |
| `/organizer/events/[eventId]/edit`    | Organizer            | Edit event                                         |
| `/organizer/events/[eventId]/tickets` | Organizer            | Ticket config                                      |
| `/organizer/orders`                   | Organizer            | Order list                                         |
| `/organizer/orders/[orderId]`         | Organizer            | Order detail                                       |
| `/organizer/attendees`                | Organizer            | Attendee list                                      |
| `/organizer/check-in`                 | Organizer            | Check-in simulation                                |
| `/organizer/analytics`                | Organizer            | Analytics                                          |
| `/organizer/settings`                 | Organizer            | Settings                                           |
| `not-found`                           | Semua                | Safe recovery                                      |
| `error`                               | Semua                | Recoverable error                                  |

Unknown ID selalu menampilkan not-found yang berguna. Route guard hanya UX.

---

## 8. Work breakdown structure

### Phase 0 — Foundation

**P0-01 — Baseline dan Next 16 spike**

- Jalankan app existing; baca docs Next 16 untuk async params, cacheComponents, partialPrefetching, proxy, image, testing.
- Verifikasi pola client island + localStorage.
- Acceptance: `dev`, `build`, `lint` baseline pass; catatan spike.
- Depends: none.

**P0-02 — Dependency dan scripts**

- Install dependency pada §4.1.
- Scripts: `typecheck`, `test`, `test:run`, `test:e2e`, `format:check`.
- Acceptance: lockfile update; semua script jalan.

**P0-03 — shadcn/Radix setup**

- Init shadcn dengan Tailwind v4; verifikasi loader `@tailwindcss/turbopack`.
- Tambah `cn`, CVA, primitive dialog/dropdown/tabs/toast.
- Jika CLI tidak kompatibel: bungkus Radix manual; jangan ganti Tailwind setup tanpa keputusan.
- Acceptance: Button/Dialog/Dropdown render; tidak ada konflik style.

**P0-04 — Token dan global CSS**

- Implement light/dark token, typography, spacing, radius, shadow, focus ring, print CSS, reduced motion.
- Koreksi kontras `text.secondary`, `warning.text`; verifikasi semua pasangan.
- Update dokumen `05`, `13`, `15` jika nilai token berubah.
- Acceptance: token table implemented; axe contrast pass; tidak ada hard-coded color di komponen.
- GATE G-07.

**P0-05 — Font, brand, metadata**

- Inter via `next/font`; fallback; tabular numerals.
- `brand.ts`: name, tagline, descriptor, logo path, palette.
- Wordmark Eventra sederhana; favicon; OG image; metadata.
- Acceptance: brand centralized; font load; alt/logo accessible.

**P0-06 — i18n foundation**

- `next-intl` tanpa routing; locale cookie/localStorage; provider; `id.json`/`en.json`; typed keys.
- `document.documentElement.lang` update.
- Format IDR, tanggal, timezone event; `id-ID` dan `en`.
- Acceptance: switch locale preserves route/state; long strings tidak overflow; tidak ada fragment concatenation.
- Technical spike: pastikan kompatibel dengan `cacheComponents`; jika tidak, stop dan minta keputusan.

**P0-07 — Theme foundation**

- CSS variables, class strategy, provider, persist, system preference.
- Toggle UI ditunda Phase 6.
- Acceptance: token dark/light render; tidak ada flash; reduced motion.

**P0-08 — App shell**

- Root layout, public header, mobile nav, footer P1 (company/help/legal/social links), breadcrumbs P1, account menu, language switcher, cart/wishlist badge, toast, dialog/drawer, error boundary, not-found, loading.
- Acceptance: responsive 360/768/1280; keyboard; focus; no dead links.

**P0-09 — Domain types dan errors**

- Semua entity/enum; typed errors; DTO/domain mapping.
- Acceptance: typecheck; tidak ada `any` di domain.

**P0-10 — Seed data**

- 8 kategori, 24 event, 3 organizer, venue, 2 layout, ticket type, promo, 2 demo user, order, ticket, attendee, notification, review.
- Acceptance: seed count; 2 GA/2 reserved/2 hybrid; sold-out/paused/cancelled; semua tanggal sesuai; konten fiktif.
- GATE G-04, G-05, G-08.

**P0-11 — Repository interfaces dan mock adapter**

- Semua repository pada §4.6; async latency; deterministic; seed overlay.
- Acceptance: interface test; tidak ada UI import seed langsung.

**P0-12 — Persistence**

- Versioned keys; Zod schema; migration; corruption fallback; reset; seed overlay.
- Acceptance: malformed payload fallback; reset restore; tidak ada SSR access.

**P0-13 — Pricing, fee, promo**

- Integer IDR; fee 5% round 100 cap 25.000; discount; total; promo validation.
- Acceptance: unit test semua kombinasi; total tidak negatif; satu sumber.
- GATE G-01.

**P0-14 — State machine**

- Event/order/payment/ticket transition; cascade.
- Acceptance: unit test semua transisi valid/invalid.
- GATE G-03, G-05.

**P0-15 — Seat model**

- Layout, stable ID, status, selection, list alternative, price tier.
- Acceptance: unit test duplicate seat, sold/blocked, accessible list.
- GATE G-08.

**P0-16 — Test harness**

- Vitest, RTL, Playwright, axe; fixtures; reset per test.
- Acceptance: sample unit/component/e2e pass.

**P0-17 — Asset pipeline**

- Download 24 foto berlisensi; optimasi; local path; attribution; wordmark/favicon/OG.
- Acceptance: tidak ada remote URL; alt text; dimensi konsisten.

**P0-18 — Reset demo data**

- UI action di demo settings; confirm; clear keys; reseed; feedback.
- Acceptance: E2E reset restore seed; tidak ada orphan data.

**P0-19 — Foundation QA**

- Typecheck, lint, build, unit; shell breakpoint; locale; reset; console.
- Acceptance: semua pass; laporan.

Exit Phase 0:

- App jalan.
- Token, font, i18n, shell siap.
- Seed, repository, persistence, pricing, state machine, seat model siap.
- Reset bekerja.
- Test harness siap.

---

### Phase 1 — Discovery

**P1-01 — Homepage**

- Hero/featured campaign, kategori, featured/trending/upcoming/recommended, location collection P1, limited/early-bird label P1, recently viewed P1.
- Acceptance: semua section punya data; CTA bekerja; responsive.
- GATE G-04.

**P1-02 — Search dan autocomplete**

- Search input, suggestions event/category/venue/city, recent searches, keyboard nav, Enter, clear, no-result.
- Acceptance: keyboard accessible; recent search persist; no result recovery.

**P1-03 — Event listing `/events`**

- Keyword, filter category/date/city/price/ticketing mode/availability, sort recommended/soonest/newest/price/popularity, grid/list, chips, clear-all, count, pagination/load-more, URL sync.
- Acceptance: kombinasi filter benar; URL shareable; empty/error state.

**P1-04 — Category page**

- Overview, hero, subcategory chips, filter, event list.
- Acceptance: kategori kosong punya empty state; filter konsisten.

**P1-05 — Event detail**

- Cover, title, category, organizer profile, status, date/time/timezone, venue, description, highlights, schedule/lineup/participants, terms, age/accessibility notes, ticket types, sales window, availability, mode indicator, CTA, wishlist/share/copy, related, sticky summary desktop, mobile sticky CTA, breadcrumbs.
- Bedakan event date dari ticket sales end date.
- Acceptance: info kritis di atas; CTA ke ticket flow; share feedback; age/accessibility notes tampil bila relevan.

**P1-06 — Wishlist**

- Add/remove, persist, count, page, empty CTA.
- Acceptance: toggle persist setelah refresh; guest/customer.

**P1-07 — Recently viewed**

- Record saat detail dibuka; tampil di home; maksimal 8; persist.
- Acceptance: tidak duplikat; urutan terbaru.

**P1-08 — Location selector**

- Manual city; persist; collection.
- Acceptance: tidak minta geolocation; clear filter.

**P1-09 — States dan skeleton**

- Loading, empty, error, no-result, disabled, offline local-only notice.
- Acceptance: setiap page punya state; tidak ada blank screen.

**P1-10 — Responsive discovery**

- Mobile filter drawer, grid/list, sticky CTA, breadcrumbs.
- Acceptance: 360–1536; no horizontal overflow.

**P1-11 — Discovery tests**

- Unit filter/sort; component card/filters; E2E search → detail.
- Acceptance: pass; QA mapping.

Exit Phase 1:

- Browse/search/filter/open event.
- URL state shareable.
- Wishlist dan recently viewed persist.
- Semua state responsive.

---

### Phase 2 — Ticket selection dan cart

**P2-01 — Ticket tier cards**

- Price, benefit, quota, sale window, status, kind; GA/reserved/hybrid.
- Acceptance: sold-out/closed disabled dengan alasan; benefit tampil.

**P2-02 — Quantity stepper**

- Min/max, remaining quota, disabled, inline error.
- Acceptance: tidak bisa melewati batas; update total.

**P2-03 — Seat map**

- Sections, rows, seats; stable ID; states available/selected/sold/blocked/restricted/accessible; legend; keyboard; list alternative; section selector; mobile full-screen; pan/zoom.
- Acceptance: sold/blocked tidak bisa dipilih; selected distinct beyond color; accessible list works.
- GATE G-08.

**P2-04 — Hybrid flow**

- Pilih GA atau reserved per line; mixed cart; label jelas.
- Acceptance: tidak double-count; price source benar.

**P2-05 — Selection summary**

- Selected seats/quantity, unit/line total, fee policy.
- Acceptance: sinkron dengan seat map dan cart.

**P2-06 — Countdown simulation P1**

- Local visual countdown; bukan reservation; expiry behavior.
- Acceptance: label simulasi; tidak memblokir tanpa penjelasan.

**P2-07 — Cart**

- Multi-event line, event/ticket/seat, update/remove, empty, invalid/expired.
- Acceptance: recalculate; cart persist; remove recalculates.

**P2-08 — Price breakdown**

- Subtotal, service fee, discount, total; IDR.
- Acceptance: satu utility; tidak ada fee mendadak.

**P2-09 — Promo**

- Apply/remove, valid/invalid/expired/ineligible, min spend, eligibility, usage cap, recalc.
- Acceptance: deterministic; error inline; cart preserved.
- GATE G-01.

**P2-10 — Cart persistence dan validation**

- Hydration, sale window, stock, duplicate seat, conflict.
- Acceptance: refresh tetap; corrupt fallback; conflict message.

**P2-11 — Ticket/cart tests**

- Unit pricing/seat; component tier/cart; E2E GA/reserved/hybrid.
- Acceptance: pass.

Exit Phase 2:

- Tiga mode bekerja.
- Constraint lokal enforced.
- Cart persist.
- Harga konsisten.

---

### Phase 3 — Checkout dan digital tickets

**P3-01 — Checkout layout**

- Buyer contact, attendee per ticket, use buyer details, terms, order summary, simulation notice.
- Acceptance: mobile single-column; summary terlihat.

**P3-02 — Validation**

- Zod schema; required; email/phone; inline error; preserve valid values; error summary.
- Acceptance: invalid field fokus; valid values retained.

**P3-03 — Guest/customer**

- Guest checkout; customer prefill; session.
- Acceptance: guest tidak dipaksa daftar.

**P3-04 — Payment methods**

- Bank transfer, e-wallet, QRIS, card; tidak ada nomor kartu/CVV/OTP.
- Acceptance: hanya pilihan metode; notice simulasi.

**P3-05 — Payment simulation**

- Processing, success, failure toggle, retry/return, duplicate prevention.
- Acceptance: deterministic; failure tidak membuat ticket valid.
- GATE G-02 untuk auth terkait.

**P3-06 — Order creation**

- Snapshot buyer/attendee/event/ticket/seat/price; order number; status; notification.
- Acceptance: snapshot immutable; total cocok.

**P3-07 — Ticket generation**

- Satu ticket per attendee/seat; kode unik; QR opaque; status.
- Acceptance: QR hanya demo code; ticket count benar.

**P3-08 — Result page**

- Processing, success, failure, cancelled; retry/recovery.
- Acceptance: refresh tetap; tidak dead end.

**P3-09 — Success page**

- Order reference, summary, ticket links, simulation notice.
- Acceptance: guest bisa akses via local record.

**P3-10 — My tickets**

- Upcoming/past/cancelled/expired tabs; search/filter; guest/customer empty state.
- Acceptance: generated ticket muncul; tab benar.
- GATE G-03.

**P3-11 — Ticket detail dan print**

- Event, attendee, seat, QR, code, print/download, share tanpa PII.
- Acceptance: QR quiet zone; print hides nav; unknown ID not-found.

**P3-12 — Orders**

- `/orders`, `/orders/[orderId]`; list, filter, detail, items, totals, tickets; guest local access.
- Acceptance: guest local record; status benar.

**P3-13 — Failure/recovery**

- Invalid promo, invalid field, payment failure, empty cart.
- Acceptance: retry/return path; no data loss.

**P3-14 — Checkout tests**

- Unit validation/pricing; E2E GA + reserved checkout; failure path.
- Acceptance: pass.

Exit Phase 3:

- Purchase simulation end-to-end.
- No real payment data.
- Order/ticket persist.
- Failure recoverable.

---

### Phase 4 — Customer account

**P4-01 — Demo login**

- Customer/organizer buttons, credentials, demo notice, `demo12345`, session.
- Acceptance: role nav; logout; wrong credential error.
- GATE G-02.

**P4-02 — Registration**

- Form, validation, local user, duplicate email, auto-login/login rule.
- Acceptance: local user; no password stored; demo notice.
- GATE G-02.

**P4-03 — Logout dan route guard**

- Logout; role-aware nav; UX guard; permission state.
- Acceptance: customer cannot open organizer; organizer redirect.
- GATE G-03.

**P4-04 — Profile**

- View/edit name, email, phone; avatar preview object URL; preferences.
- Acceptance: persist; avatar not durable; validation.

**P4-05 — Settings**

- Language, theme (Phase 6), notification prefs P2, password UI P2.
- Acceptance: preference persist; no secure password claim.

**P4-06 — Notifications**

- Center, unread count, list, mark one/all read, target link, empty; demo notifications for order, ticket, dan event updates.
- Acceptance: generated order/ticket notification; read persist.

**P4-07 — Account overview**

- Ringkasan tiket/order/wishlist.
- Acceptance: cards link benar; empty state.

**P4-08 — Account tests**

- Login/logout, guard, profile, notifications, i18n.
- Acceptance: pass.

Exit Phase 4:

- Guest/customer jelas.
- Demo account akses ticket/order.
- Localization account selesai.

---

### Phase 5 — Organizer

**P5-01 — Organizer shell**

- Sidebar/topbar, responsive collapse, organizer profile, nav distinct.
- Acceptance: mobile drawer; active state.

**P5-02 — Dashboard**

- KPI gross sales, tickets sold, active events, attendees; sales trend; ticket breakdown; recent orders; upcoming events; date range 7/30/90/all; demo notice.
- Acceptance: labels, units, range; chart axes/legend; empty.
- GATE G-06.

**P5-03 — Event list**

- Search/filter/sort/status; table/cards; pagination; empty.
- Acceptance: filter status; mobile card.

**P5-04 — Event create/edit**

- Form sections; validation; image preview local; venue/category/date/timezone; ticketing mode; terms/highlights/schedule; draft/published/paused/ended/cancelled; delete confirm; preview.
- Acceptance: publish rules; status transitions termasuk ENDED/CANCELLED; preview.
- GATE G-03, G-05.

**P5-05 — Ticket config**

- Tier CRUD; kind/price/quota/min/max/sales window/benefits/status; mode; seat sections; validation overlapping windows/quota; preview seat map.
- Acceptance: invalid quota/window blocked; mode-specific fields.
- GATE G-08.

**P5-06 — Orders**

- Table search/filter/status; detail buyer/attendee; payment status; CSV.
- Acceptance: CSV expected columns; no unrelated PII.
- GATE G-06.

**P5-07 — Attendees**

- Table/detail, search, ticket mapping, check-in status/time, check-in history, attendance summary.
- Acceptance: search; counts; history tampil.

**P5-08 — Check-in**

- Dedicated route; code lookup; simulated QR; display event/attendee/seat/status; confirm; duplicate prevention; history.
- Acceptance: first check-in `VALID → USED`; second shows already used.

**P5-09 — Analytics**

- Sales/revenue trend; ticket by tier; event comparison; attendance/check-in; CSV; demo notice; empty/loading.
- Acceptance: figures derive from local data; range filter; no real claim.

**P5-10 — Organizer settings**

- Profile/contact; branding/social P2; notification prefs P2; payout masked demo P2.
- Acceptance: persist; no real bank fields.

**P5-11 — Organizer tests**

- CRUD, transition, config validation, order filter, check-in, CSV, reset.
- Acceptance: pass.

Exit Phase 5:

- Organizer create/edit/publish.
- Ticket config reflect mode.
- Orders/attendees inspectable.
- Analytics labeled demo.

---

### Phase 6 — Advanced experience P1/P2

**P6-01 — Theme switcher**

- Light/dark/system; persist; no flash; check both themes.
- Acceptance: contrast; no hydration mismatch.

**P6-02 — Search enhancement**

- Ranking, recent search management, keyboard, debounce.
- Acceptance: basic P0 not regress.

**P6-03 — Calendar**

- ICS download/add-to-calendar.
- Acceptance: file valid; event details correct.

**P6-04 — Reviews**

- Rating, comment, list, average, sort/filter, eligibility from local ticket.
- Acceptance: only eligible user; average correct.

**P6-05 — Seat map enhancement**

- Pan/zoom, mini-map, section focus, motion.
- Acceptance: keyboard/list alternative tetap; performance.

**P6-06 — Motion polish**

- Page entrance, micro-interaction, cart count; reduced motion.
- Acceptance: no blocking animation; reduced motion respected.

**P6-07 — Newsletter**

- UI local success state only.
- Acceptance: no network; validation.

**P6-08 — Notification preferences**

- UI; persist; no real delivery.
- Acceptance: toggles persist.

**P6-09 — Password-change UI**

- UI only; no secure storage claim.
- Acceptance: demo notice; validation.

**P6-10 — Organizer branding/social**

- Edit branding/social links; persist.
- Acceptance: preview; validation.

**P6-11 — Organizer payout**

- Masked sample data; no real bank.
- Acceptance: no sensitive input.

**P6-12 — Advanced tests**

- Reduced motion, theme, review eligibility, ICS.
- Acceptance: pass.

Exit Phase 6:

- Enhancement tidak regress core.
- Reduced motion bekerja.
- Semua P1/P2 terdaftar dan berstatus.

---

### Phase 7 — QA dan release

**P7-01 — Full regression**

- Semua P0 acceptance test.
- Acceptance: pass atau defect tercatat.

**P7-02 — Responsive matrix**

- 360, 390, 414, 430, 768, 1024, 1280, 1440, 1536.
- Acceptance: no overflow; tables/cards; seat map touch.

**P7-03 — Accessibility**

- Keyboard, focus, dialog, form labels/errors, seat list, contrast, alt, lang, reduced motion.
- Acceptance: WCAG 2.2 AA; axe clean untuk halaman utama.

**P7-04 — Performance**

- Image sizes, lazy charts, seat map DOM, localStorage parse, layout shift, bundle.
- Acceptance: no avoidable CLS; heavy modules lazy.

**P7-05 — Localization sweep**

- Semua key, long strings, IDR/date, document lang, no fragment.
- Acceptance: ID/EN parity.

**P7-06 — Seed quality**

- 8 kategori; 20–30 event; 2 GA/2 reserved/2 hybrid; sold-out/paused/cancelled; promo; order/ticket.
- Acceptance: seed checklist pass.

**P7-07 — Resilience**

- Corrupt localStorage, unknown ID, empty state, sold-out, expired promo.
- Acceptance: no crash; recovery.

**P7-08 — Privacy/security**

- No real payment fields; QR opaque; no PII in URL/QR/CSV; demo notice; route guard caveat.
- Acceptance: checklist pass.

**P7-09 — Browser**

- Chrome + one other.
- Acceptance: core flow pass.

**P7-10 — README/demo**

- Setup, demo accounts, reset, scope, known limitations, screenshots.
- Acceptance: reviewer can run without backend.

**P7-11 — Release gate**

- All P0 pass; P1/P2 deferred documented.
- Acceptance: no dead primary action.

**P7-12 — QA tracker**

- Status `NOT STARTED/IN PROGRESS/PASS/FAIL/DEFERRED`, evidence, browser, viewport.
- Acceptance: complete.

---

## 9. Traceability fitur ke task

| Feature                | Tasks                                          |
| ---------------------- | ---------------------------------------------- |
| A1 Global shell        | P0-04, P0-06, P0-08                            |
| A2 Home/discovery      | P1-01, P1-02, P1-07, P1-08, P6-07              |
| A3 Listing/search      | P1-02, P1-03, P1-09, P1-10                     |
| A4 Category            | P1-04                                          |
| A5 Event detail        | P1-05                                          |
| A6 Ticket selection    | P2-01–P2-06                                    |
| A7 Cart                | P2-07–P2-10                                    |
| A8 Checkout            | P3-01–P3-05, P3-13                             |
| A9 Confirmation/ticket | P3-06–P3-09, P3-11, P6-03                      |
| A10 My tickets/orders  | P3-10–P3-12, P3-14                             |
| A11 Wishlist/recent    | P1-06, P1-07                                   |
| A12 Account/auth       | P4-01–P4-05, P6-09                             |
| A13 Notifications      | P4-06, P6-08                                   |
| A14 Reviews            | P6-04                                          |
| B1 Organizer shell     | P5-01                                          |
| B2 Dashboard           | P5-02                                          |
| B3 Event management    | P5-03, P5-04                                   |
| B4 Ticket management   | P5-05                                          |
| B5 Orders              | P5-06                                          |
| B6 Attendees/check-in  | P5-07, P5-08                                   |
| B7 Analytics           | P5-09                                          |
| B8 Settings            | P5-10, P6-10, P6-11                            |
| C Cross-cutting        | P0-04, P0-06, P1-09, P1-10, P6-01, P6-06, P7-* |

---

## 10. QA dan acceptance

### 10.1 Environment matrix

- Mobile narrow: 360–390.
- Mobile wide: 414–430.
- Tablet: 768–1024.
- Desktop: 1280–1440.
- Wide desktop: 1536+.
- Chrome dan satu browser mayor lain.

### 10.2 Unit Vitest

- Pricing, fee, discount, total.
- Promo valid/invalid/expired/min spend/eligibility.
- Event/order/payment/ticket transition.
- Seat selection, duplicate, sold/blocked, accessible list.
- Storage schema, migration, corruption.
- Filter/sort.
- Date/timezone/currency formatting.
- CSV columns.

### 10.3 Component RTL

- Ticket tier, quantity, cart, price breakdown.
- Form validation, error association.
- Dialog/drawer focus.
- Empty/error/loading.
- Seat list alternative.
- Notification read state.

### 10.4 E2E Playwright

1. Guest GA: home → event → ticket → cart → checkout → success → ticket.
2. Reserved: event → seat map → cart → checkout → ticket per seat.
3. Organizer: login → create event → publish → order/attendee → check-in.
4. Failure: checkout failure → retry.
5. Reset data.
6. Locale switch dan theme.

### 10.5 CSV columns — GATE G-06

- Order number.
- Order date.
- Event title.
- Buyer name.
- Buyer email.
- Ticket type.
- Quantity.
- Seat IDs/numbers.
- Subtotal.
- Service fee.
- Discount.
- Total.
- Order status.
- Payment status.

Tidak ada phone, alamat, atau data pembayaran.

### 10.6 Manual QA

- Accessibility.
- Responsive.
- Browser.
- Performance.
- Seed quality.
- Acceptance matrix `12`.
- Visual QA kedua bahasa.

### 10.7 Definition of done per fitur

1. Requirement implemented.
2. Loading/empty/error/success considered.
3. Keyboard/responsive checked.
4. ID/EN verified.
5. Acceptance test pass.
6. No dead button/misleading claim.
7. Docs updated if behavior changed.

---

## 11. Performance, security, privacy

### 11.1 Performance

- Local images, `next/image`, responsive sizes.
- Priority hanya hero.
- Lazy load chart, seat map berat, QR panel jika perlu.
- Seat map DOM efisien; layout ≤240 seat.
- Zustand selector; hindari subscribe seluruh store.
- localStorage parse sekali; cache di memory.
- Skeleton untuk async simulation.
- Hindari layout shift.

### 11.2 Security dan privacy

- Tidak ada payment processing nyata.
- Tidak mengumpulkan nomor kartu, CVV, password bank, OTP.
- Demo credential publik; tampilkan notice.
- QR hanya opaque demo ticket code.
- Tidak ada PII di URL/QR.
- CSV hanya kolom yang disetujui.
- Route guard bukan security.
- localStorage bukan secure storage.
- Jangan menampilkan klaim real availability, real organizer, atau real payment.

---

## 12. Risiko dan mitigasi

| Risiko                                        | Mitigasi                                             |
| --------------------------------------------- | ---------------------------------------------------- |
| Next 16 + next-intl + cacheComponents konflik | Spike P0-06; stop dan minta keputusan jika gagal     |
| shadcn + Tailwind v4 loader konflik           | Spike P0-03; fallback Radix manual                   |
| Scope P0/P1/P2 besar                          | Vertical slice; Phase 0–3 dulu; P2 setelah P0 stabil |
| Seed relatif berubah                          | Seed factory menerima `now`; unit test fixed clock   |
| Seat map DOM berat                            | Batasi 240 seat; list alternative; section focus     |
| localStorage korup                            | Zod + version + fallback + reset                     |
| Kontras gagal AA                              | Token correction + axe                               |
| Aset tidak berlisensi                         | Attribution; local files; no remote URL              |
| Guest ownership ambigu                        | `ownerKey` lokal; tidak ada PII di URL               |
| Organizer data bercampur                      | Satu owner; filter konsisten                         |

---

## 13. Execution protocol

- Selesaikan phase dan exit criteria sebelum phase berikutnya.
- Jangan skip requirement yang gagal secara diam-diam.
- Jika requirement ambigu, catat dan minta keputusan.
- Update decision log untuk perubahan scope.
- Setelah setiap phase, laporkan completed, deferred, blocked.
- Jangan klaim fitur selesai sebelum dijalankan di app.
- Semua task memiliki status:
  `NOT STARTED | IN PROGRESS | PASS | FAIL | DEFERRED`.
- Setiap status PASS butuh evidence: test, browser, viewport, screenshot bila perlu.

---

## 14. Release gate

Tidak boleh dilabeli showcase-ready sebelum:

- Semua P0 acceptance pass.
- Tidak ada primary action yang dead.
- Tidak ada horizontal overflow di core mobile pages.
- Demo dapat dinilai tanpa backend.
- Known limitations terdokumentasi.
- P1/P2 yang ditunda tercatat di README/release notes.
- Dokumentasi QA tracker lengkap.

---

## 15. GATE dan langkah berikutnya

Plan ini lengkap secara struktur. Task bertanda GATE tidak boleh dieksekusi sampai keputusan diberikan.

Rekomendasi final:

- **G-01:** Satu promo per order; usage per browser.
- **G-02:** Registrasi auto-login; akun lokal memakai `demo12345`; password tidak disimpan.
- **G-03:** Tidak ada customer cancel/refund; organizer cancel event → order/ticket `CANCELLED`; event ended → ticket `EXPIRED`.
- **G-04:** Field seed `isFeatured`, `isTrending`, `isRecommended`, `popularity`; upcoming dari `startAt`.
- **G-05:** Setujui schema amendment §5.2.
- **G-06:** Range 7/30/90/all; CSV kolom §10.5.
- **G-07:** Token kontras §6.1; update `05`/`13`/`15`.
- **G-08:** Layout Arena 4×6×10 dan Theater 2×8×14.

Setelah GATE disetujui:

1. Update `15` dengan keputusan final.
2. Mulai Phase 0.
3. Jalankan baseline dan spike.
4. Laporkan exit criteria Phase 0 sebelum Phase 1.

---

## Appendix A — Dependency list

Runtime:

- `zustand`
- `react-hook-form`
- `zod`
- `@hookform/resolvers`
- `motion`
- `recharts`
- `lucide-react`
- `date-fns`
- `react-qr-code`
- `next-intl`
- `clsx`
- `tailwind-merge`
- `class-variance-authority`

Dev:

- `vitest`
- `@vitejs/plugin-react`
- `jsdom`
- `@testing-library/react`
- `@testing-library/user-event`
- `@playwright/test`
- `@axe-core/playwright`

## Appendix B — QA matrix

| Area             | Unit          | Component    | E2E                | Manual     |
| ---------------- | ------------- | ------------ | ------------------ | ---------- |
| Discovery        | Filter/sort   | Card/filter  | Search → detail    | Responsive |
| Event detail     | —             | Sections     | CTA → ticket       | i18n       |
| Ticket selection | Seat rules    | Tier/stepper | GA/reserved/hybrid | A11y       |
| Cart             | Pricing/promo | Cart/price   | Persist/remove     | Responsive |
| Checkout         | Validation    | Form/payment | Success/failure    | Privacy    |
| Tickets          | QR payload    | Ticket card  | Wallet/detail      | Print      |
| Account          | Session rules | Forms        | Login/register     | Role guard |
| Organizer        | Metrics       | Table/form   | CRUD/check-in      | Responsive |
| Analytics        | Aggregation   | Chart        | CSV                | Labels     |
| Cross-cutting    | Formatting    | States       | Locale/theme       | WCAG       |

## Appendix C — Seed checklist

- [x] 8 kategori.
- [x] 20–30 event.
- [x] 2 GA events.
- [x] 2 reserved events.
- [x] 2 hybrid events.
- [x] 1 sold-out event.
- [x] 1 paused event.
- [x] 1 cancelled event.
- [x] 1 draft event.
- [x] 1 early-bird event.
- [x] 1 limited-availability event.
- [x] 2 venue layouts.
- [x] 2–3 organizer profiles.
- [x] 2 demo users.
- [x] 8–10 orders.
- [x] Tickets valid/used/cancelled/expired.
- [x] Attendees.
- [x] 6–8 notifications.
- [x] 6–10 reviews.
- [x] 3 promo codes.
- [x] Local images + attribution.

## Appendix D — Task status template

```text
Task:
Status: NOT STARTED | IN PROGRESS | PASS | FAIL | DEFERRED
Evidence:
Browser:
Viewport:
Test:
Notes:
```

---

## 16. Execution summary

Implementation completed on 2026-11-10 across Phase 0–7.

### Verified

- `npm run typecheck` — pass.
- `npm run lint` — pass (warnings only).
- `npm run build` — pass, 39 routes generated.
- `npm run test:run` — 19 unit tests pass.
- `npm run test:e2e` — 9 Playwright tests pass, including WCAG serious/critical checks for home, events, event detail, cart, checkout and login.
- Manual flows exercised: guest discovery, GA checkout, reserved seat checkout, hybrid selection, failure/retry, guest ticket wallet, login/logout, organizer CRUD, ticket config, orders/CSV, attendees, check-in, analytics, settings, reset data, theme and language switching, responsive widths 390/1440.

### GATE resolution

The execution request authorized the plan to proceed. GATE recommendations were adopted as follows:

- G-01: one promo per order; promo usage derived from confirmed local orders.
- G-02: local accounts auto-login; demo password `demo12345`; passwords are not stored.
- G-03: no customer refund/cancellation flow; organizer can cancel events; tickets cascade.
- G-04: event seed flags drive featured/trending/recommended; upcoming uses `startAt`.
- G-05: schema amendments from §5.2 implemented in the domain and seed.
- G-06: analytics range 7/30/90/all; CSV columns match §10.5.
- G-07: contrast tokens corrected for AA; brand-strong and danger/success text tokens added.
- G-08: Arena and Theater layouts implemented with accessible seats.

### Known limitations

- Frontend-only simulation; no server authority.
- Event content is Indonesian while UI copy is bilingual.
- Playwright covers smoke and accessibility for core public pages; organizer regression is manually exercised.
- Review filtering/sorting and core P2 polish are implemented; some open-ended visual enhancements remain optional.
- Photography is local Unsplash demo material pending client-approved licensed assets.

---

## 17. Brand and completeness closure (2026-11-10)

Executed after the first QA pass.

### Brand assets

- Light wordmark: `public/logo/eventra-light-mode-bg-transparent.png`.
- Dark wordmark: `public/logo/eventra-dark-mode-bg-transparent.png`.
- Mark: `public/logo/eventra-logo-mark.png`.
- Favicon/app icon: `src/app/icon.png` and `src/app/apple-icon.png`.
- OG image: `public/brand/og.png`.
- Logo paths centralized in `src/config/brand.ts`.
- Header auto-switches light/dark; footer, organizer sidebar, and dark panels use the dark wordmark.
- Compact contexts use the mark. Organizer profiles use monogram initials, not the Eventra logo.
- Old `/brand/eventra-mark.svg`, `/brand/og.svg`, `icon.svg`, and default favicon references were removed.

### Feature closure

- Event editor now supports highlights, schedule rows, terms, age notes, accessibility notes, and subcategory.
- New event sales windows start immediately and end two days before the event.
- Existing event prices are managed in ticket configuration; event editing no longer silently updates one tier.
- Seat inventory supports Arena/Theater templates, section-to-tier mapping, preview, and guarded regeneration.
- Attendee table has a detail dialog with order, ticket, seat, and check-in information.
- Search has deferred suggestions, ranking, keyboard navigation, recent-search removal, and clear-all.
- Seat map has zoom controls, section counts, and a mobile scroll hint.
- Reviews support rating filters and newest/highest sorting.
- Organizer event list has load-more pagination.
- Motion respects reduced motion; pricing summary transitions are non-blocking.
- Responsive overflow was removed from ticket selection and organizer dashboard at 360/390.

### Verification after closure

- `npm run typecheck` — pass.
- `npm run lint` — pass, 0 diagnostics.
- `npm run build` — pass.
- `npm run test:run` — 19 unit tests pass.
- `npm run test:e2e` — 23 Playwright tests pass: 17 Chromium tests plus 6 Firefox smoke/logo tests.
- Axe serious/critical checks pass for public and organizer pages.
- No horizontal overflow at 360, 390, 768, and 1024 on audited core pages.
