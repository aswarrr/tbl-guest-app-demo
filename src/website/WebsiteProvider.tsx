import { useEffect, useState, type ReactNode } from "react";
import useTenant from "../hooks/useTenant";
import { api } from "../services/api";
import { normalizeConfig, validateConfig, type WebsiteConfigV1 } from "./contract";
import { PresentationContext } from "./presentation";
import TenantLoader from "../components/site/TenantLoader";
export default function WebsiteProvider({ children }: { children: ReactNode }) {
  const { tenant, tenantSlug } = useTenant();
  const [saved, setSaved] = useState<{
    slug: string;
    config: WebsiteConfigV1;
  } | null>(null);
  const [settledSlug, setSettledSlug] = useState<string | null>(null);
  useEffect(() => {
    if (!tenant) return;
    let current = true;
    void api
      .get(`/api/mobile/tenants/${encodeURIComponent(tenantSlug)}/website`, {
        skipGlobalLoading: true,
      })
      .then((response) => {
        const data = response.data.data;
        const config = normalizeConfig(data?.config);
        if (
          current &&
          config &&
          !validateConfig(config, tenant.id).length
        )
          setSaved({ slug: tenantSlug, config: config as WebsiteConfigV1 });
      })
      .catch(() => {
        /* Presentation outages never block reservations. */
      })
      .finally(() => {
        if (current) setSettledSlug(tenantSlug);
      });
    return () => {
      current = false;
    };
  }, [tenant, tenantSlug]);
  // Resolve capabilities before mounting a legacy booking route or its links.
  if (tenant && settledSlug !== tenantSlug) {
    return <main className="wl-state-page"><TenantLoader tenant={tenant} text="Loading restaurant…" /></main>;
  }
  return (
    <PresentationContext.Provider
      value={{
        config: saved?.slug === tenantSlug ? saved.config : null,
        preview: false,
        branchId: null,
        selection: "",
        select: () => {},
      }}
    >
      {children}
    </PresentationContext.Provider>
  );
}
