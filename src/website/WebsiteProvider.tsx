import { useEffect, useState, type ReactNode } from "react";
import useTenant from "../hooks/useTenant";
import { api } from "../services/api";
import { normalizeConfig, validateConfig, type WebsiteConfigV1 } from "./contract";
import { PresentationContext } from "./presentation";
export default function WebsiteProvider({ children }: { children: ReactNode }) {
  const { tenant, tenantSlug } = useTenant();
  const [saved, setSaved] = useState<{
    slug: string;
    config: WebsiteConfigV1;
  } | null>(null);
  useEffect(() => {
    if (!tenant) return;
    let current = true;
    void api
      .get(`/api/mobile/tenants/${encodeURIComponent(tenantSlug)}/website`, {
        skipGlobalLoading: true,
      })
      .then((response) => {
        const data = response.data.data;
        if (!current || !data?.config) return;
        // A site published before a schema field existed is brought up to date
        // rather than failing validation: an invalid config is dropped whole,
        // which would strip the restaurant's design back to bare chrome.
        const config = normalizeConfig(data.config) as WebsiteConfigV1;
        if (!validateConfig(config, tenant.id).length)
          setSaved({ slug: tenantSlug, config });
      })
      .catch(() => {
        /* Presentation outages never block reservations. */
      });
    return () => {
      current = false;
    };
  }, [tenant, tenantSlug]);
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
