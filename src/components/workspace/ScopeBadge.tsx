export default function ScopeBadge({
  text,
  type,
}: {
  text: string;
  type: "COMPANY" | "BRANCH";
}) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        padding: "6px 10px",
        borderRadius: 999,
        fontSize: 12,
        fontWeight: 700,
        background:
          type === "BRANCH" ? "rgba(59,130,246,0.18)" : "rgba(16,185,129,0.18)",
        border:
          type === "BRANCH"
            ? "1px solid rgba(59,130,246,0.35)"
            : "1px solid rgba(16,185,129,0.35)",
      }}
    >
      {text}
    </span>
  );
}