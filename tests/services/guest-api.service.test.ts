import { beforeEach, describe, expect, it, vi } from "vitest";
import type { CreateReservationHoldPayload } from "../../src/types/reservation";

const apiMock = vi.hoisted(() => ({
  get: vi.fn(),
  post: vi.fn(),
}));

vi.mock("../../src/services/api", () => ({
  api: apiMock,
}));

import { branchesService } from "../../src/services/branches.service";
import { reservationsService } from "../../src/services/reservations.service";

describe("guest API services", () => {
  beforeEach(() => {
    apiMock.get.mockReset();
    apiMock.post.mockReset();
  });

  it("reads a branch's public opening-hours endpoint", async () => {
    const responseBody = {
      data: [{ dayOfWeek: 0, openTime: "09:00", closeTime: "23:00" }],
    };
    apiMock.get.mockResolvedValueOnce({ data: responseBody });

    await expect(branchesService.getOpeningHours("branch-1")).resolves.toEqual(
      responseBody
    );
    expect(apiMock.get).toHaveBeenCalledWith(
      "/api/branches/branch-1/opening-hours"
    );
  });

  it("submits the preferred branch-local reservation hold contract", async () => {
    const payload: CreateReservationHoldPayload = {
      partySize: 2,
      reservationDate: "2026-09-15",
      reservationTimeLocal: "19:30",
      durationMinutes: 90,
      tableIds: ["0d88ac29-7cc0-4f19-a13f-9f9d45db0939"],
    };
    const responseBody = { data: { id: "reservation-1", status: "HOLD" } };
    apiMock.post.mockResolvedValueOnce({ data: responseBody });

    await expect(
      reservationsService.createHold("branch-1", payload)
    ).resolves.toEqual(responseBody);

    expect(apiMock.post).toHaveBeenCalledWith(
      "/api/branches/branch-1/reservations/hold",
      payload
    );
    expect(apiMock.post.mock.calls[0][1]).not.toHaveProperty("reservationTime");
  });
});
