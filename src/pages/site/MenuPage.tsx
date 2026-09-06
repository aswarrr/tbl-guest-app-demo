import useTenant from "../../hooks/useTenant";
import { formatMoney } from "../../white-label/format";

export default function MenuPage() {
  const { tenant } = useTenant();
  if (!tenant) return null;

  return (
    <div className="wl-page">
      <header className="wl-page-hero wl-page-hero-menu">
        <span className="wl-kicker">From our kitchen</span>
        <h1>The menu</h1>
        <p>Steakhouse favourites and generous plates, designed for sharing a table.</p>
        <div className="wl-sample-notice"><strong>Sample menu</strong> — menu service is not yet available through The TBL API. Items and prices below are illustrative.</div>
      </header>
      <nav className="wl-menu-index" aria-label="Menu sections">
        {tenant.menu.map((section) => <a key={section.name} href={`#${section.name.toLowerCase().replace(/[^a-z]+/g, "-")}`}>{section.name}</a>)}
      </nav>
      <div className="wl-menu-sections">
        {tenant.menu.map((section) => (
          <section id={section.name.toLowerCase().replace(/[^a-z]+/g, "-")} className="wl-menu-section" key={section.name}>
            <div><span className="wl-kicker">{section.eyebrow}</span><h2>{section.name}</h2></div>
            <div className="wl-menu-list">
              {section.items.map((item) => (
                <article key={item.name}>
                  <div><h3>{item.name}</h3><p>{item.description}</p>{item.tags?.map((tag) => <span className="wl-tag" key={tag}>{tag}</span>)}</div>
                  <strong>{formatMoney(item.price, tenant.currency)}</strong>
                </article>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
