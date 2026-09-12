import { useCallback } from "react";
import useTenant from "./useTenant";

/**
 * Builds links scoped to the current restaurant.
 *
 * Every guest route lives under /:companySlug, so a bare "/reserve" would leave
 * the restaurant entirely. This keeps links inside the tenant the guest is on.
 */
export default function useTenantPath() {
  const { tenantSlug } = useTenant();

  return useCallback(
    (path = "") => {
      const suffix = path.replace(/^\//, "");
      return suffix ? `/${tenantSlug}/${suffix}` : `/${tenantSlug}`;
    },
    [tenantSlug],
  );
}
