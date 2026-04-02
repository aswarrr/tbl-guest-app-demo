import type {
  Branch,
  BranchOpeningHour,
  BranchPhoto,
  BranchPolicies,
} from "../types/branch";
import type { DeviceLocation } from "../hooks/useCurrentLocation";

export type RestaurantImageSlide = {
  id: string;
  url: string;
  alt: string;
  caption?: string | null;
};

export function resolveArray<T>(result: unknown): T[] {
  if (Array.isArray(result)) return result as T[];

  if (Array.isArray((result as { data?: unknown } | null)?.data)) {
    return (result as { data: T[] }).data;
  }

  if (Array.isArray((result as { data?: { items?: unknown } } | null)?.data?.items)) {
    return (result as { data: { items: T[] } }).data.items;
  }

  if (Array.isArray((result as { items?: unknown } | null)?.items)) {
    return (result as { items: T[] }).items;
  }

  return [];
}

export function toText(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function toNumber(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) return value;

  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) return null;

    const parsed = Number(trimmed);
    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
}

export function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

export function normalizeBranch(item: Record<string, unknown> | null): Branch | null {
  const id = toText(item?.id);

  if (!id) return null;

  return {
    id,
    companyId: toText(item?.companyId) ?? "",
    companyName: toText(item?.companyName),
    companySlug: toText(item?.companySlug),
    companyLogoUrl: toText(item?.companyLogoUrl),
    name: toText(item?.name) ?? "Unnamed Branch",
    slug: toText(item?.slug) ?? "",
    addressLine1: toText(item?.addressLine1) ?? "",
    addressLine2: toText(item?.addressLine2),
    area: toText(item?.area),
    city: toText(item?.city) ?? "",
    governorate: toText(item?.governorate),
    postalCode: toText(item?.postalCode),
    landmark: toText(item?.landmark),
    country: toText(item?.country) ?? "",
    latitude: Number(item?.latitude ?? 0),
    longitude: Number(item?.longitude ?? 0),
    phone: toText(item?.phone),
    email: toText(item?.email),
    timezone: toText(item?.timezone),
    status: toText(item?.status),
    about: toText(item?.about),
    placeId: toText(item?.placeId),
    geocodeProvider: toText(item?.geocodeProvider),
    geocodeAccuracy: toText(item?.geocodeAccuracy),
    coverUrl: toText(item?.coverUrl),
    amenitiesMode: toText(item?.amenitiesMode),
    tagsMode: toText(item?.tagsMode),
    createdAt: toText(item?.createdAt) ?? toText(item?.created_at),
    updatedAt: toText(item?.updatedAt) ?? toText(item?.updated_at),
    raw: item,
  };
}

export function normalizeBranchPhoto(item: Record<string, unknown> | null): BranchPhoto | null {
  const id = toText(item?.id);
  const branchId = toText(item?.branchId);
  const url = toText(item?.url);
  const sortOrderValue =
    typeof item?.sortOrder === "number"
      ? item.sortOrder
      : typeof item?.sortOrder === "string"
        ? Number(item.sortOrder)
        : null;

  if (!id || !branchId || !url) return null;

  return {
    id,
    branchId,
    url,
    kind: toText(item?.kind) ?? "OTHER",
    caption: toText(item?.caption),
    sortOrder: sortOrderValue !== null && Number.isFinite(sortOrderValue) ? sortOrderValue : null,
    createdAt: toText(item?.createdAt) ?? toText(item?.created_at),
    updatedAt: toText(item?.updatedAt) ?? toText(item?.updated_at),
    raw: item,
  };
}

export function normalizeOpeningHour(
  item: Record<string, unknown> | null
): BranchOpeningHour | null {
  const id = toText(item?.id);
  const branchId = toText(item?.branchId);
  const dayOfWeek =
    typeof item?.dayOfWeek === "number"
      ? item.dayOfWeek
      : typeof item?.dayOfWeek === "string"
        ? Number(item.dayOfWeek)
        : null;

  if (!id || !branchId || dayOfWeek === null || Number.isNaN(dayOfWeek)) {
    return null;
  }

  return {
    id,
    branchId,
    dayOfWeek,
    openTime: toText(item?.openTime),
    closeTime: toText(item?.closeTime),
    isClosed: item?.isClosed === true,
    createdAt: toText(item?.createdAt) ?? toText(item?.created_at),
    updatedAt: toText(item?.updatedAt) ?? toText(item?.updated_at),
    raw: item,
  };
}

export function normalizeBranchPolicies(
  item: Record<string, unknown> | null
): BranchPolicies | null {
  const branchId = toText(item?.branchId);

  if (!branchId) return null;

  return {
    branchId,
    minPartySize: toNumber(item?.minPartySize),
    maxPartySize: toNumber(item?.maxPartySize),
    defaultReservationDurationMinutes: toNumber(item?.defaultReservationDurationMinutes),
    bookingCutoffHours: toNumber(item?.bookingCutoffHours),
    maxAdvanceBookingDays: toNumber(item?.maxAdvanceBookingDays),
    cancellationWindowHours: toNumber(item?.cancellationWindowHours),
    depositType: toText(item?.depositType),
    depositAmount:
      toText(item?.depositAmount) ??
      (toNumber(item?.depositAmount) !== null ? String(toNumber(item?.depositAmount)) : null),
    minimumChargeAmount:
      toText(item?.minimumChargeAmount) ??
      (toNumber(item?.minimumChargeAmount) !== null
        ? String(toNumber(item?.minimumChargeAmount))
        : null),
    freeCancelWindowHours: toNumber(item?.freeCancelWindowHours),
    lateCancelRefundPercent: toNumber(item?.lateCancelRefundPercent),
    noShowRefundPercent: toNumber(item?.noShowRefundPercent),
    turnTimeMinutes: toNumber(item?.turnTimeMinutes),
    gracePeriodMinutes: toNumber(item?.gracePeriodMinutes),
    createdAt: toText(item?.createdAt) ?? toText(item?.created_at),
    updatedAt: toText(item?.updatedAt) ?? toText(item?.updated_at),
    raw: item,
  };
}

export function isActiveBranch(status?: string | null) {
  return (status || "").toUpperCase() === "ACTIVE";
}

export function formatStatusLabel(status?: string | null) {
  return (status || "Unknown").replace(/_/g, " ");
}

export function getStatusClass(status?: string | null) {
  const normalized = (status || "").toUpperCase();

  if (normalized === "ACTIVE") return "status-active";
  if (normalized === "PENDING_ADMIN_APPROVAL") return "status-pending-admin";
  if (normalized === "PENDING_PROFILE") return "status-pending-profile";
  if (normalized === "PENDING_KYC") return "status-pending-kyc";
  return "status-generic";
}

export function buildBranchAddress(branch: Branch | null) {
  if (!branch) return "Address not available";

  const parts = [
    branch.addressLine1,
    branch.addressLine2,
    branch.area,
    branch.city,
    branch.governorate,
    branch.postalCode,
    branch.country,
  ].filter(Boolean);

  return parts.length > 0 ? parts.join(", ") : "Address not available";
}

export function buildBranchLocation(branch: Branch | null) {
  if (!branch) return "Location not available";

  const parts = [branch.area, branch.city, branch.governorate].filter(Boolean);

  return parts.length > 0 ? parts.join(", ") : branch.country || "Location not available";
}

function isCoordinateInRange(latitude: number, longitude: number) {
  return (
    Number.isFinite(latitude) &&
    Number.isFinite(longitude) &&
    latitude >= -90 &&
    latitude <= 90 &&
    longitude >= -180 &&
    longitude <= 180
  );
}

export function hasBranchCoordinates(branch: Branch | null) {
  if (!branch) return false;

  const { latitude, longitude } = branch;

  return isCoordinateInRange(latitude, longitude) && !(latitude === 0 && longitude === 0);
}

export function calculateDistanceKm(
  branch: Branch | null,
  currentLocation: DeviceLocation | null
) {
  if (!branch || !currentLocation || !hasBranchCoordinates(branch)) {
    return null;
  }

  const toRadians = (value: number) => (value * Math.PI) / 180;
  const earthRadiusKm = 6371;
  const latitudeDelta = toRadians(branch.latitude - currentLocation.latitude);
  const longitudeDelta = toRadians(branch.longitude - currentLocation.longitude);
  const originLatitude = toRadians(currentLocation.latitude);
  const destinationLatitude = toRadians(branch.latitude);

  const a =
    Math.sin(latitudeDelta / 2) ** 2 +
    Math.cos(originLatitude) *
      Math.cos(destinationLatitude) *
      Math.sin(longitudeDelta / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return earthRadiusKm * c;
}

export function formatDistance(distanceKm: number | null) {
  if (distanceKm === null || !Number.isFinite(distanceKm)) {
    return null;
  }

  if (distanceKm < 1) {
    const meters = Math.max(50, Math.round(distanceKm * 1000 / 50) * 50);
    return `${new Intl.NumberFormat().format(meters)} m`;
  }

  const formatted =
    distanceKm >= 10
      ? new Intl.NumberFormat(undefined, { maximumFractionDigits: 0 }).format(distanceKm)
      : new Intl.NumberFormat(undefined, { maximumFractionDigits: 1 }).format(distanceKm);

  return `${formatted} km`;
}

export function buildDistanceLabel(
  branch: Branch | null,
  currentLocation: DeviceLocation | null,
  loadingCurrentLocation: boolean
) {
  const distance = calculateDistanceKm(branch, currentLocation);
  const formattedDistance = formatDistance(distance);

  if (formattedDistance) {
    return `${formattedDistance} away`;
  }

  if (!hasBranchCoordinates(branch)) {
    return "Distance unavailable";
  }

  return loadingCurrentLocation ? "Locating..." : "Enable location";
}

function formatClockTime(value: string | null) {
  if (!value) return null;

  const match = /^(\d{1,2}):(\d{2})/.exec(value);

  if (!match) return value;

  const hours = Number(match[1]);
  const minutes = Number(match[2]);

  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) {
    return value;
  }

  const referenceDate = new Date(2000, 0, 1, hours, minutes);

  return new Intl.DateTimeFormat(undefined, {
    hour: "numeric",
    minute: "2-digit",
  }).format(referenceDate);
}

export function formatOpeningHoursLabel(row: BranchOpeningHour | null) {
  if (!row) return "Hours not available";
  if (row.isClosed) return "Closed";

  const open = formatClockTime(row.openTime);
  const close = formatClockTime(row.closeTime);

  if (open && close) {
    return `${open} - ${close}`;
  }

  return "Hours not available";
}

export function formatDayLabel(dayOfWeek: number) {
  return ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][
    dayOfWeek
  ] ?? `Day ${dayOfWeek}`;
}

export function parsePolicyAmount(value: string | null) {
  if (!value) return null;

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

export function formatPolicyAmount(value: string | null) {
  const parsed = parsePolicyAmount(value);

  if (parsed === null) {
    return value && value.trim() ? value : null;
  }

  return new Intl.NumberFormat(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(parsed);
}

function formatCount(value: number, singular: string, plural = `${singular}s`) {
  return `${new Intl.NumberFormat().format(value)} ${value === 1 ? singular : plural}`;
}

export function buildGuestPolicySentences(policies: BranchPolicies | null) {
  if (!policies) return [];

  const sentences: string[] = [];
  const depositAmount = parsePolicyAmount(policies.depositAmount);
  const minimumChargeAmount = parsePolicyAmount(policies.minimumChargeAmount);

  if (policies.minPartySize !== null && policies.maxPartySize !== null) {
    if (policies.minPartySize === policies.maxPartySize) {
      sentences.push(
        `Reservations are currently accepted for parties of exactly ${new Intl.NumberFormat().format(
          policies.minPartySize
        )} guests.`
      );
    } else {
      sentences.push(
        `Reservations are currently accepted for parties of ${new Intl.NumberFormat().format(
          policies.minPartySize
        )} to ${new Intl.NumberFormat().format(policies.maxPartySize)} guests.`
      );
    }
  } else if (policies.minPartySize !== null) {
    sentences.push(
      `Reservations require at least ${formatCount(policies.minPartySize, "guest")}.`
    );
  } else if (policies.maxPartySize !== null) {
    sentences.push(
      `Online reservations are currently available for up to ${formatCount(
        policies.maxPartySize,
        "guest"
      )}.`
    );
  }

  if (
    policies.maxAdvanceBookingDays !== null &&
    policies.bookingCutoffHours !== null
  ) {
    sentences.push(
      `Bookings can be made up to ${formatCount(
        policies.maxAdvanceBookingDays,
        "day"
      )} in advance and must be placed at least ${formatCount(
        policies.bookingCutoffHours,
        "hour"
      )} before arrival.`
    );
  } else if (policies.maxAdvanceBookingDays !== null) {
    sentences.push(
      `Bookings can be made up to ${formatCount(
        policies.maxAdvanceBookingDays,
        "day"
      )} in advance.`
    );
  } else if (policies.bookingCutoffHours !== null) {
    sentences.push(
      `Bookings must be placed at least ${formatCount(
        policies.bookingCutoffHours,
        "hour"
      )} before arrival.`
    );
  }

  if (depositAmount !== null && depositAmount > 0 && minimumChargeAmount !== null && minimumChargeAmount > 0) {
    sentences.push(
      `A deposit of ${formatPolicyAmount(
        policies.depositAmount
      )} is required to secure the booking, and a minimum charge of ${formatPolicyAmount(
        policies.minimumChargeAmount
      )} also applies.`
    );
  } else if (depositAmount !== null && depositAmount > 0) {
    sentences.push(
      `A deposit of ${formatPolicyAmount(
        policies.depositAmount
      )} is required to secure the booking.`
    );
  } else if (minimumChargeAmount !== null && minimumChargeAmount > 0) {
    sentences.push(
      `A minimum charge of ${formatPolicyAmount(
        policies.minimumChargeAmount
      )} applies to this booking.`
    );
  }

  if (policies.freeCancelWindowHours !== null) {
    sentences.push(
      `You can cancel free of charge up to ${formatCount(
        policies.freeCancelWindowHours,
        "hour"
      )} before the reservation.`
    );
  }

  if (policies.lateCancelRefundPercent !== null) {
    if (policies.lateCancelRefundPercent === 0) {
      sentences.push("Late cancellations do not receive a deposit refund.");
    } else {
      sentences.push(
        `Late cancellations refund ${new Intl.NumberFormat().format(
          policies.lateCancelRefundPercent
        )}% of the deposit.`
      );
    }
  }

  if (policies.noShowRefundPercent !== null) {
    if (policies.noShowRefundPercent === 0) {
      sentences.push("No-shows do not receive a deposit refund.");
    } else {
      sentences.push(
        `No-shows refund ${new Intl.NumberFormat().format(
          policies.noShowRefundPercent
        )}% of the deposit.`
      );
    }
  }

  if (policies.gracePeriodMinutes !== null) {
    sentences.push(
      `Your table may be held for ${formatCount(
        policies.gracePeriodMinutes,
        "minute"
      )} after the reservation time before it can be released.`
    );
  }

  if (policies.turnTimeMinutes !== null) {
    sentences.push(
      `The restaurant allows about ${formatCount(
        policies.turnTimeMinutes,
        "minute"
      )} between seatings when turning tables.`
    );
  }

  return sentences;
}

export function buildRestaurantSlides(
  branch: Pick<Branch, "id" | "name" | "coverUrl" | "companyLogoUrl">,
  photos: BranchPhoto[]
): RestaurantImageSlide[] {
  const sortedPhotos = [...photos].sort((left, right) => {
    const leftOrder = left.sortOrder ?? Number.MAX_SAFE_INTEGER;
    const rightOrder = right.sortOrder ?? Number.MAX_SAFE_INTEGER;
    return leftOrder - rightOrder;
  });

  const photoSlides = sortedPhotos
    .filter((photo) => !!photo.url)
    .map((photo, index) => ({
      id: photo.id || `${branch.id}-photo-${index}`,
      url: photo.url,
      alt: `${branch.name} photo ${index + 1}`,
      caption: photo.caption,
    }));

  if (photoSlides.length > 0) return photoSlides;

  const fallbackUrls = Array.from(
    new Set(
      [branch.coverUrl, branch.companyLogoUrl].filter(
        (url): url is string => typeof url === "string" && url.length > 0
      )
    )
  );

  return fallbackUrls.map((url, index) => ({
    id: `${branch.id}-fallback-${index}`,
    url,
    alt: `${branch.name} image ${index + 1}`,
  }));
}
