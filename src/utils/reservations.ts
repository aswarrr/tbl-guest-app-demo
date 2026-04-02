import type { SessionUser } from "../types/auth";
import type {
  ReservationApiRecord,
  ReservationRecord,
  ReservationScopeRequest,
} from "../types/reservation";

export type ReservationAccessMode =
  | "SUPER_ADMIN"
  | "COMPANY_MANAGER"
  | "BRANCH_MANAGER"
  | "MIXED_MANAGER"
  | "NONE";

export type ReservationAccess = {
  hasAccess: boolean;
  mode: ReservationAccessMode;
  scopeRequests: ReservationScopeRequest[];
  managedCompanyCount: number;
  managedBranchCount: number;
};

const reservationDateTimeFormatter = new Intl.DateTimeFormat(undefined, {
  dateStyle: "medium",
  timeStyle: "short",
});

function normalizeRoleName(value?: string | null) {
  return (value || "")
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, "_");
}

function toText(value: unknown): string | null {
  if (typeof value !== "string") return null;

  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

function toNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;

  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
}

function extractNames(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value
      .flatMap((item) => {
        if (typeof item === "string") return [item];
        if (!item || typeof item !== "object") return [];

        const record = item as Record<string, unknown>;

        return [
          record.name,
          record.tableName,
          record.table_name,
          record.label,
          record.code,
        ]
          .map(toText)
          .filter((candidate): candidate is string => !!candidate);
      })
      .map((name) => name.trim())
      .filter(Boolean);
  }

  const text = toText(value);
  if (!text) return [];

  return text
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);
}

function extractTableNames(record: ReservationApiRecord): string[] {
  const candidates = [
    record.table_names,
    record.tableNames,
    record.tables,
    record.reserved_tables,
    record.reservedTables,
    record.assigned_tables,
    record.assignedTables,
  ];

  for (const candidate of candidates) {
    const names = extractNames(candidate);

    if (names.length > 0) {
      return Array.from(new Set(names));
    }
  }

  return [];
}

function buildEndTime(startAt: string | null, durationMinutes: number | null) {
  if (!startAt || durationMinutes === null) return null;

  const parsedStart = new Date(startAt);

  if (Number.isNaN(parsedStart.getTime())) {
    return null;
  }

  return new Date(parsedStart.getTime() + durationMinutes * 60_000).toISOString();
}

export function normalizeReservation(record: ReservationApiRecord): ReservationRecord {
  const reservationTime =
    toText(record.reservation_time) ?? toText(record.reservationTime);
  const durationMinutes =
    toNumber(record.duration_minutes) ?? toNumber(record.durationMinutes);

  return {
    id: toText(record.id) ?? crypto.randomUUID(),
    branchId: toText(record.branch_id) ?? toText(record.branchId),
    branchName: toText(record.branchName),
    companyName: toText(record.companyName),
    customerName:
      toText(record.customer_name) ?? toText(record.customerName) ?? "Guest",
    customerPhone:
      toText(record.customer_phone) ?? toText(record.customerPhone),
    customerEmail:
      toText(record.customer_email) ?? toText(record.customerEmail),
    partySize: toNumber(record.party_size) ?? toNumber(record.partySize),
    tableNames: extractTableNames(record),
    reservationTime,
    endTime: buildEndTime(reservationTime, durationMinutes),
    durationMinutes,
    status: toText(record.status) ?? "UNKNOWN",
    specialRequest:
      toText(record.special_request) ?? toText(record.specialRequest),
    createdAt: toText(record.created_at) ?? toText(record.createdAt),
    canceledAt: toText(record.canceled_at) ?? toText(record.canceledAt),
    cancellationReason:
      toText(record.cancellation_reason) ?? toText(record.cancellationReason),
    raw: record,
  };
}

export function formatReservationDateTime(value?: string | null) {
  if (!value) return "Not available";

  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return reservationDateTimeFormatter.format(parsed);
}

export function formatReservationStatus(value?: string | null) {
  const resolved = toText(value) ?? "UNKNOWN";

  return resolved
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function formatReservationValue(
  value?: string | number | null,
  fallback = "Not available"
) {
  if (value === null || value === undefined || value === "") {
    return fallback;
  }

  return String(value);
}

export function formatReservationTables(tableNames: string[]) {
  return tableNames.length > 0 ? tableNames.join(", ") : "Unassigned";
}

export function formatReservationAccessMode(mode: ReservationAccessMode) {
  switch (mode) {
    case "SUPER_ADMIN":
      return "Super Admin";
    case "COMPANY_MANAGER":
      return "Restaurant Manager";
    case "BRANCH_MANAGER":
      return "Branch Manager";
    case "MIXED_MANAGER":
      return "Mixed Manager Access";
    default:
      return "No Reservation Access";
  }
}

export function getReservationAccess(user: SessionUser | null): ReservationAccess {
  if (user?.isSuperAdmin) {
    return {
      hasAccess: true,
      mode: "SUPER_ADMIN",
      scopeRequests: [
        {
          key: "all",
          scopeType: "ALL",
          label: "All reservations",
        },
      ],
      managedCompanyCount: Array.isArray(user.companyRoles)
        ? user.companyRoles.length
        : 0,
      managedBranchCount: Array.isArray(user.branchRoles)
        ? user.branchRoles.length
        : 0,
    };
  }

  const companyRoleMap = new Map<string, { companyId: string; companyName: string }>();

  for (const role of Array.isArray(user?.companyRoles) ? user.companyRoles : []) {
    if (normalizeRoleName(role.roleName) !== "restaurant_manager") continue;

    companyRoleMap.set(role.companyId, {
      companyId: role.companyId,
      companyName: role.companyName,
    });
  }

  const branchRoleMap = new Map<
    string,
    { branchId: string; branchName: string; companyId?: string }
  >();

  for (const role of Array.isArray(user?.branchRoles) ? user.branchRoles : []) {
    if (normalizeRoleName(role.roleName) !== "branch_manager") continue;

    branchRoleMap.set(role.branchId, {
      branchId: role.branchId,
      branchName: role.branchName || role.branchSlug || role.branchId,
      companyId: role.companyId,
    });
  }

  const managedCompanies = Array.from(companyRoleMap.values());
  const managedCompanyIds = new Set(managedCompanies.map((company) => company.companyId));
  const managedBranches = Array.from(branchRoleMap.values());

  const scopeRequests: ReservationScopeRequest[] = [
    ...managedCompanies.map((company) => ({
      key: `company-${company.companyId}`,
      scopeType: "COMPANY" as const,
      label: company.companyName,
      params: {
        companyId: company.companyId,
        limit: 500,
        offset: 0,
      },
    })),
    ...managedBranches
      .filter((branch) => !branch.companyId || !managedCompanyIds.has(branch.companyId))
      .map((branch) => ({
        key: `branch-${branch.branchId}`,
        scopeType: "BRANCH" as const,
        label: branch.branchName,
        params: {
          branchId: branch.branchId,
          limit: 500,
          offset: 0,
        },
      })),
  ];

  const mode: ReservationAccessMode =
    managedCompanies.length > 0 && managedBranches.length > 0
      ? "MIXED_MANAGER"
      : managedCompanies.length > 0
        ? "COMPANY_MANAGER"
        : managedBranches.length > 0
          ? "BRANCH_MANAGER"
          : "NONE";

  return {
    hasAccess: scopeRequests.length > 0,
    mode,
    scopeRequests,
    managedCompanyCount: managedCompanies.length,
    managedBranchCount: managedBranches.length,
  };
}
