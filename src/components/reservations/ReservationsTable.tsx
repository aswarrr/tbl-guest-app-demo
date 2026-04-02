import AdminDataTable, { type AdminTableColumn } from "../ui/AdminDataTable";
import ErrorMessage from "../ErrorMessage";
import Loader from "../Loader";
import type { ReservationRecord } from "../../types/reservation";
import {
  formatReservationDateTime,
  formatReservationStatus,
  formatReservationTables,
  formatReservationValue,
} from "../../utils/reservations";

const AVATAR_COLORS = [
  "#E3F2FD",
  "#FFEBEE",
  "#E8F5E9",
  "#FFF8E1",
  "#F3E5F5",
  "#E0F7FA",
  "#FFF3E0",
  "#FBE9E7",
  "#EDE7F6",
  "#E1F5FE",
];

function getStatusStyles(status: string) {
  switch (status.trim().toUpperCase()) {
    case "CONFIRMED":
      return { background: "#dcfce7", color: "#166534" };
    case "CHECKED_IN":
      return { background: "#dbeafe", color: "#1d4ed8" };
    case "CANCELLED":
      return { background: "#fee2e2", color: "#b91c1c" };
    case "HOLD_EXPIRED":
      return { background: "#fee2e2", color: "#b91c1c" };
    case "NO_SHOW":
      return { background: "#fef3c7", color: "#92400e" };
    case "PENDING":
      return { background: "#ede9fe", color: "#6d28d9" };
    default:
      return { background: "#f3f4f6", color: "#4b5563" };
  }
}

function getInitials(name: string) {
  if (!name.trim()) return "?";

  const parts = name.trim().split(/\s+/);
  const first = parts[0]?.[0] ?? "";
  const second = parts[1]?.[0] ?? parts[0]?.[1] ?? "";

  return (first + second).toUpperCase();
}

function getAvatarColor(seed: string) {
  let hash = 0;

  for (let index = 0; index < seed.length; index += 1) {
    hash = seed.charCodeAt(index) + ((hash << 5) - hash);
  }

  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

function canOpenQrCode(status?: string | null) {
  return (status || "").trim().toUpperCase() === "CONFIRMED";
}

function QrCodeIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className="table-action-icon"
      aria-hidden="true"
    >
      <path
        d="M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4z"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <path
        d="M15 15h2v2h-2zM17 17h3v3h-3zM19 13h1v2h-1zM13 19h2v1h-2zM13 13h1v3h-1z"
        fill="currentColor"
      />
    </svg>
  );
}

type Props = {
  rows: ReservationRecord[];
  loading: boolean;
  error?: string;
  emptyText?: string;
  onSelectReservation: (reservation: ReservationRecord) => void;
  onOpenQrCode?: (reservation: ReservationRecord) => void;
};

export default function ReservationsTable({
  rows,
  loading,
  error,
  emptyText = "No reservations found for your current access scope.",
  onSelectReservation,
  onOpenQrCode,
}: Props) {
  if (loading) {
    return <Loader text="Loading reservations..." />;
  }

  if (error) {
    return <ErrorMessage message={error} />;
  }

  const columns: AdminTableColumn<ReservationRecord>[] = [
    {
      key: "customerName",
      label: "Customer Name",
      minWidth: 180,
      render: (row) => (
        <div className="reservation-customer-cell">
          <div
            className="reservation-customer-avatar"
            style={{ background: getAvatarColor(row.customerName) }}
            aria-hidden="true"
          >
            {getInitials(row.customerName)}
          </div>
          <div className="table-primary-text">{row.customerName}</div>
        </div>
      ),
    },
    {
      key: "customerPhone",
      label: "Phone",
      minWidth: 150,
      render: (row) => formatReservationValue(row.customerPhone),
    },
    {
      key: "customerEmail",
      label: "Email",
      minWidth: 220,
      render: (row) => formatReservationValue(row.customerEmail),
    },
    {
      key: "partySize",
      label: "Party Size",
      minWidth: 110,
      render: (row) => formatReservationValue(row.partySize),
    },
    {
      key: "tables",
      label: "Table Names",
      minWidth: 180,
      render: (row) => formatReservationTables(row.tableNames),
    },
    {
      key: "reservationTime",
      label: "Start Time",
      minWidth: 180,
      render: (row) => formatReservationDateTime(row.reservationTime),
    },
    {
      key: "endTime",
      label: "End Time",
      minWidth: 180,
      render: (row) => formatReservationDateTime(row.endTime),
    },
    {
      key: "status",
      label: "Status",
      minWidth: 130,
      render: (row) => (
        <span className="table-status-pill" style={getStatusStyles(row.status)}>
          {formatReservationStatus(row.status)}
        </span>
      ),
    },
    {
      key: "actions",
      label: "Actions",
      minWidth: 140,
      render: (row) =>
        onOpenQrCode && canOpenQrCode(row.status) ? (
          <button
            type="button"
            className="table-action-btn table-action-btn-inline"
            onClick={(event) => {
              event.stopPropagation();
              onOpenQrCode(row);
            }}
          >
            <QrCodeIcon />
            <span>QR Code</span>
          </button>
        ) : (
          <span className="table-action-placeholder">-</span>
        ),
    },
  ];

  return (
    <AdminDataTable
      rows={rows}
      rowKey={(row) => row.id}
      columns={columns}
      emptyText={emptyText}
      onRowClick={onSelectReservation}
    />
  );
}
