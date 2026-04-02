import { api } from "./api";

export type Role = {
  id: string;
  name: string;
  description?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
};

export const rolesService = {
  listRoles: async () => {
    const res = await api.get("/api/roles");
    return res.data;
  },
};