import type { StaffMember } from "../../types/staff";
import ErrorMessage from "../ErrorMessage";
import RoleBadge from "./RoleBadge";

export default function StaffTable({
  staff,
  loading,
  error,
}: {
  staff: StaffMember[];
  loading: boolean;
  error?: string;
}) {
  if (loading) {
    return <div className="card">Loading staff...</div>;
  }

  if (error) {
    return <ErrorMessage message={error} />;
  }

  if (staff.length === 0) {
    return (
      <div className="card">
        No staff returned yet for this restaurant.
      </div>
    );
  }

  return (
    <div
      style={{
        border: "1px solid rgba(255,255,255,0.12)",
        borderRadius: 16,
        overflow: "hidden",
      }}
    >
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1.2fr 1fr 1fr 1.2fr 0.8fr",
          gap: 12,
          padding: 14,
          background: "rgba(255,255,255,0.06)",
          fontWeight: 700,
        }}
      >
        <div>Name</div>
        <div>Email</div>
        <div>Mobile</div>
        <div>Roles</div>
        <div>Type</div>
      </div>

      {staff.map((member) => {
        const companyRoles = member.companyRoles.map((role) => role.roleName);
        const branchRoles = member.branchRoles.map((role) => role.roleName);
        const allRoles = [...companyRoles, ...branchRoles];

        return (
          <div
            key={member.id}
            style={{
              display: "grid",
              gridTemplateColumns: "1.2fr 1fr 1fr 1.2fr 0.8fr",
              gap: 12,
              padding: 14,
              borderTop: "1px solid rgba(255,255,255,0.08)",
              alignItems: "start",
            }}
          >
            <div>
              <div style={{ fontWeight: 700 }}>{member.displayName}</div>
              <div style={{ opacity: 0.7, fontSize: 12 }}>
                {member.username || member.id}
              </div>
            </div>

            <div>{member.email || "—"}</div>
            <div>{member.mobileE164 || "—"}</div>

            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {allRoles.length === 0 ? (
                <span style={{ opacity: 0.7 }}>No roles</span>
              ) : (
                allRoles.map((roleName, index) => (
                  <RoleBadge key={`${member.id}-${roleName}-${index}`} text={roleName} />
                ))
              )}
            </div>

            <div>{member.isSuperAdmin ? "Super Admin" : "Staff"}</div>
          </div>
        );
      })}
    </div>
  );
}
