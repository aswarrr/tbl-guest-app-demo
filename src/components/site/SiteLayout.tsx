import { useState, type CSSProperties } from "react";
import { Link, NavLink, Outlet } from "react-router-dom";
import useAuth from "../../hooks/useAuth";
import useTenant from "../../hooks/useTenant";
import TenantLoader from "./TenantLoader";

const navItems = [
  { to: "/", label: "Home", end: true },
  { to: "/menu", label: "Menu" },
  { to: "/about", label: "About" },
  { to: "/locations", label: "Locations" },
  { to: "/policies", label: "Policies" },
];

export default function SiteLayout() {
  const { tenant, loading, error, refresh } = useTenant();
  const { isAuthenticated, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  if (loading) {
    return (
      <main className="wl-state-page">
        <TenantLoader tenant={tenant} text="Preparing your table…" />
      </main>
    );
  }

  if (!tenant || error) {
    return (
      <main className="wl-state-page">
        <span className="wl-kicker">Restaurant unavailable</span>
        <h1>We couldn’t open this restaurant website.</h1>
        <p>{error || "The restaurant name in this address is not configured."}</p>
        <button className="wl-button" type="button" onClick={() => void refresh()}>
          Try again
        </button>
      </main>
    );
  }

  const themeStyle = {
    "--wl-accent": tenant.theme.accent,
    "--wl-accent-dark": tenant.theme.accentDark,
    "--wl-ink": tenant.theme.ink,
    "--wl-paper": tenant.theme.paper,
  } as CSSProperties;

  return (
    <div className="wl-site" style={themeStyle}>
      <a className="wl-skip-link" href="#main-content">Skip to content</a>
      <header className="wl-header">
        <Link className="wl-wordmark" to="/" aria-label={`${tenant.displayName} home`}>
          <span className="wl-wordmark-main">{tenant.shortName}</span>
          <span className="wl-wordmark-sub">Steak House &amp; Co.</span>
        </Link>

        <button
          className="wl-menu-button"
          type="button"
          aria-expanded={menuOpen}
          aria-controls="restaurant-navigation"
          onClick={() => setMenuOpen((open) => !open)}
        >
          <span />
          <span />
          <span />
          <span className="sr-only">Menu</span>
        </button>

        <nav id="restaurant-navigation" className={`wl-nav ${menuOpen ? "is-open" : ""}`} aria-label="Primary">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              onClick={() => setMenuOpen(false)}
              className={({ isActive }) => (isActive ? "is-active" : undefined)}
            >
              {item.label}
            </NavLink>
          ))}
          {isAuthenticated ? (
            <button className="wl-nav-account" type="button" onClick={() => { setMenuOpen(false); logout(); }}>Sign out</button>
          ) : null}
          <Link className="wl-button wl-button-small" to="/reserve" onClick={() => setMenuOpen(false)}>Reserve a table</Link>
        </nav>
      </header>

      <main id="main-content"><Outlet /></main>

      <footer className="wl-footer">
        <div>
          <div className="wl-wordmark wl-wordmark-footer">
            <span className="wl-wordmark-main">{tenant.shortName}</span>
            <span className="wl-wordmark-sub">Steak House &amp; Co.</span>
          </div>
          <p>{tenant.tagline}</p>
        </div>
        <div className="wl-footer-links">
          <Link to="/menu">Menu</Link>
          <Link to="/locations">Locations</Link>
          <Link to="/policies">Reservation policies</Link>
          <Link to="/reserve">Book a table</Link>
        </div>
        <p className="wl-powered">Reservations powered by <strong>The TBL</strong></p>
      </footer>
    </div>
  );
}
