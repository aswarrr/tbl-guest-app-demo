import { usePresentation } from "../../website/presentation";
import { StudioSite } from "../../website/StudioSite";
import { useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import { Link, NavLink, Outlet } from "react-router-dom";
import useAuth from "../../hooks/useAuth";
import useTenant from "../../hooks/useTenant";
import useTenantPath from "../../hooks/useTenantPath";
import TenantLoader from "./TenantLoader";

export default function SiteLayout() {
  const presentation = usePresentation();
  const location = useLocation();
  const page = location.pathname.split("/")[2] || "home";
  const { tenant, menu, loading, error, notFound, refresh } = useTenant();
  const { isAuthenticated, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const tenantPath = useTenantPath();

  // The tab should name the restaurant a guest is actually looking at.
  useEffect(() => {
    if (!tenant) return;
    const previous = document.title;
    document.title = `${tenant.name} | Reservations`;
    return () => {
      document.title = previous;
    };
  }, [tenant]);

  if (loading) {
    return (
      <main className="wl-state-page">
        <TenantLoader tenant={tenant} text="Preparing your table…" />
      </main>
    );
  }

  // An address that names no restaurant is a different problem from a service
  // that would not answer, so it gets its own wording and no retry button.
  if (notFound || !tenant) {
    return (
      <main className="wl-state-page">
        <span className="wl-kicker">Restaurant not found</span>
        <h1>We couldn’t find that restaurant.</h1>
        <p>Check the address, or browse the restaurants we host.</p>
        <Link className="wl-button" to="/">
          Browse restaurants
        </Link>
      </main>
    );
  }

  if (error && tenant === null) {
    return (
      <main className="wl-state-page">
        <span className="wl-kicker">Restaurant unavailable</span>
        <h1>We couldn’t open this restaurant website.</h1>
        <p>{error}</p>
        <button
          className="wl-button"
          type="button"
          onClick={() => void refresh()}
        >
          Try again
        </button>
      </main>
    );
  }

  if (presentation.config)
    return (
      <StudioSite page={page}>
        {["home", "about", "locations", "policies", "menu"].includes(
          page,
        ) ? undefined : (
          <Outlet />
        )}
      </StudioSite>
    );

  // The menu link only exists when the restaurant has published one.
  const navItems = [
    { to: tenantPath(), label: "Home", end: true },
    ...(menu ? [{ to: tenantPath("menu"), label: "Menu", end: false }] : []),
    { to: tenantPath("about"), label: "About", end: false },
    { to: tenantPath("locations"), label: "Locations", end: false },
    { to: tenantPath("policies"), label: "Policies", end: false },
  ];

  return (
    <div className="wl-site">
      <a className="wl-skip-link" href="#main-content">
        Skip to content
      </a>
      <header className="wl-header">
        <Link
          className="wl-wordmark"
          to={tenantPath()}
          aria-label={`${tenant.name} home`}
        >
          {tenant.logoUrl ? (
            <img className="wl-wordmark-logo" src={tenant.logoUrl} alt="" />
          ) : null}
          <span className="wl-wordmark-main">{tenant.name}</span>
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

        <nav
          id="restaurant-navigation"
          className={`wl-nav ${menuOpen ? "is-open" : ""}`}
          aria-label="Primary"
        >
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
            <button
              className="wl-nav-account"
              type="button"
              onClick={() => {
                setMenuOpen(false);
                logout();
              }}
            >
              Sign out
            </button>
          ) : null}
          <Link
            className="wl-button wl-button-small"
            to={tenantPath("reserve")}
            onClick={() => setMenuOpen(false)}
          >
            Reserve a table
          </Link>
        </nav>
      </header>

      <main id="main-content">
        <Outlet />
      </main>

      <footer className="wl-footer">
        <div>
          <div className="wl-wordmark wl-wordmark-footer">
            <span className="wl-wordmark-main">{tenant.name}</span>
          </div>
          {tenant.about ? <p>{tenant.about}</p> : null}
        </div>
        <div className="wl-footer-links">
          {menu ? <Link to={tenantPath("menu")}>Menu</Link> : null}
          <Link to={tenantPath("locations")}>Locations</Link>
          <Link to={tenantPath("policies")}>Reservation policies</Link>
          <Link to={tenantPath("reserve")}>Book a table</Link>
        </div>
        <p className="wl-powered">
          Reservations powered by <strong>The TBL</strong>
        </p>
      </footer>
    </div>
  );
}
