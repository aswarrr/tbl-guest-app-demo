import type { ReactNode } from "react";
import { usePresentation } from "./presentation";
import { useMedia } from "./media";
import type { RestaurantBranchDetail } from "./contract";
import { branchShortName } from "../white-label/format";
export function ReservationLocations({
  branches,
  branchId,
  chooseBranch,
}: {
  branches: RestaurantBranchDetail[];
  branchId: string;
  chooseBranch: (id: string) => void;
}) {
  return (
    <div>
      <span className="wl-kicker">Step 1</span>
      <h2>Choose a location</h2>
      <div className="wl-branch-options">
        {branches.map((item) => (
          <button
            className={branchId === item.id ? "is-selected" : ""}
            type="button"
            key={item.id}
            onClick={() => chooseBranch(item.id)}
          >
            {item.coverImageUrl && <img src={item.coverImageUrl} alt="" />}
            <span>
              <strong>{branchShortName(item)}</strong>
              <small>{item.addressSummary}</small>
            </span>
            <i aria-hidden="true">✓</i>
          </button>
        ))}
      </div>
    </div>
  );
}
export function ReservationFrame({
  step,
  summary,
  children,
}: {
  step: number;
  summary: ReactNode;
  children: ReactNode;
}) {
  const { config } = usePresentation();
  const media = useMedia();
  const r = config?.pages.reserve;
  const url = r ? media(r.image) : undefined;
  return (
    <div
      className={`wl-reserve-page ws-background-${r?.background || "paper"} ws-summary-${r?.summaryStyle || "outlined"}`}
      style={
        r?.background === "image" && url
          ? { backgroundImage: `linear-gradient(#fff9,#fff9),url("${url}")` }
          : undefined
      }
    >
      <header className="wl-reserve-header">
        <span className="wl-kicker">Reservations</span>
        <h1>{r?.heading || "Find your table."}</h1>
        <p>{r?.supportingCopy || "Live availability across our locations."}</p>
        {r && <span className="ws-booking-badge">Booking flow managed by TBL</span>}
      </header>
      <ol className="wl-progress">
        {["Branch", "Date & time", "Your table", "Review"].map(
          (label, index) => (
            <li className={step >= index + 1 ? "is-active" : ""} key={label}>
              <span>{index + 1}</span>
              {label}
            </li>
          ),
        )}
      </ol>
      <div className="wl-booking-layout">
        <section className="wl-booking-panel">{children}</section>
        <aside className="wl-booking-summary">{summary}</aside>
      </div>
    </div>
  );
}
