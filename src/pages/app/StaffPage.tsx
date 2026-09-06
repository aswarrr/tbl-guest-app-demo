import { useEffect, useState } from "react";
import AppShell from "../../layouts/AppShell";
import useWorkspace from "../../hooks/useWorkspace";
import { staffService } from "../../services/staff.service";
import type { StaffMember } from "../../types/staff";
import type { BranchRole, CompanyRole } from "../../types/auth";
import StaffTable from "../../components/staff/StaffTable";
import InviteStaffForm from "../../components/staff/InviteStaffForm";
import {
  asApiRecord,
  getErrorMessage,
  readNullableString,
  readString,
  resolveApiArray,
} from "../../utils/apiData";

function normalizeStaffMember(item: unknown): StaffMember {
  const record = asApiRecord(item) ?? {};
  const fullName = `${readString(record.firstName)} ${readString(record.lastName)}`.trim();

  return {
    id: readString(record.id, crypto.randomUUID()),
    displayName:
      fullName ||
      readString(record.username) ||
      readString(record.email) ||
      "Unnamed Staff",
    username: readString(record.username) || undefined,
    email: readNullableString(record.email),
    mobileE164: readNullableString(record.mobileE164),
    isSuperAdmin: record.isSuperAdmin === true,
    companyRoles: Array.isArray(record.companyRoles)
      ? (record.companyRoles as CompanyRole[])
      : [],
    branchRoles: Array.isArray(record.branchRoles)
      ? (record.branchRoles as BranchRole[])
      : [],
    raw: record,
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

        const rows = resolveApiArray<unknown>(result).map(normalizeStaffMember);
        setStaff(rows);
      } catch (err: unknown) {
        setError(getErrorMessage(err, "Failed to load staff"));
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
