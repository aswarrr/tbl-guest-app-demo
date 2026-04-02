import { api } from "./api";

export type CreateInvitationPayload = {
  destination: string;
  channel: "email" | "sms" | "whatsapp";
  scopeType: "COMPANY" | "BRANCH";
  scopeId: string;
  roleId: string;
};

export const invitationsService = {
  validate: async (token: string) => {
    const res = await api.get(`/api/invitations/validate/${token}`);
    return res.data;
  },

  create: async (payload: CreateInvitationPayload) => {
    const res = await api.post("/api/invitations", payload);
    return res.data;
  },

  accept: async (payload: { token: string }) => {
    const res = await api.post("/api/invitations/accept", payload);
    return res.data;
  },
};