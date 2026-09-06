import { createContext } from "react";
import type { RestaurantBranchDetail, TenantConfig } from "../white-label/types";

export type TenantContextValue = {
  tenant: TenantConfig | null;
  tenantSlug: string;
  branches: RestaurantBranchDetail[];
  loading: boolean;
  error: string;
  refresh: () => Promise<void>;
};

export const TenantContext = createContext<TenantContextValue | null>(null);
