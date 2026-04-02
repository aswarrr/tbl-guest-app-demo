import type {
  Branch,
  BranchOpeningHour,
  PublishedFloorplanVersion,
} from "../types/branch";
import type { Company } from "../types/company";
import type { ReservationRecord } from "../types/reservation";
import type { StaffMember } from "../types/staff";

export type DashboardTone = "default" | "positive" | "warning" | "danger";

export type ChartDatum = {
  label: string;
  value: number;
  hint?: string;
  color?: string;
};

export type DashboardListItem = {
  title: string;
  subtitle?: string;
  meta?: string;
  tone?: DashboardTone;
  to?: string;
};

export type FloorTableSummary = {
  id: string;
  label: string;
  isReservable: boolean;
  minPartySize: number | null;
  maxPartySize: number | null;
  type: string | null;
};

function toRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  return value as Record<string, unknown>;
}

export function resolveArray<T>(result: unknown): T[] {
  if (Array.isArray(result)) return result as T[];

  const record = toRecord(result);
  if (!record) return [];

  if (Array.isArray(record.data)) {
    return record.data as T[];
  }

  const dataRecord = toRecord(record.data);
  if (dataRecord && Array.isArray(dataRecord.items)) {
    return dataRecord.items as T[];
  }

  if (Array.isArray(record.items)) {
    return record.items as T[];
  }

  return [];
}

export function resolveObject<T>(result: unknown): T | null {
  if (!result || typeof result !== "object" || Array.isArray(result)) {
    return null;
  }

  const record = result as Record<string, unknown>;
  const directData = record.data;

  if (directData && typeof directData === "object" && !Array.isArray(directData)) {
    return directData as T;
  }

  return record as T;
}

export function toText(value: unknown): string | null {
  if (typeof value !== "string") return null;

  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

export function toNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;

  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
}

export function toBoolean(value: unknown, fallback = false): boolean {
  if (typeof value === "boolean") return value;
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (normalized === "true") return true;
    if (normalized === "false") return false;
  }
  return fallback;
}

export function normalizeCompany(item: Record<string, unknown>): Company {
  return {
    id: toText(item.id) ?? "",
    name: toText(item.name) ?? "Unnamed Restaurant",
    slug: toText(item.slug) ?? "",
    about: toText(item.about),
    logoUrl: toText(item.logoUrl) ?? toText(item.logo_url),
    coverUrl: toText(item.coverUrl) ?? toText(item.cover_url),
    currency: toText(item.currency),
    cuisineId: toText(item.cuisineId) ?? toText(item.cuisine_id),
    status: toText(item.status),
    address: toText(item.address),
    city: toText(item.city),
    country: toText(item.country),
    email: toText(item.email),
    phone: toText(item.phone),
    timezone: toText(item.timezone),
    createdAt: toText(item.createdAt) ?? toText(item.created_at),
    updatedAt: toText(item.updatedAt) ?? toText(item.updated_at),
    raw: item,
  };
}

export function normalizeBranch(item: Record<string, unknown>): Branch {
  return {
    id: toText(item.id) ?? "",
    companyId: toText(item.companyId) ?? toText(item.company_id) ?? "",
    companyName: toText(item.companyName),
    companySlug: toText(item.companySlug),
    companyLogoUrl: toText(item.companyLogoUrl),
    name: toText(item.name) ?? "Unnamed Branch",
    slug: toText(item.slug) ?? "",
    addressLine1: toText(item.addressLine1) ?? toText(item.address_line1) ?? "",
    addressLine2: toText(item.addressLine2) ?? toText(item.address_line2),
    area: toText(item.area),
    city: toText(item.city) ?? "",
    governorate: toText(item.governorate),
    postalCode: toText(item.postalCode) ?? toText(item.postal_code),
    landmark: toText(item.landmark),
    country: toText(item.country) ?? "",
    latitude: toNumber(item.latitude) ?? 0,
    longitude: toNumber(item.longitude) ?? 0,
    phone: toText(item.phone),
    email: toText(item.email),
    timezone: toText(item.timezone),
    status: toText(item.status),
    about: toText(item.about),
    placeId: toText(item.placeId) ?? toText(item.place_id),
    geocodeProvider: toText(item.geocodeProvider),
    geocodeAccuracy: toText(item.geocodeAccuracy),
    coverUrl: toText(item.coverUrl),
    amenitiesMode: toText(item.amenitiesMode),
    tagsMode: toText(item.tagsMode),
    createdAt: toText(item.createdAt) ?? toText(item.created_at),
    updatedAt: toText(item.updatedAt) ?? toText(item.updated_at),
    raw: item,
  };
}

export function normalizeStaffMember(item: Record<string, unknown>): StaffMember {
  const firstName = toText(item.firstName);
  const lastName = toText(item.lastName);
  const fullName = `${firstName ?? ""} ${lastName ?? ""}`.trim();

  return {
    id: toText(item.id) ?? crypto.randomUUID(),
    displayName:
      fullName ||
      toText(item.username) ||
      toText(item.email) ||
      "Unnamed Staff",
    username: toText(item.username) ?? undefined,
    email: toText(item.email),
    mobileE164: toText(item.mobileE164) ?? toText(item.mobile_e164),
    isSuperAdmin: toBoolean(item.isSuperAdmin),
    companyRoles: [],
    branchRoles: [],
    raw: item,
  };
}

export function normalizeOpeningHour(
  item: Record<string, unknown>
): BranchOpeningHour | null {
  const id = toText(item.id);
  const branchId = toText(item.branchId) ?? toText(item.branch_id);
  const dayOfWeek = toNumber(item.dayOfWeek) ?? toNumber(item.day_of_week);

  if (!id || !branchId || dayOfWeek === null) {
    return null;
  }

  return {
    id,
    branchId,
    dayOfWeek,
    openTime: toText(item.openTime) ?? toText(item.open_time),
    closeTime: toText(item.closeTime) ?? toText(item.close_time),
    isClosed: toBoolean(item.isClosed ?? item.is_closed),
    createdAt: toText(item.createdAt) ?? toText(item.created_at),
    updatedAt: toText(item.updatedAt) ?? toText(item.updated_at),
    raw: item,
  };
}

export function normalizePublishedFloorplanVersion(
  item: Record<string, unknown>
): PublishedFloorplanVersion | null {
  const id = toText(item.id);
  const branchId = toText(item.branchId) ?? toText(item.branch_id);
  const versionNo = toNumber(item.versionNo) ?? toNumber(item.version_no);
  const status = toText(item.status);

  if (!id || !branchId || versionNo === null || !status) {
    return null;
  }

  return {
    id,
    branchId,
    versionNo,
    status,
    createdAt: toText(item.createdAt) ?? toText(item.created_at),
    publishedAt: toText(item.publishedAt) ?? toText(item.published_at),
    createdBy: toText(item.createdBy) ?? toText(item.created_by),
    deletedAt: toText(item.deletedAt) ?? toText(item.deleted_at),
    raw: item,
  };
}

export function normalizeFloorTable(
  item: Record<string, unknown>
): FloorTableSummary | null {
  const id = toText(item.id);
  const label = toText(item.label);
  const isReservable =
    toBoolean(item.isReservable, true) &&
    toBoolean(item.is_reservable, true) &&
    toBoolean(item.isActive, true) &&
    toBoolean(item.is_active, true);

  if (!id || !label) {
    return null;
  }

  return {
    id,
    label,
    isReservable,
    minPartySize: toNumber(item.minPartySize) ?? toNumber(item.min_party_size),
    maxPartySize: toNumber(item.maxPartySize) ?? toNumber(item.max_party_size),
    type: toText(item.type),
  };
}

export function normalizeStatusLabel(value?: string | null) {
  return (value || "unknown")
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function formatCompactNumber(value: number) {
  return new Intl.NumberFormat(undefined, {
    notation: "compact",
    maximumFractionDigits: value >= 1000 ? 1 : 0,
  }).format(value);
}

export function formatPercent(value: number, total: number) {
  if (total <= 0) return "0%";
  return `${Math.round((value / total) * 100)}%`;
}

export function average(values: number[]) {
  if (values.length === 0) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

export function sum(values: number[]) {
  return values.reduce((total, value) => total + value, 0);
}

function toLocalDateKey(value: string | null) {
  if (!value) return null;

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return null;

  const year = parsed.getFullYear();
  const month = `${parsed.getMonth() + 1}`.padStart(2, "0");
  const day = `${parsed.getDate()}`.padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function toDateKeyFromDate(value: Date) {
  const year = value.getFullYear();
  const month = `${value.getMonth() + 1}`.padStart(2, "0");
  const day = `${value.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function startOfDay(value: Date) {
  return new Date(value.getFullYear(), value.getMonth(), value.getDate());
}

export function isSameLocalDay(left: string | null, right: Date) {
  return toLocalDateKey(left) === toDateKeyFromDate(right);
}

export function isInNextHours(value: string | null, hours: number) {
  if (!value) return false;

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return false;

  const now = Date.now();
  const end = now + hours * 60 * 60 * 1000;

  return parsed.getTime() >= now && parsed.getTime() <= end;
}

export function isInNextDays(value: string | null, days: number) {
  if (!value) return false;

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return false;

  const now = Date.now();
  const end = now + days * 24 * 60 * 60 * 1000;

  return parsed.getTime() >= now && parsed.getTime() <= end;
}

export function buildDailySeries(
  reservations: ReservationRecord[],
  days: number
): ChartDatum[] {
  const formatter = new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
  });
  const counts = new Map<string, number>();

  for (const reservation of reservations) {
    const key = toLocalDateKey(reservation.reservationTime);
    if (!key) continue;
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }

  const today = startOfDay(new Date());

  return Array.from({ length: days }, (_, index) => {
    const date = new Date(today);
    date.setDate(today.getDate() - (days - index - 1));
    const key = toDateKeyFromDate(date);

    return {
      label: formatter.format(date),
      value: counts.get(key) ?? 0,
      hint: key,
    };
  });
}

export function buildHourlySeries(
  reservations: ReservationRecord[],
  referenceDate = new Date()
): ChartDatum[] {
  const counts = Array.from({ length: 24 }, () => 0);

  for (const reservation of reservations) {
    if (!isSameLocalDay(reservation.reservationTime, referenceDate)) continue;

    const parsed = reservation.reservationTime
      ? new Date(reservation.reservationTime)
      : null;

    if (!parsed || Number.isNaN(parsed.getTime())) continue;
    counts[parsed.getHours()] += 1;
  }

  return counts.map((value, hour) => ({
    label: `${hour.toString().padStart(2, "0")}:00`,
    value,
  }));
}

export function buildCountSeries(
  values: Array<string | null | undefined>,
  options?: { top?: number; fallbackLabel?: string }
): ChartDatum[] {
  const fallbackLabel = options?.fallbackLabel ?? "Unknown";
  const counts = new Map<string, number>();

  for (const value of values) {
    const label = value ? value : fallbackLabel;
    counts.set(label, (counts.get(label) ?? 0) + 1);
  }

  const rows = Array.from(counts.entries())
    .map(([label, value]) => ({ label, value }))
    .sort((left, right) => right.value - left.value || left.label.localeCompare(right.label));

  const top = options?.top;
  if (!top || rows.length <= top) {
    return rows;
  }

  const visible = rows.slice(0, top);
  const remainder = rows.slice(top);
  const otherTotal = sum(remainder.map((entry) => entry.value));

  if (otherTotal > 0) {
    visible.push({
      label: "Other",
      value: otherTotal,
    });
  }

  return visible;
}

export function getUpcomingReservations(
  reservations: ReservationRecord[],
  limit: number
): ReservationRecord[] {
  return reservations
    .filter((reservation) => {
      if (!reservation.reservationTime) return false;

      const parsed = new Date(reservation.reservationTime);
      return !Number.isNaN(parsed.getTime()) && parsed.getTime() >= Date.now();
    })
    .sort((left, right) => {
      const leftTime = left.reservationTime ? new Date(left.reservationTime).getTime() : 0;
      const rightTime = right.reservationTime ? new Date(right.reservationTime).getTime() : 0;
      return leftTime - rightTime;
    })
    .slice(0, limit);
}

export function getStatusTone(status?: string | null): DashboardTone {
  const normalized = (status || "").toUpperCase();

  if (
    normalized === "ACTIVE" ||
    normalized === "CONFIRMED" ||
    normalized === "CHECKED_IN" ||
    normalized === "COMPLETED" ||
    normalized === "HEALTHY"
  ) {
    return "positive";
  }

  if (
    normalized === "PENDING_KYC" ||
    normalized === "PENDING_PROFILE" ||
    normalized === "PENDING_ADMIN_APPROVAL" ||
    normalized === "HOLD"
  ) {
    return "warning";
  }

  if (
    normalized === "BLOCKED" ||
    normalized === "FAILED" ||
    normalized === "CANCELLED" ||
    normalized === "NO_SHOW" ||
    normalized === "DEAD" ||
    normalized === "UNCONFIGURED"
  ) {
    return "danger";
  }

  return "default";
}

export function isOpenDay(hour: BranchOpeningHour) {
  return !hour.isClosed && !!hour.openTime && !!hour.closeTime;
}
