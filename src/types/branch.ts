export type Branch = {
  id: string;
  companyId: string;
  companyName?: string | null;
  companySlug?: string | null;
  companyLogoUrl?: string | null;
  name: string;
  slug: string;
  addressLine1: string;
  addressLine2?: string | null;
  area?: string | null;
  city: string;
  governorate?: string | null;
  postalCode?: string | null;
  landmark?: string | null;
  country: string;
  latitude: number;
  longitude: number;
  phone?: string | null;
  email?: string | null;
  timezone?: string | null;
  status?: string | null;
  about?: string | null;
  placeId?: string | null;
  geocodeProvider?: string | null;
  geocodeAccuracy?: string | null;
  coverUrl?: string | null;
  amenitiesMode?: string | null;
  tagsMode?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
  raw?: unknown;
};

export type CreateBranchPayload = {
  name: string;
  slug: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  country: string;
  latitude: number;
  longitude: number;
  phone: string;
  email: string;
  timezone: string;
  about?: string;
  postalCode?: string;
  landmark?: string;
};

export type BranchPhotoKind =
  | "INTERIOR"
  | "EXTERIOR"
  | "FOOD"
  | "SEATING"
  | "ENTRANCE"
  | "OTHER";

export type BranchPhoto = {
  id: string;
  branchId: string;
  url: string;
  kind: BranchPhotoKind | string;
  caption?: string | null;
  sortOrder?: number | null;
  createdAt?: string | null;
  updatedAt?: string | null;
  raw?: unknown;
};

export type BranchOpeningHour = {
  id: string;
  branchId: string;
  dayOfWeek: number;
  openTime: string | null;
  closeTime: string | null;
  isClosed: boolean;
  createdAt?: string | null;
  updatedAt?: string | null;
  raw?: unknown;
};

export type UpdateBranchOpeningHoursPayload = {
  hours: Array<{
    dayOfWeek: number;
    openTime: string;
    closeTime: string;
    isClosed: boolean;
  }>;
};

export type BranchPolicies = {
  branchId: string;
  minPartySize: number | null;
  maxPartySize: number | null;
  defaultReservationDurationMinutes?: number | null;
  bookingCutoffHours: number | null;
  maxAdvanceBookingDays: number | null;
  cancellationWindowHours?: number | null;
  depositType?: string | null;
  depositAmount: string | null;
  minimumChargeAmount: string | null;
  freeCancelWindowHours: number | null;
  lateCancelRefundPercent: number | null;
  noShowRefundPercent: number | null;
  turnTimeMinutes: number | null;
  gracePeriodMinutes: number | null;
  createdAt?: string | null;
  updatedAt?: string | null;
  raw?: unknown;
};

export type PublishedFloorplanVersion = {
  id: string;
  branchId: string;
  versionNo: number;
  status: string;
  createdAt?: string | null;
  publishedAt?: string | null;
  createdBy?: string | null;
  deletedAt?: string | null;
  raw?: unknown;
};
