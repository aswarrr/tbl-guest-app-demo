import { api } from "./api";
import type { CreateCompanyPayload } from "../types/company";
import type { CreateBranchPayload } from "../types/branch";

export const companiesService = {
  listCompanies: async () => {
    const res = await api.get("/api/companies");
    return res.data;
  },

  getCompany: async (companyId: string) => {
    const res = await api.get(`/api/companies/${companyId}`);
    return res.data;
  },

  createCompany: async (payload: CreateCompanyPayload) => {
    const res = await api.post("/api/companies", payload);
    return res.data;
  },

  updateCompany: async (
    companyId: string,
    payload: {
      slug?: string;
      name?: string;
      about?: string;
      logo_url?: string;
      currency?: string;
      cuisineId?: string | null;
    }
  ) => {
    const res = await api.patch(`/api/companies/${companyId}`, payload);
    return res.data;
  },

  deleteCompany: async (companyId: string) => {
    const res = await api.delete(`/api/companies/${companyId}`);
    return res.data;
  },

  getCompanyKyc: async (companyId: string) => {
    const res = await api.get(`/api/companies/${companyId}/kyc`);
    return res.data;
  },

  submitCompanyKyc: async (
    companyId: string,
    payload: {
      business_legal_name: string;
      owner_name: string;
      tax_registration_number: string;
      bank_name: string;
      bank_account_number: string;
      bank_iban: string;
    }
  ) => {
    const res = await api.post(`/api/companies/${companyId}/kyc`, payload);
    return res.data;
  },

  uploadCompanyLogo: async (companyId: string, file: File) => {
    const formData = new FormData();
    formData.append("image", file);

    const res = await api.post(`/api/uploads/company/${companyId}/logo`, formData);
    return res.data;
  },

  submitCompanyProfile: async (companyId: string) => {
    const res = await api.post(`/api/companies/${companyId}/submit`);
    return res.data;
  },

  approveCompanyProfile: async (companyId: string) => {
    const res = await api.post(`/api/companies/${companyId}/approve`);
    return res.data;
  },

  listCompanyAmenities: async (companyId: string) => {
    const res = await api.get(`/api/companies/${companyId}/amenities`);
    return res.data;
  },

  setCompanyAmenities: async (companyId: string, amenityIds: string[]) => {
    const res = await api.put(`/api/companies/${companyId}/amenities`, {
      amenityIds,
    });
    return res.data;
  },

  listCompanyTags: async (companyId: string) => {
    const res = await api.get(`/api/companies/${companyId}/tags`);
    return res.data;
  },

  setCompanyTags: async (companyId: string, tagIds: string[]) => {
    const res = await api.put(`/api/companies/${companyId}/tags`, {
      tagIds,
    });
    return res.data;
  },

  listAmenities: async (params?: { search?: string; limit?: number; offset?: number }) => {
    const res = await api.get("/api/amenities", { params });
    return res.data;
  },

  listTags: async (params?: { search?: string; limit?: number; offset?: number }) => {
    const res = await api.get("/api/tags", { params });
    return res.data;
  },

  listCuisines: async (params?: { search?: string; limit?: number; offset?: number }) => {
    const res = await api.get("/api/cuisines", { params });
    return res.data;
  },

  listBranches: async (companyId: string, status?: string) => {
    const res = await api.get(`/api/companies/${companyId}/branches`, {
      params: status ? { status } : undefined,
    });
    return res.data;
  },

  createBranch: async (companyId: string, payload: CreateBranchPayload) => {
    const res = await api.post(`/api/companies/${companyId}/branches`, payload);
    return res.data;
  },
};
