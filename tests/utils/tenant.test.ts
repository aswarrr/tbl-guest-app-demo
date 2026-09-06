import { beforeAll, afterEach, describe, expect, it } from "vitest";
import {
  clearReservationDraft,
  loadReservationDraft,
  resolveTenantSlug,
  safeReturnPath,
  saveReservationDraft,
} from "../../src/white-label/tenant";
import type { ReservationDraft } from "../../src/white-label/types";

describe("white-label tenant utilities", () => {
  beforeAll(() => {
    const values = new Map<string, string>();
    Object.defineProperty(globalThis, "sessionStorage", {
      configurable: true,
      value: {
        getItem: (key: string) => values.get(key) ?? null,
        setItem: (key: string, value: string) => values.set(key, value),
        removeItem: (key: string) => values.delete(key),
        clear: () => values.clear(),
      },
    });
  });
  afterEach(() => sessionStorage.clear());

  it("resolves a Shopify-style restaurant subdomain", () => {
    expect(resolveTenantSlug({
      hostname: "sizzler-steak-house-and-co.restaurants.example.com",
      search: "",
      rootDomain: "restaurants.example.com",
      defaultSlug: "fallback",
    })).toBe("sizzler-steak-house-and-co");
  });

  it("allows a query override for local and preview testing", () => {
    expect(resolveTenantSlug({
      hostname: "localhost",
      search: "?tenant=sizzler-steak-house-and-co",
      defaultSlug: "fallback",
    })).toBe("sizzler-steak-house-and-co");
  });

  it("stores a versioned draft per tenant", () => {
    const draft: ReservationDraft = {
      version: 1,
      step: 4,
      branchId: "branch-1",
      partySize: 2,
      reservationDate: "2026-09-15",
      durationMinutes: 90,
      reservationTimeLocal: "19:30",
      floorId: "floor-1",
      seatingOption: { id: "table-1", name: "T1", type: "SINGLE", tableIds: ["table-1"], availableTimes: ["19:30"] },
      specialRequest: "Window if possible",
    };

    saveReservationDraft("sizzler", draft);
    expect(loadReservationDraft("sizzler")).toEqual(draft);
    expect(loadReservationDraft("another-tenant")).toBeNull();
    clearReservationDraft("sizzler");
    expect(loadReservationDraft("sizzler")).toBeNull();
  });

  it("rejects external auth return URLs", () => {
    expect(safeReturnPath("https://example.com")).toBe("/reserve");
    expect(safeReturnPath("//example.com")).toBe("/reserve");
    expect(safeReturnPath("/reserve?resume=review")).toBe("/reserve?resume=review");
  });
});
