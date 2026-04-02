import { api } from "./api";
import type {
  CreateReservationHoldPayload,
  ReservationListParams,
} from "../types/reservation";

export const reservationsService = {
  list: async (params?: ReservationListParams) => {
    const res = await api.get("/api/reservations", {
      params: {
        limit: params?.limit ?? 500,
        offset: params?.offset ?? 0,
        companyId: params?.companyId,
        branchId: params?.branchId,
      },
    });

    return res.data;
  },

  getById: async (reservationId: string, params?: ReservationListParams) => {
    const res = await api.get(`/api/reservations/${reservationId}`, {
      params: {
        companyId: params?.companyId,
        branchId: params?.branchId,
      },
    });

    return res.data;
  },

  getQrToken: async (reservationId: string) => {
    const res = await api.get(`/api/reservations/${reservationId}/qr`, {
      headers: {
        accept: "application/json",
      },
    });

    return res.data;
  },

  createHold: async (branchId: string, payload: CreateReservationHoldPayload) => {
    const res = await api.post(`/api/branches/${branchId}/reservations/hold`, payload);
    return res.data;
  },
};
