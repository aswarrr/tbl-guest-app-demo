import { api } from "./api";

export const floorplanService = {
  listVersionFloors: async (branchId: string, versionId: string) => {
    const res = await api.get(
      `/api/branches/${branchId}/floorplan/versions/${versionId}/floors`
    );
    return res.data;
  },

  listFloorTables: async (branchId: string, floorId: string) => {
    const res = await api.get(`/api/branches/${branchId}/floorplan/floors/${floorId}/tables`);
    return res.data;
  },
};
