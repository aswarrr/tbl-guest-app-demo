/**
 * The published layout as the guest API serves it
 * (GET /api/mobile/branches/:branchId/floorplan).
 *
 * Geometry only: what is bookable comes from floors-availability and is
 * overlaid on top of this.
 */

export type FloorplanChair = {
  id: string;
  x: number;
  y: number;
  rotation: number;
  width: number;
  depth: number;
};

/**
 * The shape of a table, shared by every table placed from it. Sent inline on
 * each table rather than as a separate catalog, so the layout needs no second
 * request to draw.
 */
export type FloorplanTemplate = {
  name: string;
  type: string;
  fixtureKind: string | null;
  shape: string;
  width: number;
  height: number;
  radius: number;
  isReservable: boolean;
  isCombinable: boolean;
  minPartySize: number;
  maxPartySize: number;
  chairs: FloorplanChair[];
};

/** One placed table. `x`/`y` are its centre in floor coordinates. */
export type FloorplanTable = {
  id: string;
  label: string;
  x: number;
  y: number;
  rotation: number;
  scaleX: number;
  scaleY: number;
  zoneId: string | null;
  isActive: boolean;
  template: FloorplanTemplate;
};

export type FloorplanZone = {
  id: string;
  name: string;
  polygonPoints: Array<{ x: number; y: number }>;
};

export type FloorplanFloor = {
  id: string;
  name: string;
  sortOrder: number;
  isMain: boolean;
  backgroundImageUrl: string | null;
  backgroundWidth: number;
  backgroundHeight: number;
  zones: FloorplanZone[];
  tables: FloorplanTable[];
};

export type GuestFloorplan = {
  versionId: string;
  versionNo: number | null;
  publishedAt: string | null;
  floors: FloorplanFloor[];
};

/**
 * How a table reads to a guest choosing a seat.
 *
 * `combo-member` is one of two tables joined to seat a larger party: selecting
 * either one selects the pair.
 */
export type TableState =
  | "available"
  | "selected"
  | "combo-member"
  | "unavailable"
  | "fixture";
