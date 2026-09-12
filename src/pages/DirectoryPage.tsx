import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { customerService } from "../white-label/customer.service";
import type { TenantSummary } from "../white-label/types";
import Loader from "../components/Loader";

/**
 * The host root. Restaurants are addressed at /restaurant-name, so the bare
 * domain lists the ones that have a published site rather than guessing one.
 */
export default function DirectoryPage() {
  const [tenants, setTenants] = useState<TenantSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    customerService
      .listTenants()
      .then((rows) => {
        if (!cancelled) setTenants(rows);
      })
      .catch((nextError: unknown) => {
        if (cancelled) return;
        setError(
          nextError instanceof Error
            ? nextError.message
            : "Unable to load restaurants right now.",
        );
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <main className="wl-state-page">
        <Loader text="Loading restaurants…" />
      </main>
    );
  }

  if (error) {
    return (
      <main className="wl-state-page">
        <span className="wl-kicker">Something went wrong</span>
        <h1>We couldn’t load restaurants.</h1>
        <p>{error}</p>
      </main>
    );
  }

  if (tenants.length === 0) {
    return (
      <main className="wl-state-page">
        <span className="wl-kicker">The TBL</span>
        <h1>No restaurants are published yet.</h1>
        <p>Once a restaurant publishes its site, it will appear here.</p>
      </main>
    );
  }

  return (
    <main className="wl-directory">
      <header className="wl-directory-head">
        <span className="wl-kicker">The TBL</span>
        <h1>Book a table.</h1>
        <p>Choose a restaurant to see its locations, menu and availability.</p>
      </header>

      <div className="wl-directory-grid">
        {tenants.map((tenant) => (
          <Link key={tenant.id} className="wl-directory-card" to={`/${tenant.slug}`}>
            {tenant.logoUrl ? (
              <img src={tenant.logoUrl} alt="" className="wl-directory-logo" />
            ) : (
              <span className="wl-directory-logo wl-directory-logo-empty" aria-hidden="true">
                {tenant.name.slice(0, 1)}
              </span>
            )}
            <span className="wl-directory-name">{tenant.name}</span>
            {tenant.cuisineName ? (
              <span className="wl-directory-cuisine">{tenant.cuisineName}</span>
            ) : null}
          </Link>
        ))}
      </div>
    </main>
  );
}
