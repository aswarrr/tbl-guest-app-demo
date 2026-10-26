import { Link, useSearchParams } from "react-router-dom";
import useTenant from "../../hooks/useTenant";
import useTenantPath from "../../hooks/useTenantPath";
import { branchShortName, DAY_NAMES, formatMoney, formatTime } from "../../white-label/format";

export default function LocationsPage() {
  const { tenant, branches } = useTenant();
  const tenantPath = useTenantPath();
  const [searchParams, setSearchParams] = useSearchParams();
  if (!tenant || branches.length === 0) return null;

  const selected = branches.find((branch) => branch.id === searchParams.get("branch")) || branches[0];
  const heroImage = selected.coverImageUrl || selected.photos[0]?.url;
  const directions = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${selected.name} ${selected.addressSummary}`)}`;

  return (
    <div className="wl-page wl-locations-page">
      <header className={`wl-locations-hero${heroImage ? " has-image" : ""}`} style={heroImage ? { backgroundImage: `linear-gradient(90deg, rgba(12, 10, 8, .78), rgba(12, 10, 8, .22)), url("${heroImage}")` } : undefined}>
        <div className="wl-locations-hero-copy">
          <span className="wl-kicker wl-kicker-light">Our locations</span>
          <h1>Find your table.</h1>
          <p>Choose the {tenant.name} location that fits your plans.</p>
        </div>
        <span className="wl-locations-hero-count">{String(branches.length).padStart(2, "0")} {branches.length === 1 ? "location" : "locations"}</span>
      </header>

      {branches.length > 1 ? (
        <nav className="wl-locations-switcher" aria-label="Choose a location">
          <span className="wl-kicker">Explore our locations</span>
          <div className="wl-locations-switcher-list">
            {branches.map((branch, index) => (
              <button
                type="button"
                aria-current={selected.id === branch.id ? "true" : undefined}
                className={selected.id === branch.id ? "is-active" : ""}
                key={branch.id}
                onClick={() => setSearchParams({ branch: branch.id })}
              >
                <span>{String(index + 1).padStart(2, "0")}</span>
                {branchShortName(branch)}
              </button>
            ))}
          </div>
        </nav>
      ) : null}

      <section className="wl-locations-feature" aria-labelledby="wl-location-name">
        <div className="wl-locations-feature-photo">
          {heroImage ? <img src={heroImage} alt={`${selected.name} restaurant`} /> : <div className="wl-locations-photo-placeholder" aria-hidden="true" />}
          <span className="wl-locations-photo-caption">{selected.isOpen ? "Open now" : "Currently closed"}<span aria-hidden="true"> · </span>{branchShortName(selected)}</span>
        </div>
        <div className="wl-locations-feature-copy">
          {selected.cuisineName ? <span className="wl-kicker">{selected.cuisineName}</span> : <span className="wl-kicker">Your destination</span>}
          <h2 id="wl-location-name">{branchShortName(selected)}</h2>
          <p className="wl-lead">{selected.addressSummary}</p>
          <div className="wl-locations-actions">
            <Link className="wl-button" to={`${tenantPath("reserve")}?branch=${selected.id}`}>Reserve a table</Link>
            <a className="wl-text-link" href={directions} target="_blank" rel="noopener noreferrer">Get directions <span aria-hidden="true">→</span></a>
          </div>
        </div>
      </section>

      <section className="wl-locations-info" aria-label={`${branchShortName(selected)} details`}>
        <div className="wl-locations-info-intro">
          <span className="wl-kicker">Plan your visit</span>
          <h2>Come on in.</h2>
          <p>Everything you need to know before we welcome you.</p>
        </div>
        <div className="wl-locations-info-details">
          <div className="wl-locations-info-block">
            <h3>Find us</h3>
            <p>{selected.addressSummary}</p>
            <a className="wl-text-link" href={directions} target="_blank" rel="noopener noreferrer">View directions <span aria-hidden="true">→</span></a>
          </div>
          <div className="wl-locations-info-block">
            <h3>Get in touch</h3>
            {selected.phone ? <a href={`tel:${selected.phone}`}>{selected.phone}</a> : null}
            {selected.email ? <a href={`mailto:${selected.email}`}>{selected.email}</a> : null}
          </div>
          <div className="wl-locations-info-block wl-locations-hours">
            <h3>Opening hours</h3>
            {selected.hours.map((hour) => (
              <div key={hour.dayOfWeek}><span>{DAY_NAMES[hour.dayOfWeek]}</span><strong>{hour.isClosed ? "Closed" : `${formatTime(hour.openTime)} – ${formatTime(hour.closeTime)}`}</strong></div>
            ))}
          </div>
          <p className="wl-locations-deposit">Reservations require a {formatMoney(selected.policies.depositAmount, selected.policies.depositCurrency)} deposit per booking.</p>
        </div>
      </section>
    </div>
  );
}
