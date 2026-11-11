"use client";

import {
  ArrowLeft,
  CalendarDays,
  ImagePlus,
  Plus,
  Save,
  Send,
  Trash2,
} from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { DemoNotice } from "@/components/ui/demo-notice";
import { EmptyState } from "@/components/ui/empty-state";
import { Field } from "@/components/ui/field";
import { Input, Select, Textarea } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import type { Event, ScheduleItem } from "@/domain/types";
import { useHydrated } from "@/hooks/use-hydrated";
import { cn } from "@/lib/cn";
import { toDateTimeLocal } from "@/lib/dates";
import { useCatalog } from "@/services/hooks/use-catalog";
import { useEventStore } from "@/services/hooks/use-event-store";

const defaultImage = "/images/events/concert-01.webp";
const imageOptions = [
  "/images/events/concert-01.webp",
  "/images/events/festival-02.webp",
  "/images/events/sports-01.webp",
  "/images/events/conference-01.webp",
  "/images/events/theatre-01.webp",
  "/images/events/exhibition-01.webp",
  "/images/events/arts-01.webp",
  "/images/events/community-01.webp",
];

export function OrganizerEventForm({ eventId }: { eventId?: string }) {
  const t = useTranslations();
  const { categories, venues } = useCatalog();
  const router = useRouter();
  const hydrated = useHydrated();
  const events = useEventStore((state) => state.events);
  const createEvent = useEventStore((state) => state.createEvent);
  const updateEvent = useEventStore((state) => state.updateEvent);
  const existing = eventId
    ? events.find((event) => event.id === eventId)
    : undefined;
  const tomorrow = new Date(Date.now() + 7 * 86_400_000);
  tomorrow.setHours(19, 30, 0, 0);
  const end = new Date(tomorrow.getTime() + 3 * 60 * 60 * 1000);

  const [title, setTitle] = useState(existing?.title ?? "");
  const [categoryId, setCategoryId] = useState(
    existing?.categoryId ?? categories[0].id,
  );
  const [venueId, setVenueId] = useState(existing?.venueId ?? venues[0].id);
  const [startAt, setStartAt] = useState(
    existing
      ? toDateTimeLocal(existing.startAt)
      : toDateTimeLocal(tomorrow.toISOString()),
  );
  const [endAt, setEndAt] = useState(
    existing
      ? toDateTimeLocal(existing.endAt)
      : toDateTimeLocal(end.toISOString()),
  );
  const [timezone, setTimezone] = useState(
    existing?.timezone ?? "Asia/Jakarta",
  );
  const [mode, setMode] = useState(
    existing?.ticketingMode ?? "GENERAL_ADMISSION",
  );
  const [description, setDescription] = useState(existing?.description ?? "");
  const [subcategory, setSubcategory] = useState(existing?.subcategory ?? "");
  const [highlights, setHighlights] = useState<string[]>(
    existing?.highlights ?? [],
  );
  const [schedule, setSchedule] = useState<ScheduleItem[]>(
    existing?.schedule ?? [],
  );
  const [terms, setTerms] = useState<string[]>(existing?.terms ?? []);
  const [ageNote, setAgeNote] = useState(existing?.ageNote ?? "");
  const [accessibilityNote, setAccessibilityNote] = useState(
    existing?.accessibilityNote ?? "",
  );
  const [status, setStatus] = useState<Event["status"]>(
    existing?.status ?? "DRAFT",
  );
  const [basePrice, setBasePrice] = useState(
    String(existing?.ticketTypes[0]?.price ?? 250_000),
  );
  const [coverImage, setCoverImage] = useState(
    existing?.coverImage ?? defaultImage,
  );
  const [preview, setPreview] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!existing) return;
    setTitle(existing.title);
    setCategoryId(existing.categoryId);
    setVenueId(existing.venueId);
    setStartAt(toDateTimeLocal(existing.startAt));
    setEndAt(toDateTimeLocal(existing.endAt));
    setTimezone(existing.timezone);
    setMode(existing.ticketingMode);
    setDescription(existing.description);
    setSubcategory(existing.subcategory ?? "");
    setHighlights(existing.highlights);
    setSchedule(existing.schedule);
    setTerms(existing.terms);
    setAgeNote(existing.ageNote ?? "");
    setAccessibilityNote(existing.accessibilityNote ?? "");
    setStatus(existing.status);
    setBasePrice(String(existing.ticketTypes[0]?.price ?? 250_000));
    setCoverImage(existing.coverImage);
  }, [existing]);

  if (!hydrated) {
    return (
      <div className="space-y-5">
        <Skeleton className="h-20" />
        <Skeleton className="h-[620px]" />
      </div>
    );
  }

  if (eventId && !existing) {
    return (
      <EmptyState
        icon={CalendarDays}
        title={t("common.notFound")}
        body={t("errors.notFound")}
        action={
          <Button asChild>
            <a href="/organizer/events">{t("organizer.events")}</a>
          </Button>
        }
      />
    );
  }

  const save = (nextStatus: Event["status"]) => {
    const nextErrors: Record<string, string> = {};
    if (!title.trim()) nextErrors.title = t("errors.required");
    if (!description.trim()) nextErrors.description = t("errors.required");
    if (!existing && (!Number(basePrice) || Number(basePrice) < 1000))
      nextErrors.basePrice = t("errors.required");
    if (new Date(endAt).getTime() <= new Date(startAt).getTime())
      nextErrors.endAt = t("organizer.invalidWindow");
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;

    if (existing) {
      updateEvent({
        ...existing,
        title: title.trim(),
        categoryId,
        venueId,
        startAt: new Date(startAt).toISOString(),
        endAt: new Date(endAt).toISOString(),
        timezone,
        ticketingMode: mode,
        description: description.trim(),
        subcategory: subcategory.trim(),
        highlights: highlights.map((item) => item.trim()).filter(Boolean),
        schedule: schedule
          .map((item) => ({
            time: item.time.trim(),
            title: item.title.trim(),
            description: item.description?.trim() || undefined,
          }))
          .filter((item) => item.time || item.title),
        terms: terms.map((item) => item.trim()).filter(Boolean),
        ageNote: ageNote.trim() || undefined,
        accessibilityNote: accessibilityNote.trim() || undefined,
        status: nextStatus,
        coverImage,
      });
      toast.success(t("organizer.eventSaved"));
      router.push(`/organizer/events/${existing.id}`);
      return;
    }

    const created = createEvent({
      title: title.trim(),
      categoryId,
      venueId,
      startAt: new Date(startAt).toISOString(),
      endAt: new Date(endAt).toISOString(),
      timezone,
      ticketingMode: mode,
      description: description.trim(),
      coverImage,
      status: nextStatus,
      basePrice: Number(basePrice),
      subcategory: subcategory.trim() || undefined,
      highlights: highlights.map((item) => item.trim()).filter(Boolean),
      schedule: schedule
        .map((item) => ({
          time: item.time.trim(),
          title: item.title.trim(),
          description: item.description?.trim() || undefined,
        }))
        .filter((item) => item.time || item.title),
      terms: terms.map((item) => item.trim()).filter(Boolean),
      ageNote: ageNote.trim() || undefined,
      accessibilityNote: accessibilityNote.trim() || undefined,
    });
    toast.success(t("organizer.eventSaved"));
    router.push(`/organizer/events/${created.id}`);
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-strong">
            {t("organizer.events")}
          </p>
          <h1 className="mt-2 font-display text-3xl font-semibold sm:text-4xl">
            {existing ? t("organizer.editEvent") : t("organizer.createEvent")}
          </h1>
          <p className="mt-2 text-sm text-muted">{t("organizer.subtitle")}</p>
        </div>
        <Button asChild variant="ghost" size="sm">
          <a href="/organizer/events">
            <ArrowLeft className="size-4" /> {t("organizer.events")}
          </a>
        </Button>
      </div>

      <form
        className="grid gap-6 xl:grid-cols-[1fr_360px]"
        onSubmit={(event) => {
          event.preventDefault();
          save(status);
        }}
      >
        <div className="space-y-5">
          <section className="rounded-3xl border border-line bg-surface p-5 sm:p-6">
            <h2 className="font-display text-xl font-semibold">
              {t("common.details")}
            </h2>
            <div className="mt-5 space-y-4">
              <Field
                label={t("organizer.eventTitle")}
                htmlFor="event-title"
                required
                error={errors.title}
              >
                <Input
                  id="event-title"
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  placeholder="Nama event"
                />
              </Field>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label={t("organizer.category")} htmlFor="event-category">
                  <Select
                    id="event-category"
                    value={categoryId}
                    onChange={(event) => setCategoryId(event.target.value)}
                  >
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </Select>
                </Field>
                <Field label={t("organizer.mode")} htmlFor="event-mode">
                  <Select
                    id="event-mode"
                    value={mode}
                    onChange={(event) =>
                      setMode(event.target.value as typeof mode)
                    }
                  >
                    <option value="GENERAL_ADMISSION">
                      {t("event.modeGeneral")}
                    </option>
                    <option value="RESERVED_SEATING">
                      {t("event.modeReserved")}
                    </option>
                    <option value="HYBRID">{t("event.modeHybrid")}</option>
                  </Select>
                </Field>
              </div>
              <Field label={t("organizer.venue")} htmlFor="event-venue">
                <Select
                  id="event-venue"
                  value={venueId}
                  onChange={(event) => setVenueId(event.target.value)}
                >
                  {venues.map((venue) => (
                    <option key={venue.id} value={venue.id}>
                      {venue.name} · {venue.city}
                    </option>
                  ))}
                </Select>
              </Field>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field
                  label={t("organizer.startAt")}
                  htmlFor="event-start"
                  required
                >
                  <Input
                    id="event-start"
                    type="datetime-local"
                    value={startAt}
                    onChange={(event) => setStartAt(event.target.value)}
                  />
                </Field>
                <Field
                  label={t("organizer.endAt")}
                  htmlFor="event-end"
                  required
                  error={errors.endAt}
                >
                  <Input
                    id="event-end"
                    type="datetime-local"
                    value={endAt}
                    onChange={(event) => setEndAt(event.target.value)}
                  />
                </Field>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label={t("organizer.timezone")} htmlFor="event-timezone">
                  <Select
                    id="event-timezone"
                    value={timezone}
                    onChange={(event) => setTimezone(event.target.value)}
                  >
                    <option value="Asia/Jakarta">WIB · Asia/Jakarta</option>
                    <option value="Asia/Makassar">WITA · Asia/Makassar</option>
                    <option value="Asia/Jayapura">WIT · Asia/Jayapura</option>
                  </Select>
                </Field>
                {existing ? (
                  <Field label={t("organizer.price")}>
                    <div className="rounded-xl border border-line bg-canvas px-3 py-2.5 text-xs leading-relaxed text-muted">
                      {t("organizer.priceManagedInTickets")}{" "}
                      <a
                        href={`/organizer/events/${existing.id}/tickets`}
                        className="font-semibold text-brand-strong hover:underline"
                      >
                        {t("organizer.ticketConfig")}
                      </a>
                    </div>
                  </Field>
                ) : (
                  <Field
                    label={t("organizer.price")}
                    htmlFor="event-price"
                    required
                    error={errors.basePrice}
                  >
                    <Input
                      id="event-price"
                      type="number"
                      min={1000}
                      step={1000}
                      value={basePrice}
                      onChange={(event) => setBasePrice(event.target.value)}
                    />
                  </Field>
                )}
              </div>
              <Field
                label={t("organizer.description")}
                htmlFor="event-description"
                required
                error={errors.description}
              >
                <Textarea
                  id="event-description"
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  placeholder="Ceritakan pengalaman yang akan didapat penonton..."
                />
              </Field>
            </div>
          </section>

          <section className="rounded-3xl border border-line bg-surface p-5 sm:p-6">
            <h2 className="font-display text-xl font-semibold">Konten event</h2>
            <div className="mt-5 space-y-5">
              <Field
                label={t("organizer.subcategory")}
                htmlFor="event-subcategory"
              >
                <Input
                  id="event-subcategory"
                  value={subcategory}
                  onChange={(event) => setSubcategory(event.target.value)}
                  placeholder="Pop, Football, Technology..."
                />
              </Field>

              <Field
                label={t("event.highlights")}
                hint={t("organizer.listHint")}
              >
                <div className="space-y-2">
                  {highlights.map((highlight, index) => (
                    <div key={index} className="flex gap-2">
                      <Input
                        value={highlight}
                        onChange={(event) =>
                          setHighlights((current) =>
                            current.map((item, itemIndex) =>
                              itemIndex === index ? event.target.value : item,
                            ),
                          )
                        }
                        placeholder="Highlight event"
                        aria-label={`${t("event.highlights")} ${index + 1}`}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() =>
                          setHighlights((current) =>
                            current.filter(
                              (_, itemIndex) => itemIndex !== index,
                            ),
                          )
                        }
                        aria-label={t("common.remove")}
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  ))}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setHighlights((current) => [...current, ""])}
                  >
                    <Plus className="size-4" /> {t("common.add")}
                  </Button>
                </div>
              </Field>

              <Field label={t("event.schedule")} hint={t("organizer.listHint")}>
                <div className="space-y-3">
                  {schedule.map((item, index) => (
                    <div
                      key={index}
                      className="grid gap-2 rounded-2xl border border-line bg-canvas p-3 sm:grid-cols-[100px_1fr_auto]"
                    >
                      <Input
                        value={item.time}
                        onChange={(event) =>
                          setSchedule((current) =>
                            current.map((entry, entryIndex) =>
                              entryIndex === index
                                ? { ...entry, time: event.target.value }
                                : entry,
                            ),
                          )
                        }
                        placeholder="19:30"
                        aria-label={`${t("common.time")} ${index + 1}`}
                      />
                      <Input
                        value={item.title}
                        onChange={(event) =>
                          setSchedule((current) =>
                            current.map((entry, entryIndex) =>
                              entryIndex === index
                                ? { ...entry, title: event.target.value }
                                : entry,
                            ),
                          )
                        }
                        placeholder={t("organizer.scheduleTitle")}
                        aria-label={`${t("organizer.scheduleTitle")} ${index + 1}`}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() =>
                          setSchedule((current) =>
                            current.filter(
                              (_, entryIndex) => entryIndex !== index,
                            ),
                          )
                        }
                        aria-label={t("common.remove")}
                      >
                        <Trash2 className="size-4" />
                      </Button>
                      <Textarea
                        value={item.description ?? ""}
                        onChange={(event) =>
                          setSchedule((current) =>
                            current.map((entry, entryIndex) =>
                              entryIndex === index
                                ? { ...entry, description: event.target.value }
                                : entry,
                            ),
                          )
                        }
                        placeholder={t("organizer.scheduleDescription")}
                        aria-label={`${t("organizer.scheduleDescription")} ${index + 1}`}
                        className="min-h-16 sm:col-span-2"
                      />
                    </div>
                  ))}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setSchedule((current) => [
                        ...current,
                        { time: "", title: "", description: "" },
                      ])
                    }
                  >
                    <Plus className="size-4" /> {t("common.add")}
                  </Button>
                </div>
              </Field>

              <Field label={t("event.terms")} hint={t("organizer.listHint")}>
                <div className="space-y-2">
                  {terms.map((term, index) => (
                    <div key={index} className="flex gap-2">
                      <Input
                        value={term}
                        onChange={(event) =>
                          setTerms((current) =>
                            current.map((item, itemIndex) =>
                              itemIndex === index ? event.target.value : item,
                            ),
                          )
                        }
                        placeholder="Syarat event"
                        aria-label={`${t("event.terms")} ${index + 1}`}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() =>
                          setTerms((current) =>
                            current.filter(
                              (_, itemIndex) => itemIndex !== index,
                            ),
                          )
                        }
                        aria-label={t("common.remove")}
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  ))}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setTerms((current) => [...current, ""])}
                  >
                    <Plus className="size-4" /> {t("common.add")}
                  </Button>
                </div>
              </Field>

              <div className="grid gap-4 sm:grid-cols-2">
                <Field label={t("event.ageNote")} htmlFor="event-age">
                  <Textarea
                    id="event-age"
                    value={ageNote}
                    onChange={(event) => setAgeNote(event.target.value)}
                    placeholder="18+"
                    className="min-h-20"
                  />
                </Field>
                <Field
                  label={t("event.accessibility")}
                  htmlFor="event-accessibility"
                >
                  <Textarea
                    id="event-accessibility"
                    value={accessibilityNote}
                    onChange={(event) =>
                      setAccessibilityNote(event.target.value)
                    }
                    placeholder="Akses kursi roda..."
                    className="min-h-20"
                  />
                </Field>
              </div>
            </div>
          </section>

          <section className="rounded-3xl border border-line bg-surface p-5 sm:p-6">
            <h2 className="font-display text-xl font-semibold">
              {t("organizer.coverImage")}
            </h2>
            <div className="mt-4 flex flex-col gap-4 sm:flex-row">
              <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl bg-surface-subtle sm:w-56">
                <Image
                  src={preview ?? coverImage}
                  alt=""
                  fill
                  unoptimized
                  sizes="(max-width: 640px) 100vw, 224px"
                  className="object-cover"
                />
              </div>
              <div className="flex-1 space-y-3">
                <div className="flex flex-wrap gap-2">
                  {imageOptions.map((image) => (
                    <button
                      key={image}
                      type="button"
                      onClick={() => {
                        setCoverImage(image);
                        setPreview(null);
                      }}
                      className={cn(
                        "relative size-14 overflow-hidden rounded-xl border-2",
                        coverImage === image && !preview
                          ? "border-brand"
                          : "border-transparent",
                      )}
                      aria-label="Pilih gambar"
                    >
                      <Image
                        src={image}
                        alt=""
                        fill
                        sizes="56px"
                        className="object-cover"
                      />
                    </button>
                  ))}
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => fileRef.current?.click()}
                >
                  <ImagePlus className="size-4" /> {t("organizer.uploadImage")}
                </Button>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (file) setPreview(URL.createObjectURL(file));
                  }}
                />
                <p className="text-xs leading-relaxed text-muted">
                  {t("organizer.imageNote")}
                </p>
              </div>
            </div>
          </section>
        </div>

        <aside className="space-y-4">
          <div className="rounded-3xl border border-line bg-surface p-5">
            <h2 className="font-display text-xl font-semibold">
              {t("organizer.status")}
            </h2>
            <div className="mt-4 space-y-2">
              {[
                { value: "DRAFT", label: t("organizer.draft") },
                { value: "PUBLISHED", label: t("organizer.published") },
                { value: "PAUSED", label: t("organizer.paused") },
                { value: "ENDED", label: t("organizer.ended") },
                { value: "CANCELLED", label: t("organizer.cancelled") },
              ].map((item) => (
                <button
                  key={item.value}
                  type="button"
                  onClick={() => setStatus(item.value as Event["status"])}
                  className={cn(
                    "flex w-full items-center justify-between rounded-xl border px-3 py-2.5 text-sm transition-colors",
                    status === item.value
                      ? "border-brand bg-brand-soft/40 text-ink"
                      : "border-line text-muted hover:text-ink",
                  )}
                >
                  {item.label}
                  <span
                    className={cn(
                      "size-2 rounded-full",
                      status === item.value ? "bg-brand" : "bg-line",
                    )}
                  />
                </button>
              ))}
            </div>
            <div className="mt-5 space-y-2">
              <Button type="submit" className="w-full">
                <Save className="size-4" /> {t("organizer.saveDraft")}
              </Button>
              <Button
                type="button"
                variant="secondary"
                className="w-full"
                onClick={() => save("PUBLISHED")}
              >
                <Send className="size-4" /> {t("organizer.publish")}
              </Button>
              {existing ? (
                <Button asChild variant="outline" className="w-full">
                  <a
                    href={`/events/${existing.slug}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    {t("common.viewTicket")}
                  </a>
                </Button>
              ) : null}
            </div>
          </div>
          <DemoNotice>{t("common.demoNotice")}</DemoNotice>
        </aside>
      </form>
    </div>
  );
}
