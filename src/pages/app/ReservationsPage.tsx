import { useEffect, useMemo, useState } from "react";
import AppShell from "../../layouts/AppShell";
import useAuth from "../../hooks/useAuth";
import ReservationsTable from "../../components/reservations/ReservationsTable";
import CreateDirectReservationDrawer from "../../components/reservations/CreateDirectReservationDrawer";
import ReservationDetailsDrawer from "../../components/reservations/ReservationDetailsDrawer";
import ReservationQrDrawer from "../../components/reservations/ReservationQrDrawer";
import ErrorMessage from "../../components/ErrorMessage";
import SuccessMessage from "../../components/SuccessMessage";
import { reservationsService } from "../../services/reservations.service";
import type { ReservationApiRecord, ReservationRecord } from "../../types/reservation";
import {
  formatReservationAccessMode,
  getReservationAccess,
  normalizeReservation,
} from "../../utils/reservations";

function resolveArray(result: unknown): ReservationApiRecord[] {
  if (Array.isArray(result)) return result as ReservationApiRecord[];
  if (Array.isArray((result as { data?: unknown } | null)?.data)) {
    return (result as { data: ReservationApiRecord[] }).data;
  }
  if (Array.isArray((result as { items?: unknown } | null)?.items)) {
    return (result as { items: ReservationApiRecord[] }).items;
  }
  if (
    Array.isArray((result as { data?: { items?: unknown } } | null)?.data?.items)
  ) {
    return (result as { data: { items: ReservationApiRecord[] } }).data.items;
  }

  return [];
}

export default function ReservationsPage() {
  const { user, isBootstrapping } = useAuth();
  const access = useMemo(() => getReservationAccess(user), [user]);

  const [reservations, setReservations] = useState<ReservationRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [reloadCount, setReloadCount] = useState(0);
  const [selectedReservation, setSelectedReservation] =
    useState<ReservationRecord | null>(null);
  const [selectedQrReservation, setSelectedQrReservation] =
    useState<ReservationRecord | null>(null);

  useEffect(() => {
    if (isBootstrapping) return;

    if (!access.hasAccess) {
      setReservations([]);
      setSelectedReservation(null);
      setSelectedQrReservation(null);
      setLoading(false);
      setError("");
      return;
    }

    let cancelled = false;

    const loadReservations = async () => {
      setLoading(true);
      setError("");

      try {
        const results = await Promise.all(
          access.scopeRequests.map((scope) => reservationsService.list(scope.params))
        );

        if (cancelled) return;

        const uniqueReservations = new Map<string, ReservationRecord>();

        for (const result of results) {
          for (const record of resolveArray(result)) {
            const normalized = normalizeReservation(record);

            if (!uniqueReservations.has(normalized.id)) {
              uniqueReservations.set(normalized.id, normalized);
            }
          }
        }

        const nextReservations = Array.from(uniqueReservations.values());
        setReservations(nextReservations);
        setSelectedReservation((current) =>
          current ? uniqueReservations.get(current.id) ?? null : null
        );
        setSelectedQrReservation((current) =>
          current ? uniqueReservations.get(current.id) ?? null : null
        );
      } catch (err: unknown) {
        if (cancelled) return;

        setError(
          err instanceof Error ? err.message : "Failed to load reservations"
        );
        setReservations([]);
        setSelectedReservation(null);
        setSelectedQrReservation(null);
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void loadReservations();

    return () => {
      cancelled = true;
    };
  }, [access, isBootstrapping, reloadCount]);

  return (
    <AppShell title="Reservations">
      <section className="surface">
        <div className="entities-toolbar">
          <div>
            <div className="form-note">
              Access mode: <strong>{formatReservationAccessMode(access.mode)}</strong>
            </div>
            <div className="form-note">
              Visible scopes: <strong>{access.scopeRequests.length}</strong>
            </div>
          </div>

          {access.hasAccess ? (
            <div className="entities-toolbar-actions">
              <button className="primary-dark-btn" onClick={() => setCreateOpen(true)}>
                + Reserve Table
              </button>
            </div>
          ) : null}
        </div>
      </section>

      <ErrorMessage message={error} />
      <SuccessMessage message={successMessage} />

      {access.hasAccess ? (
        <ReservationsTable
          rows={reservations}
          loading={loading || isBootstrapping}
          error=""
          onSelectReservation={setSelectedReservation}
          onOpenQrCode={setSelectedQrReservation}
        />
      ) : (
        <section className="surface-muted">
          This account does not currently have reservation management access.
        </section>
      )}

      <ReservationDetailsDrawer
        reservation={selectedReservation}
        onClose={() => setSelectedReservation(null)}
      />

      <ReservationQrDrawer
        reservation={selectedQrReservation}
        onClose={() => setSelectedQrReservation(null)}
      />

      <CreateDirectReservationDrawer
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onSubmitted={(message) => {
          setCreateOpen(false);
          setSuccessMessage(message);
          setReloadCount((current) => current + 1);
        }}
      />
    </AppShell>
  );
}
