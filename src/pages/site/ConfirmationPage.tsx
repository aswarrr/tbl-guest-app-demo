import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import useTenant from "../../hooks/useTenant";
import { customerService } from "../../white-label/customer.service";
import { formatDate, formatMoney, formatTime } from "../../white-label/format";
import type { CustomerReservation } from "../../white-label/types";

function escapeIcs(value: string) {
  return value.replace(/\\/g, "\\\\").replace(/,/g, "\\,").replace(/;/g, "\\;").replace(/\n/g, "\\n");
}

function toCalendarDate(reservation: CustomerReservation) {
  const date = reservation.reservationDateLocal?.replace(/-/g, "") || "";
  const time = reservation.reservationTimeLocal?.replace(/:/g, "").slice(0, 4) || "1200";
  const end = new Date(`${reservation.reservationDateLocal}T${reservation.reservationTimeLocal || "12:00"}:00`);
  end.setMinutes(end.getMinutes() + reservation.durationMinutes);
  const endText = `${end.getFullYear()}${String(end.getMonth() + 1).padStart(2, "0")}${String(end.getDate()).padStart(2, "0")}T${String(end.getHours()).padStart(2, "0")}${String(end.getMinutes()).padStart(2, "0")}00`;
  return { start: `${date}T${time}00`, end: endText };
}

export default function ConfirmationPage() {
  const { reservationId = "" } = useParams();
  const location = useLocation();
  const { tenant } = useTenant();
  const stateReservation = (location.state as { reservation?: CustomerReservation } | null)?.reservation;
  const [reservation, setReservation] = useState<CustomerReservation | null>(() => {
    if (stateReservation) return stateReservation;
    try { return JSON.parse(sessionStorage.getItem(`tbl.confirmation:${reservationId}`) || "null") as CustomerReservation | null; } catch { return null; }
  });
  const [error, setError] = useState("");

  useEffect(() => {
    if (reservation || !reservationId) return;
    void customerService.getReservation(reservationId).then(setReservation).catch((nextError: unknown) => setError(nextError instanceof Error ? nextError.message : "Could not load the reservation."));
  }, [reservation, reservationId]);

  const calendarHref = useMemo(() => {
    if (!reservation?.reservationDateLocal) return "";
    const dates = toCalendarDate(reservation);
    const ics = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//The TBL//Restaurant Reservation//EN", "BEGIN:VEVENT", `UID:${reservation.id}@thetbl`, `DTSTART:${dates.start}`, `DTEND:${dates.end}`, `SUMMARY:${escapeIcs(`${reservation.branchName} reservation`)}`, `DESCRIPTION:${escapeIcs(`Table ${reservation.tableLabels?.join(", ") || "reserved"} · ${reservation.partySize} guests`)}`, "END:VEVENT", "END:VCALENDAR"].join("\r\n");
    return `data:text/calendar;charset=utf-8,${encodeURIComponent(ics)}`;
  }, [reservation]);

  if (!tenant) return null;
  if (!reservation) return <div className="wl-state-page">{error ? <><h1>Reservation unavailable</h1><p>{error}</p></> : <p>Loading your reservation…</p>}</div>;

  const directions = reservation.branchLatitude != null && reservation.branchLongitude != null ? `https://www.google.com/maps/dir/?api=1&destination=${reservation.branchLatitude},${reservation.branchLongitude}` : "";

  return (
    <div className="wl-confirmation-page">
      <div className="wl-confirmation-mark" aria-hidden="true">✓</div>
      <span className="wl-kicker">Reservation confirmed</span>
      <h1>Your table is ready.</h1>
      <p className="wl-lead">We look forward to welcoming you to {reservation.branchName}.</p>
      <section className="wl-confirmation-card">
        <header><span>Confirmation</span><strong>#{reservation.refNumber || reservation.id.slice(0, 8).toUpperCase()}</strong></header>
        <div className="wl-confirmation-grid">
          <div><span>Restaurant</span><strong>{reservation.branchName}</strong></div>
          <div><span>Date</span><strong>{reservation.reservationDateLocal ? formatDate(reservation.reservationDateLocal) : "Confirmed"}</strong></div>
          <div><span>Time</span><strong>{formatTime(reservation.reservationTimeLocal)}</strong></div>
          <div><span>Party</span><strong>{reservation.partySize} guests</strong></div>
          <div><span>Table</span><strong>{reservation.tableLabels?.join(", ") || "Assigned table"}</strong></div>
          <div><span>Deposit</span><strong>{formatMoney(reservation.depositAmount, reservation.depositCurrency || tenant.currency)} paid</strong></div>
        </div>
      </section>
      <div className="wl-actions wl-confirmation-actions">
        {calendarHref ? <a className="wl-button" href={calendarHref} download={`${tenant.shortName}-reservation.ics`}>Add to calendar</a> : null}
        {directions ? <a className="wl-button wl-button-outline" href={directions} target="_blank" rel="noreferrer">Get directions</a> : null}
        <Link className="wl-text-link" to="/">Back to home</Link>
      </div>
    </div>
  );
}
