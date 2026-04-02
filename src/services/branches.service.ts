import { api } from "./api";
import type {
  BranchPhotoKind,
  UpdateBranchOpeningHoursPayload,
} from "../types/branch";

export const branchesService = {
  listManaged: async () => {
    const res = await api.get("/api/branches/managed");
    return res.data;
  },

  getBranch: async (branchId: string) => {
    const res = await api.get(`/api/branches/${branchId}`);
    return res.data;
  },

  updateBranch: async (
    branchId: string,
    payload: {
      name?: string;
      slug?: string;
      addressLine1?: string;
      addressLine2?: string;
      area?: string;
      city?: string;
      governorate?: string;
      postalCode?: string;
      landmark?: string;
      country?: string;
      latitude?: number;
      longitude?: number;
      timezone?: string;
      about?: string;
      placeId?: string;
      geocodeProvider?: string;
      geocodeAccuracy?: string;
      phone?: string;
      email?: string;
    }
  ) => {
    const res = await api.patch(`/api/branches/${branchId}`, payload);
    return res.data;
  },

  deleteBranch: async (branchId: string) => {
    const res = await api.delete(`/api/branches/${branchId}`);
    return res.data;
  },

  listBranchPhotos: async (branchId: string) => {
    const res = await api.get(`/api/branches/${branchId}/photos`);
    return res.data;
  },

  uploadBranchPhoto: async (
    branchId: string,
    file: File,
    kind: BranchPhotoKind,
    caption?: string
  ) => {
    const formData = new FormData();
    formData.append("image", file);
    formData.append("kind", kind);

    if (caption !== undefined) {
      formData.append("caption", caption);
    }

    const res = await api.post(`/api/branches/${branchId}/photos`, formData);
    return res.data;
  },

  deleteBranchPhoto: async (branchId: string, photoId: string) => {
    const res = await api.delete(`/api/branches/${branchId}/photos/${photoId}`);
    return res.data;
  },

  reorderBranchPhotos: async (branchId: string, photoIds: string[]) => {
    const res = await api.put(`/api/branches/${branchId}/photos/order`, {
      photoIds,
    });
    return res.data;
  },

  getPublishedFloorplanVersion: async (branchId: string) => {
    const res = await api.get(
      `/api/branches/${branchId}/floorplan/versions/published`
    );
    return res.data;
  },

  getOpeningHours: async (branchId: string) => {
    const res = await api.get(`/api/branches/${branchId}/opening-hours`);
    return res.data;
  },

  getBranchPolicies: async (branchId: string) => {
    const res = await api.get(`/api/branches/${branchId}/policies`);
    return res.data;
  },

  updateOpeningHours: async (
    branchId: string,
    payload: UpdateBranchOpeningHoursPayload
  ) => {
    const res = await api.put(`/api/branches/${branchId}/opening-hours`, payload);
    return res.data;
  },

  submitBranchProfile: async (branchId: string) => {
    const res = await api.post(`/api/branches/${branchId}/submit`);
    return res.data;
  },

  approveBranchProfile: async (branchId: string) => {
    const res = await api.post(`/api/branches/${branchId}/approve`);
    return res.data;
  },
};
