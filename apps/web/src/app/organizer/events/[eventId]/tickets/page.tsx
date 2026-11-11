"use client";

import { ArrowLeft, Plus, Save, Ticket, Trash2 } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DemoNotice } from "@/components/ui/demo-notice";
import { Dialog, DialogContent, DialogHeader } from "@/components/ui/dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { Field } from "@/components/ui/field";
import { Input, Select, Textarea } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import type { TicketType, VenueLayout } from "@/domain/types";
import { useHydrated } from "@/hooks/use-hydrated";
import { formatIDR } from "@/lib/currency";
import { toDateTimeLocal } from "@/lib/dates";
import { createId } from "@/lib/ids";
import { cloneLayout, getTemplateLayout } from "@/services/catalog/layouts";
import { useEventStore } from "@/services/hooks/use-event-store";
import { useOrderStore } from "@/services/hooks/use-order-store";
import { usePreferencesStore } from "@/stores/preferences";

export default function OrganizerTicketConfigPage() {
  const t = useTranslations();
  const params = useParams<{ eventId: string }>();
  const hydrated = useHydrated();
  const locale = usePreferencesStore((state) => state.locale);
  const events = useEventStore((state) => state.events);
  const updateEvent = useEventStore((state) => state.updateEvent);
  const orders = useOrderStore((state) => state.orders);
  const event = events.find((item) => item.id === params.eventId);
  const [tickets, setTickets] = useState<TicketType[]>(
    event?.ticketTypes ?? [],
  );
  const [layout, setLayout] = useState<VenueLayout | undefined>(
    event?.seatLayout,
  );
  const [layoutId, setLayoutId] = useState(event?.layoutId ?? "arena");
  const [regenerateOpen, setRegenerateOpen] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const confirmedOrders = orders.filter(
    (order) =>
      order.orderStatus === "CONFIRMED" &&
      order.items.some((item) => item.eventId === event?.id),
  ).length;

  useEffect(() => {
    if (!event) return;
    setTickets(event.ticketTypes);
    setLayout(event.seatLayout);
    setLayoutId(event.layoutId ?? "arena");
  }, [event]);

  if (!hydrated) {
    return (
      <div className="space-y-5">
        <Skeleton className="h-20" />
        <Skeleton className="h-[520px]" />
      </div>
    );
  }

  if (!event) {
    return (
      <EmptyState
        icon={Ticket}
        title={t("common.notFound")}
        body={t("errors.notFound")}
        action={
          <Button asChild>
            <Link href="/organizer/events">{t("organizer.events")}</Link>
          </Button>
        }
      />
    );
  }

  const updateTicket = (id: string, patch: Partial<TicketType>) => {
    setTickets((current) =>
      current.map((ticket) =>
        ticket.id === id ? { ...ticket, ...patch } : ticket,
      ),
    );
  };

  const addTicket = () => {
    const seated = event.ticketingMode !== "GENERAL_ADMISSION";
    const usedTiers = new Set(
      tickets
        .filter((ticket) => ticket.kind === "SEATED" && ticket.tierKey)
        .map((ticket) => ticket.tierKey),
    );
    const defaultSection = event.seatLayout?.sections.find(
      (section) => !usedTiers.has(section.tierKey),
    );
    const newTicket: TicketType = {
      id: createId("tt"),
      eventId: event.id,
      name: seated ? (defaultSection?.name ?? "Seated") : "New ticket",
      description: "Tiket baru untuk event demo.",
      price: 150_000,
      currency: "IDR",
      quota: 100,
      soldCount: 0,
      minPerOrder: 1,
      maxPerOrder: 6,
      salesStartAt: new Date().toISOString(),
      salesEndAt: new Date(
        new Date(event.startAt).getTime() - 2 * 86_400_000,
      ).toISOString(),
      benefits: ["Akses event"],
      status: "ACTIVE",
      kind: seated ? "SEATED" : "GENERAL_ADMISSION",
      tierKey: seated ? defaultSection?.tierKey : undefined,
    };
    setTickets((current) => [...current, newTicket]);
  };

  const save = async () => {
    const nextErrors: Record<string, string> = {};
    tickets.forEach((ticket) => {
      if (!ticket.name.trim())
        nextErrors[`${ticket.id}.name`] = t("errors.required");
      if (ticket.quota <= 0)
        nextErrors[`${ticket.id}.quota`] = t("organizer.invalidQuota");
      if (ticket.price <= 0)
        nextErrors[`${ticket.id}.price`] = t("errors.required");
      if (
        new Date(ticket.salesEndAt).getTime() <=
        new Date(ticket.salesStartAt).getTime()
      ) {
        nextErrors[`${ticket.id}.window`] = t("organizer.invalidWindow");
      }
    });
    const usedTiers = new Set<string>();
    tickets
      .filter((ticket) => ticket.kind === "SEATED" && ticket.tierKey)
      .forEach((ticket) => {
        const tierKey = ticket.tierKey;
        if (!tierKey) return;
        if (usedTiers.has(tierKey)) {
          nextErrors[`${ticket.id}.tier`] = t("organizer.duplicateTier");
        }
        usedTiers.add(tierKey);
      });
    if (
      event.ticketingMode !== "GENERAL_ADMISSION" &&
      !tickets.some((ticket) => ticket.kind === "SEATED" && ticket.tierKey)
    ) {
      nextErrors.seated = t("organizer.missingSeatedTier");
    }
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;
    await updateEvent({
      ...event,
      ticketTypes: tickets,
      layoutId: layout?.id,
      seatLayout: layout,
    });
    toast.success(t("organizer.ticketSaved"));
  };
  const mapSection = (sectionTierKey: string, ticketId: string) => {
    setTickets((current) => {
      if (!ticketId) {
        return current.map((ticket) =>
          ticket.tierKey === sectionTierKey
            ? { ...ticket, tierKey: undefined }
            : ticket,
        );
      }
      return current.map((ticket) => {
        if (ticket.id === ticketId) {
          return {
            ...ticket,
            kind: "SEATED" as const,
            tierKey: sectionTierKey,
          };
        }
        if (ticket.tierKey === sectionTierKey) {
          return { ...ticket, tierKey: undefined };
        }
        return ticket;
      });
    });
  };

  const regenerate = () => {
    const nextLayout = cloneLayout(getTemplateLayout(layoutId));
    setLayout(nextLayout);
    setTickets((current) => {
      const seated = current.filter((ticket) => ticket.kind === "SEATED");
      const assignments = new Map<string, string>();
      seated.forEach((ticket, index) => {
        const section =
          nextLayout.sections.find((item) => item.tierKey === ticket.tierKey) ??
          nextLayout.sections[index];
        if (section) assignments.set(ticket.id, section.tierKey);
      });
      return current.map((ticket) => {
        const tierKey = assignments.get(ticket.id);
        const section = nextLayout.sections.find(
          (item) => item.tierKey === tierKey,
        );
        if (ticket.kind !== "SEATED") return ticket;
        return {
          ...ticket,
          tierKey,
          quota: section?.seats.length ?? ticket.quota,
        };
      });
    });
    setRegenerateOpen(false);
    toast.success(t("organizer.regenerateDone"));
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-strong">
            {t("organizer.ticketConfig")}
          </p>
          <h1 className="mt-2 font-display text-3xl font-semibold sm:text-4xl">
            {event.title}
          </h1>
          <p className="mt-2 text-sm text-muted">{t("organizer.subtitle")}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="ghost" size="sm">
            <Link href={`/organizer/events/${event.id}`}>
              <ArrowLeft className="size-4" /> {t("common.back")}
            </Link>
          </Button>
          <Button size="sm" onClick={() => void save()}>
            <Save className="size-4" /> {t("common.save")}
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="brand">
          {event.ticketingMode.replaceAll("_", " ")}
        </Badge>
        <Badge variant="neutral">{event.ticketTypes.length} tipe tiket</Badge>
        {event.seatLayout ? (
          <Badge variant="neutral">
            {event.seatLayout.name} ·{" "}
            {event.seatLayout.sections.reduce(
              (total, section) => total + section.seats.length,
              0,
            )}{" "}
            kursi
          </Badge>
        ) : null}
      </div>

      {event.ticketingMode !== "GENERAL_ADMISSION" ? (
        <section className="rounded-3xl border border-line bg-surface p-5 sm:p-6">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h2 className="font-display text-xl font-semibold">
                {t("organizer.seatInventory")}
              </h2>
              <p className="mt-1 text-xs leading-relaxed text-muted">
                {t("organizer.regenerateWarning")}
                {confirmedOrders > 0
                  ? ` ${t("organizer.confirmedOrdersWarning", {
                      count: confirmedOrders,
                    })}`
                  : ""}
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setRegenerateOpen(true)}
            >
              {t("organizer.regenerate")}
            </Button>
          </div>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <Field label={t("organizer.template")} htmlFor="seat-template">
              <Select
                id="seat-template"
                value={layoutId}
                onChange={(event) => setLayoutId(event.target.value)}
              >
                <option value="arena">
                  Arena · 240 {t("organizer.seatsCount")}
                </option>
                <option value="theater">
                  Theater · 224 {t("organizer.seatsCount")}
                </option>
              </Select>
              <p className="mt-1 text-[11px] text-muted">
                {t("organizer.templateHint")}
              </p>
            </Field>
            {confirmedOrders > 0 ? (
              <div className="rounded-xl border border-warning/20 bg-warning/10 px-3 py-2.5 text-xs leading-relaxed text-warning-text">
                {t("organizer.confirmedOrdersWarning", {
                  count: confirmedOrders,
                })}
              </div>
            ) : null}
          </div>

          {layout ? (
            <div className="mt-5 overflow-x-auto rounded-2xl border border-line">
              <table className="w-full min-w-[620px] text-left text-sm">
                <thead className="border-b border-line bg-surface-subtle/70">
                  <tr>
                    <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">
                      Section
                    </th>
                    <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">
                      {t("organizer.seatsCount")}
                    </th>
                    <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">
                      {t("organizer.accessibleSeats")}
                    </th>
                    <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">
                      {t("organizer.mapSection")}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {layout.sections.map((section) => {
                    const mapped = tickets.find(
                      (ticket) =>
                        ticket.kind === "SEATED" &&
                        ticket.tierKey === section.tierKey,
                    );
                    return (
                      <tr key={section.id}>
                        <td className="px-4 py-3">
                          <span className="font-semibold">{section.name}</span>
                          <span className="mt-0.5 block text-[11px] text-muted">
                            {section.label}
                          </span>
                        </td>
                        <td className="px-4 py-3 tabular">
                          {section.seats.length}
                        </td>
                        <td className="px-4 py-3 tabular">
                          {
                            section.seats.filter((seat) => seat.accessible)
                              .length
                          }
                        </td>
                        <td className="px-4 py-3">
                          <Select
                            value={mapped?.id ?? ""}
                            onChange={(event) =>
                              mapSection(section.tierKey, event.target.value)
                            }
                            aria-label={`${t("organizer.mapSection")} ${section.name}`}
                            className="min-w-44"
                          >
                            <option value="">{t("organizer.unmapped")}</option>
                            {tickets
                              .filter((ticket) => ticket.kind === "SEATED")
                              .map((ticket) => (
                                <option key={ticket.id} value={ticket.id}>
                                  {ticket.name}
                                </option>
                              ))}
                          </Select>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : null}
          {Object.entries(errors).some(
            ([key]) => key === "seated" || key.endsWith(".tier"),
          ) ? (
            <p className="mt-3 rounded-xl border border-danger/20 bg-danger/10 px-3 py-2 text-xs text-danger">
              {errors.seated ??
                Object.entries(errors).find(([key]) =>
                  key.endsWith(".tier"),
                )?.[1]}
            </p>
          ) : null}
        </section>
      ) : null}

      <div className="space-y-4">
        {tickets.map((ticket, index) => (
          <section
            key={ticket.id}
            className="rounded-3xl border border-line bg-surface p-5 sm:p-6"
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="grid size-8 place-items-center rounded-xl bg-brand-soft text-sm font-semibold text-brand-strong">
                  {index + 1}
                </span>
                <h2 className="font-display text-xl font-semibold">
                  {ticket.name || t("organizer.ticketName")}
                </h2>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="neutral">
                  {formatIDR(ticket.price, locale)}
                </Badge>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  className="text-danger hover:bg-danger/10 hover:text-danger"
                  onClick={() =>
                    setTickets((current) =>
                      current.filter((item) => item.id !== ticket.id),
                    )
                  }
                  aria-label={t("common.delete")}
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
            </div>

            <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              <Field
                label={t("organizer.ticketName")}
                htmlFor={`${ticket.id}-name`}
                required
                error={errors[`${ticket.id}.name`]}
              >
                <Input
                  id={`${ticket.id}-name`}
                  value={ticket.name}
                  onChange={(event) =>
                    updateTicket(ticket.id, { name: event.target.value })
                  }
                />
              </Field>
              <Field
                label={t("organizer.price")}
                htmlFor={`${ticket.id}-price`}
                required
                error={errors[`${ticket.id}.price`]}
              >
                <Input
                  id={`${ticket.id}-price`}
                  type="number"
                  min={1000}
                  step={1000}
                  value={ticket.price}
                  onChange={(event) =>
                    updateTicket(ticket.id, {
                      price: Number(event.target.value),
                    })
                  }
                />
              </Field>
              <Field
                label={t("organizer.quota")}
                htmlFor={`${ticket.id}-quota`}
                required
                error={errors[`${ticket.id}.quota`]}
              >
                <Input
                  id={`${ticket.id}-quota`}
                  type="number"
                  min={1}
                  value={ticket.quota}
                  onChange={(event) =>
                    updateTicket(ticket.id, {
                      quota: Number(event.target.value),
                    })
                  }
                />
              </Field>
              <Field
                label={t("organizer.minPerOrder")}
                htmlFor={`${ticket.id}-min`}
              >
                <Input
                  id={`${ticket.id}-min`}
                  type="number"
                  min={1}
                  value={ticket.minPerOrder}
                  onChange={(event) =>
                    updateTicket(ticket.id, {
                      minPerOrder: Number(event.target.value),
                    })
                  }
                />
              </Field>
              <Field
                label={t("organizer.maxPerOrder")}
                htmlFor={`${ticket.id}-max`}
              >
                <Input
                  id={`${ticket.id}-max`}
                  type="number"
                  min={1}
                  value={ticket.maxPerOrder}
                  onChange={(event) =>
                    updateTicket(ticket.id, {
                      maxPerOrder: Number(event.target.value),
                    })
                  }
                />
              </Field>
              <Field
                label={t("organizer.status")}
                htmlFor={`${ticket.id}-status`}
              >
                <Select
                  id={`${ticket.id}-status`}
                  value={ticket.status}
                  onChange={(event) =>
                    updateTicket(ticket.id, {
                      status: event.target.value as TicketType["status"],
                    })
                  }
                >
                  <option value="ACTIVE">Active</option>
                  <option value="INACTIVE">Inactive</option>
                  <option value="SOLD_OUT">Sold out</option>
                </Select>
              </Field>
              <Field
                label={t("organizer.salesStart")}
                htmlFor={`${ticket.id}-start`}
              >
                <Input
                  id={`${ticket.id}-start`}
                  type="datetime-local"
                  value={toDateTimeLocal(ticket.salesStartAt)}
                  onChange={(event) =>
                    updateTicket(ticket.id, {
                      salesStartAt: new Date(event.target.value).toISOString(),
                    })
                  }
                />
              </Field>
              <Field
                label={t("organizer.salesEnd")}
                htmlFor={`${ticket.id}-end`}
                error={errors[`${ticket.id}.window`]}
              >
                <Input
                  id={`${ticket.id}-end`}
                  type="datetime-local"
                  value={toDateTimeLocal(ticket.salesEndAt)}
                  onChange={(event) =>
                    updateTicket(ticket.id, {
                      salesEndAt: new Date(event.target.value).toISOString(),
                    })
                  }
                />
              </Field>
              <Field label={t("common.category")} htmlFor={`${ticket.id}-kind`}>
                <Select
                  id={`${ticket.id}-kind`}
                  value={ticket.kind}
                  onChange={(inputEvent) =>
                    updateTicket(ticket.id, {
                      kind: inputEvent.target.value as TicketType["kind"],
                      tierKey:
                        inputEvent.target.value === "SEATED"
                          ? event.seatLayout?.sections[0]?.tierKey
                          : undefined,
                    })
                  }
                >
                  <option value="GENERAL_ADMISSION">
                    {t("event.modeGeneral")}
                  </option>
                  <option value="SEATED">{t("event.modeReserved")}</option>
                </Select>
              </Field>
              {ticket.kind === "SEATED" && event.seatLayout ? (
                <Field label={t("event.seatMap")} htmlFor={`${ticket.id}-tier`}>
                  <Select
                    id={`${ticket.id}-tier`}
                    value={ticket.tierKey ?? ""}
                    onChange={(event) =>
                      updateTicket(ticket.id, { tierKey: event.target.value })
                    }
                  >
                    {event.seatLayout.sections.map((section) => (
                      <option key={section.id} value={section.tierKey}>
                        {section.name}
                      </option>
                    ))}
                  </Select>
                </Field>
              ) : null}
            </div>

            <Field
              label={t("organizer.benefits")}
              htmlFor={`${ticket.id}-benefits`}
              className="mt-4"
              hint="Pisahkan dengan koma."
            >
              <Textarea
                id={`${ticket.id}-benefits`}
                value={ticket.benefits.join(", ")}
                onChange={(event) =>
                  updateTicket(ticket.id, {
                    benefits: event.target.value
                      .split(",")
                      .map((item) => item.trim())
                      .filter(Boolean),
                  })
                }
              />
            </Field>
          </section>
        ))}
      </div>

      <div className="flex flex-wrap gap-2">
        <Button variant="outline" onClick={addTicket}>
          <Plus className="size-4" /> {t("organizer.addTicket")}
        </Button>
        <Button onClick={() => void save()}>
          <Save className="size-4" /> {t("common.save")}
        </Button>
      </div>

      <DemoNotice>{t("common.demoNotice")}</DemoNotice>

      <Dialog open={regenerateOpen} onOpenChange={setRegenerateOpen}>
        <DialogContent>
          <DialogHeader
            title={t("organizer.regenerateConfirm")}
            description={t("organizer.regenerateConfirmBody")}
          />
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setRegenerateOpen(false)}>
              {t("common.cancel")}
            </Button>
            <Button onClick={regenerate}>{t("organizer.regenerate")}</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
