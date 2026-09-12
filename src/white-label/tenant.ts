import type { ReservationDraft } from "./types";

const DRAFT_PREFIX = "tbl.restaurant-reservation-draft.v1";

/**
 * Which restaurant this request is for.
 *
 * The path segment wins, because that is the addressing scheme the host uses:
 * /restaurant-name. Subdomain and env fallbacks remain so a custom domain can
 * be pointed at the same build later without a rewrite.
 */
export function resolveTenantSlug({
  pathSlug,
  hostname,
  search,
  rootDomain,
  defaultSlug,
}: {
  pathSlug?: string;
  hostname?: string;
  search?: string;
  rootDomain?: string;
  defaultSlug?: string;
}) {
  const fromPath = pathSlug?.trim().toLowerCase();
  if (fromPath) return fromPath;

  const querySlug = new URLSearchParams(search ?? "").get("tenant")?.trim().toLowerCase();
  if (querySlug) return querySlug;

  const host = (hostname ?? "").toLowerCase().split(":")[0];
  const normalizedRoot = rootDomain?.trim().toLowerCase().replace(/^\./, "");
  if (normalizedRoot && host.endsWith(`.${normalizedRoot}`)) {
    const subdomain = host.slice(0, -(normalizedRoot.length + 1));
    if (subdomain && subdomain !== "www") return subdomain;
  }

  return defaultSlug?.trim().toLowerCase() || "";
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

/**
 * Where a sign-in may return to.
 *
 * Scoped to the current restaurant: without the slug check a crafted returnTo
 * could carry a guest from one restaurant's login into another's site.
 */
export function safeReturnPath(
  value: string | null,
  tenantSlug: string,
  fallback = "reserve",
) {
  const base = `/${tenantSlug}`;
  const fallbackPath = `${base}/${fallback.replace(/^\//, "")}`;
  if (!value || !value.startsWith("/") || value.startsWith("//")) return fallbackPath;
  return value === base || value.startsWith(`${base}/`) ? value : fallbackPath;
}
