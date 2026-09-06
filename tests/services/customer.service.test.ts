import { beforeEach, describe, expect, it, vi } from "vitest";

const apiMock = vi.hoisted(() => ({ get: vi.fn(), post: vi.fn() }));
vi.mock("../../src/services/api", () => ({ api: apiMock }));

import { customerService } from "../../src/white-label/customer.service";

describe("white-label customer API", () => {
  beforeEach(() => {
    apiMock.get.mockReset();
    apiMock.post.mockReset();
  });

  it("filters published branches by company slug", async () => {
    apiMock.get.mockResolvedValueOnce({ data: { ok: true, data: [
      { id: "s1", companySlug: "sizzler-steak-house-and-co" },
      { id: "x1", companySlug: "another-brand" },
    ] } });

    await expect(customerService.listTenantBranches("sizzler-steak-house-and-co")).resolves.toEqual([
      { id: "s1", companySlug: "sizzler-steak-house-and-co" },
    ]);
    expect(apiMock.get).toHaveBeenCalledWith("/api/mobile/branches", {
      params: { limit: 100, offset: 0 },
      skipGlobalLoading: true,
    });
  });

  it("creates a hold through the mobile contract without changing table IDs", async () => {
    const payload = {
      partySize: 4,
      reservationDate: "2026-09-15",
      reservationTimeLocal: "19:30",
      durationMinutes: 90,
      tableIds: ["table-1", "table-2"],
      specialRequest: "Birthday",
    };
    apiMock.post.mockResolvedValueOnce({ data: { ok: true, data: { id: "reservation-1" } } });

    await customerService.createHold("branch-1", payload);
    expect(apiMock.post).toHaveBeenCalledWith("/api/mobile/branches/branch-1/holds", payload);
  });

  it("uses the supported payment start, status, and direct-confirm endpoints", async () => {
    apiMock.post.mockResolvedValueOnce({ data: { ok: true, data: { paymentId: "payment-1" } } });
    apiMock.get.mockResolvedValueOnce({ data: { ok: true, data: { status: "PENDING" } } });
    apiMock.post.mockResolvedValueOnce({ data: { ok: true, data: { id: "reservation-1", status: "CONFIRMED" } } });

    await customerService.startPayment("reservation-1");
    await customerService.getPaymentStatus("payment-1");
    await customerService.confirmReservation("reservation-1");

    expect(apiMock.post).toHaveBeenNthCalledWith(1, "/api/mobile/payments/start", { reservationId: "reservation-1" });
    expect(apiMock.get).toHaveBeenCalledWith("/api/mobile/payments/payment-1", { skipGlobalLoading: true });
    expect(apiMock.post).toHaveBeenNthCalledWith(2, "/api/mobile/reservations/reservation-1/confirm");
  });
});
