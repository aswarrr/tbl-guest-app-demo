import useWorkspace from "../../hooks/useWorkspace";
import ScopeBadge from "./ScopeBadge";
import RoleBadge from "../staff/RoleBadge";

export default function WorkspaceSummaryCard() {
  const {
    activeCompany,
    activeBranch,
    activeScopeType,
    activeRoleOptions,
    companies,
    branches,
  } = useWorkspace();

  return (
    <section className="surface">
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          gap: 12,
          flexWrap: "wrap",
          marginBottom: 16,
        }}
      >
        <div>
          <h3 style={{ margin: 0 }}>Active Workspace</h3>
          <div style={{ marginTop: 8 }}>
            <ScopeBadge
              type={activeScopeType}
              text={
                activeScopeType === "BRANCH"
                  ? `Branch: ${
                      activeBranch?.branchName ||
                      activeBranch?.branchSlug ||
                      activeBranch?.branchId ||
                      "Unknown"
                    }`
                  : `Restaurant: ${
                      activeCompany?.companyName || "No restaurant selected"
                    }`
              }
            />
          </div>
        </div>

        <div style={{ opacity: 0.8, fontSize: 14 }}>
          {companies.length} restaurant{companies.length === 1 ? "" : "s"} /{" "}
          {branches.length} branch{branches.length === 1 ? "" : "es"}
        </div>
      </div>

      <div style={{ display: "grid", gap: 8, marginBottom: 16 }}>
        <div>
          <strong>Restaurant:</strong> {activeCompany?.companyName || "-"}
        </div>
        <div>
          <strong>Branch:</strong>{" "}
          {activeBranch?.branchName || activeBranch?.branchSlug || "Restaurant scope"}
        </div>
      </div>

      <div>
        <div style={{ marginBottom: 8, fontWeight: 700 }}>Available Roles</div>

        {activeRoleOptions.length === 0 ? (
          <div style={{ opacity: 0.7 }}>No role options resolved yet.</div>
        ) : (
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {activeRoleOptions.map((role) => (
              <RoleBadge
                key={`${role.sourceScope}-${role.roleId}`}
                text={`${role.roleName} (${role.sourceScope})`}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
