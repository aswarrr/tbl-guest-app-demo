import { Navigate } from "react-router-dom";
import useTenant from "../../hooks/useTenant";
import useTenantPath from "../../hooks/useTenantPath";
import { formatMoney } from "../../white-label/format";

export default function MenuPage() {
  const { tenant, menu } = useTenant();
  const tenantPath = useTenantPath();
  if (!tenant) return null;

  // No published menu means no menu page: the nav link is hidden too, so this
  // only catches a direct visit.
  if (!menu || menu.sections.length === 0) {
    return <Navigate to={tenantPath()} replace />;
  }

  return (
    <div className="wl-page">
      <header className="wl-page-hero wl-page-hero-menu">
        <span className="wl-kicker">From our kitchen</span>
        <h1>The menu</h1>
      </header>
      <nav className="wl-menu-index" aria-label="Menu sections">
        {menu.sections.map((section) => (
          <a key={section.anchor} href={`#${section.anchor}`}>
            {section.name}
          </a>
        ))}
      </nav>
      <div className="wl-menu-sections">
        {menu.sections.map((section) => (
          <section id={section.anchor} className="wl-menu-section" key={section.anchor}>
            <div>
              {section.eyebrow ? <span className="wl-kicker">{section.eyebrow}</span> : null}
              <h2>{section.name}</h2>
            </div>
            <div className="wl-menu-list">
              {section.items.map((item, index) => (
                <article key={`${section.anchor}-${index}`}>
                  <div>
                    <h3>{item.name}</h3>
                    {item.description ? <p>{item.description}</p> : null}
                    {item.tags.map((tag) => (
                      <span className="wl-tag" key={tag}>{tag}</span>
                    ))}
                    {item.available ? null : <span className="wl-tag">Unavailable</span>}
                  </div>
                  {item.price === null ? null : (
                    <strong>{formatMoney(item.price, menu.currency)}</strong>
                  )}
                </article>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
