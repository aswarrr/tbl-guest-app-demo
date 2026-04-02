import RightDrawer from "../ui/RightDrawer";
import type { ReservationRecord } from "../../types/reservation";
import {
  formatReservationDateTime,
  formatReservationStatus,
  formatReservationTables,
  formatReservationValue,
} from "../../utils/reservations";

function DrawerField({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="info-box">
      <div className="info-label">{label}</div>
      <div className="info-value" style={{ whiteSpace: "pre-wrap" }}>
        {value}
      </div>
    </div>
  );
}

type Props = {
  reservation: ReservationRecord | null;
  onClose: () => void;
};

export default function ReservationDetailsDrawer({
  reservation,
  onClose,
}: Props) {
  if (!reservation) return null;

  const hasCanceledAt = !!reservation.canceledAt;
  const hasSpecialRequest = !!reservation.specialRequest;
  const hasCancellationReason = !!reservation.cancellationReason;

  return (
    <RightDrawer
      open={!!reservation}
      onClose={onClose}
      title={`Reservation ${reservation.customerName}`}
      footer={
        <button className="button button-secondary" type="button" onClick={onClose}>
          Close
        </button>
      }
    >
      <section className="surface-muted">
        <div style={{ display: "grid", gap: 6 }}>
          <div>
            <strong>Status:</strong> {formatReservationStatus(reservation.status)}
          </div>
          <div>
            <strong>Restaurant:</strong>{" "}
            {formatReservationValue(reservation.companyName)}
          </div>
          <div>
            <strong>Branch:</strong> {formatReservationValue(reservation.branchName)}
          </div>
        </div>
      </section>

      <div className="info-grid">
        <DrawerField label="Customer Name" value={reservation.customerName} />
        <DrawerField
          label="Phone"
          value={formatReservationValue(reservation.customerPhone)}
        />
        <DrawerField
          label="Email"
          value={formatReservationValue(reservation.customerEmail)}
        />
        <DrawerField
          label="Party Size"
          value={formatReservationValue(reservation.partySize)}
        />
        <DrawerField
          label="Table Names"
          value={formatReservationTables(reservation.tableNames)}
        />
        <DrawerField
          label="Start Time"
          value={formatReservationDateTime(reservation.reservationTime)}
        />
        <DrawerField
          label="End Time"
          value={formatReservationDateTime(reservation.endTime)}
        />
        <DrawerField
          label="Duration"
          value={
            reservation.durationMinutes === null
              ? "Not available"
              : `${reservation.durationMinutes} minutes`
          }
        />
        <DrawerField
          label="Created At"
          value={formatReservationDateTime(reservation.createdAt)}
        />
        {hasCanceledAt ? (
          <DrawerField
            label="Canceled At"
            value={formatReservationDateTime(reservation.canceledAt)}
          />
        ) : null}
      </div>

      {hasSpecialRequest ? (
        <section className="surface-muted">
          <div className="info-label">Special Request</div>
          <div className="info-value" style={{ whiteSpace: "pre-wrap" }}>
            {reservation.specialRequest}
          </div>
        </section>
      ) : null}

      {hasCancellationReason ? (
        <section className="surface-muted">
          <div className="info-label">Cancellation Reason</div>
          <div className="info-value" style={{ whiteSpace: "pre-wrap" }}>
            {reservation.cancellationReason}
          </div>
        </section>
      ) : null}
    </RightDrawer>
  );
}
