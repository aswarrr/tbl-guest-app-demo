import { api } from "./api";

export const staffService = {
  listCompanyStaff: async (companyId: string) => {
    const res = await api.get(`/api/companies/${companyId}/staff`);
    return res.data;
  },

  getCompanyStaffMember: async (companyId: string, userId: string) => {
    const res = await api.get(`/api/companies/${companyId}/staff/${userId}`);
    return res.data;
  },

  upsertBranchRole: async (
    companyId: string,
    userId: string,
    branchId: string,
    payload: { roleId: string }
  ) => {
    const res = await api.put(
      `/api/companies/${companyId}/staff/${userId}/branch-roles/${branchId}`,
      payload
    );
    return res.data;
  },

  revokeBranchRole: async (companyId: string, userId: string, branchId: string) => {
    const res = await api.delete(
      `/api/companies/${companyId}/staff/${userId}/branch-roles/${branchId}`
    );
    return res.data;
  },

  revokeCompanyRole: async (companyId: string, userId: string) => {
    const res = await api.delete(
      `/api/companies/${companyId}/staff/${userId}/company-roles`
    );
    return res.data;
  },
};