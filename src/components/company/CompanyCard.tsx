import { useState } from "react";
import { useNavigate } from "react-router-dom";
import type { Company } from "../../types/company";
import { invitationsService } from "../../services/invitations.service";
import ErrorMessage from "../ErrorMessage";
import Loader from "../Loader";
import SuccessMessage from "../SuccessMessage";

type Props = {
  company: Company;
  onRefreshRequested: () => void;
};

function InfoRow({
  label,
  value,
}: {
  label: string;
  value: unknown;
}) {
  return (
    <div className="info-box">
      <div className="info-label">{label}</div>
      <div className="info-value">{value ? String(value) : "—"}</div>
    </div>
  );
}

export default function CompanyCard({ company, onRefreshRequested }: Props) {
  const navigate = useNavigate();
  const [expanded, setExpanded] = useState(true);

  const [inviteForm, setInviteForm] = useState({
    destination: "",
    channel: "email" as "email" | "sms" | "whatsapp",
    roleId: "",
  });

  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteError, setInviteError] = useState("");
  const [inviteSuccess, setInviteSuccess] = useState("");
  const [rawInviteResponse, setRawInviteResponse] = useState<unknown>(null);

  const handleInvite = async () => {
    setInviteError("");
    setInviteSuccess("");
    setRawInviteResponse(null);

    if (!inviteForm.destination.trim()) {
      setInviteError("Destination is required");
      return;
    }

    if (!inviteForm.roleId.trim()) {
      setInviteError("Role ID is required");
      return;
    }

    setInviteLoading(true);

    try {
      const result = await invitationsService.create({
        destination: inviteForm.destination.trim(),
        channel: inviteForm.channel,
        scopeType: "COMPANY",
        scopeId: company.id,
        roleId: inviteForm.roleId.trim(),
      });

      setRawInviteResponse(result);
      setInviteSuccess("Invitation sent successfully.");
      setInviteForm((prev) => ({
        ...prev,
        destination: "",
        roleId: "",
      }));

      onRefreshRequested();
    } catch (err: any) {
      setInviteError(err.message || "Failed to send invitation");
    } finally {
      setInviteLoading(false);
    }
  };

  return (
    <div className="company-card">
      <div className="company-header">
        <div style={{ minWidth: 0 }}>
          <div className="company-name">{company.name}</div>
          <div className="company-meta">Slug: {company.slug || "—"}</div>
          <div className="company-meta">ID: {company.id}</div>
        </div>

        <div className="stack" style={{ minWidth: 180 }}>
          <button
            className="button"
            onClick={() =>
              navigate(`/companies/${company.id}/branches`, {
                state: { companyName: company.name },
              })
            }
          >
            View Branches
          </button>

          <button
            className="button button-secondary"
            onClick={() => setExpanded(!expanded)}
          >
            {expanded ? "Collapse" : "View Details"}
          </button>
        </div>
      </div>

      {company.about ? (
        <div className="company-description">{company.about}</div>
      ) : (
        <div className="company-description">No restaurant description returned.</div>
      )}

      {expanded && (
        <div className="surface-muted stack" style={{ marginTop: 8 }}>
          {company.logoUrl && (
            <div>
              <div className="info-label" style={{ marginBottom: 8 }}>
                Logo
              </div>
              <img
                src={company.logoUrl}
                alt={`${company.name} logo`}
                className="logo-preview"
              />
            </div>
          )}

          <div className="info-grid">
            <InfoRow label="UUID" value={company.id} />
            <InfoRow label="Status" value={company.status} />
            <InfoRow label="Currency" value={company.currency} />
            <InfoRow label="Cuisine ID" value={company.cuisineId} />
            <InfoRow label="Email" value={company.email} />
            <InfoRow label="Phone" value={company.phone} />
            <InfoRow label="City" value={company.city} />
            <InfoRow label="Country" value={company.country} />
            <InfoRow label="Timezone" value={company.timezone} />
            <InfoRow label="Created At" value={company.createdAt} />
            <InfoRow label="Updated At" value={company.updatedAt} />
          </div>

          <div className="surface" style={{ marginTop: 8 }}>
            <h3 style={{ marginTop: 0, color: "#111827" }}>Invite Staff</h3>

            <p style={{ color: "#4b5563", marginTop: 0 }}>
              This sends an invitation with:
              <br />
              <strong>Scope Type:</strong> COMPANY
              <br />
              <strong>Scope ID:</strong> {company.id}
            </p>

            <ErrorMessage message={inviteError} />
            <SuccessMessage message={inviteSuccess} />
            {inviteLoading && <Loader text="Sending invitation..." />}

            <div className="stack">
              <input
                className="input"
                placeholder="Destination"
                value={inviteForm.destination}
                onChange={(e) =>
                  setInviteForm((prev) => ({
                    ...prev,
                    destination: e.target.value,
                  }))
                }
              />

              <select
                className="input"
                value={inviteForm.channel}
                onChange={(e) =>
                  setInviteForm((prev) => ({
                    ...prev,
                    channel: e.target.value as "email" | "sms" | "whatsapp",
                  }))
                }
              >
                <option value="email">email</option>
                <option value="sms">sms</option>
                <option value="whatsapp">whatsapp</option>
              </select>

              <input
                className="input"
                placeholder="Role ID"
                value={inviteForm.roleId}
                onChange={(e) =>
                  setInviteForm((prev) => ({
                    ...prev,
                    roleId: e.target.value,
                  }))
                }
              />

              <button
                className="button"
                onClick={handleInvite}
                disabled={inviteLoading}
              >
                Invite Staff
              </button>
            </div>

            <div style={{ marginTop: 12, fontSize: 13, color: "#4b5563" }}>
              Payload preview:
            </div>
            <pre className="pre" style={{ marginTop: 8 }}>
              {JSON.stringify(
                {
                  destination: inviteForm.destination || undefined,
                  channel: inviteForm.channel,
                  scopeType: "COMPANY",
                  scopeId: company.id,
                  roleId: inviteForm.roleId || undefined,
                },
                null,
                2
              )}
            </pre>

            <div style={{ marginTop: 12 }}>
              <div style={{ fontWeight: 700, marginBottom: 8, color: "#111827" }}>
                Raw invite response
              </div>
              <pre className="pre" style={{ fontSize: 11 }}>
                {JSON.stringify(rawInviteResponse, null, 2) || "null"}
              </pre>
            </div>
          </div>

          <div style={{ marginTop: 8 }}>
            <div style={{ fontWeight: 700, marginBottom: 8, color: "#111827" }}>
              Full JSON payload
            </div>
            <pre className="pre" style={{ fontSize: 11 }}>
              {JSON.stringify(company.raw, null, 2)}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}
