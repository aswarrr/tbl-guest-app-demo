import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useParams } from "react-router-dom";
import { TenantContext } from "./tenant-context";
import { customerService } from "../white-label/customer.service";
import { resolveTenantSlug } from "../white-label/tenant";
import type {
  GuestMenu,
  RestaurantBranchDetail,
  TenantCompany,
} from "../white-label/types";

function isNotFound(error: unknown) {
  return error instanceof Error && /not found/i.test(error.message);
}

export function TenantProvider({ children }: { children: ReactNode }) {
  const { companySlug } = useParams();

  // The path segment identifies the restaurant. Subdomain and env remain as
  // fallbacks so a custom domain can reuse this build later.
  const tenantSlug = useMemo(
    () =>
      resolveTenantSlug({
        pathSlug: companySlug,
        hostname: window.location.hostname,
        search: window.location.search,
        rootDomain: import.meta.env.VITE_TENANT_ROOT_DOMAIN,
        defaultSlug: import.meta.env.VITE_DEFAULT_TENANT_SLUG,
      }),
    [companySlug],
  );

  const [tenant, setTenant] = useState<TenantCompany | null>(null);
  const [branches, setBranches] = useState<RestaurantBranchDetail[]>([]);
  const [menu, setMenu] = useState<GuestMenu | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notFound, setNotFound] = useState(false);

  const generation = useRef(0);
  const invalidate = useCallback(() => { generation.current += 1; }, []);
  const refresh = useCallback(async () => {
    const request = ++generation.current;
    setTenant(null);
    setBranches([]);
    setMenu(null);
    if (!tenantSlug) {
      setNotFound(true);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");
    setNotFound(false);

    // The menu is fetched alongside the rest but settled separately: a menu
    // outage should hide the menu, not replace the whole site with an error.
    const [companyResult, branchesResult, menuResult] =
      await Promise.allSettled([
        customerService.getCompany(tenantSlug),
        customerService.listTenantBranches(tenantSlug),
        customerService.getTenantMenu(tenantSlug),
      ]);

    if (request !== generation.current) return;
    if (companyResult.status === "rejected") {
      setTenant(null);
      setBranches([]);
      setMenu(null);
      if (isNotFound(companyResult.reason)) {
        setNotFound(true);
      } else {
        setError(
          companyResult.reason instanceof Error
            ? companyResult.reason.message
            : "Unable to load this restaurant.",
        );
      }
      setLoading(false);
      return;
    }

    setTenant(companyResult.value);
    setMenu(menuResult.status === "fulfilled" ? menuResult.value : null);

    if (branchesResult.status === "rejected") {
      setBranches([]);
      setError(
        branchesResult.reason instanceof Error
          ? branchesResult.reason.message
          : "Unable to load this restaurant's locations.",
      );
      setLoading(false);
      return;
    }

    try {
      const details = await Promise.all(
        branchesResult.value.map((branch) =>
          customerService.getBranch(branch.id),
        ),
      );
      if (request !== generation.current) return;
      setBranches(details);
      if (details.length === 0) {
        setError("This restaurant has no published locations yet.");
      }
    } catch (nextError) {
      if (request !== generation.current) return;
      setBranches([]);
      setError(
        nextError instanceof Error
          ? nextError.message
          : "Unable to load this restaurant's locations.",
      );
    } finally {
      if (request === generation.current) setLoading(false);
    }
  }, [tenantSlug]);

  useEffect(() => {
    void refresh();
    return invalidate;
  }, [refresh, invalidate]);

  const value = useMemo(
    () => ({
      tenant,
      tenantSlug,
      branches,
      menu,
      loading,
      error,
      notFound,
      refresh,
    }),
    [tenant, tenantSlug, branches, menu, loading, error, notFound, refresh],
  );

  return (
    <TenantContext.Provider value={value}>{children}</TenantContext.Provider>
  );
}
