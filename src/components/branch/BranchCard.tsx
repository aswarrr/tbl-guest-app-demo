import { useState } from "react";
import { useNavigate } from "react-router-dom";
import type { Branch } from "../../types/branch";
import useAuth from "../../hooks/useAuth";
import { branchesService } from "../../services/branches.service";
import ErrorMessage from "../ErrorMessage";
import Loader from "../Loader";
import SuccessMessage from "../SuccessMessage";

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

type Props = {
  branch: Branch;
  onRefreshRequested?: () => void;
};

export default function BranchCard({ branch, onRefreshRequested }: Props) {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [rawApproveResponse, setRawApproveResponse] = useState<unknown>(null);

  const isSuperAdmin = !!user?.isSuperAdmin;
  const normalizedStatus = (branch.status || "").toUpperCase();
  const isPendingAdminApproval = normalizedStatus === "PENDING_ADMIN_APPROVAL";
  const needsProfile =
    !!normalizedStatus &&
    normalizedStatus !== "ACTIVE" &&
    normalizedStatus !== "PENDING_ADMIN_APPROVAL";

  const handleApprove = async () => {
    setLoading(true);
    setError("");
    setSuccess("");
    setRawApproveResponse(null);

    try {
      const result = await branchesService.approveBranchProfile(branch.id);
      setRawApproveResponse(result);
      setSuccess(result?.message || "Branch approved and is now active.");
      onRefreshRequested?.();
    } catch (err: any) {
      setError(err.message || "Failed to approve branch");
    } finally {
      setLoading(false);
    }
  };

  const renderActionArea = () => {
    if (isPendingAdminApproval) {
      if (!isSuperAdmin) return null;

      return (
        <button
          className="button"
          onClick={() => void handleApprove()}
          disabled={loading}
        >
          Approve Branch
        </button>
      );
    }

    if (needsProfile) {
      return (
        <button
          className="button"
          onClick={() =>
            navigate(`/branches/${branch.id}/complete-profile`, {
              state: {
                companyId: branch.companyId,
                branchName: branch.name,
                branchStatus: branch.status,
              },
            })
          }
        >
          Complete Profile
        </button>
      );
    }

    return null;
  };

  return (
    <div className="company-card">
      <div className="company-header">
        <div style={{ minWidth: 0 }}>
          <div className="company-name">{branch.name}</div>
          <div className="company-meta">Slug: {branch.slug}</div>
          <div className="company-meta">Branch ID: {branch.id}</div>
        </div>

        <div className="stack" style={{ minWidth: 190 }}>
          {renderActionArea()}

          <div
            style={{
              alignSelf: "flex-start",
              padding: "8px 12px",
              borderRadius: 999,
              background: needsProfile
                ? "#fef3c7"
                : isPendingAdminApproval
                ? "#ede9fe"
                : "#dcfce7",
              color: needsProfile
                ? "#92400e"
                : isPendingAdminApproval
                ? "#6d28d9"
                : "#166534",
              fontWeight: 700,
              fontSize: 13,
            }}
          >
            {isPendingAdminApproval
              ? "PENDING_ADMIN_APPROVAL"
              : needsProfile
              ? `${branch.status} · Complete Profile`
              : branch.status || "—"}
          </div>
        </div>
      </div>

      {error && <ErrorMessage message={error} />}
      <SuccessMessage message={success} />
      {loading && <Loader text="Approving branch..." />}

      {branch.about ? (
        <div className="company-description">{branch.about}</div>
      ) : (
        <div className="company-description">No branch description returned.</div>
      )}

      {branch.coverUrl && (
        <div>
          <div className="info-label" style={{ marginBottom: 8 }}>
            Cover
          </div>
          <img
            src={branch.coverUrl}
            alt={`${branch.name} cover`}
            style={{
              width: "100%",
              maxHeight: 240,
              objectFit: "cover",
              borderRadius: 12,
              border: "1px solid #e5e7eb",
            }}
          />
        </div>
      )}

      <div className="surface-muted">
        <div className="info-grid">
          <InfoRow label="Status" value={branch.status} />
          <InfoRow label="Address Line 1" value={branch.addressLine1} />
          <InfoRow label="City" value={branch.city} />
          <InfoRow label="Country" value={branch.country} />
          <InfoRow label="Latitude" value={branch.latitude} />
          <InfoRow label="Longitude" value={branch.longitude} />
          <InfoRow label="Phone" value={branch.phone} />
          <InfoRow label="Email" value={branch.email} />
          <InfoRow label="Timezone" value={branch.timezone} />
          <InfoRow label="Amenities Mode" value={branch.amenitiesMode} />
          <InfoRow label="Tags Mode" value={branch.tagsMode} />
          <InfoRow label="Created At" value={branch.createdAt} />
          <InfoRow label="Updated At" value={branch.updatedAt} />
        </div>

        {isSuperAdmin && !!rawApproveResponse && (
          <div style={{ marginTop: 12 }}>
            <div style={{ fontWeight: 700, marginBottom: 8, color: "#111827" }}>
              Raw approve response
            </div>
            <pre className="pre" style={{ fontSize: 11 }}>
              {JSON.stringify(rawApproveResponse, null, 2)}
            </pre>
          </div>
        )}

        <div style={{ marginTop: 12 }}>
          <div style={{ fontWeight: 700, marginBottom: 8, color: "#111827" }}>
            Full JSON payload
          </div>
          <pre className="pre" style={{ fontSize: 11 }}>
            {JSON.stringify(branch.raw, null, 2)}
          </pre>
        </div>
      </div>
    </div>
  );
}
