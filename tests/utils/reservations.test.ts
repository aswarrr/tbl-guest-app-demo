import { describe, expect, it } from "vitest";
import { normalizeReservation } from "../../src/utils/reservations";

describe("reservation response normalization", () => {
  it("prefers the canonical cancellation fields", () => {
    const reservation = normalizeReservation({
      id: "reservation-1",
      cancelledAt: "2026-09-02T10:00:00.000Z",
      canceledAt: "2026-09-02T11:00:00.000Z",
      canceled_at: "2026-09-02T12:00:00.000Z",
      cancellationReason: "Guest request",
      cancellation_reason: "Legacy reason",
    });

    expect(reservation.canceledAt).toBe("2026-09-02T10:00:00.000Z");
    expect(reservation.cancellationReason).toBe("Guest request");
  });

  it("tolerates legacy snake-case cancellation fields", () => {
    const reservation = normalizeReservation({
      id: "reservation-2",
      canceled_at: "2026-09-02T12:00:00.000Z",
      cancellation_reason: "Legacy client",
    });

    expect(reservation.canceledAt).toBe("2026-09-02T12:00:00.000Z");
    expect(reservation.cancellationReason).toBe("Legacy client");
  });

  it("normalizes absent cancellation metadata to null", () => {
    const reservation = normalizeReservation({ id: "reservation-3" });

    expect(reservation.canceledAt).toBeNull();
    expect(reservation.cancellationReason).toBeNull();
  });
});
