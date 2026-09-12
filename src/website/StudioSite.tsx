import { useMedia } from "./media";
import { useState, type CSSProperties, type ReactNode } from "react";
import { Link, useSearchParams } from "react-router-dom";
import useTenant from "../hooks/useTenant";
import { usePresentation } from "./presentation";
import {
  safeUrl,
  typographyStacks,
  type WebsiteConfigV1,
  type RestaurantBranchDetail,
} from "./contract";
import {
  ReservationFrame,
  ReservationLocations,
} from "./reservation-presentation";
import "./website.css";

export function Selectable({
  id,
  children,
  className = "",
  style,
  as: Tag = "section",
}: {
  as?: "section" | "header" | "footer";
  id: string;
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
}) {
  const p = usePresentation();
  return (
    <Tag
      data-website-section={id}
      className={`${className} ${p.preview ? "ws-selectable" : ""} ${p.preview && p.selection === id ? "ws-selected" : ""}`}
      style={style}
      tabIndex={p.preview ? 0 : undefined}
      aria-label={p.preview ? `Select ${id}` : undefined}
      onKeyDown={
        p.preview
          ? (e) => {
              if (
                e.target === e.currentTarget &&
                (e.key === "Enter" || e.key === " ")
              ) {
                e.preventDefault();
                p.select(id);
              }
            }
          : undefined
      }
      onClickCapture={
        p.preview
          ? (e) => {
              if ((e.target as HTMLElement).closest("[data-preview-control]"))
                return;
              e.preventDefault();
              e.stopPropagation();
              p.select(id);
            }
          : undefined
      }
    >
      {children}
    </Tag>
  );
}
function Photo({ src, style }: { src?: string | null; style?: CSSProperties }) {
  const [failed, setFailed] = useState("");
  return src && safeUrl(src) && failed !== src ? (
    <img src={src} alt="" style={style} onError={() => setFailed(src)} />
  ) : (
    <div
      className="ws-photo-placeholder"
      role="img"
      aria-label="Restaurant image unavailable"
      style={style}
    />
  );
}
function Copy({
  value,
}: {
  value: { eyebrow?: string; heading: string; description?: string };
}) {
  return (
    <>
      <span className="wl-kicker">{value.eyebrow}</span>
      <h1>{value.heading}</h1>
      <p>{value.description}</p>
    </>
  );
}
function Action({ value }: { value: { label: string; destination: string } }) {
  const { tenantSlug } = useTenant();
  return (
    <Link
      className="wl-button"
      to={`/${encodeURIComponent(tenantSlug)}${value.destination === "home" ? "" : "/" + value.destination}`}
    >
      {value.label}
    </Link>
  );
}
function Branch({
  branch,
  display,
  ratio = "landscape",
}: {
  branch: RestaurantBranchDetail;
  display: WebsiteConfigV1["pages"]["locations"]["display"];
  ratio?: string;
}) {
  const { tenantSlug } = useTenant();
  return (
    <article className="ws-branch">
      <Photo
        src={branch.coverImageUrl}
        style={{
          aspectRatio:
            ratio === "square" ? "1" : ratio === "portrait" ? "3/4" : "16/10",
        }}
      />
      <h2>{branch.name}</h2>
      <p>{branch.about}</p>
      {display.address && <p>{branch.addressSummary}</p>}
      {display.phone && <p>{branch.phone}</p>}
      {display.email && <p>{branch.email}</p>}
      {display.cuisine && <p>{branch.cuisineName}</p>}
      {display.openStatus && (
        <p>{branch.isOpen ? "Open now" : "Opening hours below"}</p>
      )}
      {display.hours && (
        <ul>
          {branch.hours.map((h) => (
            <li key={h.dayOfWeek}>
              {h.dayLabel}: {h.summary}
            </li>
          ))}
        </ul>
      )}
      {display.amenities && (
        <p>{branch.amenities.map((a) => a.name).join(" · ")}</p>
      )}
      {display.policies && (
        <p>
          Deposit: {branch.policies.depositAmount}{" "}
          {branch.policies.depositCurrency}. Grace period:{" "}
          {branch.policies.gracePeriodMinutes ?? "—"} minutes.
        </p>
      )}
      <Link
        className="wl-button"
        to={`/${encodeURIComponent(tenantSlug)}/reserve?branch=${encodeURIComponent(branch.id)}`}
      >
        Reserve a table
      </Link>
    </article>
  );
}
function MenuPreview() {
  const { menu } = useTenant();
  if (!menu) return null;
  return (
    <Selectable id="menu" className="ws-section">
      <h2>From our menu</h2>
      <div className="ws-grid">
        {menu.sections
          .flatMap((s) => s.items)
          .filter((i) => i.available)
          .slice(0, 3)
          .map((i, n) => (
            <article key={n}>
              <Photo src={i.imageUrl} />
              <h3>{i.name}</h3>
              <p>{i.description}</p>
              <p>
                {i.price} {menu.currency}
              </p>
            </article>
          ))}
      </div>
    </Selectable>
  );
}
function Home() {
  const { config: c } = usePresentation();
  const { branches, tenant } = useTenant();
  const media = useMedia();
  if (!c) return null;
  const h = c.pages.home;
  return (
    <>
      {c.homeOrder.map((id) => {
        const s = h[id];
        const section = !s.visible ? null : id === "hero" ? (
          <Selectable
            id="home.hero"
            className={`ws-hero ws-hero-${h.hero.variant}`}
            style={{ textAlign: h.hero.alignment }}
          >
            <Photo
              src={media(h.hero.image)}
              style={{ objectPosition: `${h.hero.focalX}% ${h.hero.focalY}%` }}
            />
            <div
              className="ws-hero-copy"
              style={{ background: `rgb(0 0 0 / ${h.hero.overlay}%)` }}
            >
              <Copy value={h.hero} />
              <div className="ws-actions">
                <Action value={h.hero.primary} />
                <Action value={h.hero.secondary} />
              </div>
            </div>
          </Selectable>
        ) : id === "story" ? (
          <Selectable
            id="home.story"
            className={`ws-section ws-story ws-story-${h.story.variant}`}
          >
            <div>
              <Copy value={h.story} />
              <p>{h.story.body || tenant?.about}</p>
            </div>
            {h.story.variant !== "text" && <Photo src={media(h.story.image)} />}
          </Selectable>
        ) : id === "locations" ? (
          <Selectable
            id="home.locations"
            className={`ws-section ws-locations-${h.locations.variant}`}
          >
            <Copy value={h.locations} />
            <div className="ws-grid">
              {branches.map((b) => (
                <Branch
                  key={b.id}
                  branch={b}
                  display={h.locations.display}
                  ratio={h.locations.imageRatio}
                />
              ))}
            </div>
            {!branches.length && <p>No locations added yet.</p>}
          </Selectable>
        ) : id === "gallery" ? (
          <Selectable id="home.gallery" className="ws-section">
            <Copy value={h.gallery} />
            <div className={`ws-gallery ws-gallery-${h.gallery.variant}`}>
              {h.gallery.images.map((r, i) => (
                <Photo key={i} src={media(r)} />
              ))}
            </div>
          </Selectable>
        ) : (
          <Selectable
            id="home.cta"
            className={`ws-section ws-cta ws-background-${h.cta.background}`}
            style={
              h.cta.background === "image"
                ? {
                    backgroundImage: media(h.cta.image)
                      ? `linear-gradient(#0006,#0006),url("${media(h.cta.image)}")`
                      : undefined,
                  }
                : undefined
            }
          >
            <Copy value={h.cta} />
            <Action value={h.cta.action} />
          </Selectable>
        );
        return (
          <div key={id}>
            {section}
            {id === "locations" && <MenuPreview />}
          </div>
        );
      })}
    </>
  );
}
function Content({ page }: { page: string }) {
  const [query] = useSearchParams();
  const { config: c, branchId } = usePresentation();
  const { tenant, branches, menu } = useTenant();
  const media = useMedia();
  const [chosen, setChosen] = useState("");
  if (!c) return null;
  const selected =
    branches.find(
      (b) =>
        b.id ===
        (branchId ||
          chosen ||
          query.get("branch") ||
          c.pages.locations.defaultBranchId),
    ) || branches[0];
  if (page === "home") return <Home />;
  if (page === "about") {
    const a = c.pages.about;
    return (
      <Selectable id="about" className="ws-section">
        <Copy value={a} />
        <div className="ws-story">
          <div>
            <h2>{a.storyTitle}</h2>
            <p>{a.storyBody ?? tenant?.about}</p>
          </div>
          <Photo src={media(a.image)} />
        </div>
        <div className="ws-grid">
          {a.values.map((v, i) => (
            <article key={i}>
              <h3>{v.title}</h3>
              <p>{v.description}</p>
            </article>
          ))}
        </div>
      </Selectable>
    );
  }
  if (page === "locations" || page === "policies")
    return (
      <Selectable id={page} className="ws-section">
        {page === "locations" ? (
          <Copy value={c.pages.locations} />
        ) : (
          <>
            <h1>{c.pages.policies.heading}</h1>
            <p>{c.pages.policies.introduction}</p>
          </>
        )}
        <label>
          Location{" "}
          <select
            value={selected?.id || ""}
            onChange={(e) => setChosen(e.target.value)}
          >
            {branches.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>
        </label>
        {!selected ? (
          <p>No locations added yet.</p>
        ) : page === "locations" ? (
          <Branch branch={selected} display={c.pages.locations.display} />
        ) : (
          <div className="ws-grid">
            {c.pages.policies.deposit && (
              <article>
                <h2>Deposit</h2>
                <p>
                  {selected.policies.depositAmount}{" "}
                  {selected.policies.depositCurrency}
                </p>
              </article>
            )}
            {c.pages.policies.cancellation && (
              <article>
                <h2>Cancellation</h2>
                <p>
                  Free cancellation:{" "}
                  {selected.policies.freeCancelWindowHours ?? "—"} hours before
                  booking.
                </p>
              </article>
            )}
            {c.pages.policies.gracePeriod && (
              <article>
                <h2>Grace period</h2>
                <p>{selected.policies.gracePeriodMinutes ?? "—"} minutes.</p>
              </article>
            )}
            {c.pages.policies.bookingWindow && (
              <article>
                <h2>Booking window</h2>
                <p>
                  {selected.policies.bookingCutoffHours ?? "—"} hours before
                  booking.
                </p>
              </article>
            )}
          </div>
        )}
      </Selectable>
    );
  if (page === "reserve")
    return (
      <Selectable id="reserve">
        <ReservationFrame
          step={1}
          summary={
            selected ? (
              <>
                <Photo src={selected.coverImageUrl} />
                <h2>{selected.name}</h2>
                <p>{selected.addressSummary}</p>
                <p>Choose a date, time and table.</p>
              </>
            ) : (
              <p>No locations added yet.</p>
            )
          }
        >
          <fieldset disabled>
            <ReservationLocations
              branches={branches}
              branchId={selected?.id || ""}
              chooseBranch={() => {}}
            />
            <div className="wl-booking-actions">
              <button className="wl-button" disabled>
                Continue
              </button>
            </div>
          </fieldset>
          <p>Design preview — booking controls are locked.</p>
        </ReservationFrame>
      </Selectable>
    );
  return (
    <Selectable id="menu" className="ws-section">
      <h1>Menu</h1>
      {!menu ? (
        <p>No menu is published yet.</p>
      ) : (
        menu.sections.map((s, i) => (
          <section key={i}>
            <span>{s.eyebrow}</span>
            <h2>{s.name}</h2>
            <div className="ws-grid">
              {s.items.map((item, n) => (
                <article key={n}>
                  <Photo src={item.imageUrl} />
                  <h3>{item.name}</h3>
                  <p>{item.description}</p>
                  <p>
                    {item.price} {menu.currency}
                  </p>
                  <p>{item.tags.join(" · ")}</p>
                  {!item.available && <p>Unavailable</p>}
                </article>
              ))}
            </div>
          </section>
        ))
      )}
    </Selectable>
  );
}
export function StudioSite({
  page,
  children,
}: {
  page: string;
  children?: ReactNode;
}) {
  const p = usePresentation();
  const { tenant, tenantSlug, menu } = useTenant();
  const media = useMedia();
  const [open, setOpen] = useState(false);
  const c = p.config;
  if (!c || !tenant) return null;
  const t = c.theme;
  const fonts = typographyStacks[t.typography];
  const path = (id: string) =>
    `/${encodeURIComponent(tenantSlug)}${id === "home" ? "" : "/" + id}`;
  const style = {
    "--wl-accent": t.primaryColor,
    "--wl-accent-dark": t.accentDark,
    "--wl-ink": t.textColor,
    "--wl-paper": t.backgroundColor,
    "--ws-heading": fonts.heading,
    "--ws-body": fonts.body,
    "--ws-weight": fonts.weight,
    "--ws-heading-scale": t.headingScale,
    "--ws-space":
      t.spacing === "compact"
        ? "40px"
        : t.spacing === "generous"
          ? "100px"
          : "70px",
    "--ws-radius":
      t.buttonShape === "pill"
        ? "999px"
        : t.buttonShape === "rounded"
          ? "10px"
          : "0",
    "--ws-button-pad":
      t.buttonSize === "compact"
        ? "9px 16px"
        : t.buttonSize === "large"
          ? "19px 32px"
          : "14px 24px",
  } as CSSProperties;
  return (
    <div className={`wl-site ws-site ws-buttons-${t.buttonFill}`} style={style}>
      <Selectable
        id="header" as="header"
        className={`wl-header ws-header-${c.header.variant}`}
        style={{ position: c.header.sticky ? "sticky" : "relative" }}
      >
        <Link className="wl-wordmark" to={path("home")}>
          {c.brand.logoDisplay !== "name-only" && (
            <Photo
              src={media(c.brand.logo)}
              style={{ width: c.brand.logoSize, height: c.brand.logoSize }}
            />
          )}
          {c.brand.logoDisplay !== "logo-only" && (
            <span>
              {c.brand.shortName || tenant.name}
              <small>{c.brand.tagline}</small>
            </span>
          )}
        </Link>
        <button
          className="wl-menu-button"
          data-preview-control
          type="button"
          aria-label="Toggle navigation"
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
        >
          <span />
          <span />
          <span />
        </button>
        <nav className={`wl-nav ${open ? "is-open" : ""}`}>
          {Object.entries(c.header.navigation)
            .filter(
              ([id, n]) =>
                n.visible && id !== "reserve" && (id !== "menu" || menu),
            )
            .map(([id, n]) => (
              <Link key={id} to={path(id)} onClick={() => setOpen(false)}>
                {n.label}
              </Link>
            ))}
          <Link className="wl-button" to={path("reserve")}>
            {c.header.reservationLabel}
          </Link>
        </nav>
      </Selectable>
      <main id="main-content">{children || <Content page={page} />}</main>
      <Selectable id="footer" as="footer" className="wl-footer">
        <div>
          {c.footer.showLogo && (
            <Photo
              src={media(c.brand.logo)}
              style={{ width: c.brand.logoSize, height: c.brand.logoSize }}
            />
          )}
          <h2>{c.brand.shortName || tenant.name}</h2>
          {c.footer.showDescription && (
            <p>{c.footer.description || tenant.about}</p>
          )}
        </div>
        <div className="wl-footer-links">
          {c.footer.locationsLink && (
            <Link to={path("locations")}>Locations</Link>
          )}
          {c.footer.menuLink && menu && <Link to={path("menu")}>Menu</Link>}
          {c.footer.policiesLink && <Link to={path("policies")}>Policies</Link>}
          <Link to={path("reserve")}>Reserve a table</Link>
          {(["instagram", "facebook", "tiktok"] as const).map((id) =>
            c.footer[id] && safeUrl(c.footer[id]) ? (
              <a key={id} href={c.footer[id]} rel="noreferrer">
                {id}
              </a>
            ) : null,
          )}
        </div>
        {c.footer.attribution && <p>Powered by The TBL</p>}
      </Selectable>
    </div>
  );
}
