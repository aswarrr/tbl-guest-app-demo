import { useEffect, useState } from "react";
import AppShell from "../../layouts/AppShell";
import useWorkspace from "../../hooks/useWorkspace";
import { staffService } from "../../services/staff.service";
import type { StaffMember } from "../../types/staff";
import StaffTable from "../../components/staff/StaffTable";
import InviteStaffForm from "../../components/staff/InviteStaffForm";

function resolveArray(result: any): any[] {
  if (Array.isArray(result)) return result;
  if (Array.isArray(result?.data)) return result.data;
  if (Array.isArray(result?.items)) return result.items;
  if (Array.isArray(result?.data?.items)) return result.data.items;
  return [];
}

function normalizeStaffMember(item: any): StaffMember {
  const fullName = `${item?.firstName ?? ""} ${item?.lastName ?? ""}`.trim();

  return {
    id: item?.id ?? crypto.randomUUID(),
    displayName: fullName || item?.username || item?.email || "Unnamed Staff",
    username: item?.username,
    email: item?.email ?? null,
    mobileE164: item?.mobileE164 ?? null,
    isSuperAdmin: !!item?.isSuperAdmin,
    companyRoles: Array.isArray(item?.companyRoles) ? item.companyRoles : [],
    branchRoles: Array.isArray(item?.branchRoles) ? item.branchRoles : [],
    raw: item,
  };
}

export default function StaffPage() {
  const { activeCompanyId, activeCompany } = useWorkspace();

  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [rawResponse, setRawResponse] = useState<unknown>(null);

  useEffect(() => {
    const run = async () => {
      if (!activeCompanyId) {
        setStaff([]);
        return;
      }

      setLoading(true);
      setError("");

      try {
        const result = await staffService.listCompanyStaff(activeCompanyId);
        setRawResponse(result);

        const rows = resolveArray(result).map(normalizeStaffMember);
        setStaff(rows);
      } catch (err: any) {
        setError(err.message || "Failed to load staff");
        setStaff([]);
      } finally {
        setLoading(false);
      }
    };

    void run();
  }, [activeCompanyId]);

  return (
    <AppShell title="Staff">
      <section
        style={{
          border: "1px solid rgba(255,255,255,0.12)",
          borderRadius: 16,
          padding: 16,
          background: "rgba(255,255,255,0.03)",
        }}
      >
        <div style={{ fontWeight: 800, marginBottom: 8 }}>
          Active Restaurant
        </div>
        <div>{activeCompany?.companyName || "No restaurant selected"}</div>
      </section>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1.2fr 0.8fr",
          gap: 16,
        }}
      >
        <div>
          <StaffTable staff={staff} loading={loading} error={error} />

          <details style={{ marginTop: 16 }}>
            <summary style={{ cursor: "pointer", fontWeight: 700 }}>
              Raw staff list response
            </summary>
            <pre className="pre">
              {JSON.stringify(rawResponse, null, 2) || "null"}
            </pre>
          </details>
        </div>

        <InviteStaffForm />
      </div>
    </AppShell>
  );
}
