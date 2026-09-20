import { Navigate } from "react-router-dom";
import type { ReactNode } from "react";
import useTenantPath from "../../hooks/useTenantPath";
import { useFeatures, type Features } from "../../website/features";

/**
 * Keeps a page reachable only while the restaurant offers it.
 *
 * Hiding a navigation link is not enough on its own: the route stays open to
 * anyone with the address, from an old bookmark or a search result. A guest who
 * lands on a switched-off page is sent to the restaurant's home page rather
 * than a dead end.
 */
export default function FeatureRoute({
  need,
  children,
}: {
  need: keyof Features;
  children: ReactNode;
}) {
  const features = useFeatures();
  const tenantPath = useTenantPath();
  if (!features[need]) return <Navigate to={tenantPath()} replace />;
  return <>{children}</>;
}
