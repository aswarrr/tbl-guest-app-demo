import { useCallback, useEffect, useState } from "react";
import BranchPhotoManager from "./BranchPhotoManager";
import OpeningHoursEditor from "./OpeningHoursEditor";
import FloorplanBuilderHost from "../../features/floorplan/FloorplanBuilderHost";
import ErrorMessage from "../ErrorMessage";
import Loader from "../Loader";
import SuccessMessage from "../SuccessMessage";
import { branchesService } from "../../services/branches.service";
import { companiesService } from "../../services/companies.service";
import type { Branch, BranchOpeningHour } from "../../types/branch";
import type { Company } from "../../types/company";

export type BranchProfileRouteState = {
  companyId?: string;
  companyName?: string;
  branchName?: string;
  branchStatus?: string;
  returnTo?: string;
};

type Props = {
  branchId: string;
  mode: "complete" | "manage";
  routeState?: BranchProfileRouteState | null;
};

const STEPS = [
  { id: 1, title: "Add branch photos" },
  { id: 2, title: "Create Floor Plan" },
  { id: 3, title: "Set Opening Hours" },
] as const;

function StepPill({
  index,
  title,
  state,
  onClick,
}: {
  index: number;
  title: string;
  state: "done" | "active" | "upcoming";
  onClick: () => void;
}) {
  const background =
    state === "done" ? "#dcfce7" : state === "active" ? "#dbeafe" : "#f3f4f6";
  const color =
    state === "done" ? "#166534" : state === "active" ? "#1d4ed8" : "#6b7280";
  const border =
    state === "done" ? "#bbf7d0" : state === "active" ? "#bfdbfe" : "#e5e7eb";

  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        flex: 1,
        minWidth: 180,
        border: `1px solid ${border}`,
        borderRadius: 14,
        background,
        padding: 14,
        textAlign: "left",
        cursor: "pointer",
      }}
    >
      <div
        style={{
          width: 28,
          height: 28,
          borderRadius: 999,
          background: "#ffffff",
          border: `1px solid ${border}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontWeight: 800,
          color,
          marginBottom: 10,
        }}
      >
        {index}
      </div>

      <div style={{ fontWeight: 700, color: "#111827" }}>{title}</div>
      <div style={{ fontSize: 12, color, marginTop: 4 }}>
        {state === "done"
          ? "Completed"
          : state === "active"
            ? "Current step"
            : "Coming next"}
      </div>
    </button>
  );
}

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

function toText(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

function resolveArray<T>(result: unknown): T[] {
  if (Array.isArray(result)) return result as T[];

  if (Array.isArray((result as { data?: unknown } | null)?.data)) {
    return (result as { data: T[] }).data;
  }

  return [];
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
    name: toText(record?.name) ?? id,
    slug: toText(record?.slug) ?? "",
    addressLine1: toText(record?.addressLine1) ?? "",
    city: toText(record?.city) ?? "",
    country: toText(record?.country) ?? "",
    latitude: Number(record?.latitude ?? 0),
    longitude: Number(record?.longitude ?? 0),
    timezone: toText(record?.timezone),
    status: toText(record?.status),
  };
}

function normalizeCompany(result: unknown): Company | null {
  const record = resolveRecord<Record<string, unknown>>(result);
  const id = toText(record?.id);

  if (!id) return null;

  return {
    id,
    name: toText(record?.name) ?? id,
    slug: toText(record?.slug) ?? "",
    status: toText(record?.status),
  };
}

export default function BranchProfileWorkspace({
  branchId,
  mode,
  routeState,
}: Props) {
  const [currentStep, setCurrentStep] = useState(1);
  const [photoCount, setPhotoCount] = useState(0);
  const [hasPublishedFloorplan, setHasPublishedFloorplan] = useState(false);
  const [hasConfiguredOpeningHours, setHasConfiguredOpeningHours] = useState(false);
  const [branchStatus, setBranchStatus] = useState(
    routeState?.branchStatus || "PENDING_PROFILE"
  );
  const [branchName, setBranchName] = useState(routeState?.branchName || branchId);
  const [companyName, setCompanyName] = useState(routeState?.companyName || "Restaurant");

  const [loading, setLoading] = useState(false);
  const [actionMessage, setActionMessage] = useState("");
  const [error, setError] = useState("");

  const isCompleteMode = mode === "complete";

  const refreshPhotoStatus = useCallback(async () => {
    try {
      const result = await branchesService.listBranchPhotos(branchId);
      const rows = resolveArray<unknown>(result);
      setPhotoCount(rows.length);
      return rows.length > 0;
    } catch {
      setPhotoCount(0);
      return false;
    }
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

      const configured =
        rows.length === 7 &&
        rows.every((row) => row.isClosed || (row.openTime && row.closeTime)) &&
        rows.some((row) => row.createdAt && row.updatedAt && row.createdAt !== row.updatedAt);

      setHasConfiguredOpeningHours(configured);
      return configured;
    } catch {
      setHasConfiguredOpeningHours(false);
      return false;
    }
  }, [branchId]);

  useEffect(() => {
    if (!branchId) return;

    let cancelled = false;

    void branchesService
      .getBranch(branchId)
      .then(async (result) => {
        if (cancelled) return;

        const branch = normalizeBranch(result);
        if (!branch) return;

        setBranchName(branch.name);
        setBranchStatus(branch.status || routeState?.branchStatus || "PENDING_PROFILE");
        setCompanyName(routeState?.companyName || branch.companyName || "Restaurant");

        if (!routeState?.companyName && !branch.companyName && branch.companyId) {
          try {
            const companyResult = await companiesService.getCompany(branch.companyId);
            if (cancelled) return;
            const company = normalizeCompany(companyResult);
            if (company?.name) {
              setCompanyName(company.name);
            }
          } catch {
            // Keep route state fallback.
          }
        }
      })
      .catch(() => {
        // Keep route state fallback.
      });

    return () => {
      cancelled = true;
    };
  }, [branchId, routeState?.branchStatus, routeState?.companyName]);

  useEffect(() => {
    if (!branchId) return;
    void refreshPhotoStatus();
    void refreshPublishedFloorplanStatus();
    void refreshOpeningHoursStatus();
  }, [
    branchId,
    refreshOpeningHoursStatus,
    refreshPhotoStatus,
    refreshPublishedFloorplanStatus,
  ]);

  const handleGoToStep1 = () => {
    setError("");
    setActionMessage("");
    setCurrentStep(1);
  };

  const handleGoToStep2 = async () => {
    setError("");
    setActionMessage("");

    if (!isCompleteMode) {
      setCurrentStep(2);
      return;
    }

    const hasPhotos = await refreshPhotoStatus();
    if (!hasPhotos) {
      setError("You cannot proceed to Step 2 until at least one branch photo exists.");
      setCurrentStep(1);
      return;
    }

    setCurrentStep(2);
  };

  const handleGoToStep3 = async () => {
    setError("");
    setActionMessage("");

    if (!isCompleteMode) {
      setCurrentStep(3);
      return;
    }

    const hasPhotos = await refreshPhotoStatus();
    if (!hasPhotos) {
      setError("You cannot proceed to Step 3 until at least one branch photo exists.");
      setCurrentStep(1);
      return;
    }

    const published = await refreshPublishedFloorplanStatus();
    if (!published) {
      setError("You cannot proceed to Step 3 until a published floorplan exists.");
      setCurrentStep(2);
      return;
    }

    setCurrentStep(3);
  };

  const handleSubmit = async () => {
    if (!isCompleteMode) return;

    setError("");
    setActionMessage("");
    setLoading(true);

    try {
      const hasPhotos = await refreshPhotoStatus();
      if (!hasPhotos) {
        setError("Branch profile is missing photos.");
        setCurrentStep(1);
        return;
      }

      const published = await refreshPublishedFloorplanStatus();
      if (!published) {
        setError("Branch profile is missing a published floorplan.");
        setCurrentStep(2);
        return;
      }

      const openingHoursReady = await refreshOpeningHoursStatus();
      if (!openingHoursReady) {
        setError("You must save opening hours before submitting the branch profile.");
        setCurrentStep(3);
        return;
      }

      const result = await branchesService.submitBranchProfile(branchId);
      setBranchStatus(result?.data?.status || "PENDING_ADMIN_APPROVAL");
      setActionMessage(result?.message || "Branch submitted for approval.");
    } catch (err: unknown) {
      setError(getErrorMessage(err, "Failed to submit branch profile"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <section className="surface">
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
            flexWrap: "wrap",
          }}
        >
          <div>
            <div style={{ fontSize: 22, fontWeight: 800, color: "#111827" }}>
              {branchName}
            </div>
            <div style={{ color: "#6b7280" }}>
              {isCompleteMode
                ? "Complete this branch profile and prepare it for admin approval."
                : "Update branch photos, floorplan, and opening hours from the same workspace."}
            </div>
            <div style={{ marginTop: 8, fontSize: 14, color: "#111827" }}>
              <strong>Restaurant:</strong> {companyName}
            </div>
            <div style={{ marginTop: 4, fontSize: 14, color: "#111827" }}>
              <strong>Status:</strong> {branchStatus}
            </div>
            {!isCompleteMode ? (
              <div style={{ marginTop: 8, fontSize: 13, color: "#6b7280" }}>
                Changes inside each step are saved independently.
              </div>
            ) : null}
          </div>

        </div>
      </section>

      <section className="surface">
        <div style={{ marginBottom: 14, fontWeight: 800, color: "#111827" }}>
          {isCompleteMode ? "Branch Profile Completion" : "Branch Profile Workspace"}
        </div>

        <div
          style={{
            display: "flex",
            gap: 12,
            flexWrap: "wrap",
          }}
        >
          <StepPill
            index={1}
            title={STEPS[0].title}
            state={currentStep === 1 ? "active" : currentStep > 1 ? "done" : "upcoming"}
            onClick={handleGoToStep1}
          />
          <StepPill
            index={2}
            title={STEPS[1].title}
            state={currentStep === 2 ? "active" : currentStep > 2 ? "done" : "upcoming"}
            onClick={() => void handleGoToStep2()}
          />
          <StepPill
            index={3}
            title={STEPS[2].title}
            state={currentStep === 3 ? "active" : "upcoming"}
            onClick={() => void handleGoToStep3()}
          />
        </div>

        <div className="info-grid" style={{ marginTop: 16 }}>
          <div className="info-box">
            <div className="info-label">Photos</div>
            <div className="info-value">
              {photoCount > 0 ? `${photoCount} uploaded` : "Required"}
            </div>
          </div>
          <div className="info-box">
            <div className="info-label">Published Floorplan</div>
            <div className="info-value">
              {hasPublishedFloorplan ? "Ready" : "Required"}
            </div>
          </div>
          <div className="info-box">
            <div className="info-label">Opening Hours</div>
            <div className="info-value">
              {hasConfiguredOpeningHours ? "Configured" : "Required"}
            </div>
          </div>
        </div>
      </section>

      <ErrorMessage message={error} />
      <SuccessMessage message={actionMessage} />
      {loading ? <Loader text="Processing..." /> : null}

      {currentStep === 1 ? (
        <section className="surface">
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 20, fontWeight: 800, color: "#111827" }}>
              Step 1: Add Branch Photos
            </div>
            <div style={{ color: "#6b7280", marginTop: 4 }}>
              Add, view, remove, and reorder branch photos.
            </div>
          </div>

          <BranchPhotoManager
            branchId={branchId}
            showDebug={false}
            onPhotoCountChange={(count) => setPhotoCount(count)}
          />

          <div
            style={{
              marginTop: 20,
              display: "flex",
              justifyContent: "flex-end",
            }}
          >
            <button className="button" onClick={() => void handleGoToStep2()}>
              Next
            </button>
          </div>
        </section>
      ) : null}

      {currentStep === 2 ? (
        <section className="surface">
          <FloorplanBuilderHost branchId={branchId} branchName={branchName} />

          <div
            style={{
              marginTop: 20,
              display: "flex",
              justifyContent: "space-between",
              gap: 12,
            }}
          >
            <button className="button button-secondary" onClick={handleGoToStep1}>
              Previous
            </button>

            <button className="button" onClick={() => void handleGoToStep3()}>
              Next
            </button>
          </div>
        </section>
      ) : null}

      {currentStep === 3 ? (
        <section className="surface">
          <OpeningHoursEditor
            branchId={branchId}
            showDebug={false}
            onConfiguredChange={(configured) => setHasConfiguredOpeningHours(configured)}
          />

          <div
            style={{
              marginTop: 20,
              display: "flex",
              justifyContent: "space-between",
              gap: 12,
            }}
          >
            <button className="button button-secondary" onClick={() => void handleGoToStep2()}>
              Previous
            </button>

            <button className="button" onClick={() => void handleSubmit()}>
              Submit
            </button>
          </div>
        </section>
      ) : null}
    </>
  );
}
