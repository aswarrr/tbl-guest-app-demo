import { isRecord, type PreviewSnapshot } from "./contract";
// Validate display data before React sees it. The API owns the projection;
// the bridge additionally bounds collections and checks every rendered field.
export function validSnapshot(
  value: unknown,
  companyId: string,
  tenant: string,
): value is PreviewSnapshot {
  if (
    !isRecord(value) ||
    typeof value.revision !== "string" ||
    !isRecord(value.company) ||
    value.company.id !== companyId ||
    value.company.slug !== tenant
  )
    return false;
  const text = (v: unknown) => typeof v === "string" && v.length <= 10000;
  const optional = (v: unknown) => v === null || v === undefined || text(v);
  const company = value.company;
  if (
    !text(company.name) ||
    !text(company.currency) ||
    !["about", "logoUrl", "coverUrl"].every((k) => optional(company[k]))
  )
    return false;
  if (
    !Array.isArray(value.branches) ||
    value.branches.length > 1000 ||
    new Set(value.branches.map((b) => (isRecord(b) ? b.id : null))).size !==
      value.branches.length
  )
    return false;
  for (const b of value.branches) {
    if (
      !isRecord(b) ||
      b.companyId !== companyId ||
      !["id", "name", "about", "addressSummary", "timezone"].every((k) =>
        text(b[k]),
      ) ||
      !["phone", "email", "cuisineName", "coverImageUrl"].every((k) =>
        optional(b[k]),
      ) ||
      typeof b.isOpen !== "boolean" ||
      !isRecord(b.policies)
    )
      return false;
    if (
      !text(b.policies.depositCurrency) ||
      !Object.values(b.policies).every(
        (v) =>
          v === null ||
          typeof v === "boolean" ||
          text(v) ||
          (typeof v === "number" && Number.isFinite(v)),
      )
    )
      return false;
    if (
      !Array.isArray(b.photos) ||
      b.photos.length > 1000 ||
      b.photos.some((p) => !isRecord(p) || !text(p.id) || !text(p.url))
    )
      return false;
    if (
      !Array.isArray(b.hours) ||
      b.hours.length > 100 ||
      b.hours.some(
        (h) =>
          !isRecord(h) ||
          typeof h.dayOfWeek !== "number" ||
          !text(h.dayLabel) ||
          !text(h.summary),
      )
    )
      return false;
    for (const key of ["amenities", "tags"])
      if (
        !Array.isArray(b[key]) ||
        b[key].length > 1000 ||
        b[key].some((a) => !isRecord(a) || !text(a.id) || !text(a.name))
      )
        return false;
  }
  if (value.menu !== null) {
    const m = value.menu;
    if (
      !isRecord(m) ||
      !text(m.currency) ||
      !Array.isArray(m.sections) ||
      m.sections.length > 100
    )
      return false;
    for (const s of m.sections) {
      if (
        !isRecord(s) ||
        !text(s.name) ||
        !text(s.eyebrow) ||
        !Array.isArray(s.items) ||
        s.items.length > 1000
      )
        return false;
      for (const i of s.items)
        if (
          !isRecord(i) ||
          !text(i.name) ||
          !text(i.description) ||
          !optional(i.imageUrl) ||
          typeof i.available !== "boolean" ||
          !(
            i.price === null ||
            (typeof i.price === "number" && Number.isFinite(i.price))
          ) ||
          !Array.isArray(i.tags) ||
          !i.tags.every(text)
        )
          return false;
    }
  }
  return true;
}
