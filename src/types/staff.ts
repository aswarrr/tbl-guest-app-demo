import type { BranchRole, CompanyRole } from "./auth";

export type StaffMember = {
  id: string;
  displayName: string;
  username?: string;
  email?: string | null;
  mobileE164?: string | null;
  isSuperAdmin?: boolean;
  companyRoles: CompanyRole[];
  branchRoles: BranchRole[];
  raw?: unknown;
};

export type InviteStaffPayload = {
  destination: string;
  channel: "email" | "sms" | "whatsapp";
  scopeType: "COMPANY" | "BRANCH";
  scopeId: string;
  roleId: string;
};

export type InvitationRow = {
  destination: string;
  channel: string;
  scopeType: string;
  scopeId: string;
  roleId: string;
  status?: string;
  raw?: unknown;
};