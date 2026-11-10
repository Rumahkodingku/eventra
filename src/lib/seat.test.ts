import { describe, expect, it } from "vitest";
import {
  arenaLayout,
  cloneLayout,
  countSeats,
  findSeat,
  seatLabel,
  theaterLayout,
} from "@/data/seed/layouts";

describe("seat layouts", () => {
  it("contains the expected arena and theater inventory", () => {
    expect(countSeats(arenaLayout)).toBe(240);
    expect(countSeats(theaterLayout)).toBe(224);
    expect(arenaLayout.sections).toHaveLength(4);
    expect(theaterLayout.sections).toHaveLength(2);
  });

  it("marks accessible seats in each section", () => {
    const accessible = arenaLayout.sections.flatMap((section) =>
      section.seats.filter((seat) => seat.accessible),
    );
    expect(accessible).toHaveLength(8);
  });

  it("keeps cloned layouts independent", () => {
    const clone = cloneLayout(arenaLayout);
    const first = clone.sections[0].seats[0];
    const original = arenaLayout.sections[0].seats[0];
    first.status = "SOLD";
    expect(original.status).not.toBe("SOLD");
  });

  it("finds seats and formats their labels", () => {
    const seat = arenaLayout.sections[0].seats[0];
    expect(findSeat(arenaLayout, seat.id)?.id).toBe(seat.id);
    expect(seatLabel(arenaLayout, seat.id)).toEqual({
      section: "Front Stage",
      row: "A",
      number: 1,
    });
  });
});
