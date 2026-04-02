import { useEffect, useMemo, useState } from "react";
import RightDrawer from "../ui/RightDrawer";
import ErrorMessage from "../ErrorMessage";
import Loader from "../Loader";
import { invitationsService } from "../../services/invitations.service";
import { rolesService, type Role } from "../../services/roles.service";

type ScopeType = "COMPANY" | "BRANCH";

type Props = {
  open: boolean;
  onClose: () => void;
  scopeType: ScopeType;
  scopeId: string;
  title: string;
  onSent?: (message: string) => void;
};

function normalizeRoleName(value?: string | null) {
  return (value || "")
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, "_");
}

function resolveTargetRole(roles: Role[], scopeType: ScopeType) {
  const targetName =
    scopeType === "COMPANY" ? "restaurant_manager" : "branch_manager";

  return (
    roles.find((role) => normalizeRoleName(role.name) === targetName) || null
  );
}

export default function InviteStaffDrawer({
  open,
  onClose,
  scopeType,
  scopeId,
  title,
  onSent,
}: Props) {
  const [destination, setDestination] = useState("");
  const [channel, setChannel] = useState<"email" | "sms" | "whatsapp">("email");
  const [resolvedRole, setResolvedRole] = useState<Role | null>(null);

  const [loading, setLoading] = useState(false);
  const [loadingRoles, setLoadingRoles] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;

    setDestination("");
    setChannel("email");
    setResolvedRole(null);
    setError("");
    setLoadingRoles(true);

    void rolesService
      .listRoles()
      .then((result) => {
        const rows = Array.isArray(result?.data) ? result.data : [];
        const matchedRole = resolveTargetRole(rows, scopeType);
        setResolvedRole(matchedRole);

        if (!matchedRole) {
          const expectedLabel =
            scopeType === "COMPANY" ? "restaurant manager" : "branch manager";
          setError(`Could not find role "${expectedLabel}" in /api/roles.`);
        }
      })
      .catch((err: any) => {
        setError(err.message || "Failed to load roles");
      })
      .finally(() => setLoadingRoles(false));
  }, [open, scopeType]);

  const destinationLabel = useMemo(() => {
    if (channel === "email") return "Email Address";
    return "Phone Number";
  }, [channel]);

  const destinationPlaceholder = useMemo(() => {
    if (channel === "email") return "Enter email address";
    return "Enter phone number";
  }, [channel]);

  const destinationInputType = channel === "email" ? "email" : "tel";

  const inviteeLabel =
    scopeType === "COMPANY" ? "Restaurant Manager" : "Branch Manager";

  const handleSend = async () => {
    setError("");

    if (!destination.trim()) {
      setError(`${destinationLabel} is required.`);
      return;
    }

    if (!resolvedRole?.id) {
      setError(`Could not resolve role for ${inviteeLabel}.`);
      return;
    }

    setLoading(true);

    try {
      const result = await invitationsService.create({
        destination: destination.trim(),
        channel,
        scopeType,
        scopeId,
        roleId: resolvedRole.id,
      });

      const message = result?.message || "Invitation sent successfully.";
      onSent?.(message);
      onClose();
    } catch (err: any) {
      setError(err.message || "Failed to send invitation");
    } finally {
      setLoading(false);
    }
  };

  return (
    <RightDrawer
      open={open}
      onClose={onClose}
      title={title}
      footer={
        <>
          <button className="button button-secondary" onClick={onClose} type="button">
            Cancel
          </button>
          <button
            className="primary-dark-btn"
            onClick={() => void handleSend()}
            type="button"
            disabled={loading || loadingRoles || !resolvedRole}
          >
            Send Invitation
          </button>
        </>
      }
    >
      <div className="drawer-form">
        <ErrorMessage message={error} />
        {(loading || loadingRoles) && (
          <Loader text={loadingRoles ? "Loading roles..." : "Sending invitation..."} />
        )}

        <div className="form-note">
          You are inviting a <strong>{inviteeLabel}</strong>.
        </div>

        <div className="form-note">
          Scope Type: <strong>{scopeType}</strong>
          <br />
          Scope ID: <strong>{scopeId}</strong>
          <br />
          Role: <strong>{inviteeLabel}</strong>
          <br />
          Resolved Role ID: <strong>{resolvedRole?.id || "Not found"}</strong>
        </div>

        <div className="form-field">
          <label className="field-label" htmlFor="invite-channel">
            Channel
          </label>
          <select
            id="invite-channel"
            className="input"
            value={channel}
            onChange={(e) => setChannel(e.target.value as "email" | "sms" | "whatsapp")}
          >
            <option value="email">Email</option>
            <option value="sms">SMS</option>
            <option value="whatsapp">Whatsapp</option>
          </select>
        </div>

        <div className="form-field">
          <label className="field-label" htmlFor="invite-destination">
            {destinationLabel}
          </label>
          <input
            id="invite-destination"
            className="input"
            type={destinationInputType}
            placeholder={destinationPlaceholder}
            value={destination}
            onChange={(e) => setDestination(e.target.value)}
          />
        </div>
      </div>
    </RightDrawer>
  );
}