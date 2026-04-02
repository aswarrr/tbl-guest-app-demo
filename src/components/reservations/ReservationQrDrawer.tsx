import { useEffect, useState } from "react";
import * as QRCode from "qrcode";
import ErrorMessage from "../ErrorMessage";
import Loader from "../Loader";
import RightDrawer from "../ui/RightDrawer";
import { reservationsService } from "../../services/reservations.service";
import type { ReservationQrToken, ReservationRecord } from "../../types/reservation";
import {
  formatReservationDateTime,
  formatReservationStatus,
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
      <div
        className="info-value"
        style={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}
      >
        {value}
      </div>
    </div>
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
  if (typeof value !== "string") return null;

  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

function normalizeReservationQr(result: unknown): ReservationQrToken | null {
  const record = resolveRecord<Record<string, unknown>>(result);
  const qrId = toText(record?.qrId);
  const reservationId = toText(record?.reservationId);
  const token = toText(record?.token);
  const status = toText(record?.status);

  if (!qrId || !reservationId || !token || !status) {
    return null;
  }

  return {
    qrId,
    reservationId,
    token,
    status,
    expiresAt: toText(record?.expiresAt),
    reservationStatus: toText(record?.reservationStatus),
    customerName: toText(record?.customerName),
    raw: record,
  };
}

type Props = {
  reservation: ReservationRecord | null;
  onClose: () => void;
};

export default function ReservationQrDrawer({ reservation, onClose }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [qrToken, setQrToken] = useState<ReservationQrToken | null>(null);
  const [qrImageSrc, setQrImageSrc] = useState("");

  useEffect(() => {
    if (!reservation) {
      setLoading(false);
      setError("");
      setQrToken(null);
      setQrImageSrc("");
      return;
    }

    let cancelled = false;

    const loadQrToken = async () => {
      setLoading(true);
      setError("");
      setQrToken(null);
      setQrImageSrc("");

      try {
        const result = await reservationsService.getQrToken(reservation.id);
        const nextQrToken = normalizeReservationQr(result);

        if (!nextQrToken) {
          throw new Error("Reservation QR code could not be generated.");
        }

        const imageSrc = await QRCode.toDataURL(nextQrToken.token, {
          errorCorrectionLevel: "M",
          margin: 2,
          width: 320,
          color: {
            dark: "#0f172aff",
            light: "#ffffffff",
          },
        });

        if (cancelled) return;

        setQrToken(nextQrToken);
        setQrImageSrc(imageSrc);
      } catch (nextError: unknown) {
        if (cancelled) return;

        setError(getErrorMessage(nextError, "Failed to load reservation QR code."));
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void loadQrToken();

    return () => {
      cancelled = true;
    };
  }, [reservation]);

  if (!reservation) return null;

  return (
    <RightDrawer
      open={!!reservation}
      onClose={onClose}
      title="Reservation QR Code"
      footer={
        <button className="button button-secondary" type="button" onClick={onClose}>
          Close
        </button>
      }
    >
      <section className="surface-muted">
        <div style={{ display: "grid", gap: 6 }}>
          <div>
            <strong>Guest:</strong>{" "}
            {formatReservationValue(qrToken?.customerName ?? reservation.customerName)}
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

      <ErrorMessage message={error} />
      {loading ? <Loader text="Generating reservation QR code..." /> : null}

      {!loading && qrToken && qrImageSrc ? (
        <>
          <section className="surface-muted reservation-qr-preview">
            <div className="reservation-qr-frame">
              <img
                className="reservation-qr-image"
                src={qrImageSrc}
                alt={`QR code for reservation ${reservation.id}`}
              />
            </div>

            <div className="reservation-qr-note">
              This QR currently encodes the reservation token only. Scanning it does
              not trigger any action yet.
            </div>
          </section>

          <div className="info-grid">
            <DrawerField
              label="QR Status"
              value={formatReservationStatus(qrToken.status)}
            />
            <DrawerField
              label="Reservation Status"
              value={formatReservationStatus(qrToken.reservationStatus)}
            />
            <DrawerField
              label="Expires At"
              value={formatReservationDateTime(qrToken.expiresAt)}
            />
            <DrawerField label="Raw Token" value={qrToken.token} />
            <DrawerField
              label="Reservation ID"
              value={qrToken.reservationId}
            />
          </div>
        </>
      ) : null}
    </RightDrawer>
  );
}
