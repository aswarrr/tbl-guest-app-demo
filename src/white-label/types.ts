export type MenuItem = {
  name: string;
  description: string;
  price: number;
  tags?: string[];
};

export type MenuSection = {
  name: string;
  eyebrow: string;
  items: MenuItem[];
};

export type TenantConfig = {
  slug: string;
  displayName: string;
  shortName: string;
  tagline: string;
  cuisineLabel: string;
  currency: string;
  theme: {
    accent: string;
    accentDark: string;
    ink: string;
    paper: string;
  };
  menu: MenuSection[];
};

export type RestaurantPolicy = {
  depositRequired: boolean;
  depositAmount: number;
  depositCurrency: string;
  bookingCutoffHours: number | null;
  freeCancelWindowHours: number | null;
  gracePeriodMinutes: number | null;
  minPartySize: number | null;
  maxPartySize: number | null;
  minReservationDurationMinutes: number | null;
  maxReservationDurationMinutes: number | null;
  cancellationWindowHours: number | null;
  lateCancelRefundPercent: number | null;
  noShowRefundPercent: number | null;
  turnTimeMinutes: number | null;
};

export type RestaurantPhoto = {
  id: string;
  url: string;
  kind: string;
  caption: string | null;
  sortOrder: number;
};

export type RestaurantHour = {
  dayOfWeek: number;
  dayLabel: string;
  isClosed: boolean;
  openTime: string | null;
  closeTime: string | null;
  summary: string;
};

export type RestaurantBranchCard = {
  id: string;
  companyId: string;
  name: string;
  companyName: string | null;
  companySlug: string | null;
  cuisineName: string | null;
  coverImageUrl: string | null;
  addressSummary: string;
  phone: string | null;
  timezone: string;
  isOpen: boolean;
  policySummary: {
    depositRequired: boolean;
    depositAmount: number;
    depositCurrency: string;
    bookingCutoffHours: number | null;
    freeCancelWindowHours: number | null;
    gracePeriodMinutes: number | null;
  };
};

export type RestaurantBranchDetail = RestaurantBranchCard & {
  about: string;
  email: string | null;
  hours: RestaurantHour[];
  amenities: Array<{ id: string; name: string; slug: string | null }>;
  tags: Array<{ id: string; name: string; slug: string | null }>;
  photos: RestaurantPhoto[];
  policies: RestaurantPolicy;
};

export type AvailableSeatingOption = {
  id: string;
  name: string;
  type: "SINGLE" | "COMBO";
  tableIds: string[];
  availableTimes: string[];
};

export type AvailableFloor = {
  id: string;
  name: string;
  tables: AvailableSeatingOption[];
};

export type ReservationDraft = {
  version: 1;
  step: number;
  branchId: string;
  partySize: number;
  reservationDate: string;
  durationMinutes: number;
  reservationTimeLocal: string;
  floorId: string;
  seatingOption: AvailableSeatingOption | null;
  specialRequest: string;
  paymentMethod?: PaymentMethod | null;
};

export type PaymentMethod = "CARD" | "APPLE_PAY";

export type CustomerReservation = {
  id: string;
  refNumber: string | null;
  branchId: string;
  branchName: string;
  status: string;
  reservationTime: string;
  reservationDateLocal?: string | null;
  reservationTimeLocal?: string | null;
  durationMinutes: number;
  partySize: number;
  depositAmount: number;
  depositCurrency: string;
  depositRequired: boolean;
  holdExpiresAt: string | null;
  tableIds?: string[];
  tableLabels?: string[];
  branchLatitude?: number | null;
  branchLongitude?: number | null;
};

export type PaymentStatus = {
  paymentId: string;
  reservationId: string;
  status: "PENDING" | "SUCCEEDED" | "FAILED" | "NEEDS_REFUND";
  resolution?: string | null;
  checkoutUrl?: string | null;
  reservation?: CustomerReservation | null;
};
