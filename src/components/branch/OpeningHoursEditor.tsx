import { useEffect, useMemo, useState } from "react";
import ErrorMessage from "../ErrorMessage";
import Loader from "../Loader";
import SuccessMessage from "../SuccessMessage";
import { branchesService } from "../../services/branches.service";
import type { BranchOpeningHour } from "../../types/branch";

const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

function resolveArray(result: any): any[] {
  if (Array.isArray(result)) return result;
  if (Array.isArray(result?.data)) return result.data;
  if (Array.isArray(result?.items)) return result.items;
  return [];
}

function normalizeHour(item: any): BranchOpeningHour {
  return {
    id: item?.id ?? "",
    branchId: item?.branchId ?? "",
    dayOfWeek: Number(item?.dayOfWeek ?? 0),
    openTime: item?.openTime ?? null,
    closeTime: item?.closeTime ?? null,
    isClosed: !!item?.isClosed,
    createdAt: item?.createdAt ?? null,
    updatedAt: item?.updatedAt ?? null,
    raw: item,
  };
}

function toInputTime(value: string | null) {
  if (!value) return "12:00";
  return value.slice(0, 5);
}

function isConfigured(rows: BranchOpeningHour[]) {
  if (rows.length !== 7) return false;

  const hasValidRows = rows.every((row) => {
    if (row.isClosed) return true;
    return !!row.openTime && !!row.closeTime;
  });

  const hasUserUpdate = rows.some(
    (row) =>
      row.createdAt &&
      row.updatedAt &&
      row.createdAt !== row.updatedAt
  );

  return hasValidRows && hasUserUpdate;
}

export default function OpeningHoursEditor({
  branchId,
  onConfiguredChange,
  showDebug = false,
  title = "Step 3: Set Opening Hours",
  description = "Define the weekly schedule for this branch.",
  saveButtonClassName = "button",
}: {
  branchId: string;
  onConfiguredChange?: (configured: boolean) => void;
  showDebug?: boolean;
  title?: string;
  description?: string;
  saveButtonClassName?: string;
}) {
  const [rows, setRows] = useState<BranchOpeningHour[]>([]);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [rawResponse, setRawResponse] = useState<unknown>(null);

  const sortedRows = useMemo(
    () => [...rows].sort((a, b) => a.dayOfWeek - b.dayOfWeek),
    [rows]
  );

  const refreshHours = async () => {
    setInitialLoading(true);
    setError("");

    try {
      const result = await branchesService.getOpeningHours(branchId);
      const next = resolveArray(result).map(normalizeHour);
      setRows(next);
      onConfiguredChange?.(isConfigured(next));
      setRawResponse(result);
    } catch (err: any) {
      setError(err.message || "Failed to load opening hours");
      setRows([]);
      onConfiguredChange?.(false);
    } finally {
      setInitialLoading(false);
    }
  };

  useEffect(() => {
    void refreshHours();
  }, [branchId]);

  const updateRow = (
    dayOfWeek: number,
    patch: Partial<BranchOpeningHour>
  ) => {
    setRows((prev) =>
      prev.map((row) =>
        row.dayOfWeek === dayOfWeek ? { ...row, ...patch } : row
      )
    );
  };

  const handleSave = async () => {
    setLoading(true);
    setError("");
    setSuccess("");
    setRawResponse(null);

    try {
      const payload = {
        hours: sortedRows.map((row) => ({
          dayOfWeek: row.dayOfWeek,
          openTime: row.isClosed ? "00:00" : toInputTime(row.openTime),
          closeTime: row.isClosed ? "00:00" : toInputTime(row.closeTime),
          isClosed: row.isClosed,
        })),
      };

      const result = await branchesService.updateOpeningHours(branchId, payload);
      const next = resolveArray(result).map(normalizeHour);

      setRows(next);
      setRawResponse(result);
      setSuccess("Opening hours updated successfully.");
      onConfiguredChange?.(isConfigured(next));
    } catch (err: any) {
      setError(err.message || "Failed to update opening hours");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="surface">
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 20, fontWeight: 800, color: "#111827" }}>
          {title}
        </div>
        <div style={{ color: "#6b7280", marginTop: 4 }}>
          {description}
        </div>
      </div>

      <ErrorMessage message={error} />
      <SuccessMessage message={success} />
      {(loading || initialLoading) && <Loader text="Loading opening hours..." />}

      <div className="stack">
        {sortedRows.map((row) => (
          <div
            key={row.dayOfWeek}
            className="surface-muted"
            style={{
              display: "grid",
              gridTemplateColumns: "180px 120px 120px auto",
              gap: 12,
              alignItems: "center",
            }}
          >
            <div style={{ fontWeight: 700, color: "#111827" }}>
              {DAY_NAMES[row.dayOfWeek]}
            </div>

            <input
              className="input"
              type="time"
              value={toInputTime(row.openTime)}
              disabled={row.isClosed}
              onChange={(e) =>
                updateRow(row.dayOfWeek, { openTime: e.target.value })
              }
            />

            <input
              className="input"
              type="time"
              value={toInputTime(row.closeTime)}
              disabled={row.isClosed}
              onChange={(e) =>
                updateRow(row.dayOfWeek, { closeTime: e.target.value })
              }
            />

            <label
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                color: "#374151",
              }}
            >
              <input
                type="checkbox"
                checked={row.isClosed}
                onChange={(e) =>
                  updateRow(row.dayOfWeek, { isClosed: e.target.checked })
                }
              />
              Closed
            </label>
          </div>
        ))}
      </div>

      <div style={{ marginTop: 16 }}>
        <button
          className={saveButtonClassName}
          type="button"
          onClick={() => void handleSave()}
          disabled={loading}
        >
          Save Opening Hours
        </button>
      </div>

      {showDebug ? (
        <div style={{ marginTop: 16 }}>
          <div style={{ fontWeight: 700, marginBottom: 8, color: "#111827" }}>
            Raw opening hours response
          </div>
          <pre className="pre">
            {JSON.stringify(rawResponse, null, 2) || "null"}
          </pre>
        </div>
      ) : null}
    </section>
  );
}
