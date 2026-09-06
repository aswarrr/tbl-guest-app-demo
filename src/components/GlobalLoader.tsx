import useLoading from "../hooks/useLoading";
import { getTenantConfig } from "../white-label/config";
import { resolveTenantSlug } from "../white-label/tenant";
import TenantLoader from "./site/TenantLoader";

export default function GlobalLoader() {
  const isLoading = useLoading();
  const tenant = getTenantConfig(
    resolveTenantSlug({
      hostname: window.location.hostname,
      search: window.location.search,
      rootDomain: import.meta.env.VITE_TENANT_ROOT_DOMAIN,
      defaultSlug: import.meta.env.VITE_DEFAULT_TENANT_SLUG,
    }),
  );

  if (!isLoading) {
    return null;
  }

  return (
    <div className="loader-container">
      <div className="loader-backdrop" />
      <TenantLoader tenant={tenant} fullscreen text={null} />
    </div>
  );
}
