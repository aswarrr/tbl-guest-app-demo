import useAuth from "../hooks/useAuth";
import useWorkspace from "../hooks/useWorkspace";

function getDisplayName(user: any) {
  if (!user) return "Unknown User";

  const fullName = `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim();
  if (fullName) return fullName;

  return user.username ?? user.email ?? user.id ?? "Unknown User";
}

export default function Topbar() {
  const { user, logout } = useAuth();
  const {
    companies,
    branches,
    activeCompanyId,
    activeBranchId,
    setActiveCompanyId,
    setActiveBranchId,
  } = useWorkspace();

  return (
    <header
      style={{
        padding: 16,
        borderBottom: "1px solid rgba(255,255,255,0.08)",
        background: "#111827",
        display: "flex",
        gap: 12,
        alignItems: "center",
        justifyContent: "space-between",
        flexWrap: "wrap",
      }}
    >
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
        <select
          className="input"
          value={activeCompanyId ?? ""}
          onChange={(e) => setActiveCompanyId(e.target.value || null)}
          style={{ minWidth: 240 }}
        >
          {companies.length === 0 && <option value="">No restaurant scope</option>}

          {companies.map((company) => (
            <option key={company.companyId} value={company.companyId}>
              {company.companyName}
            </option>
          ))}
        </select>

        <select
          className="input"
          value={activeBranchId ?? ""}
          onChange={(e) => setActiveBranchId(e.target.value || null)}
          style={{ minWidth: 220 }}
        >
          <option value="">Restaurant scope</option>

          {branches.map((branch) => (
            <option key={branch.branchId} value={branch.branchId}>
              {branch.branchName || branch.branchSlug || branch.branchId}
            </option>
          ))}
        </select>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontWeight: 700 }}>{getDisplayName(user)}</div>
          <div style={{ fontSize: 12, opacity: 0.7 }}>
            {user?.email ?? "No email"}
          </div>
        </div>

        <button className="button" onClick={logout}>
          Logout
        </button>
      </div>
    </header>
  );
}
