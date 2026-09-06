import { Link, useSearchParams } from "react-router-dom";
import useTenant from "../../hooks/useTenant";
import { branchShortName, DAY_NAMES, formatMoney, formatTime } from "../../white-label/format";

export default function LocationsPage() {
  const { tenant, branches } = useTenant();
  const [searchParams, setSearchParams] = useSearchParams();
  if (!tenant || branches.length === 0) return null;
  const selected = branches.find((branch) => branch.id === searchParams.get("branch")) || branches[0];

  return (
    <div className="wl-page">
      <header className="wl-page-hero"><span className="wl-kicker">Across Cairo</span><h1>Find your table.</h1><p>Choose the Sizzler location that fits your plans.</p></header>
      <div className="wl-location-tabs" role="tablist" aria-label="Restaurant branches">
        {branches.map((branch) => <button role="tab" aria-selected={selected.id === branch.id} className={selected.id === branch.id ? "is-active" : ""} key={branch.id} onClick={() => setSearchParams({ branch: branch.id })}>{branchShortName(branch)}</button>)}
      </div>
      <section className="wl-location-detail">
        <div className="wl-location-photo"><img src={selected.photos[0]?.url || selected.coverImageUrl || ""} alt={`${selected.name} restaurant`} /><span className={selected.isOpen ? "is-open" : ""}>{selected.isOpen ? "Open now" : "Currently closed"}</span></div>
        <div className="wl-location-copy">
          <span className="wl-kicker">{selected.cuisineName || tenant.cuisineLabel}</span>
          <h2>{branchShortName(selected)}</h2>
          <p className="wl-lead">{selected.addressSummary}</p>
          <div className="wl-contact-list"><a href={`tel:${selected.phone}`}>{selected.phone}</a>{selected.email ? <a href={`mailto:${selected.email}`}>{selected.email}</a> : null}</div>
          <div className="wl-hours"><h3>Opening hours</h3>{selected.hours.map((hour) => <div key={hour.dayOfWeek}><span>{DAY_NAMES[hour.dayOfWeek]}</span><strong>{hour.isClosed ? "Closed" : `${formatTime(hour.openTime)} – ${formatTime(hour.closeTime)}`}</strong></div>)}</div>
          <p className="wl-deposit-note">Reservations require a {formatMoney(selected.policies.depositAmount, selected.policies.depositCurrency)} deposit per booking.</p>
          <Link className="wl-button" to={`/reserve?branch=${selected.id}`}>Reserve at {branchShortName(selected)}</Link>
        </div>
      </section>
    </div>
  );
}
