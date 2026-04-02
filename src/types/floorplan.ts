export type FloorplanVersionApiRecord = {
  id?: string;
  branch_id?: string | null;
  branchId?: string | null;
  version_no?: number | string | null;
  versionNo?: number | string | null;
  status?: string | null;
  published_at?: string | null;
  publishedAt?: string | null;
  [key: string]: unknown;
};

export type FloorplanFloorApiRecord = {
  id?: string;
  name?: string | null;
  sort_order?: number | string | null;
  sortOrder?: number | string | null;
  [key: string]: unknown;
};

export type FloorplanTableApiRecord = {
  id?: string;
  label?: string | null;
  is_active?: boolean | null;
  isActive?: boolean | null;
  is_reservable?: boolean | null;
  isReservable?: boolean | null;
  [key: string]: unknown;
};

export type ManagedBranchRecord = {
  id?: string;
  name?: string | null;
  companyName?: string | null;
  status?: string | null;
  [key: string]: unknown;
};
