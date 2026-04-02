import type { BranchRole, CompanyRole } from "./auth";

export type WorkspaceScopeType = "COMPANY" | "BRANCH";

export type WorkspaceCompany = {
  companyId: string;
  companyName: string;
  companySlug: string;
  roles: CompanyRole[];
};

export type WorkspaceBranch = {
  branchId: string;
  companyId?: string;
  branchName?: string;
  branchSlug?: string;
  roles: BranchRole[];
};

export type WorkspaceRoleOption = {
  roleId: string;
  roleName: string;
  sourceScope: WorkspaceScopeType;
};

export type WorkspaceContextValue = {
  companies: WorkspaceCompany[];
  branches: WorkspaceBranch[];
  activeCompanyId: string | null;
  activeBranchId: string | null;
  activeCompany: WorkspaceCompany | null;
  activeBranch: WorkspaceBranch | null;
  activeScopeType: WorkspaceScopeType;
  activeRoleOptions: WorkspaceRoleOption[];
  setActiveCompanyId: (companyId: string | null) => void;
  setActiveBranchId: (branchId: string | null) => void;
};