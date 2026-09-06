import { useState } from "react";
import useTenant from "../../hooks/useTenant";
import { branchShortName, formatMoney } from "../../white-label/format";

export default function PoliciesPage() {
  const { tenant, branches } = useTenant();
  const [branchId, setBranchId] = useState(branches[0]?.id || "");
  if (!tenant || branches.length === 0) return null;
  const branch = branches.find((item) => item.id === branchId) || branches[0];
  const policy = branch.policies;

  const cards = [
    ["Party size", `${policy.minPartySize ?? 1}–${policy.maxPartySize ?? 20} guests`, "For larger groups, contact the restaurant directly."],
    ["Reservation length", `${policy.minReservationDurationMinutes ?? 60}–${policy.maxReservationDurationMinutes ?? 90} minutes`, `A ${policy.turnTimeMinutes ?? 0}-minute reset is kept between tables.`],
    ["Deposit", formatMoney(policy.depositAmount, policy.depositCurrency), "Your deposit is applied according to the restaurant’s reservation terms."],
    ["Free cancellation", `${policy.freeCancelWindowHours ?? 0} hours before`, "Late cancellations may not qualify for a refund."],
    ["Arrival grace", `${policy.gracePeriodMinutes ?? 0} minutes`, "Please contact the branch if you expect to arrive late."],
    ["Booking cutoff", `${policy.bookingCutoffHours ?? 0} hours`, "Last-minute availability is reflected in the live booking calendar."],
  ];

  return (
    <div className="wl-page">
      <header className="wl-page-hero"><span className="wl-kicker">Before you book</span><h1>Reservation policies.</h1><p>Clear details, so the only surprise is how good dinner is.</p></header>
      <label className="wl-branch-select">Policies for<select value={branch.id} onChange={(event) => setBranchId(event.target.value)}>{branches.map((item) => <option key={item.id} value={item.id}>{branchShortName(item)}</option>)}</select></label>
      <section className="wl-policy-grid">{cards.map(([title, value, copy]) => <article key={title}><span className="wl-kicker">{title}</span><h2>{value}</h2><p>{copy}</p></article>)}</section>
      <section className="wl-policy-note"><h2>Good to know</h2><p>Availability, deposits, and refund eligibility are calculated by the restaurant’s live reservation system when you book. The values above come directly from {branchShortName(branch)}’s current settings.</p></section>
    </div>
  );
}
