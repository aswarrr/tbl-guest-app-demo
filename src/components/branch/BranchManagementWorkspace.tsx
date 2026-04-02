import { useCallback, useEffect, useMemo, useState } from "react";
import BranchDrawerForm from "./BranchDrawerForm";
import BranchPhotoManager from "./BranchPhotoManager";
import OpeningHoursEditor from "./OpeningHoursEditor";
import ErrorMessage from "../ErrorMessage";
import Loader from "../Loader";
import SuccessMessage from "../SuccessMessage";
import ReservationsTable from "../reservations/ReservationsTable";
import ReservationDetailsDrawer from "../reservations/ReservationDetailsDrawer";
import FloorplanBuilderHost from "../../features/floorplan/FloorplanBuilderHost";
import { branchesService } from "../../services/branches.service";
import { reservationsService } from "../../services/reservations.service";
import type { Branch, BranchOpeningHour } from "../../types/branch";
import type {
  ReservationApiRecord,
  ReservationRecord,
} from "../../types/reservation";
import { normalizeReservation } from "../../utils/reservations";
import type { BranchProfileRouteState } from "./BranchProfileWorkspace";

type Props = {
  branchId: string;
  routeState?: BranchProfileRouteState | null;
};

type ManageSection =
  | "details"
  | "photos"
  | "hours"
  | "floorplan"
  | "reservations";

function resolveRecord<T>(result: unknown): T | null {
  const data = (result as { data?: unknown } | null)?.data;

  if (data && typeof data === "object" && !Array.isArray(data)) {
    return data as T;
  }

  if (result && typeof result === "object" && !Array.isArray(result)) {
    return result as T;
  }

  return null;
}

function resolveArray<T>(result: unknown): T[] {
  if (Array.isArray(result)) return result as T[];

  if (Array.isArray((result as { data?: unknown } | null)?.data)) {
    return (result as { data: T[] }).data;
  }

  return [];
}

function toText(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

function normalizeOpeningHour(row: Record<string, unknown>): BranchOpeningHour | null {
  const id = toText(row.id);
  const branchId = toText(row.branchId);
  const dayOfWeek =
    typeof row.dayOfWeek === "number"
      ? row.dayOfWeek
      : typeof row.dayOfWeek === "string"
        ? Number(row.dayOfWeek)
        : null;

  if (!id || !branchId || dayOfWeek === null || Number.isNaN(dayOfWeek)) {
    return null;
  }

  return {
    id,
    branchId,
    dayOfWeek,
    openTime: toText(row.openTime),
    closeTime: toText(row.closeTime),
    isClosed: row.isClosed === true,
    createdAt: toText(row.createdAt),
    updatedAt: toText(row.updatedAt),
    raw: row,
  };
}

function normalizeBranch(result: unknown): Branch | null {
  const record = resolveRecord<Record<string, unknown>>(result);
  const id = toText(record?.id);

  if (!id) return null;

  return {
    id,
    companyId: toText(record?.companyId) ?? "",
    companyName: toText(record?.companyName),
    companySlug: toText(record?.companySlug),
    companyLogoUrl: toText(record?.companyLogoUrl),
    name: toText(record?.name) ?? id,
    slug: toText(record?.slug) ?? "",
    addressLine1: toText(record?.addressLine1) ?? "",
    addressLine2: toText(record?.addressLine2),
    area: toText(record?.area),
    city: toText(record?.city) ?? "",
    governorate: toText(record?.governorate),
    postalCode: toText(record?.postalCode),
    landmark: toText(record?.landmark),
    country: toText(record?.country) ?? "",
    latitude: Number(record?.latitude ?? 0),
    longitude: Number(record?.longitude ?? 0),
    phone: toText(record?.phone),
    email: toText(record?.email),
    timezone: toText(record?.timezone),
    status: toText(record?.status),
    about: toText(record?.about),
    placeId: toText(record?.placeId),
    geocodeProvider: toText(record?.geocodeProvider),
    geocodeAccuracy: toText(record?.geocodeAccuracy),
    coverUrl: toText(record?.coverUrl),
    amenitiesMode: toText(record?.amenitiesMode),
    tagsMode: toText(record?.tagsMode),
    createdAt: toText(record?.createdAt) ?? toText(record?.created_at),
    updatedAt: toText(record?.updatedAt) ?? toText(record?.updated_at),
    raw: record,
  };
}

function isConfigured(rows: BranchOpeningHour[]) {
  if (rows.length !== 7) return false;

  const hasValidRows = rows.every((row) => {
    if (row.isClosed) return true;
    return !!row.openTime && !!row.closeTime;
  });

  const hasUserUpdate = rows.some(
    (row) => row.createdAt && row.updatedAt && row.createdAt !== row.updatedAt
  );

  return hasValidRows && hasUserUpdate;
}

function getStatusClass(status?: string | null) {
  const normalized = (status || "").toUpperCase();

  if (normalized === "ACTIVE") return "status-active";
  if (normalized === "PENDING_ADMIN_APPROVAL") return "status-pending-admin";
  if (normalized === "PENDING_PROFILE") return "status-pending-profile";
  if (normalized === "PENDING_KYC") return "status-pending-kyc";
  return "status-generic";
}

function formatStatusLabel(status?: string | null) {
  return (status || "Unknown").replace(/_/g, " ");
}

function buildAddress(branch: Branch | null) {
  if (!branch) return "-";

  const parts = [
    branch.addressLine1,
    branch.addressLine2,
    branch.area,
    branch.city,
    branch.governorate,
    branch.postalCode,
    branch.country,
  ].filter(Boolean);

  return parts.length > 0 ? parts.join(", ") : "-";
}

function buildCoordinates(branch: Branch | null) {
  if (!branch) return "-";
  if (!Number.isFinite(branch.latitude) || !Number.isFinite(branch.longitude)) {
    return "-";
  }
  return `${branch.latitude.toFixed(5)}, ${branch.longitude.toFixed(5)}`;
}

function ManageCard({
  title,
  value,
  description,
  isActive,
  onClick,
}: {
  title: string;
  value: string;
  description: string;
  isActive: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      className={`branch-manage-card ${isActive ? "branch-manage-card-active" : ""}`}
      onClick={onClick}
    >
      <div className="branch-manage-card-label">{title}</div>
      <div className="branch-manage-card-value">{value}</div>
      <div className="branch-manage-card-description">{description}</div>
    </button>
  );
}

function DetailItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="branch-manage-detail-item">
      <div className="branch-manage-detail-label">{label}</div>
      <div className="branch-manage-detail-value">{value || "-"}</div>
    </div>
  );
}

export default function BranchManagementWorkspace({ branchId, routeState }: Props) {
  const [branch, setBranch] = useState<Branch | null>(null);
  const [activeSection, setActiveSection] = useState<ManageSection>("details");
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const [photoCount, setPhotoCount] = useState(0);
  const [hasPublishedFloorplan, setHasPublishedFloorplan] = useState(false);
  const [hasConfiguredOpeningHours, setHasConfiguredOpeningHours] = useState(false);
  const [reservations, setReservations] = useState<ReservationRecord[]>([]);
  const [reservationsLoading, setReservationsLoading] = useState(false);
  const [reservationsError, setReservationsError] = useState("");
  const [selectedReservation, setSelectedReservation] =
    useState<ReservationRecord | null>(null);

  const branchName = branch?.name || routeState?.branchName || branchId;
  const companyName = branch?.companyName || routeState?.companyName || "Restaurant";
  const companyId = branch?.companyId || routeState?.companyId || "";
  const branchStatus = branch?.status || routeState?.branchStatus || "PENDING_PROFILE";

  const refreshBranch = useCallback(async () => {
    const result = await branchesService.getBranch(branchId);
    const nextBranch = normalizeBranch(result);
    setBranch(nextBranch);
    return nextBranch;
  }, [branchId]);

  const refreshPhotoStatus = useCallback(async () => {
    const result = await branchesService.listBranchPhotos(branchId);
    const next = resolveArray<unknown>(result);
    setPhotoCount(next.length);
    return next.length;
  }, [branchId]);

  const refreshPublishedFloorplanStatus = useCallback(async () => {
    try {
      const result = await branchesService.getPublishedFloorplanVersion(branchId);
      const exists = !!result?.data?.id;
      setHasPublishedFloorplan(exists);
      return exists;
    } catch {
      setHasPublishedFloorplan(false);
      return false;
    }
  }, [branchId]);

  const refreshOpeningHoursStatus = useCallback(async () => {
    try {
      const result = await branchesService.getOpeningHours(branchId);
      const rows = resolveArray<Record<string, unknown>>(result)
        .map(normalizeOpeningHour)
        .filter((row): row is BranchOpeningHour => row !== null);

      const configured = isConfigured(rows);
      setHasConfiguredOpeningHours(configured);
      return configured;
    } catch {
      setHasConfiguredOpeningHours(false);
      return false;
    }
  }, [branchId]);

  const refreshReservations = useCallback(async () => {
    setReservationsLoading(true);
    setReservationsError("");

    try {
      const result = await reservationsService.list({
        branchId,
        limit: 500,
        offset: 0,
      });

      const nextReservations = resolveArray<ReservationApiRecord>(result).map(
        normalizeReservation
      );

      setReservations(nextReservations);
      setSelectedReservation((current) =>
        current
          ? nextReservations.find((reservation) => reservation.id === current.id) ?? null
          : null
      );
    } catch (err: unknown) {
      setReservations([]);
      setSelectedReservation(null);
      setReservationsError(getErrorMessage(err, "Failed to load reservations"));
    } finally {
      setReservationsLoading(false);
    }
  }, [branchId]);

  const refreshWorkspace = useCallback(
    async (options?: { initial?: boolean }) => {
      const initial = options?.initial === true;

      if (initial) {
        setLoading(true);
      } else {
        setRefreshing(true);
      }

      setError("");

      try {
        await Promise.all([
          refreshBranch(),
          refreshPhotoStatus(),
          refreshPublishedFloorplanStatus(),
          refreshOpeningHoursStatus(),
          refreshReservations(),
        ]);
      } catch (err: unknown) {
        setError(getErrorMessage(err, "Failed to load branch workspace"));
      } finally {
        if (initial) {
          setLoading(false);
        } else {
          setRefreshing(false);
        }
      }
    },
    [
      refreshBranch,
      refreshOpeningHoursStatus,
      refreshPhotoStatus,
      refreshPublishedFloorplanStatus,
      refreshReservations,
    ]
  );

  useEffect(() => {
    void refreshWorkspace({ initial: true });
  }, [refreshWorkspace]);

  const addressText = useMemo(() => buildAddress(branch), [branch]);
  const coordinatesText = useMemo(() => buildCoordinates(branch), [branch]);
  const detailRows = useMemo(
    () => [
      { label: "Branch Slug", value: branch?.slug || "-" },
      { label: "Restaurant", value: companyName || "-" },
      { label: "Phone", value: branch?.phone || "-" },
      { label: "Email", value: branch?.email || "-" },
      { label: "Timezone", value: branch?.timezone || "-" },
      { label: "Address", value: addressText },
      { label: "Coordinates", value: coordinatesText },
      { label: "Google Place ID", value: branch?.placeId || "-" },
    ],
    [addressText, branch, companyName, coordinatesText]
  );

  const branchSummary = branch?.about || "No branch description has been added yet.";

  return (
    <>
      <section className="surface">
        <div className="branch-manage-hero">
          <div className="branch-manage-hero-copy">
            <div className="branch-manage-eyebrow">Branch Management Workspace</div>
            <div className="branch-manage-title-row">
              <h1 className="branch-manage-title">{branchName}</h1>
              <span className={`table-status-pill ${getStatusClass(branchStatus)}`}>
                {formatStatusLabel(branchStatus)}
              </span>
            </div>
            <div className="branch-manage-subtitle">
              Manage branch details, photos, opening hours, floorplan, and reservations from one place.
            </div>
            <div className="branch-manage-meta">
              <span>Restaurant: {companyName}</span>
              <span>Location: {branch?.city || "-"}</span>
              <span>Timezone: {branch?.timezone || "-"}</span>
            </div>
          </div>

          <div className="branch-manage-hero-actions">
            <button
              type="button"
              className="branch-manage-pill-btn branch-manage-pill-btn-outline"
              onClick={() => {
                setSuccessMessage("");
                void refreshWorkspace();
              }}
              disabled={refreshing}
            >
              {refreshing ? "Refreshing..." : "Refresh Status"}
            </button>

            <button
              type="button"
              className="branch-manage-pill-btn"
              onClick={() => setEditOpen(true)}
              disabled={!companyId}
            >
              Edit Branch Details
            </button>
          </div>

          <div className="branch-manage-card-grid">
            <ManageCard
              title="Branch Details"
              value={branch?.phone || "Profile"}
              description="Review contact info, location, and branch metadata."
              isActive={activeSection === "details"}
              onClick={() => setActiveSection("details")}
            />
            <ManageCard
              title="Branch Photos"
              value={photoCount > 0 ? `${photoCount} uploaded` : "No photos"}
              description="Upload, delete, preview, and reorder gallery images."
              isActive={activeSection === "photos"}
              onClick={() => setActiveSection("photos")}
            />
            <ManageCard
              title="Opening Hours"
              value={hasConfiguredOpeningHours ? "Configured" : "Needs review"}
              description="Set the weekly operating schedule for reservations."
              isActive={activeSection === "hours"}
              onClick={() => setActiveSection("hours")}
            />
            <ManageCard
              title="Floorplan"
              value={hasPublishedFloorplan ? "Published" : "Draft only"}
              description="Open the floorplan builder and publish seating changes."
              isActive={activeSection === "floorplan"}
              onClick={() => setActiveSection("floorplan")}
            />
            <ManageCard
              title="Reservations"
              value={reservations.length > 0 ? String(reservations.length) : "No reservations"}
              description="Review all reservations created for this branch."
              isActive={activeSection === "reservations"}
              onClick={() => setActiveSection("reservations")}
            />
          </div>
        </div>
      </section>

      <ErrorMessage message={error} />
      <SuccessMessage message={successMessage} />
      {loading ? <Loader text="Loading branch workspace..." /> : null}

      {!loading && !branch ? (
        <section className="surface">
          <div style={{ color: "#991b1b", fontWeight: 700 }}>
            Branch details could not be loaded.
          </div>
        </section>
      ) : null}

      {!loading && branch ? (
        <>
          <section className="surface">
            <div className="branch-manage-toolbar">
              <div>
                <div className="branch-manage-section-title">Management Sections</div>
                <div className="branch-manage-section-copy">
                  Switch between profile data, photos, hours, floorplan, and branch reservations.
                </div>
              </div>

              <div className="branch-manage-tab-row">
                <button
                  className={
                    activeSection === "details"
                      ? "branch-manage-tab-btn branch-manage-tab-btn-active"
                      : "branch-manage-tab-btn"
                  }
                  type="button"
                  onClick={() => setActiveSection("details")}
                >
                  Details
                </button>
                <button
                  className={
                    activeSection === "photos"
                      ? "branch-manage-tab-btn branch-manage-tab-btn-active"
                      : "branch-manage-tab-btn"
                  }
                  type="button"
                  onClick={() => setActiveSection("photos")}
                >
                  Photos
                </button>
                <button
                  className={
                    activeSection === "hours"
                      ? "branch-manage-tab-btn branch-manage-tab-btn-active"
                      : "branch-manage-tab-btn"
                  }
                  type="button"
                  onClick={() => setActiveSection("hours")}
                >
                  Opening Hours
                </button>
                <button
                  className={
                    activeSection === "floorplan"
                      ? "branch-manage-tab-btn branch-manage-tab-btn-active"
                      : "branch-manage-tab-btn"
                  }
                  type="button"
                  onClick={() => setActiveSection("floorplan")}
                >
                  Floorplan
                </button>
                <button
                  className={
                    activeSection === "reservations"
                      ? "branch-manage-tab-btn branch-manage-tab-btn-active"
                      : "branch-manage-tab-btn"
                  }
                  type="button"
                  onClick={() => setActiveSection("reservations")}
                >
                  Reservations
                </button>
              </div>
            </div>
          </section>

          {activeSection === "details" ? (
            <section className="surface">
              <div className="branch-manage-details-layout">
                <div className="surface-muted">
                  <div className="branch-manage-panel-header">
                    <div>
                      <div className="branch-manage-section-title">Branch Details</div>
                      <div className="branch-manage-section-copy">
                        This is the operational profile used by managers when maintaining the branch.
                      </div>
                    </div>

                    <button
                      type="button"
                      className="branch-manage-pill-btn"
                      onClick={() => setEditOpen(true)}
                    >
                      Edit Details
                    </button>
                  </div>

                  <div className="branch-manage-detail-grid">
                    {detailRows.map((item) => (
                      <DetailItem key={item.label} label={item.label} value={item.value} />
                    ))}
                  </div>

                  <div className="branch-manage-summary">
                    <div className="branch-manage-detail-label">About This Branch</div>
                    <div className="branch-manage-summary-copy">{branchSummary}</div>
                  </div>
                </div>

                <div className="branch-manage-side-stack">
                  <div className="surface-muted">
                    <div className="branch-manage-section-title">Profile Snapshot</div>
                    <div className="branch-manage-side-copy">
                      Changes to branch details are saved through the same drawer used from the branches list, so the management page stays aligned with your existing admin flow.
                    </div>
                    <div className="branch-manage-side-list">
                      <div>Name and slug stay consistent across the workspace.</div>
                      <div>Address, coordinates, contact info, timezone, and description are editable.</div>
                      <div>Photos, hours, floorplan, and reservations each have dedicated sections.</div>
                    </div>
                  </div>

                  <div className="surface-muted">
                    <div className="branch-manage-section-title">Quick Navigation</div>
                    <div className="branch-manage-quick-actions">
                      <button
                        type="button"
                        className="branch-manage-pill-btn branch-manage-pill-btn-outline"
                        onClick={() => setActiveSection("photos")}
                      >
                        Manage Photos
                      </button>
                      <button
                        type="button"
                        className="branch-manage-pill-btn branch-manage-pill-btn-outline"
                        onClick={() => setActiveSection("hours")}
                      >
                        Edit Hours
                      </button>
                      <button
                        type="button"
                        className="branch-manage-pill-btn branch-manage-pill-btn-outline"
                        onClick={() => setActiveSection("floorplan")}
                      >
                        Open Floorplan
                      </button>
                      <button
                        type="button"
                        className="branch-manage-pill-btn branch-manage-pill-btn-outline"
                        onClick={() => setActiveSection("reservations")}
                      >
                        View Reservations
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          ) : null}

          {activeSection === "photos" ? (
            <>
              <section className="surface">
                <div className="branch-manage-section-title">Branch Photos</div>
                <div className="branch-manage-section-copy">
                  Keep gallery images current for the branch profile and approval flow.
                </div>
              </section>
              <BranchPhotoManager
                branchId={branchId}
                showDebug={false}
                theme="unit"
                onPhotoCountChange={(count) => setPhotoCount(count)}
              />
            </>
          ) : null}

          {activeSection === "hours" ? (
            <OpeningHoursEditor
              branchId={branchId}
              showDebug={false}
              title="Manage Opening Hours"
              description="Update the weekly reservation schedule and save operational changes for this branch."
              saveButtonClassName="branch-manage-pill-btn"
              onConfiguredChange={(configured) => setHasConfiguredOpeningHours(configured)}
            />
          ) : null}

          {activeSection === "floorplan" ? (
            <FloorplanBuilderHost
              branchId={branchId}
              branchName={branchName}
              title="Manage Floorplan"
              description="Open the branch floorplan builder, sync layout updates, and publish seating changes when ready."
            />
          ) : null}

          {activeSection === "reservations" ? (
            <>
              <section className="surface">
                <div className="branch-manage-panel-header">
                  <div>
                    <div className="branch-manage-section-title">Branch Reservations</div>
                    <div className="branch-manage-section-copy">
                      Review every reservation currently scoped to this branch profile.
                    </div>
                  </div>

                  <button
                    type="button"
                    className="branch-manage-pill-btn branch-manage-pill-btn-outline"
                    onClick={() => void refreshReservations()}
                    disabled={reservationsLoading}
                  >
                    {reservationsLoading ? "Refreshing..." : "Refresh Reservations"}
                  </button>
                </div>

                <div className="info-grid" style={{ marginTop: 16 }}>
                  <div className="info-box">
                    <div className="info-label">Branch</div>
                    <div className="info-value">{branchName}</div>
                  </div>
                  <div className="info-box">
                    <div className="info-label">Restaurant</div>
                    <div className="info-value">{companyName}</div>
                  </div>
                  <div className="info-box">
                    <div className="info-label">Reservations</div>
                    <div className="info-value">{reservations.length}</div>
                  </div>
                </div>
              </section>

              <ReservationsTable
                rows={reservations}
                loading={reservationsLoading}
                error={reservationsError}
                emptyText="No reservations found for this branch."
                onSelectReservation={setSelectedReservation}
              />
            </>
          ) : null}
        </>
      ) : null}

      <ReservationDetailsDrawer
        reservation={selectedReservation}
        onClose={() => setSelectedReservation(null)}
      />

      <BranchDrawerForm
        open={editOpen}
        mode="edit"
        companyId={companyId}
        branchId={branchId}
        initialBranch={branch}
        onClose={() => setEditOpen(false)}
        onSaved={(_, message) => {
          setEditOpen(false);
          setSuccessMessage(message);
          void refreshWorkspace();
        }}
      />
    </>
  );
}
