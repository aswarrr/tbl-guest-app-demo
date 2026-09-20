import { describe, it, expect } from "vitest";
import {
  optionForTable,
  optionsByTableId,
} from "../../src/components/site/floorplan/availability";
import type { AvailableSeatingOption } from "../../src/white-label/types";

const single = (id: string, tableId: string): AvailableSeatingOption => ({
  id,
  name: id,
  type: "SINGLE",
  tableIds: [tableId],
  availableTimes: ["19:00"],
});

const combo = (
  id: string,
  tableIds: string[],
): AvailableSeatingOption => ({
  id,
  name: id,
  type: "COMBO",
  tableIds,
  availableTimes: ["19:00"],
});

describe("optionsByTableId", () => {
  it("lists every option a table takes part in", () => {
    const alone = single("t1-alone", "t1");
    const joined = combo("t1+t2", ["t1", "t2"]);
    const map = optionsByTableId([alone, joined]);

    expect(map.get("t1")).toEqual([alone, joined]);
    expect(map.get("t2")).toEqual([joined]);
  });

  it("leaves a table with no options absent, so it reads as unavailable", () => {
    const map = optionsByTableId([single("t1-alone", "t1")]);
    expect(map.has("t9")).toBe(false);
  });
});

describe("optionForTable", () => {
  // The server prefers a single table over a joined pair when it assigns one.
  // Tapping has to agree, or a guest would be shown a different table from the
  // one they would have been given.
  it("books a table on its own rather than as half of a pair", () => {
    const alone = single("t1-alone", "t1");
    const joined = combo("t1+t2", ["t1", "t2"]);
    expect(optionForTable([joined, alone])).toBe(alone);
  });

  it("falls back to the smallest combination when the table cannot be booked alone", () => {
    const pair = combo("t1+t2", ["t1", "t2"]);
    const triple = combo("t1+t2+t3", ["t1", "t2", "t3"]);
    expect(optionForTable([triple, pair])).toBe(pair);
  });

  it("breaks a tie the same way every time", () => {
    const a = combo("a", ["t1", "t2"]);
    const b = combo("b", ["t1", "t3"]);
    expect(optionForTable([b, a])).toBe(a);
    expect(optionForTable([a, b])).toBe(a);
  });

  it("returns nothing for a table with no availability", () => {
    expect(optionForTable([])).toBeUndefined();
  });
});
