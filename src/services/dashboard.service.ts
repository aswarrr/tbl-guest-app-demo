import { api } from "./api";

export type KycStats = {
  pending_count?: number | string | null;
  approved_count?: number | string | null;
  rejected_count?: number | string | null;
  total_count?: number | string | null;
};

export type PendingKycRow = {
  company_id?: string;
  company_name?: string;
  company_slug?: string;
  kyc_status?: string;
  created_at?: string;
  updated_at?: string;
  [key: string]: unknown;
};

export type NotificationDeliveryRow = {
  id?: string;
  event_type?: string;
  channel?: string;
  status?: string;
  recipient?: string;
  last_error?: string;
  created_at?: string;
  provider?: string;
  provider_status?: string;
  [key: string]: unknown;
};

export type ProviderHealth = {
  provider?: string;
  status?: string;
  configured?: boolean;
  message?: string;
  error?: string;
  [key: string]: unknown;
};

export type MessagingStatus = {
  sms?: ProviderHealth;
  whatsapp?: ProviderHealth;
  email?: ProviderHealth;
};

export const dashboardService = {
  getKycStats: async () => {
    const res = await api.get("/api/kyc/stats");
    return res.data as { data?: KycStats } | KycStats;
  },

  listPendingKyc: async (limit = 5, offset = 0) => {
    const res = await api.get("/api/kyc/pending", {
      params: { limit, offset },
    });
    return res.data as { data?: PendingKycRow[] } | PendingKycRow[];
  },

  listFailedDeliveries: async (limit = 6) => {
    const res = await api.get("/api/admin/notifications/deliveries", {
      params: {
        status: "FAILED",
        limit,
        offset: 0,
      },
    });
    return res.data as { data?: NotificationDeliveryRow[] } | NotificationDeliveryRow[];
  },

  getMessagingStatus: async () => {
    const res = await api.get("/api/admin/messaging/test/status");
    return res.data as { data?: MessagingStatus } | MessagingStatus;
  },
};
