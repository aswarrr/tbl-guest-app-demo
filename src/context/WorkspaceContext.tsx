import {
  createContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import useAuth from "../hooks/useAuth";
import type { BranchRole, CompanyRole } from "../types/auth";
import type {
  WorkspaceBranch,
  WorkspaceCompany,
  WorkspaceContextValue,
  WorkspaceRoleOption,
} from "../types/workspace";

export const WorkspaceContext = createContext<WorkspaceContextValue | undefined>(
  undefined
);

function buildCompanies(
  companyRoles: CompanyRole[] = [],
  branchRoles: BranchRole[] = []
): WorkspaceCompany[] {
  const map = new Map<string, WorkspaceCompany>();

  for (const role of companyRoles) {
    const existing = map.get(role.companyId);

    if (existing) {
      existing.roles.push(role);
      continue;
    }

    map.set(role.companyId, {
      companyId: role.companyId,
      companyName: role.companyName,
      companySlug: role.companySlug,
      roles: [role],
    });
  }

  for (const role of branchRoles) {
    if (!role.companyId) continue;

    if (map.has(role.companyId)) {
      continue;
    }

    map.set(role.companyId, {
      companyId: role.companyId,
      companyName: role.companyName || role.companySlug || role.companyId,
      companySlug: role.companySlug || role.companyId,
      roles: [],
    });
  }

  return Array.from(map.values());
}

function buildBranches(
  branchRoles: BranchRole[] = [],
  activeCompanyId: string | null
): WorkspaceBranch[] {
  const filtered = activeCompanyId
    ? branchRoles.filter((role) => role.companyId === activeCompanyId)
    : branchRoles;

  const map = new Map<string, WorkspaceBranch>();

  for (const role of filtered) {
    const existing = map.get(role.branchId);

    if (existing) {
      existing.roles.push(role);
      continue;
    }

    map.set(role.branchId, {
      branchId: role.branchId,
      companyId: role.companyId,
      branchName: role.branchName,
      branchSlug: role.branchSlug,
      roles: [role],
    });
  }

  return Array.from(map.values());
}

function buildRoleOptions(
  activeCompany: WorkspaceCompany | null,
  activeBranch: WorkspaceBranch | null
): WorkspaceRoleOption[] {
  const map = new Map<string, WorkspaceRoleOption>();

  for (const role of activeCompany?.roles ?? []) {
    map.set(`COMPANY-${role.roleId}`, {
      roleId: role.roleId,
      roleName: role.roleName,
      sourceScope: "COMPANY",
    });
  }

  for (const role of activeBranch?.roles ?? []) {
    map.set(`BRANCH-${role.roleId}`, {
      roleId: role.roleId,
      roleName: role.roleName,
      sourceScope: "BRANCH",
    });
  }

  return Array.from(map.values());
}

export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();

  const userCompanyRoles = Array.isArray(user?.companyRoles)
    ? user.companyRoles
    : [];
  const userBranchRoles = Array.isArray(user?.branchRoles) ? user.branchRoles : [];

  const companies = useMemo(
    () => buildCompanies(userCompanyRoles, userBranchRoles),
    [userCompanyRoles, userBranchRoles]
  );

  const [activeCompanyId, setActiveCompanyId] = useState<string | null>(null);
  const [activeBranchId, setActiveBranchId] = useState<string | null>(null);

  useEffect(() => {
    if (!companies.length) {
      setActiveCompanyId(null);
      return;
    }

    const stillExists = companies.some(
      (company) => company.companyId === activeCompanyId
    );

    if (!stillExists) {
      setActiveCompanyId(companies[0].companyId);
    }
  }, [companies, activeCompanyId]);

  const branches = useMemo(
    () => buildBranches(userBranchRoles, activeCompanyId),
    [userBranchRoles, activeCompanyId]
  );

  useEffect(() => {
    if (!activeBranchId) return;

    const stillExists = branches.some((branch) => branch.branchId === activeBranchId);

    if (!stillExists) {
      setActiveBranchId(null);
    }
  }, [branches, activeBranchId]);

  useEffect(() => {
    if (userCompanyRoles.length > 0) return;

    if (!branches.length) {
      setActiveBranchId(null);
      return;
    }

    const stillExists = branches.some((branch) => branch.branchId === activeBranchId);

    if (!stillExists) {
      setActiveBranchId(branches[0].branchId);
    }
  }, [branches, activeBranchId, userCompanyRoles.length]);

  const activeCompany = useMemo(
    () =>
      companies.find((company) => company.companyId === activeCompanyId) ?? null,
    [companies, activeCompanyId]
  );

  const activeBranch = useMemo(
    () => branches.find((branch) => branch.branchId === activeBranchId) ?? null,
    [branches, activeBranchId]
  );

  const activeScopeType = activeBranch ? "BRANCH" : "COMPANY";

  const activeRoleOptions = useMemo(
    () => buildRoleOptions(activeCompany, activeBranch),
    [activeCompany, activeBranch]
  );

  const value = useMemo<WorkspaceContextValue>(
    () => ({
      companies,
      branches,
      activeCompanyId,
      activeBranchId,
      activeCompany,
      activeBranch,
      activeScopeType,
      activeRoleOptions,
      setActiveCompanyId: (companyId) => {
        setActiveCompanyId(companyId);
        setActiveBranchId(null);
      },
      setActiveBranchId,
    }),
    [
      companies,
      branches,
      activeCompanyId,
      activeBranchId,
      activeCompany,
      activeBranch,
      activeScopeType,
      activeRoleOptions,
    ]
  );

  return (
    <WorkspaceContext.Provider value={value}>
      {children}
    </WorkspaceContext.Provider>
  );
}
