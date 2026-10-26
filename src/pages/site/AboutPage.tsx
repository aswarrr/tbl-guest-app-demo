import { Link } from "react-router-dom";
import useTenant from "../../hooks/useTenant";
import useTenantPath from "../../hooks/useTenantPath";

export default function AboutPage() {
  const { tenant, branches } = useTenant();
  const tenantPath = useTenantPath();
  if (!tenant || branches.length === 0) return null;
  const primary = branches[0];
  const photos = branches.flatMap((branch) => branch.photos);
  const hero = primary.coverImageUrl || photos[0]?.url;
  const storyImage = photos.find((photo) => photo.url !== hero)?.url;
  const story = tenant.about || primary.about;

  return (
    <div className="wl-about-page">
      <header className="wl-about-hero">
        {hero ? <img src={hero} alt="" /> : null}
        <div className="wl-about-hero-copy">
          <span className="wl-kicker wl-kicker-light">The story of {tenant.name}</span>
          <h1>Made for moments together.</h1>
          <p>Step inside {tenant.name}, where every visit begins with a place at the table.</p>
        </div>
        <span className="wl-about-hero-index">01 / About us</span>
      </header>

      <section className="wl-about-intro">
        <div className="wl-about-intro-heading">
          <span className="wl-kicker">Our story</span>
          <h2>A place at the heart of the table.</h2>
        </div>
        <div className="wl-about-intro-copy">
          {story ? <p>{story}</p> : <p>Good food, good company, and a reason to stay a little longer.</p>}
          <Link className="wl-text-link" to={tenantPath("locations")}>Explore our locations <span aria-hidden="true">→</span></Link>
        </div>
      </section>

      <section className={`wl-about-moment${storyImage ? "" : " wl-about-moment-no-image"}`}>
        {storyImage ? <img src={storyImage} alt={`${tenant.name} restaurant atmosphere`} loading="lazy" /> : null}
        <div className="wl-about-moment-copy">
          <span className="wl-kicker wl-kicker-light">Come as you are</span>
          <h2>There is always room for one more story.</h2>
          <p>Find the setting that feels right, and make the moment yours.</p>
        </div>
      </section>

      <section className="wl-about-invite">
        <span className="wl-kicker">Your table is waiting</span>
        <h2>We would love to see you.</h2>
        <p>Choose your location and settle in.</p>
        <div className="wl-about-invite-actions">
          <Link className="wl-button wl-button-dark" to={tenantPath("reserve")}>Reserve a table</Link>
          <Link className="wl-text-link" to={tenantPath("locations")}>Our locations <span aria-hidden="true">→</span></Link>
        </div>
      </section>
    </div>
  );
}
