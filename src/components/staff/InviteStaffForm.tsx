import { useEffect, useMemo, useState, type FormEvent } from "react";
import ErrorMessage from "../ErrorMessage";
import Loader from "../Loader";
import SuccessMessage from "../SuccessMessage";
import useWorkspace from "../../hooks/useWorkspace";
import { invitationsService } from "../../services/invitations.service";

export default function InviteStaffForm() {
  const {
    activeCompanyId,
    activeBranchId,
    activeScopeType,
    activeRoleOptions,
  } = useWorkspace();

  const [form, setForm] = useState({
    destination: "",
    channel: "email" as "email" | "sms" | "whatsapp",
    scopeType: activeScopeType,
    scopeId: activeBranchId || activeCompanyId || "",
    roleId: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [rawResponse, setRawResponse] = useState<unknown>(null);

  const roleOptions = useMemo(() => activeRoleOptions, [activeRoleOptions]);

  useEffect(() => {
    setForm((prev) => ({
      ...prev,
      scopeType: activeBranchId ? "BRANCH" : "COMPANY",
      scopeId: activeBranchId || activeCompanyId || "",
      roleId: prev.roleId || roleOptions[0]?.roleId || "",
    }));
  }, [activeCompanyId, activeBranchId, roleOptions]);

  useEffect(() => {
    setForm((prev) => ({
      ...prev,
      scopeId:
        prev.scopeType === "BRANCH"
          ? activeBranchId || ""
          : activeCompanyId || "",
    }));
  }, [form.scopeType, activeCompanyId, activeBranchId]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setRawResponse(null);

    if (!form.destination) {
      setError("Destination is required");
      return;
    }

    if (!form.scopeId) {
      setError("No scope is available yet");
      return;
    }

    if (!form.roleId) {
      setError("Role ID is required");
      return;
    }

    setLoading(true);

    try {
      const result = await invitationsService.create(form);
      setRawResponse(result);
      setSuccess("Invitation created successfully.");
      setForm((prev) => ({
        ...prev,
        destination: "",
      }));
    } catch (err: any) {
      setError(err.message || "Failed to create invitation");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section
      style={{
        border: "1px solid rgba(255,255,255,0.12)",
        borderRadius: 16,
        padding: 16,
        background: "rgba(255,255,255,0.03)",
      }}
    >
      <h3 style={{ marginTop: 0 }}>Invite Staff</h3>

      <p style={{ opacity: 0.8, marginTop: 0 }}>
        This uses the real invitation endpoint so you can test backend wiring now.
      </p>

      <ErrorMessage message={error} />
      <SuccessMessage message={success} />
      {loading && <Loader text="Creating invitation..." />}

      <form className="stack" onSubmit={handleSubmit}>
        <input
          className="input"
          placeholder="Destination (email, phone, or WhatsApp)"
          value={form.destination}
          onChange={(e) =>
            setForm((prev) => ({ ...prev, destination: e.target.value }))
          }
        />

        <select
          className="input"
          value={form.channel}
          onChange={(e) =>
            setForm((prev) => ({
              ...prev,
              channel: e.target.value as "email" | "sms" | "whatsapp",
            }))
          }
        >
          <option value="email">email</option>
          <option value="sms">sms</option>
          <option value="whatsapp">whatsapp</option>
        </select>

        <select
          className="input"
          value={form.scopeType}
          onChange={(e) =>
            setForm((prev) => ({
              ...prev,
              scopeType: e.target.value as "COMPANY" | "BRANCH",
            }))
          }
        >
          <option value="COMPANY">COMPANY</option>
          <option value="BRANCH" disabled={!activeBranchId}>
            BRANCH
          </option>
        </select>

        <input
          className="input"
          placeholder="Scope ID"
          value={form.scopeId}
          onChange={(e) => setForm((prev) => ({ ...prev, scopeId: e.target.value }))}
        />

        <input
          className="input"
          placeholder="Role ID"
          value={form.roleId}
          onChange={(e) => setForm((prev) => ({ ...prev, roleId: e.target.value }))}
        />

        <button className="button" type="submit" disabled={loading}>
          Send Invitation
        </button>
      </form>

      <div style={{ marginTop: 16 }}>
        <div style={{ fontWeight: 700, marginBottom: 8 }}>Available role IDs</div>

        {roleOptions.length === 0 ? (
          <div style={{ opacity: 0.7 }}>No role IDs resolved from current workspace.</div>
        ) : (
          <div style={{ display: "grid", gap: 6 }}>
            {roleOptions.map((role) => (
              <div
                key={`${role.sourceScope}-${role.roleId}`}
                style={{
                  fontSize: 13,
                  padding: "8px 10px",
                  borderRadius: 10,
                  background: "rgba(255,255,255,0.06)",
                }}
              >
                <strong>{role.roleName}</strong> — {role.roleId} ({role.sourceScope})
              </div>
            ))}
          </div>
        )}
      </div>

      <details style={{ marginTop: 16 }}>
        <summary style={{ cursor: "pointer", fontWeight: 700 }}>
          Raw create invitation response
        </summary>
        <pre className="pre">{JSON.stringify(rawResponse, null, 2) || "null"}</pre>
      </details>
    </section>
  );
}
