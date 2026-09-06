import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { TenantContext } from "./tenant-context";
import { customerService } from "../white-label/customer.service";
import { getTenantConfig } from "../white-label/config";
import { resolveTenantSlug } from "../white-label/tenant";
import type { RestaurantBranchDetail } from "../white-label/types";

export function TenantProvider({ children }: { children: ReactNode }) {
  const tenantSlug = useMemo(
    () =>
      resolveTenantSlug({
        hostname: window.location.hostname,
        search: window.location.search,
        rootDomain: import.meta.env.VITE_TENANT_ROOT_DOMAIN,
        defaultSlug: import.meta.env.VITE_DEFAULT_TENANT_SLUG,
      }),
    [],
  );
  const tenant = getTenantConfig(tenantSlug);
  const [branches, setBranches] = useState<RestaurantBranchDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const refresh = useCallback(async () => {
    if (!tenant) {
      setError("This restaurant website is not configured.");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");
    try {
      const cards = await customerService.listTenantBranches(tenant.slug);
      if (cards.length === 0) throw new Error("This restaurant has no published branches.");
      const details = await Promise.all(cards.map((branch) => customerService.getBranch(branch.id)));
      setBranches(details);
    } catch (nextError) {
      setBranches([]);
      setError(nextError instanceof Error ? nextError.message : "Unable to load this restaurant.");
    } finally {
      setLoading(false);
    }
  }, [tenant]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const value = useMemo(
    () => ({ tenant, tenantSlug, branches, loading, error, refresh }),
    [tenant, tenantSlug, branches, loading, error, refresh],
  );

  return <TenantContext.Provider value={value}>{children}</TenantContext.Provider>;
}
