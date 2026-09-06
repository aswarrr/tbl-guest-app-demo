import { DEFAULT_TENANT_SLUG } from "./config";
import type { ReservationDraft } from "./types";

const DRAFT_PREFIX = "tbl.restaurant-reservation-draft.v1";

export function resolveTenantSlug({
  hostname,
  search,
  rootDomain,
  defaultSlug,
}: {
  hostname: string;
  search: string;
  rootDomain?: string;
  defaultSlug?: string;
}) {
  const querySlug = new URLSearchParams(search).get("tenant")?.trim().toLowerCase();
  if (querySlug) return querySlug;

  const host = hostname.toLowerCase().split(":")[0];
  const normalizedRoot = rootDomain?.trim().toLowerCase().replace(/^\./, "");
  if (normalizedRoot && host.endsWith(`.${normalizedRoot}`)) {
    const subdomain = host.slice(0, -(normalizedRoot.length + 1));
    if (subdomain && subdomain !== "www") return subdomain;
  }

  return defaultSlug?.trim().toLowerCase() || DEFAULT_TENANT_SLUG;
}

export function draftStorageKey(tenantSlug: string) {
  return `${DRAFT_PREFIX}:${tenantSlug}`;
}

export function loadReservationDraft(tenantSlug: string): ReservationDraft | null {
  try {
    const raw = sessionStorage.getItem(draftStorageKey(tenantSlug));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as ReservationDraft;
    return parsed.version === 1 ? parsed : null;
  } catch {
    return null;
  }
}

export function saveReservationDraft(tenantSlug: string, draft: ReservationDraft) {
  sessionStorage.setItem(draftStorageKey(tenantSlug), JSON.stringify(draft));
}

export function clearReservationDraft(tenantSlug: string) {
  sessionStorage.removeItem(draftStorageKey(tenantSlug));
}

export function safeReturnPath(value: string | null, fallback = "/reserve") {
  return value?.startsWith("/") && !value.startsWith("//") ? value : fallback;
}
