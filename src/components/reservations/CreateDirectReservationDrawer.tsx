import { useEffect, useState, type FormEvent } from "react";
import ErrorMessage from "../ErrorMessage";
import Loader from "../Loader";
import RightDrawer from "../ui/RightDrawer";
import { branchesService } from "../../services/branches.service";
import { floorplanService } from "../../services/floorplan.service";
import { paymentsService } from "../../services/payments.service";
import { reservationsService } from "../../services/reservations.service";
import type { BranchOpeningHour, BranchPolicies } from "../../types/branch";
import type {
  FloorplanFloorApiRecord,
  FloorplanTableApiRecord,
  FloorplanVersionApiRecord,
  ManagedBranchRecord,
} from "../../types/floorplan";
import {
  formatPolicyAmount,
  normalizeBranchPolicies,
  parsePolicyAmount,
} from "../../utils/restaurants";

type Props = {
  open: boolean;
  onClose: () => void;
  onSubmitted: (message: string) => void;
  fixedBranch?: ManagedBranchOption | null;
};

type ManagedBranchOption = {
  id: string;
  name: string;
  companyName: string | null;
  status: string | null;
};

type FloorOption = {
  id: string;
  name: string;
  sortOrder: number;
};

type TableOption = {
  id: string;
  label: string;
};

const DAY_NAMES = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
] as const;

type FormState = {
  branchId: string;
  floorId: string;
  partySize: string;
  reservationDate: string;
  startTime: string;
  endTime: string;
};

function createInitialForm(): FormState {
  return {
    branchId: "",
    floorId: "",
    partySize: "2",
    reservationDate: "",
    startTime: "",
    endTime: "",
  };
}

function WalletIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="16"
      height="16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M4.5 7.5A2.5 2.5 0 0 1 7 5h9.5A2.5 2.5 0 0 1 19 7.5v9A2.5 2.5 0 0 1 16.5 19H7A2.5 2.5 0 0 1 4.5 16.5v-9Z" />
      <path d="M4.5 9.5h11.75a2.25 2.25 0 0 1 0 4.5H15" />
      <circle cx="15.75" cy="11.75" r="0.75" fill="currentColor" stroke="none" />
    </svg>
  );
}

function ChevronIcon({ expanded }: { expanded: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className={
        expanded
          ? "restaurant-hours-chevron restaurant-hours-chevron-open"
          : "restaurant-hours-chevron"
      }
      aria-hidden="true"
    >
      <path
        d="m8 10 4 4 4-4"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function toText(value: unknown): string | null {
  if (typeof value !== "string") return null;

  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

function toNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;

  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
}

function toBoolean(value: unknown, fallback: boolean) {
  if (typeof value === "boolean") return value;
  return fallback;
}

function resolveArray<T>(result: unknown): T[] {
  if (Array.isArray(result)) return result as T[];

  if (Array.isArray((result as { data?: unknown } | null)?.data)) {
    return (result as { data: T[] }).data;
  }

  if (Array.isArray((result as { items?: unknown } | null)?.items)) {
    return (result as { items: T[] }).items;
  }

  return [];
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

function normalizeBranch(record: ManagedBranchRecord): ManagedBranchOption | null {
  const id = toText(record.id);
  const name = toText(record.name);

  if (!id || !name) return null;

  return {
    id,
    name,
    companyName: toText(record.companyName),
    status: toText(record.status),
  };
}

function normalizeFloor(record: FloorplanFloorApiRecord): FloorOption | null {
  const id = toText(record.id);
  const name = toText(record.name);

  if (!id || !name) return null;

  return {
    id,
    name,
    sortOrder: toNumber(record.sort_order) ?? toNumber(record.sortOrder) ?? 0,
  };
}

function normalizeTable(record: FloorplanTableApiRecord): TableOption | null {
  const id = toText(record.id);
  const label = toText(record.label);
  const isActive =
    toBoolean(record.is_active, true) && toBoolean(record.isActive, true);
  const isReservable =
    toBoolean(record.is_reservable, true) && toBoolean(record.isReservable, true);

  if (!id || !label || !isActive || !isReservable) {
    return null;
  }

  return { id, label };
}

function normalizeOpeningHour(record: Record<string, unknown>): BranchOpeningHour | null {
  const id = toText(record.id);
  const branchId = toText(record.branchId);
  const dayOfWeek = toNumber(record.dayOfWeek);

  if (!id || !branchId || dayOfWeek === null) {
    return null;
  }

  return {
    id,
    branchId,
    dayOfWeek,
    openTime: toText(record.openTime),
    closeTime: toText(record.closeTime),
    isClosed: toBoolean(record.isClosed, false),
    createdAt: toText(record.createdAt),
    updatedAt: toText(record.updatedAt),
    raw: record,
  };
}

function parseLocalDateTime(dateValue: string, timeValue: string) {
  const [year, month, day] = dateValue.split("-").map(Number);
  const [hours, minutes] = timeValue.split(":").map(Number);

  if (
    !Number.isInteger(year) ||
    !Number.isInteger(month) ||
    !Number.isInteger(day) ||
    !Number.isInteger(hours) ||
    !Number.isInteger(minutes)
  ) {
    return null;
  }

  const parsed = new Date(year, month - 1, day, hours, minutes, 0, 0);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function buildReservationTime(dateValue: string, timeValue: string) {
  const parsed = parseLocalDateTime(dateValue, timeValue);
  return parsed ? parsed.toISOString() : null;
}

function getDurationMinutes(
  dateValue: string,
  startTime: string,
  endTime: string
) {
  const start = parseLocalDateTime(dateValue, startTime);
  const end = parseLocalDateTime(dateValue, endTime);

  if (!start || !end) return null;

  const diffMinutes = Math.round((end.getTime() - start.getTime()) / 60_000);
  return diffMinutes > 0 ? diffMinutes : null;
}

function getErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error) return error.message;
  return fallback;
}

function resolveReservationId(result: unknown) {
  const record = resolveRecord<Record<string, unknown>>(result);
  return toText(record?.reservationId) ?? toText(record?.id);
}

function resolveCheckoutUrl(result: unknown) {
  const record = resolveRecord<Record<string, unknown>>(result);
  return toText(record?.checkoutUrl);
}

function getDayOfWeek(dateValue: string) {
  const [year, month, day] = dateValue.split("-").map(Number);

  if (
    !Number.isInteger(year) ||
    !Number.isInteger(month) ||
    !Number.isInteger(day)
  ) {
    return null;
  }

  const parsed = new Date(year, month - 1, day, 0, 0, 0, 0);
  return Number.isNaN(parsed.getTime()) ? null : parsed.getDay();
}

function formatOpeningTimeLabel(value: string | null) {
  if (!value) return "—";

  const [hourText = "0", minuteText = "00"] = value.split(":");
  const hour = Number(hourText);
  const minute = minuteText.padStart(2, "0");

  if (!Number.isFinite(hour)) return value;

  const suffix = hour >= 12 ? "PM" : "AM";
  const hour12 = hour % 12 || 12;
  return `${hour12}:${minute} ${suffix}`;
}

export default function CreateDirectReservationDrawer({
  open,
  onClose,
  onSubmitted,
  fixedBranch = null,
}: Props) {
  const fixedBranchId = fixedBranch?.id ?? null;
  const fixedBranchName = fixedBranch?.name ?? null;
  const fixedBranchCompanyName = fixedBranch?.companyName ?? null;
  const fixedBranchStatus = fixedBranch?.status ?? null;
  const [form, setForm] = useState<FormState>(createInitialForm);
  const [selectedTableIds, setSelectedTableIds] = useState<string[]>([]);
  const [branches, setBranches] = useState<ManagedBranchOption[]>([]);
  const [floors, setFloors] = useState<FloorOption[]>([]);
  const [tables, setTables] = useState<TableOption[]>([]);
  const [loadingBranches, setLoadingBranches] = useState(false);
  const [loadingOpeningHours, setLoadingOpeningHours] = useState(false);
  const [loadingFloors, setLoadingFloors] = useState(false);
  const [loadingTables, setLoadingTables] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [lookupError, setLookupError] = useState("");
  const [openingHoursError, setOpeningHoursError] = useState("");
  const [openingHours, setOpeningHours] = useState<BranchOpeningHour[]>([]);
  const [policies, setPolicies] = useState<BranchPolicies | null>(null);
  const [loadingPolicies, setLoadingPolicies] = useState(false);
  const [hoursExpanded, setHoursExpanded] = useState(false);

  useEffect(() => {
    if (!open) return;

    let cancelled = false;

    setForm(() => {
      const next = createInitialForm();
      if (fixedBranchId) {
        next.branchId = fixedBranchId;
      }
      return next;
    });
    setSelectedTableIds([]);
    setBranches(
      fixedBranchId
        ? [
            {
              id: fixedBranchId,
              name: fixedBranchName || fixedBranchId,
              companyName: fixedBranchCompanyName,
              status: fixedBranchStatus,
            },
          ]
        : []
    );
    setFloors([]);
    setTables([]);
    setOpeningHours([]);
    setPolicies(null);
    setHoursExpanded(false);
    setError("");
    setLookupError("");
    setOpeningHoursError("");
    setLoadingBranches(!fixedBranchId);

    if (fixedBranchId) {
      return () => {
        cancelled = true;
      };
    }

    void branchesService
      .listManaged()
      .then((result) => {
        if (cancelled) return;

        const nextBranches = resolveArray<ManagedBranchRecord>(result)
          .map(normalizeBranch)
          .filter((branch): branch is ManagedBranchOption => branch !== null);

        setBranches(nextBranches);

        if (nextBranches.length === 0) {
          setLookupError("No branches are available for direct reservations.");
          return;
        }

        if (nextBranches.length === 1) {
          setForm((current) => ({ ...current, branchId: nextBranches[0].id }));
        }
      })
      .catch((nextError: unknown) => {
        if (cancelled) return;
        setLookupError(getErrorMessage(nextError, "Failed to load branches."));
      })
      .finally(() => {
        if (!cancelled) {
          setLoadingBranches(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [fixedBranchCompanyName, fixedBranchId, fixedBranchName, fixedBranchStatus, open]);

  useEffect(() => {
    if (!open) return;

    let cancelled = false;

    setOpeningHours([]);
    setOpeningHoursError("");

    if (!form.branchId) {
      setLoadingOpeningHours(false);
      return;
    }

    setLoadingOpeningHours(true);

    void branchesService
      .getOpeningHours(form.branchId)
      .then((result) => {
        if (cancelled) return;

        const nextHours = resolveArray<Record<string, unknown>>(result)
          .map(normalizeOpeningHour)
          .filter((hour): hour is BranchOpeningHour => hour !== null)
          .sort((left, right) => left.dayOfWeek - right.dayOfWeek);

        setOpeningHours(nextHours);
      })
      .catch((nextError: unknown) => {
        if (cancelled) return;
        setOpeningHoursError(
          getErrorMessage(nextError, "Failed to load opening hours for this branch.")
        );
      })
      .finally(() => {
        if (!cancelled) {
          setLoadingOpeningHours(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [form.branchId, open]);

  useEffect(() => {
    if (!open) return;

    let cancelled = false;

    setPolicies(null);

    if (!form.branchId) {
      setLoadingPolicies(false);
      return;
    }

    setLoadingPolicies(true);

    void branchesService
      .getBranchPolicies(form.branchId)
      .then((result) => {
        if (cancelled) return;

        const nextPolicies = normalizeBranchPolicies(
          ((result as { data?: unknown } | null)?.data ??
            result) as Record<string, unknown> | null
        );

        setPolicies(nextPolicies);
      })
      .catch(() => {
        if (cancelled) return;
        setPolicies(null);
      })
      .finally(() => {
        if (!cancelled) {
          setLoadingPolicies(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [form.branchId, open]);

  useEffect(() => {
    if (!open) return;

    let cancelled = false;

    setFloors([]);
    setTables([]);
    setSelectedTableIds([]);
    setLookupError("");

    if (!form.branchId) {
      setForm((current) =>
        current.floorId ? { ...current, floorId: "" } : current
      );
      return;
    }

    setLoadingFloors(true);

    void branchesService
      .getPublishedFloorplanVersion(form.branchId)
      .then((versionResult) => {
        const version =
          resolveRecord<FloorplanVersionApiRecord>(versionResult);
        const versionId = toText(version?.id);

        if (!versionId) {
          throw new Error("Selected branch does not have a published floorplan.");
        }

        return floorplanService.listVersionFloors(form.branchId, versionId);
      })
      .then((floorsResult) => {
        if (cancelled) return;

        const nextFloors = resolveArray<FloorplanFloorApiRecord>(floorsResult)
          .map(normalizeFloor)
          .filter((floor): floor is FloorOption => floor !== null)
          .sort((left, right) => left.sortOrder - right.sortOrder);

        setFloors(nextFloors);

        if (nextFloors.length === 0) {
          setLookupError("The published floorplan for this branch has no floors.");
          return;
        }

        if (nextFloors.length === 1) {
          setForm((current) => ({ ...current, floorId: nextFloors[0].id }));
          return;
        }

        setForm((current) =>
          current.floorId ? { ...current, floorId: "" } : current
        );
      })
      .catch((nextError: unknown) => {
        if (cancelled) return;
        setLookupError(
          getErrorMessage(
            nextError,
            "Failed to load the published floors for this branch."
          )
        );
      })
      .finally(() => {
        if (!cancelled) {
          setLoadingFloors(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [form.branchId, open]);

  useEffect(() => {
    if (!open) return;

    let cancelled = false;

    setTables([]);
    setSelectedTableIds([]);

    if (!form.branchId || !form.floorId) {
      return;
    }

    setLookupError("");
    setLoadingTables(true);

    void floorplanService
      .listFloorTables(form.branchId, form.floorId)
      .then((tablesResult) => {
        if (cancelled) return;

        const nextTables = resolveArray<FloorplanTableApiRecord>(tablesResult)
          .map(normalizeTable)
          .filter((table): table is TableOption => table !== null)
          .sort((left, right) => left.label.localeCompare(right.label));

        setTables(nextTables);

        if (nextTables.length === 0) {
          setLookupError("The selected floor has no reservable published tables.");
        }
      })
      .catch((nextError: unknown) => {
        if (cancelled) return;
        setLookupError(
          getErrorMessage(nextError, "Failed to load tables for the selected floor.")
        );
      })
      .finally(() => {
        if (!cancelled) {
          setLoadingTables(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [form.branchId, form.floorId, open]);

  const durationMinutes = getDurationMinutes(
    form.reservationDate,
    form.startTime,
    form.endTime
  );
  const selectedTableLabels = tables
    .filter((table) => selectedTableIds.includes(table.id))
    .map((table) => table.label);
  const tableSummary =
    selectedTableLabels.length > 0
      ? selectedTableLabels.join(", ")
      : loadingTables
        ? "Loading tables..."
        : tables.length > 0
          ? "Choose tables"
          : "No tables available";
  const activeBranch = branches.find((branch) => branch.id === form.branchId) ?? null;
  const selectedDayOfWeek = getDayOfWeek(form.reservationDate);
  const loadingText = loadingBranches
    ? "Loading branches..."
    : loadingOpeningHours
      ? "Loading branch opening hours..."
    : loadingFloors
      ? "Loading published floors..."
    : loadingTables
      ? "Loading floor tables..."
      : loadingPolicies
        ? "Loading reservation policies..."
      : submitting
        ? "Preparing payment..."
        : "";
  const depositAmount = parsePolicyAmount(policies?.depositAmount ?? null);
  const depositAmountLabel =
    depositAmount !== null && depositAmount > 0
      ? formatPolicyAmount(policies?.depositAmount ?? null)
      : null;
  const submitLabel = depositAmountLabel
    ? `Proceed to Payment (Deposit ${depositAmountLabel})`
    : "Proceed to Payment";

  const toggleTableSelection = (tableId: string) => {
    setSelectedTableIds((current) =>
      current.includes(tableId)
        ? current.filter((id) => id !== tableId)
        : [...current, tableId]
    );
  };

  const updateField = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");

    const partySize = Number(form.partySize);
    const reservationTime = buildReservationTime(
      form.reservationDate,
      form.startTime
    );

    if (!form.branchId) {
      setError("Branch is required.");
      return;
    }

    if (!Number.isInteger(partySize) || partySize <= 0) {
      setError("Party size must be a whole number greater than zero.");
      return;
    }

    if (!form.reservationDate || !form.startTime || !form.endTime) {
      setError("Reservation date, start time, and end time are required.");
      return;
    }

    if (!reservationTime || durationMinutes === null) {
      setError("End time must be later than start time on the same date.");
      return;
    }

    if (!form.floorId) {
      setError("Published floor is required.");
      return;
    }

    if (selectedTableIds.length === 0) {
      setError("Select at least one table.");
      return;
    }

    setSubmitting(true);

    try {
      const holdResult = await reservationsService.createHold(form.branchId, {
        partySize,
        reservationTime,
        durationMinutes,
        tableIds: selectedTableIds,
      });
      const reservationId = resolveReservationId(holdResult);

      if (!reservationId) {
        throw new Error("Reservation hold was created without a reservation id.");
      }

      const paymentResult = await paymentsService.startSession(reservationId);
      const checkoutUrl = resolveCheckoutUrl(paymentResult);

      if (!checkoutUrl) {
        throw new Error("Payment session was created without a checkout URL.");
      }

      onSubmitted("Reservation hold created. Redirecting to payment...");
      window.location.assign(checkoutUrl);
    } catch (submitError: unknown) {
      setError(
        getErrorMessage(submitError, "Failed to start payment for this reservation.")
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <RightDrawer
      open={open}
      onClose={onClose}
      title="Reserve Table"
      footer={
        <>
          <button className="button button-secondary" onClick={onClose} type="button">
            Cancel
          </button>
          <button
            className="primary-dark-btn"
            form="direct-reservation-form"
            type="submit"
            disabled={submitting || loadingBranches || branches.length === 0}
          >
            <WalletIcon />
            {submitLabel}
          </button>
        </>
      }
    >
      <form
        id="direct-reservation-form"
        className="drawer-form"
        onSubmit={handleSubmit}
      >
        <ErrorMessage message={error || lookupError} />
        {loadingText ? <Loader text={loadingText} /> : null}

        <div className="form-note">
          A temporary hold will be created first, then you will be redirected to payment.
          {activeBranch?.companyName ? (
            <>
              <br />
              Selected restaurant: <strong>{activeBranch.companyName}</strong>
            </>
          ) : null}
          {depositAmountLabel ? (
            <>
              <br />
              Deposit due at payment: <strong>{depositAmountLabel}</strong>
            </>
          ) : null}
        </div>

        {fixedBranch ? (
          <div className="surface-muted reservation-branch-summary">
            <div className="reservation-branch-summary-label">Branch</div>
            <div className="reservation-branch-summary-value">{fixedBranch.name}</div>
            <div className="reservation-branch-summary-copy">
              {fixedBranch.companyName
                ? `Restaurant: ${fixedBranch.companyName}`
                : "This reservation is scoped to the restaurant you opened."}
            </div>
          </div>
        ) : (
          <div className="form-field">
            <label className="field-label" htmlFor="direct-reservation-branch">
              Branch
            </label>
            <select
              id="direct-reservation-branch"
              className="input"
              value={form.branchId}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  branchId: event.target.value,
                  floorId: "",
                }))
              }
              disabled={loadingBranches || branches.length === 0}
            >
              <option value="">
                {branches.length > 1 ? "Choose a branch" : "Select branch"}
              </option>
              {branches.map((branch) => (
                <option key={branch.id} value={branch.id}>
                  {branch.companyName
                    ? `${branch.name} · ${branch.companyName}`
                    : branch.name}
                </option>
              ))}
            </select>
          </div>
        )}

        <section className="surface-muted restaurant-details-section">
          <button
            type="button"
            className="restaurant-hours-toggle"
            onClick={() => setHoursExpanded((current) => !current)}
          >
            <span className="restaurant-details-section-title">Branch Opening Hours</span>
            <ChevronIcon expanded={hoursExpanded} />
          </button>

          {selectedDayOfWeek !== null ? (
            <div className="form-note" style={{ marginTop: -6 }}>
              Reservation day: <strong>{DAY_NAMES[selectedDayOfWeek]}</strong>
            </div>
          ) : null}

          {hoursExpanded ? (
            !form.branchId ? (
              <div style={{ color: "#6b7280" }}>
                Choose a branch to view its weekly schedule.
              </div>
            ) : openingHoursError ? (
              <div style={{ color: "#991b1b" }}>{openingHoursError}</div>
            ) : openingHours.length === 0 ? (
              <div style={{ color: "#6b7280" }}>
                No opening hours are configured for this branch.
              </div>
            ) : (
              <div className="stack" style={{ gap: 0 }}>
                {openingHours.map((row, index) => {
                  const isSelectedDay = row.dayOfWeek === selectedDayOfWeek;

                  return (
                    <div
                      key={row.id}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        gap: 16,
                        padding: "10px 0",
                        borderTop: index === 0 ? "none" : "1px solid #e5e7eb",
                        color: isSelectedDay ? "#111827" : "#4b5563",
                        fontWeight: isSelectedDay ? 700 : 500,
                      }}
                    >
                      <span>{DAY_NAMES[row.dayOfWeek] ?? `Day ${row.dayOfWeek}`}</span>
                      <span>
                        {row.isClosed
                          ? "Closed"
                          : `${formatOpeningTimeLabel(row.openTime)} - ${formatOpeningTimeLabel(row.closeTime)}`}
                      </span>
                    </div>
                  );
                })}
              </div>
            )
          ) : null}
        </section>

        <div className="form-field">
          <label className="field-label" htmlFor="direct-reservation-party-size">
            Party Size
          </label>
          <input
            id="direct-reservation-party-size"
            className="input"
            type="number"
            min="1"
            step="1"
            value={form.partySize}
            onChange={(event) => updateField("partySize", event.target.value)}
            placeholder="2"
          />
        </div>

        <div className="form-grid-2">
          <div className="form-field">
            <label className="field-label" htmlFor="direct-reservation-date">
              Reservation Date
            </label>
            <input
              id="direct-reservation-date"
              className="input"
              type="date"
              value={form.reservationDate}
              onChange={(event) => updateField("reservationDate", event.target.value)}
            />
          </div>

          <div className="form-field">
            <label className="field-label" htmlFor="direct-reservation-floor">
              Published Floor
            </label>
            <select
              id="direct-reservation-floor"
              className="input"
              value={form.floorId}
              onChange={(event) => updateField("floorId", event.target.value)}
              disabled={!form.branchId || loadingFloors || floors.length === 0}
            >
              <option value="">
                {form.branchId ? "Choose a floor" : "Choose a branch first"}
              </option>
              {floors.map((floor) => (
                <option key={floor.id} value={floor.id}>
                  {floor.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="form-grid-2">
          <div className="form-field">
            <label className="field-label" htmlFor="direct-reservation-start-time">
              Start Time
            </label>
            <input
              id="direct-reservation-start-time"
              className="input"
              type="time"
              value={form.startTime}
              onChange={(event) => updateField("startTime", event.target.value)}
            />
          </div>

          <div className="form-field">
            <label className="field-label" htmlFor="direct-reservation-end-time">
              End Time
            </label>
            <input
              id="direct-reservation-end-time"
              className="input"
              type="time"
              value={form.endTime}
              onChange={(event) => updateField("endTime", event.target.value)}
            />
          </div>
        </div>

        <div className="form-note">
          Derived duration:{" "}
          <strong>
            {durationMinutes === null ? "Enter a valid time range" : `${durationMinutes} minutes`}
          </strong>
        </div>

        <div className="form-field">
          <label className="field-label">Tables</label>
          <details className="multi-select">
            <summary className="multi-select-trigger">{tableSummary}</summary>
            <div className="multi-select-menu">
              {tables.map((table) => (
                <label key={table.id} className="multi-select-option">
                  <input
                    type="checkbox"
                    checked={selectedTableIds.includes(table.id)}
                    onChange={() => toggleTableSelection(table.id)}
                  />
                  <span>{table.label}</span>
                </label>
              ))}
            </div>
          </details>
        </div>

      </form>
    </RightDrawer>
  );
}
