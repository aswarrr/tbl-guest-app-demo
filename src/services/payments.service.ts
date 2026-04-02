import { api } from "./api";

export const paymentsService = {
  startSession: async (reservationId: string) => {
    const res = await api.post("/api/payments/start", { reservationId });
    return res.data;
  },
};
