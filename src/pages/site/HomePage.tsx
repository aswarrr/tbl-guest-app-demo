import { Link } from "react-router-dom";
import useTenant from "../../hooks/useTenant";
import useTenantPath from "../../hooks/useTenantPath";
import { branchShortName, formatMoney } from "../../white-label/format";

export default function HomePage() {
  const { tenant, branches, menu } = useTenant();
  const tenantPath = useTenantPath();
  if (!tenant || branches.length === 0) return null;

  const primary = branches[0];
  const hero = primary.photos[0]?.url || primary.coverImageUrl || "";
  const gallery = branches.flatMap((branch) => branch.photos).slice(1, 4);
  const featuredItems = (menu?.sections ?? [])
    .flatMap((section) => section.items)
    .filter((item) => item.available)
    .slice(0, 3);

  const locationCount = branches.length;
  const locationLabel = `${locationCount} ${locationCount === 1 ? "location" : "locations"}`;
  const cuisine = primary.cuisineName;

  return (
    <>
      <section className="wl-hero" style={{ backgroundImage: `linear-gradient(90deg, rgba(12,10,8,.76), rgba(12,10,8,.12)), url(${hero})` }}>
        <div className="wl-hero-copy">
          {cuisine ? <span className="wl-kicker wl-kicker-light">{cuisine}</span> : null}
          <h1>{tenant.name}</h1>
          <p>Choose your location, your time, and the table that feels right.</p>
          <div className="wl-actions">
            <Link className="wl-button" to={tenantPath("reserve")}>Reserve a table</Link>
            {menu ? (
              <Link className="wl-text-link wl-text-link-light" to={tenantPath("menu")}>Explore the menu <span aria-hidden="true">→</span></Link>
            ) : null}
          </div>
        </div>
        <div className="wl-hero-note"><span>Open for reservations</span><strong>{locationLabel}</strong></div>
      </section>

      {primary.about ? (
        <section className="wl-section wl-intro-grid">
          <div>
            <span className="wl-kicker">Our story</span>
            <h2>About {tenant.name}.</h2>
          </div>
          <div>
            <p className="wl-lead">{tenant.about || primary.about}</p>
            <Link className="wl-text-link" to={tenantPath("about")}>Discover our story <span aria-hidden="true">→</span></Link>
          </div>
        </section>
      ) : null}

      <section className="wl-section wl-section-paper">
        <div className="wl-section-heading">
          <div><span className="wl-kicker">Our locations</span><h2>{locationLabel}, one warm welcome.</h2></div>
          <Link className="wl-text-link" to={tenantPath("locations")}>View all locations <span aria-hidden="true">→</span></Link>
        </div>
        <div className="wl-location-grid">
          {branches.map((branch) => (
            <article className="wl-location-card" key={branch.id}>
              <img src={branch.coverImageUrl || branch.photos[0]?.url} alt={`${branch.name} dining room`} />
              <div className="wl-location-card-copy">
                <div className="wl-card-meta"><span className={branch.isOpen ? "is-open" : ""}>{branch.isOpen ? "Open now" : "Currently closed"}</span>{branch.cuisineName ? <span>{branch.cuisineName}</span> : null}</div>
                <h3>{branchShortName(branch)}</h3>
                <p>{branch.addressSummary}</p>
                <div className="wl-card-actions">
                  <Link className="wl-text-link" to={`${tenantPath("locations")}?branch=${branch.id}`}>Details</Link>
                  <Link className="wl-button wl-button-outline wl-button-small" to={`${tenantPath("reserve")}?branch=${branch.id}`}>Reserve</Link>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      {featuredItems.length > 0 ? (
        <section className="wl-section">
          <div className="wl-section-heading">
            <div><span className="wl-kicker">From the menu</span><h2>A few of our dishes.</h2></div>
            <p className="wl-caption">Prices and availability may change</p>
          </div>
          <div className="wl-menu-preview">
            {featuredItems.map((item, index) => (
              <article key={`${item.name}-${index}`}><span>0{index + 1}</span><div><h3>{item.name}</h3><p>{item.description}</p></div><strong>{item.price === null ? "" : formatMoney(item.price, menu?.currency || tenant.currency)}</strong></article>
            ))}
          </div>
          <Link className="wl-button wl-button-dark" to={tenantPath("menu")}>View the menu</Link>
        </section>
      ) : null}

      {gallery.length > 0 ? (
        <section className="wl-gallery" aria-label="Restaurant gallery">
          {gallery.map((photo, index) => <img key={photo.id} src={photo.url} alt={photo.caption && photo.caption !== "---" ? photo.caption : `${tenant.name} atmosphere ${index + 1}`} />)}
        </section>
      ) : null}

      <section className="wl-reserve-banner">
        <span className="wl-kicker wl-kicker-light">Your table is waiting</span>
        <h2>Make tonight one to remember.</h2>
        <p>Live availability, your choice of location, and a table selected by you.</p>
        <Link className="wl-button wl-button-light" to={tenantPath("reserve")}>Find a table</Link>
      </section>
    </>
  );
}
