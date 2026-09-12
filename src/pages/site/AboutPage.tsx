import { Link } from "react-router-dom";
import useTenant from "../../hooks/useTenant";
import useTenantPath from "../../hooks/useTenantPath";

export default function AboutPage() {
  const { tenant, branches } = useTenant();
  const tenantPath = useTenantPath();
  if (!tenant || branches.length === 0) return null;
  const primary = branches[0];
  const photos = branches.flatMap((branch) => branch.photos);
  const story = tenant.about || primary.about;

  return (
    <div className="wl-page">
      <header className="wl-page-hero">
        {primary.cuisineName ? <span className="wl-kicker">{primary.cuisineName}</span> : null}
        <h1>About {tenant.name}.</h1>
      </header>
      <section className="wl-about-story">
        <div className="wl-about-image">
          <img src={photos[1]?.url || primary.coverImageUrl || ""} alt={`Inside ${tenant.name}`} />
        </div>
        <div>
          <span className="wl-kicker">Our story</span>
          <h2>A place at the heart of the table.</h2>
          {story ? <p className="wl-lead">{story}</p> : null}
          <Link className="wl-button wl-button-dark" to={tenantPath("reserve")}>
            Reserve your table
          </Link>
        </div>
      </section>
    </div>
  );
}
