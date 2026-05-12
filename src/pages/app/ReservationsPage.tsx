import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
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
import { normalizeReservation } from "../../utils/reservations";

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
  const { isBootstrapping } = useAuth();

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
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    const paymentStatus = searchParams.get("payment_status");
    if (!paymentStatus) return;

    if (paymentStatus === "success") {
      setSuccessMessage("Payment successful. Your reservation has been confirmed!");
      setReloadCount((current) => current + 1);
    } else if (paymentStatus === "failed") {
      const message = searchParams.get("message");
      setError(
        message ? `Payment failed: ${message}` : "Payment failed. Please try again."
      );
    } else if (paymentStatus === "error") {
      setError(searchParams.get("message") || "An error occurred during payment verification.");
    } else {
      setSuccessMessage("Payment processed. Check your reservation status.");
    }

    navigate("/reservations", { replace: true });
  }, [navigate, searchParams]);

  useEffect(() => {
    if (isBootstrapping) return;

    let cancelled = false;

    const loadReservations = async () => {
      setLoading(true);
      setError("");

      try {
        const results = [await reservationsService.listMine()];

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

        setReservations(Array.from(uniqueReservations.values()));
        setSelectedReservation((current) =>
          current ? uniqueReservations.get(current.id) ?? null : null
        );
        setSelectedQrReservation((current) =>
          current ? uniqueReservations.get(current.id) ?? null : null
        );
      } catch (nextError: unknown) {
        if (cancelled) return;

        setError(
          nextError instanceof Error ? nextError.message : "Failed to load reservations"
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
  }, [isBootstrapping, reloadCount]);

  const emptyText =
    "No reservations found yet. Pick a restaurant and reserve a table to see it here.";

  return (
    <AppShell title="Reservations">
      <section className="surface">
        <div className="entities-toolbar">
          <div>
            <div className="form-note">
              View: <strong>Your reservations</strong>
            </div>
          </div>

          <div className="entities-toolbar-actions">
            <button className="primary-dark-btn" onClick={() => setCreateOpen(true)}>
              + Reserve Table
            </button>
          </div>
        </div>
      </section>

      <ErrorMessage message={error} />
      <SuccessMessage message={successMessage} />

      <ReservationsTable
        rows={reservations}
        loading={loading || isBootstrapping}
        error=""
        emptyText={emptyText}
        onSelectReservation={setSelectedReservation}
        onOpenQrCode={setSelectedQrReservation}
      />

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
