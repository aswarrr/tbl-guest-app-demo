export type RoleSource = "api" | "token";

export type CompanyRole = {
  id: string;
  roleId: string;
  roleName: string;
  companyId: string;
  invitedBy?: string | null;
  companyName: string;
  companySlug: string;
};

export type BranchRole = {
  id: string;
  roleId: string;
  roleName: string;
  branchId: string;
  companyId?: string;
  invitedBy?: string | null;
  branchName?: string;
  branchSlug?: string;
  companyName?: string;
  companySlug?: string;
};

export type CurrentUserApi = {
  id: string;
  firstName: string;
  lastName: string;
  username: string;
  email: string;
  mobileE164: string | null;
  whatsappE164: string | null;
  mobileVerifiedAt: string | null;
  emailVerifiedAt: string | null;
  isSuperAdmin: boolean;
  createdAt: string;
  updatedAt: string | null;
  companyRoles: CompanyRole[];
  branchRoles: BranchRole[];
};

export type JwtPayload = {
  sub?: string;
  email?: string;
  mobile?: string;
  is_super_admin?: boolean;
  exp?: number;
  iat?: number;
};

export type SessionUser = Partial<CurrentUserApi> & {
  id?: string;
  email?: string;
  mobile?: string;
  mobileE164?: string | null;
  isSuperAdmin?: boolean;
  source?: RoleSource;
  raw?: unknown;
};