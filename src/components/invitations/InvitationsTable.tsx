import type { InvitationRow } from "../../types/staff";

export default function InvitationsTable({
  items,
}: {
  items: InvitationRow[];
}) {
  if (items.length === 0) {
    return (
      <div className="card">
        No invitation rows to display yet. Use the Staff page to create one first.
      </div>
    );
  }

  return (
    <div
      style={{
        border: "1px solid rgba(255,255,255,0.12)",
        borderRadius: 16,
        overflow: "hidden",
      }}
    >
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1.2fr 0.8fr 0.8fr 1fr 1fr 0.8fr",
          gap: 12,
          padding: 14,
          background: "rgba(255,255,255,0.06)",
          fontWeight: 700,
        }}
      >
        <div>Destination</div>
        <div>Channel</div>
        <div>Scope Type</div>
        <div>Scope ID</div>
        <div>Role ID</div>
        <div>Status</div>
      </div>

      {items.map((item, index) => (
        <div
          key={`${item.destination}-${item.roleId}-${index}`}
          style={{
            display: "grid",
            gridTemplateColumns: "1.2fr 0.8fr 0.8fr 1fr 1fr 0.8fr",
            gap: 12,
            padding: 14,
            borderTop: "1px solid rgba(255,255,255,0.08)",
          }}
        >
          <div>{item.destination}</div>
          <div>{item.channel}</div>
          <div>{item.scopeType}</div>
          <div>{item.scopeId}</div>
          <div>{item.roleId}</div>
          <div>{item.status || "created"}</div>
        </div>
      ))}
    </div>
  );
}