import { Link } from "react-router-dom";
import useTenant from "../../hooks/useTenant";
import { branchShortName, formatMoney } from "../../white-label/format";

export default function HomePage() {
  const { tenant, branches } = useTenant();
  if (!tenant || branches.length === 0) return null;

  const primary = branches[0];
  const hero = primary.photos[0]?.url || primary.coverImageUrl || "";
  const gallery = branches.flatMap((branch) => branch.photos).slice(1, 4);
  const featuredItems = tenant.menu.flatMap((section) => section.items).slice(0, 3);

  return (
    <>
      <section className="wl-hero" style={{ backgroundImage: `linear-gradient(90deg, rgba(12,10,8,.76), rgba(12,10,8,.12)), url(${hero})` }}>
        <div className="wl-hero-copy">
          <span className="wl-kicker wl-kicker-light">{tenant.cuisineLabel}</span>
          <h1>Good steak.<br />Great company.</h1>
          <p>{tenant.tagline} Choose your branch, your time, and the table that feels right.</p>
          <div className="wl-actions">
            <Link className="wl-button" to="/reserve">Reserve a table</Link>
            <Link className="wl-text-link wl-text-link-light" to="/menu">Explore the menu <span aria-hidden="true">→</span></Link>
          </div>
        </div>
        <div className="wl-hero-note"><span>Open for reservations</span><strong>{branches.length} Cairo locations</strong></div>
      </section>

      <section className="wl-section wl-intro-grid">
        <div>
          <span className="wl-kicker">Our story</span>
          <h2>A Cairo original, made for memorable tables.</h2>
        </div>
        <div>
          <p className="wl-lead">{primary.about}</p>
          <Link className="wl-text-link" to="/about">Discover our story <span aria-hidden="true">→</span></Link>
        </div>
      </section>

      <section className="wl-section wl-section-paper">
        <div className="wl-section-heading">
          <div><span className="wl-kicker">Find your Sizzler</span><h2>Two locations, one warm welcome.</h2></div>
          <Link className="wl-text-link" to="/locations">View all locations <span aria-hidden="true">→</span></Link>
        </div>
        <div className="wl-location-grid">
          {branches.map((branch) => (
            <article className="wl-location-card" key={branch.id}>
              <img src={branch.coverImageUrl || branch.photos[0]?.url} alt={`${branch.name} dining room`} />
              <div className="wl-location-card-copy">
                <div className="wl-card-meta"><span className={branch.isOpen ? "is-open" : ""}>{branch.isOpen ? "Open now" : "Currently closed"}</span><span>{branch.cuisineName || tenant.cuisineLabel}</span></div>
                <h3>{branchShortName(branch)}</h3>
                <p>{branch.addressSummary}</p>
                <div className="wl-card-actions">
                  <Link className="wl-text-link" to={`/locations?branch=${branch.id}`}>Details</Link>
                  <Link className="wl-button wl-button-outline wl-button-small" to={`/reserve?branch=${branch.id}`}>Reserve</Link>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="wl-section">
        <div className="wl-section-heading">
          <div><span className="wl-kicker">A taste of Sizzler</span><h2>Built around the grill.</h2></div>
          <p className="wl-caption">Sample menu · Prices and availability may change</p>
        </div>
        <div className="wl-menu-preview">
          {featuredItems.map((item, index) => (
            <article key={item.name}><span>0{index + 1}</span><div><h3>{item.name}</h3><p>{item.description}</p></div><strong>{formatMoney(item.price, tenant.currency)}</strong></article>
          ))}
        </div>
        <Link className="wl-button wl-button-dark" to="/menu">View sample menu</Link>
      </section>

      {gallery.length > 0 ? (
        <section className="wl-gallery" aria-label="Restaurant gallery">
          {gallery.map((photo, index) => <img key={photo.id} src={photo.url} alt={photo.caption && photo.caption !== "---" ? photo.caption : `Sizzler atmosphere ${index + 1}`} />)}
        </section>
      ) : null}

      <section className="wl-reserve-banner">
        <span className="wl-kicker wl-kicker-light">Your table is waiting</span>
        <h2>Make tonight one to remember.</h2>
        <p>Live availability, your choice of branch, and a table selected by you.</p>
        <Link className="wl-button wl-button-light" to="/reserve">Find a table</Link>
      </section>
    </>
  );
}
