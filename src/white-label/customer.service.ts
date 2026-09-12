import { api } from "../services/api";
import type {
  AvailableFloor,
  CustomerReservation,
  GuestMenu,
  PaymentStatus,
  RestaurantBranchCard,
  RestaurantBranchDetail,
  TenantCompany,
  TenantSummary,
} from "./types";

type Envelope<T> = { ok?: boolean; data?: T; error?: { message?: string } };

function unwrap<T>(payload: Envelope<T> | T): T {
  if (payload && typeof payload === "object" && "data" in payload) {
    const envelope = payload as Envelope<T>;
    if (envelope.data !== undefined) return envelope.data;
    throw new Error(envelope.error?.message || "The restaurant service returned no data.");
  }
  return payload as T;
}

export const customerService = {
  /** Restaurants with a public site, for the host's directory page. */
  async listTenants() {
    const response = await api.get("/api/mobile/tenants", { skipGlobalLoading: true });
    return unwrap<TenantSummary[]>(response.data);
  },

  /** Branding for one restaurant. Public for active companies. */
  async getCompany(companySlug: string) {
    const response = await api.get(`/api/companies/slug/${encodeURIComponent(companySlug)}`, {
      skipGlobalLoading: true,
    });
    return unwrap<TenantCompany>(response.data);
  },

  /** This restaurant's branches. Filtered server-side, so it is one request. */
  async listTenantBranches(companySlug: string) {
    const response = await api.get("/api/mobile/branches", {
      params: { companySlug, limit: 100 },
      skipGlobalLoading: true,
    });
    return unwrap<RestaurantBranchCard[]>(response.data);
  },

  /** The published menu, or null when the restaurant has not published one. */
  async getTenantMenu(companySlug: string) {
    const response = await api.get(
      `/api/mobile/tenants/${encodeURIComponent(companySlug)}/menu`,
      { skipGlobalLoading: true },
    );
    return unwrap<GuestMenu | null>(response.data);
  },

  async getBranch(branchId: string) {
    const response = await api.get(`/api/mobile/branches/${branchId}`, { skipGlobalLoading: true });
    return unwrap<RestaurantBranchDetail>(response.data);
  },

  async getBlindAvailability(
    branchId: string,
    payload: { date: string; partySize: number; durationMinutes: number },
  ) {
    const response = await api.post(
      `/api/mobile/branches/${branchId}/blind-availability`,
      payload,
      { skipGlobalLoading: true },
    );
    return unwrap<{ isOpen: boolean; reason?: string; times: string[] }>(response.data);
  },

  async getFloorsAvailability(
    branchId: string,
    payload: { date: string; partySize: number; durationMinutes: number; time: string },
  ) {
    const response = await api.post(
      `/api/mobile/branches/${branchId}/floors-availability`,
      payload,
      { skipGlobalLoading: true },
    );
    return unwrap<{ isOpen: boolean; reason?: string; floors: AvailableFloor[] }>(response.data);
  },

  async createHold(
    branchId: string,
    payload: {
      partySize: number;
      reservationDate: string;
      reservationTimeLocal: string;
      durationMinutes: number;
      tableIds: string[];
      specialRequest?: string;
    },
  ) {
    const response = await api.post(`/api/mobile/branches/${branchId}/holds`, payload);
    return unwrap<CustomerReservation>(response.data);
  },

  async startPayment(reservationId: string) {
    const response = await api.post("/api/mobile/payments/start", { reservationId });
    return unwrap<PaymentStatus & { attemptId: string; checkoutUrl: string }>(response.data);
  },

  async getPaymentStatus(paymentId: string) {
    const response = await api.get(`/api/mobile/payments/${paymentId}`, { skipGlobalLoading: true });
    return unwrap<PaymentStatus>(response.data);
  },

  async confirmReservation(reservationId: string) {
    const response = await api.post(`/api/mobile/reservations/${reservationId}/confirm`);
    return unwrap<CustomerReservation>(response.data);
  },

  async getReservation(reservationId: string) {
    const response = await api.get(`/api/mobile/reservations/${reservationId}`, { skipGlobalLoading: true });
    return unwrap<CustomerReservation>(response.data);
  },
};
