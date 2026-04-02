export type ReservationApiRecord = {
  id?: string;
  branch_id?: string | null;
  branchId?: string | null;
  customer_name?: string | null;
  customerName?: string | null;
  customer_phone?: string | null;
  customerPhone?: string | null;
  customer_email?: string | null;
  customerEmail?: string | null;
  party_size?: number | string | null;
  partySize?: number | string | null;
  reservation_time?: string | null;
  reservationTime?: string | null;
  duration_minutes?: number | string | null;
  durationMinutes?: number | string | null;
  status?: string | null;
  special_request?: string | null;
  specialRequest?: string | null;
  created_at?: string | null;
  createdAt?: string | null;
  canceled_at?: string | null;
  canceledAt?: string | null;
  cancellation_reason?: string | null;
  cancellationReason?: string | null;
  table_names?: unknown;
  tableNames?: unknown;
  table_ids?: unknown;
  tableIds?: unknown;
  tables?: unknown;
  reserved_tables?: unknown;
  reservedTables?: unknown;
  assigned_tables?: unknown;
  assignedTables?: unknown;
  branchName?: string | null;
  companyName?: string | null;
  [key: string]: unknown;
};

export type ReservationRecord = {
  id: string;
  branchId: string | null;
  branchName: string | null;
  companyName: string | null;
  customerName: string;
  customerPhone: string | null;
  customerEmail: string | null;
  partySize: number | null;
  tableNames: string[];
  reservationTime: string | null;
  endTime: string | null;
  durationMinutes: number | null;
  status: string;
  specialRequest: string | null;
  createdAt: string | null;
  canceledAt: string | null;
  cancellationReason: string | null;
  raw: ReservationApiRecord;
};

export type ReservationQrToken = {
  qrId: string;
  reservationId: string;
  token: string;
  status: string;
  expiresAt: string | null;
  reservationStatus: string | null;
  customerName: string | null;
  raw?: unknown;
};

export type ReservationListParams = {
  companyId?: string;
  branchId?: string;
  limit?: number;
  offset?: number;
};

export type CreateReservationHoldPayload = {
  partySize: number;
  reservationTime: string;
  durationMinutes: number;
  tableIds: string[];
};

export type ReservationScopeRequest = {
  key: string;
  scopeType: "ALL" | "COMPANY" | "BRANCH";
  label: string;
  params?: ReservationListParams;
};
