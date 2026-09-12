import { createContext } from "react";
import type {
  GuestMenu,
  RestaurantBranchDetail,
  TenantCompany,
} from "../white-label/types";

export type TenantContextValue = {
  /** The restaurant, from the API. Null while loading or when not found. */
  tenant: TenantCompany | null;
  tenantSlug: string;
  branches: RestaurantBranchDetail[];
  /**
   * The published menu, or null when this restaurant has none. Its own failure
   * is non-fatal: a menu outage must not take down the booking flow.
   */
  menu: GuestMenu | null;
  loading: boolean;
  error: string;
  /** True when the slug matched no restaurant, as opposed to a load failure. */
  notFound: boolean;
  refresh: () => Promise<void>;
};

export const TenantContext = createContext<TenantContextValue | null>(null);
