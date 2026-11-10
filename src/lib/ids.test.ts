import { describe, expect, it } from "vitest";
import { toCsv } from "@/lib/csv";
import { createTicketCode, slugify } from "@/lib/ids";

describe("ids and csv", () => {
  it("creates stable ticket codes", () => {
    expect(createTicketCode("EVT-2026-1001", 0)).toBe("EVT-2026-1001-01");
    expect(createTicketCode("EVT-2026-1001", 11)).toBe("EVT-2026-1001-12");
  });

  it("slugifies event titles", () => {
    expect(slugify("Senja Sessions: Aurora Live")).toBe(
      "senja-sessions-aurora-live",
    );
  });

  it("escapes CSV values", () => {
    const csv = toCsv(
      [
        { key: "name", label: "Name" },
        { key: "note", label: "Note" },
      ],
      [{ name: 'A "quoted" name', note: "one,two" }],
    );
    expect(csv).toContain('"A ""quoted"" name"');
    expect(csv).toContain('"one,two"');
  });
});
