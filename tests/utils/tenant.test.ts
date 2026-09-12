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

  it("prefers the restaurant named in the path", () => {
    expect(resolveTenantSlug({
      pathSlug: "farida-steakhouse",
      hostname: "sizzler.restaurants.example.com",
      search: "?tenant=someone-else",
      rootDomain: "restaurants.example.com",
      defaultSlug: "fallback",
    })).toBe("farida-steakhouse");
  });

  it("lowercases a path slug", () => {
    expect(resolveTenantSlug({ pathSlug: "Farida-Steakhouse" })).toBe("farida-steakhouse");
  });

  it("names no restaurant when the address carries none", () => {
    expect(resolveTenantSlug({ hostname: "tbl-guest-app.vercel.app", search: "" })).toBe("");
  });

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
    expect(safeReturnPath("https://example.com", "sizzler")).toBe("/sizzler/reserve");
    expect(safeReturnPath("//example.com", "sizzler")).toBe("/sizzler/reserve");
    expect(safeReturnPath(null, "sizzler")).toBe("/sizzler/reserve");
  });

  it("keeps a return path inside the restaurant the guest is on", () => {
    expect(safeReturnPath("/sizzler/reserve?resume=review", "sizzler")).toBe(
      "/sizzler/reserve?resume=review",
    );
    expect(safeReturnPath("/sizzler", "sizzler")).toBe("/sizzler");
  });

  it("refuses a return path belonging to another restaurant", () => {
    expect(safeReturnPath("/other-restaurant/reserve", "sizzler")).toBe("/sizzler/reserve");
    // A prefix match alone must not be enough.
    expect(safeReturnPath("/sizzler-evil/reserve", "sizzler")).toBe("/sizzler/reserve");
  });
});
