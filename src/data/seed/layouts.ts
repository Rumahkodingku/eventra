import type { Seat, Section, VenueLayout } from "@/domain/types";

function hashString(value: string): number {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return Math.abs(hash);
}

function makeSeats(
  layoutId: string,
  sectionId: string,
  rowCount: number,
  seatCount: number,
): Seat[] {
  const seats: Seat[] = [];
  for (let rowIndex = 0; rowIndex < rowCount; rowIndex += 1) {
    const row = String.fromCharCode(65 + rowIndex);
    for (let number = 1; number <= seatCount; number += 1) {
      const id = `${layoutId}:${sectionId}:${row}:${number}`;
      const seed = hashString(id) % 100;
      const accessible = row === "A" && number <= 2;
      const status = accessible
        ? "AVAILABLE"
        : seed < 9
          ? "SOLD"
          : seed < 13
            ? "BLOCKED"
            : "AVAILABLE";
      seats.push({ id, sectionId, row, number, status, accessible });
    }
  }
  return seats;
}

function makeSection(
  layoutId: string,
  id: string,
  name: string,
  label: string,
  tierKey: string,
  rows: number,
  seats: number,
): Section {
  return {
    id,
    name,
    label,
    tierKey,
    seats: makeSeats(layoutId, id, rows, seats),
  };
}

export const arenaLayout: VenueLayout = {
  id: "arena",
  name: "Arena",
  sections: [
    makeSection(
      "arena",
      "front",
      "Front Stage",
      "Paling dekat dengan panggung",
      "front",
      6,
      10,
    ),
    makeSection(
      "arena",
      "mid",
      "Main Floor",
      "Tengah arena, pandangan seimbang",
      "mid",
      6,
      10,
    ),
    makeSection(
      "arena",
      "rear",
      "Rear Floor",
      "Area belakang dengan akses cepat",
      "rear",
      6,
      10,
    ),
    makeSection(
      "arena",
      "side",
      "Side Balcony",
      "Sudut samping dengan suasana berbeda",
      "side",
      6,
      10,
    ),
  ],
};

export const theaterLayout: VenueLayout = {
  id: "theater",
  name: "Theater",
  sections: [
    makeSection(
      "theater",
      "orchestra",
      "Orchestra",
      "Lantai utama dekat panggung",
      "orchestra",
      8,
      14,
    ),
    makeSection(
      "theater",
      "mezzanine",
      "Mezzanine",
      "Balkon dengan pandangan menyeluruh",
      "mezzanine",
      8,
      14,
    ),
  ],
};

export function getTemplateLayout(layoutId?: string): VenueLayout {
  return layoutId === "theater" ? theaterLayout : arenaLayout;
}

export function cloneLayout(layout: VenueLayout): VenueLayout {
  return {
    ...layout,
    sections: layout.sections.map((section) => ({
      ...section,
      seats: section.seats.map((seat) => ({ ...seat })),
    })),
  };
}

export function countSeats(layout: VenueLayout): number {
  return layout.sections.reduce(
    (total, section) => total + section.seats.length,
    0,
  );
}

export function findSeat(
  layout: VenueLayout,
  seatId: string,
): Seat | undefined {
  for (const section of layout.sections) {
    const seat = section.seats.find((item) => item.id === seatId);
    if (seat) return seat;
  }
  return undefined;
}

export function findSectionForSeat(
  layout: VenueLayout,
  seatId: string,
): Section | undefined {
  return layout.sections.find((section) =>
    section.seats.some((seat) => seat.id === seatId),
  );
}

export function seatLabel(
  layout: VenueLayout,
  seatId: string,
): { section: string; row: string; number: number } | undefined {
  const section = findSectionForSeat(layout, seatId);
  const seat = section?.seats.find((item) => item.id === seatId);
  if (!section || !seat) return undefined;
  return { section: section.name, row: seat.row, number: seat.number };
}
