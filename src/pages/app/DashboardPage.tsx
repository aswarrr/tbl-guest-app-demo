import AppLayout from "../../layouts/AppLayout";
import useAuth from "../../hooks/useAuth";
import type { BranchRole, CompanyRole, SessionUser } from "../../types/auth";

function formatValue(value: unknown) {
  if (value === null || value === undefined || value === "") {
    return "—";
  }

  if (typeof value === "boolean") {
    return value ? "Yes" : "No";
  }

  return String(value);
}

function getDisplayName(user: SessionUser | null) {
  if (!user) return "—";

  const fullName = `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim();

  if (fullName) return fullName;

  return (
    user.username ??
    user.email ??
    user.mobileE164 ??
    user.mobile ??
    user.id ??
    "—"
  );
}

function getEmail(user: SessionUser | null) {
  return user?.email ?? "—";
}

function getMobile(user: SessionUser | null) {
  return user?.mobileE164 ?? user?.mobile ?? "—";
}

function getUserId(user: SessionUser | null) {
  return user?.id ?? "—";
}

function getProfileSource(user: SessionUser | null) {
  return user?.source ?? "No user profile loaded";
}

function getCompanyRoles(user: SessionUser | null): CompanyRole[] {
  return Array.isArray(user?.companyRoles) ? user.companyRoles : [];
}

function getBranchRoles(user: SessionUser | null): BranchRole[] {
  return Array.isArray(user?.branchRoles) ? user.branchRoles : [];
}

function getRoleSummary(user: SessionUser | null) {
  if (!user) return "Not returned yet by backend";

  if (user.isSuperAdmin) {
    return "Super Admin";
  }

  const companyRoles = getCompanyRoles(user);
  if (companyRoles.length > 0) {
    return companyRoles.map((role) => role.roleName).join(", ");
  }

  const branchRoles = getBranchRoles(user);
  if (branchRoles.length > 0) {
    return branchRoles.map((role) => role.roleName).join(", ");
  }

  return "Not returned yet by backend";
}

function getScopeSummary(user: SessionUser | null) {
  if (!user) return "Not returned yet by backend";

  const companyRoles = getCompanyRoles(user);
  if (companyRoles.length > 0) {
    const first = companyRoles[0];
    return `${first.companyName} (${first.companySlug})`;
  }

  const branchRoles = getBranchRoles(user);
  if (branchRoles.length > 0) {
    const first = branchRoles[0];
    return (
      first.branchName ??
      first.branchSlug ??
      first.branchId ??
      "Branch scope returned"
    );
  }

  return "Not returned yet by backend";
}

function getPrimaryCompany(user: SessionUser | null) {
  const companyRoles = getCompanyRoles(user);

  if (companyRoles.length === 0) return "—";

  const first = companyRoles[0];
  return first.companyName || first.companySlug || first.companyId || "—";
}

function getPrimaryBranch(user: SessionUser | null) {
  const branchRoles = getBranchRoles(user);

  if (branchRoles.length === 0) return "—";

  const first = branchRoles[0];
  return first.branchName || first.branchSlug || first.branchId || "—";
}

function InfoRow({
  label,
  value,
}: {
  label: string;
  value: unknown;
}) {
  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ fontSize: 12, opacity: 0.7 }}>{label}</div>
      <div style={{ fontWeight: 600 }}>{formatValue(value)}</div>
    </div>
  );
}

export default function DashboardPage() {
  const { user, accessToken, refreshToken, isAuthenticated, logout } = useAuth();

  const rawUserPayload = user?.raw ?? user ?? null;

  return (
    <AppLayout title="TBL Dashboard">
      <div className="section">
        <p>
          <strong>Status:</strong>{" "}
          {isAuthenticated ? "Authenticated" : "Not authenticated"}
        </p>
        <p>
          <strong>Profile source:</strong> {getProfileSource(user)}
        </p>
      </div>

      <div
        className="section"
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: 16,
        }}
      >
        <div
          style={{
            border: "1px solid rgba(255,255,255,0.12)",
            borderRadius: 12,
            padding: 16,
          }}
        >
          <h3 style={{ marginTop: 0 }}>Session Overview</h3>
          <InfoRow label="Display Name" value={getDisplayName(user)} />
          <InfoRow label="User ID" value={getUserId(user)} />
          <InfoRow label="Email" value={getEmail(user)} />
          <InfoRow label="Mobile" value={getMobile(user)} />
        </div>

        <div
          style={{
            border: "1px solid rgba(255,255,255,0.12)",
            borderRadius: 12,
            padding: 16,
          }}
        >
          <h3 style={{ marginTop: 0 }}>Access & Scope</h3>
          <InfoRow label="Role" value={getRoleSummary(user)} />
          <InfoRow label="Scope" value={getScopeSummary(user)} />
          <InfoRow label="Primary Restaurant" value={getPrimaryCompany(user)} />
          <InfoRow label="Primary Branch" value={getPrimaryBranch(user)} />
          <InfoRow label="Super Admin" value={user?.isSuperAdmin ?? false} />
          <InfoRow label="Authenticated" value={isAuthenticated} />
        </div>
      </div>

      <div className="section">
        <div className="stack">
          <button className="button" onClick={logout}>
            Logout
          </button>
        </div>
      </div>

      <div className="section">
        <h3 style={{ marginBottom: 12 }}>Backend Debug Area</h3>
        <p style={{ marginTop: 0, opacity: 0.8 }}>
          Keep this visible during backend integration to verify returned tokens
          and payload shape.
        </p>

        <details open style={{ marginBottom: 12 }}>
          <summary style={{ cursor: "pointer", fontWeight: 600 }}>
            Raw normalized user object
          </summary>
          <pre className="pre">{JSON.stringify(user, null, 2) || "null"}</pre>
        </details>

        <details open style={{ marginBottom: 12 }}>
          <summary style={{ cursor: "pointer", fontWeight: 600 }}>
            Raw backend user payload
          </summary>
          <pre className="pre">
            {JSON.stringify(rawUserPayload, null, 2) || "null"}
          </pre>
        </details>

        <details style={{ marginBottom: 12 }}>
          <summary style={{ cursor: "pointer", fontWeight: 600 }}>
            Raw access token
          </summary>
          <pre className="pre">{accessToken || "No token saved yet"}</pre>
        </details>

        <details>
          <summary style={{ cursor: "pointer", fontWeight: 600 }}>
            Raw refresh token
          </summary>
          <pre className="pre">{refreshToken || "No refresh token saved yet"}</pre>
        </details>
      </div>
    </AppLayout>
  );
}
