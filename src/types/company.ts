export type Company = {
  id: string;
  name: string;
  slug: string;
  about?: string | null;
  logoUrl?: string | null;
  coverUrl?: string | null;
  currency?: string | null;
  cuisineId?: string | null;
  status?: string | null;
  address?: string | null;
  city?: string | null;
  country?: string | null;
  email?: string | null;
  phone?: string | null;
  timezone?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
  raw?: unknown;
};

export type CreateCompanyPayload = {
  name: string;
  slug: string;
  about?: string;
};