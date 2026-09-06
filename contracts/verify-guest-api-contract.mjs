import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const apiRoot = resolve(
  process.env.TBL_API_ROOT || resolve(process.cwd(), "..", "the_tbl_api - REVAMP")
);

if (!existsSync(apiRoot)) {
  throw new Error(
    `TBL API repository not found at ${apiRoot}. Set TBL_API_ROOT to its absolute path.`
  );
}

const require = createRequire(import.meta.url);
const { createHoldSchema } = require(
  resolve(apiRoot, "src/modules/reservations/reservation.schema.js")
);
const { mapReservation } = require(
  resolve(apiRoot, "src/modules/reservations/reservation.mapper.js")
);

const preferredHold = {
  partySize: 2,
  reservationDate: "2026-09-15",
  reservationTimeLocal: "19:30",
  durationMinutes: 90,
  tableIds: ["0d88ac29-7cc0-4f19-a13f-9f9d45db0939"],
};
const legacyHold = {
  partySize: 2,
  reservationTime: "2026-09-15T17:30:00.000Z",
  durationMinutes: 90,
  tableIds: ["0d88ac29-7cc0-4f19-a13f-9f9d45db0939"],
};

assert.equal(
  createHoldSchema.safeParse(preferredHold).success,
  true,
  "The API rejected the guest app's preferred branch-local hold payload."
);
assert.equal(
  createHoldSchema.safeParse(legacyHold).success,
  true,
  "The API no longer accepts its documented legacy UTC hold payload."
);
assert.equal(
  createHoldSchema.safeParse({ ...preferredHold, reservationTimeLocal: undefined })
    .success,
  false,
  "The API accepted an incomplete branch-local hold payload."
);

const mappedReservation = mapReservation({
  id: "reservation-1",
  branch_id: "branch-1",
  reservation_time: "2026-09-15T17:30:00.000Z",
  branch_timezone: "Africa/Cairo",
  canceled_at: "2026-09-02T10:00:00.000Z",
  cancellation_reason: "Guest request",
});

assert.equal(mappedReservation.cancelledAt, "2026-09-02T10:00:00.000Z");
assert.equal(mappedReservation.cancellationReason, "Guest request");
assert.equal(mappedReservation.reservationDateLocal, "2026-09-15");
assert.equal(mappedReservation.reservationTimeLocal, "20:30");

const scheduleRoutes = readFileSync(
  resolve(apiRoot, "src/modules/branch-schedule/branch-schedule.routes.js"),
  "utf8"
);

assert.match(
  scheduleRoutes,
  /branchScheduleRoutes\.get\(\s*["']\/branches\/:id\/opening-hours["'],\s*optionalAuth,.*?controller\.getWeeklyHours/s,
  "Opening-hours GET is no longer conditionally public through optional authentication."
);
assert.match(
  scheduleRoutes,
  /branchScheduleRoutes\.put\(\s*["']\/branches\/:id\/opening-hours["'],\s*requireAuth,/s,
  "Opening-hours mutation routes are no longer protected by mandatory authentication."
);

console.log(
  "Guest/API contract passed: opening hours, local holds, legacy holds, and cancellation metadata."
);
