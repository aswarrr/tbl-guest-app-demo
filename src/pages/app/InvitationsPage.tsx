import AppShell from "../../layouts/AppShell";
import useWorkspace from "../../hooks/useWorkspace";
import InvitationsTable from "../../components/invitations/InvitationsTable";

export default function InvitationsPage() {
  const { activeCompany, activeBranch, activeScopeType } = useWorkspace();

  return (
    <AppShell title="Invitations">
      <section
        style={{
          border: "1px solid rgba(255,255,255,0.12)",
          borderRadius: 16,
          padding: 16,
          background: "rgba(255,255,255,0.03)",
        }}
      >
        <h3 style={{ marginTop: 0 }}>Invitation Module Shell</h3>
        <p style={{ opacity: 0.8 }}>
          This page is ready for the real list endpoint later. For now, create
          invitations from the Staff page and keep backend proof in the debug area there.
        </p>

        <div style={{ display: "grid", gap: 8 }}>
          <div>
            <strong>Active scope type:</strong> {activeScopeType}
          </div>
          <div>
            <strong>Restaurant:</strong> {activeCompany?.companyName || "-"}
          </div>
          <div>
            <strong>Branch:</strong>{" "}
            {activeBranch?.branchName || activeBranch?.branchSlug || "Restaurant scope"}
          </div>
        </div>
      </section>

      <InvitationsTable items={[]} />
    </AppShell>
  );
}
